(()=>{'use strict';
const API='https://tjwoqvqfavxqykvbasaf.supabase.co';
const KEY='sb_publishable_3XeoEp9EqRqPLPIm5Cwthg_Pf1lEYUZ';
let sb=null,bound=false;
const $=s=>document.querySelector(s);
const getLang=()=>localStorage.getItem('adeege_language')||document.documentElement.lang||'en';
const text=(en,so)=>getLang()==='so'?so:en;
function showMsg(message,ok=false){const m=$('#checkoutMsg');if(m){m.textContent=message;m.className='form-message show '+(ok?'ok':'err')}const t=$('#toast');if(ok&&t){t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200)}}
function cart(){try{const x=JSON.parse(localStorage.getItem('adeege_v2_cart')||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
async function client(){if(sb)return sb;const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');sb=mod.createClient(API,KEY);return sb}
async function recent(after){try{const s=await client();const {data,error}=await s.rpc('marketplace_recent_order_confirmation',{p_after:after});if(error)throw error;return data&&data.order_id?data:null}catch{return null}}
async function waitForConfirmation(after,ms=18000){const start=Date.now();while(Date.now()-start<ms){const hit=await recent(after);if(hit)return hit;await new Promise(r=>setTimeout(r,1800))}return null}
function finish(order){localStorage.setItem('adeege_v2_cart','[]');const badge=$('#cartCount');if(badge)badge.textContent='0';const num=order?.order_number||'';showMsg(text(`Order ${num} placed successfully.`,`Dalabka ${num} si guul leh ayaa loo diray.`),true);const btn=$('#placeOrderBtn');if(btn){btn.disabled=true;btn.textContent=text('Order placed ✓','Dalab waa la diray ✓')}setTimeout(()=>{$('#checkoutModal')?.classList.remove('show');$('#cartModal')?.classList.remove('show');location.reload()},1800)}
async function handle(e){e.preventDefault();e.stopImmediatePropagation();const btn=$('#placeOrderBtn');if(!btn)return;btn.disabled=true;btn.textContent=text('Placing order...','Dalabka waa la dirayaa...');const started=new Date(Date.now()-3000).toISOString();try{const s=await client();const {data:{session}}=await s.auth.getSession();if(!session)throw new Error(text('Please log in first.','Fadlan marka hore gal akoonka.'));const items=cart();if(!items.length)throw new Error(text('Your cart is empty.','Gaarigaagu waa madhan yahay.'));const payment=$('#checkoutPayment')?.value||'cash_on_delivery';const payload={p_items:items,p_customer_name:$('#checkoutName')?.value.trim()||'',p_delivery_phone:$('#checkoutPhone')?.value.trim()||'',p_delivery_district:$('#checkoutDistrict')?.value||'',p_delivery_address:$('#checkoutAddress')?.value.trim()||'',p_delivery_notes:$('#checkoutNotes')?.value.trim()||null,p_payment_method:payment};if(!payload.p_customer_name||!payload.p_delivery_phone||!payload.p_delivery_district||!payload.p_delivery_address)throw new Error(text('Please complete all required checkout fields.','Fadlan buuxi dhammaan xogta qasabka ah ee checkout-ka.'));
const request=s.rpc('marketplace_place_order_v3',payload).then(({data,error})=>{if(error)throw error;return data?.[0]||null}).catch(()=>null);
const first=await Promise.race([request,new Promise(r=>setTimeout(()=>r(null),6500))]);if(first){finish(first);return}
const confirmed=await waitForConfirmation(started,16000);if(confirmed){finish(confirmed);return}
throw new Error(text('We could not confirm the order. Please check Orders before trying again.','Dalabka lama xaqiijin. Fadlan hubi qaybta Orders ka hor intaadan mar kale isku dayin.'));
}catch(err){showMsg(err.message||String(err),false);btn.disabled=false;btn.textContent=text('Place Order','Dir Dalabka')}}
function bind(){if(bound)return;const form=$('#checkoutForm');if(!form)return;bound=true;form.addEventListener('submit',handle,true);document.documentElement.dataset.checkoutOrderRecovery='active'}
function start(){bind();setInterval(bind,2500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();