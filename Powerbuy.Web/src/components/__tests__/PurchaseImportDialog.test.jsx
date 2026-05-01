import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PurchaseImportDialog from '../PurchaseImportDialog';

vi.mock('../../services/purchasesApi', () => ({
  createPurchase: vi.fn().mockResolvedValue({}),
}));

import { createPurchase } from '../../services/purchasesApi';

const DEALS = [
  {
    upc: '111111111111',
    model: 'WATCH-BLK',
    item: 'Apple Watch Black',
    sellPricePerUnit: 100,
    totalAmazon: 90,
    expires: '2026-12-31',
    qty: 3,
  },
  {
    upc: '222222222222',
    model: 'WATCH-ROSE',
    item: 'Apple Watch Rose',
    sellPricePerUnit: 100,
    totalAmazon: 90,
    expires: '2026-12-31',
    qty: 1,
  },
];

function renderDialog(deals = DEALS, overrides = {}) {
  const props = {
    deals,
    token: 'test-token',
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...render(<PurchaseImportDialog {...props} />), props };
}

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('PurchaseImportDialog rendering', () => {
  it('shows the correct deal count in the heading', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: /import 2 deals/i })).toBeInTheDocument();
  });

  it('shows singular "deal" for one item', () => {
    renderDialog([DEALS[0]]);
    expect(screen.getByRole('heading', { name: /import 1 deal\b/i })).toBeInTheDocument();
  });

  it('renders a row for each deal', () => {
    renderDialog();
    expect(screen.getByText('Apple Watch Black')).toBeInTheDocument();
    expect(screen.getByText('Apple Watch Rose')).toBeInTheDocument();
  });

  it('renders UPCs in each row', () => {
    renderDialog();
    expect(screen.getByText('111111111111')).toBeInTheDocument();
    expect(screen.getByText('222222222222')).toBeInTheDocument();
  });

  it('renders model numbers', () => {
    renderDialog();
    expect(screen.getByText('WATCH-BLK')).toBeInTheDocument();
    expect(screen.getByText('WATCH-ROSE')).toBeInTheDocument();
  });

  it('renders sell totals correctly', () => {
    renderDialog();
    // deal 0: 100 * 3 = $300.00, deal 1: 100 * 1 = $100.00
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('renders amazon totals', () => {
    renderDialog();
    // both have totalAmazon: 90
    const amazonCells = screen.getAllByText('$90.00');
    expect(amazonCells).toHaveLength(2);
  });

  it('shows Cancel and Import buttons', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import 2 deals/i })).toBeInTheDocument();
  });
});

// ─── Profit calculation ──────────────────────────────────────────────────────

describe('profit calculation', () => {
  it('defaults to 5% cashback rate', () => {
    renderDialog([DEALS[0]]);
    // sell=300, amazon=90, profit = 300-90+90*0.05 = 214.50
    expect(screen.getByText('$214.50')).toBeInTheDocument();
  });

  it('updates profit when rate changes to 6%', async () => {
    renderDialog([DEALS[0]]);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, '6');
    // profit = 300-90+90*0.06 = 215.40
    expect(screen.getByText('$215.40')).toBeInTheDocument();
  });

  it('updates profit when rate changes to 7%', async () => {
    renderDialog([DEALS[0]]);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, '7');
    // profit = 300-90+90*0.07 = 216.30
    expect(screen.getByText('$216.30')).toBeInTheDocument();
  });

  it('shows negative profit in red', () => {
    const losingDeal = [{ ...DEALS[0], sellPricePerUnit: 10, totalAmazon: 200, qty: 1 }];
    renderDialog(losingDeal);
    // sell=10, profit=10-200+10 = -180
    const profitCell = screen.getByText((_, el) =>
      el?.tagName === 'TD' && el.textContent.replace(/\s/g, '').includes('$-')
    );
    expect(profitCell).toHaveStyle({ color: 'rgb(220, 38, 38)' });
  });
});

// ─── Import action ───────────────────────────────────────────────────────────

describe('import action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPurchase.mockResolvedValue({});
  });

  it('calls createPurchase once per deal', async () => {
    const { props } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /import 2 deals/i }));
    await waitFor(() => expect(createPurchase).toHaveBeenCalledTimes(2));
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });

  it('passes the auth token to createPurchase', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => expect(createPurchase).toHaveBeenCalled());
    expect(createPurchase).toHaveBeenCalledWith(expect.anything(), 'test-token');
  });

  it('sends correct paymentStatus and deliveryStatus', async () => {
    renderDialog([DEALS[0]]);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => expect(createPurchase).toHaveBeenCalled());
    const [payload] = createPurchase.mock.calls[0];
    expect(payload.paymentStatus).toBe('Not Paid');
    expect(payload.deliveryStatus).toBe('Not Delivered');
  });

  it('sends correct cashback fields for selected rate', async () => {
    renderDialog([DEALS[0]]);
    await userEvent.selectOptions(screen.getByRole('combobox'), '6');
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => expect(createPurchase).toHaveBeenCalled());
    const [payload] = createPurchase.mock.calls[0];
    expect(payload.cashback5Percent).toBe(0);
    expect(payload.cashback6Percent).toBeCloseTo(5.4); // 90 * 0.06
    expect(payload.cashback7Percent).toBe(0);
  });

  it('sends correct quantity and sellPrice', async () => {
    renderDialog([DEALS[0]]);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => expect(createPurchase).toHaveBeenCalled());
    const [payload] = createPurchase.mock.calls[0];
    expect(payload.quantity).toBe(3);
    expect(payload.sellPrice).toBe(300);
  });

  it('shows loading state during import', async () => {
    createPurchase.mockImplementation(() => new Promise(() => {})); // never resolves
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    expect(screen.getByRole('button', { name: /importing/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('shows error message when API fails', async () => {
    createPurchase.mockRejectedValue(new Error('Network error'));
    renderDialog([DEALS[0]]);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
    expect(screen.queryByText(/importing/i)).not.toBeInTheDocument();
  });

  it('does not call onConfirm when API fails', async () => {
    createPurchase.mockRejectedValue(new Error('fail'));
    const { props } = renderDialog([DEALS[0]]);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => screen.getByText('fail'));
    expect(props.onConfirm).not.toHaveBeenCalled();
  });
});

// ─── Cancel action ───────────────────────────────────────────────────────────

describe('cancel action', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls onClose when Cancel is clicked', async () => {
    const { props } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(createPurchase).not.toHaveBeenCalled();
  });
});

// ─── URL param decoding (App-level integration) ──────────────────────────────

import { encodeDeals, decodeDeals } from '../../utils/bookmarkletCore';

describe('deal encoding round-trip', () => {
  it('decoding the encoded URL param produces the original deals', () => {
    const encoded = encodeDeals(DEALS);
    expect(decodeDeals(encoded)).toEqual(DEALS);
  });
});
