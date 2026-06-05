// =====================================================================
// CONFIG & SUPABASE
// =====================================================================
const CFG_KEY = 'sb_config_v1';

function getConfig(){
  try{ return JSON.parse(localStorage.getItem(CFG_KEY))||null }catch{ return null }
}
function setConfig(url,key){
  localStorage.setItem(CFG_KEY, JSON.stringify({url:url.replace(/\/$/,''), key}));
}
function resetConfig(){
  if(!confirm('ล้างการตั้งค่า Supabase?')) return;
  localStorage.removeItem(CFG_KEY);
  location.reload();
}

// Supabase fetch wrapper
async function sb(method, table, opts={}){
  const cfg = getConfig();
  if(!cfg) throw new Error('No config');
  let url = `${cfg.url}/rest/v1/${table}`;
  if(opts.query) url += '?'+opts.query;
  const res = await fetch(url, {
    method,
    headers:{
      'apikey': cfg.key,
      'Authorization': `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      'Prefer': method==='POST'?'return=representation':'return=minimal',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if(!res.ok){
    const err = await res.json().catch(()=>({message:res.statusText}));
    throw new Error(err.message||res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const GET  = (t,q)     => sb('GET',t,{query:q});
const POST = (t,b)     => sb('POST',t,{body:b});
const PATCH= (t,q,b)   => sb('PATCH',t,{query:q,body:b});
const DEL  = (t,q)     => sb('DELETE',t,{query:q});
