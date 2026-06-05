// =====================================================================
// HELPERS
// =====================================================================
function fmt(n){ return(!n&&n!==0)?'—':Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function numFmt(n){ if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return (n/1000).toFixed(0)+'K'; return String(Math.round(n)); }
function numFull(n){ return (!n&&n!==0)?'—':Math.round(n).toLocaleString('th-TH'); }
function fmtDate(d){ if(!d)return'—'; const p=d.split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; }
function escHtml(s){ return (s||'').replace(/'/g,"&apos;").replace(/"/g,'&quot;'); }
function show(id,type='flex'){ const el=document.getElementById(id); if(el)el.style.display=type; }
function hide(id){ const el=document.getElementById(id); if(el)el.style.display='none'; }

function paginationHTML(page, total, fn){
  var btnStyle = 'padding:6px 14px;border-radius:var(--r-btn);border:1px solid var(--dust);background:var(--canvas);color:var(--ink);font-family:var(--font);font-size:12px;cursor:pointer;';
  var disStyle = 'opacity:.35;cursor:default;';

  // สร้าง page numbers — แสดงสูงสุด 7 ปุ่ม
  var pages = [];
  if(total <= 7){
    for(var i=1;i<=total;i++) pages.push(i);
  } else {
    pages = [1];
    if(page > 3) pages.push('...');
    for(var j=Math.max(2,page-1); j<=Math.min(total-1,page+1); j++) pages.push(j);
    if(page < total-2) pages.push('...');
    pages.push(total);
  }

  var nums = pages.map(function(p){
    if(p==='...') return '<span style="padding:0 6px;color:var(--muted)">…</span>';
    var active = p===page;
    return '<button onclick="'+fn+'('+p+')" style="'+btnStyle+(active?'background:var(--ink);color:var(--canvas);border-color:var(--ink);font-weight:600;':'')+'">'+p+'</button>';
  }).join('');

  return '<div style="display:flex;align-items:center;gap:6px;padding:14px 0 4px;justify-content:center;flex-wrap:wrap">'+
    '<button onclick="'+fn+'('+(page-1)+')" '+(page<=1?'disabled':'')+' style="'+btnStyle+(page<=1?disStyle:'')+'">← ก่อนหน้า</button>'+
    nums+
    '<button onclick="'+fn+'('+(page+1)+')" '+(page>=total?'disabled':'')+' style="'+btnStyle+(page>=total?disStyle:'')+'">ถัดไป →</button>'+
    '<span style="font-size:11px;color:var(--muted);margin-left:4px">หน้า '+page+'/'+total+'</span>'+
  '</div>';
}
