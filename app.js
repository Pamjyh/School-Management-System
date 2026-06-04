// =====================================================================
// INIT & YEAR MANAGEMENT
// =====================================================================
async function init(){
  // Hard-coded config — ไม่ต้องกรอกทุกครั้ง
  setConfig('https://itugxavlgxihmatxcjkn.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dWd4YXZsZ3hpaG1hdHhjamtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTI1MDQsImV4cCI6MjA5NjEyODUwNH0.ScxlQ3QD0U-7xIyrIGTVcpwK85jC6S5POIxUuZELpMU');
  const cfg = getConfig();
  if(!cfg){
    hide('loadingOverlay');
    show('setupScreen','block');
    return;
  }
  try{
    await loadYears();
    await loadAll();
  }catch(e){
    showError(e.message);
  }finally{
    hide('loadingOverlay');
    show('mainApp');
    document.querySelector('.app').classList.add('show');
  }
}

function showError(msg){
  const old = document.getElementById('toast-error');
  if(old) old.remove();
  const el = document.createElement('div');
  el.id = 'toast-error';
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a18;color:#fff;padding:12px 20px;border-radius:20px;font-size:13px;font-weight:600;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.25);max-width:90vw;text-align:center;line-height:1.4';
  el.innerHTML = '⚠️ ' + msg + '<br><span style="font-weight:400;font-size:12px;opacity:.7">ลอง refresh หน้าเว็บ หรือตรวจสอบ Supabase Dashboard</span>';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 10000);
}

async function connectSupabase(){
  const url = document.getElementById('sbUrl').value.trim();
  const key = document.getElementById('sbKey').value.trim();
  if(!url||!key){ alert('กรุณาใส่ URL และ Key'); return; }
  setConfig(url,key);
  show('loadingOverlay','flex');
  hide('setupScreen');
  try{
    await loadYears();
    hide('loadingOverlay');
    show('mainApp');
    document.querySelector('.app').classList.add('show');
    await loadAll();
  }catch(e){
    hide('loadingOverlay');
    show('setupScreen','block');
    document.getElementById('setupError').style.display='block';
    document.getElementById('setupError').textContent = 'เชื่อมต่อไม่ได้: '+e.message;
  }
}

async function loadYears(){
  YEARS = await GET('years','select=*&order=year_be.desc');
  if(!YEARS||!YEARS.length){
    // Create default year
    const y = new Date().getFullYear()+543;
    const r = await POST('years',{year_be:y});
    YEARS = r||[{id:1,year_be:y}];
  }
  renderYearSel();
  if(!CY){ CY=YEARS[0].id; CYbe=YEARS[0].year_be; }
}

async function loadAll(){
  try{
    // Query แยกกัน เพื่อหลีกเลี่ยงปัญหา nested join
    PROJECTS = await GET('projects',`select=*&year_id=eq.${CY}&order=sort_order`)||[];
    PROC = await GET('procurement_items',`select=*&year_id=eq.${CY}&order=type,seq`)||[];
    // ดึง procurement counts ต่อ project แยกต่างหาก
    const procByProj = {};
    PROC.forEach(i=>{
      if(!i.project_id) return;
      if(!procByProj[i.project_id]) procByProj[i.project_id]={items:[]};
      procByProj[i.project_id].items.push(i);
    });
    // ใส่ procurement_items เข้า projects เพื่อใช้ใน dashboard
    PROJECTS = PROJECTS.map(p=>({...p, procurement_items: procByProj[p.id]?.items||[]}));
    // ใส่ project name เข้า proc items
    const projMap = {};
    PROJECTS.forEach(p=>projMap[p.id]=p);
    PROC = PROC.map(i=>({...i, projects: i.project_id?{name:projMap[i.project_id]?.name||''}:null}));
    renderDashboard();
    renderProjGrid();
    renderProc();
    fillProjSelects();
  }catch(e){
    showError('โหลดข้อมูลไม่ได้: '+e.message);
  }
}

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
  loadAll();
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

// =====================================================================
// DASHBOARD
// =====================================================================