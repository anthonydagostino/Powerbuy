import { useEffect, useMemo, useRef } from 'react';

export default function BookmarkletSetup() {
  const linkRef = useRef(null);
  const bookmarklet = useMemo(() => {
    const appUrl = window.location.origin;
    return `javascript:(function(){if(!location.hostname.includes('powerbuynetwork')){alert('Use this bookmarklet on the Powerbuy deals page.');return;}var seen={},allDeals=[],currentQtys={};document.querySelectorAll('[ng-repeat="itm in arr.t_f_items"]').forEach(function(el){try{var s=angular.element(el).scope(),itm=s.itm,arr=s.arr,upc=itm.f_upc;if(!upc||seen[upc])return;seen[upc]=1;var qty=parseInt((s.dealCommit&&s.dealCommit[itm.f_id]&&s.dealCommit[itm.f_id].current)||0)||0;currentQtys[upc]=qty;var exp=itm.f_expires||'';if(exp.includes('/')){var p=exp.split('/');exp=p[2]+'-'+p[0].padStart(2,'0')+'-'+p[1].padStart(2,'0');}else{exp=exp.split('T')[0];}allDeals.push({upc:upc,model:itm.f_model||'',item:itm.f_title||arr.t_f_title||'',sell:parseFloat(arr.t_f_price)||0,retail:parseFloat(arr.t_f_retail)||0,expires:exp,qty:qty});}catch(e){}});var KEY='pb_snapshot';var snap=null;try{snap=JSON.parse(localStorage.getItem(KEY));}catch(e){}if(!snap){localStorage.setItem(KEY,JSON.stringify(currentQtys));var t=document.createElement('div');t.style.cssText='position:fixed;top:20px;right:20px;background:#2563eb;color:#fff;padding:14px 20px;border-radius:8px;z-index:99999;font-family:sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.3)';t.textContent='Snapshot saved. Update your commitments, then click again to import.';document.body.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},3500);return;}var deals=allDeals.filter(function(d){return d.qty>0&&d.qty!==(snap[d.upc]||0);});localStorage.removeItem(KEY);if(!deals.length){alert('No commitment changes found since the snapshot. Click again to take a new snapshot.');return;}var ov=document.createElement('div');ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;box-sizing:border-box';var md=document.createElement('div');md.style.cssText='background:#fff;border-radius:8px;padding:24px;max-width:720px;width:100%;margin-top:20px;font-family:sans-serif;box-sizing:border-box';var h='<h2 style="margin:0 0 4px;font-size:18px">Add Deals to Tracker</h2><p style="margin:0 0 16px;color:#64748b;font-size:13px">Commitments changed since your snapshot. Amazon $ is per unit.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">UPC</th><th style="padding:8px;text-align:right">Sell $</th><th style="padding:8px;text-align:right">Amazon $ / unit</th><th style="padding:8px;text-align:center;width:65px">Qty</th></tr></thead><tbody>';deals.forEach(function(d,i){h+='<tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px"><div style="font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+d.item+'</div><div style="color:#64748b;font-size:11px">'+d.model+'</div></td><td style="padding:8px;font-family:monospace;font-size:12px">'+d.upc+'</td><td style="padding:8px;text-align:right">$'+d.sell.toFixed(2)+'</td><td style="padding:8px"><input data-a="'+i+'" type="number" value="'+d.retail.toFixed(2)+'" min="0" step="0.01" style="width:80px;text-align:right;border:1px solid #cbd5e1;border-radius:4px;padding:4px;font-size:13px"></td><td style="padding:8px;text-align:center"><input data-q="'+i+'" type="number" value="'+d.qty+'" min="0" max="99" style="width:55px;text-align:center;border:1px solid #cbd5e1;border-radius:4px;padding:4px;font-size:13px"></td></tr>';});h+='</tbody></table></div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end"><button id="pb-x" style="padding:8px 18px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer;font-size:14px">Cancel</button><button id="pb-ok" style="padding:8px 18px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">Add to Tracker</button></div>';md.innerHTML=h;ov.appendChild(md);document.body.appendChild(ov);document.getElementById('pb-x').onclick=function(){document.body.removeChild(ov);};document.getElementById('pb-ok').onclick=function(){var r=deals.map(function(d,i){var qty=parseInt(document.querySelector('[data-q="'+i+'"]').value)||0,am=parseFloat(document.querySelector('[data-a="'+i+'"]').value)||0;return{upc:d.upc,model:d.model,item:d.item,sellPricePerUnit:d.sell,totalAmazon:am*qty,expires:d.expires,qty:qty};}).filter(function(d){return d.qty>0;});if(!r.length){alert('No deals to import.');return;}var enc=btoa(encodeURIComponent(JSON.stringify(r)));window.open('${appUrl}/?powerbuyImport='+encodeURIComponent(enc),'_blank');document.body.removeChild(ov);};})();`;
  }, []);

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.setAttribute('href', bookmarklet);
    }
  }, [bookmarklet]);

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Powerbuy Deal Importer</h2>
      </div>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
        Drag the button below to your bookmarks bar. On the Powerbuy deals page: <strong>first click</strong> takes a snapshot, <strong>second click</strong> imports only the commitments you changed since the snapshot.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <a
          ref={linkRef}
          style={{
            display: 'inline-block',
            padding: '0.5rem 1.25rem',
            background: '#f59e0b',
            color: '#000',
            fontWeight: 700,
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.9rem',
            cursor: 'grab',
            userSelect: 'none',
            border: '2px dashed #d97706',
          }}
          onClick={e => e.preventDefault()}
          draggable
        >
          + Add to Tracker
        </a>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>← Drag this to your bookmarks bar</span>
      </div>
    </div>
  );
}
