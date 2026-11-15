// ========================================================
// Eventora Ora AI Chatbot & Shared Navbar Script
// ========================================================
(function () {
  let sessionId = localStorage.getItem('oraSession') || ('ora-' + Math.random().toString(36).slice(2, 9));
  localStorage.setItem('oraSession', sessionId);

  // Smart rule-based responses tailored for Indian celebrations and Eventora features
  const rules = [
    {
      keys: ['venue', 'hall', 'banquet', 'lawn', 'resort', 'palace', 'jaipur', 'udaipur', 'location'],
      link: 'venues.html',
      label: 'Explore Venues',
      reply: 'Looking for a royal palace, banquet hall or lush lawn? 🏛️ Check out verified venues with guest capacities, pricing and availability on our Venues page.'
    },
    {
      keys: ['vendor', 'caterer', 'catering', 'photographer', 'photo', 'decorator', 'decor', 'dj', 'florist', 'mehendi', 'makeup', 'pandit'],
      link: 'vendors.html',
      label: 'Browse Vendors',
      reply: 'Find top-rated wedding caterers, photographers, decor artists, mehendi specialists and DJs on our Vendors page! 📸'
    },
    {
      keys: ['budget', 'cost', 'price', 'expense', 'lakh', 'rupee', '₹', 'calculate'],
      link: 'budget.html',
      label: 'Budget Calculator',
      reply: 'Stay stress-free with your finances! 💰 Set your total budget in ₹, compare estimated vs actual costs, and view visual charts on our Budget Tracker.'
    },
    {
      keys: ['checklist', 'task', 'todo', 'to-do', 'reminder', 'schedule', 'haldi', 'sangeet'],
      link: 'checklist.html',
      label: 'Event Checklist',
      reply: 'Never miss a ritual or deadline! ✅ From Haldi & Mehendi prep to wedding-day countdowns, use our interactive Checklist.'
    },
    {
      keys: ['guest', 'rsvp', 'invite list', 'attendee', 'ladkewale', 'ladkiwale', 'diet'],
      link: 'guests.html',
      label: 'Guests & RSVPs',
      reply: 'Manage your guest list with ease! 👥 Track RSVPs, meal preferences (Jain, Veg, Non-Veg), and family groups on our Guests page.'
    },
    {
      keys: ['invite', 'invitation', 'card', 'e-invite', 'patrika', 'shahi', 'website'],
      link: 'invites.html',
      label: 'Invites & Websites',
      reply: 'Design elegant invitations & digital event websites in minutes! 💌 Choose themes like Shubh Vivah, Royal Gold and share on WhatsApp.'
    },
    {
      keys: ['idea', 'theme', 'color', 'palette', 'inspiration', 'advice'],
      link: 'ideas.html',
      label: 'Ideas & Advice',
      reply: 'Need fresh inspiration? ✨ Browse curated wedding themes, decor color palettes, and expert advice on the Ideas page.'
    },
    {
      keys: ['consult', 'starter', 'help me plan', 'free plan', 'starter plan'],
      link: 'consultation.html',
      label: 'Free Starter Plan',
      reply: 'Get an instant starter plan tailored for Indian events with timelines, recommended vendor categories, and budget split! 🌈'
    },
    {
      keys: ['human', 'person', 'agent', 'talk to someone', 'call', 'consultant'],
      link: 'consultation-book.html',
      label: 'Book a Consultant',
      reply: 'We are here for you! 🙏 Schedule a free 1-on-1 call with a dedicated human event consultant.'
    },
    {
      keys: ['favorite', 'favourite', 'saved', 'shortlist', 'heart'],
      link: 'favorites.html',
      label: 'View Favourites',
      reply: 'View and compare all your shortlisted venues and service providers on your Favourites page ♥'
    },
    {
      keys: ['register', 'login', 'signup', 'sign up', 'account', 'vendor register'],
      link: 'register.html',
      label: 'Register Account',
      reply: 'Create your account as a host or register your business as a vendor on Eventora! 🎉'
    },
    {
      keys: ['muhurat', 'muhurtham', 'auspicious', 'date'],
      link: null,
      label: null,
      reply: 'For auspicious dates (shubh muhurat), consult your family priest first. Once fixed, book your venue 9-12 months ahead for best availability! 🪔'
    },
    {
      keys: ['hi', 'hello', 'hey', 'namaste', 'vanakkam', 'kem cho', 'salaam'],
      link: null,
      label: null,
      reply: 'Namaste! 🙏 I am Ora, your Eventora AI planning companion. Ask me anything about venues, budgets, checklists, invites, or vendor hiring.'
    },
    {
      keys: ['thank', 'thanks', 'dhanyawad', 'shukriya'],
      link: null,
      label: null,
      reply: 'Shubh kaaryam! 😊 Happy to assist you. Let me know if you need any other help planning your special occasion.'
    }
  ];

  const fallback = {
    reply: "I'm here to help with all your celebration details! Ask about wedding venues, caterers, budgets in ₹, Haldi/Sangeet checklists, or custom invites.",
    link: 'venues.html',
    label: 'Explore Eventora'
  };

  function findRuleReply(text) {
    const q = (text || '').toLowerCase().trim();
    for (const r of rules) {
      if (r.keys.some(k => q.includes(k))) {
        return r;
      }
    }
    return fallback;
  }

  // Globally expose bot response function for chatbot.html or other scripts
  window.getBotResponse = function (query) {
    const match = findRuleReply(query);
    return {
      text: match.reply,
      link: match.link ? { url: match.link, label: match.label || 'Open Page →' } : null
    };
  };

  function addBubble(log, text, who, link, label) {
    if (!log) return;
    const div = document.createElement('div');
    div.className = 'bubble ' + who;
    div.textContent = text;
    if (link) {
      const a = document.createElement('a');
      a.href = link;
      a.textContent = ' ' + (label || 'Open page →');
      a.className = 'bubble-link';
      div.appendChild(document.createElement('br'));
      div.appendChild(a);
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  async function sendMessage(text, log, input) {
    text = (text || '').trim();
    if (!text) return;
    addBubble(log, text, 'me');
    if (input) input.value = '';

    // First attempt to call backend API
    try {
      const res = await fetch('/ora/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId })
      });
      if (!res.ok) throw new Error('Status ' + res.status);
      const data = await res.json();
      if (data.sessionId) {
        sessionId = data.sessionId;
        localStorage.setItem('oraSession', sessionId);
      }
      addBubble(log, data.reply || 'Here to help!', 'ora', data.link);
    } catch (e) {
      // Graceful instant fallback to client-side rule intelligence
      const match = findRuleReply(text);
      setTimeout(() => {
        addBubble(log, match.reply, 'ora', match.link, match.label);
      }, 300);
    }
  }

  // Initialize once DOM is ready
  function init() {
    // 1. Mobile menu toggle for shared navigation bar
    const burger = document.getElementById('burger');
    const links = document.getElementById('links');
    if (burger && links && !burger._oraBound) {
      burger._oraBound = true;
      burger.addEventListener('click', function () {
        const isOpen = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // 2. Floating widget
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
            addBubble(log, "Namaste! 🙏 I'm Ora, your Eventora AI planning buddy. How can I help with your event?", 'ora');
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

      document.querySelectorAll('.ora-quick button').forEach(b => {
        b.addEventListener('click', () => {
          const q = b.dataset.q || b.textContent;
          sendMessage(q, log, input);
        });
      });
    }

    // 3. Full page chat console (if present on chatbot.html)
    const fullForm = document.getElementById('full-chat-form');
    const fullInput = document.getElementById('full-chat-input');
    const fullMessages = document.getElementById('full-chat-messages');
    const fullClear = document.getElementById('btn-clear-chat');

    if (fullForm && fullInput && fullMessages) {
      fullForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = fullInput.value.trim();
        if (!val) return;
        fullInput.value = '';

        // Add user message
        const uBubble = document.createElement('div');
        uBubble.className = 'chat-bubble bubble-user';
        uBubble.textContent = val;
        fullMessages.appendChild(uBubble);
        fullMessages.scrollTop = fullMessages.scrollHeight;

        // Bot reply
        setTimeout(() => {
          const res = window.getBotResponse(val);
          const bBubble = document.createElement('div');
          bBubble.className = 'chat-bubble bubble-bot';
          let html = '<p>' + res.text + '</p>';
          if (res.link) {
            html += '<div style="margin-top:10px;"><a href="' + res.link.url + '" class="btn btn-secondary btn-sm" style="font-size:0.75rem; border-color:#CBD5E1; text-decoration:none; display:inline-block; padding:6px 14px; border-radius:999px; background:#fff; color:#2563EB; font-weight:700;">' + (res.link.label || 'Open Page →') + '</a></div>';
          }
          bBubble.innerHTML = html;
          fullMessages.appendChild(bBubble);
          fullMessages.scrollTop = fullMessages.scrollHeight;
        }, 350);
      });

      if (fullClear) {
        fullClear.addEventListener('click', () => {
          fullMessages.innerHTML = `
            <div class="chat-bubble bubble-bot">
              Namaste! I am your <strong>Eventora AI Concierge</strong>.
              I can assist you with finding royal palaces & banquet lawns across India, managing your wedding budget in ₹, organizing Haldi, Mehendi & Sangeet tasks, designing invitations, and tracking guest RSVPs.
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
