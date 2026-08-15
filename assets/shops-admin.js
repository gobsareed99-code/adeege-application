(function(){
'use strict';
const API='https://tjwoqvqfavxqykvbasaf.supabase.co';
const KEY='sb_publishable_3XeoEp9EqRqPLPIm5Cwthg_Pf1lEYUZ';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let stores=[],editing=null,token='';
function msg(text,err=false){const x=$('#formMsg');if(!x)return;x.textContent=text;x.className='msg show'+(err?' err':'')}
function setAccess(text){const x=$('#accessNotice');if(x)x.textContent=text}
function getToken(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';
      if(k.startsWith('sb-')&&k.endsWith('-auth-token')){
        const raw=JSON.parse(localStorage.getItem(k)||'{}');
        const t=raw?.access_token||raw?.currentSession?.access_token;
        if(t)return t;
      }
    }
  }catch(e){}
  return '';
}
async function api(path,opts={}){
  const c=new AbortController();const timer=setTimeout(()=>c.abort(),8000);
  try{
    const headers={apikey:KEY,Authorization:'Bearer '+token,...(opts.headers||{})};
    const r=await fetch(API+path,{...opts,headers,signal:c.signal});
    const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
    if(!r.ok)throw new Error(data?.message||data?.error_description||data?.error||('Request failed: '+r.status));
    return data;
  }finally{clearTimeout(timer)}
}
async function rpc(name,body={}){return api('/rest/v1/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
async function requireAdmin(){
  token=getToken();
  if(!token){setAccess('🔐 Admin login required. Please log in to ADEEGE first.');$('#shopsList').innerHTML='<div class="empty">Please log in from the main ADEEGE page, then return here.</div>';return false}
  setAccess('🔐 Verifying administrator…');
  const ok=await rpc('adeege_is_admin');
  if(!ok){setAccess('⛔ Admin access required.');$('#shopsList').innerHTML='<div class="empty">This page is only available to the ADEEGE administrator.</div>';return false}
  setAccess('✅ Administrator verified. You can create and manage market shops.');$('#shopForm').style.display='block';return true;
}
async function loadOwners(){
  const data=await api('/rest/v1/marketplace_profiles?select=id,full_name,phone,role&role=in.(seller,admin)&order=full_name.asc');
  $('#shopOwner').innerHTML='<option value="">ADEEGE managed / unassigned</option>'+(data||[]).map(x=>`<option value="${x.id}">${esc(x.full_name||'Seller')} · ${esc(x.phone||x.role)}</option>`).join('');
}
async function loadStores(){
  $('#shopsList').innerHTML='<div class="empty">Loading shops…</div>';
  stores=await api('/rest/v1/marketplace_stores?select=*&order=created_at.desc')||[];
  renderStores();
}
function renderStores(){
  const q=($('#shopSearch')?.value||'').trim().toLowerCase();
  const rows=stores.filter(s=>!q||[s.name,s.category,s.location,s.phone,s.whatsapp,s.email].some(v=>String(v||'').toLowerCase().includes(q)));
  $('#shopCount').textContent=`${rows.length} shop${rows.length===1?'':'s'}`;
  $('#shopsList').innerHTML=rows.length?rows.map(s=>`<article class="shop"><img src="${esc(s.logo_url||'assets/adeege-logo.jpg')}" alt=""><div><h3>${esc(s.name)} ${s.verified?'✓':''}</h3><p>📍 ${esc(s.location||'Mogadishu')} ${s.category?'· '+esc(s.category):''}</p><p>${s.phone?'📞 '+esc(s.phone):''}${s.whatsapp?' · WhatsApp '+esc(s.whatsapp):''}</p><span class="badge ${s.status==='approved'?'':'off'}">${esc(s.status)}</span></div><div class="shop-actions"><button class="mini" data-edit="${s.id}">Edit</button><button class="mini" data-toggle="${s.id}" data-next="${s.status==='approved'?'rejected':'approved'}">${s.status==='approved'?'Suspend':'Activate'}</button></div></article>`).join(''):'<div class="empty">No shops found.</div>';
  $$('[data-edit]').forEach(b=>b.onclick=()=>editStore(b.dataset.edit));
  $$('[data-toggle]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await api('/rest/v1/marketplace_stores?id=eq.'+encodeURIComponent(b.dataset.toggle),{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({status:b.dataset.next,updated_at:new Date().toISOString()})});await loadStores()}catch(e){alert(e.message||String(e))}finally{b.disabled=false}});
}
function resetForm(){editing=null;$('#shopForm').reset();$('#shopVerified').checked=false;$('#logoPreview').classList.remove('show');$('#formTitle').textContent='Add New Market Shop';$('#saveShopBtn').textContent='Create Shop';$('#cancelEdit').style.display='none';$('#formMsg').className='msg'}
function editStore(id){const s=stores.find(x=>x.id===id);if(!s)return;editing=s;$('#formTitle').textContent='Edit Market Shop';$('#saveShopBtn').textContent='Save Changes';$('#cancelEdit').style.display='inline-block';$('#shopOwner').value=s.owner_id||'';$('#shopName').value=s.name||'';$('#shopCategory').value=s.category||'general';$('#shopPhone').value=s.phone||'';$('#shopWhatsapp').value=s.whatsapp||'';$('#shopEmail').value=s.email||'';$('#shopLocation').value=s.location||'';$('#shopAddress').value=s.address||'';$('#shopHours').value=s.business_hours||'';$('#shopFacebook').value=s.facebook_url||'';$('#shopTiktok').value=s.tiktok_url||'';$('#shopDescription').value=s.description||'';$('#shopVerified').checked=!!s.verified;if(s.logo_url){$('#logoPreview').src=s.logo_url;$('#logoPreview').classList.add('show')}window.scrollTo({top:0,behavior:'smooth'})}
async function uploadLogo(){const f=$('#shopLogo').files?.[0];if(!f)return editing?.logo_url||'';if(!f.type.startsWith('image/'))throw new Error('Please choose an image file.');if(f.size>5*1024*1024)throw new Error('Logo must be 5 MB or smaller.');const clean=(f.name||'logo.jpg').replace(/[^a-zA-Z0-9._-]/g,'-');const path='admin/'+Date.now()+'-'+clean;await api('/storage/v1/object/store-logos/'+encodeURIComponent(path).replace(/%2F/g,'/'),{method:'POST',headers:{'Content-Type':f.type,'x-upsert':'false'},body:f});return API+'/storage/v1/object/public/store-logos/'+path}
function bindEvents(){
  $('#shopLogo').onchange=()=>{const f=$('#shopLogo').files?.[0];if(!f)return;$('#logoPreview').src=URL.createObjectURL(f);$('#logoPreview').classList.add('show')};
  $('#shopSearch').oninput=renderStores;$('#cancelEdit').onclick=resetForm;
  $('#shopForm').onsubmit=async e=>{e.preventDefault();const btn=$('#saveShopBtn');btn.disabled=true;btn.textContent='Saving…';try{const logo=await uploadLogo();const payload={owner_id:$('#shopOwner').value||null,name:$('#shopName').value.trim(),category:$('#shopCategory').value,phone:$('#shopPhone').value.trim()||null,whatsapp:$('#shopWhatsapp').value.trim()||null,email:$('#shopEmail').value.trim()||null,location:$('#shopLocation').value.trim()||'Mogadishu',address:$('#shopAddress').value.trim()||null,business_hours:$('#shopHours').value.trim()||null,facebook_url:$('#shopFacebook').value.trim()||null,tiktok_url:$('#shopTiktok').value.trim()||null,description:$('#shopDescription').value.trim()||null,logo_url:logo||null,verified:$('#shopVerified').checked};if(!payload.name)throw new Error('Shop name is required.');if(editing){await api('/rest/v1/marketplace_stores?id=eq.'+encodeURIComponent(editing.id),{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({...payload,updated_at:new Date().toISOString()})});msg('Shop details updated successfully.')}else{await rpc('marketplace_admin_create_store',{p_owner_id:payload.owner_id,p_name:payload.name,p_category:payload.category,p_phone:payload.phone,p_whatsapp:payload.whatsapp,p_email:payload.email,p_location:payload.location,p_address:payload.address,p_description:payload.description,p_business_hours:payload.business_hours,p_logo_url:payload.logo_url,p_facebook_url:payload.facebook_url,p_tiktok_url:payload.tiktok_url,p_verified:payload.verified});msg('Market shop created and published successfully.')}await loadStores();setTimeout(resetForm,600)}catch(err){msg(err.name==='AbortError'?'Connection timed out. Please try again.':(err.message||String(err)),true)}finally{btn.disabled=false;btn.textContent=editing?'Save Changes':'Create Shop'}};
}
async function init(){bindEvents();setTimeout(async()=>{try{if(!await requireAdmin())return;await loadOwners();await loadStores()}catch(e){setAccess('⚠️ '+(e.name==='AbortError'?'Connection timed out.':(e.message||String(e))));$('#shopCount').textContent='Could not load shops';$('#shopsList').innerHTML='<div class="empty">Please return to the main ADEEGE page, confirm you are logged in, then open this page again.</div>'}},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();