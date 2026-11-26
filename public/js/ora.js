// ========================================================
// Eventora Ora AI Chatbot & Shared Navbar Script
// ========================================================
(function () {
  // Do NOT create a sessionId before logging in; only reflect server-authenticated sessions.
  const chatHistory = [];

  // Smart conversational fallback responses (never pushes unwanted page redirects)
  const rules = [
    {
      keys: ['order', 'sequence', 'step by step', 'what first', 'how to start'],
      link: null,
      label: null,
      reply: 'Recommended planning order:\n1. Set your budget and guest estimate.\n2. Pick your date and book a venue.\n3. Book caterer, photographer, and decorator.\n4. Create invitations and share your RSVP link on WhatsApp.\n5. Track RSVPs and complete final checklist tasks.'
    },
    {
      keys: ['hi', 'hello', 'hey', 'greetings'],
      link: null,
      label: null,
      reply: 'Hello! I am Ora, your Eventora planning assistant. Ask me about planning order, venues, budgets, or guests, or tell me directly to change your plan, budget, or checklist.'
    },
    {
      keys: ['thank', 'thanks'],
      link: null,
      label: null,
      reply: 'You are welcome. Let me know if you want to make any other changes or ask another question.'
    }
  ];

  const fallback = {
    reply: 'I can help with planning order, event advice, or direct updates—try asking "what is the correct order to plan?", "remove haldi", "set budget to 800000", or "add task book photographer".',
    link: null,
    label: null
  };

  function findRuleReply(text) {
    const q = (text || '').toLowerCase().trim();
    for (const r of rules) {
      if (r.keys.some((k) => q.includes(k))) {
        return r;
      }
    }
    return fallback;
  }

  window.getBotResponse = function (query) {
    const match = findRuleReply(query);
    return {
      text: match.reply,
      link: match.link ? { url: match.link, label: match.label || 'Open Page' } : null
    };
  };

  function getActiveUserKey() {
    try {
      const u = JSON.parse(localStorage.getItem('eventora_user'));
      return u && (u.email || u.id) ? String(u.email || u.id).toLowerCase().trim() : '';
    } catch (e) {
      return '';
    }
  }

  function applyChatbotActions(actions) {
    if (!Array.isArray(actions) || actions.length === 0) return;
    const userKey = getActiveUserKey();
    const path = window.location.pathname.toLowerCase();

    actions.forEach((act) => {
      if (!act || !act.type) return;

      if (act.type === 'customize_plan' || act.type === 'update_checklist') {
        const chkKey = userKey ? `eventora-checklist:${userKey}` : 'eventora-checklist-shubh-v1';
        let rows = [];
        try {
          rows = JSON.parse(localStorage.getItem(chkKey) || '[]');
        } catch (e) {
          rows = [];
        }

        const removeKeys = [];
        if (Array.isArray(act.removeKeywords)) removeKeys.push(...act.removeKeywords);
        if (act.removeKeyword) removeKeys.push(act.removeKeyword);

        if (removeKeys.length && Array.isArray(rows) && rows.length) {
          const lowerKeys = removeKeys.map((k) => String(k).toLowerCase().trim()).filter(Boolean);
          rows = rows.filter((item) => {
            const text = `${item.title || ''} ${item.cat || ''} ${item.category || ''}`.toLowerCase();
            return !lowerKeys.some((k) => text.includes(k));
          });
        }

        const adds = [];
        if (Array.isArray(act.addItems)) adds.push(...act.addItems);
        if (act.addTask) adds.push(act.addTask);
        adds.forEach((title) => {
          const clean = String(title || '').trim();
          if (!clean) return;
          if (!Array.isArray(rows)) rows = [];
          rows.push({
            id: 'chk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            title: clean,
            due: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
            cat: 'Other',
            pri: 'Medium',
            who: 'Both',
            grp: 'g2',
            done: false
          });
        });

        if (act.completeKeyword && Array.isArray(rows)) {
          const kw = String(act.completeKeyword).toLowerCase().trim();
          rows.forEach((item) => {
            if (String(item.title || '').toLowerCase().includes(kw)) {
              item.done = true;
            }
          });
        }

        try {
          localStorage.setItem(chkKey, JSON.stringify(rows));
          if (removeKeys.length) {
            const prevEx = JSON.parse(localStorage.getItem('eventora_excluded_ceremonies') || '[]');
            const merged = [...new Set([...(Array.isArray(prevEx) ? prevEx : []), ...removeKeys])];
            localStorage.setItem('eventora_excluded_ceremonies', JSON.stringify(merged));
          }
        } catch (e) {}

        if (path.includes('checklist')) {
          setTimeout(() => window.location.reload(), 400);
        }
      }

      if (act.type === 'update_budget') {
        const bKey = userKey ? `eventora-budget:${userKey}` : 'eventora-budget';
        let b = { total: 1500000, items: [] };
        try {
          const stored = JSON.parse(localStorage.getItem(bKey) || localStorage.getItem('eventora-budget') || 'null');
          if (stored && typeof stored === 'object' && Array.isArray(stored.items)) b = stored;
        } catch (e) {}

        if (typeof act.total === 'number' && !Number.isNaN(act.total)) {
          b.total = Math.max(0, act.total);
        }
        if (act.addExpense && act.addExpense.category) {
          b.items.push({
            id: Math.random().toString(36).slice(2, 9),
            cat: String(act.addExpense.category),
            est: Math.max(0, Number(act.addExpense.estimated) || 0),
            act: Math.max(0, Number(act.addExpense.actual) || 0)
          });
        }

        try {
          localStorage.setItem(bKey, JSON.stringify(b));
        } catch (e) {}

        if (path.includes('budget')) {
          setTimeout(() => window.location.reload(), 400);
        }
      }

      if (act.type === 'refresh_guests' && path.includes('guests')) {
        setTimeout(() => window.location.reload(), 400);
      }
    });
  }

  function addBubble(log, text, who, link, label) {
    if (!log) return;
    const div = document.createElement('div');
    div.className = 'bubble ' + who;
    div.textContent = text;
    if (link) {
      const a = document.createElement('a');
      a.href = link;
      a.textContent = label || 'Open page';
      a.className = 'bubble-link';
      div.appendChild(document.createElement('br'));
      div.appendChild(a);
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  async function callChatApi(message) {
    chatHistory.push({ role: 'user', text: message });
    const res = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: chatHistory.slice(-8),
        context: { currentPage: window.location.pathname }
      })
    });
    if (!res.ok) throw new Error('Status ' + res.status);
    const data = await res.json();
    if (data && Array.isArray(data.actions)) {
      applyChatbotActions(data.actions);
    }
    const replyText = (data && data.reply) || 'How can I help with your event?';
    chatHistory.push({ role: 'ora', text: replyText });
    return {
      reply: replyText,
      link: data && data.link ? data.link : null,
      label: data && data.linkLabel ? data.linkLabel : 'Open page'
    };
  }

  async function sendMessage(text, log, input) {
    text = (text || '').trim();
    if (!text) return;
    addBubble(log, text, 'me');
    if (input) input.value = '';

    try {
      const data = await callChatApi(text);
      addBubble(log, data.reply, 'ora', data.link, data.label);
    } catch (e) {
      const match = findRuleReply(text);
      addBubble(log, match.reply, 'ora', match.link, match.label);
    }
  }

  function renderDynamicNavbar() {
    const linksContainer = document.getElementById('links');
    if (!linksContainer) return;

    const path = window.location.pathname.toLowerCase();
    const isFile = window.location.protocol === 'file:' || path.endsWith('.html');
    const u = (clean, file) => (isFile ? file : clean);

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
        <span class="nav-user-badge" title="${vName}">${vName.length > 16 ? vName.slice(0, 14) + '...' : vName}</span>
        <button type="button" class="nav-logout-btn" id="nav-logout">Logout</button>
      `;
    } else {
      const uFirstName = (currentUser.name || 'User').split(' ')[0];
      navHtml = `
        <a href="${routes.userDashboard}" class="${isActive('userDashboard') ? 'on' : ''}">Home</a>
        <span class="nav-user-badge" title="${currentUser.name || ''}">${uFirstName}</span>
        <button type="button" class="nav-logout-btn" id="nav-logout">Logout</button>
      `;
    }

    linksContainer.innerHTML = navHtml;

    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        } catch (e) {}
        localStorage.removeItem('eventora_user');
        localStorage.removeItem('oraSession');
        window.location.href = routes.home;
      });
    }
  }

  async function syncServerSession() {
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
          renderDynamicNavbar();
          renderUserPageNavigation();
          return;
        }
      }
      localStorage.removeItem('eventora_user');
      localStorage.removeItem('oraSession');
      renderDynamicNavbar();
      if (!isPublic) {
        window.location.href = '/register?mode=login&redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }
    } catch (e) {}
  }

  function renderUserPageNavigation() {
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('eventora_user'));
    } catch (e) {}

    if (!currentUser || currentUser.role === 'vendor') return;
    if (document.querySelector('.eventora-user-nav')) return;

    const path = window.location.pathname.toLowerCase();
    const isFile = window.location.protocol === 'file:' || path.endsWith('.html');
    const route = (clean, file) => (isFile ? file : clean);
    const items = [
      { key: 'overview', label: 'Overview', href: route('/dashboard', 'eventora-dashboard.html') },
      { key: 'venues', label: 'Venues & Vendors', href: route('/venues', 'venues.html') },
      { key: 'budget', label: 'Budget', href: route('/budget', 'budget.html') },
      { key: 'checklist', label: 'Checklist', href: route('/checklist', 'checklist.html') },
      { key: 'guests', label: 'Guests & RSVPs', href: route('/guests', 'guests.html') },
      { key: 'invites', label: 'Invites', href: route('/invites', 'invites.html') },
      { key: 'favorites', label: 'Favourites', href: route('/favorites', 'favorites.html') },
      { key: 'consultation', label: 'AI Consultation', href: route('/consultation', 'consultation.html') }
    ];
    const isActive = (key) => {
      if (key === 'overview') return path.includes('dashboard') && !path.includes('vendor');
      if (key === 'venues') return path.includes('venues') || path.includes('vendors');
      if (key === 'budget') return path.includes('budget');
      if (key === 'checklist') return path.includes('checklist');
      if (key === 'guests') return path.includes('guests') || path.includes('rsvp');
      if (key === 'invites') return path.includes('invites');
      if (key === 'favorites') return path.includes('favorites');
      if (key === 'consultation') return path.includes('consultation');
      return false;
    };

    const sectionNav = document.createElement('nav');
    sectionNav.className = 'eventora-user-nav';
    sectionNav.setAttribute('aria-label', 'Dashboard sections');
    sectionNav.innerHTML = items.map((item) =>
      `<a href="${item.href}"${isActive(item.key) ? ' aria-current="page"' : ''}>${item.label}</a>`
    ).join('');

    const existingTabs = document.querySelector('.event-tabs[aria-label="Event sections"]');
    if (existingTabs) {
      existingTabs.replaceWith(sectionNav);
      return;
    }

    const hero = document.querySelector('header.hero');
    if (hero) {
      hero.insertAdjacentElement('afterend', sectionNav);
      return;
    }

    const main = document.querySelector('main');
    if (main) {
      main.insertAdjacentElement('beforebegin', sectionNav);
      return;
    }

    const topNav = document.querySelector('body > nav');
    if (topNav) topNav.insertAdjacentElement('afterend', sectionNav);
  }

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

      if (user) return;

      if (a.classList.contains('brand')) return;
      if (href === '/' || href === 'index.html' || href.endsWith('/index.html')) return;
      if (href.includes('chatbot') || href.includes('ora') || href.includes('register')) return;

      e.preventDefault();
      const isFile = window.location.protocol === 'file:' || path.endsWith('.html');
      const target = isFile ? 'register.html' : '/register';
      window.location.href = target;
    });
  }

  function init() {
    renderDynamicNavbar();
    renderUserPageNavigation();
    syncServerSession();
    setupHomePageLinkProtection();

    const burger = document.getElementById('burger');
    const links = document.getElementById('links');
    if (burger && links && !burger._oraBound && !burger._dynBound && !burger._navBound) {
      burger._oraBound = true;
      burger.addEventListener('click', function () {
        const isOpen = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(isOpen));
      });
    }

    const fab = document.getElementById('ora-fab');
    const win = document.getElementById('ora-window');
    const log = document.getElementById('ora-log');
    const input = document.getElementById('ora-input');
    const sendBtn = document.getElementById('ora-send');
    const closeBtn = document.getElementById('ora-close');

    if (fab && win && log) {
      let greeted = false;

      function toggle(open) {
        win.hidden = !open;
        fab.setAttribute('aria-expanded', String(open));
        if (open) {
          if (!greeted && log.children.length === 0) {
            addBubble(log, "Hello! I'm Ora, your Eventora planning assistant. How can I help with your event?", 'ora');
            greeted = true;
          }
          if (input) input.focus();
        }
      }

      fab.addEventListener('click', () => toggle(win.hidden));
      if (closeBtn) closeBtn.addEventListener('click', () => toggle(false));
      if (sendBtn && input) {
        sendBtn.addEventListener('click', () => sendMessage(input.value, log, input));
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(input.value, log, input);
          }
        });
      }

      document.querySelectorAll('.ora-quick button').forEach((b) => {
        b.addEventListener('click', () => {
          const q = b.dataset.q || b.textContent;
          sendMessage(q, log, input);
        });
      });
    }

    // Full page chat console (on chatbot.html / ora.html)
    const fullForm = document.getElementById('full-chat-form');
    const fullInput = document.getElementById('full-chat-input');
    const fullMessages = document.getElementById('full-chat-messages');
    const fullClear = document.getElementById('btn-clear-chat');

    if (fullForm && fullInput && fullMessages) {
      fullForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const val = fullInput.value.trim();
        if (!val) return;
        fullInput.value = '';

        const uBubble = document.createElement('div');
        uBubble.className = 'chat-bubble bubble-user';
        uBubble.textContent = val;
        fullMessages.appendChild(uBubble);
        fullMessages.scrollTop = fullMessages.scrollHeight;

        const typing = document.createElement('div');
        typing.className = 'chat-bubble bubble-bot';
        typing.textContent = 'Thinking...';
        fullMessages.appendChild(typing);
        fullMessages.scrollTop = fullMessages.scrollHeight;

        let replyText = '';
        let linkUrl = null;
        let linkLabel = 'Open Page';

        try {
          const res = await callChatApi(val);
          replyText = res.reply;
          linkUrl = res.link;
          linkLabel = res.label || 'Open Page';
        } catch (err) {
          const fallbackRes = window.getBotResponse(val);
          replyText = fallbackRes.text;
          linkUrl = fallbackRes.link ? fallbackRes.link.url : null;
          linkLabel = fallbackRes.link ? fallbackRes.link.label : 'Open Page';
        }

        typing.remove();
        const bBubble = document.createElement('div');
        bBubble.className = 'chat-bubble bubble-bot';
        const p = document.createElement('p');
        p.style.margin = '0';
        p.textContent = replyText;
        bBubble.appendChild(p);
        if (linkUrl) {
          const wrap = document.createElement('div');
          wrap.style.marginTop = '10px';
          const a = document.createElement('a');
          a.href = linkUrl;
          a.className = 'btn btn-secondary btn-sm';
          a.style.cssText = 'font-size:0.75rem; border-color:#CBD5E1; text-decoration:none; display:inline-block; padding:6px 14px; border-radius:999px; background:#fff; color:#2563EB; font-weight:700;';
          a.textContent = linkLabel;
          wrap.appendChild(a);
          bBubble.appendChild(wrap);
        }
        fullMessages.appendChild(bBubble);
        fullMessages.scrollTop = fullMessages.scrollHeight;
      });

      if (fullClear) {
        fullClear.addEventListener('click', () => {
          chatHistory.length = 0;
          fullMessages.innerHTML = `
            <div class="chat-bubble bubble-bot">
              Hello! I am your <strong>Eventora AI Concierge</strong>.
              I can assist you with finding venues across India, managing your event budget in INR, organizing checklists, designing invitations, and tracking guest RSVPs.
              What are you celebrating today?
            </div>
          `;
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
