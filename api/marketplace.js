import {publicDb,privateDb,send,authenticatedUser,clean} from './_lib.js';
const frequencies={daily:30,weekly:4,monthly:1};
const int=(v)=>Number.isSafeInteger(Number(v))?Number(v):NaN;
function mapOrder(o){const [brand,...rest]=o.product_name.split(' ');return {...o,reference:o.order_reference,brand,model:rest.join(' '),status:o.order_status,full_name:o.customer_name,phone_number:o.customer_phone,months:o.financing_months,payment_plan_months:o.financing_months,preferred_colour:o.selected_colour,delivery_method:o.delivery_location==='Office collection'?'office_collection':'delivery',address:o.delivery_location};}
export default async function handler(req,res){const action=String(req.query.action||'');try{
if(req.method==='GET'){
if(action==='health'){const r=await publicDb().from('products').select('id,stock,is_active');if(r.error)throw r.error;return send(res,200,{ok:true,database:'connected',products_total:r.data.length,products_active:r.data.filter(p=>p.is_active).length,products_in_stock:r.data.filter(p=>p.is_active&&p.stock>0).length});}
if(['products','settings','reviews','team'].includes(action)){if(action==='reviews')return send(res,200,{reviews:[]});if(action==='team')return send(res,200,{team:[]});const r=await publicDb().from(action==='products'?'products':'business_settings').select('*');if(r.error)throw r.error;if(action==='settings')return send(res,200,{settings:Object.fromEntries(r.data.map(x=>[x.setting_key,x.setting_value]))});return send(res,200,{products:r.data.filter(x=>x.is_active&&x.stock>0)});}
if(action==='my_orders'){const u=await authenticatedUser(req);if(!u)return send(res,401,{error:'Please sign in'});const r=await privateDb().from('orders').select('*').eq('customer_user_id',u.id).order('created_at',{ascending:false}).limit(100);if(r.error)throw r.error;return send(res,200,{orders:r.data.map(mapOrder),payments:[]});}
return send(res,404,{error:'Unknown action'});}
if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
if(action==='payment')return send(res,501,{error:'Payment reference submissions are disabled until provider verification is integrated. Contact support.'});
if(action!=='order')return send(res,404,{error:'Unknown action'});
const b=req.body||{};if(JSON.stringify(b).length>12000)return send(res,413,{error:'Application too large'});
const user=await authenticatedUser(req);
const captcha=clean(b.turnstile_token,4096);const secret=process.env.TURNSTILE_SECRET_KEY;
if(!secret)return send(res,503,{error:'Applications are not enabled until bot protection is configured'});
if(!captcha)return send(res,400,{error:'Please complete the security check'});
const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
const verify=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret,response:captcha,remoteip:ip})});
const verdict=await verify.json();if(!verdict.success)return send(res,400,{error:'Security check failed. Please try again'});
if(clean(b.website,100))return send(res,400,{error:'Invalid application'});
const name=clean(b.full_name,120),phone=clean(b.phone_number,35),email=clean(b.contact_email,180),whatsapp=clean(b.alternative_number,35);
const productId=int(b.product_id),months=int(b.months),freq=clean(b.payment_frequency,20),colour=clean(b.preferred_colour,60);
if(name.length<2||!/^[+0-9 ()-]{8,25}$/.test(phone)||!/^[+0-9 ()-]{8,25}$/.test(whatsapp)||!Number.isSafeInteger(productId)||![3,6,9,12].includes(months)||!frequencies[freq]||!colour||email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return send(res,400,{error:'Please complete all required application details correctly'});
const p=await privateDb().from('products').select('*').eq('id',productId).eq('is_active',true).gt('stock',0).maybeSingle();if(p.error)throw p.error;if(!p.data)return send(res,400,{error:'Selected phone is unavailable'});
const product=p.data;const available=String(product.available_colours||'').split(/[,|]/).map(s=>s.trim().toLowerCase()).filter(Boolean);if(available.length&&!available.includes(colour.toLowerCase()))return send(res,400,{error:'Selected colour is unavailable'});
const price=Number(product.cash_price),deposit=Number(product.required_deposit);if(!Number.isFinite(price)||!Number.isFinite(deposit)||deposit>price)return send(res,503,{error:'Phone pricing needs administrator attention'});
const method=clean(b.delivery_method,40);if(!['office_collection','home_delivery','delivery'].includes(method))return send(res,400,{error:'Choose a delivery method'});
const delivery=method==='office_collection'?'Office collection':[clean(b.address,200),clean(b.district,100)].filter(Boolean).join(', ');if(!delivery)return send(res,400,{error:'Delivery address is required'});
const installment=Math.ceil((price-deposit)/(months*frequencies[freq]));
const r=await privateDb().from('orders').insert({customer_user_id:user?.id||null,customer_name:name,customer_phone:phone,customer_email:email||null,customer_whatsapp:whatsapp,delivery_location:delivery,product_id:productId,product_name:`${product.brand} ${product.model}`,selected_colour:colour,cash_price:price,deposit_amount:deposit,financing_months:months,payment_frequency:freq,installment_amount:installment,payment_status:'pending',order_status:'pending'}).select('order_reference,deposit_amount').single();if(r.error)throw r.error;
return send(res,201,{ok:true,reference:r.data.order_reference,deposit:r.data.deposit_amount,payment_status:'pending'});
}catch(e){console.error('marketplace',e);return send(res,500,{error:'Request could not be completed'})}}
