// MODULE 10 - used by invites.html (builder), invites-view.html (download/share) and event.html (public site)
(function () {
  const $ = (id) => document.getElementById(id);
  const card = $('invite-card');
  if (!card) return;

  const setField = (name, value) => {
    const el = card.querySelector(`[data-field="${name}"]`);
    if (el) el.textContent = value || '';
  };
  const fmtDate = (v) => v
    ? new Date(v).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const slugFromUrl = () => location.pathname.split('/').filter(Boolean).pop();

  function showErrors(errors) {
    const box = $('errors');
    if (!box) return;
    box.hidden = false;
    box.replaceChildren(...errors.map((e) => { const p = document.createElement('p'); p.textContent = e; return p; }));
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Fill the invitation card from saved invite data (invite page and event website)
  function fillCard(inv) {
    card.style.setProperty('--bg', inv.bg);
    card.style.setProperty('--fg', inv.accent);
    card.style.fontFamily = `'${inv.fontFamily}', serif`;
    ['heading', 'title', 'hosts', 'message', 'time', 'venue', 'address', 'dressCode', 'rsvpContact'].forEach((f) => setField(f, inv[f]));
    setField('dateText', fmtDate(inv.date));
    const img = card.querySelector('[data-field="photo"]');
    if (inv.photo) { img.src = inv.photo; img.hidden = false; }
  }
  async function getJson(url) {
    const res = await fetch(url);
    return { ok: res.ok, data: await res.json() };
  }

  /* ---------- invites.html : builder with live preview ---------- */
  const form = $('invite-form');
  if (form) {
    const steps = [1, 2, 3].map((n) => $('step-' + n));
    const tabs = document.querySelectorAll('.steps li');
    const showStep = (n) => {
      steps.forEach((s, i) => (s.hidden = i + 1 !== n));
      const two = $('step-2');
      if (n === 3) { two.hidden = false; two.classList.add('preview-only'); } else { two.classList.remove('preview-only'); }
      tabs.forEach((t) => t.classList.toggle('on', Number(t.dataset.step) === n));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    document.querySelectorAll('.tpl').forEach((btn) => {
      btn.addEventListener('click', () => {
        $('template').value = btn.dataset.key;
        card.style.setProperty('--bg', btn.dataset.bg);
        card.style.setProperty('--fg', btn.dataset.fg);
        $('accent').value = btn.dataset.fg;
        card.style.fontFamily = `'${btn.dataset.font}', serif`;
        $('fontFamily').value = btn.dataset.font;
        setField('heading', btn.dataset.heading);
        if (!$('title').value) $('title').value = btn.dataset.title;
        if (!$('message').value) $('message').value = btn.dataset.message;
        ['title', 'message'].forEach((f) => setField(f, $(f).value));
        showStep(2);
      });
    });

    ['title', 'hosts', 'time', 'venue', 'address', 'dressCode', 'rsvpContact', 'message'].forEach((f) => {
      $(f).addEventListener('input', () => setField(f, $(f).value));
    });
    $('date').addEventListener('input', () => setField('dateText', fmtDate($('date').value ? $('date').value + 'T00:00:00' : '')));
    $('fontFamily').addEventListener('change', () => (card.style.fontFamily = `'${$('fontFamily').value}', serif`));
    $('accent').addEventListener('input', () => card.style.setProperty('--fg', $('accent').value));
    $('photo').addEventListener('change', (e) => {
      const file = e.target.files[0];
      const img = card.querySelector('[data-field="photo"]');
      if (!file) { img.hidden = true; return; }
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; img.hidden = false; };
      reader.readAsDataURL(file);
    });

    $('back-1').addEventListener('click', () => showStep(1));
    $('to-3').addEventListener('click', () => {
      if (!$('title').value.trim()) { $('title').focus(); return; }
      showStep(3);
    });
    $('back-2').addEventListener('click', () => showStep(2));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/invites/api', { method: 'POST', body: new FormData(form) });
        const data = await res.json();
        if (!res.ok) { showStep(2); return showErrors(data.errors || ['Something went wrong.']); }
        location.href = '/invites/view/' + data.slug;
      } catch (err) {
        showErrors(['Could not reach the server. Please try again.']);
      }
    });
  }

  /* ---------- invites-view.html : download, copy, share ---------- */
  const viewRoot = $('view-root');
  if (viewRoot) {
    getJson('/invites/api/' + encodeURIComponent(slugFromUrl())).then(({ ok, data }) => {
      if (!ok) return showErrors(data.errors || ['Invite not found.']);
      fillCard(data.invite);
      viewRoot.hidden = false;
      $('share-url').value = data.shareUrl;
      $('wa-link').href = data.whatsappUrl;
      $('mail-link').href = data.mailUrl;
      $('site-link').href = data.shareUrl;

      if (data.guestLinks.length) {
        $('guest-wrap').hidden = false;
        $('guest-note').hidden = true;
        $('guest-send').replaceChildren(...data.guestLinks.map((g) => {
          const li = document.createElement('li');
          li.append(document.createTextNode(g.name + ' '));
          [['WhatsApp', g.whatsapp], ['Email', g.email]].forEach(([label, href]) => {
            if (!href) return;
            const a = document.createElement('a'); a.textContent = label; a.href = href;
            if (label === 'WhatsApp') { a.target = '_blank'; a.rel = 'noopener'; }
            li.appendChild(a);
          });
          return li;
        }));
      }
    }).catch(() => showErrors(['Could not load the invite.']));

    const capture = () => html2canvas(card, { scale: 2, useCORS: true, backgroundColor: null });
    $('dl-png').addEventListener('click', async () => {
      const canvas = await capture();
      const a = document.createElement('a');
      a.download = 'eventora-invite.png'; a.href = canvas.toDataURL('image/png'); a.click();
    });
    $('dl-pdf').addEventListener('click', async () => {
      const canvas = await capture();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const w = 170, h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 20, 15, w, Math.min(h, 265));
      pdf.save('eventora-invite.pdf');
    });
    $('copy-link').addEventListener('click', async () => {
      const input = $('share-url');
      try { await navigator.clipboard.writeText(input.value); $('copy-msg').textContent = 'Link copied! 🎉'; }
      catch (e) { input.select(); $('copy-msg').textContent = 'Press Ctrl+C to copy the link.'; }
    });
  }

  /* ---------- event.html : public mini website with RSVP ---------- */
  const eventRoot = $('event-root');
  if (eventRoot) {
    const slug = slugFromUrl();
    getJson('/e/api/' + encodeURIComponent(slug)).then(({ ok, data }) => {
      if (!ok) return showErrors(data.errors || ['Event not found.']);
      fillCard(data.invite);
      document.title = data.invite.title + ' | Eventora';
      eventRoot.hidden = false;
      if (data.mapSrc) {
        const map = $('map');
        map.src = data.mapSrc; map.title = 'Map of ' + (data.invite.venue || 'the event venue'); map.hidden = false;
      }
    }).catch(() => showErrors(['Could not load the event.']));

    $('rsvp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/e/api/' + encodeURIComponent(slug) + '/rsvp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(e.target)))
        });
        const data = await res.json();
        if (!res.ok) return showErrors(data.errors || ['Something went wrong.']);
        $('rsvp-form').hidden = true; $('errors').hidden = true; $('thanks').hidden = false;
      } catch (err) { showErrors(['Could not reach the server. Please try again.']); }
    });
  }
})();
