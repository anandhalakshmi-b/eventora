// ========================================================
// Eventora Dynamic Navigation Bar Controller
// Syncs Visitor vs Vendor vs Customer navbar state
// ========================================================
(function () {
  function init() {
    const linksContainer = document.getElementById('links');
    if (!linksContainer) return;

    const path = window.location.pathname.toLowerCase();
    const isFile = window.location.protocol === 'file:' || path.endsWith('.html');

    // Path resolver
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

    // Page protection guard for user-only modules and dashboards
    const userOnlyPages = ['budget', 'checklist', 'guests', 'rsvp', 'favorites'];
    const isUserOnlyPage = userOnlyPages.some(p => path.includes(p));

    if (isUserOnlyPage) {
      if (!currentUser) {
        sessionStorage.setItem('eventora_redirect', window.location.pathname || window.location.href);
        alert('This planning module (Checklist, Guests, Budget, Favorites) is available after registering or logging in. Please sign in or create an account.');
        window.location.href = routes.register + '?mode=login';
        return;
      } else if (currentUser.role === 'vendor') {
        alert('Vendor accounts cannot access customer planning modules. Redirecting to your Vendor Dashboard.');
        window.location.href = routes.vendorDashboard;
        return;
      }
    }

    if (path.includes('vendor-dashboard')) {
      if (!currentUser || currentUser.role !== 'vendor') {
        alert('Please log in with a Vendor Partner account to access the Vendor Dashboard.');
        window.location.href = routes.register + '?mode=login&role=vendor';
        return;
      }
    }

    if (path.includes('dashboard') && !path.includes('vendor')) {
      if (!currentUser) {
        sessionStorage.setItem('eventora_redirect', window.location.pathname || window.location.href);
        alert('Please sign in to access your User Dashboard.');
        window.location.href = routes.register + '?mode=login';
        return;
      } else if (currentUser.role === 'vendor') {
        window.location.href = routes.vendorDashboard;
        return;
      }
    }

    let navHtml = '';

    if (!currentUser) {
      // VISITOR (NOT LOGGED IN)
      // Home + basic modules visible; Checklist, Guests, Budget, Favorites hidden
      navHtml = `
        <a href="${routes.home}" class="${isActive('home') ? 'on' : ''}">Home</a>
        <a href="${routes.venues}" class="${isActive('venues') ? 'on' : ''}">Venues &amp; Vendors</a>
        <a href="${routes.ideas}" class="${isActive('ideas') ? 'on' : ''}">Ideas</a>
        <a href="${routes.consultation}" class="${isActive('consultation') ? 'on' : ''}">Consultation</a>
        <a href="${routes.invites}" class="${isActive('invites') ? 'on' : ''}">Invites</a>
        <a href="${routes.chatbot}" class="${isActive('chatbot') ? 'on' : ''}">Chatbot</a>
        <a class="btn sm ${isActive('register') ? 'on' : ''}" href="${routes.register}" id="nav-auth-btn">Login / Register</a>
      `;
    } else if (currentUser.role === 'vendor') {
      // VENDOR
      const vName = (currentUser.vendorDetails && currentUser.vendorDetails.businessName) || currentUser.name || 'Vendor';
      navHtml = `
        <a href="${routes.vendorDashboard}" class="${isActive('vendorDashboard') ? 'on' : ''}">Vendor Dashboard</a>
        <a href="${routes.home}" class="${isActive('home') ? 'on' : ''}">Home</a>
        <a href="${routes.ideas}" class="${isActive('ideas') ? 'on' : ''}">Ideas</a>
        <a href="${routes.chatbot}" class="${isActive('chatbot') ? 'on' : ''}">Chatbot</a>
        <span class="nav-user-badge" title="${vName}">🏢 ${vName.length > 16 ? vName.slice(0, 14) + '...' : vName}</span>
        <button type="button" class="nav-logout-btn" id="nav-logout">Logout</button>
      `;
    } else {
      // CUSTOMER (USER)
      const uFirstName = (currentUser.name || 'User').split(' ')[0];
      navHtml = `
        <a href="${routes.home}" class="${isActive('home') ? 'on' : ''}">Home</a>
        <a href="${routes.userDashboard}" class="${isActive('userDashboard') ? 'on' : ''}">Dashboard</a>
        <a href="${routes.venues}" class="${isActive('venues') ? 'on' : ''}">Venues &amp; Vendors</a>
        <a href="${routes.ideas}" class="${isActive('ideas') ? 'on' : ''}">Ideas</a>
        <a href="${routes.consultation}" class="${isActive('consultation') ? 'on' : ''}">Consultation</a>
        <a href="${routes.invites}" class="${isActive('invites') ? 'on' : ''}">Invites</a>
        <a href="${routes.chatbot}" class="${isActive('chatbot') ? 'on' : ''}">Chatbot</a>
        <span class="nav-user-badge" title="${currentUser.name || ''}">👤 ${uFirstName}</span>
        <button type="button" class="nav-logout-btn" id="nav-logout">Logout</button>
      `;
    }

    linksContainer.innerHTML = navHtml;

    // Logout event
    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('eventora_user');
        window.location.href = routes.home;
      });
    }

    // Burger mobile toggle
    const burger = document.getElementById('burger');
    if (burger && !burger._navBound) {
      burger._navBound = true;
      burger.onclick = () => {
        const open = linksContainer.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
      };
    }
  }

  // If visitor is on Home page and clicks any content link, redirect to login / signup page
  function setupHomePageLinkProtection() {
    const path = window.location.pathname.toLowerCase();
    const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/home.html') || path.endsWith('/eventora-home.html') || path === '';
    if (!isHome) return;

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;

      const href = a.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;

      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('eventora_user'));
      } catch (err) {}

      // If user is logged in, allow normal navigation
      if (user) return;

      // Allow Brand Logo, Home, Chatbot, and Register / Login links
      if (a.classList.contains('brand')) return;
      if (href === '/' || href === 'index.html' || href.endsWith('/index.html')) return;
      if (href.includes('chatbot') || href.includes('ora') || href.includes('register')) return;

      // All other links on Home page redirect to Login / Register page
      e.preventDefault();
      const isFile = window.location.protocol === 'file:' || path.endsWith('.html');
      const target = isFile ? 'register.html' : '/register';
      window.location.href = target;
    });
  }

  window.initDynamicNavbar = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      setupHomePageLinkProtection();
    });
  } else {
    init();
    setupHomePageLinkProtection();
  }
})();
