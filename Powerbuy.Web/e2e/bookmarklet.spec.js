import { test, expect } from '@playwright/test';

// ─── Mock page helpers ────────────────────────────────────────────────────────

const APP_URL = 'http://localhost:5173';

const MOCK_DEALS = [
  { id: 'deal-1', upc: '111111111111', model: 'WATCH-BLK', title: 'Apple Watch Black', price: '292.00', retail: '299.00', expires: '2026-12-31' },
  { id: 'deal-2', upc: '222222222222', model: 'WATCH-ROSE', title: 'Apple Watch Rose', price: '292.00', retail: '299.00', expires: '2026-12-31' },
];

/** Set up a minimal mock of the Powerbuy deals page with Angular-like scope. */
async function setupMockPage(page, deals = MOCK_DEALS) {
  const rows = deals.map(d =>
    `<div ng-repeat="itm in arr.t_f_items" data-deal-id="${d.id}" style="padding:8px;border-bottom:1px solid #eee">
       <strong>${d.title}</strong> — UPC: ${d.upc}
     </div>`
  ).join('');

  const html = `<!DOCTYPE html>
    <html>
    <head><title>Mock Powerbuy</title></head>
    <body style="font-family:sans-serif;padding:20px">
      <h1>Powerbuy Deals</h1>
      ${rows}
    </body>
    </html>`;

  // Serve the mock HTML at the real hostname so location.hostname is correct naturally
  await page.route('https://powerbuynetwork.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html })
  );
  await page.goto('https://powerbuynetwork.com/deals');

  // Mock Angular scope and helpers
  await page.evaluate((dealsData) => {
    const scopeMap = {};
    dealsData.forEach(d => {
      const scope = {
        itm: { f_upc: d.upc, f_model: d.model, f_title: d.title, f_expires: d.expires, f_id: d.id },
        arr: { t_f_title: d.title, t_f_price: d.price, t_f_retail: d.retail },
        dealCommit: { [d.id]: { current: 0 } },
        _watches: [],
        $watch(expr, cb) {
          const lastVal = expr.call(this);
          this._watches.push({ expr, cb, lastVal });
        },
      };
      scopeMap[d.id] = scope;
    });

    window.angular = {
      element: (el) => ({
        scope: () => scopeMap[el.dataset.dealId],
      }),
    };

    // Helper exposed to tests: simulate a user typing a new commitment qty
    window.__changeCommitment = (dealId, newQty) => {
      const scope = scopeMap[dealId];
      if (!scope) return;
      const oldVal = scope.dealCommit[dealId].current;
      scope.dealCommit[dealId].current = newQty;
      scope._watches.forEach(w => {
        const val = w.expr.call(scope);
        w.cb(val, oldVal);
        w.lastVal = val;
      });
    };

    // Capture window.open calls so we can inspect the URL
    window.__openedUrls = [];
    window.open = (url) => { window.__openedUrls.push(url); };
  }, deals);
}

/** Build and return the bookmarklet script (without the "javascript:" prefix). */
function getBookmarkletScript() {
  // Inline the current bookmarklet code with the test app URL substituted in.
  // This mirrors exactly what BookmarkletSetup.jsx generates.
  const appUrl = APP_URL;
  return `(function(){if(!location.hostname.includes('powerbuynetwork')){alert('Use this bookmarklet on the Powerbuy deals page.');return;}if(window.__pb_tracking!==undefined){var tb=document.getElementById('pb-import-btn');if(tb){tb.style.transform='scale(1.15)';setTimeout(function(){tb.style.transform='';},200);}else{var tt=document.createElement('div');tt.style.cssText='position:fixed;top:20px;right:20px;background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;z-index:99999;font-family:sans-serif;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.3)';tt.textContent='Already monitoring — click the button to import.';document.body.appendChild(tt);setTimeout(function(){if(tt.parentNode)tt.parentNode.removeChild(tt);},2500);}return;}window.__pb_tracking={};function updateBtn(){var count=Object.values(window.__pb_tracking).filter(function(d){return d.qty>0;}).length;var b=document.getElementById('pb-import-btn');if(b)b.textContent='Import Changes'+(count?' ('+count+')':'');}document.querySelectorAll('[ng-repeat="itm in arr.t_f_items"]').forEach(function(el){try{var s=angular.element(el).scope(),itm=s.itm,arr=s.arr,upc=itm.f_upc;if(!upc)return;var exp=itm.f_expires||'';if(exp.includes('/')){var p=exp.split('/');exp=p[2]+'-'+p[0].padStart(2,'0')+'-'+p[1].padStart(2,'0');}else{exp=exp.split('T')[0];}var data={upc:upc,model:itm.f_model||'',item:itm.f_title||arr.t_f_title||'',sell:parseFloat(arr.t_f_price)||0,retail:parseFloat(arr.t_f_retail)||0,expires:exp};s.$watch(function(){return s.dealCommit&&s.dealCommit[itm.f_id]&&s.dealCommit[itm.f_id].current;},function(newVal,oldVal){if(newVal===oldVal||oldVal===undefined)return;window.__pb_tracking[upc]=Object.assign({},data,{qty:parseInt(newVal)||0});updateBtn();});}catch(e){}});var btn=document.createElement('button');btn.id='pb-import-btn';btn.style.cssText='position:fixed;bottom:24px;right:24px;background:#2563eb;color:#fff;padding:12px 22px;border-radius:8px;z-index:99999;font-family:sans-serif;font-size:14px;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.35);border:none;cursor:pointer;transition:transform .15s';btn.textContent='Import Changes';btn.onclick=function(){var changed=Object.values(window.__pb_tracking).filter(function(d){return d.qty>0;});if(!changed.length){alert('No commitment changes yet — save some commitments first.');return;}var deals=changed;window.__pb_tracking=undefined;btn.parentNode.removeChild(btn);var ov=document.createElement('div');ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;box-sizing:border-box';var md=document.createElement('div');md.style.cssText='background:#fff;border-radius:8px;padding:24px;max-width:720px;width:100%;margin-top:20px;font-family:sans-serif;box-sizing:border-box';var h='<h2 style="margin:0 0 4px;font-size:18px">Add Deals to Tracker</h2><p style="margin:0 0 16px;color:#64748b;font-size:13px">Commitments you changed this session. Amazon $ is per unit.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">UPC</th><th style="padding:8px;text-align:right">Sell $</th><th style="padding:8px;text-align:right">Amazon $ / unit</th><th style="padding:8px;text-align:center;width:65px">Qty</th></tr></thead><tbody>';deals.forEach(function(d,i){h+='<tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px"><div style="font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+d.item+'</div><div style="color:#64748b;font-size:11px">'+d.model+'</div></td><td style="padding:8px;font-family:monospace;font-size:12px">'+d.upc+'</td><td style="padding:8px;text-align:right">$'+d.sell.toFixed(2)+'</td><td style="padding:8px"><input data-a="'+i+'" type="number" value="'+d.retail.toFixed(2)+'" min="0" step="0.01" style="width:80px;text-align:right;border:1px solid #cbd5e1;border-radius:4px;padding:4px;font-size:13px"></td><td style="padding:8px;text-align:center"><input data-q="'+i+'" type="number" value="'+d.qty+'" min="0" max="99" style="width:55px;text-align:center;border:1px solid #cbd5e1;border-radius:4px;padding:4px;font-size:13px"></td></tr>';});h+='</tbody></table></div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end"><button id="pb-x" style="padding:8px 18px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer;font-size:14px">Cancel</button><button id="pb-ok" style="padding:8px 18px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">Add to Tracker</button></div>';md.innerHTML=h;ov.appendChild(md);document.body.appendChild(ov);document.getElementById('pb-x').onclick=function(){document.body.removeChild(ov);};document.getElementById('pb-ok').onclick=function(){var r=deals.map(function(d,i){var qty=parseInt(document.querySelector('[data-q="'+i+'"]').value)||0,am=parseFloat(document.querySelector('[data-a="'+i+'"]').value)||0;return{upc:d.upc,model:d.model,item:d.item,sellPricePerUnit:d.sell,totalAmazon:am*qty,expires:d.expires,qty:qty};}).filter(function(d){return d.qty>0;});if(!r.length){alert('No deals to import.');return;}var enc=btoa(encodeURIComponent(JSON.stringify(r)));window.open('${appUrl}/?powerbuyImport='+encodeURIComponent(enc),'_blank');document.body.removeChild(ov);};};document.body.appendChild(btn);var t=document.createElement('div');t.style.cssText='position:fixed;top:20px;right:20px;background:#0f172a;color:#fff;padding:12px 18px;border-radius:8px;z-index:99999;font-family:sans-serif;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.3)';t.textContent='Monitoring started — save commitments, then click the button below.';document.body.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},3000);})();`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Bookmarklet — first click (start monitoring)', () => {
  test('shows monitoring toast', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    await expect(page.locator('text=Monitoring started')).toBeVisible();
  });

  test('shows floating Import Changes button', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    await expect(page.locator('#pb-import-btn')).toBeVisible();
    await expect(page.locator('#pb-import-btn')).toHaveText('Import Changes');
  });

  test('sets window.__pb_tracking to an empty object', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    const tracking = await page.evaluate(() => window.__pb_tracking);
    expect(tracking).toEqual({});
  });
});

test.describe('Bookmarklet — commitment change tracking', () => {
  test('updates button count when a commitment qty is changed', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());

    // Simulate user changing deal-1 commitment from 0 to 3
    await page.evaluate(() => window.__changeCommitment('deal-1', 3));

    await expect(page.locator('#pb-import-btn')).toHaveText('Import Changes (1)');
  });

  test('tracks multiple commitment changes', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());

    await page.evaluate(() => {
      window.__changeCommitment('deal-1', 3);
      window.__changeCommitment('deal-2', 1);
    });

    await expect(page.locator('#pb-import-btn')).toHaveText('Import Changes (2)');
  });

  test('does NOT count a change to qty 0', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());

    // Change to 3 then back to 0 — should not count
    await page.evaluate(() => {
      window.__changeCommitment('deal-1', 3);
      window.__changeCommitment('deal-1', 0);
    });

    await expect(page.locator('#pb-import-btn')).toHaveText('Import Changes');
  });

  test('does NOT record change when COMMIT is clicked (oldVal undefined)', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());

    // Simulate Angular initializing the scope (oldVal === undefined → newVal = 3)
    await page.evaluate(() => {
      const scope = window.angular.element(
        document.querySelector('[data-deal-id="deal-1"]')
      ).scope();
      scope._watches.forEach(w => w.cb(3, undefined));
    });

    // Should not have been recorded
    const tracking = await page.evaluate(() => window.__pb_tracking);
    expect(Object.keys(tracking)).toHaveLength(0);
    await expect(page.locator('#pb-import-btn')).toHaveText('Import Changes');
  });

  test('overwrites previous tracking entry if same UPC changed again', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());

    await page.evaluate(() => {
      window.__changeCommitment('deal-1', 2);
      window.__changeCommitment('deal-1', 5); // update same deal
    });

    const tracking = await page.evaluate(() => window.__pb_tracking);
    expect(Object.keys(tracking)).toHaveLength(1);
    expect(tracking['111111111111'].qty).toBe(5);
    await expect(page.locator('#pb-import-btn')).toHaveText('Import Changes (1)');
  });
});

test.describe('Bookmarklet — second click while monitoring', () => {
  test('pulses the button instead of restarting monitoring', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript()); // first click
    await page.evaluate(() => window.__changeCommitment('deal-1', 3));

    // Second click — should pulse button, not restart
    await page.evaluate(getBookmarkletScript());

    // Monitoring state is still alive (not reset to undefined)
    const tracking = await page.evaluate(() => window.__pb_tracking);
    expect(tracking).not.toBeUndefined();
    expect(tracking['111111111111'].qty).toBe(3);

    // Button still shows correct count
    await expect(page.locator('#pb-import-btn')).toHaveText('Import Changes (1)');
  });

  test('does not show the monitoring toast again on second click', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript()); // first click
    // Wait for toast to disappear
    await page.waitForTimeout(3200);
    await page.evaluate(getBookmarkletScript()); // second click

    // Should show "Already monitoring" toast, not "Monitoring started"
    await expect(page.locator('text=Already monitoring')).toBeVisible();
    await expect(page.locator('text=Monitoring started')).not.toBeVisible();
  });
});

test.describe('Bookmarklet — import dialog', () => {
  test('shows dialog with only changed deals when Import button clicked', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());

    // Only change deal-1
    await page.evaluate(() => window.__changeCommitment('deal-1', 3));
    await page.locator('#pb-import-btn').click();

    await expect(page.locator('text=Add Deals to Tracker')).toBeVisible();
    await expect(page.locator('text=Apple Watch Black')).toBeVisible();
    await expect(page.locator('text=Apple Watch Rose')).not.toBeVisible();
  });

  test('dialog shows correct UPC for changed deal', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    await page.evaluate(() => window.__changeCommitment('deal-1', 3));
    await page.locator('#pb-import-btn').click();

    await expect(page.locator('text=111111111111')).toBeVisible();
    await expect(page.locator('text=222222222222')).not.toBeVisible();
  });

  test('dialog pre-fills qty with the changed value', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    await page.evaluate(() => window.__changeCommitment('deal-1', 3));
    await page.locator('#pb-import-btn').click();

    const qtyInput = page.locator('input[data-q="0"]');
    await expect(qtyInput).toHaveValue('3');
  });

  test('shows multiple changed deals in dialog', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    await page.evaluate(() => {
      window.__changeCommitment('deal-1', 3);
      window.__changeCommitment('deal-2', 1);
    });
    await page.locator('#pb-import-btn').click();

    await expect(page.locator('text=Apple Watch Black')).toBeVisible();
    await expect(page.locator('text=Apple Watch Rose')).toBeVisible();
  });

  test('cancel button closes the dialog', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    await page.evaluate(() => window.__changeCommitment('deal-1', 3));
    await page.locator('#pb-import-btn').click();

    await expect(page.locator('text=Add Deals to Tracker')).toBeVisible();
    await page.locator('#pb-x').click();
    await expect(page.locator('text=Add Deals to Tracker')).not.toBeVisible();
  });

  test('shows alert when import clicked with no changes', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());

    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#pb-import-btn').click();

    // Dialog should not have appeared (alert was shown instead)
    await expect(page.locator('text=Add Deals to Tracker')).not.toBeVisible();
  });

  test('"Add to Tracker" opens tracker with encoded deals URL', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    await page.evaluate(() => window.__changeCommitment('deal-1', 3));
    await page.locator('#pb-import-btn').click();

    await page.locator('#pb-ok').click();

    const openedUrls = await page.evaluate(() => window.__openedUrls);
    expect(openedUrls).toHaveLength(1);
    expect(openedUrls[0]).toContain('powerbuyImport=');
    expect(openedUrls[0]).toContain(APP_URL);
  });

  test('encoded URL decodes to the correct deal data', async ({ page }) => {
    await setupMockPage(page);
    await page.evaluate(getBookmarkletScript());
    await page.evaluate(() => window.__changeCommitment('deal-1', 3));
    await page.locator('#pb-import-btn').click();
    await page.locator('#pb-ok').click();

    const deals = await page.evaluate(() => {
      const url = new URL(window.__openedUrls[0]);
      const encoded = url.searchParams.get('powerbuyImport');
      return JSON.parse(decodeURIComponent(atob(encoded)));
    });

    expect(deals).toHaveLength(1);
    expect(deals[0].upc).toBe('111111111111');
    expect(deals[0].qty).toBe(3);
    expect(deals[0].item).toBe('Apple Watch Black');
  });
});

test.describe('Bookmarklet — wrong page guard', () => {
  test('shows alert and does nothing if not on powerbuynetwork.com', async ({ page }) => {
    await page.setContent('<html><body><h1>Some other site</h1></body></html>');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Use this bookmarklet on the Powerbuy deals page');
      await dialog.dismiss();
    });

    await page.evaluate(getBookmarkletScript());
    await expect(page.locator('#pb-import-btn')).not.toBeAttached();
  });
});
