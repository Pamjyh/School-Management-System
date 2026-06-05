// =====================================================================
// PROJECTS
// =====================================================================
function renderProjGrid(){
  const el = document.getElementById('proj-grid');
  if(!PROJECTS.length){ el.innerHTML='<div class="no-data">ยังไม่มีโครงการ กด "+ เพิ่มโครงการ"</div>'; return; }
  el.innerHTML = PROJECTS.map(p=>{
    const spent = p.procurement_items?.reduce((a,i)=>a+Number(i.amount||0),0)||0;
    const remain = Number(p.budget_amount||0)-spent;
    const pct = p.budget_amount>0?Math.min(spent/p.budget_amount*100,100):0;
    const over = remain<0;
    return `<div class="proj-card ${ACTIVE_PROJ_ID===p.id?'active-card':''}" onclick="openProjectDetail('${p.id}','${escHtml(p.name)}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div class="proj-name">${p.name}</div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="act-btn" onclick="event.stopPropagation();editProj('${p.id}')" title="แก้ไข">✏️</button>
          <button class="act-btn del" onclick="event.stopPropagation();askDel('project','${p.id}','${escHtml(p.name)}')" title="ลบ">🗑️</button>
        </div>
      </div>
      <div class="proj-teacher">${p.teacher_name||'—'}</div>
      <div class="proj-budget-bar"><div class="proj-bar-fill ${over?'over':''}" style="width:${pct}%"></div></div>
      <div class="proj-numbers">
        <span class="proj-spent">ใช้ไป ${fmt(spent)}</span>
        <span class="proj-remain ${over?'neg':''}">คงเหลือ ${fmt(remain)}</span>
      </div>
    </div>`;
  }).join('');
}

async function openProjectDetail(projId, projName){
  ACTIVE_PROJ_ID = projId;
  renderProjGrid();
  document.getElementById('proj-grid').style.display='none';
  document.getElementById('proj-detail').style.display='block';
  document.getElementById('proj-detail-name').textContent = projName;
  const items = PROC.filter(i=>i.project_id===projId);
  renderProjDetailItems(items);
}

function closeProjectDetail(){
  ACTIVE_PROJ_ID = null;
  document.getElementById('proj-grid').style.display='grid';
  document.getElementById('proj-detail').style.display='none';
}

function renderProjDetailItems(items){
  const el = document.getElementById('proj-detail-content');
  if(!items.length){ el.innerHTML='<div class="no-data">ยังไม่มีรายการพัสดุที่เชื่อมกับโครงการนี้</div>'; return; }
  const sum = items.reduce((s,i)=>s+Number(i.amount||0),0);
  el.innerHTML=`<table>
    <thead><tr><th>ลำดับ</th><th>ประเภท</th><th>รายการ</th><th class="r">วงเงิน</th><th>สถานะ</th></tr></thead>
    <tbody>${items.map(i=>`<tr>
      <td style="font-family:var(--mono);font-size:12px">จ.${i.seq}</td>
      <td><span class="badge ${i.type==='จัดซื้อ'?'b-buy':'b-hire'}">${i.type}</span></td>
      <td class="ink">${i.title}</td>
      <td class="r">${fmt(i.amount)}</td>
      <td><span class="badge ${i.withdraw_status==='เบิกแล้ว'?'b-done':'b-pend'}">${i.withdraw_status==='เบิกแล้ว'?'เบิกแล้ว':'รอเบิก'}</span></td>
    </tr>`).join('')}</tbody>
    <tfoot><tr class="sum-row"><td colspan="3"><strong>รวม ${items.length} รายการ</strong></td><td class="r"><strong>${fmt(sum)}</strong></td><td></td></tr></tfoot>
  </table>`;
}

// Project form
function openProjectForm(){ document.getElementById('projEditId').value=''; document.getElementById('projName').value=''; document.getElementById('projTeacher').value=''; document.getElementById('projBudget').value=''; document.getElementById('projFormTitle').textContent='เพิ่มโครงการ'; document.getElementById('projOverlay').classList.add('open'); }
function closeProjForm(){ document.getElementById('projOverlay').classList.remove('open'); }
function editProj(id){ const p=PROJECTS.find(x=>x.id===id); if(!p)return; document.getElementById('projEditId').value=id; document.getElementById('projName').value=p.name; document.getElementById('projTeacher').value=p.teacher_name||''; document.getElementById('projBudget').value=p.budget_amount||''; document.getElementById('projFormTitle').textContent='แก้ไขโครงการ'; document.getElementById('projOverlay').classList.add('open'); }
async function saveProjItem(){
  const name=document.getElementById('projName').value.trim();
  if(!name){alert('กรุณาระบุชื่อโครงการ');return}
  const eid=document.getElementById('projEditId').value;
  const body={year_id:CY,name,teacher_name:document.getElementById('projTeacher').value.trim(),budget_amount:parseFloat(document.getElementById('projBudget').value)||0};
  show('loadingOverlay','flex');
  try{
    if(eid) await PATCH('projects',`id=eq.${eid}`,body);
    else await POST('projects',body);
    await loadAll(); closeProjForm();
  }catch(e){ hide('loadingOverlay'); alert('บันทึกไม่ได้: '+e.message); }
}
