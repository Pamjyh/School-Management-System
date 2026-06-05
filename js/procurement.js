// =====================================================================
// PROCUREMENT
// =====================================================================
function fillProjSelects(){
  const opts = '<option value="">— ไม่ระบุ —</option>'+PROJECTS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  document.getElementById('pProject').innerHTML = opts;
  document.getElementById('proc-fproject').innerHTML = '<option value="">โครงการทั้งหมด</option>'+PROJECTS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
}

function getFilteredProc(){
  const q=(document.getElementById('proc-search').value||'').toLowerCase();
  const ft=document.getElementById('proc-ftype').value;
  const fs=document.getElementById('proc-fstatus').value;
  const fp=document.getElementById('proc-fproject').value;
  return PROC.filter(i=>{
    if(PROC_TAB!=='all'&&i.type!==PROC_TAB) return false;
    if(ft&&i.type!==ft) return false;
    if(fs&&i.withdraw_status!==fs) return false;
    if(fp&&i.project_id!==fp) return false;
    if(q&&!i.title.toLowerCase().includes(q)&&!(i.person||'').toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderProc(){
  const rows=getFilteredProc();
  const dc=rows.filter(i=>i.withdraw_status==='เบิกแล้ว').length;
  const pc=rows.filter(i=>i.withdraw_status==='ยังไม่เบิก').length;
  // update stat cards (always use all PROC not filtered rows for top stats)
  const allSum=a=>a.reduce((s,i)=>s+Number(i.amount||0),0);
  document.getElementById('proc-stat-count').textContent = PROC.length;
  document.getElementById('proc-stat-count-sub').textContent = `ซื้อ ${PROC.filter(i=>i.type==='จัดซื้อ').length} / จ้าง ${PROC.filter(i=>i.type==='จัดจ้าง').length}`;
  document.getElementById('proc-stat-total').textContent = numFull(allSum(PROC));
  document.getElementById('proc-stat-done').textContent  = numFull(allSum(PROC.filter(i=>i.withdraw_status==='เบิกแล้ว')));
  document.getElementById('proc-stat-pend').textContent  = numFull(allSum(PROC.filter(i=>i.withdraw_status==='ยังไม่เบิก')));
  document.getElementById('proc-info').textContent=`แสดง ${rows.length} รายการ`;
  document.getElementById('proc-mg').textContent=`✓ เบิกแล้ว ${dc}`;
  document.getElementById('proc-ma').textContent=`⏳ รอ ${pc}`;
  const tbody=document.getElementById('proc-tbody');
  const tfoot=document.getElementById('proc-tfoot');
  if(!rows.length){ tbody.innerHTML='<tr><td colspan="10" class="no-data">ไม่พบข้อมูล</td></tr>'; tfoot.innerHTML=''; return; }
  const sum=a=>a.reduce((s,i)=>s+Number(i.amount||0),0);
  tbody.innerHTML=rows.map(i=>{
    const isDone=i.withdraw_status==='เบิกแล้ว';
    return`<tr>
      <td style="font-family:var(--mono);font-size:12px;color:var(--muted)">จ.${i.seq}</td>
      <td><span class="badge ${i.type==='จัดซื้อ'?'b-buy':'b-hire'}">${i.type}</span></td>
      <td class="ink" style="max-width:220px">${i.title}</td>
      <td style="font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.projects?.name||'—'}</td>
      <td>${i.person||'—'}</td>
      <td style="font-size:12px;color:var(--muted)">${i.budget_source||'—'}</td>
      <td style="font-family:var(--mono);font-size:11px">${fmtDate(i.report_date)}</td>
      <td class="r">${fmt(i.amount)}</td>
      <td><button class="st-btn ${isDone?'st-done':'st-pend'}" onclick="toggleStatus('${i.id}','${i.withdraw_status}')"><span class="st-dot ${isDone?'sd-done':'sd-pend'}"></span>${isDone?'เบิกแล้ว':'รอเบิก'}</button></td>
      <td style="font-family:var(--mono);font-size:11px;color:var(--muted)">${i.withdraw_no||'—'}</td>
      <td><div class="act-group">
        <button class="act-btn" onclick="editProc('${i.id}')">✏️</button>
        <button class="act-btn del" onclick="askDel('proc','${i.id}','${escHtml(i.title)}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
  const ta=sum(rows), da=sum(rows.filter(i=>i.withdraw_status==='เบิกแล้ว')), pa=sum(rows.filter(i=>i.withdraw_status==='ยังไม่เบิก'));
  tfoot.innerHTML=`<tr class="sum-row">
    <td colspan="7"><strong>รวม ${rows.length} รายการ</strong></td>
    <td class="r"><strong>${fmt(ta)}</strong></td>
    <td colspan="3"><span style="color:var(--up);font-family:var(--mono);font-size:11px">✓ ${fmt(da)}</span> <span style="color:var(--muted)">·</span> <span style="color:var(--arc);font-family:var(--mono);font-size:11px">⏳ ${fmt(pa)}</span></td>
  </tr>`;
}

// status toggle
async function toggleStatus(id, current){
  const newStatus = current==='เบิกแล้ว'?'ยังไม่เบิก':'เบิกแล้ว';
  try{
    await PATCH('procurement_items',`id=eq.${id}`,{withdraw_status:newStatus});
    const item = PROC.find(i=>i.id===id);
    if(item) item.withdraw_status = newStatus;
    renderProc(); renderDashboard(); renderProjGrid();
  }catch(e){ alert('อัปเดตไม่ได้: '+e.message); }
}

// proc form
function nextSeq(type){ const nums=PROC.filter(i=>i.type===type).map(i=>i.seq||0); return nums.length?Math.max(...nums)+1:1; }
function suggestProcSeq(){ if(!document.getElementById('procEditId').value) document.getElementById('pSeq').value=nextSeq(document.getElementById('pType').value); }
function openProcForm(){
  document.getElementById('procEditId').value='';
  ['pTitle','pPerson','pDate','pAmount','pWithdrawNo','pRemark'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('pType').value='จัดซื้อ';
  document.getElementById('pProject').value='';
  document.getElementById('pBudgetSrc').value='';
  document.getElementById('pStatus').value='ยังไม่เบิก';
  document.getElementById('pSeq').value=nextSeq('จัดซื้อ');
  document.getElementById('procFormTitle').textContent='เพิ่มรายการ';
  toggleWD();
  document.getElementById('procOverlay').classList.add('open');
}
function closeProcForm(){ document.getElementById('procOverlay').classList.remove('open'); }
function toggleWD(){ document.getElementById('withdrawGroup').style.opacity=document.getElementById('pStatus').value==='เบิกแล้ว'?'1':'0.4'; }
function editProc(id){
  const i=PROC.find(x=>x.id===id); if(!i)return;
  document.getElementById('procEditId').value=id;
  document.getElementById('pSeq').value=i.seq||'';
  document.getElementById('pType').value=i.type;
  document.getElementById('pTitle').value=i.title;
  document.getElementById('pProject').value=i.project_id||'';
  document.getElementById('pPerson').value=i.person||'';
  document.getElementById('pBudgetSrc').value=i.budget_source||'';
  document.getElementById('pDate').value=i.report_date||'';
  document.getElementById('pAmount').value=i.amount||'';
  document.getElementById('pStatus').value=i.withdraw_status;
  document.getElementById('pWithdrawNo').value=i.withdraw_no||'';
  document.getElementById('pRemark').value=i.remark||'';
  document.getElementById('procFormTitle').textContent='แก้ไขรายการ';
  toggleWD();
  document.getElementById('procOverlay').classList.add('open');
}
async function saveProcItem(){
  const title=document.getElementById('pTitle').value.trim();
  const seq=parseInt(document.getElementById('pSeq').value);
  if(!title){alert('กรุณาระบุชื่อรายการ');return}
  if(!seq){alert('กรุณาระบุลำดับที่');return}
  const eid=document.getElementById('procEditId').value;
  const projVal=document.getElementById('pProject').value;
  const body={
    year_id:CY, seq, type:document.getElementById('pType').value, title,
    project_id:projVal||null,
    person:document.getElementById('pPerson').value.trim(),
    budget_source:document.getElementById('pBudgetSrc').value,
    report_date:document.getElementById('pDate').value||null,
    amount:parseFloat(document.getElementById('pAmount').value)||0,
    withdraw_status:document.getElementById('pStatus').value,
    withdraw_no:document.getElementById('pWithdrawNo').value.trim()||null,
    remark:document.getElementById('pRemark').value.trim()||null
  };
  show('loadingOverlay','flex');
  try{
    if(eid) await PATCH('procurement_items',`id=eq.${eid}`,body);
    else await POST('procurement_items',body);
    await loadAll(); closeProcForm();
  }catch(e){ hide('loadingOverlay'); alert('บันทึกไม่ได้: '+e.message); }
}
