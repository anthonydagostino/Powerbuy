import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  shouldRecordWatchChange,
  encodeDeals,
  decodeDeals,
  calcProfit,
  buildPurchasePayload,
} from '../bookmarkletCore';

const DEAL = {
  upc: '111111111111',
  model: 'WATCH-BLK',
  item: 'Apple Watch Black',
  sellPricePerUnit: 100,
  totalAmazon: 90,
  expires: '2026-12-31',
  qty: 3,
};

// ─── shouldRecordWatchChange ────────────────────────────────────────────────

describe('shouldRecordWatchChange', () => {
  it('returns false on initial $watch call (newVal === oldVal)', () => {
    expect(shouldRecordWatchChange(0, 0)).toBe(false);
    expect(shouldRecordWatchChange(undefined, undefined)).toBe(false);
    expect(shouldRecordWatchChange(3, 3)).toBe(false);
  });

  it('returns false when COMMIT is clicked (oldVal === undefined, Angular init)', () => {
    expect(shouldRecordWatchChange(3, undefined)).toBe(false);
    expect(shouldRecordWatchChange(0, undefined)).toBe(false);
  });

  it('returns true when user actually changes a value', () => {
    expect(shouldRecordWatchChange(3, 0)).toBe(true);
    expect(shouldRecordWatchChange(5, 3)).toBe(true);
    expect(shouldRecordWatchChange(0, 3)).toBe(true);
  });
});

// ─── encodeDeals / decodeDeals ──────────────────────────────────────────────

describe('encodeDeals / decodeDeals', () => {
  it('round-trips a single deal', () => {
    const deals = [DEAL];
    expect(decodeDeals(encodeDeals(deals))).toEqual(deals);
  });

  it('round-trips multiple deals', () => {
    const deals = [DEAL, { ...DEAL, upc: '222222222222', qty: 1 }];
    expect(decodeDeals(encodeDeals(deals))).toEqual(deals);
  });

  it('handles deals with special characters in item name', () => {
    const deals = [{ ...DEAL, item: 'MacBook Pro 14" M5 — Space Black' }];
    expect(decodeDeals(encodeDeals(deals))).toEqual(deals);
  });
});

// ─── calcProfit ─────────────────────────────────────────────────────────────

describe('calcProfit', () => {
  it('calculates profit at 5% cashback', () => {
    // sell = 100 * 3 = 300, amazon = 90, profit = 300 - 90 + 90*0.05 = 214.5
    expect(calcProfit(DEAL, '5')).toBeCloseTo(214.5);
  });

  it('calculates profit at 6% cashback', () => {
    // profit = 300 - 90 + 90*0.06 = 215.4
    expect(calcProfit(DEAL, '6')).toBeCloseTo(215.4);
  });

  it('calculates profit at 7% cashback', () => {
    // profit = 300 - 90 + 90*0.07 = 216.3
    expect(calcProfit(DEAL, '7')).toBeCloseTo(216.3);
  });

  it('returns negative profit when amazon cost exceeds sell price', () => {
    const losingDeal = { ...DEAL, sellPricePerUnit: 20, totalAmazon: 100 };
    // sell = 60, profit = 60 - 100 + 5 = -35
    expect(calcProfit(losingDeal, '5')).toBeLessThan(0);
  });
});

// ─── buildPurchasePayload ───────────────────────────────────────────────────

describe('buildPurchasePayload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T00:00:00Z'));
  });

  it('sets correct default statuses', () => {
    const payload = buildPurchasePayload(DEAL, '5');
    expect(payload.paymentStatus).toBe('Not Paid');
    expect(payload.deliveryStatus).toBe('Not Delivered');
    expect(payload.cardUsed).toBe('Prime');
    expect(payload.boughtFrom).toBe('Amazon');
    expect(payload.quantityPaid).toBe(0);
    expect(payload.paymentDate).toBeNull();
    expect(payload.trackingNumber).toBeNull();
  });

  it('maps deal fields correctly', () => {
    const payload = buildPurchasePayload(DEAL, '5');
    expect(payload.upc).toBe(DEAL.upc);
    expect(payload.item).toBe(DEAL.item);
    expect(payload.model).toBe(DEAL.model);
    expect(payload.quantity).toBe(DEAL.qty);
    expect(payload.totalAmazon).toBe(DEAL.totalAmazon);
    expect(payload.sellPrice).toBe(300); // 100 * 3
  });

  it('calculates cashback and profit for 5% rate', () => {
    const payload = buildPurchasePayload(DEAL, '5');
    expect(payload.cashback5Percent).toBeCloseTo(4.5); // 90 * 0.05
    expect(payload.cashback6Percent).toBe(0);
    expect(payload.cashback7Percent).toBe(0);
    expect(payload.profit5Percent).toBeCloseTo(214.5);
    expect(payload.profit6Percent).toBe(0);
    expect(payload.profit7Percent).toBe(0);
  });

  it('calculates cashback and profit for 6% rate', () => {
    const payload = buildPurchasePayload(DEAL, '6');
    expect(payload.cashback6Percent).toBeCloseTo(5.4);
    expect(payload.cashback5Percent).toBe(0);
    expect(payload.profit6Percent).toBeCloseTo(215.4);
  });

  it('calculates cashback and profit for 7% rate', () => {
    const payload = buildPurchasePayload(DEAL, '7');
    expect(payload.cashback7Percent).toBeCloseTo(6.3);
    expect(payload.profit7Percent).toBeCloseTo(216.3);
  });

  it('uses deal expires date', () => {
    const payload = buildPurchasePayload(DEAL, '5');
    expect(payload.expires).toBe('2026-12-31T00:00:00Z');
  });

  it('falls back to today when expires is empty', () => {
    const payload = buildPurchasePayload({ ...DEAL, expires: '' }, '5');
    expect(payload.expires).toBe('2026-05-01T00:00:00Z');
  });

  it('sets orderPlaced to today', () => {
    const payload = buildPurchasePayload(DEAL, '5');
    expect(payload.orderPlaced).toBe('2026-05-01T00:00:00Z');
  });
});
