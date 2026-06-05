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
