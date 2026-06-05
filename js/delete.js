// =====================================================================
// DELETE
// =====================================================================
function askDel(type,id,name){ PENDING_DEL={type,id}; document.getElementById('confirmMsg').textContent=`"${name}" จะถูกลบออกจากระบบ`; document.getElementById('confirmOverlay').classList.add('open'); }
function closeConfirm(){ PENDING_DEL=null; document.getElementById('confirmOverlay').classList.remove('open'); }
async function confirmDel(){
  if(!PENDING_DEL)return;
  var type=PENDING_DEL.type, id=PENDING_DEL.id;
  show('loadingOverlay','flex');
  try{
    if(type==='proc')                await DEL('procurement_items',`id=eq.${id}`);
    else if(type==='project')        await DEL('projects',`id=eq.${id}`);
    else if(type==='finance_transaction'){ await DEL('finance_transactions',`id=eq.${id}`); FINANCE_LOADED=false; }
    if(type==='finance_transaction'){
      await loadFinanceData();
      if(FIN_TAB==='transactions') loadTransactions();
    } else {
      await loadAll();
    }
    closeConfirm();
  }catch(e){ hide('loadingOverlay'); alert('ลบไม่ได้: '+e.message); }
}
