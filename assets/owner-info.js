(()=>{'use strict';
function footer(){const c=document.querySelector('.footer .copyright');if(!c)return;const first=c.querySelector('span');if(first)first.innerHTML='ADEEGE APPLICATION © 2026 · Founded &amp; Managed by <strong>SHARMAKE</strong>'}
function start(){footer()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()})();