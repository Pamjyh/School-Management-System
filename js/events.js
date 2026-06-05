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
// Finance tabs
document.querySelectorAll('[data-ftab]').forEach(t=>t.addEventListener('click',()=>switchFinTab(t.dataset.ftab)));

// Finance form — toggle proc dropdown เมื่อเปลี่ยนประเภท หรือเปลี่ยนโครงการ
const finTypeEl    = document.getElementById('finType');
const finProjectEl = document.getElementById('finProject');
if(finTypeEl)    finTypeEl.addEventListener('change', toggleFinProcGroup);
if(finProjectEl) finProjectEl.addEventListener('change', ()=>{ if(document.getElementById('finType').value==='จ่าย') populateProcDropdown(); });

['proc-search','proc-ftype','proc-fstatus','proc-fproject'].forEach(id=>{
  const el=document.getElementById(id);
  if(el){ el.addEventListener('input',renderProc); el.addEventListener('change',renderProc); }
});
['procOverlay','projOverlay','yearOverlay','confirmOverlay','finOverlay','importOverlay','importExcelOverlay','extOverlay','extCatOverlay'].forEach(id=>{
  document.getElementById(id)?.addEventListener('click',function(e){
    if(e.target!==this)return;
    if(id==='confirmOverlay')          closeConfirm();
    else if(id==='yearOverlay')        closeYearModal();
    else if(id==='projOverlay')        closeProjForm();
    else if(id==='finOverlay')         closeFinanceForm();
    else if(id==='importOverlay')      closeImportModal();
    else if(id==='importExcelOverlay') closeImportExcelModal();
    else if(id==='extOverlay')         closeExtForm();
    else if(id==='extCatOverlay')      closeExtCatModal();
    else closeProcForm();
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeProcForm();closeProjForm();closeYearModal();closeConfirm();closeFinanceForm();closeImportModal();closeImportExcelModal();closeExtForm();closeExtCatModal();}
});

// External tab buttons
document.querySelectorAll('[data-etab]').forEach(t=>t.addEventListener('click',()=>switchExtTab(t.dataset.etab)));
