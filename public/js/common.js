/* Shared helpers */
const $ = id => document.getElementById(id);
const rupee = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

function downloadFile(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
const csvCell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
function parseCSV(text) {            /* handles quoted cells */
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

// ========================================================
// Dynamic Navbar Sync: Logged-out vs Vendor vs Customer
// ========================================================
function initDynamicNavbar() {
  const linksContainer = document.getElementById('links');
  if (!linksContainer) return;

  const path = window.location.pathname.toLowerCase();
  const isFile = window.location.protocol === 'file:' || path.endsWith('.html');

  // URL resolver
  const u = (clean, file) => isFile ? file : clean;

  const routes = {
    home: u('/', 'index.html'),
    chatbot: u('/ora', 'chatbot.html'),
    register: u('/register', 'register.html'),
    venues: u('/venues', 'venues.html'),
    ideas: u('/ideas', 'ideas.html'),
    budget: u('/budget', 'budget.html'),
    checklist: u('/checklist', 'checklist.html'),
    guests: u('/guests', 'guests.html'),
    rsvp: u('/rsvp', 'rsvp.html'),
    consultation: u('/consultation', 'consultation.html'),
    invites: u('/invites', 'invites.html'),
    favorites: u('/favorites', 'favorites.html'),
    userDashboard: u('/dashboard', 'eventora-dashboard.html'),
    vendorDashboard: u('/vendor-dashboard', 'vendor-dashboard.html')
  };

  // Determine current active page key
  const isActive = (key) => {
    if (key === 'home' && (path === '/' || path.endsWith('/index.html') || path.endsWith('/home.html') || path === '')) return true;
    if (key === 'chatbot' && (path.includes('ora') || path.includes('chatbot'))) return true;
    if (key === 'register' && path.includes('register')) return true;
    if (key === 'venues' && (path.includes('venues') || path.includes('vendors'))) return true;
    if (key === 'ideas' && path.includes('ideas')) return true;
    if (key === 'budget' && path.includes('budget')) return true;
    if (key === 'checklist' && path.includes('checklist')) return true;
    if (key === 'guests' && path.includes('guests')) return true;
    if (key === 'rsvp' && path.includes('rsvp')) return true;
    if (key === 'consultation' && path.includes('consultation')) return true;
    if (key === 'invites' && path.includes('invites')) return true;
    if (key === 'favorites' && path.includes('favorites')) return true;
    if (key === 'userDashboard' && path.includes('dashboard') && !path.includes('vendor')) return true;
    if (key === 'vendorDashboard' && path.includes('vendor-dashboard')) return true;
    return false;
  };

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('eventora_user'));
  } catch (e) {}

  let navHtml = '';

  if (!currentUser) {
    navHtml = `
      <a href="${routes.home}" class="${isActive('home') ? 'on' : ''}">Home</a>
      <a href="${routes.chatbot}" class="${isActive('chatbot') ? 'on' : ''}">Chatbot</a>
      <a class="btn sm ${isActive('register') ? 'on' : ''}" href="${routes.register}" id="nav-auth-btn">Login / Register</a>
    `;
  } else if (currentUser.role === 'vendor') {
    const vName = (currentUser.vendorDetails && currentUser.vendorDetails.businessName) || currentUser.name || 'Vendor';
    navHtml = `
      <a href="${routes.vendorDashboard}" class="${isActive('vendorDashboard') ? 'on' : ''}">Vendor Dashboard</a>
      <a href="${routes.home}" class="${isActive('home') ? 'on' : ''}">Home</a>
      <a href="${routes.chatbot}" class="${isActive('chatbot') ? 'on' : ''}">Chatbot</a>
      <span class="nav-user-badge" title="${esc(vName)}">${esc(vName.length > 16 ? vName.slice(0, 14) + '...' : vName)}</span>
      <button type="button" class="nav-logout-btn" id="nav-logout">Logout</button>
    `;
  } else {
    const uFirstName = (currentUser.name || 'User').split(' ')[0];
    navHtml = `
      <a href="${routes.userDashboard}" class="${isActive('userDashboard') ? 'on' : ''}">Home</a>
      <a href="${routes.userDashboard}?registerEvent=1#register-event-section" id="nav-register-event">Register New Event</a>
      <span class="nav-user-badge" title="${esc(currentUser.name || '')}">${esc(uFirstName)}</span>
      <button type="button" class="nav-logout-btn" id="nav-logout">Logout</button>
    `;
  }

  linksContainer.innerHTML = navHtml;

  const regEvLink = document.getElementById('nav-register-event');
  if (regEvLink) {
    regEvLink.addEventListener('click', (e) => {
      if (typeof window.openRegisterEventPanel === 'function') {
        e.preventDefault();
        window.openRegisterEventPanel();
      }
    });
  }

  // Handle Logout (clear server cookie + local state)
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch (e) {}
      localStorage.removeItem('eventora_user');
      localStorage.removeItem('oraSession');
      localStorage.removeItem('eventora-budget');
      localStorage.removeItem('eventora-checklist-shubh-v1');
      localStorage.removeItem('eventora-checklist-queue-v1');
      window.location.href = routes.home;
    });
  }

  // Handle Burger toggle
  const burger = document.getElementById('burger');
  if (burger && !burger._dynBound) {
    burger._dynBound = true;
    burger.onclick = () => {
      const open = linksContainer.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    };
  }
}

async function syncAuthSessionWithServer() {
  if (window.location.protocol === 'file:' || window._eventoraSessionSynced) return;
  window._eventoraSessionSynced = true;

  const p = window.location.pathname.toLowerCase();
  const isPublic =
    p === '/' ||
    p === '' ||
    p.includes('index') ||
    p.includes('home') ||
    p.includes('register') ||
    p.includes('chatbot') ||
    p.includes('ora') ||
    p.includes('rsvp') ||
    p.includes('invites-view') ||
    p.includes('invites/view');

  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.authenticated && data.user) {
        localStorage.setItem('eventora_user', JSON.stringify(data.user));
        initDynamicNavbar();
        return;
      }
    }
    localStorage.removeItem('eventora_user');
    localStorage.removeItem('oraSession');
    initDynamicNavbar();
    if (!isPublic) {
      window.location.href = '/register?mode=login&redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }
  } catch (e) {}
}

window.initDynamicNavbar = initDynamicNavbar;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDynamicNavbar();
    syncAuthSessionWithServer();
  });
} else {
  initDynamicNavbar();
  syncAuthSessionWithServer();
}
