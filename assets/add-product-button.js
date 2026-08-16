(()=>{'use strict';
const API='https://tjwoqvqfavxqykvbasaf.supabase.co';
const KEY='sb_publishable_3XeoEp9EqRqPLPIm5Cwthg_Pf1lEYUZ';
let sb;
function toast(text){const t=document.getElementById('toast');if(t){t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}else alert(text)}
async function getClient(){if(sb)return sb;const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');sb=mod.createClient(API,KEY);return sb}
async function openProductForm(){const client=await getClient();const {data:{session}}=await client.auth.getSession();if(!session){document.getElementById('accountBtn')?.click();toast('Please log in with your seller account first.');return}
const {data:stores,error}=await client.from('marketplace_stores').select('id,name,status').eq('owner_id',session.user.id).limit(5);if(error){toast('Seller access could not be verified. Please try again.');return}
const approved=(stores||[]).find(s=>s.status==='approved');if(!approved){toast('You need an approved ADEEGE shop before adding products.');return}
const modal=document.getElementById('sellerProductModal');if(!modal){toast('Product form is unavailable. Please refresh the page.');return}
const form=document.getElementById('sellerProductForm');if(form){form.dataset.storeId=approved.id;form.dataset.storeName=approved.name||''}
const msg=document.getElementById('sellerProductMsg');if(msg){msg.textContent='';msg.className='form-message'}
modal.classList.add('show');document.getElementById('sellerProductName')?.focus();}
function label(){return (localStorage.getItem('adeege_language')||document.documentElement.lang)==='so'?'➕ Ku dar Alaab':'➕ Add Product'}
function addButton(){const nav=document.querySelector('.nav .container');if(!nav)return;let btn=document.getElementById('adeegeAddProductBtn');if(!btn){btn=document.createElement('button');btn.id='adeegeAddProductBtn';btn.type='button';btn.style.cssText='display:inline-flex;align-items:center;gap:6px;border:1px solid #0b7f40;border-radius:9px;padding:10px 14px;background:#fff;color:#0b7f40;font-weight:900;cursor:pointer;white-space:nowrap';btn.addEventListener('click',()=>openProductForm());const productLink=[...nav.querySelectorAll('a,button')].find(el=>/products|alaabo/i.test((el.textContent||'').trim()));if(productLink?.nextSibling)nav.insertBefore(btn,productLink.nextSibling);else nav.appendChild(btn)}btn.textContent=label();}
function start(){addButton();const nav=document.querySelector('.nav .container');if(nav)new MutationObserver(addButton).observe(nav,{childList:true});window.addEventListener('storage',addButton)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();