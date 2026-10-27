/* Eventora – Venues & Vendors (front end only, sample data).
   Replace the VENUES and VENDORS arrays with your backend data later. */

const EVENTS = ['Wedding','Engagement','Birthday','Baby Shower','Anniversary','Graduation','Corporate','Party'];
const CITIES = ['Coimbatore','Chennai','Bengaluru','Madurai','Pondicherry','Kochi'];
const VTYPES = ['Banquet hall','Outdoor lawn','Rooftop','Resort','Conference centre'];

/* ---------- sample venues (booked = dates already taken) ---------- */
const VENUES = [
 {id:'v1',name:'Lotus Grand Banquet',city:'Coimbatore',type:'Banquet hall',cap:600,price:90000,rating:4.8,tone:'pink',e:'🏛️',image:'images/venues/1.jpg',
  ev:['Wedding','Engagement','Anniversary','Corporate'],booked:['2026-11-14','2026-11-15','2026-12-06'],
  desc:'Air-conditioned hall with a grand stage, in-house kitchen and a bridal suite.',am:['AC hall','Stage and lighting','Parking for 150 cars','Bridal suite']},
 {id:'v2',name:'Palm Garden Lawn',city:'Coimbatore',type:'Outdoor lawn',cap:400,price:65000,rating:4.6,tone:'green',e:'🌴',image:'images/venues/2.jpg',imagePosition:'center 84%',
  ev:['Wedding','Birthday','Party','Engagement'],booked:['2026-11-08','2026-12-12'],
  desc:'A green open lawn with fairy-light setup. Best for evening receptions and garden parties.',am:['Open lawn','Fairy lights','Generator backup','Outside catering allowed']},
 {id:'v3',name:'Skyline Terrace',city:'Chennai',type:'Rooftop',cap:150,price:45000,rating:4.5,tone:'purple',e:'🌆',image:'images/venues/3.jpg',
  ev:['Birthday','Anniversary','Party','Baby Shower'],booked:['2026-11-21','2026-11-22'],
  desc:'Rooftop venue with city views, a lounge corner and a DJ platform.',am:['City view','DJ platform','Lounge seating','Lift access']},
 {id:'v4',name:'Heritage Mahal',city:'Madurai',type:'Banquet hall',cap:800,price:120000,rating:4.7,tone:'orange',e:'🕌',image:'images/venues/4.jpg',
  ev:['Wedding','Engagement','Corporate'],booked:['2026-12-05','2026-12-06','2026-12-13'],
  desc:'Traditional pillared hall with a dining area for 500 and rooms for family.',am:['Dining for 500','Guest rooms','Mandap stage','Valet parking']},
 {id:'v5',name:'Bloom Conference Centre',city:'Bengaluru',type:'Conference centre',cap:250,price:70000,rating:4.4,tone:'cyan',e:'💼',image:'images/venues/5.jpg',imagePosition:'center 76%',
  ev:['Corporate','Graduation'],booked:['2026-11-10','2026-11-11'],
  desc:'Projector, sound system and break-out rooms for meets, launches and seminars.',am:['Projector and screen','Fast Wi-Fi','Break-out rooms','Tea and coffee area']},
 {id:'v6',name:'Seaside Resort Lawn',city:'Pondicherry',type:'Resort',cap:300,price:110000,rating:4.9,tone:'yellow',e:'🌊',image:'images/venues/6.jpg',
  ev:['Wedding','Anniversary','Party','Birthday'],booked:['2026-12-19','2026-12-20'],
  desc:'Beachfront lawn with rooms for guests and sunset ceremony spots.',am:['Beachfront','60 guest rooms','Sunset deck','Pool area']},
 {id:'v7',name:'Little Star Party Hall',city:'Kochi',type:'Banquet hall',cap:120,price:28000,rating:4.3,tone:'red',e:'🎈',image:'images/venues/7.jpg',
  ev:['Birthday','Baby Shower','Graduation','Party'],booked:['2026-11-15'],
  desc:'A cheerful small hall with a kids corner, cake table and balloon-friendly ceilings.',am:['Kids corner','Cake table','Sound system','Parking']},
 {id:'v8',name:'Campus Green Auditorium',city:'Chennai',type:'Conference centre',cap:500,price:55000,rating:4.2,tone:'cyan',e:'🎓',image:'images/venues/8.jpg',
  ev:['Graduation','Corporate'],booked:['2026-12-02'],
  desc:'Large auditorium with tiered seating, ideal for convocations and annual days.',am:['Tiered seating','Stage','Green room','Live-stream corner']}
];

/* ---------- vendor categories (each has its own colour) ---------- */
const CATS = [
 {k:'catering',n:'Catering',c:'orange',e:'🍽️',image:'images/catering/1.jpg',about:'Menus and service teams to make your celebration delicious.'},
 {k:'decor',n:'Decor',c:'purple',e:'🎀',image:'images/decor/1.jpg',about:'Bring your event theme to life with talented decorators.'},
 {k:'makeup',n:'Makeup & Styling',c:'pink',e:'💄',image:'images/makeup/1.jpg',about:'Find artists for bridal looks, hair styling and special occasions.'},
 {k:'photo',n:'Photography & Video',c:'cyan',e:'📸',image:'images/photo/1.jpg',about:'Capture every candid, ceremony and celebration worth remembering.'},
 {k:'host',n:'Host & Anchor',c:'yellow',e:'🎤',image:'images/emcee/1.JPG',about:'Hosts and anchors to keep your guests engaged all event long.'},
 {k:'dj',n:'DJ & Music',c:'red',e:'🎧',image:'images/dj/1.jpg',about:'Set the mood with DJs, live bands and professional sound.'},
 {k:'florist',n:'Florist',c:'green',e:'💐',image:'images/decor/5.jpg',about:'Fresh flowers, bouquets and beautiful ceremony arrangements.'}
];

const VENDORS = [
 {id:'d1',cat:'catering',name:'Spice Route Caterers',city:'Coimbatore',from:350,unit:'per plate',rating:4.7,ev:['Wedding','Birthday','Corporate','Engagement'],sv:['South Indian','North Indian','Live counters'],image:'images/catering/1.jpg',desc:'Veg and non-veg menus for 50 to 2,000 guests, prepared by an experienced kitchen team. Choose regional favourites, multi-course spreads and live counters, with service staff available for the full event.'},
 {id:'d2',cat:'catering',name:'Sweet Bites & Co',city:'Chennai',from:250,unit:'per plate',rating:4.4,ev:['Birthday','Baby Shower','Party','Graduation'],sv:['Snacks','Desserts','Cake table'],image:'images/catering/2.jpg',desc:'A small-event catering team serving fresh snacks, dessert tables and custom cakes. Menus can be tailored for birthdays, showers and intimate celebrations.'},
 {id:'d3',cat:'decor',name:'Petal Pursuit Decor',city:'Coimbatore',from:25000,unit:'per event',rating:4.8,ev:['Wedding','Engagement','Anniversary','Baby Shower'],sv:['Stage','Floral','Theme decor'],image:'images/decor/1.jpg',desc:'A creative decor studio designing coordinated stages, entrances and tables in soft pastel themes. The team works with you on a concept and setup plan to suit your venue and celebration.'},
 {id:'d4',cat:'decor',name:'Balloon Bazaar',city:'Kochi',from:6000,unit:'per event',rating:4.5,ev:['Birthday','Baby Shower','Party','Graduation'],sv:['Balloon arches','Backdrops','Props'],image:'images/decor/2.jpg',desc:'Colourful balloon arches, backdrops and playful props for birthdays, baby showers and graduation parties. Packages can be adapted to your theme and event space.'},
 {id:'d5',cat:'makeup',name:'Glow by Meera',city:'Madurai',from:8000,unit:'per person',rating:4.9,ev:['Wedding','Engagement','Anniversary'],sv:['Bridal makeup','Hair styling','Saree draping'],image:'images/makeup/1.jpg',desc:'Bridal and occasion makeup with a personal consultation and trial session. Services include hair styling and saree draping, with looks tailored to your outfit and event.'},
 {id:'d6',cat:'makeup',name:'Studio Shine',city:'Bengaluru',from:3000,unit:'per person',rating:4.3,ev:['Party','Graduation','Birthday','Corporate'],sv:['Party makeup','Hair styling'],image:'images/makeup/2.jpg',desc:'A beauty team creating quick, natural makeup and polished hairstyles for parties, graduations and photoshoots. Share your schedule to plan a relaxed getting-ready session.'},
 {id:'d7',cat:'photo',name:'Frame & Flame Studio',city:'Chennai',from:40000,unit:'per event',rating:4.8,ev:['Wedding','Engagement','Anniversary','Corporate'],sv:['Candid','Drone','Albums','Video'],image:'images/photo/1.jpg',desc:'A wedding and event photography studio focused on candid storytelling, ceremony coverage and cinematic video. Packages can include drone coverage and printed albums, with a preview gallery delivered the same week.'},
 {id:'d8',cat:'photo',name:'Click Cafe',city:'Pondicherry',from:12000,unit:'per event',rating:4.5,ev:['Birthday','Baby Shower','Party','Graduation'],sv:['Photos','Reels','Photo booth'],image:'images/photo/2.jpg',desc:'Fun, fast photo and video coverage for birthdays and small events. Choose candid photos, short social-ready reels or a photo booth to give guests a keepsake.'},
 {id:'d9',cat:'host',name:'Arjun the Anchor',city:'Coimbatore',from:15000,unit:'per event',rating:4.7,ev:['Wedding','Corporate','Anniversary','Party'],sv:['English','Tamil','Games and quizzes'],image:'images/emcee/1.JPG',desc:'An energetic bilingual emcee for stage shows, weddings and award nights. Event run-of-show planning, audience games and announcements are coordinated with your team.'},
 {id:'d10',cat:'host',name:'Priya Events Host',city:'Bengaluru',from:10000,unit:'per event',rating:4.4,ev:['Birthday','Baby Shower','Graduation','Engagement'],sv:['English','Hindi','Kannada'],image:'images/emcee/2.jpg',desc:'A warm, multilingual host for family functions, kids parties and engagement celebrations. The programme is tailored to your guests, schedule and preferred languages.'},
 {id:'d11',cat:'dj',name:'BeatBox DJ',city:'Bengaluru',from:15000,unit:'per event',rating:4.6,ev:['Party','Birthday','Wedding','Corporate'],sv:['DJ','Sound','Lights'],image:'images/dj/1.jpg',desc:'A DJ and production setup with club-quality sound, lighting and playlists for crowds of different sizes. Share your venue and music preferences to plan the right setup.'},
 {id:'d12',cat:'dj',name:'Raga & Rhythm Band',city:'Madurai',from:30000,unit:'per event',rating:4.8,ev:['Wedding','Engagement','Anniversary'],sv:['Live band','Nadaswaram','Singers'],image:'images/dj/2.jpg',desc:'Live performers bringing together classical music, film favourites and traditional wedding music. Set lists and performance timings can be planned around your ceremony.'},
 {id:'d13',cat:'florist',name:'Bloom & Co',city:'Kochi',from:5000,unit:'per event',rating:4.5,ev:['Wedding','Birthday','Anniversary','Baby Shower'],sv:['Bouquets','Garlands','Flower arches'],image:'images/decor/3.jpg',desc:'Fresh flowers sourced daily for bouquets, garlands and flower arches. The team coordinates delivery and setup to complement your event colours and venue.'},
 {id:'d14',cat:'florist',name:'Jasmine Lane',city:'Madurai',from:4000,unit:'per event',rating:4.6,ev:['Wedding','Engagement','Baby Shower'],sv:['Garlands','Mandap flowers','Hair flowers'],image:'images/decor/4.jpg',desc:'Traditional garlands, mandap flowers and hair flowers arranged with fresh seasonal blooms. Share your ceremony style and quantities for a tailored estimate.'}
];

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const rupee = n => '₹' + n.toLocaleString('en-IN');
let tab = 'venues', cat = 'all', fav = new Set();
try { fav = new Set(JSON.parse(localStorage.getItem('eventora-fav') || '[]')); } catch (e) {}
const saveFav = () => { try { localStorage.setItem('eventora-fav', JSON.stringify([...fav])); } catch (e) {} };
const opts = (arr, first) => `<option value="">${first}</option>` + arr.map(x => `<option>${x}</option>`).join('');

function setPriceRange() {
  const p = $('price');
  if (tab === 'venues') { p.min = 20000; p.max = 150000; p.step = 5000; }
  else { p.min = 2000; p.max = 60000; p.step = 1000; }
  p.value = p.max;
  updatePriceLabel();
}
function updatePriceLabel() {
  $('pout').textContent = 'up to ' + rupee(+$('price').value) + (tab === 'venues' ? ' per day' : '');
}

function getF() {
  return { q: $('q').value.trim().toLowerCase(), ev: $('ev').value, city: $('city').value, date: $('date').value,
    guests: +$('guests').value, vtype: $('vtype').value, price: +$('price').value, saved: $('saved').checked, sort: $('sort').value };
}
const sorter = (s, key) => (a, b) => s === 'low' ? a[key] - b[key] : s === 'high' ? b[key] - a[key] : b.rating - a.rating;

/* ---------- venues ---------- */
function venueCard(v, f) {
  const on = fav.has(v.id);
  return `<article class="card c-${v.tone}">
    <div class="banner"><img class="venue-image" src="${v.image}" alt="${v.name}" style="object-position:${v.imagePosition || 'center'}" loading="lazy">
      <button class="heart" data-act="fav" data-id="${v.id}" aria-pressed="${on}" aria-label="Save ${v.name}">${on ? '♥' : '♡'}</button></div>
    <div class="body">
      <h3>${v.name}</h3>
      <p class="meta">📍 ${v.city} · ${v.type}</p>
      <p class="meta">★ ${v.rating.toFixed(1)} · up to ${v.cap} guests</p>
      <p class="price">${rupee(v.price)} <small style="display:inline">per day</small></p>
      <div class="tags">${v.ev.slice(0, 3).map(e => `<span class="tag">${e}</span>`).join('')}</div>
      ${f.date ? '<p class="avail">✓ Available on your date</p>' : ''}
      <div class="acts"><button class="btn alt" data-act="view" data-id="${v.id}">View details</button>
        <button class="btn" data-act="contact" data-id="${v.id}">Contact</button></div>
    </div></article>`;
}
function renderVenues() {
  const f = getF(); let hidden = 0;
  const list = VENUES.filter(v => {
    if (f.q && !(v.name + ' ' + v.city).toLowerCase().includes(f.q)) return false;
    if (f.ev && !v.ev.includes(f.ev)) return false;
    if (f.city && v.city !== f.city) return false;
    if (f.vtype && v.type !== f.vtype) return false;
    if (f.guests && v.cap < f.guests) return false;
    if (v.price > f.price) return false;
    if (f.saved && !fav.has(v.id)) return false;
    if (f.date && v.booked.includes(f.date)) { hidden++; return false; }
    return true;
  }).sort(sorter(f.sort, 'price'));
  $('count').textContent = list.length + ' venue' + (list.length === 1 ? '' : 's') + ' found' +
    (hidden ? ` · ${hidden} hidden because they are booked on ${f.date}` : '');
  $('list').innerHTML = list.length ? `<div class="grid">${list.map(v => venueCard(v, f)).join('')}</div>` : emptyBox('venues');
}

function renderVendors() {
  $('count').textContent = 'Explore our event professionals by category';
  $('list').innerHTML = `<div class="grid">${CATS.map(c => `<a class="card category-card c-${c.c}" href="vendors.html?category=${c.k}" target="_self">
    <img class="category-image" src="${c.image}" alt="${c.n} for events" loading="lazy">
    <div class="category-copy"><h2>${c.e} ${c.n}</h2><p>${c.about}</p>
      <span class="category-link">Explore now <span aria-hidden="true">→</span></span></div>
  </a>`).join('')}</div>`;
}
const emptyBox = w => `<div class="empty"><h3>No ${w} match these filters</h3><p>Try another date, city or price, or clear the filters.</p></div>`;

/* ---------- pop-ups ---------- */
function find(id) { return VENUES.find(x => x.id === id) || VENDORS.find(x => x.id === id); }
function colourOf(x) { return x.tone ? 'c-' + x.tone : 'c-' + CATS.find(c => c.k === x.cat).c; }
function openView(id) {
  const x = find(id), isV = !!x.cap;
  $('dbody').innerHTML = `<div class="dtop ${colourOf(x)}"><h2>${x.name}</h2><p>📍 ${x.city} · ★ ${x.rating.toFixed(1)}</p></div>
   <div class="dmain"><p>${x.desc}</p>
   ${isV ? `<p><b>${rupee(x.price)}</b> per day · up to <b>${x.cap}</b> guests · ${x.type}</p><b>Facilities</b><ul>${x.am.map(a => `<li>${a}</li>`).join('')}</ul>`
         : `<p>From <b>${rupee(x.from)}</b> ${x.unit}</p><b>Services</b><ul>${x.sv.map(a => `<li>${a}</li>`).join('')}</ul>`}
   <p><b>Good for:</b> ${x.ev.join(', ')}</p>
   <div class="acts"><button class="btn" data-act="contact" data-id="${id}">Contact</button><button class="btn alt" data-act="close">Close</button></div></div>`;
  $('dlg').showModal();
}
function openContact(id) {
  const x = find(id);
  $('dbody').innerHTML = `<div class="dtop ${colourOf(x)}"><h2>Contact ${x.name}</h2></div>
   <form class="dmain" id="cform"><p class="message-note">This demo cannot send inquiries yet. SMS or WhatsApp follow-up needs a messaging service and the vendor’s registered contact number.</p>
   <label for="cn">Your name</label><input id="cn" required>
   <label for="cp">Phone</label><input id="cp" type="tel" required>
   <label for="cm">Message</label><textarea id="cm" rows="3" placeholder="Event type, date and guests"></textarea>
   <div class="acts"><button class="btn">Send request</button><button type="button" class="btn alt" data-act="close">Cancel</button></div></form>`;
  if (!$('dlg').open) $('dlg').showModal();
  $('cform').onsubmit = e => { e.preventDefault();
    $('cform').innerHTML = '<div class="message-note">No inquiry was sent. SMS and WhatsApp follow-up needs a connected messaging service and the vendor’s registered contact number.</div><div class="acts"><button type="button" class="btn alt" data-act="close">Close</button></div>'; };
}

/* ---------- venues page ---------- */
function render() { tab === 'venues' ? renderVenues() : renderVendors(); }

function switchTab(t) {
  tab = t; cat = 'all';
  $('tab-venues').classList.toggle('on', t === 'venues'); $('tab-venues').setAttribute('aria-selected', t === 'venues');
  $('tab-vendors').classList.toggle('on', t === 'vendors'); $('tab-vendors').setAttribute('aria-selected', t === 'vendors');
  document.body.classList.toggle('vendors-mode', t === 'vendors');
  document.querySelectorAll('.v-only').forEach(el => el.style.display = t === 'venues' ? '' : 'none');
  setPriceRange(); render();
}

function initVenuesPage() {
  $('burger').onclick = () => { const o = $('links').classList.toggle('open'); $('burger').setAttribute('aria-expanded', o); };
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) heroVideo.pause();
  $('ev').innerHTML = opts(EVENTS, 'All events');
  $('city').innerHTML = opts(CITIES, 'All locations');
  $('vtype').innerHTML = opts(VTYPES, 'All venue types');
  $('date').min = new Date().toISOString().slice(0, 10);
  $('tab-venues').onclick = () => switchTab('venues');
  $('tab-vendors').onclick = () => switchTab('vendors');
  ['q', 'ev', 'city', 'date', 'guests', 'vtype', 'saved', 'sort'].forEach(id => $(id).addEventListener('input', render));
  $('price').addEventListener('input', () => { updatePriceLabel(); render(); });
  $('clear').onclick = () => {
    ['q', 'ev', 'city', 'date', 'guests', 'vtype'].forEach(id => $(id).value = '');
    $('saved').checked = false; $('sort').value = 'rating'; cat = 'all'; setPriceRange(); render();
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'fav') { fav.has(id) ? fav.delete(id) : fav.add(id); saveFav(); render(); }
    if (b.dataset.act === 'view') openView(id);
    if (b.dataset.act === 'contact') openContact(id);
    if (b.dataset.act === 'close') $('dlg').close();
  });
  $('dlg').addEventListener('click', e => { if (e.target === $('dlg')) $('dlg').close(); });
  $('ftoggle').onclick = () => { const o = $('filters').classList.toggle('open'); $('ftoggle').textContent = o ? 'Hide filters' : 'Show filters'; };
  switchTab('venues');
}

/* ---------- vendor directory page ---------- */
function vendorDirectoryCard(d) {
  const on = fav.has(d.id);
  return `<article class="card">
    <img class="vendor-image" src="${d.image}" alt="${d.name}" loading="lazy">
    <button class="heart" data-vendor-act="favorite" data-id="${d.id}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Add'} ${d.name} ${on ? 'from' : 'to'} favourites">${on ? '♥' : '♡'}</button>
    <div class="body">
      <button class="profile-link" data-vendor-act="details" data-id="${d.id}"><h3>${d.name}</h3></button>
      <p class="meta">📍 ${d.city} · ★ ${d.rating.toFixed(1)}</p>
      <p class="price">From ${rupee(d.from)} <small style="display:inline"> ${d.unit}</small></p>
      <div class="tags">${d.sv.map(s => `<span class="tag">${s}</span>`).join('')}</div>
      <div class="acts"><button class="btn alt" data-vendor-act="details" data-id="${d.id}">View details</button>
        <button class="btn" data-vendor-act="book" data-id="${d.id}">Book now</button></div>
    </div>
  </article>`;
}

function openVendorDetails(id) {
  const d = VENDORS.find(x => x.id === id);
  const category = CATS.find(c => c.k === d.cat);
  const on = fav.has(d.id);
  $('vendor-dialog-body').innerHTML = `<img class="vendor-detail-image" src="${d.image}" alt="${d.name}">
    <div class="dmain"><h2>${d.name}</h2><p class="meta">${category.e} ${category.n} · 📍 ${d.city} · ★ ${d.rating.toFixed(1)}</p>
    <p>${d.desc}</p><p class="price">From ${rupee(d.from)} <small style="display:inline"> ${d.unit}</small></p>
    <b>Services</b><ul>${d.sv.map(s => `<li>${s}</li>`).join('')}</ul>
    <p><b>Good for:</b> ${d.ev.join(', ')}</p>
    <div class="acts"><button class="btn alt" data-vendor-act="favorite" data-id="${d.id}" aria-pressed="${on}">${on ? '♥ Added to favourites' : '♡ Add to favourites'}</button>
    <button class="btn" data-vendor-act="book" data-id="${d.id}">Book this vendor</button>
    <button class="btn alt" data-vendor-act="close">Close</button></div></div>`;
  $('vendor-dialog').showModal();
}

function openBookingForm(id) {
  const d = VENDORS.find(x => x.id === id);
  $('vendor-dialog-body').innerHTML = `<div class="dtop ${colourOf(d)}"><h2>Book ${d.name}</h2><p>From ${rupee(d.from)} ${d.unit}</p></div>
    <form class="dmain booking-form" id="booking-form">
      <p class="message-note full">This demo saves your request in this browser only; it does not contact the vendor or send SMS/WhatsApp.</p>
      <label>Your name<input name="name" autocomplete="name" required></label>
      <label>Phone number<input name="phone" type="tel" autocomplete="tel" required></label>
      <label>Event date<input name="date" type="date" min="${new Date().toISOString().slice(0, 10)}" required></label>
      <label>Event type<select name="event" required><option value="">Choose event</option>${EVENTS.map(e => `<option>${e}</option>`).join('')}</select></label>
      <label class="full">Event details<textarea name="details" rows="3" placeholder="Guest count, venue or any requests"></textarea></label>
      <div class="acts"><button class="btn">Send booking request</button><button class="btn alt" type="button" data-vendor-act="details" data-id="${id}">Back to profile</button><button class="btn alt" type="button" data-vendor-act="close">Cancel</button></div>
    </form>`;
  $('vendor-dialog').showModal();
  $('booking-form').onsubmit = e => {
    e.preventDefault();
    const bookings = JSON.parse(localStorage.getItem('eventora-booking-requests') || '[]');
    const booking = Object.fromEntries(new FormData(e.currentTarget).entries());
    bookings.push({ ...booking, vendorId: d.id, vendorName: d.name, requestedAt: new Date().toISOString() });
    localStorage.setItem('eventora-booking-requests', JSON.stringify(bookings));
    $('vendor-dialog-body').innerHTML = `<div class="dmain"><div class="message-note">Your request for ${d.name} was saved in this browser only. The vendor has not been contacted; SMS and WhatsApp delivery are not connected yet.</div>
      <div class="acts"><button class="btn alt" data-vendor-act="close">Close</button></div></div>`;
  };
}

function initVendorDirectory() {
  $('burger').onclick = () => { const o = $('links').classList.toggle('open'); $('burger').setAttribute('aria-expanded', o); };
  const params = new URLSearchParams(location.search);
  const selected = CATS.find(c => c.k === params.get('category'));
  const heading = $('directory-heading');
  heading.textContent = selected ? `${selected.e} ${selected.n}` : 'All Event Vendors';
  $('directory-intro').textContent = selected ? selected.about : 'Browse trusted professionals for your next celebration.';
  if (selected) $('category-back').hidden = false;
  const search = $('vendor-search');
  const city = $('vendor-city');
  city.innerHTML = opts(CITIES, 'All locations');
  const renderDirectory = () => {
    const q = search.value.trim().toLowerCase();
    const items = VENDORS.filter(d => (!selected || d.cat === selected.k) &&
      (!q || (d.name + ' ' + d.city + ' ' + d.sv.join(' ')).toLowerCase().includes(q)) &&
      (!city.value || d.city === city.value)).sort(sorter($('vendor-sort').value, 'from'));
    $('directory-count').textContent = `${items.length} vendor${items.length === 1 ? '' : 's'} found`;
    $('directory-list').innerHTML = items.length ? `<div class="grid">${items.map(vendorDirectoryCard).join('')}</div>` :
      '<div class="empty"><h3>No vendors found</h3><p>Try a different search or location.</p></div>';
  };
  [search, city, $('vendor-sort')].forEach(el => el.addEventListener('input', renderDirectory));
  document.addEventListener('click', e => {
    const button = e.target.closest('[data-vendor-act]');
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.vendorAct === 'favorite') {
      fav.has(id) ? fav.delete(id) : fav.add(id);
      saveFav();
      renderDirectory();
      if ($('vendor-dialog').open && $('vendor-dialog-body').querySelector('[data-vendor-act="favorite"]')) openVendorDetails(id);
    }
    if (button.dataset.vendorAct === 'details') openVendorDetails(id);
    if (button.dataset.vendorAct === 'book') openBookingForm(id);
    if (button.dataset.vendorAct === 'close') $('vendor-dialog').close();
  });
  $('vendor-dialog').addEventListener('click', e => { if (e.target === $('vendor-dialog')) $('vendor-dialog').close(); });
  renderDirectory();
}

function renderFavorites() {
  const venues = VENUES.filter(v => fav.has(v.id));
  const vendors = VENDORS.filter(v => fav.has(v.id));
  $('favorite-venue-count').textContent = `${venues.length} saved`;
  $('favorite-vendor-count').textContent = `${vendors.length} saved`;
  $('favorite-venues').innerHTML = venues.length
    ? `<div class="grid">${venues.map(v => venueCard(v, { date: '' })).join('')}</div>`
    : '<div class="empty"><h3>No saved venues yet</h3><p>Save venues you like and they’ll appear here.</p><a class="btn alt sm" href="venues.html">Explore venues</a></div>';
  $('favorite-vendors').innerHTML = vendors.length
    ? `<div class="grid">${vendors.map(vendorDirectoryCard).join('')}</div>`
    : '<div class="empty"><h3>No saved vendors yet</h3><p>Save vendors you like and they’ll appear here.</p><a class="btn alt sm" href="venues.html">Explore vendors</a></div>';
}

function initFavoritesPage() {
  $('burger').onclick = () => { const o = $('links').classList.toggle('open'); $('burger').setAttribute('aria-expanded', o); };
  document.addEventListener('click', e => {
    const venueButton = e.target.closest('[data-act]');
    if (venueButton) {
      const id = venueButton.dataset.id;
      if (venueButton.dataset.act === 'fav') { fav.has(id) ? fav.delete(id) : fav.add(id); saveFav(); renderFavorites(); }
      if (venueButton.dataset.act === 'view') openView(id);
      if (venueButton.dataset.act === 'contact') openContact(id);
      if (venueButton.dataset.act === 'close') $('dlg').close();
    }
    const vendorButton = e.target.closest('[data-vendor-act]');
    if (!vendorButton) return;
    const id = vendorButton.dataset.id;
    if (vendorButton.dataset.vendorAct === 'favorite') { fav.has(id) ? fav.delete(id) : fav.add(id); saveFav(); renderFavorites(); }
    if (vendorButton.dataset.vendorAct === 'details') openVendorDetails(id);
    if (vendorButton.dataset.vendorAct === 'book') openBookingForm(id);
    if (vendorButton.dataset.vendorAct === 'close') $('vendor-dialog').close();
  });
  $('dlg').addEventListener('click', e => { if (e.target === $('dlg')) $('dlg').close(); });
  $('vendor-dialog').addEventListener('click', e => { if (e.target === $('vendor-dialog')) $('vendor-dialog').close(); });
  renderFavorites();
}

if ($('favorite-venues')) initFavoritesPage();
else if ($('directory-list')) initVendorDirectory();
else if ($('list')) initVenuesPage();
