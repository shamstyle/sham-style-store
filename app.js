
(()=>{
'use strict';

const $=id=>document.getElementById(id);

const KEY='sham_style_products_v1';
const CART='sham_style_cart_v1';
const SESSION_KEY='sham_style_admin_session_v1';
const OWNER_ID='13ab5af3-317b-4fe1-b086-7b89b70521b1';

const config=window.SHAM_CONFIG||{};
const SUPABASE_URL=(config.supabaseUrl||'').replace(/\/$/,'');
const SUPABASE_KEY=config.supabaseKey||'';
const BUCKET=config.storageBucket||'products';
const TABLE='sham_style_products';

let products=[];
let cart=JSON.parse(localStorage.getItem(CART)||'[]');
let pendingFiles=[];
let currentProductId=null;
let adminSession=null;
let loginBusy=false;

try{
 products=JSON.parse(localStorage.getItem(KEY)||'[]');
 if(!Array.isArray(products))products=[];
}catch(e){products=[];}

const governors=[
'دمشق','حلب','حمص','حماة',
'اللاذقية','طرطوس','إدلب','الحسكة',
'دير الزور','الرقة','درعا','السويداء','القنيطرة'
];

const qadamousBranches={
'اللاذقية':['8 آذار','الجامعة (سبيرو)','الزراعة','سوق التجار','الرمل الشمالي','بوقا'],
'جبلة':['جبلة','جبلة رأس العين','القرداحة'],
'حمص':['الزهرا','الحمرا','الحضارة','جورة الشياح','شين','الحواش (وادي النصارى)'],
'حماة':['الكراج','العاصي','سلحب','سقيلبية','سلمية','مصياف','محردة'],
'حلب':['الفرقان','الجميلية'],
'طرطوس':['طرطوس','المنطار','المحطة','الكراج القديم','الشيخ سعد','الشيخ بدر','دريكيش','صافيتا','بانياس','مدينة القدموس'],
'درعا':['درعا (القصور)','الصنمين','القطيفة','يبرود','قطنا','دير عطية','النبك'],
'دمشق':['الحمرا','ضاحية الأسد','البرامكة','الحريقة','جرمانا','جديدة عرطوز','صحنايا']
};

const masaratBranches={
'إدلب':[
['إدلب المدينة','شمال القصر العدلي جانب ساحة سريتيل'],
['سرمدا','دوار سرمدا شمال محمصة بن المستقبل بـ500 متر']
],
'دمشق':[
['صناعة كراج الست',''],
['برامكة حلبوني','خلف كراج بيروت القديم'],
['الحمرا','شارع الحمرا مقابل مول لاميرادا'],
['جرمانا - مفرق القريات','مقابل مفرق القريات الضيق ع الشارع العام'],
['جرمانا - مفرق الحمصي','عند مفرق الحمصي'],
['نهر عيشة','خلف التاو سنتر شارع المصانع'],
['عربين','ساحة الحلزونه'],
['يبرود','مقابل جامع أبو بكر الصديق'],
['القطيفة','']
],
'حلب':[
['الميدان','جانب مسبح العروبة'],
['الفرقان','جانب إشارات الشرطة'],
['المنشية','جانب عبارة الكهربا'],
['منبج','بمنبج']
],
'طرطوس':[
['المنطقة الصناعية',''],
['شارع الثورة','مقابل السورية للتجارة'],
['مدينة قدموس','جانب محمصة القصور'],
['دريكيش','شارع المحكمة قرب الهرم'],
['صافيتا','الشارع الرئيسي جنوب المستوصف'],
['بانياس','أول طريق المنزلة طريق الخدمي'],
['الصفصافة','بالصفصافة']
],
'اللاذقية':[
['الريجي','خلف الريجي الجديدة'],
['المنطقة الصناعية','خلف شارع المخفر'],
['الشيخ ضاهر','أول شارع العوينة'],
['الزراعة','دوار الزراعة جانب كازية عنتر'],
['جبلة الصناعية','المنطقة الصناعية'],
['جبلة الفوار','جانب حوالات الهرم']
],
'حماة':[
['الحاضر','خلف الهجرة وجوازات'],
['شارع 8 آذار','مقابل صيدلية العمالية'],
['مصياف','شارع شنيوي سيفو'],
['محردة','جانب حوالات الهرم'],
['سلمية','الكراج القديم']
],
'السويداء':[
['السويداء','خلف مسرح التربية']
],
'درعا':[
['الصنمين','طريق دمشق درعا القديم']
],
'حمص':[
['توصيل ضمن مدينة حمص','مأجور حسب أجور التوصيل'],
['شين','جانب الكراج'],
['الحواش','عين العجوز']
]
};

function save(){
 localStorage.setItem(KEY,JSON.stringify(products));
 localStorage.setItem(CART,JSON.stringify(cart));
}

function toast(t){
 const el=$('toast');
 if(!el){alert(t);return;}
 el.textContent=t;
 el.style.display='block';
 clearTimeout(window.shamToastTimer);
 window.shamToastTimer=setTimeout(()=>el.style.display='none',2600);
}

function esc(s=''){
 return String(s).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;',
 '"':'&quot;',"'":'&#39;'
 }[c]));
}

function money(n){
 return Number(n||0).toLocaleString('en-US')+' ل.س';
}

function supabaseReady(){
 return !!(SUPABASE_URL&&SUPABASE_KEY);
}

function sessionHeaders(){
 return {
  'apikey':SUPABASE_KEY,
  'Authorization':'Bearer '+(adminSession?.access_token||SUPABASE_KEY),
  'Content-Type':'application/json'
 };
}

function saveSession(){
 if(adminSession){
  sessionStorage.setItem(SESSION_KEY,JSON.stringify(adminSession));
 }
}

function clearSession(){
 adminSession=null;
 sessionStorage.removeItem(SESSION_KEY);
}

async function authRequest(path,body){
 const response=await fetch(SUPABASE_URL+'/auth/v1/'+path,{
  method:'POST',
  headers:{
   'apikey':SUPABASE_KEY,
   'Content-Type':'application/json'
  },
  body:JSON.stringify(body)
 });

 const data=await response.json().catch(()=>({}));
 if(!response.ok){
  throw new Error(data.msg||data.message||data.error_description||'تعذر تسجيل الدخول');
 }
 return data;
}

async function restoreSession(){
 try{
  const saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
  if(!saved?.access_token)return false;

  adminSession=saved;

  const response=await fetch(SUPABASE_URL+'/auth/v1/user',{
   headers:{
    'apikey':SUPABASE_KEY,
    'Authorization':'Bearer '+adminSession.access_token
   }
  });

  if(response.ok){
   const user=await response.json();
   if(user.id===OWNER_ID){
    adminSession.user=user;
    return true;
   }
  }

  if(adminSession.refresh_token){
   const refreshed=await authRequest('token?grant_type=refresh_token',{
    refresh_token:adminSession.refresh_token
   });

   if(refreshed.user?.id===OWNER_ID){
    adminSession=refreshed;
    saveSession();
    return true;
   }
  }
 }catch(e){
  console.warn('Session restore:',e);
 }

 clearSession();
 return false;
}

async function loginAdmin(email,password){
 const data=await authRequest('token?grant_type=password',{
  email,
  password
 });

 if(data.user?.id!==OWNER_ID){
  try{
   await fetch(SUPABASE_URL+'/auth/v1/logout',{
    method:'POST',
    headers:{
     'apikey':SUPABASE_KEY,
     'Authorization':'Bearer '+data.access_token
    }
   });
  }catch(e){}

  throw new Error('هذا الحساب غير مخوّل لإدارة متجر شام ستايل');
 }

 adminSession=data;
 saveSession();
}

function showLogin(){
 let modal=$('shamLoginModal');

 if(!modal){
  modal=document.createElement('div');
  modal.id='shamLoginModal';
  modal.style.cssText=
   'position:fixed;inset:0;z-index:99999;background:#0009;display:flex;align-items:center;justify-content:center;padding:18px;';

  modal.innerHTML=`
   <form id="shamLoginForm" style="background:white;color:#333;width:100%;max-width:380px;padding:25px;border-radius:18px;box-shadow:0 10px 40px #0003;">
    <h2 style="margin:0 0 8px;text-align:center;">إدارة شام ستايل 🩷</h2>
    <p style="text-align:center;margin:0 0 20px;color:#777;">سجّلي الدخول بحساب الإدارة</p>

    <label style="display:block;margin-bottom:6px;">البريد الإلكتروني</label>
    <input id="shamLoginEmail" type="email" required autocomplete="username" style="box-sizing:border-box;width:100%;padding:12px;margin-bottom:14px;border:1px solid #ddd;border-radius:9px;">

    <label style="display:block;margin-bottom:6px;">كلمة المرور</label>
    <input id="shamLoginPassword" type="password" required autocomplete="current-password" style="box-sizing:border-box;width:100%;padding:12px;margin-bottom:15px;border:1px solid #ddd;border-radius:9px;">

    <p id="shamLoginError" style="color:#c33;font-size:13px;min-height:18px;"></p>

    <button id="shamLoginSubmit" type="submit" style="width:100%;padding:13px;border:0;border-radius:10px;background:#d85b91;color:white;font-size:16px;">دخول</button>

    <button id="shamLoginCancel" type="button" style="width:100%;padding:11px;margin-top:9px;border:1px solid #ddd;border-radius:10px;background:white;">رجوع للمتجر</button>
   </form>
  `;

  document.body.appendChild(modal);

  $('shamLoginCancel').onclick=()=>{
   modal.remove();
   history.replaceState(null,'',location.pathname+location.search);
   view('shop');
  };

  $('shamLoginForm').onsubmit=async e=>{
   e.preventDefault();
   if(loginBusy)return;
   loginBusy=true;

   const btn=$('shamLoginSubmit');
   const error=$('shamLoginError');
   btn.disabled=true;
   btn.textContent='جاري التحقق...';
   error.textContent='';

   try{
    if(!supabaseReady())throw new Error('إعدادات Supabase غير موجودة في config.js');

    await loginAdmin(
     $('shamLoginEmail').value.trim(),
     $('shamLoginPassword').value
    );

    modal.remove();
    await enterAdmin();
   }catch(err){
    error.textContent=err.message||'حدث خطأ أثناء تسجيل الدخول';
   }finally{
    loginBusy=false;
    if($('shamLoginSubmit')){
     $('shamLoginSubmit').disabled=false;
     $('shamLoginSubmit').textContent='دخول';
    }
   }
  };
 }

 $('shamLoginEmail')?.focus();
}

async function apiProducts(method='GET',id=null,data=null){
 let url=SUPABASE_URL+'/rest/v1/'+TABLE+'?select=*';

 if(id!==null){
  url=SUPABASE_URL+'/rest/v1/'+TABLE+'?id=eq.'+encodeURIComponent(id);
 }

 const options={
  method,
  headers:sessionHeaders()
 };

 if(data!==null){
  options.headers['Prefer']='return=representation';
  options.body=JSON.stringify(data);
 }

 const response=await fetch(url,options);
 const text=await response.text();

 if(!response.ok){
  throw new Error(text||'حدث خطأ في قاعدة البيانات');
 }

 return text?JSON.parse(text):[];
}

function getProductImages(product){
 if(Array.isArray(product?.images))return product.images.filter(Boolean).slice(0,5);
 const raw=product?.image||'';
 if(Array.isArray(raw))return raw.filter(Boolean).slice(0,5);
 if(typeof raw==='string'&&raw.trim().startsWith('[')){
  try{const parsed=JSON.parse(raw);if(Array.isArray(parsed))return parsed.filter(Boolean).slice(0,5);}catch(e){}
 }
 return raw?[raw]:[];
}

function fromDatabase(row){
 let images=[];
 if(typeof row.image==='string'&&row.image.trim().startsWith('[')){
  try{const parsed=JSON.parse(row.image);if(Array.isArray(parsed))images=parsed.filter(Boolean).slice(0,5);}catch(e){}
 }
 if(!images.length&&row.image)images=[row.image];
 return {
  id:String(row.id),name:row.name||'',price:Number(row.price||0),
  category:row.category||'',image:images[0]||'',images,
  sizes:Array.isArray(row.sizes)?row.sizes:[],
  colors:Array.isArray(row.colors)?row.colors:[],
  description:row.description||''
 };
}

async function loadPublicProducts(){
 if(!supabaseReady()){
  renderShop();
  return;
 }

 try{
  const response=await fetch(
   SUPABASE_URL+'/rest/v1/'+TABLE+'?select=*&order=created_at.desc',
   {headers:{'apikey':SUPABASE_KEY}}
  );

  if(!response.ok)throw new Error(await response.text());

  const rows=await response.json();
  products=rows.map(fromDatabase);
  save();
  renderShop();
  renderCount();
 }catch(error){
  console.error(error);
  renderShop();
  toast('تعذر تحميل المنتجات من قاعدة البيانات');
 }
}

async function syncLocalProducts(localProducts){
 const remote=await apiProducts('GET');
 const remoteIds=new Set(remote.map(p=>String(p.id)));

 for(const p of localProducts){
  if(remoteIds.has(String(p.id)))continue;

  await apiProducts('POST',null,{
   id:String(p.id),
   name:p.name||'منتج',
   price:Number(p.price||0),
   category:p.category||'',
   image:JSON.stringify(getProductImages(p)),
   sizes:Array.isArray(p.sizes)?p.sizes:[],
   colors:Array.isArray(p.colors)?p.colors:[],
   description:p.description||'',
   owner_id:OWNER_ID
  });
 }

 const updated=await apiProducts('GET');
 products=updated.map(fromDatabase);
 save();
}

async function enterAdmin(){
 try{
  const localProducts=JSON.parse(localStorage.getItem(KEY)||'[]');

  await syncLocalProducts(Array.isArray(localProducts)?localProducts:[]);

  view('admin');
  renderShop();
  renderAdmin();
  toast('تم تسجيل الدخول بنجاح 🩷');
 }catch(error){
  console.error(error);
  toast('تعذر تحميل المنتجات: '+error.message);
 }
}

async function uploadImage(file){

  if(!SUPABASE_URL||!SUPABASE_KEY){
    throw new Error('إعدادات Supabase غير موجودة في config.js');
  }

  const ext=(file.name.split('.').pop()||'jpg')
    .toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';

  const fileName=Date.now()+'-'+
    Math.random().toString(36).slice(2,10)+'.'+ext;

  const uploadUrl=SUPABASE_URL+
    '/storage/v1/object/'+BUCKET+'/'+fileName;

  const response=await fetch(uploadUrl,{
    method:'POST',
    headers:{
      'apikey':SUPABASE_KEY,
      'Authorization':'Bearer '+(adminSession?.access_token||SUPABASE_KEY),
      'Content-Type':file.type||'image/jpeg',
      'x-upsert':'false'
    },
    body:file
  });

  if(!response.ok){
    const error=await response.text();
    throw new Error('فشل رفع الصورة: '+error);
  }

  return SUPABASE_URL+
    '/storage/v1/object/public/'+BUCKET+'/'+fileName;
}

async function oldImageToFile(data){
 const response=await fetch(data);
 const blob=await response.blob();
 return new File([blob],'old-product.jpg',{
  type:blob.type||'image/jpeg'
 });
}

function setupGovernors(){
 const select=$('governorate');
 if(!select)return;

 if(!select.options.length){
  select.add(new Option('اختاري المحافظة',''));
  governors.forEach(x=>select.add(new Option(x,x)));
 }
}

function hideViews(){
 document.querySelectorAll('.view').forEach(x=>x.hidden=true);
}

function view(name){
 hideViews();
 const target=$(name+'View');
 if(target)target.hidden=false;

 document.querySelectorAll('.navbtn').forEach(b=>
  b.classList.toggle('active',b.dataset.view===name)
 );

 if(name==='cart')renderCart();
 if(name==='admin')renderAdmin();
}

function showProductDetails(id){
 const p=products.find(x=>String(x.id)===String(id));
 if(!p)return;
 currentProductId=p.id;
 let selectedSize='',selectedColor='';
 const images=getProductImages(p);
 $('productDetails').innerHTML=`
  <div class="product-detail">
   <div class="detail-photo-wrap">
    <img class="detail-image" id="detailMainImage" src="${esc(images[0]||'')}" alt="${esc(p.name)}">
    ${images.length>1?`<div class="detail-thumbnails" id="detailThumbnails">
     ${images.map((src,i)=>`<button type="button" class="detail-thumb ${i===0?'selected':''}" data-image-index="${i}" aria-label="عرض الصورة ${i+1}"><img src="${esc(src)}" alt=""></button>`).join('')}
    </div>`:''}
   </div>
   <div class="detail-info">
    <h2>${esc(p.name)}</h2><div class="price detail-price">${money(p.price)}</div>
    ${p.description?`<p class="detail-description">${esc(p.description)}</p>`:''}
    <div class="choice-section"><h3>اختاري اللون</h3>
     <div class="choice-options" id="detailColors">
      ${(p.colors||[]).map(c=>`<button type="button" class="choice-btn color-choice" data-value="${esc(c)}">${esc(c)}</button>`).join('')}
     </div><div class="selected-label" id="selectedColorLabel">لم يتم اختيار اللون</div>
    </div>
    <div class="choice-section"><h3>اختاري القياس</h3>
     <div class="choice-options size-options" id="detailSizes">
      ${(p.sizes||[]).map(x=>`<button type="button" class="choice-btn size-choice" data-value="${esc(x)}">${esc(x)}</button>`).join('')}
     </div><div class="selected-label" id="selectedSizeLabel">لم يتم اختيار القياس</div>
    </div>
    <button type="button" class="primary full detail-cart-btn" id="detailAddToCart">أضيفي إلى السلة 🛍️</button>
   </div>
  </div>`;
 hideViews();$('productDetailsView').hidden=false;
 $('detailThumbnails')?.querySelectorAll('[data-image-index]').forEach(btn=>{
  btn.onclick=()=>{
   $('detailMainImage').src=images[Number(btn.dataset.imageIndex)];
   $('detailThumbnails').querySelectorAll('.detail-thumb').forEach(b=>b.classList.toggle('selected',b===btn));
  };
 });
 $('detailColors').querySelectorAll('.choice-btn').forEach(btn=>btn.onclick=()=>{
  selectedColor=btn.dataset.value;
  $('detailColors').querySelectorAll('.choice-btn').forEach(b=>b.classList.toggle('selected',b===btn));
  $('selectedColorLabel').textContent='اللون المختار: '+selectedColor;
 });
 $('detailSizes').querySelectorAll('.choice-btn').forEach(btn=>btn.onclick=()=>{
  selectedSize=btn.dataset.value;
  $('detailSizes').querySelectorAll('.choice-btn').forEach(b=>b.classList.toggle('selected',b===btn));
  $('selectedSizeLabel').textContent='القياس المختار: '+selectedSize;
 });
 $('detailAddToCart').onclick=()=>addProductToCart(currentProductId,selectedSize,selectedColor);
}

$('backToShop').onclick=()=>view('shop');

async function openAdmin(){
 if(location.hash!=='#admin')return;

 if(await restoreSession()){
  await enterAdmin();
 }else{
  showLogin();
 }
}

window.addEventListener('hashchange',()=>{
 if(location.hash==='#admin'){
  openAdmin();
 }else{
  const modal=$('shamLoginModal');
  if(modal)modal.remove();
  view('shop');
 }
});

document.querySelectorAll('.navbtn').forEach(b=>{
 b.onclick=()=>{
  if(b.dataset.view==='admin'){
   location.hash='admin';
   return;
  }
  history.replaceState(null,'',location.pathname+location.search);
  view(b.dataset.view);
 };
});

function renderShop(){
 const q=($('search').value||'').toLowerCase();
 const cat=$('categoryFilter').value;

 const list=products.filter(p=>
  (p.name+' '+(p.category||'')).toLowerCase().includes(q)&&
  (!cat||p.category===cat)
 );

 $('products').innerHTML=list.map(p=>`
  <article class="product">
   <button type="button" class="product-open" data-product-id="${esc(p.id)}">
    <img src="${esc(p.image||'')}" alt="${esc(p.name)}">
    <h3>${esc(p.name)}</h3>
    <div class="price">${money(p.price)}</div>
    <span class="details-hint">اضغطي لمشاهدة التفاصيل</span>
   </button>
  </article>
 `).join('');

 $('emptyShop').hidden=list.length>0;

 $('products').querySelectorAll('[data-product-id]').forEach(btn=>{
  btn.onclick=()=>showProductDetails(btn.dataset.productId);
 });

 const cats=[...new Set(products.map(p=>p.category).filter(Boolean))];
 const old=$('categoryFilter').value;

 $('categoryFilter').innerHTML=
  '<option value="">كل المنتجات</option>'+
  cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');

 $('categoryFilter').value=old;
}

function addProductToCart(id,size,color){
 const p=products.find(x=>String(x.id)===String(id));
 if(!p)return;

 if(!size||!color){
  toast('اختاري القياس واللون أولاً');
  return;
 }

 const found=cart.find(x=>
  String(x.id)===String(id)&&x.size===size&&x.color===color
 );

 if(found)found.qty++;
 else cart.push({id:p.id,size,color,qty:1});

 save();
 renderCount();
 toast('تمت إضافة المنتج إلى السلة');
}

window.addToCart=id=>{
 const size=$('size-'+id)?.value;
 const color=$('color-'+id)?.value;
 addProductToCart(id,size,color);
};

function renderCount(){
 $('cartCount').textContent=
  cart.reduce((a,x)=>a+Number(x.qty||0),0);
}

function renderCart(){
 $('cartItems').innerHTML=cart.map((x,i)=>{
  const p=products.find(p=>String(p.id)===String(x.id))||{};

  return `
   <div class="cartrow">
    <img src="${esc(p.image||'')}" alt="">
    <div class="grow">
     <b>${esc(p.name||'منتج')}</b>
     <div>القياس: ${esc(x.size)}</div>
     <div>اللون: ${esc(x.color)}</div>
     <div>الكمية: ${Number(x.qty||0)}</div>
     <div>${money(p.price)}</div>
    </div>
    <button class="remove" onclick="window.removeCart(${i})">حذف</button>
   </div>
  `;
 }).join('')||'<p class="empty">السلة فارغة حالياً.</p>';

 const total=cart.reduce((a,x)=>
  a+Number(x.qty||0)*Number((products.find(p=>String(p.id)===String(x.id))||{}).price||0),0
 );

 $('cartTotal').textContent=total.toLocaleString('en-US');
 $('sendOrder').disabled=!cart.length;
}

window.removeCart=i=>{
 cart.splice(i,1);
 save();
 renderCart();
 renderCount();
};

function updateBranches(){
 const method=$('delivery').value;
 const gov=$('governorate').value;
 const branch=$('branchAddress');
 const address=$('customerAddress');

 branch.innerHTML='<option value="">اختاري الفرع</option>';
 branch.disabled=false;
 address.required=false;

 if(method==='توصيل ضمن دمشق'){
  if(gov!=='دمشق'){
   toast('التوصيل للعنوان متاح ضمن محافظة دمشق فقط');
   $('governorate').value='';
   $('delivery').value='';
   address.value='';
   return;
  }

  branch.innerHTML='<option value="توصيل للعنوان مباشرة">توصيل للعنوان مباشرة</option>';
  branch.value='توصيل للعنوان مباشرة';
  branch.disabled=true;
  address.required=true;
  return;
 }

 if(method==='قدَموس'){
  let branches=[];

  if(gov==='اللاذقية'){
   branches=[
    ...qadamousBranches['اللاذقية'],
    ...qadamousBranches['جبلة'].map(x=>'جبلة - '+x)
   ];
  }else{
   branches=qadamousBranches[gov]||[];
  }

  branches.forEach(name=>branch.add(new Option(name,name)));
 }

 if(method==='مسارات والهرم'){
  const branches=masaratBranches[gov]||[];

  branches.forEach(([name,addressText])=>{
   const label=addressText?name+' — '+addressText:name;
   branch.add(new Option(label,label));
  });
 }

 if(!branch.options.length||branch.options.length===1){
  branch.innerHTML='<option value="">لا توجد فروع مسجلة لهذه المحافظة</option>';
  branch.disabled=true;
 }
}

$('delivery').onchange=updateBranches;

$('governorate').onchange=()=>{
 $('delivery').value='';
 $('branchAddress').innerHTML='<option value="">اختاري طريقة التوصيل أولاً</option>';
 $('branchAddress').disabled=true;
 $('customerAddress').required=false;
};

$('sendOrder').onclick=()=>{
 if(!cart.length)return;

 const name=$('customerName').value.trim();
 const phone=$('customerPhone').value.trim();
 const gov=$('governorate').value;
 const delivery=$('delivery').value;
 const address=$('customerAddress').value.trim();
 const branch=$('branchAddress').value.trim();

 if(!name||!phone||!gov||!delivery){
  toast('يرجى تعبئة الاسم والهاتف والمحافظة وطريقة التوصيل');
  return;
 }

 let deliveryDetails='';

 if(delivery==='توصيل ضمن دمشق'){
  if(gov!=='دمشق'||!address){
   toast('اكتبي عنوان المنزل بالتفصيل');
   return;
  }
  deliveryDetails='توصيل للعنوان مباشرة - '+address
  }else{
   if(!branch){
    toast('اختاري فرع الاستلام أولاً');
    return;
   }
   deliveryDetails=delivery+' - استلام من فرع - '+branch;
  }

  const lines=cart.map((item,i)=>{
   const p=products.find(x=>String(x.id)===String(item.id))||{};
   return [
    (i+1)+') '+(p.name||'منتج'),
    'القياس: '+(item.size||'غير محدد'),
    'اللون: '+(item.color||'غير محدد'),
    'الكمية: '+item.qty,
    'السعر: '+money(p.price),
    'رابط الصورة: '+(p.image||'لا يوجد')
   ].join('\n');
  }).join('\n\n');

  const total=cart.reduce((sum,item)=>{
   const p=products.find(x=>String(x.id)===String(item.id))||{};
   return sum+Number(item.qty||0)*Number(p.price||0);
  },0);

  const message=[
   'طلب جديد من متجر شام ستايل 🩷',
   'الاسم: '+name,
   'الهاتف: '+phone,
   'المحافظة: '+gov,
   'طريقة التوصيل: '+delivery,
   'العنوان/الفرع: '+deliveryDetails,
   '',
   'تفاصيل الطلب:',
   lines,
   '',
   'الإجمالي: '+money(total)
  ].join('\n');

  const whatsapp=config.whatsappNumber||'963997050453';
  window.open(
   'https://wa.me/'+whatsapp+'?text='+encodeURIComponent(message),
   '_blank'
  );

  toast('تم تجهيز الطلب للإرسال عبر واتساب 🩷');
};

/* إدارة المنتجات */

function clearForm(){
 $('productForm').reset();
 $('editId').value='';
 pendingFiles=[];
 $('pFile').value='';
 const btn=$('productForm').querySelector('[type="submit"]');
 if(btn)btn.textContent='إضافة المنتج';
}

$('pFile').multiple=true;
$('pFile').accept='image/*';
$('pFile').onchange=()=>{
 pendingFiles=Array.from($('pFile').files||[]);
 if(pendingFiles.length>5){
  pendingFiles=pendingFiles.slice(0,5);
  toast('يمكنك اختيار 5 صور كحد أقصى للمنتج');
 }
};

$('productForm').onsubmit=async e=>{
 e.preventDefault();

 if(!adminSession){
  toast('سجّلي الدخول للإدارة أولاً');
  return;
 }

 const btn=$('productForm').querySelector('[type="submit"]');
 btn.disabled=true;
 btn.textContent='جاري الحفظ...';

 try{
  const id=$('editId').value||String(Date.now());
  const oldProduct=products.find(p=>String(p.id)===String(id));

  let images=oldProduct?getProductImages(oldProduct):[];
  const imageUrl=$('pImage').value.trim();
  if(pendingFiles.length){
   images=[];
   for(const file of pendingFiles)images.push(await uploadImage(file));
  }else if(imageUrl){
   images=[imageUrl];
  }
  images=images.filter(Boolean).slice(0,5);

  const product={
   id,
   name:$('pName').value.trim(),
   price:Number($('pPrice').value||0),
   category:$('pCategory').value.trim(),
   image:images[0]||'',
   images,
   sizes:$('pSizes').value.split(',').map(x=>x.trim()).filter(Boolean),
   colors:$('pColors').value.split(',').map(x=>x.trim()).filter(Boolean),
   description:$('pDescription').value.trim(),
   owner_id:OWNER_ID
  };

  if(!product.name){
   toast('اكتبي اسم المنتج');
   return;
  }

  const databaseProduct={...product,image:JSON.stringify(product.images)};
  delete databaseProduct.images;
  if(oldProduct){
   await apiProducts('PATCH',id,databaseProduct);
  }else{
   await apiProducts('POST',null,databaseProduct);
  }

  const updated=await apiProducts('GET');
  products=updated.map(fromDatabase);
  save();

  clearForm();
  renderShop();
  renderAdmin();
  toast('تم حفظ المنتج بنجاح 🩷');

 }catch(error){
  console.error(error);
  toast('تعذر حفظ المنتج: '+error.message);
 }finally{
  btn.disabled=false;
  btn.textContent='إضافة المنتج';
 }
};

function renderAdmin(){
 const container=$('adminProducts');
 if(!container)return;

 container.innerHTML=products.map(p=>`
  <div class="admin-product">
   <img src="${esc(p.image||'')}" alt="${esc(p.name)}">
   <div class="admin-product-info">
    <b>${esc(p.name)}</b>
    <div>${money(p.price)}</div>
    <div>${esc(p.category||'')}</div>
    <div>القياسات: ${esc((p.sizes||[]).join('، '))}</div>
    <div>الألوان: ${esc((p.colors||[]).join('، '))}</div>
   </div>
   <div class="admin-actions">
    <button type="button" class="edit-product" data-id="${esc(p.id)}">تعديل</button>
    <button type="button" class="delete-product" data-id="${esc(p.id)}">حذف</button>
   </div>
  </div>
 `).join('')||'<p class="empty">لا توجد منتجات حالياً.</p>';

 container.querySelectorAll('.edit-product').forEach(btn=>{
  btn.onclick=()=>{
   const p=products.find(x=>String(x.id)===String(btn.dataset.id));
   if(!p)return;

   $('editId').value=p.id;
   $('pName').value=p.name||'';
   $('pPrice').value=p.price||'';
   $('pCategory').value=p.category||'';
   $('pImage').value='';
   $('pSizes').value=(p.sizes||[]).join(', ');
   $('pColors').value=(p.colors||[]).join(', ');
   $('pDescription').value=p.description||'';

   pendingFiles=[];
   $('pFile').value='';

   const submit=$('productForm').querySelector('[type="submit"]');
   if(submit)submit.textContent='حفظ التعديلات';

   $('productForm').scrollIntoView({behavior:'smooth'});
  };
 });

 container.querySelectorAll('.delete-product').forEach(btn=>{
  btn.onclick=async()=>{
   if(!confirm('متأكدة من حذف هذا المنتج؟'))return;

   try{
    await apiProducts('DELETE',btn.dataset.id);
    products=products.filter(p=>String(p.id)!==String(btn.dataset.id));
    save();
    renderShop();
    renderAdmin();
    toast('تم حذف المنتج');
   }catch(error){
    toast('تعذر حذف المنتج: '+error.message);
   }
  };
 });
}

$('logoutAdmin').onclick=()=>{
 clearSession();
 history.replaceState(null,'',location.pathname+location.search);
 view('shop');
 loadPublicProducts();
 toast('تم تسجيل الخروج');
};

/* البحث والتشغيل */

$('search').oninput=renderShop;
$('categoryFilter').onchange=renderShop;

setupGovernors();
renderShop();
renderCount();

if(location.hash==='#admin'){
 openAdmin();
}else{
 view('shop');
 loadPublicProducts();
}

})();
  
