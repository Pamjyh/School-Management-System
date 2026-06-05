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
function renderYearList(){
  const el = document.getElementById('yearList');
  if(!el) return;
  if(!YEARS.length){ el.innerHTML=''; return; }
  el.innerHTML = YEARS.map(y=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:10px;background:${y.id===CY?'rgba(20,20,19,.06)':'transparent'}">
      <span style="font-size:15px;font-weight:${y.id===CY?'700':'400'};color:var(--ink)">${y.year_be}${y.id===CY?' <span style="font-size:11px;color:var(--slate)">(ปัจจุบัน)</span>':''}</span>
      ${y.id===CY?'<span style="font-size:11px;color:var(--muted)">ใช้งานอยู่</span>':
        `<button onclick="deleteYear(${y.id},${y.year_be})" style="background:transparent;border:none;cursor:pointer;font-size:13px;color:var(--signal);padding:4px 8px;border-radius:8px" title="ลบปีนี้">ลบ</button>`}
    </div>`).join('');
}
function openYearModal(){ renderYearList(); document.getElementById('yearOverlay').classList.add('open'); setTimeout(()=>document.getElementById('newYear').focus(),100); }
function closeYearModal(){ document.getElementById('yearOverlay').classList.remove('open'); }

async function deleteYear(id, yearBe){
  if(!confirm(`ลบปีงบประมาณ ${yearBe}?\n⚠️ ข้อมูลโครงการ พัสดุ และการเงินในปีนี้จะถูกลบทั้งหมด`)) return;
  try{
    await DEL('years',`id=eq.${id}`);
    await loadYears();
    await loadAll();
    renderYearList();
  }catch(e){ alert('ลบไม่ได้: '+e.message); }
}
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
