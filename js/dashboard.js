// =====================================================================
// DASHBOARD
// =====================================================================
function renderDashboard(){
  document.getElementById('dbYear').textContent = CYbe||'—';
  const totalBudget = PROJECTS.reduce((s,p)=>s+Number(p.budget_amount||0),0);
  const totalSpent = PROJECTS.reduce((s,p)=>s+Number(p.procurement_items?.reduce((a,i)=>a+Number(i.amount||0),0)||0),0);
  const totalDone = PROC.filter(i=>i.withdraw_status==='เบิกแล้ว');
  const totalPend = PROC.filter(i=>i.withdraw_status==='ยังไม่เบิก');
  document.getElementById('db-projects').textContent = PROJECTS.length;
  document.getElementById('db-projects-sub').textContent = `งบรวม ${fmt(totalBudget)} บาท`;
  document.getElementById('db-budget').textContent = numFmt(totalBudget);
  document.getElementById('db-items').textContent = PROC.length;
  document.getElementById('db-items-sub').textContent = `ซื้อ ${PROC.filter(i=>i.type==='จัดซื้อ').length} / จ้าง ${PROC.filter(i=>i.type==='จัดจ้าง').length}`;
  document.getElementById('db-done').textContent = totalDone.length;
  document.getElementById('db-done-sub').textContent = fmt(totalDone.reduce((s,i)=>s+Number(i.amount||0),0))+' บาท';
  document.getElementById('db-pend').textContent = totalPend.length;
  document.getElementById('db-pend-sub').textContent = fmt(totalPend.reduce((s,i)=>s+Number(i.amount||0),0))+' บาท';

  // project summary table
  const rows = PROJECTS.map(p=>{
    const spent = p.procurement_items?.reduce((a,i)=>a+Number(i.amount||0),0)||0;
    const remain = Number(p.budget_amount||0)-spent;
    const pct = p.budget_amount>0?Math.min(spent/p.budget_amount*100,100):0;
    const over = remain<0;
    return `<tr>
      <td class="ink">${p.name}</td>
      <td>${p.teacher_name||'—'}</td>
      <td class="r">${fmt(p.budget_amount)}</td>
      <td class="r">${fmt(spent)}</td>
      <td class="r" style="color:${over?'var(--signal)':'var(--up)'}">${fmt(remain)}</td>
      <td>
        <div style="width:80px;height:4px;background:rgba(20,20,19,.1);border-radius:4px">
          <div style="height:100%;border-radius:4px;background:${over?'var(--signal)':'var(--ink)'};width:${pct}%"></div>
        </div>
      </td>
    </tr>`;
  }).join('');
  document.getElementById('db-proj-table').innerHTML = `
    <div class="table-card" style="margin-top:12px">
      <table>
        <thead><tr>
          <th>โครงการ</th><th>ผู้รับผิดชอบ</th>
          <th class="r">งบประมาณ</th><th class="r">ใช้ไป</th>
          <th class="r">คงเหลือ</th><th>%</th>
        </tr></thead>
        <tbody>${rows||'<tr><td colspan="6" class="no-data">ยังไม่มีข้อมูลโครงการ</td></tr>'}</tbody>
      </table>
    </div>`;
}
