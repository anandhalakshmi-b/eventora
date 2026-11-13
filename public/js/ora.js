// MODULE 9 - client script for the floating widget and the full /ora page
(function () {
  let sessionId = localStorage.getItem('oraSession') || '';

  function addBubble(log, text, who, link) {
    const div = document.createElement('div');
    div.className = 'bubble ' + who;
    div.textContent = text; // textContent keeps user input safe from HTML injection
    if (link) {
      const a = document.createElement('a');
      a.href = link; a.textContent = ' Open page →'; a.className = 'bubble-link';
      div.appendChild(a);
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  async function send(text, log, input) {
    text = text.trim();
    if (!text) return;
    addBubble(log, text, 'me');
    if (input) input.value = '';
    try {
      const res = await fetch('/ora/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId })
      });
      const data = await res.json();
      if (data.sessionId) { sessionId = data.sessionId; localStorage.setItem('oraSession', sessionId); }
      addBubble(log, data.reply, 'ora', data.link);
    } catch (e) {
      addBubble(log, 'I could not connect. Please try again in a moment 🙏', 'ora');
    }
  }

  // Floating widget
  const fab = document.getElementById('ora-fab');
  if (fab) {
    const win = document.getElementById('ora-window');
    const log = document.getElementById('ora-log');
    const input = document.getElementById('ora-input');
    let greeted = false;

    function toggle(open) {
      win.hidden = !open; fab.setAttribute('aria-expanded', String(open));
      if (open) {
        if (!greeted) { addBubble(log, 'Namaste! 🙏 I\'m Ora. How can I help with your event?', 'ora'); greeted = true; }
        input.focus();
      }
    }
    fab.addEventListener('click', () => toggle(win.hidden));
    document.getElementById('ora-close').addEventListener('click', () => toggle(false));
    document.getElementById('ora-send').addEventListener('click', () => send(input.value, log, input));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(input.value, log, input); });
    document.querySelectorAll('.ora-quick button').forEach((b) =>
      b.addEventListener('click', () => send(b.dataset.q, log, null)));
  }

  // Full page
  const pageSend = document.getElementById('ora-page-send');
  if (pageSend) {
    const log = document.getElementById('ora-page-log');
    const input = document.getElementById('ora-page-input');
    addBubble(log, 'Namaste! 🙏 I\'m Ora. Ask me anything about your event.', 'ora');
    pageSend.addEventListener('click', () => send(input.value, log, input));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(input.value, log, input); });
  }
})();
