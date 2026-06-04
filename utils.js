// =====================================================================
// UTILITIES
// =====================================================================
function goPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name)?.classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));
}

// =====================================================================
// HELPERS
// =====================================================================
function fmt(n){ return(!n&&n!==0)?'—':Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function numFmt(n){ if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return (n/1000).toFixed(0)+'K'; return String(Math.round(n)); }
function fmtDate(d){ if(!d)return'—'; const p=d.split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; }
function escHtml(s){ return (s||'').replace(/'/g,"&apos;").replace(/"/g,'&quot;'); }
function show(id,type='flex'){ const el=document.getElementById(id); if(el)el.style.display=type; }
function hide(id){ const el=document.getElementById(id); if(el)el.style.display='none'; }

// =====================================================================
// EVENT LISTENERS
// =====================================================================
document.querySelectorAll('.nav-tab').forEach(t=>t.addEventListener('click',()=>goPage(t.dataset.page)));
document.querySelectorAll('[data-ptab2]').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('[data-ptab2]').forEach(x=>x.classList.remove('active'));
  t.classList.add('active'); PROC_TAB=t.dataset.ptab2; renderProc();
}));
document.querySelectorAll('[data-ptab]').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('[data-ptab]').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
}));
['proc-search','proc-ftype','proc-fstatus','proc-fproject'].forEach(id=>{
  const el=document.getElementById(id);
  if(el){ el.addEventListener('input',renderProc); el.addEventListener('change',renderProc); }
});
['procOverlay','projOverlay','yearOverlay','confirmOverlay'].forEach(id=>{
  document.getElementById(id)?.addEventListener('click',function(e){
    if(e.target!==this)return;
    if(id==='confirmOverlay') closeConfirm();
    else if(id==='yearOverlay') closeYearModal();
    else if(id==='projOverlay') closeProjForm();
    else closeProcForm();
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeProcForm();closeProjForm();closeYearModal();closeConfirm();}
});
