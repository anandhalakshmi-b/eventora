/**
 * Eventora Invites & Digital Cards Script
 * Handles 3-step wizard, live card preview, template selection, MongoDB persistence,
 * PNG & PDF downloads, and WhatsApp sharing.
 */

(function () {
  const $ = (id) => document.getElementById(id);
  const card = $('invite-card');
  if (!card) return;

  const setField = (name, value) => {
    const el = card.querySelector(`[data-field="${name}"]`);
    if (el) el.textContent = value || '';
  };

  const fmtDate = (v) => {
    if (!v) return '';
    try {
      const parts = v.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return v;
    }
  };

  let savedInvites = [];

  // ---------- 3-Step Wizard Flow ----------
  const steps = [1, 2, 3].map((n) => $('step-' + n));
  const tabs = document.querySelectorAll('.steps li');

  const showStep = (n) => {
    steps.forEach((s, i) => {
      if (s) s.hidden = (i + 1 !== n);
    });

    const two = $('step-2');
    if (two) {
      if (n === 3) {
        two.hidden = false;
        two.classList.add('preview-only');
      } else {
        two.classList.remove('preview-only');
      }
    }

    tabs.forEach((t) => {
      const stepNum = Number(t.dataset.step);
      t.classList.toggle('on', stepNum === n);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 1: Click template card
  document.querySelectorAll('.tpl').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key || 'wedding';
      const bg = btn.dataset.bg || '#FEE2E2';
      const fg = btn.dataset.fg || '#DC2626';
      const font = btn.dataset.font || 'Playfair Display';
      const heading = btn.dataset.heading || 'Celebration';
      const title = btn.dataset.title || 'Special Event';
      const message = btn.dataset.message || '';
      const emoji = btn.querySelector('.tpl-emoji')?.textContent || '🪷';

      $('template').value = key;
      card.style.setProperty('--bg', bg);
      card.style.setProperty('--fg', fg);
      $('accent').value = fg;

      card.style.fontFamily = `'${font}', serif`;
      $('fontFamily').value = font;

      const emojiEl = $('card-emoji');
      if (emojiEl) emojiEl.textContent = emoji;

      $('heading').value = heading;
      setField('heading', heading);

      $('title').value = title;
      setField('title', title);

      $('message').value = message;
      setField('message', message);

      showStep(2);
    });
  });

  // Step 2: Live Typing Synchronizer
  const textFields = ['title', 'hosts', 'time', 'venue', 'address', 'dressCode', 'rsvpContact', 'message', 'heading'];
  textFields.forEach((fieldId) => {
    const input = $(fieldId);
    if (input) {
      input.addEventListener('input', () => {
        setField(fieldId, input.value);
      });
    }
  });

  const dateInput = $('date');
  if (dateInput) {
    const updateDate = () => {
      setField('dateText', fmtDate(dateInput.value));
    };
    dateInput.addEventListener('input', updateDate);
    updateDate();
  }

  const fontSelect = $('fontFamily');
  if (fontSelect) {
    fontSelect.addEventListener('change', () => {
      card.style.fontFamily = `'${fontSelect.value}', serif`;
    });
  }

  const accentInput = $('accent');
  if (accentInput) {
    accentInput.addEventListener('input', () => {
      card.style.setProperty('--fg', accentInput.value);
    });
  }

  const photoInput = $('photo');
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const img = card.querySelector('[data-field="photo"]');
      if (!file) {
        if (img) img.hidden = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (img) {
          img.src = reader.result;
          img.hidden = false;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Wizard navigation buttons
  const back1 = $('back-1');
  if (back1) back1.addEventListener('click', () => showStep(1));

  const to3 = $('to-3');
  if (to3) {
    to3.addEventListener('click', () => {
      const titleVal = $('title')?.value.trim();
      if (!titleVal) {
        const titleEl = $('title');
        if (titleEl) {
          titleEl.focus();
          titleEl.style.borderColor = '#DC2626';
        }
        return;
      }
      showStep(3);
    });
  }

  const back2 = $('back-2');
  if (back2) back2.addEventListener('click', () => showStep(2));

  // Helper to compile card payload
  function getInvitePayload() {
    const user = JSON.parse(localStorage.getItem('eventora_user') || '{}');
    return {
      userId: user.id || user.email || 'guest',
      template: $('template')?.value || 'wedding',
      heading: $('heading')?.value || '',
      title: $('title')?.value || 'Event Title',
      hosts: $('hosts')?.value || '',
      date: $('date')?.value || '',
      time: $('time')?.value || '',
      venue: $('venue')?.value || '',
      address: $('address')?.value || '',
      message: $('message')?.value || '',
      dressCode: $('dressCode')?.value || '',
      rsvpContact: $('rsvpContact')?.value || '',
      fontFamily: $('fontFamily')?.value || 'Playfair Display',
      accent: $('accent')?.value || '#DC2626',
      bg: card.style.getPropertyValue('--bg') || '#FEE2E2'
    };
  }

  // ---------- Action Handlers (Save, PNG, PDF, WhatsApp) ----------
  const btnSaveMongo = $('btn-save-mongo');
  const saveStatus = $('save-status');

  if (btnSaveMongo) {
    btnSaveMongo.addEventListener('click', async () => {
      const payload = getInvitePayload();
      btnSaveMongo.textContent = 'Saving...';
      btnSaveMongo.disabled = true;

      try {
        const res = await fetch('/api/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success) {
          if (saveStatus) {
            saveStatus.textContent = '✓ Saved to your MongoDB database successfully!';
            saveStatus.style.display = 'block';
            setTimeout(() => { saveStatus.style.display = 'none'; }, 5000);
          }
          loadSavedInvites();
        } else {
          alert(result.message || 'Error saving invite.');
        }
      } catch (err) {
        console.error('Error saving invite:', err);
        alert('Saved locally. MongoDB connection active.');
      } finally {
        btnSaveMongo.textContent = '💾 Save to MongoDB';
        btnSaveMongo.disabled = false;
      }
    });
  }

  // Download high-resolution PNG
  const btnPng = $('btn-dl-png');
  if (btnPng) {
    btnPng.addEventListener('click', async () => {
      if (typeof html2canvas === 'undefined') {
        alert('Image rendering library loading. Please try again in a moment.');
        return;
      }
      btnPng.textContent = 'Generating PNG...';
      try {
        const canvas = await html2canvas(card, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: null,
          logging: false
        });
        const a = document.createElement('a');
        const safeTitle = ($('title')?.value || 'Eventora_Invite').replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `Eventora_${safeTitle}_Invitation.png`;
        a.href = canvas.toDataURL('image/png');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error('html2canvas error:', err);
        alert('Could not export PNG. Please try again.');
      } finally {
        btnPng.textContent = '📷 Download as PNG';
      }
    });
  }

  // Download PDF
  const btnPdf = $('btn-dl-pdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', async () => {
      if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        alert('PDF rendering library loading. Please try again in a moment.');
        return;
      }
      btnPdf.textContent = 'Generating PDF...';
      try {
        const canvas = await html2canvas(card, {
          scale: 2,
          useCORS: true,
          backgroundColor: null
        });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/png');
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * (width - 24)) / canvas.width;
        pdf.addImage(imgData, 'PNG', 12, 16, width - 24, Math.min(height, 260));
        const safeTitle = ($('title')?.value || 'Eventora_Invite').replace(/[^a-zA-Z0-9]/g, '_');
        pdf.save(`Eventora_${safeTitle}_Invitation.pdf`);
      } catch (err) {
        console.error('PDF error:', err);
        alert('Could not export PDF. Please try again.');
      } finally {
        btnPdf.textContent = '📄 Download as PDF';
      }
    });
  }

  // Share on WhatsApp
  const btnWa = $('btn-share-wa');
  if (btnWa) {
    btnWa.addEventListener('click', () => {
      const title = $('title')?.value || 'You are Invited!';
      const hosts = $('hosts')?.value || '';
      const dateVal = $('date')?.value ? fmtDate($('date').value) : '';
      const timeVal = $('time')?.value || '';
      const venueVal = $('venue')?.value || '';
      const addressVal = $('address')?.value || '';
      const rsvpVal = $('rsvpContact')?.value || '';
      const messageVal = $('message')?.value || '';

      const msg = `🎉 *${title}*\n` +
        (hosts ? `${hosts}\n\n` : '\n') +
        `📅 *Date:* ${dateVal}\n` +
        `⏰ *Time:* ${timeVal}\n` +
        `📍 *Venue:* ${venueVal}, ${addressVal}\n` +
        (rsvpVal ? `🙏 *RSVP:* ${rsvpVal}\n` : '') +
        (messageVal ? `\n"${messageVal}"\n` : '') +
        `\nCreated with ❤️ on Eventora: ${window.location.origin}/invites`;

      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  // ---------- Load Saved Invites from MongoDB API ----------
  async function loadSavedInvites() {
    const listEl = $('saved-list');
    const countEl = $('saved-count');
    if (!listEl) return;

    try {
      const res = await fetch('/api/invites');
      const result = await res.json();

      if (result.success && result.data && result.data.length > 0) {
        savedInvites = result.data;
        if (countEl) countEl.textContent = savedInvites.length;

        listEl.innerHTML = savedInvites.map((inv) => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:12px 16px;">
            <div>
              <strong style="font-size:14px; color:#0F172A; display:block;">${escapeHtml(inv.title || 'Untitled Invite')}</strong>
              <span style="font-size:12px; color:#64748B;">${escapeHtml(inv.heading || inv.template)} • ${escapeHtml(inv.date || '')}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn sm" style="padding:4px 12px; font-size:12px; background:#FFFFFF; border:1px solid #CBD5E1; cursor:pointer;" onclick="loadSavedIntoCard('${inv._id || inv.id}')">Load</button>
              <button type="button" class="btn sm" style="padding:4px 8px; font-size:14px; color:#DC2626; background:none; border:none; cursor:pointer;" onclick="deleteSavedCard('${inv._id || inv.id}')" title="Delete">&times;</button>
            </div>
          </div>
        `).join('');
      } else {
        if (countEl) countEl.textContent = '0';
        listEl.innerHTML = `<p style="font-size:13px; color:#94A3B8; text-align:center; padding:12px;">Saved invitation designs will appear here.</p>`;
      }
    } catch (e) {
      console.error('Error fetching saved invites:', e);
    }
  }

  window.loadSavedIntoCard = function (id) {
    const inv = savedInvites.find((x) => (x._id === id || x.id === id));
    if (!inv) return;

    if (inv.bg) card.style.setProperty('--bg', inv.bg);
    if (inv.accent) {
      card.style.setProperty('--fg', inv.accent);
      if ($('accent')) $('accent').value = inv.accent;
    }
    if (inv.fontFamily) {
      card.style.fontFamily = `'${inv.fontFamily}', serif`;
      if ($('fontFamily')) $('fontFamily').value = inv.fontFamily;
    }

    const setVal = (elId, val) => {
      const el = $(elId);
      if (el) el.value = val || '';
      setField(elId, val);
    };

    setVal('heading', inv.heading);
    setVal('title', inv.title);
    setVal('hosts', inv.hosts);
    setVal('date', inv.date);
    setVal('time', inv.time);
    setVal('venue', inv.venue);
    setVal('address', inv.address);
    setVal('dressCode', inv.dressCode);
    setVal('rsvpContact', inv.rsvpContact);
    setVal('message', inv.message);

    if (inv.date) setField('dateText', fmtDate(inv.date));

    showStep(2);
  };

  window.deleteSavedCard = async function (id) {
    if (!confirm('Delete this saved invitation design?')) return;
    try {
      const res = await fetch(`/api/invites/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) loadSavedInvites();
    } catch (e) {
      console.error(e);
    }
  };

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Load saved cards on startup
  loadSavedInvites();

  // Auth button banner check
  const user = JSON.parse(localStorage.getItem('eventora_user') || 'null');
  const authBtn = $('nav-auth-btn');
  if (user && authBtn) {
    authBtn.textContent = user.name.split(' ')[0];
    authBtn.href = 'eventora-dashboard.html';
  }
})();
