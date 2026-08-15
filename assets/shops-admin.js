(function(){
'use strict';
const SUPABASE_URL='https://tjwoqvqfavxqykvbasaf.supabase.co';
const SUPABASE_KEY='sb_publishable_3XeoEp9EqRqPLPIm5Cwthg_Pf1lEYUZ';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let sb=null,stores=[],editing=null,session=null;
function msg(text,err=false){const x=$('#formMsg');if(!x)return;x.textContent=text;x.className='msg show'+(err?' err':'')}
function setAccess(text){const x=$('#accessNotice');if(x)x.textContent=text}
function timeout(promise,ms=12000){return Promise.race([promise,new Promise((_,rej)=>setTimeout(()=>rej(new Error('Connection timed out. Please refresh and try again.')),ms))])}
async function requireAdmin(){
  setAccess('🔐 Checking administrator access...');
  const r=await timeout(sb.auth.getSession());session=r.data.session;
  if(!session){setAccess('🔐 Admin login required. Please log in to ADEEGE first.');$('#shopForm').style.display='none';$('#shopsList').innerHTML='<div class="empty">Please log in from the main ADEEGE page, then return here.</div>';return false}
  const a=await timeout(sb.rpc('adeege_is_admin'));
  if(a.error||!a.data){setAccess('⛔ Admin access required.');$('#shopForm').style.display='none';$('#shopsList').innerHTML='<div class="empty">This page is only available to the ADEEGE administrator.</div>';return false}
  setAccess('✅ Administrator verified. You can create and manage market shops.');
  return true;
}
async function loadOwners(){
  const r=await timeout(sb.from('marketplace_profiles').select('id,full_name,phone,role').in('role',['seller','admin']).order('full_name'));
  if(r.error)throw r.error;
  $('#shopOwner').innerHTML='<option value="">ADEEGE managed / unassigned</option>'+(r.data||[]).map(x=>`<option value="${x.id}">${esc(x.full_name||'Seller')} · ${esc(x.phone||x.role)}</option>`).join('');
}
async function loadStores(){
  $('#shopsList').innerHTML='<div class="empty">Loading shops...</div>';
  const r=await timeout(sb.from('marketplace_stores').select('*').order('created_at',{ascending:false}));
  if(r.error)throw r.error;stores=r.data||[];renderStores();
}
function renderStores(){
  const q=($('#shopSearch')?.value||'').trim().toLowerCase();
  const rows=stores.filter(s=>!q||[s.name,s.category,s.location,s.phone,s.whatsapp,s.email].some(v=>String(v||'').toLowerCase().includes(q)));
  $('#shopCount').textContent=`${rows.length} shop${rows.length===1?'':'s'}`;
  $('#shopsList').innerHTML=rows.length?rows.map(s=>`<article class="shop"><img src="${esc(s.logo_url||'assets/adeege-logo.jpg')}" alt=""><div><h3>${esc(s.name)} ${s.verified?'✓':''}</h3><p>📍 ${esc(s.location||'Mogadishu')} ${s.category?'· '+esc(s.category):''}</p><p>${s.phone?'📞 '+esc(s.phone):''}${s.whatsapp?' · WhatsApp '+esc(s.whatsapp):''}</p><span class="badge ${s.status==='approved'?'':'off'}">${esc(s.status)}</span></div><div class="shop-actions"><button class="mini" data-edit="${s.id}">Edit</button><button class="mini" data-toggle="${s.id}" data-next="${s.status==='approved'?'rejected':'approved'}">${s.status==='approved'?'Suspend':'Activate'}</button></div></article>`).join(''):'<div class="empty">No shops found.</div>';
  $$('[data-edit]').forEach(b=>b.onclick=()=>editStore(b.dataset.edit));
  $$('[data-toggle]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const r=await timeout(sb.from('marketplace_stores').update({status:b.dataset.next,updated_at:new Date().toISOString()}).eq('id',b.dataset.toggle));if(r.error)throw r.error;await loadStores()}catch(e){alert(e.message||String(e))}finally{b.disabled=false}});
}
function resetForm(){editing=null;$('#shopForm').reset();$('#shopVerified').checked=false;$('#logoPreview').classList.remove('show');$('#formTitle').textContent='Add New Market Shop';$('#saveShopBtn').textContent='Create Shop';$('#cancelEdit').style.display='none';$('#formMsg').className='msg'}
function editStore(id){const s=stores.find(x=>x.id===id);if(!s)return;editing=s;$('#formTitle').textContent='Edit Market Shop';$('#saveShopBtn').textContent='Save Changes';$('#cancelEdit').style.display='inline-block';$('#shopOwner').value=s.owner_id||'';$('#shopName').value=s.name||'';$('#shopCategory').value=s.category||'general';$('#shopPhone').value=s.phone||'';$('#shopWhatsapp').value=s.whatsapp||'';$('#shopEmail').value=s.email||'';$('#shopLocation').value=s.location||'';$('#shopAddress').value=s.address||'';$('#shopHours').value=s.business_hours||'';$('#shopFacebook').value=s.facebook_url||'';$('#shopTiktok').value=s.tiktok_url||'';$('#shopDescription').value=s.description||'';$('#shopVerified').checked=!!s.verified;if(s.logo_url){$('#logoPreview').src=s.logo_url;$('#logoPreview').classList.add('show')}window.scrollTo({top:0,behavior:'smooth'})}
async function uploadLogo(){const f=$('#shopLogo').files?.[0];if(!f)return editing?.logo_url||'';if(!f.type.startsWith('image/'))throw new Error('Please choose an image file.');if(f.size>5*1024*1024)throw new Error('Logo must be 5 MB or smaller.');const clean=(f.name||'logo.jpg').replace(/[^a-zA-Z0-9._-]/g,'-');const path=`admin/${Date.now()}-${clean}`;const up=await timeout(sb.storage.from('store-logos').upload(path,f,{contentType:f.type,cacheControl:'3600'}),20000);if(up.error)throw up.error;return sb.storage.from('store-logos').getPublicUrl(path).data.publicUrl}
function bindEvents(){
  $('#shopLogo').onchange=()=>{const f=$('#shopLogo').files?.[0];if(!f)return;$('#logoPreview').src=URL.createObjectURL(f);$('#logoPreview').classList.add('show')};
  $('#shopSearch').oninput=renderStores;$('#cancelEdit').onclick=resetForm;
  $('#shopForm').onsubmit=async e=>{e.preventDefault();const btn=$('#saveShopBtn');btn.disabled=true;btn.textContent='Saving...';try{const logo=await uploadLogo();const payload={owner_id:$('#shopOwner').value||null,name:$('#shopName').value.trim(),category:$('#shopCategory').value,phone:$('#shopPhone').value.trim()||null,whatsapp:$('#shopWhatsapp').value.trim()||null,email:$('#shopEmail').value.trim()||null,location:$('#shopLocation').value.trim()||'Mogadishu',address:$('#shopAddress').value.trim()||null,business_hours:$('#shopHours').value.trim()||null,facebook_url:$('#shopFacebook').value.trim()||null,tiktok_url:$('#shopTiktok').value.trim()||null,description:$('#shopDescription').value.trim()||null,logo_url:logo||null,verified:$('#shopVerified').checked};if(!payload.name)throw new Error('Shop name is required.');let r;if(editing){r=await timeout(sb.from('marketplace_stores').update({...payload,updated_at:new Date().toISOString()}).eq('id',editing.id));if(r.error)throw r.error;msg('Shop details updated successfully.')}else{r=await timeout(sb.rpc('marketplace_admin_create_store',{p_owner_id:payload.owner_id,p_name:payload.name,p_category:payload.category,p_phone:payload.phone,p_whatsapp:payload.whatsapp,p_email:payload.email,p_location:payload.location,p_address:payload.address,p_description:payload.description,p_business_hours:payload.business_hours,p_logo_url:payload.logo_url,p_facebook_url:payload.facebook_url,p_tiktok_url:payload.tiktok_url,p_verified:payload.verified}));if(r.error)throw r.error;msg('Market shop created and published successfully.')}await loadStores();setTimeout(resetForm,800)}catch(err){msg(err.message||String(err),true)}finally{btn.disabled=false;btn.textContent=editing?'Save Changes':'Create Shop'}};
}
async function init(){
  try{
    if(!window.supabase||!window.supabase.createClient)throw new Error('ADEEGE connection library failed to load. Please refresh the page.');
    sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    bindEvents();
    const ok=await requireAdmin();if(!ok)return;
    await loadOwners();
    await loadStores();
  }catch(e){setAccess('⚠️ '+(e.message||String(e)));$('#shopCount').textContent='Could not load shops';$('#shopsList').innerHTML='<div class="empty">'+esc(e.message||String(e))+'</div>'}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();