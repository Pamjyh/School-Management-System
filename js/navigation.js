// =====================================================================
// NAVIGATION
// =====================================================================
function goPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name)?.classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));
  if(name === 'finance' && !FINANCE_LOADED) loadFinanceData();
}
