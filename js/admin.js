
function applyWebsiteName(name){name=String(name||'SmartPay Phones Uganda').trim();if(!name)return;document.title=document.title.replace(/SmartPay Phones Uganda|SmartPay Phones|SmartPay/g,name);document.querySelectorAll('.brand strong').forEach(el=>el.textContent=name+' Admin');}
let csrf='',admin=null,state={orders:[],products:[],reviews:[],payments:[],leadership:[],settings:{}};const $=s=>document.querySelector(s);const fmt=n=>`UGX ${Number(n||0).toLocaleString('en-UG')}`;async function req(action,body){const opt={credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf}};if(body){opt.method='POST';opt.body=JSON.stringify({...body,action,csrf})}const r=await fetch('api/admin.php?action='+encodeURIComponent(action),opt);const raw=await r.text();let d={};if(raw.trim()){try{d=JSON.parse(raw)}catch(err){console.error('Invalid admin API response:',raw);throw Error(`Admin API returned an invalid response (HTTP ${r.status}). Check PHP/server error logs.`)}}else{throw Error(`Admin API returned an empty response (HTTP ${r.status}). Check PHP/server error logs.`)}if(!r.ok)throw Error(d.error||`Request failed (HTTP ${r.status})`);if(d.csrf)csrf=d.csrf;return d}async function auth(){const r=await fetch('api/auth.php?action=me',{credentials:'same-origin'});const raw=await r.text();let d={};if(raw.trim()){try{d=JSON.parse(raw)}catch(err){throw Error(`Authentication API returned an invalid response (HTTP ${r.status}).`)}}else{throw Error(`Authentication API returned an empty response (HTTP ${r.status}).`)}if(!r.ok)throw Error(d.error||`Authentication failed (HTTP ${r.status})`);csrf=d.csrf||'';admin=d.user;return d}function message(t,good=false){$('#adminMessage').textContent=t;$('#adminMessage').className='form-note '+(good?'good':'error')}function render(){const orders=$('#ordersTable');
orders.innerHTML=state.orders.length?`<div class="table-wrap"><table>
<tr><th>Reference</th><th>Customer</th><th>Phone</th><th>WhatsApp</th><th>Device</th><th>Status</th><th>Action</th></tr>
${state.orders.map(o=>`<tr>
<td>${o.reference}</td>
<td>${o.full_name||'Guest customer'}<small>${o.contact_email||o.email||''}</small></td>
<td>${o.phone_number||o.customer_phone||o.phone||'—'}</td>
<td>${o.alternative_number||'—'}</td>
<td>${o.brand} ${o.model}</td>
<td><span class="status">${o.status}</span></td>
<td><select data-order="${o.id}">${['pending','payment_verification','verified','approved','ready','active','completed','rejected'].map(x=>`<option ${x===o.status?'selected':''}>${x}</option>`).join('')}</select></td>
</tr>`).join('')}</table></div>`:'<p class="empty-review">No orders yet.</p>';$('#productsList').innerHTML=state.products.map(p=>`<article class="admin-item"><div><b>${p.brand} ${p.model}</b><small>${fmt(p.cash_price)} · deposit ${fmt(p.required_deposit)} · stock ${p.stock}</small><small>Colours: ${p.available_colours || 'Not set'}</small></div><button class="button outline-dark" data-edit-product="${p.id}">Edit</button></article>`).join('')||'<p class="empty-review">No products.</p>';$('#paymentsList').innerHTML=state.payments.length?`<div class="table-wrap"><table><tr><th>Reference</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr>${state.payments.map(p=>`<tr><td>${p.mtn_reference}</td><td>${p.full_name}<small>${p.reference}</small></td><td>${fmt(p.amount)}</td><td><span class="status">${p.status}</span></td><td>${p.status==='submitted'?`<button class="button small-button" data-payment="${p.id}" data-status="verified">Verify</button> <button class="button danger-button" data-payment="${p.id}" data-status="rejected">Reject</button>`:'Reviewed'}</td></tr>`).join('')}</table></div>`:'<p class="empty-review">No payment references submitted.</p>';$('#reviewsList').innerHTML=state.reviews.length?state.reviews.map(r=>`<article class="admin-item admin-review-item">${r.customer_photo?`<img class="admin-review-photo" src="${r.customer_photo}" alt="">`:`<span class="admin-review-photo admin-review-photo-placeholder">${(r.customer_name||'?').charAt(0)}</span>`}<div class="admin-review-copy"><b>${r.customer_name}</b><small>${r.customer_type||'Customer'} · ${r.location}${r.reference?` · Linked order ${r.reference} (${r.order_status||'unknown'})`:' · Standalone testimonial'}</small><p>${r.review}</p></div><button class="button outline-dark" data-edit-review="${r.id}">Edit</button></article>`).join(''):'<p class="empty-review">No customer testimonials have been added yet.</p>';$('#leadershipList').innerHTML=(state.leadership||[]).length?(state.leadership||[]).map(member=>`<article class="admin-item admin-leadership-item">${member.image_url?`<img class="admin-leadership-photo" src="${member.image_url}" alt="">`:`<span class="admin-leadership-photo admin-leadership-placeholder">${(member.full_name||'?').split(/\s+/).map(x=>x[0]||'').slice(0,2).join('').toUpperCase()}</span>`}<div class="admin-leadership-copy"><b>${member.full_name}</b><small>${member.role} · Position ${member.sort_order} · ${Number(member.is_active)===1?'Visible':'Hidden'}</small><p>${member.bio}</p></div><div class="admin-leadership-actions"><button class="button outline-dark" data-edit-leadership="${member.id}">Edit</button><button class="button danger-button" data-delete-leadership="${member.id}">Delete</button></div></article>`).join(''):'<p class="empty-review">No leadership profiles have been added yet.</p>';Object.entries(state.settings).forEach(([k,v])=>{const el=$(`[name="${k}"]`);if(el)el.value=v})}async function refresh(){try{const data=await req('overview');state={orders:Array.isArray(data.orders)?data.orders:[],products:Array.isArray(data.products)?data.products:[],reviews:Array.isArray(data.reviews)?data.reviews:[],payments:Array.isArray(data.payments)?data.payments:[],leadership:Array.isArray(data.leadership)?data.leadership:[],settings:data.settings&&typeof data.settings==='object'?data.settings:{}};applyWebsiteName(state.settings.site_name);render();if(Array.isArray(data.warnings)&&data.warnings.length)message(data.warnings.join(' | '))}catch(e){if(e.message.includes('Administrator')){$('#adminLogin').classList.remove('hidden');$('#adminApp').classList.add('hidden')}message(e.message)}}function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Could not read customer picture'));
    reader.readAsDataURL(file);
  });
}
function openEditor(type,item={}){
  const isReview=type==='review';
  const isLeadership=type==='leadership';
  const orders=state.orders;
  $('#editorTitle').textContent=isReview?(item.id?'Edit customer testimonial':'Add customer testimonial'):isLeadership?(item.id?'Edit team member':'Add team member'):'Edit phone';

  $('#editorForm').innerHTML=isReview?`
    <label>Customer picture
      <input type="file" name="customer_photo_file" accept="image/jpeg,image/png,image/webp">
      <small>Optional. JPG, PNG or WebP, maximum 3 MB.</small>
    </label>
    ${item.customer_photo?`<div class="review-photo-preview"><img src="${item.customer_photo}" alt="Current customer picture"><small>Current picture</small></div>`:''}
    <label>Link to an order (optional)
      <select name="order_id">
        <option value="">No linked order / standalone testimonial</option>
        ${orders.map(o=>`<option value="${o.id}" ${String(o.id)===String(item.order_id)?'selected':''}>${o.reference} · ${o.full_name} · ${o.status}</option>`).join('')}
      </select>
      <small>An order does not have to be completed. Only completed linked orders are labelled “Verified order” publicly.</small>
    </label>
    <label>Customer name<input name="customer_name" required value="${item.customer_name||''}"></label>
    <label>Location<input name="location" required value="${item.location||''}"></label>
    <label>Customer type<input name="customer_type" value="${item.customer_type||'Customer'}" placeholder="e.g. Customer"></label>
    <label>Rating
      <select name="rating">${[5,4,3,2,1].map(n=>`<option value="${n}" ${Number(item.rating||5)===n?'selected':''}>${n} star${n===1?'':'s'}</option>`).join('')}</select>
    </label>
    <label>Review<textarea name="review" required minlength="5" rows="5">${item.review||''}</textarea></label>
    <label>Review date<input type="date" name="review_date" required value="${item.review_date||new Date().toISOString().slice(0,10)}"></label>
    <label><input type="checkbox" name="is_published" ${item.is_published!==0?'checked':''}> Publish on website</label>
    <button class="button primary-button" type="submit">Save testimonial</button>
  `:isLeadership?`
    <label>Profile image
      <input type="file" name="image_file" accept="image/jpeg,image/png,image/webp">
      <small>Optional. JPG, PNG or WebP, maximum 4 MB. A square portrait works best.</small>
    </label>
    ${item.image_url?`<div class="review-photo-preview"><img src="${item.image_url}" alt="Current team member image"><small>Current image</small></div>`:''}
    <label>Full name<input name="full_name" required value="${item.full_name||''}"></label>
    <label>Role / title<input name="role" required value="${item.role||''}" placeholder="e.g. CEO"></label>
    <label class="wide">Profile / bio<textarea name="bio" required minlength="5" rows="5">${item.bio||''}</textarea></label>
    <label>Display position<input type="number" min="0" name="sort_order" value="${item.sort_order||0}"><small>Lower numbers appear first.</small></label>
    <label><input type="checkbox" name="is_active" ${item.is_active!==0?'checked':''}> Show on homepage</label>
    <button class="button primary-button" type="submit">Save team member</button>
  `:`<input type="hidden" name="id" value="${item.id||''}"><label>Slug<input name="slug" required value="${item.slug||''}"></label><label>Brand<input name="brand" required value="${item.brand||''}"></label><label>Model<input name="model" required value="${item.model||''}"></label><label>Short specifications<input name="short_specs" value="${item.short_specs||''}"></label><label>Image URL<input name="image_url" value="${item.image_url||''}"></label><label>Cash price<input type="number" name="cash_price" required value="${item.cash_price||0}"></label><label>Required deposit<input type="number" name="required_deposit" value="${item.required_deposit||0}"></label><label>Daily rate<input type="number" name="daily_rate" value="${item.daily_rate||0}"></label><label>Available colours<input name="available_colours" placeholder="e.g. Black, Blue, Green, White" value="${item.available_colours||''}"><small>Separate each colour with a comma. These options will appear when a customer selects this phone.</small></label><label>Stock<input type="number" name="stock" value="${item.stock||0}"></label><label><input type="checkbox" name="is_active" ${item.is_active!==0?'checked':''}> Visible</label><button class="button primary-button" type="submit">Save phone</button>`;
  $('#editorForm').onsubmit=async e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(e.target));
    ['is_published','is_active'].forEach(k=>{if(e.target.elements[k])d[k]=e.target.elements[k].checked?'1':'0'});
    if(isReview){
      d.id=item.id||'';
      const file=e.target.elements.customer_photo_file?.files?.[0];
      if(file){
        if(file.size>3*1024*1024) return message('Customer picture must be 3 MB or smaller');
        try{d.customer_photo_data=await fileToDataUrl(file)}catch(err){return message(err.message)}
      }
      delete d.customer_photo_file;
    }
    if(isLeadership){
      d.id=item.id||'';
      const file=e.target.elements.image_file?.files?.[0];
      if(file){
        if(file.size>4*1024*1024) return message('Team member image must be 4 MB or smaller');
        try{d.image_data=await fileToDataUrl(file)}catch(err){return message(err.message)}
      }
      delete d.image_file;
    }
    try{
      await req(isReview?'review_save':isLeadership?'leadership_save':'product_save',d);
      $('#editorModal').classList.add('hidden');
      await refresh();
      message('Saved successfully',true);
    }catch(err){message(err.message)}
  };
  $('#editorModal').classList.remove('hidden');
}
$('#adminLoginForm').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));try{const r=await fetch('api/auth.php?action=login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});const x=await r.json();if(!r.ok)throw Error(x.error);admin=x.user;csrf=x.csrf;$('#adminLogin').classList.add('hidden');$('#adminApp').classList.remove('hidden');await refresh()}catch(err){$('#adminLoginMessage').textContent=err.message}};$('#adminLogout').onclick=async()=>{await fetch('api/auth.php?action=logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({action:'logout',csrf})});location.href='index.html'};$('#refreshAdmin').onclick=refresh;$('#newProduct').onclick=()=>openEditor('product');$('#newReview').onclick=()=>openEditor('review');$('#newLeadership').onclick=()=>openEditor('leadership');document.addEventListener('click',e=>{if(e.target.matches('[data-close]'))$('#editorModal').classList.add('hidden');if(e.target.matches('[data-edit-product]'))openEditor('product',state.products.find(x=>String(x.id)===e.target.dataset.editProduct));if(e.target.matches('[data-edit-review]'))openEditor('review',state.reviews.find(x=>String(x.id)===e.target.dataset.editReview));if(e.target.matches('[data-edit-leadership]'))openEditor('leadership',(state.leadership||[]).find(x=>String(x.id)===e.target.dataset.editLeadership));if(e.target.matches('[data-delete-leadership]')){const member=(state.leadership||[]).find(x=>String(x.id)===e.target.dataset.deleteLeadership);if(member&&confirm(`Delete ${member.full_name} from the leadership section?`))req('leadership_delete',{id:member.id}).then(()=>refresh()).then(()=>message('Team member deleted',true)).catch(err=>message(err.message));}if(e.target.matches('[data-panel]')){document.querySelectorAll('.admin-panel').forEach(x=>x.classList.add('hidden'));$('#'+e.target.dataset.panel).classList.remove('hidden');document.querySelectorAll('[data-panel]').forEach(x=>x.classList.remove('active'));e.target.classList.add('active')}});document.addEventListener('change',async e=>{if(e.target.matches('[data-order]'))try{await req('order_status',{id:e.target.dataset.order,status:e.target.value});await refresh();message('Order status updated',true)}catch(err){message(err.message)}});document.addEventListener('click',async e=>{if(e.target.matches('[data-payment]'))try{await req('payment_verify',{id:e.target.dataset.payment,status:e.target.dataset.status});await refresh();message('Payment review saved',true)}catch(err){message(err.message)}});$('#settingsForm').onsubmit=async e=>{e.preventDefault();try{await req('settings_save',Object.fromEntries(new FormData(e.target)));applyWebsiteName(new FormData(e.target).get('site_name'));message('Business settings saved',true)}catch(err){message(err.message)}};auth().then(d=>{if(d.user&&d.user.role==='admin'){$('#adminLogin').classList.add('hidden');$('#adminApp').classList.remove('hidden');refresh()}});
