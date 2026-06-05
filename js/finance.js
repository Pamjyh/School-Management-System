// =====================================================================
// FINANCE
// =====================================================================

// ---------- LOAD ----------
async function loadFinanceData(){
  show('loadingOverlay','flex');
  const err = document.getElementById('financeError');
  if(err){ err.style.display='none'; err.textContent=''; }
  try{
    FUND_CATEGORIES  = await GET('fund_categories','select=*&order=sort_order') || [];
    FINANCE_BALANCES = await GET('finance_fund_balances',`select=*&year_id=eq.${CY}&order=fund_name`) || [];
    FINANCE_LOADED   = true;
    hide('loadingOverlay');
    renderFinance();
  }catch(e){
    hide('loadingOverlay');
    FINANCE_LOADED = false;
    renderFinanceEmpty();
    if(err){
      err.style.display='block';
      err.textContent = 'ยังโหลดข้อมูลงานการเงินไม่ได้: '+e.message+' — ให้รัน supabase/schema.sql, seed.sql และ policies.sql ก่อน';
    }
  }
}

async function loadTransactions(){
  const tbody = document.getElementById('fin-tx-tbody');
  const info  = document.getElementById('fin-tx-info');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading-tr">กำลังโหลด...</td></tr>';
  try{
    const typeFilter = document.getElementById('fin-tx-ftype')?.value || '';
    let q = `select=*,fund_categories(name),projects(name)&year_id=eq.${CY}&order=transaction_date.desc`;
    if(typeFilter) q += '&transaction_type=eq.'+encodeURIComponent(typeFilter);
    FINANCE_TRANSACTIONS = await GET('finance_transactions', q) || [];
    renderTransactions();
  }catch(e){
    tbody.innerHTML = '<tr><td colspan="8" class="no-data">โหลดรายการไม่ได้: '+e.message+'</td></tr>';
  }
}

// ---------- RENDER BALANCE ----------
function renderFinance(){
  const totalIn  = FINANCE_BALANCES.reduce((s,i)=>s+Number(i.total_in ||0),0);
  const totalOut = FINANCE_BALANCES.reduce((s,i)=>s+Number(i.total_out||0),0);
  const balance  = FINANCE_BALANCES.reduce((s,i)=>s+Number(i.balance  ||0),0);
  document.getElementById('fin-in').textContent      = numFmt(totalIn);
  document.getElementById('fin-out').textContent     = numFmt(totalOut);
  document.getElementById('fin-balance').textContent = numFmt(balance);
  document.getElementById('fin-funds').textContent   = FUND_CATEGORIES.length;
  document.getElementById('fin-info').textContent    = 'แสดง '+FINANCE_BALANCES.length+' หมวด/ที่เก็บเงิน ปีงบประมาณ '+(CYbe||'—');

  const tbody = document.getElementById('fin-balance-tbody');
  const tfoot = document.getElementById('fin-balance-tfoot');
  if(!FINANCE_BALANCES.length){
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">ยังไม่มีรายการรับ-จ่ายในปีงบประมาณนี้</td></tr>';
    tfoot.innerHTML = '';
    return;
  }
  tbody.innerHTML = FINANCE_BALANCES.map(function(i){
    return '<tr><td class="ink">'+
      (i.fund_name||'ไม่ระบุหมวด')+'</td><td>'+(i.holding_type||'—')+'</td>'+
      '<td class="r">'+fmt(i.total_in)+'</td>'+
      '<td class="r">'+fmt(i.total_out)+'</td>'+
      '<td class="r" style="color:'+(Number(i.balance||0)<0?'var(--signal)':'var(--up)')+'">'+fmt(i.balance)+'</td></tr>';
  }).join('');
  tfoot.innerHTML = '<tr class="sum-row"><td colspan="2"><strong>รวม</strong></td>'+
    '<td class="r"><strong>'+fmt(totalIn)+'</strong></td>'+
    '<td class="r"><strong>'+fmt(totalOut)+'</strong></td>'+
    '<td class="r"><strong>'+fmt(balance)+'</strong></td></tr>';
}

function renderFinanceEmpty(){
  ['fin-in','fin-out','fin-balance','fin-funds'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.textContent='—';
  });
  var info = document.getElementById('fin-info');
  if(info) info.textContent = 'ยังไม่ได้เชื่อมข้อมูลงานการเงิน';
  var tbody = document.getElementById('fin-balance-tbody');
  if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="no-data">รอติดตั้งตารางการเงินใน Supabase</td></tr>';
  var tfoot = document.getElementById('fin-balance-tfoot');
  if(tfoot) tfoot.innerHTML = '';
}

// ---------- RENDER TRANSACTIONS ----------
function renderTransactions(){
  var tbody = document.getElementById('fin-tx-tbody');
  var tfoot = document.getElementById('fin-tx-tfoot');
  var info  = document.getElementById('fin-tx-info');
  var list  = FINANCE_TRANSACTIONS;

  if(info) info.textContent = 'แสดง '+list.length+' รายการ ปีงบประมาณ '+(CYbe||'—');

  if(!list.length){
    tbody.innerHTML = '<tr><td colspan="8" class="no-data">ยังไม่มีรายการรับ-จ่าย กด "+ เพิ่มรายการ" เพื่อเริ่มบันทึก</td></tr>';
    tfoot.innerHTML = '';
    return;
  }

  var totalIn  = 0;
  var totalOut = 0;
  list.forEach(function(i){
    if(i.transaction_type==='จ่าย') totalOut += Number(i.amount||0);
    else totalIn += Number(i.amount||0);
  });

  tbody.innerHTML = list.map(function(i){
    var typeColor = i.transaction_type==='รับ'?'var(--up)':i.transaction_type==='จ่าย'?'var(--signal)':'var(--slate)';
    var fundName  = (i.fund_categories && i.fund_categories.name) ? i.fund_categories.name : '—';
    var projName  = (i.projects && i.projects.name) ? i.projects.name : '';
    var descCell  = (i.description||'—')+(projName?'<br><span style="font-size:11px;color:var(--slate)">'+projName+'</span>':'');
    return '<tr>'+
      '<td style="white-space:nowrap">'+fmtDate(i.transaction_date)+'</td>'+
      '<td><span style="font-size:11px;font-weight:700;color:'+typeColor+'">'+
        (i.transaction_type||'—')+'</span></td>'+
      '<td class="ink">'+fundName+'</td>'+
      '<td>'+descCell+'</td>'+
      '<td><span style="font-family:var(--mono);font-size:12px">'+(i.doc_no||'—')+'</span></td>'+
      '<td>'+(i.holding_type||'—')+'</td>'+
      '<td class="r" style="color:'+typeColor+'">'+fmt(i.amount)+'</td>'+
      '<td><div class="act-group">'+
        '<button class="act-btn" onclick="openFinanceForm(\''+i.id+'\')" title="แก้ไข">✏️</button>'+
        '<button class="act-btn del" onclick="deleteFinanceTransaction(\''+i.id+'\')" title="ลบ">🗑️</button>'+
      '</div></td></tr>';
  }).join('');

  tfoot.innerHTML = '<tr class="sum-row">'+
    '<td colspan="6"><strong>รวม</strong></td>'+
    '<td class="r"><strong style="color:var(--up)">'+fmt(totalIn)+
    '</strong> / <strong style="color:var(--signal)">'+fmt(totalOut)+'</strong></td>'+
    '<td></td></tr>';
}

function filterTransactions(){
  loadTransactions();
}

// ---------- FINANCE TABS ----------
function switchFinTab(tab){
  FIN_TAB = tab;
  document.querySelectorAll('[data-ftab]').forEach(function(btn){
    btn.classList.toggle('active', btn.dataset.ftab===tab);
  });
  var balEl = document.getElementById('fin-tab-balance');
  var txEl  = document.getElementById('fin-tab-transactions');
  if(balEl) balEl.style.display = tab==='balance'      ? 'block' : 'none';
  if(txEl)  txEl.style.display  = tab==='transactions' ? 'block' : 'none';
  if(tab==='transactions') loadTransactions();
}

// ---------- FORM OPEN/CLOSE ----------
function openFinanceForm(id){
  var overlay = document.getElementById('finOverlay');
  var title   = document.getElementById('finFormTitle');
  document.getElementById('finEditId').value = '';

  // เติม fund_categories dropdown
  var sel = document.getElementById('finFund');
  sel.innerHTML = '<option value="">— เลือกหมวดเงิน —</option>';
  FUND_CATEGORIES.forEach(function(f){
    var o = document.createElement('option');
    o.value = f.id; o.textContent = f.name;
    sel.appendChild(o);
  });

  // เติม project dropdown
  var psel = document.getElementById('finProject');
  psel.innerHTML = '<option value="">— ไม่ระบุ —</option>';
  PROJECTS.forEach(function(p){
    var o = document.createElement('option');
    o.value = p.id; o.textContent = p.name;
    psel.appendChild(o);
  });

  if(id && id !== 'undefined'){
    // mode: edit
    title.textContent = 'แก้ไขรายการ';
    var tx = FINANCE_TRANSACTIONS.find(function(t){ return String(t.id)===String(id); });
    if(tx){
      document.getElementById('finEditId').value    = tx.id;
      document.getElementById('finDate').value      = tx.transaction_date||'';
      document.getElementById('finType').value      = tx.transaction_type||'รับ';
      document.getElementById('finFund').value      = tx.fund_category_id||'';
      document.getElementById('finHolding').value   = tx.holding_type||'เงินสด';
      document.getElementById('finAmount').value    = tx.amount||'';
      document.getElementById('finDocNo').value     = tx.doc_no||'';
      document.getElementById('finDesc').value      = tx.description||'';
      document.getElementById('finProject').value   = tx.project_id||'';
      document.getElementById('finRemark').value    = tx.remark||'';
    }
  } else {
    // mode: add
    title.textContent = 'เพิ่มรายการรับ-จ่าย';
    document.getElementById('finDate').value    = new Date().toISOString().split('T')[0];
    document.getElementById('finType').value    = 'รับ';
    document.getElementById('finFund').value    = '';
    document.getElementById('finHolding').value = 'เงินสด';
    document.getElementById('finAmount').value  = '';
    document.getElementById('finDocNo').value   = '';
    document.getElementById('finDesc').value    = '';
    document.getElementById('finProject').value = '';
    document.getElementById('finRemark').value  = '';
  }

  overlay.classList.add('open');
}

function closeFinanceForm(){
  document.getElementById('finOverlay').classList.remove('open');
}

// ---------- SAVE ----------
async function saveFinanceTransaction(){
  var editId  = document.getElementById('finEditId').value;
  var date    = document.getElementById('finDate').value;
  var type    = document.getElementById('finType').value;
  var fundId  = document.getElementById('finFund').value;
  var holding = document.getElementById('finHolding').value;
  var amount  = parseFloat(document.getElementById('finAmount').value);
  var docNo   = document.getElementById('finDocNo').value.trim();
  var desc    = document.getElementById('finDesc').value.trim();
  var projId  = document.getElementById('finProject').value;
  var remark  = document.getElementById('finRemark').value.trim();

  if(!date)                      return alert('กรุณาเลือกวันที่');
  if(!fundId)                    return alert('กรุณาเลือกหมวดเงิน');
  if(isNaN(amount)||amount<=0)   return alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');

  var payload = {
    year_id:          CY,
    transaction_date: date,
    transaction_type: type,
    fund_category_id: fundId,
    holding_type:     holding,
    amount:           amount,
    doc_no:           docNo   || null,
    description:      desc    || null,
    project_id:       projId  || null,
    remark:           remark  || null
  };

  show('loadingOverlay','flex');
  try{
    if(editId){
      await PATCH('finance_transactions', 'id=eq.'+editId, payload);
    } else {
      await POST('finance_transactions', payload);
    }
    closeFinanceForm();
    FINANCE_LOADED = false;
    await loadFinanceData();
    if(FIN_TAB==='transactions') loadTransactions();
  }catch(e){
    alert('บันทึกไม่สำเร็จ: '+e.message);
  }
  hide('loadingOverlay');
}

// ---------- DELETE ----------
function deleteFinanceTransaction(id){
  PENDING_DEL = {type:'finance_transaction', id: id};
  document.getElementById('confirmMsg').textContent = 'ต้องการลบรายการนี้ออกจากระบบ?';
  document.getElementById('confirmOverlay').classList.add('open');
}
