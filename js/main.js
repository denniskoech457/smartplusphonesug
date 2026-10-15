
function applyWebsiteName(name) {
  name = String(name || 'SmartPay Phones Uganda').trim();
  if (!name) return;
  document.title = document.title.replace(/SmartPay Phones Uganda|SmartPay Phones|SmartPay/g, name);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n=>{ if(n.parentElement && !['SCRIPT','STYLE'].includes(n.parentElement.tagName)) n.nodeValue=n.nodeValue.replace(/SmartPay Phones Uganda|SmartPay Phones|SmartPay/g,name); });
  document.querySelectorAll('[aria-label],[title]').forEach(el=>['aria-label','title'].forEach(a=>{const v=el.getAttribute(a); if(v) el.setAttribute(a,v.replace(/SmartPay Phones Uganda|SmartPay Phones|SmartPay/g,name));}));
}
const API = 'api/';
let supabaseClient=null;
async function getSupabase(){if(!supabaseClient){const config=await (await fetch('/api/config')).json();if(!config.url||!config.key)throw Error('Authentication is not configured');const mod=await import('@supabase/supabase-js');supabaseClient=mod.createClient(config.url,config.key)}return supabaseClient}
async function getToken(){try{const db=await getSupabase();const {data}=await db.auth.getSession();return data.session?.access_token||''}catch{return ''}}

let csrf = '';
let products = [];
let user = null;
let currentStep = 1;
let websiteName = 'SmartPay Phones Uganda';
let easyPayWhatsAppNumber = '';

const $ = (selector) => document.querySelector(selector);
const fmt = (number) => `UGX ${Number(number || 0).toLocaleString('en-UG')}`;

async function request(file, action, body, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const options = { credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, signal: controller.signal };
  if (body) { options.method = 'POST'; options.body = JSON.stringify({ ...body, action, csrf }); }
  try {
    const token=await getToken();if(token)options.headers.Authorization=`Bearer ${token}`;
    const response = await fetch(`${API}${file}?action=${encodeURIComponent(action)}`, options);
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch (parseError) {
      throw new Error(`The server returned an invalid response for ${action}. Check PHP errors or the API path.`);
    }
    if (!response.ok) throw new Error(data.detail ? `${data.error || 'Request failed'} ${data.detail}` : (data.error || 'Request failed'));
    if (data.csrf) csrf = data.csrf;
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`The ${action} request timed out. The public API is not responding.`);
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 2600);
}

function openModal(id) {
  $(id).classList.remove('hidden');
  document.body.classList.add('modal-open');
}
function closeModals() {
  document.querySelectorAll('.modal').forEach((element) => element.classList.add('hidden'));
  document.body.classList.remove('modal-open');
}

function renderProducts(brand = 'All') {
  const list = brand === 'All' ? products : products.filter((product) => product.brand === brand);
  const badges = {
    'samsung-a06': ['Best Value', 'best-value'],
    'samsung-a16': ['Popular', 'popular'],
    'tecno-spark30': ['', ''],
    'tecno-camon40': ['New', 'new'],
    'infinix-smart9': ['', ''],
    'infinix-note50': ['Premium', 'premium'],
    'itel-a90': ['Budget Pick', 'budget'],
    'redmi-14c': ['', ''],
    'redmi-note14': ['Popular', 'popular'],
    'iphone-13': ['Premium', 'premium']
  };
  $('#phoneGrid').innerHTML = list.map((product, index) => {
    const badge = badges[product.slug] || ['', ''];
    const daily = Number(product.daily_rate || 0);
    const stock = Number(product.stock || 0);
    return `<article class="phone-card catalogue-card">
      ${badge[0] ? `<span class="product-badge ${badge[1]}">${badge[0]}</span>` : ''}
      <span class="stock-pill">${stock} in stock</span>
      <div class="product-image-wrap"><img src="${product.image_url}" alt="${product.brand} ${product.model}" loading="lazy"></div>
      <div class="product-info">
        <p class="product-brand">${product.brand}</p>
        <h3>${product.model}</h3>
        <p class="model product-specs">${product.short_specs}</p>
        <div class="color-row" aria-label="Available colours">${productColours(product).slice(0,4).map((colour, i) => `<span class="color-dot ${i === 0 ? 'selected' : ''}" style="--dot-color:${colourToHex(colour)}" title="${colour}"></span>`).join('')}<small>${productColours(product)[0] || 'Colour'}</small></div>
        <div class="plan-highlights">
          <div><span>Deposit</span><strong>${fmt(product.required_deposit)}</strong></div>
          <div><span>Daily</span><strong>${fmt(daily)}</strong></div>
        </div>
        <div class="product-actions">
          <a class="apply-small catalogue-apply" href="#apply" data-product="${product.id}">Apply Now <span>→</span></a>
          <button type="button" class="compare-button" data-compare="${product.id}" aria-label="Compare ${product.brand} ${product.model}" title="Compare">▥</button>
        </div>
      </div>
    </article>`;
  }).join('');
  document.querySelectorAll('[data-product]').forEach((link) => link.addEventListener('click', () => { setStep(1); window.setTimeout(() => selectApplicationProduct(link.dataset.product), 0); }));
  document.querySelectorAll('[data-compare]').forEach((button) => button.addEventListener('click', () => toggleCompare(button.dataset.compare)));
}

let compareProducts = [];
function toggleCompare(id) {
  const product = products.find((item) => String(item.id) === String(id));
  if (!product) return;
  const exists = compareProducts.some((item) => String(item.id) === String(id));
  if (exists) compareProducts = compareProducts.filter((item) => String(item.id) !== String(id));
  else if (compareProducts.length < 3) compareProducts.push(product);
  else return toast('You can compare up to 3 phones.');
  renderCompareBar();
  document.querySelectorAll('[data-compare]').forEach((button) => button.classList.toggle('selected', compareProducts.some((item) => String(item.id) === String(button.dataset.compare))));
  if (compareProducts.length >= 2) openCompareModal();
}
function renderCompareBar() {
  let bar = $('#compareBar');
  if (!bar) return;
  bar.classList.toggle('show', compareProducts.length > 0);
  bar.querySelector('.compare-count').textContent = `${compareProducts.length} selected`;
  bar.querySelector('.compare-items').innerHTML = compareProducts.map((p) => `<span>${p.brand} ${p.model}</span>`).join('');
}
function openCompareModal() {
  const modal = $('#compareModal');
  if (!modal) return;
  modal.classList.add('show');
  modal.querySelector('.compare-table').innerHTML = `<div class="compare-row compare-head"><strong>Specification</strong>${compareProducts.map(p => `<strong>${p.brand}<br>${p.model}</strong>`).join('')}</div>
    ${[['Storage / RAM', p => p.short_specs], ['Cash price', p => fmt(p.cash_price)], ['Required deposit', p => fmt(p.required_deposit)], ['Daily payment', p => fmt(p.daily_rate)], ['Stock', p => `${p.stock} available`]].map(([label, fn]) => `<div class="compare-row"><span>${label}</span>${compareProducts.map(p => `<span>${fn(p)}</span>`).join('')}</div>`).join('')}`;
}

function renderFilters() {
  const brands = ['All', ...new Set(products.map((product) => product.brand))];
  if ($('#brandFilters')) $('#brandFilters').innerHTML = brands.map((brand) => `<button type="button" class="filter ${brand === 'All' ? 'active' : ''}" data-brand="${brand}">${brand}</button>`).join('');
  document.querySelectorAll('[data-brand]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active')); button.classList.add('active'); renderProducts(button.dataset.brand); }));
}

const applicationColours = {
  Apple: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green', 'Red'],
  Samsung: ['Black', 'Light Green', 'Gold', 'White'],
  Tecno: ['Black', 'White', 'Blue', 'Green'],
  Infinix: ['Black', 'Titanium', 'Green', 'Purple'],
  Redmi: ['Midnight Black', 'Starry Blue', 'Sage Green', 'Purple'],
  itel: ['Black', 'Blue', 'Green', 'Gold']
};


function productColours(product) {
  const raw = String(product?.available_colours || '').trim();
  if (raw) return raw.split(',').map((c) => c.trim()).filter(Boolean);
  return applicationColours[product?.brand] || ['Black', 'White', 'Blue', 'Green'];
}

const colourHex = {
  black:'#111827', white:'#f8fafc', blue:'#3b82f6', green:'#22c55e', red:'#ef4444', pink:'#ec4899', purple:'#8b5cf6', gold:'#eab308',
  midnight:'#111827', starlight:'#f5f3ea', 'light green':'#bbf7d0', titanium:'#8b8b83', 'midnight black':'#111827', 'starry blue':'#2563eb', 'sage green':'#84a98c'
};
function colourToHex(name) { return colourHex[String(name||'').toLowerCase()] || '#cbd5e1'; }

function selectApplicationProduct(id) {
  const grid = $('#applicationPhoneGrid');
  if (!grid) return;
  const card = grid.querySelector(`[data-apply-product="${id}"]`);
  if (!card) return;
  grid.querySelectorAll('[data-apply-product]').forEach((item) => {
    item.classList.remove('selected');
    const input = item.querySelector('input[type="radio"]');
    if (input) input.checked = false;
  });
  card.classList.add('selected');
  const radio = card.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
  if ($('#applyProduct')) $('#applyProduct').value = id;
  grid.classList.add('has-selection');
  const details = $('#selectedPlanDetails');
  if (details) details.hidden = false;
  renderApplicationColours();
  updateDeposit();
}

function renderApplicationPhones() {
  const grid = $('#applicationPhoneGrid');
  if (!grid) return;
  grid.classList.remove('has-selection');
  grid.innerHTML = products.map((product) => `<label class="application-phone-option" data-apply-product="${product.id}">
    <input type="radio" name="application_product_choice" value="${product.id}">
    <img src="${product.image_url || ''}" alt="${product.brand} ${product.model}">
    <span class="application-phone-meta"><small>${product.brand}</small><strong>${product.model}</strong><span>${product.short_specs || ''}</span><b>Deposit ${fmt(product.required_deposit)}</b></span>
  </label>`).join('');
  if ($('#applyProduct')) $('#applyProduct').value = '';
  const details = $('#selectedPlanDetails');
  if (details) details.hidden = true;
  grid.querySelectorAll('[data-apply-product]').forEach((card) => card.addEventListener('click', () => selectApplicationProduct(card.dataset.applyProduct)));
}


function showAllApplicationPhones() {
  const grid = $('#applicationPhoneGrid');
  if (!grid) return;
  grid.classList.remove('has-selection');
  grid.querySelectorAll('[data-apply-product]').forEach((item) => item.classList.remove('selected'));
  if ($('#applyProduct')) $('#applyProduct').value = '';
  const details = $('#selectedPlanDetails');
  if (details) details.hidden = true;
  const tip = $('#applicationStepTip');
  if (tip) tip.textContent = 'Select a phone to see colours, payment schedule, and estimated instalments.';
}

function renderApplicationColours() {
  const product = selectedApplicationProduct();
  const holder = $('#applyColourChips');
  if (!product || !holder) return;
  const colours = productColours(product);
  holder.innerHTML = colours.map((colour, index) => `<button type="button" class="colour-chip ${index === 0 ? 'active' : ''}" data-colour="${colour}">${colour}</button>`).join('');
  if ($('#applyColour')) $('#applyColour').value = colours[0] || '';
  holder.querySelectorAll('[data-colour]').forEach((chip) => chip.addEventListener('click', () => {
    holder.querySelectorAll('[data-colour]').forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
    if ($('#applyColour')) $('#applyColour').value = chip.dataset.colour;
  }));
}

function fillSelects() {
  const options = products.map((product) => `<option value="${product.id}">${product.brand} ${product.model}</option>`).join('');
  const calcPhone = $('#calcPhone');
  if (calcPhone) calcPhone.innerHTML = options;
  renderApplicationPhones();
  updateCalculator();
  updateDeposit();
}

function selectedCalculatorProduct() { const el = $('#calcPhone'); if (!el) return products[0] || null; return products.find((product) => String(product.id) === String(el.value)) || products[0] || null; }
function selectedApplicationProduct() { const el = $('#applyProduct'); if (!el) return null; return products.find((product) => String(product.id) === String(el.value)) || null; }

function updateCalculator() {
  const phoneSelect = $('#calcPhone');
  if (!phoneSelect || !products.length) return;

  const product = products.find((item) => String(item.id) === String(phoneSelect.value)) || products[0];
  if (!product) return;

  const total = Number(product.cash_price || 0);
  const deposit = Number(product.required_deposit || 0);
  const balance = Math.max(0, total - deposit);
  const configuredDaily = Number(product.daily_rate || 0);
  const daily = configuredDaily > 0 ? configuredDaily : Math.ceil(balance / 365);
  const weekly = daily * 7;

  if ($('#calcTotal')) $('#calcTotal').textContent = fmt(total);
  if ($('#calcDeposit')) $('#calcDeposit').textContent = fmt(deposit);
  if ($('#calcDaily')) $('#calcDaily').textContent = fmt(daily);
  if ($('#calcWeekly')) $('#calcWeekly').textContent = fmt(weekly);
}

function updateDeposit() {
  const product = selectedApplicationProduct();
  if (!product) return;
  const form = $('#applicationForm');
  if (!form) return;
  const monthsField = form.elements ? form.elements.months : null;
  const monthsValue = monthsField ? monthsField.value : '';
  const frequency = $('#paymentFrequency') ? $('#paymentFrequency').value : '';
  const cash = Number(product.cash_price || 0);
  const deposit = Number(product.required_deposit || 0);
  const balance = Math.max(0, cash - deposit);

  // Do not calculate instalments until the customer actively chooses both fields.
  if (!monthsValue || !frequency) {
    if ($('#applyCashPrice')) $('#applyCashPrice').textContent = fmt(cash);
    if ($('#applySelectedDeposit')) $('#applySelectedDeposit').textContent = fmt(deposit);
    if ($('#applyBalance')) $('#applyBalance').textContent = fmt(balance);
    if ($('#applyEstimateLabel')) $('#applyEstimateLabel').textContent = 'Estimated payment';
    if ($('#applyEstimate')) $('#applyEstimate').textContent = 'Select period & frequency';
    return;
  }

  const months = Number(monthsValue);
  const days = Math.max(1, months * 30);
  const estimates = {
    daily: Math.ceil(balance / days),
    weekly: Math.ceil(balance / Math.max(1, months * 4)),
    monthly: Math.ceil(balance / Math.max(1, months))
  };
  const labels = { daily: 'Est. daily', weekly: 'Est. weekly', monthly: 'Est. monthly' };
  if ($('#applyDeposit')) $('#applyDeposit').textContent = fmt(deposit);
  if ($('#reviewDeposit')) $('#reviewDeposit').textContent = fmt(deposit);
  if ($('#reviewProduct')) $('#reviewProduct').textContent = `${product.brand} ${product.model}`;
  if ($('#reviewProductSpecs')) $('#reviewProductSpecs').textContent = `${product.short_specs || ''}${$('#applyColour') && $('#applyColour').value ? ' · ' + $('#applyColour').value : ''}`;
  if ($('#reviewCashPrice')) $('#reviewCashPrice').textContent = fmt(cash);
  if ($('#reviewBalance')) $('#reviewBalance').textContent = fmt(balance);
  if ($('#reviewMonths')) $('#reviewMonths').textContent = `${months} months`;
  if ($('#reviewEstimateLabel')) $('#reviewEstimateLabel').textContent = labels[frequency] || labels.daily;
  if ($('#reviewEstimate')) $('#reviewEstimate').textContent = fmt(estimates[frequency] || estimates.daily);
  if ($('#applyCashPrice')) $('#applyCashPrice').textContent = fmt(cash);
  if ($('#applySelectedDeposit')) $('#applySelectedDeposit').textContent = fmt(deposit);
  if ($('#applyBalance')) $('#applyBalance').textContent = fmt(balance);
  if ($('#applyEstimateLabel')) $('#applyEstimateLabel').textContent = labels[frequency] || labels.daily;
  if ($('#applyEstimate')) $('#applyEstimate').textContent = fmt(estimates[frequency] || estimates.daily);
}


function updateDeliveryMethod() {
  const form = $('#applicationForm');
  if (!form || !form.elements.delivery_method) return;
  const method = form.elements.delivery_method ? form.elements.delivery_method.value : '';
  const isHome = method === 'home_delivery';
  document.querySelectorAll('.delivery-method-option').forEach((option) => {
    const radio = option.querySelector('input[type="radio"]');
    option.classList.toggle('selected', !!radio && radio.checked);
  });
  const homeFields = $('#homeDeliveryFields');
  const district = $('#deliveryDistrict');
  const address = $('#deliveryAddress');
  if (homeFields) homeFields.hidden = !isHome;
  if (district) {
    district.required = isHome;
    if (!isHome) district.value = 'Kampala';
  }
  if (address) {
    address.required = isHome;
    if (!isHome) address.value = 'SmartPay office collection';
  }
}


function updateReview() {
  const form = $('#applicationForm');
  const name = form.elements.full_name ? (form.elements.full_name.value || '—') : '—';
  const phone = form.elements.phone_number ? (form.elements.phone_number.value || '') : '';
  const whatsapp = form.elements.alternative_number ? (form.elements.alternative_number.value || '') : '';
  const method = form.elements.delivery_method ? form.elements.delivery_method.value : '';
  const district = form.elements.district ? (form.elements.district.value || '') : '';
  const address = form.elements.address ? (form.elements.address.value || '') : '';
  if ($('#reviewName')) $('#reviewName').textContent = name;
  if ($('#reviewDistrict')) $('#reviewDistrict').textContent = method === 'office_collection' ? 'Office collection' : (district || '—');
  if ($('#reviewCustomerLine')) $('#reviewCustomerLine').textContent = phone ? `${name} · ${phone}` : name;
  if ($('#reviewWhatsappLine')) $('#reviewWhatsappLine').textContent = `WhatsApp: ${whatsapp || '—'}`;
  if ($('#reviewDeliveryLine')) $('#reviewDeliveryLine').textContent = method === 'office_collection' ? 'Office collection' : [address, district].filter(Boolean).join(', ');
  updateDeposit();
}

function validateStep(step) {
  const section = $(`.application-step[data-step="${step}"]`);
  for (const input of section.querySelectorAll('input,select,textarea')) {
    if (!input.checkValidity()) { input.reportValidity(); return false; }
  }
  return true;
}

function prefillApplicantDetails() {
  if (!user) return;
  const fullName = $('#applyFullName');
  const email = $('#applyContactEmail');
  const whatsapp = $('#applyAlternativeNumber');
  if (fullName && !fullName.value) fullName.value = user.name || '';
  if (email && !email.value) email.value = user.email || '';
  if (whatsapp && !whatsapp.value && user.whatsapp_number) whatsapp.value = user.whatsapp_number;
}

function setStep(step) {
  currentStep = Math.max(1, Math.min(4, step));
  if (currentStep === 2) prefillApplicantDetails();
  document.querySelectorAll('.application-step').forEach((element) => element.classList.toggle('active', Number(element.dataset.step) === currentStep));
  document.querySelectorAll('.progress-step').forEach((element) => { const number = Number(element.dataset.progress); element.classList.toggle('active', number === currentStep); element.classList.toggle('complete', number < currentStep); });
  if (currentStep === 4) updateReview();

  const shell = document.querySelector('#apply .application-shell');
  const overlayOpen = currentStep > 1;
  if (shell) shell.classList.toggle('application-overlay-active', overlayOpen);
  document.body.classList.toggle('application-overlay-open', overlayOpen);

  if (overlayOpen) {
    window.requestAnimationFrame(() => {
      if (shell) shell.scrollTop = 0;
      const activeStep = document.querySelector(`.application-step[data-step="${currentStep}"]`);
      if (activeStep) activeStep.scrollIntoView({behavior:'smooth', block:'start'});
    });
  } else {
    window.requestAnimationFrame(() => $('#apply').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}

async function loadPublic() {
  const grid = $('#phoneGrid');
  if (grid) grid.innerHTML = '<p class="loading">Connecting to the phone catalogue…</p>';

  try {
    // Confirm that the public-facing API can reach the same products table used by admin.
    const health = await request('marketplace', 'health', undefined, 8000);
    if (!health.ok || health.database !== 'connected') throw new Error('The public website could not connect to the database.');
    if (health.products_total < 1) throw new Error('Database connected, but there are no products in the products table.');
    if (health.products_active < 1) throw new Error(`Database connected (${health.products_total} products found), but none are marked Visible/active in Admin.`);
    if (health.products_in_stock < 1) throw new Error(`Database connected (${health.products_active} active products found), but all active products have stock set to 0.`);

    const productData = await request('marketplace', 'products', undefined, 10000);
    fetch('/api/public').then(r=>r.ok?r.json():null).then(d=>{window.smartpayHours=d?.hours||[];const hours=document.querySelector('.footer-v2-hours');if(hours&&d?.hours?.length){hours.querySelectorAll('.hours-row').forEach(el=>el.remove());const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];d.hours.forEach(h=>{const el=document.createElement('div');el.className='hours-row';el.textContent=days[h.day_of_week]+': '+(h.is_closed?'Closed':`${String(h.opens_at).slice(0,5)} – ${String(h.closes_at).slice(0,5)}`);hours.insertBefore(el,hours.querySelector('.footer-apply-btn'));});}}).catch(()=>{});
    products = Array.isArray(productData.products) ? productData.products : [];
    if (!products.length) throw new Error('Database connected, but the public catalogue returned no in-stock active phones.');

    // Render phones immediately. Settings/reviews must never block the catalogue.
    renderFilters();
    renderProducts();
    fillSelects();
    renderCompareBar();

    const notice = products[0];
    if (notice && $('#stockNotice')) $('#stockNotice').innerHTML = `<span>▦</span><div><b>AVAILABLE NOW</b><p>${notice.brand} ${notice.model} is currently in stock.</p><small>Explore flexible 3–12 month payment plans.</small></div>`;

    // Load optional homepage data independently so a missing footer field/review does not break phones.
    request('marketplace', 'settings').then((settingsData) => {
      const settings = settingsData.settings || {};
      websiteName = settings.site_name || 'SmartPay Phones Uganda';
      applyWebsiteName(websiteName);
      easyPayWhatsAppNumber = settings.support_phone || '';
      if ($('#footerPhone')) $('#footerPhone').textContent = settings.support_phone || '';
      if ($('#footerPhoneLink')) $('#footerPhoneLink').href = 'tel:' + String(settings.support_phone || '').replace(/[^+\d]/g, '');
      if ($('#footerEmail')) $('#footerEmail').textContent = settings.support_email || '';
      if ($('#footerEmailLink')) $('#footerEmailLink').href = 'mailto:' + (settings.support_email || '');
      const loc=document.querySelector('.footer-v2-contact .footer-contact-row:first-of-type');if(loc){const strong=loc.querySelector('strong');if(strong)strong.textContent=settings.business_address||settings.location||'';if(settings.maps_url&&/^https:\/\//.test(settings.maps_url))loc.href=settings.maps_url;else loc.removeAttribute('href');}
      const logo=document.querySelector('.footer-logo');if(logo&&settings.site_logo_url&&/^https:\/\//.test(settings.site_logo_url)){let img=logo.querySelector('img');if(!img){img=document.createElement('img');img.style.cssText='max-height:52px;max-width:140px;object-fit:contain';logo.prepend(img)}img.src=settings.site_logo_url;img.alt=websiteName;}
      if(settings.support_whatsapp)easyPayWhatsAppNumber=settings.support_whatsapp;
      const hours=document.querySelector('.footer-v2-hours');if(hours&&window.smartpayHours?.length){hours.querySelectorAll('.hours-row').forEach(el=>el.remove());const labels=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];for(const h of window.smartpayHours){const el=document.createElement('div');el.className='hours-row';const day=document.createElement('span');day.textContent=labels[h.day_of_week];const time=document.createElement('strong');time.textContent=h.is_closed?'Closed':`${String(h.opens_at||'').slice(0,5)} – ${String(h.closes_at||'').slice(0,5)}`;el.append(day,time);hours.insertBefore(el,hours.querySelector('.footer-apply-btn'));}}
    }).catch((error) => console.warn('SmartPay settings:', error));

    request('marketplace', 'reviews').then((reviewData) => {
      if (!$('#reviewsGrid')) return;
      const reviews = Array.isArray(reviewData.reviews) ? reviewData.reviews : [];
      $('#reviewsGrid').innerHTML = reviews.length ? reviews.map((review) => {
        const rating = Math.max(1, Math.min(5, Number(review.rating || 5)));
        const badge = Number(review.verified_order) === 1 ? '✓ Verified order' : 'Customer testimonial';
        const avatar = review.customer_photo
          ? `<img class="review-customer-photo" src="${review.customer_photo}" alt="${review.customer_name}">`
          : `<span class="review-customer-photo review-customer-initial">${(review.customer_name || '?').charAt(0)}</span>`;
        return `<article class="review-card">
          <div class="review-card-person">${avatar}<div><strong>${review.customer_name}</strong><small>${review.customer_type || 'Customer'} · ${review.location}</small></div></div>
          <div class="stars">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div>
          <blockquote>“${review.review}”</blockquote>
          <small>${badge} · ${review.review_date}</small>
        </article>`;
      }).join('') : '<div class="empty-review reviews-empty-state"><span class="review-verified-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.8 3.45 12 2l2.2 1.45 2.62-.18.92 2.46 2.27 1.31-.18 2.62L21.28 12l-1.45 2.34.18 2.62-2.27 1.31-.92 2.46-2.62-.18L12 22l-2.2-1.45-2.62.18-.92-2.46-2.27-1.31.18-2.62L2.72 12l1.45-2.34-.18-2.62 2.27-1.31.92-2.46 2.62.18Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><h3>Customer testimonials will appear here</h3><p>Testimonials approved by SmartPay administrators will be displayed here.</p></div>';
    }).catch((error) => console.warn('SmartPay reviews:', error));

    request('marketplace', 'team').then((teamData) => {
      const grid = $('#leadershipGrid');
      if (!grid) return;
      const team = Array.isArray(teamData.team) ? teamData.team : [];
      const initials = (name='') => name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(part => part.charAt(0).toUpperCase()).join('') || 'EP';
      grid.innerHTML = team.length ? team.map((member) => {
        const photo = member.image_url
          ? `<img class="team-photo" src="${member.image_url}" alt="${member.full_name}">`
          : `<div class="team-photo team-avatar" aria-hidden="true">${initials(member.full_name)}</div>`;
        return `<article class="team-card">
          ${photo}
          <span class="team-role">${member.role}</span>
          <h3>${member.full_name}</h3>
          <p>${member.bio}</p>
        </article>`;
      }).join('') : '<article class="team-card team-loading-card"><div class="team-photo team-avatar" aria-hidden="true">EP</div><span class="team-role">SmartPay</span><h3>Leadership profiles coming soon</h3><p>The SmartPay leadership team will be published here.</p></article>';
    }).catch((error) => console.warn('SmartPay leadership:', error));

  } catch (error) {
    console.error('SmartPay catalogue:', error);
    if (grid) grid.innerHTML = `<div class="catalogue-load-error"><strong>Phones could not be loaded.</strong><p>${error.message}</p><button type="button" class="button primary-button" id="retryPhones">Retry</button></div>`;
    const retry = $('#retryPhones');
    if (retry) retry.onclick = loadPublic;
  }
}

async function loadSession() {
  try { const data = await request('auth', 'me'); user = data.user; csrf = data.csrf || csrf; prefillApplicantDetails(); if ($('#accountButton')) $('#accountButton').textContent = user ? 'My account' : 'Sign in'; } catch (error) { /* unauthenticated visitors are expected */ }
}

function escapeHtml(value){return String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
function renderAccount(orders) {
  if (!user) { $('#accountContent').innerHTML = ''; return; }
  const orderMarkup = orders.length ? orders.map((order) => {
    const paymentMarkup = '';
    return `<article class="order-card"><strong>${escapeHtml(order.reference)}</strong><span>${escapeHtml(order.brand)} ${escapeHtml(order.model)} · ${escapeHtml(order.status)}</span><small>${fmt(order.deposit_amount)} deposit</small>${paymentMarkup}</article>`;
  }).join('') : '<p class="empty-review">No orders yet. Apply for a phone to see it here.</p>';
  if ($('#accountContent')) $('#accountContent').innerHTML = `<p class="muted">Signed in as <strong>${escapeHtml(user.name)}</strong><br>${escapeHtml(user.email)}</p>${orderMarkup}`;
  document.querySelectorAll('.payment-form').forEach((form) => form.addEventListener('submit', async (event) => { event.preventDefault(); const details = Object.fromEntries(new FormData(form)); try { toast('Online payment reference verification is not available yet. Please contact support.'); } catch (error) { toast(error.message); } }));
}

async function openAccount() {
  if (!user) { openModal('#authModal'); return; }
  try { const data = await request('marketplace', 'my_orders'); renderAccount(data.orders); openModal('#accountPanel'); } catch (error) { toast(error.message); }
}

async function authSubmit(form, action) {
  try {const fields=Object.fromEntries(new FormData(form));const db=await getSupabase();
    const result=action==='register'?await db.auth.signUp({email:fields.email,password:fields.password,options:{data:{name:fields.name||fields.full_name||''}}}):await db.auth.signInWithPassword({email:fields.email,password:fields.password});
    if(result.error)throw result.error;
    if(!result.data.session){if($('#authMessage'))$('#authMessage').textContent='Account created. Email confirmation is required by the current Supabase settings. Disable Confirm email in Supabase Authentication → Providers → Email to allow immediate sign-in.';return}
    closeModals();toast(action==='register'?'Account created and signed in':'Signed in');
    try { await loadSession(); } catch(e) { console.warn('Profile refresh failed after authentication:',e); }
    if($('#accountButton'))$('#accountButton').textContent='My account';
  }catch(error){if($('#authMessage'))$('#authMessage').textContent=error.message;}
}

document.addEventListener('click', (event) => {
  const closeTarget = event.target.closest ? event.target.closest('[data-close]') : null;
  const accountTarget = event.target.closest ? event.target.closest('#accountButton') : null;
  const authTab = event.target.closest ? event.target.closest('[data-auth-tab]') : null;
  const nextButton = event.target.closest ? event.target.closest('[data-next]') : null;
  const backButton = event.target.closest ? event.target.closest('[data-back]') : null;
  if (closeTarget) closeModals();
  if (accountTarget) openAccount();
  if (authTab) { document.querySelectorAll('[data-auth-tab]').forEach((item) => item.classList.remove('active')); authTab.classList.add('active'); document.querySelectorAll('[data-auth-form]').forEach((form) => form.classList.toggle('hidden', form.dataset.authForm !== authTab.dataset.authTab)); }
  if (nextButton) { const next = Number(nextButton.dataset.next); if (validateStep(currentStep)) setStep(next); }
  if (backButton) setStep(Number(backButton.dataset.back));
});

const applicationOverlayClose = $('#applicationOverlayClose');
if (applicationOverlayClose) applicationOverlayClose.addEventListener('click', () => setStep(1));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && currentStep > 1) setStep(1);
});

if ($('#loginForm')) $('#loginForm').onsubmit = (event) => { event.preventDefault(); authSubmit(event.target, 'login'); };
if ($('#registerForm')) $('#registerForm').onsubmit = (event) => { event.preventDefault(); authSubmit(event.target, 'register'); };
if ($('#logoutButton')) $('#logoutButton').onclick = async () => { try { await (await getSupabase()).auth.signOut(); user = null; closeModals(); $('#accountButton').textContent = 'Sign in'; toast('Signed out'); } catch (error) { toast(error.message); } };
const waitForOrderVerification = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function showOrderVerification(){
  const overlay = $('#orderVerificationOverlay');
  if (!overlay) return;
  overlay.classList.remove('verified');
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  if ($('#orderVerificationTitle')) $('#orderVerificationTitle').textContent = 'Verifying your details';
  if ($('#orderVerificationText')) $('#orderVerificationText').textContent = 'Please wait while we verify your application details.';
  document.body.classList.add('order-verification-active');
}

function showOrderVerified(){
  const overlay = $('#orderVerificationOverlay');
  if (!overlay) return;
  overlay.classList.add('verified');
  if ($('#orderVerificationTitle')) $('#orderVerificationTitle').textContent = 'Details verified';
  if ($('#orderVerificationText')) $('#orderVerificationText').textContent = 'Your details have been verified. Submitting your order now...';
}

function hideOrderVerification(){
  const overlay = $('#orderVerificationOverlay');
  if (!overlay) return;
  overlay.classList.remove('show','verified');
  overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('order-verification-active');
}


function whatsappDigits(number) {
  let digits = String(number || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '256' + digits.slice(1);
  return digits;
}

function buildApplicationWhatsAppMessage(payload, reference, depositAmount) {
  const product = selectedApplicationProduct();
  const delivery = payload.delivery_method === 'office_collection'
    ? 'Office collection'
    : [payload.address, payload.district].filter(Boolean).join(', ');
  return [
    websiteName + ' Application',
    `Order reference: ${reference}`,
    `Phone: ${product ? `${product.brand} ${product.model}` : '—'}`,
    `Colour: ${payload.preferred_colour || '—'}`,
    `Plan: ${payload.months || '—'} months / ${payload.payment_frequency || 'daily'}`,
    `Required deposit: ${fmt(depositAmount ?? (product ? product.required_deposit : 0))}`,
    `Customer: ${payload.full_name || '—'}`,
    `NIN: ${payload.national_id || '—'}`,
    `Phone number: ${payload.phone_number || '—'}`,
    `WhatsApp: ${payload.alternative_number || '—'}`,
    `Email: ${payload.contact_email || '—'}`,
    `Delivery: ${delivery || '—'}`,
    `Notes: ${payload.delivery_notes || 'None'}`
  ].join('\n');
}

function prepareApplicationWhatsApp(payload, reference, depositAmount) {
  const link = $('#sendApplicationWhatsApp');
  if (!link) return;
  const destination = whatsappDigits(easyPayWhatsAppNumber);
  if (!destination) {
    link.classList.add('hidden');
    return;
  }
  const text = buildApplicationWhatsAppMessage(payload, reference, depositAmount);
  link.href = `https://wa.me/${destination}?text=${encodeURIComponent(text)}`;
  link.classList.remove('hidden');
}

let submittedOrderReference = '';
async function submitSecureOrder() {
  const form = $('#applicationForm');
  if (!form) return;

  // Validate every guided step ourselves. This avoids the browser silently blocking
  // submission because required controls live inside currently hidden wizard panels.
  for (const step of [1, 2, 3, 4]) {
    if (!validateStep(step)) { setStep(step); return; }
  }
  const productField = form.elements ? form.elements.product_id : null;
  if (!productField || !productField.value) { setStep(1); toast('Please select a phone first'); return; }
  const whatsappInput=form.elements.alternative_number;
  if(!whatsappInput || !whatsappInput.value.trim()){ setStep(2); if(whatsappInput) whatsappInput.focus(); toast('WhatsApp number is required.'); return; }

  const submitButton = $('#submitSecureOrder') || form.querySelector('.review-submit-button');
  const message = $('#applicationMessage');
  if (message) { message.textContent = ''; message.className = 'wide form-note'; }
  if (submitButton) { submitButton.disabled = true; submitButton.dataset.originalText = submitButton.innerHTML; submitButton.innerHTML = 'Verifying details…'; }

  showOrderVerification();
  // Do not display a fake verification animation: no payment has been verified.

  if (submitButton) submitButton.innerHTML = 'Submitting order…';

  try {
    const payload = Object.fromEntries(new FormData(form));
    payload.turnstile_token=window.turnstile?.getResponse?.()||'';
    const result = await request('marketplace', 'order', payload, 20000);
    window.turnstile?.reset?.();
    submittedOrderReference = result.reference;
    prepareApplicationWhatsApp(payload, result.reference, result.deposit);
    const deposit = fmt(result.deposit);
    if ($('#successReference')) $('#successReference').textContent = result.reference;
    if ($('#successDeposit')) $('#successDeposit').textContent = deposit;
    if ($('#successDepositText')) $('#successDepositText').textContent = deposit;
    if ($('#successMessage')) $('#successMessage').textContent = 'Your application has been received. Send your application details to WhatsApp to continue.';
    hideOrderVerification();
    const orderSuccess = $('#orderSuccess');
    if (orderSuccess) orderSuccess.classList.remove('hidden');
    document.querySelectorAll('.application-step').forEach((item) => item.classList.remove('active'));
    document.querySelector('.progress-step[data-progress="4"]').classList.add('complete');
    toast('Application received');
    $('#orderSuccess')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    hideOrderVerification();
    window.turnstile?.reset?.();
    if (message) { message.textContent = error.message; message.className = 'wide form-note error application-submit-error'; }
    toast(error.message);
  } finally {
    hideOrderVerification();
    if (submitButton) { submitButton.disabled = false; submitButton.innerHTML = submitButton.dataset.originalText || 'Submit secure order <span>✓</span>'; }
  }
}
if ($('#changeApplicationPhone')) $('#changeApplicationPhone').onclick = showAllApplicationPhones;



// Keep the selected phone payment summary live when period/frequency changes.

const calculatorPhoneSelect = $('#calcPhone');
if (calculatorPhoneSelect) {
  calculatorPhoneSelect.addEventListener('change', updateCalculator);
  calculatorPhoneSelect.addEventListener('input', updateCalculator);
}

const applicationMonthsSelect = document.querySelector('#applicationForm select[name="months"]');
const applicationFrequencySelect = document.querySelector('#applicationForm select[name="payment_frequency"]');
if (applicationMonthsSelect) {
  applicationMonthsSelect.addEventListener('change', updateDeposit);
}
if (applicationFrequencySelect) {
  applicationFrequencySelect.addEventListener('change', updateDeposit);
}

if ($('#applicationForm')) $('#applicationForm').onsubmit = (event) => { event.preventDefault(); submitSecureOrder(); };
if ($('#submitSecureOrder')) $('#submitSecureOrder').onclick = submitSecureOrder;



(() => {
  const header = document.querySelector('.hero-site-header');
  if (!header) return;
  const updateHeaderOnScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 36);
  };
  updateHeaderOnScroll();
  window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });
})();


// Rotating recent-purchase social proof popup.
(() => {
  const popup = document.querySelector('#recentPurchasePopup');
  const nameEl = document.querySelector('#recentPurchaseName');
  const phoneEl = document.querySelector('#recentPurchasePhone');
  if (!popup || !nameEl || !phoneEl) return;

  const purchases = [
    { name: 'John K. in Mbale', phone: 'Redmi 14C' },
    { name: 'Grace K. in Ngulu', phone: 'Samsung Galaxy A06' },
    { name: 'Moses O. in Jinja', phone: 'iPhone 13' },
    { name: 'Sarah K. in Kampala', phone: 'Tecno Camon 40' },
    { name: 'Jennifer M. in Jinja', phone: 'Redmi Note 14' },
    { name: 'Amina B. in Masaka', phone: 'Samsung Galaxy A16' },
    { name: 'David A. in Mbarara', phone: 'Tecno Spark 30' },
    { name: 'Peter W. in Entebbe', phone: 'Infinix Note 50' }
  ];

  let index = 0;
  let timer = null;

  const showNextPurchase = () => {
    const purchase = purchases[index];
    nameEl.textContent = purchase.name;
    phoneEl.textContent = purchase.phone;

    popup.classList.add('show');

    // Each notification remains visible for three seconds.
    timer = window.setTimeout(() => {
      popup.classList.remove('show');

      // Small transition gap before the next purchase appears.
      window.setTimeout(() => {
        index = (index + 1) % purchases.length;
        showNextPurchase();
      }, 220);
    }, 3000);
  };

  // Give the homepage a short moment to settle before starting.
  window.setTimeout(showNextPurchase, 900);

  window.addEventListener('beforeunload', () => {
    if (timer) window.clearTimeout(timer);
  });
})();


// Direct customer dashboard navigation.
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-open-customer-dashboard], #openCustomerDashboard');
  if (!button) return;
  event.preventDefault();
  window.location.assign('dashboard.html');
});




// Mobile navigation.
(() => {
  const siteNav = document.getElementById('siteNav');
  const menuToggle = document.getElementById('menuToggle');
  if (!siteNav || !menuToggle) return;

  const setOpen = (open) => {
    siteNav.classList.toggle('open', open);
    menuToggle.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    menuToggle.textContent = open ? '✕' : '☰';
    document.body.classList.toggle('mobile-nav-open', open);
  };

  menuToggle.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(!siteNav.classList.contains('open'));
  });

  siteNav.querySelectorAll('a, button').forEach((item) => {
    if (item === menuToggle) return;
    item.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('click', (event) => {
    if (window.innerWidth > 760 || !siteNav.classList.contains('open')) return;
    if (siteNav.contains(event.target) || menuToggle.contains(event.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setOpen(false);
  });

  setOpen(false);
})();


// Responsive testimonials slider: 2 cards per view on desktop, 1 on mobile.
(() => {
  const track = document.querySelector('#reviewsGrid');
  if (!track) return;

  const shell = track.closest('.testimonial-slider-shell');
  if (!shell) return;

  const prev = shell.querySelector('.testimonial-prev');
  const next = shell.querySelector('.testimonial-next');
  const dots = shell.querySelector('.testimonial-slider-dots');
  let index = 0;

  const perView = () => window.innerWidth <= 760 ? 1 : 2;
  const cards = () => Array.from(track.children).filter(el => el.nodeType === 1);

  const pageCount = () => Math.max(1, Math.ceil(cards().length / perView()));

  const renderDots = () => {
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < pageCount(); i++) {
      const dot = document.createElement('span');
      dot.className = 'testimonial-slider-dot' + (i === index ? ' active' : '');
      dots.appendChild(dot);
    }
  };

  const update = () => {
    const items = cards();
    if (!items.length) return;

    const pages = pageCount();
    if (index > pages - 1) index = pages - 1;
    if (index < 0) index = 0;

    const pv = perView();
    const gap = pv === 1 ? 0 : 24;
    const first = items[0];
    const step = first.getBoundingClientRect().width + gap;
    track.style.transform = `translateX(${-(index * pv * step)}px)`;

    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index >= pages - 1;
    renderDots();
  };

  prev?.addEventListener('click', () => {
    if (index > 0) {
      index--;
      update();
    }
  });

  next?.addEventListener('click', () => {
    if (index < pageCount() - 1) {
      index++;
      update();
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      index = 0;
      update();
    }, 120);
  });

  // Reviews are loaded dynamically, so refresh when cards are inserted/changed.
  const observer = new MutationObserver(() => {
    index = 0;
    requestAnimationFrame(update);
  });
  observer.observe(track, { childList:true });

  requestAnimationFrame(update);
})();
