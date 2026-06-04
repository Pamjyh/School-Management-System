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
