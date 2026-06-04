// =====================================================================
// PROCUREMENT
// =====================================================================
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
    <td colspan="6"><strong>รวม ${rows.length} รายการ</strong></td>
    <td class="r"><strong>${fmt(ta)}</strong></td>
    <td colspan="3"><span style="color:var(--up);font-family:var(--mono);font-size:11px">✓ ${fmt(da)}</span> <span style="color:var(--muted)">·</span> <span style="color:var(--arc);font-family:var(--mono);font-size:11px">⏳ ${fmt(pa)}</span></td>
  </tr>`;
  renderProjBudgetBar(rows);
}

function renderProjBudgetBar(rows){
  const bar = document.getElementById('proj-budget-bar');
  const list = document.getElementById('proj-budget-list');
  if(!bar||!list) return;
  // Group by project
  const map = {};
  rows.forEach(i=>{
    if(!i.project_id) return;
    if(!map[i.project_id]) map[i.project_id]={name:i.projects?.name||'ไม่ระบุ',budget:0,spent:0};
    map[i.project_id].spent += Number(i.amount||0);
  });
  // Fill budget from PROJECTS
  PROJECTS.forEach(p=>{ if(map[p.id]) map[p.id].budget = Number(p.budget_amount||0); });
  const entries = Object.values(map);
  if(!entries.length){ bar.style.display='none'; return; }
  bar.style.display='block';
  list.innerHTML = entries.map(e=>{
    const remain = e.budget - e.spent;
    const pct = e.budget>0?Math.min(e.spent/e.budget*100,100):100;
    const over = remain<0;
    return \`<div style="background:var(--white);border-radius:16px;padding:12px 14px;border:1px solid rgba(20,20,19,.07)">
      <div style="font-size:12px;font-weight:700;color:var(--ink);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${e.name}</div>
      <div style="height:4px;background:rgba(20,20,19,.08);border-radius:4px;margin-bottom:6px">
        <div style="height:100%;border-radius:4px;background:\${over?'var(--signal)':'var(--ink)'};width:\${pct}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px">
        <span>ใช้ไป <strong>\${fmt(e.spent)}</strong></span>
        <span style="color:\${over?'var(--signal)':'var(--up)'}">คงเหลือ \${fmt(remain)}</span>
      </div>
    </div>\`;
  }).join('');
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
  try{
    if(eid) await PATCH('procurement_items',`id=eq.${eid}`,body);
    else await POST('procurement_items',body);
    await loadAll(); closeProcForm();
  }catch(e){ showError('บันทึกไม่ได้: '+e.message); }
}

// =====================================================================
// DELETE
// =====================================================================
function askDel(type,id,name){ PENDING_DEL={type,id}; document.getElementById('confirmMsg').textContent=`"${name}" จะถูกลบออกจากระบบ`; document.getElementById('confirmOverlay').classList.add('open'); }
function closeConfirm(){ PENDING_DEL=null; document.getElementById('confirmOverlay').classList.remove('open'); }
async function confirmDel(){
  if(!PENDING_DEL)return;
  const {type,id}=PENDING_DEL;
  try{
    if(type==='proc') await DEL('procurement_items',`id=eq.${id}`);
    else if(type==='project') await DEL('projects',`id=eq.${id}`);
    await loadAll(); closeConfirm();
  }catch(e){ showError('ลบไม่ได้: '+e.message); }
}

// =====================================================================
// NAVIGATION
// =====================================================================