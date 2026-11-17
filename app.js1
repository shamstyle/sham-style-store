
(()=>{
const $=id=>document.getElementById(id);

const KEY='sham_style_products_v1';
const CART='sham_style_cart_v1';

let products=JSON.parse(localStorage.getItem(KEY)||'[]');
let cart=JSON.parse(localStorage.getItem(CART)||'[]');
let pendingImage='';

const governors=[
'دمشق','ريف دمشق','حلب','حمص','حماة',
'اللاذقية','طرطوس','إدلب','الحسكة',
'دير الزور','الرقة','درعا','السويداء','القنيطرة'
];

governors.forEach(x=>$('governorate').add(new Option(x,x)));

function save(){
 localStorage.setItem(KEY,JSON.stringify(products));
 localStorage.setItem(CART,JSON.stringify(cart));
}

function toast(t){
 $('toast').textContent=t;
 $('toast').style.display='block';
 setTimeout(()=>$('toast').style.display='none',2600);
}

function esc(s=''){
 return String(s).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;',
 '"':'&quot;',"'":'&#39;'
 }[c]));
}

function view(name){
 document.querySelectorAll('.view').forEach(x=>x.hidden=true);
 $(name+'View').hidden=false;

 document.querySelectorAll('.navbtn').forEach(b=>
  b.classList.toggle('active',b.dataset.view===name)
 );

 if(name==='cart') renderCart();
 if(name==='admin') renderAdmin();
}

document.querySelectorAll('.navbtn').forEach(b=>
 b.onclick=()=>view(b.dataset.view)
);

function renderShop(){
 let q=$('search').value.toLowerCase();
 let cat=$('categoryFilter').value;

 let list=products.filter(p=>
  (p.name+' '+(p.category||'')).toLowerCase().includes(q)&&
  (!cat||p.category===cat)
 );

 $('products').innerHTML=list.map(p=>`
 <article class="product">
  <img src="${esc(p.image||'')}" alt="${esc(p.name)}">
  <h3>${esc(p.name)}</h3>
  <div class="price">${Number(p.price).toLocaleString('en-US')} ل.س</div>
  <p>${esc(p.description||'')}</p>

  <label>القياس
   <select id="size-${p.id}">
    <option value="">اختاري القياس</option>
    ${(p.sizes||[]).map(s=>`<option>${esc(s)}</option>`).join('')}
   </select>
  </label>

  <label>اللون
   <select id="color-${p.id}">
    <option value="">اختاري اللون</option>
    ${(p.colors||[]).map(c=>`<option>${esc(c)}</option>`).join('')}
   </select>
  </label>

  <button class="primary full"
   onclick="window.addToCart('${p.id}')">
   أضيفي إلى السلة
  </button>
 </article>
 `).join('');

 $('emptyShop').hidden=list.length>0;

 let cats=[...new Set(products.map(p=>p.category).filter(Boolean))];
 let old=$('categoryFilter').value;

 $('categoryFilter').innerHTML=
 '<option value="">كل المنتجات</option>'+
 cats.map(c=>`<option>${esc(c)}</option>`).join('');

 $('categoryFilter').value=old;
}

window.addToCart=id=>{
 let p=products.find(x=>x.id===id);
 let size=$('size-'+id).value;
 let color=$('color-'+id).value;

 if(!size||!color){
  toast('اختاري القياس واللون أولاً');
  return;
 }

 let found=cart.find(x=>
  x.id===id&&x.size===size&&x.color===color
 );

 if(found) found.qty++;
 else cart.push({id,size,color,qty:1});

 save();
 renderCount();
 toast('تمت إضافة المنتج إلى السلة');
};

function renderCount(){
 $('cartCount').textContent=
 cart.reduce((a,x)=>a+x.qty,0);
}

function renderCart(){
 $('cartItems').innerHTML=cart.map((x,i)=>{
  let p=products.find(p=>p.id===x.id)||{};

  return `
  <div class="cartrow">
   <img src="${esc(p.image||'')}" alt="">
   <div class="grow">
    <b>${esc(p.name||'منتج')}</b>
    <div>القياس: ${esc(x.size)}</div>
    <div>اللون: ${esc(x.color)}</div>
    <div>الكمية: ${x.qty}</div>
    <div>${Number(p.price||0).toLocaleString('en-US')} ل.س</div>
   </div>
   <button class="remove"
    onclick="window.removeCart(${i})">حذف</button>
  </div>`;
 }).join('')||'<p class="empty">السلة فارغة حالياً.</p>';

 let total=cart.reduce((a,x)=>
  a+x.qty*Number((products.find(p=>p.id===x.id)||{}).price||0),0
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

$('sendOrder').onclick=()=>{
 if(!cart.length)return;

 let name=$('customerName').value.trim();
 let phone=$('customerPhone').value.trim();
 let gov=$('governorate').value;
 let delivery=$('delivery').value;
 let addr=$('branchAddress').value.trim();

 if(!name||!phone||!gov||!delivery||!addr){
  toast('يرجى تعبئة بيانات التوصيل كاملة');
  return;
 }

 let lines=cart.map((x,i)=>{
  let p=products.find(p=>p.id===x.id)||{};

  return `${i+1}) ${p.name||'منتج'}
القياس: ${x.size}
اللون: ${x.color}
الكمية: ${x.qty}
السعر: ${Number(p.price||0).toLocaleString('en-US')} ل.س
رابط الصورة: ${p.image||'غير متوفر'}`;
 }).join('\n\n');

 let total=cart.reduce((a,x)=>
  a+x.qty*Number((products.find(p=>p.id===x.id)||{}).price||0),0
 );

 let msg=`طلب جديد من متجر شام ستايل 🩷
الاسم: ${name}
الهاتف: ${phone}
المحافظة: ${gov}
طريقة التوصيل: ${delivery}
الفرع/العنوان: ${addr}

${lines}

المجموع: ${total.toLocaleString('en-US')} ل.س
ملاحظات: ${$('notes').value||'لا يوجد'}`;

 let n=window.SHAM_CONFIG?.whatsappNumber||'';

 if(!n||n.includes('PUT_')){
  toast('تأكدي من رقم واتساب المتجر في config.js');
  return;
 }

 window.open(
  'https://wa.me/'+n+'?text='+encodeURIComponent(msg),
  '_blank'
 );
};

function lines(id){
 return $(id).value.split(/[,،\n]/)
 .map(x=>x.trim()).filter(Boolean);
}

$('pFile').onchange=e=>{
 let f=e.target.files[0];
 if(!f)return;

 let r=new FileReader();

 r.onload=()=>{
  pendingImage=r.result;
  $('pImage').value='';
  toast('تم تحميل الصورة للمعاينة المحلية');
 };

 r.readAsDataURL(f);
};

$('pImage').oninput=()=>{
 if($('pImage').value.trim())pendingImage='';
};

$('productForm').onsubmit=e=>{
 e.preventDefault();

 let id=$('editId').value||String(Date.now());
 let old=products.find(p=>p.id===id);

 let p={
  id,
  name:$('pName').value.trim(),
  price:Number($('pPrice').value),
  category:$('pCategory').value.trim(),
  image:$('pImage').value.trim()||
        pendingImage||(old?.image||''),
  sizes:lines('pSizes'),
  colors:lines('pColors'),
  description:$('pDescription').value.trim()
 };

 if(!p.sizes.length||!p.colors.length){
  toast('أضيفي قياساً ولوناً على الأقل');
  return;
 }

 if(old){
  products=products.map(x=>x.id===id?p:x);
 }else{
  products.unshift(p);
 }

 save();
 clearForm();
 renderShop();
 renderAdmin();
 toast('تم حفظ المنتج');
};

function clearForm(){
 $('productForm').reset();
 $('editId').value='';
 $('formTitle').textContent='إضافة منتج جديد';
 pendingImage='';
}

$('cancelEdit').onclick=clearForm;

$('logoutAdmin').onclick=()=>view('shop');

function renderAdmin(){
 $('adminProducts').innerHTML=products.map(p=>`
 <div class="adminitem">
  <img src="${esc(p.image||'')}" alt="">
  <div class="grow">
   <b>${esc(p.name)}</b>
   <div>${Number(p.price).toLocaleString('en-US')} ل.س</div>
   <small>
    القياسات: ${esc((p.sizes||[]).join('، '))}
    | الألوان: ${esc((p.colors||[]).join('، '))}
   </small>
  </div>

  <button class="light"
   onclick="window.editProduct('${p.id}')">تعديل</button>

  <button class="remove"
   onclick="window.deleteProduct('${p.id}')">حذف</button>
 </div>
 `).join('')||'<p class="empty">لا توجد منتجات بعد.</p>';
}

window.editProduct=id=>{
 let p=products.find(x=>x.id===id);
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

 pendingImage=p.image?.startsWith('data:')?p.image:'';

 $('formTitle').textContent='تعديل المنتج';

 window.scrollTo({top:0,behavior:'smooth'});
};

window.deleteProduct=id=>{
 if(!confirm('هل أنت متأكدة من حذف المنتج؟'))return;

 products=products.filter(p=>p.id!==id);
 save();
 renderShop();
 renderAdmin();
};

$('search').oninput=renderShop;
$('categoryFilter').onchange=renderShop;

renderShop();
renderCount();
view('shop');

})();
