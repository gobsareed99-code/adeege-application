(()=>{'use strict';
const API='https://tjwoqvqfavxqykvbasaf.supabase.co';
const KEY='sb_publishable_3XeoEp9EqRqPLPIm5Cwthg_Pf1lEYUZ';
let sb=null,isAdmin=false,checking=false;

function ensureLanguageSwitcher(){
  const actions=document.querySelector('.head-actions');
  if(!actions)return;
  let wrap=document.getElementById('adeegeCoreLang');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='adeegeCoreLang';
    wrap.setAttribute('aria-label','Language switcher');
    wrap.style.cssText='display:flex!important;align-items:center;gap:4px;border:1px solid #dfe7e2;border-radius:10px;padding:3px;background:#fff;flex:0 0 auto;position:relative;z-index:30';
    const make=(code,label)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.coreLang=code;b.style.cssText='border:0;border-radius:7px;padding:7px 10px;background:transparent;color:#17352a;font-weight:900;font-size:11px;cursor:pointer';b.addEventListener('click',()=>{const original=document.querySelector(`.lang-mini[data-lang="${code}"]`);if(original)original.click();else{localStorage.setItem('adeege_language',code);location.reload()}syncLanguage()});return b};
    wrap.append(make('en','EN'),make('so','SO'));
    actions.prepend(wrap);
  }
  function syncLanguage(){const active=localStorage.getItem('adeege_language')||document.documentElement.lang||'en';wrap.querySelectorAll('[data-core-lang]').forEach(b=>{const on=b.dataset.coreLang===active;b.style.background=on?'#0b7f40':'transparent';b.style.color=on?'#fff':'#17352a'})}
  syncLanguage();
}

function protectAdminDom(){
  const modal=document.getElementById('dashboardModal');
  const account=document.getElementById('accountBtn');
  const label=document.getElementById('accountLabel');
  const dash=document.getElementById('dashboardQuick');
  const role=document.getElementById('dashRole');
  if(modal)modal.dataset.adeegeCore='admin-dashboard';
  if(account)account.dataset.adeegeCore='account';
  if(dash)dash.dataset.adeegeCore='dashboard-entry';
  if(isAdmin){
    if(label)label.textContent='Admin';
    if(dash){dash.style.display='';dash.dataset.adminCore='true'}
    if(role&&document.getElementById('dashboardModal')?.classList.contains('show'))role.textContent='ADMIN';
  }
}

async function initAdminProtection(){
  if(checking)return;checking=true;
  try{
    if(!sb){const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');sb=mod.createClient(API,KEY)}
    const {data:{session}}=await sb.auth.getSession();
    if(!session){isAdmin=false;protectAdminDom();return}
    const {data,error}=await sb.rpc('adeege_is_admin');
    isAdmin=!error&&data===true;
    protectAdminDom();
    if(!window.__adeegeCoreAuthBound){window.__adeegeCoreAuthBound=true;sb.auth.onAuthStateChange(()=>setTimeout(()=>{checking=false;initAdminProtection()},100))}
  }catch(e){console.warn('ADEEGE core admin protection unavailable',e)}finally{checking=false}
}

function protectCore(){
  document.documentElement.dataset.adeegeCore='protected-v2';
  ensureLanguageSwitcher();
  protectAdminDom();
  initAdminProtection();
}
let timer;
const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{ensureLanguageSwitcher();protectAdminDom()},60)});
function start(){protectCore();obs.observe(document.body,{childList:true,subtree:true});setInterval(()=>{ensureLanguageSwitcher();protectAdminDom();initAdminProtection()},5000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();