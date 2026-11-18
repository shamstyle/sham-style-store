(()=>{
'use strict';

const $=id=>document.getElementById(id);

const KEY='sham_style_products_v1';
const CART='sham_style_cart_v1';
const ADMIN_PASSWORD='4444';

const config=window.SHAM_CONFIG||{};
const SUPABASE_URL=(config.supabaseUrl||'').replace(/\/$/,'');
const SUPABASE_KEY=config.supabaseKey||'';
const BUCKET=config.storageBucket||'products';

let products=JSON.parse(localStorage.getItem(KEY)||'[]');
let cart=JSON.parse(localStorage.getItem(CART)||'[]');
let pendingFile=null;
let currentProductId=null;

const governors=[
'دمشق','ريف دمشق','حلب','حمص','حماة',
'اللاذقية','طرطوس','إدلب','الحسكة',
'دير الزور','الرقة','درعا','السويداء','القنيطرة'
];

// فروع شركة القدموس - كما أرسلتها صاحبة المتجر
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

// فروع مسارات والهرم - مع العناوين كما وصلت
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

// رفع الصورة إلى Supabase
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
   'Authorization':'Bearer '+SUPABASE_KEY,
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

// تحويل الصور القديمة المحفوظة بصيغة Base64
async function oldImageToFile(data){
 const response=await fetch(data);
 const blob=await response.blob();
 return new File([blob],'old-product.jpg',{
  type:blob.type||'image/jpeg'
 });
}

// تجهيز المحافظات دون تكرار الخيارات الموجودة في HTML
function setupGovernors(){
 const select=$('governorate');
 if(!select)return;

 if(!select.options.length){
  select.add(new Option('اختاري المحافظة',''));
  governors.forEach(x=>select.add(new Option(x,x)));
 }
}

// التنقل بين الصفحات
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

 $('productDetails').innerHTML=`
  <div class="product-detail">
   <img class="detail-image" src="${esc(p.image||'')}" alt="${esc(p.name)}">
   <div class="detail-info">
    <h2>${esc(p.name)}</h2>
    <div class="price detail-price">${money(p.price)}</div>
    <p>${esc(p.description||'')}</p>

    <label>اختاري القياس
     <select id="detailSize">
      <option value="">اختاري القياس</option>
      ${(p.sizes||[]).map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}
     </select>
    </label>

    <label>اختاري اللون
     <select id="detailColor">
      <option value="">اختاري اللون</option>
      ${(p.colors||[]).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
     </select>
    </label>

    <button type="button" class="primary full" id="detailAddToCart">
     أضيفي إلى السلة
    </button>
   </div>
  </div>
 `;

 hideViews();
 $('productDetailsView').hidden=false;

 $('detailAddToCart').onclick=()=>addProductToCart(
  currentProductId,
  $('detailSize').value,
  $('detailColor').value
 );
}

$('backToShop').onclick=()=>{
 view('shop');
};

function openAdmin(){
 if(location.hash!=='#admin')return;

 const password=prompt('أدخلي كلمة مرور الإدارة');

 if(password===ADMIN_PASSWORD){
  view('admin');
 }else{
  history.replaceState(null,'',location.pathname+location.search);
  view('shop');
  toast('كلمة المرور غير صحيحة');
 }
}

window.addEventListener('hashchange',()=>{
 if(location.hash==='#admin'){
  openAdmin();
 }else{
  view('shop');
 }
});

document.querySelectorAll('.navbtn').forEach(b=>{
 b.onclick=()=>{
  if(b.dataset.view==='admin')return;
  view(b.dataset.view);
 };
});

// عرض المنتجات في المتجر
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

 // فتح تفاصيل المنتج عند الضغط على بطاقته
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

// إضافة منتج للسلة بعد اختيار القياس واللون
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

// تجهيز خيارات الفروع حسب شركة الشحن والمحافظة
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

  // فرع جبلة ضمن محافظة اللاذقية
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
  let key=gov;
  if(gov==='إدلب')key='إدلب';

  const branches=masaratBranches[key]||[];

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

// إرسال الطلب عبر واتساب
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
  deliveryDetails='توصيل للعنوان مباشرة - '+address;
 }else{
  if(!branch||$('branchAddress').disabled){
   toast('اختاري فرع الاستلام من القائمة');
   return;
  }
  deliveryDetails=branch;
  if(address)deliveryDetails+=' - تفاصيل إضافية: '+address;
 }

 const orderLines=cart.map((x,i)=>{
  const p=products.find(p=>String(p.id)===String(x.id))||{};

  return `${i+1}) ${p.name||'منتج'}
القياس: ${x.size}
اللون: ${x.color}
الكمية: ${x.qty}
السعر: ${money(p.price)}
رابط الصورة: ${p.image||'غير متوفر'}`;
 }).join('\n\n');

 const total=cart.reduce((a,x)=>
  a+Number(x.qty||0)*Number((products.find(p=>String(p.id)===String(x.id))||{}).price||0),0
 );

 const msg=`طلب جديد من متجر شام ستايل 🩷
الاسم: ${name}
الهاتف: ${phone}
المحافظة: ${gov}
طريقة التوصيل: ${delivery}
الفرع/العنوان: ${deliveryDetails}

${orderLines}

المجموع: ${money(total)}
ملاحظات: ${$('notes').value||'لا يوجد'}`;

 const n=config.whatsappNumber||'';

 if(!n){
  toast('تأكدي من رقم واتساب المتجر في config.js');
  return;
 }

 window.open(
  'https://wa.me/'+n+'?text='+encodeURIComponent(msg),
  '_blank'
 );
};

// قراءة القياسات والألوان من حقول الإدارة
function lines(id){
 return $(id).value.split(/[,،\n]/)
  .map(x=>x.trim()).filter(Boolean);
}

$('pFile').onchange=e=>{
 pendingFile=e.target.files[0]||null;

 if(pendingFile){
  $('pImage').value='';
  toast('تم اختيار الصورة، سترفع عند حفظ المنتج');
 }
};

$('pImage').oninput=()=>{
 if($('pImage').value.trim())pendingFile=null;
};

// حفظ المنتج مع رفع الصورة
$('productForm').onsubmit=async e=>{
 e.preventDefault();

 const submitButton=e.submitter;
 if(submitButton)submitButton.disabled=true;

 try{
  const id=$('editId').value||String(Date.now());
  const old=products.find(p=>String(p.id)===String(id));

  let image=$('pImage').value.trim()||(old?.image||'');

  if(pendingFile){
   toast('جاري رفع الصورة...');
   image=await uploadImage(pendingFile);
  }else if(image.startsWith('data:')){
   toast('جاري رفع الصورة القديمة...');
   image=await uploadImage(await oldImageToFile(image));
  }

  const p={
   id,
   name:$('pName').value.trim(),
   price:Number($('pPrice').value),
   category:$('pCategory').value.trim(),
   image,
   sizes:lines('pSizes'),
   colors:lines('pColors'),
   description:$('pDescription').value.trim()
  };

  if(!p.sizes.length||!p.colors.length){
   toast('أضيفي قياساً ولوناً على الأقل');
   return;
  }

  if(old){
   products=products.map(x=>String(x.id)===String(id)?p:x);
  }else{
   products.unshift(p);
  }

  save();
  clearForm();
  renderShop();
  renderAdmin();
  toast('تم حفظ المنتج ورابط صورته');

 }catch(error){
  console.error(error);
  toast(error.message||'حدث خطأ أثناء رفع الصورة');
 }finally{
  if(submitButton)submitButton.disabled=false;
 }
};

function clearForm(){
 $('productForm').reset();
 $('editId').value='';
 $('formTitle').textContent='إضافة منتج جديد';
 pendingFile=null;
}

$('cancelEdit').onclick=clearForm;

$('logoutAdmin').onclick=()=>{
 history.replaceState(null,'',location.pathname+location.search);
 view('shop');
};

// عرض المنتجات في لوحة الإدارة
function renderAdmin(){
 $('adminProducts').innerHTML=products.map(p=>`
  <div class="adminitem">
   <img src="${esc(p.image||'')}" alt="">
   <div class="grow">
    <b>${esc(p.name)}</b>
    <div>${money(p.price)}</div>
    <small>
     القياسات: ${esc((p.sizes||[]).join('، '))}
     | الألوان: ${esc((p.colors||[]).join('، '))}
    </small>
   </div>

   <button class="light" onclick="window.editProduct('${esc(p.id)}')">تعديل</button>
   <button class="remove" onclick="window.deleteProduct('${esc(p.id)}')">حذف</button>
  </div>
 `).join('')||'<p class="empty">لا توجد منتجات بعد.</p>';
}

window.editProduct=id=>{
 const p=products.find(x=>String(x.id)===String(id));
 if(!p)return;

 $('editId').value=p.id;
 $('pName').value=p.name;
 $('pPrice').value=p.price;
 $('pCategory').value=p.category||'';

 $('pImage').value=
  p.image?.startsWith('data:')?'':(p.image||'');

 $('pSizes').value=(p.sizes||[]).join('\n');
 $('pColors').value=(p.colors||[]).join('\n');
 $('pDescription').value=p.description||'';

 pendingFile=null;
 $('formTitle').textContent='تعديل المنتج';

 window.scrollTo({top:0,behavior:'smooth'});
};

window.deleteProduct=id=>{
 if(!confirm('هل أنت متأكدة من حذف المنتج؟'))return;

 products=products.filter(p=>String(p.id)!==String(id));
 save();
 renderShop();
 renderAdmin();
};

$('search').oninput=renderShop;
$('categoryFilter').onchange=renderShop;

// تشغيل المتجر
setupGovernors();

$('branchAddress').innerHTML='<option value="">اختاري طريقة التوصيل أولاً</option>';
$('branchAddress').disabled=true;

renderShop();
renderCount();

if(location.hash==='#admin'){
 openAdmin();
}else{
 view('shop');
}

})();
