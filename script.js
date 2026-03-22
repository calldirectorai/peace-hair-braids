(function(){
  var params=new URLSearchParams(window.location.search);
  var fields={};
  var paramMap={
    'first_name':'firstName','last_name':'lastName','full_name':'fullName',
    'email':'email','phone':'phone','company':'company',
    'city':'city','state':'state','country':'country'
  };
  var skipTags={'SCRIPT':1,'STYLE':1,'NOSCRIPT':1,'TEXTAREA':1,'CODE':1,'PRE':1};
  var hasUrlFields=false;
  for(var p in paramMap){
    var v=params.get(p);
    if(v){fields[paramMap[p]]=v;hasUrlFields=true;}
  }
  var contactId=params.get('contact_id');
  function esc(s){
    if(!s)return s;
    var d=document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }
  function doReplace(data){
    var r={};
    r['{{full_name}}']=esc(((data.firstName||'')+' '+(data.lastName||'')).trim()||((data.fullName||data.name)||''));
    r['{{first_name}}']=esc(data.firstName||(data.name?data.name.split(' ')[0]:'')||'');
    r['{{last_name}}']=esc(data.lastName||(data.name&&data.name.indexOf(' ')>-1?data.name.substring(data.name.indexOf(' ')+1):'')||'');
    r['{{email}}']=esc(data.email||'');
    r['{{phone}}']=esc(data.phone||'');
    r['{{company}}']=esc(data.company||'');
    r['{{city}}']=esc(data.city||'');
    r['{{state}}']=esc(data.state||'');
    r['{{country}}']=esc(data.country||'');
    r['{{date}}']=new Date().toLocaleDateString();
    r['{{time}}']=new Date().toLocaleTimeString();
    r['{{location}}']=[data.city,data.state,data.country].filter(Boolean).join(', ');
    r['{{tracking_id}}']=esc(data.trackingId||'');
    r['{{lastClickedProduct}}']=esc(data.lastClickedProduct||'');
    r['{{lastProductClickDate}}']=esc(data.lastProductClickDate||'');
    r['{{lastClickedProductPrice}}']=esc(data.lastClickedProductPrice||'');
    r['{{lastClickedProductURL}}']=esc(data.lastClickedProductURL||'');
    r['{{productsClickedCount}}']=esc(data.productsClickedCount||'0');
    r['{{ip_address}}']=esc(data.ipAddress||'');
    r['{{ip}}']=esc(data.ipAddress||'');
    if(data.customFields){
      for(var k in data.customFields){
        r['{{'+k+'}}']=esc(String(data.customFields[k]||''));
      }
    }
    params.forEach(function(v,k){
      if(!paramMap[k]&&k!=='contact_id'&&k!=='page_id'&&k.indexOf('utm_')!==0){
        r['{{'+k+'}}']=esc(v);
      }
    });
    var hasValues=false;
    for(var key in r){if(r[key]){hasValues=true;break;}}
    if(!hasValues)return;
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode:function(n){
        var p=n.parentNode;
        if(p&&skipTags[p.nodeName])return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while(node=walker.nextNode()){
      var txt=node.nodeValue;
      if(txt&&txt.indexOf('{{')>-1){
        var changed=txt;
        for(var ph in r){
          if(r[ph]&&changed.indexOf(ph)>-1){
            changed=changed.split(ph).join(r[ph]);
          }
        }
        if(changed!==txt)node.nodeValue=changed;
      }
    }
    var attrs=['value','placeholder','content','alt','title'];
    attrs.forEach(function(attr){
      var els=document.querySelectorAll('['+attr+'*="{{"]');
      for(var i=0;i<els.length;i++){
        var tag=els[i].tagName;
        if(skipTags[tag])continue;
        var val=els[i].getAttribute(attr);
        if(val){
          var nv=val;
          for(var ph in r){
            if(r[ph]&&nv.indexOf(ph)>-1){
              nv=nv.split(ph).join(r[ph]);
            }
          }
          if(nv!==val)els[i].setAttribute(attr,nv);
        }
      }
    });
  }
  function run(){
    if(contactId){
      var xhr=new XMLHttpRequest();
      xhr.open('GET','https://paymegpt.com/api/landing/context/'+encodeURIComponent(contactId)+'?page_id=2168');
      xhr.onload=function(){
        if(xhr.status===200){
          try{
            var resp=JSON.parse(xhr.responseText);
            if(resp.success&&resp.contact){
              var merged=resp.contact;
              for(var k in fields){merged[k]=fields[k];}
              doReplace(merged);
              return;
            }
          }catch(e){}
        }
        if(hasUrlFields)doReplace(fields);
      };
      xhr.onerror=function(){if(hasUrlFields)doReplace(fields);};
      xhr.send();
    }else if(hasUrlFields){
      doReplace(fields);
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);}
  else{run();}
})();

(function(){
  var slug='SMKVjCpNi';
  var apiBase='https://paymegpt.com';
  function findEmail(){
    var ids=['email','emailAddress','buyer-email','buyerEmail','user-email','userEmail','checkout-email','customer-email','contact-email'];
    for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&el.value&&el.value.includes('@'))return el.value.trim();}
    var inputs=document.querySelectorAll('input[type="email"],input[name*="email"],input[placeholder*="email"],input[placeholder*="Email"]');
    for(var j=0;j<inputs.length;j++){if(inputs[j].value&&inputs[j].value.includes('@'))return inputs[j].value.trim();}
    return '';
  }
  function findName(){
    var ids=['name','fullName','full-name','buyer-name','buyerName','customer-name','userName','user-name'];
    for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&el.value)return el.value.trim();}
    var inputs=document.querySelectorAll('input[name*="name"]:not([name*="email"]):not([type="email"]),input[placeholder*="name"]:not([placeholder*="email"]):not([type="email"]),input[placeholder*="Name"]:not([type="email"])');
    for(var j=0;j<inputs.length;j++){if(inputs[j].value)return inputs[j].value.trim();}
    return '';
  }
  var __realProcessPayment=function(a,b,c,d,e){
    var amountCents,email,productName,productDescription,customerName,quantity;
    if(a&&typeof a==='object'){
      amountCents=a.amountCents;email=a.email;productName=a.productName;
      productDescription=a.productDescription||'';customerName=a.name||'';quantity=a.quantity||1;
    }else{
      amountCents=typeof a==='number'?a:0;productName=typeof b==='string'?b:'';
      productDescription=typeof c==='string'?c:'';email='';customerName='';quantity=1;
    }
    if(!email)email=findEmail();
    if(!customerName)customerName=findName();
    if(!productName){alert('Product name is required.');return Promise.reject('no_product_name');}
    if(!amountCents||amountCents<100){alert('Amount must be at least $1.00');return Promise.reject('invalid_amount');}
    if(!email){alert('Please enter your email address.');return Promise.reject('no_email');}
    var successBase=window.location.href.split('?')[0];
    return fetch(apiBase+'/api/landing-pages/public/'+slug+'/payment/checkout',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,name:customerName,amountCents:amountCents,productName:productName,productDescription:productDescription,quantity:quantity,successUrl:successBase+'?payment=success&product='+encodeURIComponent(productName)+'&session_id={CHECKOUT_SESSION_ID}',cancelUrl:successBase+'?payment=cancelled'})
    }).then(function(r){return r.json();}).then(function(d){
      if(d.checkoutUrl){window.location.href=d.checkoutUrl;}
      else{alert(d.error||'Failed to process payment');throw new Error(d.error);}
    });
  };
  Object.defineProperty(window,'__processPayment',{value:__realProcessPayment,writable:false,configurable:false});
  document.addEventListener('DOMContentLoaded',function(){
    var urlParams=new URLSearchParams(window.location.search);
    if(urlParams.get('payment')==='success'){
      var pName=urlParams.get('product')||'your item';
      var overlay=document.createElement('div');overlay.id='payment-success-overlay';
      overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;';
      overlay.innerHTML='<div style="background:white;border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.15);"><div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div><h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111827;">Payment Successful!</h2><p style="margin:0 0 24px;color:#6b7280;font-size:16px;">Thank you for purchasing '+pName.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'.</p><button onclick="document.getElementById(\'payment-success-overlay\').remove();window.history.replaceState({},\'\',window.location.pathname);" style="padding:12px 32px;font-size:16px;font-weight:600;background:#16a34a;color:white;border:none;border-radius:8px;cursor:pointer;">Continue</button></div>';
      document.body.appendChild(overlay);
    }
  });
})();

let currentPage='home';
function navigateTo(pg){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  var el=document.getElementById('page-'+pg);
  if(el)el.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l=>{l.classList.toggle('ac',l.dataset.page===pg)});
  currentPage=pg;window.scrollTo({top:0,behavior:'smooth'});
  document.getElementById('mt').classList.remove('open');document.getElementById('mm').classList.remove('open');document.body.style.overflow='';
  setTimeout(initReveals,100);
}
const n=document.getElementById('nav');window.addEventListener('scroll',()=>{n.classList.toggle('scrolled',window.scrollY>20)});
const t=document.getElementById('mt'),m=document.getElementById('mm');
t.addEventListener('click',()=>{t.classList.toggle('open');m.classList.toggle('open');document.body.style.overflow=m.classList.contains('open')?'hidden':''});
function initReveals(){const ob=new IntersectionObserver(e=>{e.forEach((x,i)=>{if(x.isIntersecting){setTimeout(()=>x.target.classList.add('v'),i*60);ob.unobserve(x.target)}})},{threshold:.08,rootMargin:'0px 0px -30px 0px'});document.querySelectorAll('.fu:not(.v)').forEach(e=>ob.observe(e));}
initReveals();

var currentStep=1;
function goToStep(s){if(s===2){var nm=document.getElementById('f_name').value,ph=document.getElementById('f_phone').value;if(!nm||!ph){alert('Please enter your name and phone number.');return}}if(s===3){var sv=document.getElementById('f_service').value;if(!sv){alert('Please select a service.');return}}currentStep=s;document.querySelectorAll('#intakeForm .form-page').forEach(function(p){p.classList.remove('active')});document.getElementById('formPage'+s).classList.add('active');var dots=document.querySelectorAll('#formSteps .form-step-dot');dots.forEach(function(d,i){d.className='form-step-dot';if(i<s-1)d.classList.add('done');if(i===s-1)d.classList.add('active')});}
function selectToggle(el,groupId){document.querySelectorAll('#'+groupId+' .form-toggle').forEach(function(t){t.classList.remove('selected')});el.classList.add('selected');}
function getToggleValue(groupId){var sel=document.querySelector('#'+groupId+' .form-toggle.selected');return sel?sel.textContent.trim():'';}
function submitLeadForm(){var btn=document.getElementById('submitBtn');btn.disabled=true;btn.textContent='Submitting...';var payload={contactPhone:document.getElementById('f_phone').value.replace(/[^0-9]/g,''),contactName:document.getElementById('f_name').value,webhook_name:document.getElementById('f_name').value,webhook_phone:document.getElementById('f_phone').value,webhook_email:document.getElementById('f_email').value||'',webhook_service:document.getElementById('f_service').value,webhook_date:document.getElementById('f_date').value||'',webhook_hair:getToggleValue('f_hair'),webhook_firsttime:getToggleValue('f_firsttime'),webhook_message:document.getElementById('f_message').value||'',webhook_source:'Peace Hair Braiding Website'};fetch('https://paymegpt.com/api/webhooks/flow/ci14y1f1/063054d351baf95ad04fc80c3070abcbb1aec1c330608773407bd310f9f102c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(){showSuccess()}).catch(function(){showSuccess()});}
function showSuccess(){document.querySelectorAll('#intakeForm .form-page').forEach(function(p){p.classList.remove('active')});document.querySelectorAll('#formSteps,#intakeForm h3,#intakeForm .form-sub').forEach(function(e){e.style.display='none'});document.getElementById('formSuccess').classList.add('show');startResetTimer();}
function resetLeadForm(){document.getElementById('formSuccess').classList.remove('show');document.querySelectorAll('#formSteps,#intakeForm h3,#intakeForm .form-sub').forEach(function(e){e.style.display=''});document.getElementById('formPage1').classList.add('active');var dots=document.querySelectorAll('#formSteps .form-step-dot');dots.forEach(function(d,i){d.className='form-step-dot';if(i===0)d.classList.add('active')});document.getElementById('f_name').value='';document.getElementById('f_phone').value='';document.getElementById('f_email').value='';document.getElementById('f_service').selectedIndex=0;document.getElementById('f_date').value='';document.getElementById('f_message').value='';document.querySelectorAll('#intakeForm .form-toggle').forEach(function(t){t.classList.remove('selected')});document.getElementById('submitBtn').disabled=false;document.getElementById('submitBtn').innerHTML='Submit Request <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';currentStep=1;clearInterval(window._resetInterval);}
function startResetTimer(){var sec=15;var el=document.getElementById('formTimer');el.textContent='Form resets in '+sec+'s';window._resetInterval=setInterval(function(){sec--;el.textContent='Form resets in '+sec+'s';if(sec<=0){clearInterval(window._resetInterval);resetLeadForm()}},1000);}

function ncGoToStep(s){if(s===2){var n=document.getElementById('nc_name').value,p=document.getElementById('nc_phone').value;if(!n||!p){alert('Please enter your name and phone number.');return}}if(s===3){var sv=document.getElementById('nc_service').value;if(!sv){alert('Please select a service.');return}}document.querySelectorAll('#intakeForm2 .form-page').forEach(function(p){p.classList.remove('active')});document.getElementById('nc_formPage'+s).classList.add('active');var dots=document.querySelectorAll('#formSteps2 .form-step-dot');dots.forEach(function(d,i){d.className='form-step-dot';if(i<s-1)d.classList.add('done');if(i===s-1)d.classList.add('active')});}
function ncSubmit(){var btn=document.getElementById('nc_submitBtn');btn.disabled=true;btn.textContent='Submitting...';var payload={contactPhone:document.getElementById('nc_phone').value.replace(/[^0-9]/g,''),contactName:document.getElementById('nc_name').value,webhook_name:document.getElementById('nc_name').value,webhook_phone:document.getElementById('nc_phone').value,webhook_email:document.getElementById('nc_email').value||'',webhook_service:document.getElementById('nc_service').value,webhook_date:document.getElementById('nc_date').value||'',webhook_hair:getToggleValue('nc_hair'),webhook_firsttime:'Yes — first visit!',webhook_message:document.getElementById('nc_message').value||'',webhook_source:'Peace Hair Braiding Website — New Client Page'};fetch('https://paymegpt.com/api/webhooks/flow/ci14y1f1/063054d351baf95ad04fc80c3070abcbb1aec1c330608773407bd310f9f102c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(){ncShowSuccess()}).catch(function(){ncShowSuccess()});}
function ncShowSuccess(){document.querySelectorAll('#intakeForm2 .form-page').forEach(function(p){p.classList.remove('active')});document.querySelectorAll('#formSteps2').forEach(function(e){e.style.display='none'});document.getElementById('nc_formSuccess').classList.add('show');var sec=15;var el=document.getElementById('nc_formTimer');el.textContent='Form resets in '+sec+'s';window._ncResetInterval=setInterval(function(){sec--;el.textContent='Form resets in '+sec+'s';if(sec<=0){clearInterval(window._ncResetInterval);ncReset()}},1000);}
function ncReset(){document.getElementById('nc_formSuccess').classList.remove('show');document.querySelectorAll('#formSteps2').forEach(function(e){e.style.display=''});document.getElementById('nc_formPage1').classList.add('active');var dots=document.querySelectorAll('#formSteps2 .form-step-dot');dots.forEach(function(d,i){d.className='form-step-dot';if(i===0)d.classList.add('active')});document.getElementById('nc_name').value='';document.getElementById('nc_phone').value='';document.getElementById('nc_email').value='';document.getElementById('nc_service').selectedIndex=0;document.getElementById('nc_date').value='';document.getElementById('nc_message').value='';document.querySelectorAll('#intakeForm2 .form-toggle').forEach(function(t){t.classList.remove('selected')});document.getElementById('nc_submitBtn').disabled=false;document.getElementById('nc_submitBtn').innerHTML='Submit Request <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';clearInterval(window._ncResetInterval);}

function submitVip(){
  var name=document.getElementById('vip_name').value;
  var phone=document.getElementById('vip_phone').value;
  var email=document.getElementById('vip_email').value;
  if(!phone&&!email){alert('Please enter your phone number or email.');return}
  var btn=document.getElementById('vipBtn');btn.disabled=true;btn.textContent='Joining...';
  var payload={
    contactPhone:phone.replace(/[^0-9]/g,''),
    contactName:name,
    webhook_name:name,
    webhook_phone:phone,
    webhook_email:email,
    webhook_service:'VIP List Signup',
    webhook_date:'',
    webhook_hair:'',
    webhook_firsttime:'',
    webhook_message:'VIP List subscriber',
    webhook_source:'Peace Hair Braiding Website — VIP Signup'
  };
  fetch('https://paymegpt.com/api/webhooks/flow/ci14y1f1/063054d351baf95ad04fc80c3070abcbb1aec1c330608773407bd310f9f102c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  .then(function(){vipShowSuccess()}).catch(function(){vipShowSuccess()});
}
function vipShowSuccess(){
  document.getElementById('vipForm').style.display='none';
  document.getElementById('vipSuccess').classList.add('show');
  setTimeout(function(){
    document.getElementById('vipForm').style.display='flex';
    document.getElementById('vipSuccess').classList.remove('show');
    document.getElementById('vip_name').value='';document.getElementById('vip_phone').value='';document.getElementById('vip_email').value='';
    document.getElementById('vipBtn').disabled=false;document.getElementById('vipBtn').innerHTML='Join VIP <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  },10000);
}

function submitVipFt(){
  var name=document.getElementById('vip_name_ft').value;
  var phone=document.getElementById('vip_phone_ft').value;
  var email=document.getElementById('vip_email_ft').value;
  if(!phone&&!email){alert('Please enter your phone or email.');return}
  var btn=document.getElementById('vipBtnFt');btn.disabled=true;btn.textContent='Joining...';
  var payload={
    contactPhone:phone.replace(/[^0-9]/g,''),
    contactName:name,
    webhook_name:name,
    webhook_phone:phone,
    webhook_email:email,
    webhook_service:'VIP List Signup',
    webhook_date:'',webhook_hair:'',webhook_firsttime:'',
    webhook_message:'VIP List subscriber (footer)',
    webhook_source:'Peace Hair Braiding Website — VIP Footer'
  };
  fetch('https://paymegpt.com/api/webhooks/flow/ci14y1f1/063054d351baf95ad04fc80c3070abcbb1aec1c330608773407bd310f9f102c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  .then(function(){vipFtSuccess()}).catch(function(){vipFtSuccess()});
}
function vipFtSuccess(){
  document.getElementById('vipFormFt').style.display='none';
  document.getElementById('vipSuccessFt').classList.add('show');
  setTimeout(function(){
    document.getElementById('vipFormFt').style.display='flex';
    document.getElementById('vipSuccessFt').classList.remove('show');
    document.getElementById('vip_name_ft').value='';document.getElementById('vip_phone_ft').value='';document.getElementById('vip_email_ft').value='';
    document.getElementById('vipBtnFt').disabled=false;document.getElementById('vipBtnFt').innerHTML='Join <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  },10000);
}

function submitVipH(){
  var name=document.getElementById('vip_name_h').value;
  var phone=document.getElementById('vip_phone_h').value;
  var email=document.getElementById('vip_email_h').value;
  if(!phone&&!email){alert('Please enter your phone or email.');return}
  var btn=document.getElementById('vipBtnH');btn.disabled=true;btn.textContent='Joining...';
  var payload={
    contactPhone:phone.replace(/[^0-9]/g,''),
    contactName:name,
    webhook_name:name,
    webhook_phone:phone,
    webhook_email:email,
    webhook_service:'VIP List Signup',
    webhook_date:'',webhook_hair:'',webhook_firsttime:'',
    webhook_message:'VIP List subscriber (homepage)',
    webhook_source:'Peace Hair Braiding Website — VIP Homepage'
  };
  fetch('https://paymegpt.com/api/webhooks/flow/ci14y1f1/063054d351baf95ad04fc80c3070abcbb1aec1c330608773407bd310f9f102c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  .then(function(){vipHSuccess()}).catch(function(){vipHSuccess()});
}
function vipHSuccess(){
  document.getElementById('vipFormH').style.display='none';
  document.getElementById('vipSuccessH').classList.add('show');
  setTimeout(function(){
    document.getElementById('vipFormH').style.display='flex';
    document.getElementById('vipSuccessH').classList.remove('show');
    document.getElementById('vip_name_h').value='';document.getElementById('vip_phone_h').value='';document.getElementById('vip_email_h').value='';
    document.getElementById('vipBtnH').disabled=false;document.getElementById('vipBtnH').innerHTML='Join VIP <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  },10000);
}