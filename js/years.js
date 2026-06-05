// =====================================================================
// YEAR
// =====================================================================
function renderYearSel(){
  const sel = document.getElementById('yearSel');
  sel.innerHTML = YEARS.map(y=>`<option value="${y.id}" ${y.id===CY?'selected':''}>${y.year_be}</option>`).join('');
}
function switchYear(){
  const sel = document.getElementById('yearSel');
  CY = parseInt(sel.value);
  CYbe = YEARS.find(y=>y.id===CY)?.year_be;
  FINANCE_LOADED = false;
  FINANCE_TRANSACTIONS = [];
  loadAll();
  if(document.getElementById('page-finance')?.classList.contains('active')){
    loadFinanceData();
  }
}
function openYearModal(){ document.getElementById('yearOverlay').classList.add('open'); setTimeout(()=>document.getElementById('newYear').focus(),100); }
function closeYearModal(){ document.getElementById('yearOverlay').classList.remove('open'); }
async function addYear(){
  const y = parseInt(document.getElementById('newYear').value);
  if(!y||y<2560||y>2599){ alert('กรุณาระบุปีงบประมาณ พ.ศ. (2560–2599)'); return; }
  const exists = YEARS.find(r=>r.year_be===y);
  if(exists){ CY=exists.id; CYbe=exists.year_be; renderYearSel(); await loadAll(); closeYearModal(); return; }
  const r = await POST('years',{year_be:y});
  if(r&&r[0]){ CY=r[0].id; CYbe=r[0].year_be; }
  await loadYears();
  await loadAll();
  closeYearModal();
}
