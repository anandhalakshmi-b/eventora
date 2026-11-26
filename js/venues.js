/* Eventora – Venues & Vendors (in-page category filtering, category-specific details & MongoDB dynamic vendors) */
(function () {
  const EVENTS = ['Wedding', 'Engagement', 'Birthday', 'College & Graduation', 'Corporate & Team', 'Baby Shower', 'Housewarming', 'Anniversary', 'Naming Ceremony', 'Festival'];
  const CITIES = ['Coimbatore', 'Chennai', 'Bengaluru', 'Madurai', 'Pondicherry', 'Kochi'];
  const VTYPES = ['Banquet hall', 'Outdoor lawn', 'Rooftop', 'Resort', 'Conference centre'];

  const VENUES = [];

  const CATS = [
    { k: 'catering', n: 'Catering', c: 'orange', e: '', image: 'images/catering/1.jpg', about: 'Menus and service teams to make your celebration delicious.' },
    { k: 'decor', n: 'Decor', c: 'purple', e: '', image: 'images/decor/1.jpg', about: 'Bring your event theme to life with talented decorators.' },
    { k: 'makeup', n: 'Makeup & Styling', c: 'pink', e: '', image: 'images/makeup/1.jpg', about: 'Find artists for bridal looks, hair styling and special occasions.' },
    { k: 'photo', n: 'Photography & Video', c: 'cyan', e: '', image: 'images/photo/1.jpg', about: 'Capture every candid, ceremony and celebration worth remembering.' },
    { k: 'host', n: 'Host & Anchor', c: 'yellow', e: '', image: 'images/emcee/1.JPG', about: 'Hosts and anchors to keep your guests engaged all event long.' },
    { k: 'dj', n: 'DJ & Music', c: 'red', e: '', image: 'images/dj/1.jpg', about: 'Set the mood with DJs, live bands and professional sound.' },
    { k: 'florist', n: 'Florist', c: 'green', e: '', image: 'images/decor/5.jpg', about: 'Fresh flowers, bouquets and beautiful ceremony arrangements.' }
  ];

  // Category-specific UI, filter, detail, and booking schemas so only relevant details are shown
  const CATEGORY_CONFIG = {
    catering: {
      unit: 'per plate', min: 150, max: 2500, step: 50,
      heroKicker: 'CATERING & FEAST SPECIALISTS',
      heroDesc: 'Explore traditional feast teams, regional spreads, live food counters, and custom dessert & cake tables.',
      filterLabel: 'Cuisine & Menu Specialty',
      detailsLabel: 'Menu & Catering Offerings',
      bookingPlaceholder: 'Preferred dishes, vegetarian/allergen requirements, or tasting request',
      bookingFields: [
        { name: 'plateCount', label: 'Estimated plates / guests', type: 'number', placeholder: 'e.g. 250', required: true },
        { name: 'menuType', label: 'Menu preference', type: 'select', options: ['Pure Vegetarian Feast', 'Veg & Non-Veg Spread', 'Allergen-Friendly Menu', 'Snacks & Desserts'], required: true },
        { name: 'serviceStyle', label: 'Service style', type: 'select', options: ['Traditional Leaf Service', 'Buffet & Live Counters', 'Plated / Cocktail Snacks'], required: true }
      ]
    },
    decor: {
      unit: 'per event', min: 5000, max: 150000, step: 2500,
      heroKicker: 'EVENT DECOR & STAGE STUDIOS',
      heroDesc: 'Browse floral stage designers, pastel reception stylists, and vibrant balloon & theme decorators.',
      filterLabel: 'Decor Style & Setup',
      detailsLabel: 'Decor & Styling Offerings',
      bookingPlaceholder: 'Colour palette, floral theme, or venue stage dimensions',
      bookingFields: [
        { name: 'setupArea', label: 'Primary setup area', type: 'select', options: ['Ceremony & Main Stage', 'Balloon & Theme Backdrop', 'Entrance, Lighting & Tables', 'Full Venue Decor'], required: true },
        { name: 'themePalette', label: 'Theme / colour palette', type: 'text', placeholder: 'e.g. Marigold & Silk, Pastel Peach', required: true }
      ]
    },
    makeup: {
      unit: 'per person', min: 1500, max: 40000, step: 500,
      heroKicker: 'MAKEUP & STYLING ARTISTS',
      heroDesc: 'Verified bridal makeup artists, party stylists, hair stylists, and draping specialists for every occasion.',
      filterLabel: 'Makeup & Styling Service',
      detailsLabel: 'Makeup & Hair Services',
      bookingPlaceholder: 'Outfit colours, preferred look (dewy/matte/traditional), or getting-ready location',
      bookingFields: [
        { name: 'makeupLook', label: 'Makeup look / package', type: 'select', options: ['Bridal HD / Airbrush Makeup', 'Engagement / Reception Glam', 'Party & Occasion Makeup', 'Hair Styling & Draping'], required: true },
        { name: 'peopleCount', label: 'Number of people', type: 'number', placeholder: 'e.g. 1', required: true },
        { name: 'trialSession', label: 'Trial session needed?', type: 'select', options: ['Yes, schedule a trial', 'No trial needed'], required: true }
      ]
    },
    photo: {
      unit: 'per event', min: 5000, max: 150000, step: 2500,
      heroKicker: 'PHOTOGRAPHY & CINEMATIC VIDEO',
      heroDesc: 'Candid storytellers, drone cinematographers, pre-event filmmakers, and instant photo booth teams.',
      filterLabel: 'Coverage & Deliverables',
      detailsLabel: 'Photo & Video Deliverables',
      bookingPlaceholder: 'Key moments to capture, drone permissions, or album requirements',
      bookingFields: [
        { name: 'coveragePackage', label: 'Coverage package', type: 'select', options: ['Candid Photography Only', 'Candid + Traditional Photo & Video', 'Cinematic Film + Drone Coverage', 'Party Reels & Photo Booth'], required: true },
        { name: 'duration', label: 'Coverage duration', type: 'select', options: ['Half Day (4 hrs)', 'Full Day (8-10 hrs)', 'Multi-Day Celebration'], required: true }
      ]
    },
    host: {
      unit: 'per event', min: 5000, max: 60000, step: 1000,
      heroKicker: 'EVENT HOSTS, EMCEES & ANCHORS',
      heroDesc: 'Bilingual and multilingual hosts to run music nights, corporate galas, birthday games, and stage shows.',
      filterLabel: 'Language & Hosting Style',
      detailsLabel: 'Languages & Program Formats',
      bookingPlaceholder: 'Audience profile, preferred games, or stage run-of-show notes',
      bookingFields: [
        { name: 'languages', label: 'Preferred language(s)', type: 'text', placeholder: 'e.g. English & Tamil', required: true },
        { name: 'hostFormat', label: 'Program format', type: 'select', options: ['Wedding & Music Night Hosting', 'Birthday & Interactive Games', 'Corporate Summit & Awards', 'Cultural / Community Stage'], required: true }
      ]
    },
    dj: {
      unit: 'per event', min: 5000, max: 100000, step: 2500,
      heroKicker: 'DJS, LIVE BANDS & SOUND PRODUCTION',
      heroDesc: 'Club-grade DJ consoles, live fusion bands, traditional instrumental troupes, and concert stage lighting.',
      filterLabel: 'Music & Entertainment Type',
      detailsLabel: 'Music, Sound & Band Setup',
      bookingPlaceholder: 'Favourite genres, song requests, or venue sound curfew timings',
      bookingFields: [
        { name: 'musicFormat', label: 'Entertainment format', type: 'select', options: ['DJ with Sound & Lights', 'Live Band & Singers', 'Traditional Live Ensemble', 'Dance & Percussion Setup'], required: true },
        { name: 'venueSetting', label: 'Venue setting', type: 'select', options: ['Indoor Banquet Hall', 'Outdoor Lawn / Rooftop'], required: true }
      ]
    },
    florist: {
      unit: 'per event', min: 2000, max: 80000, step: 1000,
      heroKicker: 'FRESH FLORISTS & GARLAND ARTISANS',
      heroDesc: 'Daily-sourced jasmine garlands, ceremonial flower wreaths, stage floral drapes, bouquets, and bridal hair flowers.',
      filterLabel: 'Floral Arrangement Type',
      detailsLabel: 'Fresh Flowers & Garlands',
      bookingPlaceholder: 'Preferred blooms (jasmine, roses, lotus), quantities, or early morning delivery time',
      bookingFields: [
        { name: 'floralType', label: 'Floral requirement', type: 'select', options: ['Wedding Garlands & Wreaths', 'Stage & Floral Arch', 'Bouquets & Table Centerpieces', 'Fresh Hair Flowers'], required: true },
        { name: 'preferredBlooms', label: 'Preferred flowers & colours', type: 'text', placeholder: 'e.g. Jasmine, Marigold, Pastel Roses', required: true }
      ]
    }
  };

  const VENDORS = [];

  /* ---------- helpers ---------- */
  const el = id => document.getElementById(id);
  const escHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rupee = n => '₹' + Number(n || 0).toLocaleString('en-IN');

  let tab = 'venues';
  let cat = 'all'; // 'all' (categories view), 'all-list' (all vendors list), or a category key ('makeup', 'catering', ...)
  let fav = new Set();
  try { fav = new Set(JSON.parse(localStorage.getItem('eventora-fav') || '[]')); } catch (e) {}
  const saveFav = () => { try { localStorage.setItem('eventora-fav', JSON.stringify([...fav])); } catch (e) {} };
  const opts = (arr, first) => `<option value="">${escHtml(first)}</option>` + arr.map(x => `<option value="${escHtml(x)}">${escHtml(x)}</option>`).join('');

  function getUniqueServices(categoryKey) {
    const set = new Set();
    VENDORS.forEach(d => {
      if (!categoryKey || categoryKey === 'all' || categoryKey === 'all-list' || d.cat === categoryKey) {
        (d.sv || []).forEach(s => set.add(s));
      }
    });
    return [...set];
  }

  function getUniqueCities() {
    const set = new Set(CITIES);
    VENDORS.forEach(d => { if (d.city) set.add(d.city); });
    VENUES.forEach(v => { if (v.city) set.add(v.city); });
    return [...set];
  }

  function populateServiceFilter(selectEl, categoryKey, labelEl) {
    if (!selectEl) return;
    const cfg = CATEGORY_CONFIG[categoryKey];
    const wrap = el('vspec-wrap');
    if (cfg) {
      const services = getUniqueServices(categoryKey);
      const prev = selectEl.value;
      selectEl.innerHTML = opts(services, 'All ' + CATS.find(c => c.k === categoryKey).n.toLowerCase() + ' services');
      if (services.includes(prev)) selectEl.value = prev;
      if (labelEl) labelEl.textContent = cfg.filterLabel;
      selectEl.hidden = false;
      if (wrap) wrap.hidden = false;
    } else {
      selectEl.value = '';
      selectEl.hidden = true;
      if (wrap) wrap.hidden = true;
    }
  }

  function setPriceRange() {
    const p = el('price');
    if (!p) return;
    if (tab === 'venues') {
      const maxVenuePrice = VENUES.reduce((m, d) => Math.max(m, d.price || 0), 150000);
      p.min = 5000; p.max = maxVenuePrice; p.step = 5000;
    } else if (CATEGORY_CONFIG[cat]) {
      const cfg = CATEGORY_CONFIG[cat];
      const maxVendorPrice = VENDORS.filter(d => d.cat === cat).reduce((m, d) => Math.max(m, d.from), cfg.max);
      p.min = cfg.min;
      p.max = Math.max(cfg.max, maxVendorPrice);
      p.step = cfg.step;
    } else {
      p.min = 200; p.max = 60000; p.step = 500;
    }
    p.value = p.max;
    updatePriceLabel();
  }

  function updatePriceLabel() {
    const pout = el('pout');
    const p = el('price');
    if (!pout || !p) return;
    let suffix = '';
    if (tab === 'venues') suffix = ' per day';
    else if (CATEGORY_CONFIG[cat]) suffix = ' ' + CATEGORY_CONFIG[cat].unit;
    pout.textContent = 'up to ' + rupee(+p.value) + suffix;
  }

  function getF() {
    return {
      q: el('q') ? el('q').value.trim().toLowerCase() : '',
      ev: el('ev') ? el('ev').value : '',
      city: el('city') ? el('city').value : '',
      date: el('date') ? el('date').value : '',
      guests: el('guests') ? +el('guests').value : 0,
      vtype: el('vtype') ? el('vtype').value : '',
      vspec: el('vspec') ? el('vspec').value : '',
      price: el('price') ? +el('price').value : 9999999,
      saved: el('saved') ? el('saved').checked : false,
      sort: el('sort') ? el('sort').value : 'rating'
    };
  }

  const sorter = (s, key) => (a, b) => s === 'low' ? a[key] - b[key] : s === 'high' ? b[key] - a[key] : b.rating - a.rating;

  /* ---------- auth check for bookings ---------- */
  function checkAuthForBooking(itemTitle) {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('eventora_user')); } catch (e) {}
    if (!user) {
      try { sessionStorage.setItem('eventora_redirect', window.location.pathname + window.location.search); } catch (e) {}
      return {
        allowed: false,
        reason: 'login_required',
        message: `Please sign in or create a customer account to book ${itemTitle || 'this service'}.`
      };
    }
    if (user.role === 'vendor') {
      return {
        allowed: false,
        reason: 'vendor_role',
        message: 'You are signed in as a Vendor Partner. Venue and vendor booking is available for customer accounts.'
      };
    }
    return { allowed: true, user };
  }

  /* ---------- venues ---------- */
  function venueCard(v, f) {
    const on = fav.has(v.id);
    return `<article class="card c-${v.tone}">
      <div class="banner"><img class="venue-image" src="${escHtml(v.image)}" alt="${escHtml(v.name)}" style="object-position:${v.imagePosition || 'center'}" loading="lazy" onerror="this.src='images/venues/1.jpg'">
        <button class="heart" data-act="fav" data-id="${v.id}" aria-pressed="${on}" aria-label="Save ${escHtml(v.name)}">${on ? 'Saved' : 'Save'}</button></div>
      <div class="body">
        <h3>${escHtml(v.name)}</h3>
        <p class="meta">${escHtml(v.city)} · ${escHtml(v.type)}</p>
        <p class="meta">Rating ${v.rating.toFixed(1)} · up to ${v.cap} guests</p>
        <p class="price">${rupee(v.price)} <small style="display:inline">per day</small></p>
        <div class="tags">${v.ev.slice(0, 3).map(e => `<span class="tag">${escHtml(e)}</span>`).join('')}</div>
        ${f.date ? '<p class="avail">Available on your date</p>' : ''}
        <div class="acts"><button class="btn alt" data-act="view" data-id="${v.id}">View details</button>
          <button class="btn" data-act="contact" data-id="${v.id}">Contact</button></div>
      </div></article>`;
  }

  function renderVenues() {
    const f = getF();
    let hidden = 0;
    const list = VENUES.filter(v => {
      if (f.q && !(v.name + ' ' + v.city + ' ' + v.type).toLowerCase().includes(f.q)) return false;
      if (f.ev && !v.ev.includes(f.ev)) return false;
      if (f.city && v.city !== f.city) return false;
      if (f.vtype && v.type !== f.vtype) return false;
      if (f.guests && v.cap < f.guests) return false;
      if (v.price > f.price) return false;
      if (f.saved && !fav.has(v.id)) return false;
      if (f.date && v.booked.includes(f.date)) { hidden++; return false; }
      return true;
    }).sort(sorter(f.sort, 'price'));

    el('count').textContent = list.length + ' venue' + (list.length === 1 ? '' : 's') + ' found' +
      (hidden ? ` · ${hidden} hidden because they are booked on ${f.date}` : '');
    el('list').innerHTML = list.length ? `<div class="grid">${list.map(v => venueCard(v, f)).join('')}</div>` : emptyBox('venues');
  }

  /* ---------- vendor category chips & in-page vendors list ---------- */
  function renderVendorChips(container, activeCat) {
    if (!container) return;
    const allCategoriesBtn = `<button type="button" class="chip" data-pick-cat="all" aria-pressed="${activeCat === 'all'}">All Categories</button>`;
    const allVendorsBtn = `<button type="button" class="chip" data-pick-cat="all-list" aria-pressed="${activeCat === 'all-list'}">All Vendors</button>`;
    const catBtns = CATS.map(c =>
      `<button type="button" class="chip c-${c.c}" data-pick-cat="${c.k}" aria-pressed="${activeCat === c.k}">${c.e} ${escHtml(c.n)}</button>`
    ).join('');
    container.innerHTML = allCategoriesBtn + allVendorsBtn + catBtns;
    container.hidden = false;
  }

  function renderCategoryBanner(categoryObj) {
    const banner = el('vbanner');
    if (!banner) return;
    if (!categoryObj) {
      banner.hidden = true;
      banner.innerHTML = '';
      banner.className = 'cat-banner';
      return;
    }
    const cfg = CATEGORY_CONFIG[categoryObj.k] || {};
    banner.className = `cat-banner c-${categoryObj.c}`;
    banner.innerHTML = `
      <div>
        <h2>${categoryObj.e} ${escHtml(categoryObj.n)}</h2>
        <p>${escHtml(categoryObj.about)}</p>
      </div>
      <div class="cat-meta">
        <span class="cat-badge">Pricing: ${escHtml(cfg.unit || 'per event')}</span>
        <button type="button" class="btn alt sm" data-pick-cat="all">← All categories</button>
      </div>
    `;
    banner.hidden = false;
  }

  function filterVendorItems(categoryKey, f) {
    return VENDORS.filter(d => {
      if (categoryKey && categoryKey !== 'all' && categoryKey !== 'all-list' && d.cat !== categoryKey) return false;
      if (f.q && !(d.name + ' ' + d.city + ' ' + (d.sv || []).join(' ') + ' ' + (d.desc || '')).toLowerCase().includes(f.q)) return false;
      if (f.ev && !(d.ev || []).includes(f.ev)) return false;
      if (f.city && d.city !== f.city) return false;
      if (f.vspec && !(d.sv || []).some(s => s.toLowerCase() === f.vspec.toLowerCase())) return false;
      if (d.from > f.price) return false;
      if (f.saved && !fav.has(d.id)) return false;
      return true;
    }).sort(sorter(f.sort, 'from'));
  }

  function renderVendors() {
    renderVendorChips(el('vchips'), cat);
    const f = getF();
    const selectedCat = CATS.find(c => c.k === cat);
    renderCategoryBanner(selectedCat || null);

    const hasActiveFilter = !!(f.q || f.ev || f.city || f.saved || f.vspec || f.price < +el('price').max);

    if (cat === 'all' && !hasActiveFilter) {
      el('count').textContent = 'Select a vendor category to view its tailored vendors and details';
      el('list').innerHTML = `<div class="grid">${CATS.map(c => `<button type="button" class="card category-card c-${c.c}" data-pick-cat="${c.k}">
        <img class="category-image" src="${escHtml(c.image)}" alt="${escHtml(c.n)} for events" loading="lazy">
        <div class="category-copy"><h2>${c.e} ${escHtml(c.n)}</h2><p>${escHtml(c.about)}</p>
          <span class="category-link">View ${escHtml(c.n)} <span aria-hidden="true">→</span></span></div>
      </button>`).join('')}</div>`;
      return;
    }

    const items = filterVendorItems(cat, f);
    const label = selectedCat ? selectedCat.n.toLowerCase() + ' vendor' : 'vendor';
    el('count').textContent = `${items.length} ${label}${items.length === 1 ? '' : 's'} found`;
    el('list').innerHTML = items.length ? `<div class="grid">${items.map(vendorDirectoryCard).join('')}</div>` : emptyBox('vendors');
  }

  function selectVendorCategory(nextCat, updateUrl = true) {
    cat = nextCat || 'all';
    populateServiceFilter(el('vspec'), cat, el('vspec-label'));
    setPriceRange();
    render();
    if (updateUrl && history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'vendors');
      if (cat && cat !== 'all' && cat !== 'all-list') url.searchParams.set('category', cat);
      else url.searchParams.delete('category');
      history.replaceState(null, '', url.pathname + url.search);
    }
  }

  const emptyBox = w => `<div class="empty"><h3>No ${w} match these filters</h3><p>Try another location, specialty or price, or clear the filters.</p></div>`;

  /* ---------- venue pop-ups ---------- */
  function find(id) { return VENUES.find(x => x.id === id) || VENDORS.find(x => x.id === id); }
  function colourOf(x) {
    if (x.tone) return 'c-' + x.tone;
    const c = CATS.find(c => c.k === x.cat);
    return 'c-' + (c ? c.c : 'blue');
  }

  function openView(id) {
    const x = find(id);
    if (!x) return;
    if (!x.cap) {
      openVendorDetails(id);
      return;
    }
    const pics = Array.isArray(x.pictures) ? x.pictures.filter(Boolean) : [];
    const gallery = pics.length > 1
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-top:12px;">${pics.map(src => `<img src="${escHtml(src)}" alt="${escHtml(x.name)}" style="width:100%;height:74px;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">`).join('')}</div>`
      : '';
    el('dbody').innerHTML = `<div class="dtop ${colourOf(x)}"><h2>${escHtml(x.name)}</h2><p>${escHtml(x.city)} · Rating ${x.rating.toFixed(1)}</p></div>
     <div class="dmain"><img class="vendor-detail-image" src="${escHtml(x.image || 'images/venues/1.jpg')}" alt="${escHtml(x.name)}" onerror="this.src='images/venues/1.jpg'"><p>${escHtml(x.desc)}</p>
     <p><b>${rupee(x.price)}</b> per day · up to <b>${x.cap}</b> guests · ${escHtml(x.type)}</p><b>Facilities</b><ul>${x.am.map(a => `<li>${escHtml(a)}</li>`).join('')}</ul>
     <p><b>Good for:</b> ${x.ev.map(escHtml).join(', ')}</p>${gallery}
     <div class="acts"><button class="btn" data-act="contact" data-id="${x.id}">Contact</button><button class="btn alt" data-act="close">Close</button></div></div>`;
    el('dlg').showModal();
  }

  function openContact(id) {
    const x = find(id);
    if (!x) return;
    const auth = checkAuthForBooking(x.name);
    if (!auth.allowed) {
      el('dbody').innerHTML = `<div class="dtop c-orange"><h2>Sign In Required</h2><p>Account verification needed to book or contact venues</p></div>
        <div class="dmain" style="padding:28px 20px; text-align:center;">
          <p style="font-size:1.05rem; color:#334155; margin-bottom:24px;">${escHtml(auth.message)}</p>
          <div class="acts" style="justify-content:center;">
            ${auth.reason === 'login_required' ? `
              <a class="btn" href="register.html?mode=login">Sign In (Login)</a>
              <a class="btn alt" href="register.html?mode=register">Create Account</a>
            ` : `
              <a class="btn" href="vendor-dashboard.html">Go to Vendor Dashboard</a>
            `}
            <button type="button" class="btn alt" data-act="close">Cancel</button>
          </div>
        </div>`;
      if (!el('dlg').open) el('dlg').showModal();
      return;
    }

    const u = auth.user;
    el('dbody').innerHTML = `<div class="dtop ${colourOf(x)}"><h2>Contact &amp; Book ${escHtml(x.name)}</h2></div>
     <form class="dmain" id="cform">
      <label for="cn">Your name</label><input id="cn" value="${escHtml(u.name || '')}" required>
      <label for="cp">Phone</label><input id="cp" type="tel" value="${escHtml(u.phone || '')}" required>
      <label for="cm">Event Details &amp; Date</label><textarea id="cm" rows="3" placeholder="Event type, date and guest headcount" required></textarea>
      <div class="acts"><button class="btn">Send booking request</button><button type="button" class="btn alt" data-act="close">Cancel</button></div></form>`;
    if (!el('dlg').open) el('dlg').showModal();
    el('cform').onsubmit = e => {
      e.preventDefault();
      const name = el('cn').value.trim();
      const phone = el('cp').value.trim();
      const details = el('cm').value.trim();
      const bookings = JSON.parse(localStorage.getItem('eventora-booking-requests') || '[]');
      bookings.push({ name, phone, details, vendorId: x.id, vendorName: x.name, requestedAt: new Date().toISOString() });
      localStorage.setItem('eventora-booking-requests', JSON.stringify(bookings));

      try {
        fetch('/api/vendor/queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: x.id,
            vendorEmail: x.email || '',
            userName: name,
            userPhone: phone,
            userEmail: u.email || 'customer@eventora.com',
            message: `Booking inquiry for venue ${x.name}: ${details}`
          })
        });
      } catch (err) {}

      el('dbody').innerHTML = `<div class="dmain"><div class="message-note" style="background:#DCFCE7; color:#166534; border:1px solid #BBF7D0;">Booking inquiry for ${escHtml(x.name)} sent successfully.</div><div class="acts"><button type="button" class="btn alt" data-act="close">Close</button></div></div>`;
    };
  }

  /* ---------- venues page ---------- */
  function render() {
    if (!el('list')) return;
    tab === 'venues' ? renderVenues() : renderVendors();
  }

  function switchTab(t) {
    tab = t;
    if (t === 'venues') cat = 'all';
    el('tab-venues').classList.toggle('on', t === 'venues');
    el('tab-venues').setAttribute('aria-selected', String(t === 'venues'));
    el('tab-vendors').classList.toggle('on', t === 'vendors');
    el('tab-vendors').setAttribute('aria-selected', String(t === 'vendors'));
    document.body.classList.toggle('vendors-mode', t === 'vendors');
    document.querySelectorAll('.v-only').forEach(node => { node.style.display = t === 'venues' ? '' : 'none'; });

    if (t === 'venues') {
      if (el('vchips')) el('vchips').hidden = true;
      if (el('vbanner')) el('vbanner').hidden = true;
      if (el('vspec-wrap')) el('vspec-wrap').hidden = true;
    } else {
      populateServiceFilter(el('vspec'), cat, el('vspec-label'));
    }

    setPriceRange();
    render();
  }

  function initVenuesPage() {
    el('burger').onclick = () => { const o = el('links').classList.toggle('open'); el('burger').setAttribute('aria-expanded', String(o)); };
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) heroVideo.pause();

    el('ev').innerHTML = opts(EVENTS, 'All events');
    el('city').innerHTML = opts(getUniqueCities(), 'All locations');
    el('vtype').innerHTML = opts(VTYPES, 'All venue types');
    el('date').min = new Date().toISOString().slice(0, 10);

    el('tab-venues').onclick = () => switchTab('venues');
    el('tab-vendors').onclick = () => { cat = 'all'; switchTab('vendors'); };

    ['q', 'ev', 'city', 'date', 'guests', 'vtype', 'vspec', 'saved', 'sort'].forEach(id => {
      const node = el(id);
      if (node) node.addEventListener('input', render);
      if (node && node.tagName === 'SELECT') node.addEventListener('change', render);
    });
    el('price').addEventListener('input', () => { updatePriceLabel(); render(); });

    el('clear').onclick = () => {
      ['q', 'ev', 'city', 'date', 'guests', 'vtype', 'vspec'].forEach(id => { if (el(id)) el(id).value = ''; });
      el('saved').checked = false;
      el('sort').value = 'rating';
      if (tab === 'vendors') cat = 'all';
      populateServiceFilter(el('vspec'), cat, el('vspec-label'));
      setPriceRange();
      render();
    };

    document.addEventListener('click', e => {
      const pickBtn = e.target.closest('[data-pick-cat]');
      if (pickBtn) {
        selectVendorCategory(pickBtn.dataset.pickCat);
        return;
      }

      const b = e.target.closest('[data-act]');
      if (b) {
        const id = b.dataset.id;
        if (b.dataset.act === 'fav') { fav.has(id) ? fav.delete(id) : fav.add(id); saveFav(); render(); }
        if (b.dataset.act === 'view') openView(id);
        if (b.dataset.act === 'contact') openContact(id);
        if (b.dataset.act === 'close') el('dlg').close();
        return;
      }

      const vb = e.target.closest('[data-vendor-act]');
      if (vb) {
        const id = vb.dataset.id;
        if (vb.dataset.vendorAct === 'favorite') {
          fav.has(id) ? fav.delete(id) : fav.add(id);
          saveFav();
          render();
          if (el('vendor-dialog') && el('vendor-dialog').open && el('vendor-dialog-body').querySelector('[data-vendor-act="favorite"]')) {
            openVendorDetails(id);
          }
        }
        if (vb.dataset.vendorAct === 'details') openVendorDetails(id);
        if (vb.dataset.vendorAct === 'book') openBookingForm(id);
        if (vb.dataset.vendorAct === 'close' && el('vendor-dialog')) el('vendor-dialog').close();
      }
    });

    el('dlg').addEventListener('click', e => { if (e.target === el('dlg')) el('dlg').close(); });
    if (el('vendor-dialog')) {
      el('vendor-dialog').addEventListener('click', e => { if (e.target === el('vendor-dialog')) el('vendor-dialog').close(); });
    }
    el('ftoggle').onclick = () => { const o = el('filters').classList.toggle('open'); el('ftoggle').textContent = o ? 'Hide filters' : 'Show filters'; };

    const params = new URLSearchParams(location.search);
    const evParam = params.get('event');
    if (evParam) {
      const matched = EVENTS.find(e => e.toLowerCase() === evParam.toLowerCase());
      if (matched) el('ev').value = matched;
    }
    const cityParam = params.get('city');
    if (cityParam) {
      const matchedCity = getUniqueCities().find(c => c.toLowerCase() === cityParam.toLowerCase());
      if (matchedCity) el('city').value = matchedCity;
    }
    const catParam = params.get('category');
    if (catParam && CATS.some(c => c.k === catParam)) {
      cat = catParam;
      switchTab('vendors');
    } else if (params.get('tab') === 'vendors') {
      switchTab('vendors');
    } else {
      switchTab('venues');
    }

    loadDynamicVendors();
  }

  /* ---------- vendor directory cards & category-specific dialogs ---------- */
  function vendorDirectoryCard(d) {
    const on = fav.has(d.id);
    const catObj = CATS.find(c => c.k === d.cat);
    const cfg = CATEGORY_CONFIG[d.cat] || {};
    const bookedDates = d.booked || [];
    const f = el('date') ? getF() : null;

    let availText = '<p class="avail" style="color:#16A34A; font-size:12px; font-weight:700; margin:4px 0;">Available for bookings</p>';
    if (f && f.date) {
      availText = bookedDates.includes(f.date)
        ? `<p class="avail" style="color:#DC2626; font-size:12px; font-weight:700; margin:4px 0;">Booked on ${escHtml(f.date)}</p>`
        : `<p class="avail" style="color:#16A34A; font-size:12px; font-weight:700; margin:4px 0;">Available on ${escHtml(f.date)}</p>`;
    } else if (bookedDates.length > 0) {
      availText = `<p class="avail" style="color:#B45309; font-size:12px; font-weight:600; margin:4px 0;">Booked on ${bookedDates.length} date(s)</p>`;
    }

    const catTag = (!catObj || (cat && cat !== 'all' && cat !== 'all-list'))
      ? ''
      : `<span class="tag" style="margin-bottom:4px;">${escHtml(catObj.n)}</span>`;

    return `<article class="card ${catObj ? 'c-' + catObj.c : ''}">
      <img class="vendor-image" src="${escHtml(d.image)}" alt="${escHtml(d.name)}" loading="lazy" onerror="this.src='images/venues/1.jpg'">
      <button class="heart" data-vendor-act="favorite" data-id="${d.id}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Add'} ${escHtml(d.name)} ${on ? 'from' : 'to'} favourites">${on ? 'Saved' : 'Save'}</button>
      <div class="body">
        ${catTag}
        <button class="profile-link" data-vendor-act="details" data-id="${d.id}"><h3>${escHtml(d.name)}</h3></button>
        <p class="meta">${escHtml(d.city)} · Rating ${Number(d.rating || 4.8).toFixed(1)}</p>
        <p class="price">From ${rupee(d.from)} <small style="display:inline">${escHtml(d.unit || cfg.unit || 'per event')}</small></p>
        ${availText}
        <div class="tags">${(d.sv || []).slice(0, 3).map(s => `<span class="tag">${escHtml(s)}</span>`).join('')}</div>
        <div class="acts"><button class="btn alt" data-vendor-act="details" data-id="${d.id}">View details</button>
          <button class="btn" data-vendor-act="book" data-id="${d.id}">Book now</button></div>
      </div>
    </article>`;
  }

  function openVendorDetails(id) {
    const d = VENDORS.find(x => x.id === id);
    if (!d) return;
    const category = CATS.find(c => c.k === d.cat) || { e: '', n: d.categoryName || 'Vendor', c: 'blue' };
    const cfg = CATEGORY_CONFIG[d.cat] || { detailsLabel: 'Services & Inclusions', unit: 'per event' };
    const on = fav.has(d.id);

    let portfolioHtml = '';
    if (d.portfolio && d.portfolio.length > 0) {
      portfolioHtml = `
        <div style="margin-top:20px; border-top:1px solid #E2E8F0; padding-top:16px;">
          <b style="font-size:1rem; display:block; margin-bottom:10px;">Work Portfolio (${d.portfolio.length} Projects)</b>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:12px;">
            ${d.portfolio.map(p => `
              <div style="border:1px solid #E2E8F0; border-radius:12px; overflow:hidden; background:#F8FAFC;">
                <img src="${escHtml(p.image || p.imageUrl || d.image || 'images/venues/1.jpg')}" alt="${escHtml(p.title)}" style="width:100%; height:110px; object-fit:cover;" onerror="this.src='images/venues/1.jpg'">
                <div style="padding:10px;">
                  <strong style="font-size:0.9rem; display:block; color:#0F172A;">${escHtml(p.title)}</strong>
                  <p style="color:#64748B; font-size:0.8rem; margin:4px 0 0;">${escHtml(p.description || '')}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let galleryHtml = '';
    if (d.pictures && d.pictures.length > 0) {
      galleryHtml = `
        <div style="margin-top:18px;">
          <b style="font-size:1rem; display:block; margin-bottom:8px;">Showcase Pictures Gallery</b>
          <div style="display:flex; gap:10px; overflow-x:auto; padding:6px 0;">
            ${d.pictures.map(img => `
              <img src="${escHtml(img)}" alt="Showcase photo" style="width:100px; height:100px; object-fit:cover; border-radius:12px; border:1px solid #E2E8F0; flex-shrink:0;" onerror="this.src='images/venues/1.jpg'">
            `).join('')}
          </div>
        </div>
      `;
    }

    const bookedDates = d.booked || [];
    const availabilityHtml = bookedDates.length > 0
      ? `<div style="margin-top:16px; padding:12px 16px; background:#FEF3C7; border-radius:12px; border:1px solid #FDE68A; font-size:0.88rem; color:#92400E;">
          <strong>Date Availability:</strong> Booked on <b>${bookedDates.map(escHtml).join(', ')}</b>.<br>
          <span style="color:#78350F;">${escHtml(d.availability?.note || 'Available for inquiries on other dates.')}</span>
        </div>`
      : `<div style="margin-top:16px; padding:10px 14px; background:#DCFCE7; border-radius:12px; border:1px solid #BBF7D0; font-size:0.85rem; color:#166534;">
          <strong>Full Availability:</strong> Currently accepting bookings across all dates.
        </div>`;

    el('vendor-dialog-body').innerHTML = `<img class="vendor-detail-image" src="${escHtml(d.image)}" alt="${escHtml(d.name)}" onerror="this.src='images/venues/1.jpg'">
      <div class="dmain"><h2>${escHtml(d.name)}</h2><p class="meta">${escHtml(category.n)} · ${escHtml(d.city)} · Rating ${Number(d.rating || 4.8).toFixed(1)}</p>
      <p>${escHtml(d.desc)}</p><p class="price">From ${rupee(d.from)} <small style="display:inline">${escHtml(d.unit || cfg.unit)}</small></p>
      <b>${escHtml(cfg.detailsLabel)}</b><ul>${(d.sv || []).map(s => `<li>${escHtml(s)}</li>`).join('')}</ul>
      <p><b>Ideal occasions:</b> ${(d.ev || []).map(escHtml).join(', ')}</p>
      ${availabilityHtml}
      ${portfolioHtml}
      ${galleryHtml}
      <div class="acts" style="margin-top:20px;"><button class="btn alt" data-vendor-act="favorite" data-id="${d.id}" aria-pressed="${on}">${on ? 'Added to favourites' : 'Add to favourites'}</button>
      <button class="btn" data-vendor-act="book" data-id="${d.id}">Book ${escHtml(category.n)}</button>
      <button class="btn alt" data-vendor-act="close">Close</button></div></div>`;
    el('vendor-dialog').showModal();
  }

  function renderBookingField(field) {
    if (field.type === 'select') {
      return `<label>${escHtml(field.label)}<select name="${escHtml(field.name)}" ${field.required ? 'required' : ''}><option value="">Select</option>${field.options.map(o => `<option value="${escHtml(o)}">${escHtml(o)}</option>`).join('')}</select></label>`;
    }
    return `<label>${escHtml(field.label)}<input name="${escHtml(field.name)}" type="${escHtml(field.type || 'text')}" placeholder="${escHtml(field.placeholder || '')}" ${field.type === 'number' ? 'min="1"' : ''} ${field.required ? 'required' : ''}></label>`;
  }

  function openBookingForm(id) {
    const d = VENDORS.find(x => x.id === id);
    if (!d) return;

    const auth = checkAuthForBooking(d.name);
    if (!auth.allowed) {
      el('vendor-dialog-body').innerHTML = `<div class="dtop c-orange"><h2>Sign In Required</h2><p>Account verification needed to book vendors</p></div>
        <div class="dmain" style="padding:28px 20px; text-align:center;">
          <p style="font-size:1.05rem; color:#334155; margin-bottom:24px;">${escHtml(auth.message)}</p>
          <div class="acts" style="justify-content:center;">
            ${auth.reason === 'login_required' ? `
              <a class="btn" href="register.html?mode=login">Sign In (Login)</a>
              <a class="btn alt" href="register.html?mode=register">Create Account</a>
            ` : `
              <a class="btn" href="vendor-dashboard.html">Go to Vendor Dashboard</a>
            `}
            <button type="button" class="btn alt" data-vendor-act="close">Cancel</button>
          </div>
        </div>`;
      if (!el('vendor-dialog').open) el('vendor-dialog').showModal();
      return;
    }

    const u = auth.user;
    const category = CATS.find(c => c.k === d.cat) || { e: '', n: 'Vendor' };
    const cfg = CATEGORY_CONFIG[d.cat] || { unit: 'per event', bookingFields: [], bookingPlaceholder: 'Any specific preferences or notes' };
    const extraFieldsHtml = (cfg.bookingFields || []).map(renderBookingField).join('');

    el('vendor-dialog-body').innerHTML = `<div class="dtop ${colourOf(d)}"><h2>Book ${escHtml(d.name)}</h2><p>${escHtml(category.n)} · From ${rupee(d.from)} ${escHtml(d.unit || cfg.unit)}</p></div>
      <form class="dmain booking-form" id="booking-form">
        <label>Your name<input name="name" value="${escHtml(u.name || '')}" autocomplete="name" required></label>
        <label>Phone number<input name="phone" type="tel" value="${escHtml(u.phone || '')}" autocomplete="tel" required></label>
        <label>Event date<input name="date" type="date" min="${new Date().toISOString().slice(0, 10)}" required></label>
        <label>Occasion<select name="event" required><option value="">Choose occasion</option>${EVENTS.map(e => `<option>${escHtml(e)}</option>`).join('')}</select></label>
        ${extraFieldsHtml}
        <label class="full">${escHtml(category.n)} notes<textarea name="details" rows="3" placeholder="${escHtml(cfg.bookingPlaceholder)}"></textarea></label>
        <div class="acts"><button class="btn">Send booking request</button><button class="btn alt" type="button" data-vendor-act="details" data-id="${id}">Back to profile</button><button class="btn alt" type="button" data-vendor-act="close">Cancel</button></div>
      </form>`;
    el('vendor-dialog').showModal();

    el('booking-form').onsubmit = e => {
      e.preventDefault();
      const bookings = JSON.parse(localStorage.getItem('eventora-booking-requests') || '[]');
      const booking = Object.fromEntries(new FormData(e.currentTarget).entries());
      bookings.push({ ...booking, vendorId: d.id, vendorName: d.name, category: d.cat, requestedAt: new Date().toISOString() });
      localStorage.setItem('eventora-booking-requests', JSON.stringify(bookings));

      const extraSummary = (cfg.bookingFields || [])
        .map(f => booking[f.name] ? `${f.label}: ${booking[f.name]}` : '')
        .filter(Boolean)
        .join(' | ');
      const fullMessage = [extraSummary, booking.details].filter(Boolean).join(' — ') || `Inquiry for ${d.name}`;

      try {
        fetch('/api/vendor/queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: d.id,
            vendorEmail: d.email || '',
            userName: booking.name,
            userPhone: booking.phone,
            userEmail: u.email || 'customer@eventora.com',
            eventType: booking.event || 'Celebration',
            eventDate: booking.date || '',
            guestCount: Number(booking.plateCount || booking.peopleCount) || 200,
            message: fullMessage
          })
        });
      } catch (err) {}

      el('vendor-dialog-body').innerHTML = `<div class="dmain"><div class="message-note" style="background:#DCFCE7; color:#166534; border:1px solid #BBF7D0;">Your ${escHtml(category.n.toLowerCase())} inquiry for ${escHtml(d.name)} was sent.</div>
        <div class="acts"><button class="btn alt" data-vendor-act="close">Close</button></div></div>`;
    };
  }

  /* ---------- dedicated vendors directory page (vendors.html) ---------- */
  let directoryRenderer = null;

  function initVendorDirectory() {
    el('burger').onclick = () => { const o = el('links').classList.toggle('open'); el('burger').setAttribute('aria-expanded', String(o)); };
    const params = new URLSearchParams(location.search);
    let activeCatKey = params.get('category') || 'all';
    if (activeCatKey !== 'all' && !CATS.some(c => c.k === activeCatKey)) activeCatKey = 'all';

    const search = el('vendor-search');
    const serviceSel = el('vendor-service');
    const city = el('vendor-city');
    const sortSel = el('vendor-sort');

    function applyDirectoryCategory(nextKey, updateUrl) {
      activeCatKey = nextKey || 'all';
      const selected = CATS.find(c => c.k === activeCatKey);
      const cfg = selected ? CATEGORY_CONFIG[selected.k] : null;

      if (el('vendors-hero-kicker')) {
        el('vendors-hero-kicker').textContent = cfg ? cfg.heroKicker : 'TRUSTED EVENT VENDORS & SPECIALISTS';
      }
      if (el('vendors-hero-title')) {
        el('vendors-hero-title').textContent = selected ? selected.n : 'Event Vendors & Specialists';
      }
      if (el('vendors-hero-desc')) {
        el('vendors-hero-desc').textContent = cfg ? cfg.heroDesc : 'Discover caterers, makeup and styling artists, decorators, DJs, hosts, florists, and photographers across India.';
      }

      el('directory-heading').textContent = selected ? selected.n : 'All Event Vendors';
      el('directory-intro').textContent = selected ? selected.about : 'Browse trusted professionals for your next celebration.';
      if (el('category-back')) el('category-back').hidden = !selected;

      if (el('vchips')) {
        const allBtn = `<button type="button" class="chip" data-dir-cat="all" aria-pressed="${!selected}">All Vendors</button>`;
        const btns = CATS.map(c => `<button type="button" class="chip c-${c.c}" data-dir-cat="${c.k}" aria-pressed="${activeCatKey === c.k}">${escHtml(c.n)}</button>`).join('');
        el('vchips').innerHTML = allBtn + btns;
      }

      if (serviceSel) {
        if (selected && cfg) {
          const services = getUniqueServices(selected.k);
          serviceSel.innerHTML = opts(services, cfg.filterLabel);
          serviceSel.hidden = false;
        } else {
          serviceSel.value = '';
          serviceSel.hidden = true;
        }
      }

      if (updateUrl && history.replaceState) {
        const url = new URL(window.location.href);
        if (selected) url.searchParams.set('category', selected.k);
        else url.searchParams.delete('category');
        history.replaceState(null, '', url.pathname + url.search);
      }
    }

    city.innerHTML = opts(getUniqueCities(), 'All locations');

    const renderDirectory = () => {
      const selected = CATS.find(c => c.k === activeCatKey);
      const q = search.value.trim().toLowerCase();
      const svFilter = serviceSel && !serviceSel.hidden ? serviceSel.value : '';
      const items = VENDORS.filter(d => (!selected || d.cat === selected.k) &&
        (!q || (d.name + ' ' + d.city + ' ' + (d.sv || []).join(' ') + ' ' + (d.desc || '')).toLowerCase().includes(q)) &&
        (!svFilter || (d.sv || []).some(s => s.toLowerCase() === svFilter.toLowerCase())) &&
        (!city.value || d.city === city.value)).sort(sorter(sortSel.value, 'from'));

      const label = selected ? selected.n.toLowerCase() + ' vendor' : 'vendor';
      el('directory-count').textContent = `${items.length} ${label}${items.length === 1 ? '' : 's'} found`;
      el('directory-list').innerHTML = items.length ? `<div class="grid">${items.map(vendorDirectoryCard).join('')}</div>` :
        '<div class="empty"><h3>No vendors found</h3><p>Try a different search, specialty or location.</p></div>';
    };

    directoryRenderer = () => {
      city.innerHTML = opts(getUniqueCities(), 'All locations');
      applyDirectoryCategory(activeCatKey, false);
      renderDirectory();
    };

    [search, city, sortSel, serviceSel].filter(Boolean).forEach(node => {
      node.addEventListener('input', renderDirectory);
      if (node.tagName === 'SELECT') node.addEventListener('change', renderDirectory);
    });

    document.addEventListener('click', e => {
      const catBtn = e.target.closest('[data-dir-cat]');
      if (catBtn) {
        applyDirectoryCategory(catBtn.dataset.dirCat, true);
        renderDirectory();
        return;
      }
      const button = e.target.closest('[data-vendor-act]');
      if (!button) return;
      const id = button.dataset.id;
      if (button.dataset.vendorAct === 'favorite') {
        fav.has(id) ? fav.delete(id) : fav.add(id);
        saveFav();
        renderDirectory();
        if (el('vendor-dialog').open && el('vendor-dialog-body').querySelector('[data-vendor-act="favorite"]')) openVendorDetails(id);
      }
      if (button.dataset.vendorAct === 'details') openVendorDetails(id);
      if (button.dataset.vendorAct === 'book') openBookingForm(id);
      if (button.dataset.vendorAct === 'close') el('vendor-dialog').close();
    });

    el('vendor-dialog').addEventListener('click', e => { if (e.target === el('vendor-dialog')) el('vendor-dialog').close(); });

    applyDirectoryCategory(activeCatKey, false);
    renderDirectory();
    loadDynamicVendors();
  }

  /* ---------- favorites page ---------- */
  function renderFavorites() {
    const venues = VENUES.filter(v => fav.has(v.id));
    const vendors = VENDORS.filter(v => fav.has(v.id));
    el('favorite-venue-count').textContent = `${venues.length} saved`;
    el('favorite-vendor-count').textContent = `${vendors.length} saved`;
    el('favorite-venues').innerHTML = venues.length
      ? `<div class="grid">${venues.map(v => venueCard(v, { date: '' })).join('')}</div>`
      : '<div class="empty"><h3>No saved venues yet</h3><p>Save venues you like and they’ll appear here.</p><a class="btn alt sm" href="venues.html">Explore venues</a></div>';
    el('favorite-vendors').innerHTML = vendors.length
      ? `<div class="grid">${vendors.map(vendorDirectoryCard).join('')}</div>`
      : '<div class="empty"><h3>No saved vendors yet</h3><p>Save vendors you like and they’ll appear here.</p><a class="btn alt sm" href="venues.html?tab=vendors">Explore vendors</a></div>';
  }

  function initFavoritesPage() {
    el('burger').onclick = () => { const o = el('links').classList.toggle('open'); el('burger').setAttribute('aria-expanded', String(o)); };
    document.addEventListener('click', e => {
      const venueButton = e.target.closest('[data-act]');
      if (venueButton) {
        const id = venueButton.dataset.id;
        if (venueButton.dataset.act === 'fav') { fav.has(id) ? fav.delete(id) : fav.add(id); saveFav(); renderFavorites(); }
        if (venueButton.dataset.act === 'view') openView(id);
        if (venueButton.dataset.act === 'contact') openContact(id);
        if (venueButton.dataset.act === 'close') el('dlg').close();
      }
      const vendorButton = e.target.closest('[data-vendor-act]');
      if (!vendorButton) return;
      const id = vendorButton.dataset.id;
      if (vendorButton.dataset.vendorAct === 'favorite') { fav.has(id) ? fav.delete(id) : fav.add(id); saveFav(); renderFavorites(); }
      if (vendorButton.dataset.vendorAct === 'details') openVendorDetails(id);
      if (vendorButton.dataset.vendorAct === 'book') openBookingForm(id);
      if (vendorButton.dataset.vendorAct === 'close') el('vendor-dialog').close();
    });
    el('dlg').addEventListener('click', e => { if (e.target === el('dlg')) el('dlg').close(); });
    el('vendor-dialog').addEventListener('click', e => { if (e.target === el('vendor-dialog')) el('vendor-dialog').close(); });
    renderFavorites();
    loadDynamicVendors();
  }

  /* ---------- load registered vendors & venues from backend ---------- */
  async function loadDynamicVendors() {
    try {
      const [vendorsRes, venuesRes] = await Promise.all([
        fetch('/api/vendors', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('/api/venues', { cache: 'no-store' }).then(r => r.json()).catch(() => null)
      ]);
      let changed = false;

      if (vendorsRes && vendorsRes.success && Array.isArray(vendorsRes.data) && vendorsRes.data.length > 0) {
        vendorsRes.data.forEach(v => {
          const idx = VENDORS.findIndex(x => x.id === v.id || (x.email && v.email && x.email === v.email));
          if (idx !== -1) VENDORS[idx] = { ...VENDORS[idx], ...v };
          else VENDORS.unshift(v);
        });
        changed = true;
      }

      if (venuesRes && venuesRes.success && Array.isArray(venuesRes.data) && venuesRes.data.length > 0) {
        venuesRes.data.forEach(v => {
          const idx = VENUES.findIndex(x => x.id === v.id || (x.email && v.email && x.email === v.email));
          if (idx !== -1) VENUES[idx] = { ...VENUES[idx], ...v };
          else VENUES.unshift(v);
        });
        changed = true;
      }

      if (changed) {
        if (el('city')) {
          const prevCity = el('city').value;
          el('city').innerHTML = opts(getUniqueCities(), 'All locations');
          el('city').value = prevCity;
        }
        setPriceRange();
        if (el('vspec') && tab === 'vendors') {
          populateServiceFilter(el('vspec'), cat, el('vspec-label'));
        }
        if (el('directory-list') && directoryRenderer) directoryRenderer();
        else if (el('list')) render();
        else if (el('favorite-venues')) renderFavorites();
      }
    } catch (e) {
      // Fallback to built-in lists silently
    }
  }

  if (el('favorite-venues')) initFavoritesPage();
  else if (el('directory-list')) initVendorDirectory();
  else if (el('list')) initVenuesPage();
})();
