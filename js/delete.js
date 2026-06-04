// =====================================================================
// DELETE
// =====================================================================
function askDel(type,id,name){ PENDING_DEL={type,id}; document.getElementById('confirmMsg').textContent=`"${name}" จะถูกลบออกจากระบบ`; document.getElementById('confirmOverlay').classList.add('open'); }
function closeConfirm(){ PENDING_DEL=null; document.getElementById('confirmOverlay').classList.remove('open'); }
async function confirmDel(){
  if(!PENDING_DEL)return;
  const {type,id}=PENDING_DEL;
  show('loadingOverlay','flex');
  try{
    if(type==='proc') await DEL('procurement_items',`id=eq.${id}`);
    else if(type==='project') await DEL('projects',`id=eq.${id}`);
    await loadAll(); closeConfirm();
  }catch(e){ hide('loadingOverlay'); alert('ลบไม่ได้: '+e.message); }
}
