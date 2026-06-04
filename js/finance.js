// =====================================================================
// FINANCE
// =====================================================================
async function loadFinanceData(){
  show('loadingOverlay','flex');
  const err = document.getElementById('financeError');
  if(err){
    err.style.display = 'none';
    err.textContent = '';
  }
  try{
    FUND_CATEGORIES = await GET('fund_categories','select=*&order=sort_order')||[];
    FINANCE_BALANCES = await GET('finance_fund_balances',`select=*&year_id=eq.${CY}&order=fund_name`)||[];
    FINANCE_LOADED = true;
    hide('loadingOverlay');
    renderFinance();
  }catch(e){
    hide('loadingOverlay');
    FINANCE_LOADED = false;
    renderFinanceEmpty();
    if(err){
      err.style.display = 'block';
      err.textContent = 'ยังโหลดข้อมูลงานการเงินไม่ได้: '+e.message+' — ให้รัน supabase/schema.sql, seed.sql และ policies.sql ก่อน';
    }
  }
}

function renderFinance(){
  const totalIn = FINANCE_BALANCES.reduce((s,i)=>s+Number(i.total_in||0),0);
  const totalOut = FINANCE_BALANCES.reduce((s,i)=>s+Number(i.total_out||0),0);
  const balance = FINANCE_BALANCES.reduce((s,i)=>s+Number(i.balance||0),0);
  document.getElementById('fin-in').textContent = numFmt(totalIn);
  document.getElementById('fin-out').textContent = numFmt(totalOut);
  document.getElementById('fin-balance').textContent = numFmt(balance);
  document.getElementById('fin-funds').textContent = FUND_CATEGORIES.length;
  document.getElementById('fin-info').textContent = `แสดง ${FINANCE_BALANCES.length} หมวด/ที่เก็บเงิน ปีงบประมาณ ${CYbe||'—'}`;

  const tbody = document.getElementById('fin-balance-tbody');
  const tfoot = document.getElementById('fin-balance-tfoot');
  if(!FINANCE_BALANCES.length){
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">ยังไม่มีรายการรับ-จ่ายในปีงบประมาณนี้</td></tr>';
    tfoot.innerHTML = '';
    return;
  }
  tbody.innerHTML = FINANCE_BALANCES.map(i=>`
    <tr>
      <td class="ink">${i.fund_name||'ไม่ระบุหมวด'}</td>
      <td>${i.holding_type||'—'}</td>
      <td class="r">${fmt(i.total_in)}</td>
      <td class="r">${fmt(i.total_out)}</td>
      <td class="r" style="color:${Number(i.balance||0)<0?'var(--signal)':'var(--up)'}">${fmt(i.balance)}</td>
    </tr>
  `).join('');
  tfoot.innerHTML = `<tr class="sum-row">
    <td colspan="2"><strong>รวม</strong></td>
    <td class="r"><strong>${fmt(totalIn)}</strong></td>
    <td class="r"><strong>${fmt(totalOut)}</strong></td>
    <td class="r"><strong>${fmt(balance)}</strong></td>
  </tr>`;
}

function renderFinanceEmpty(){
  document.getElementById('fin-in').textContent = '—';
  document.getElementById('fin-out').textContent = '—';
  document.getElementById('fin-balance').textContent = '—';
  document.getElementById('fin-funds').textContent = '—';
  document.getElementById('fin-info').textContent = 'ยังไม่ได้เชื่อมข้อมูลงานการเงิน';
  document.getElementById('fin-balance-tbody').innerHTML = '<tr><td colspan="5" class="no-data">รอติดตั้งตารางการเงินใน Supabase</td></tr>';
  document.getElementById('fin-balance-tfoot').innerHTML = '';
}

