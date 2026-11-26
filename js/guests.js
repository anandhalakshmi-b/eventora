/* Guests & RSVPs – synced with /api/guests (MongoDB + local fallback) */
const GK = 'eventora-guests-v2';
const EK = 'eventora-event-v2';
const STATUSES = ['Pending', 'Accepted', 'Declined'];

let G = [];
let EV = load(EK, { name: "Aarav & Meera's Wedding", date: '2027-02-18', whatsapp: '' });
let fStatus = 'All';
let editing = null;

$('ename').value = EV.name || '';
$('edate').value = EV.date || '';
if ($('ewa')) $('ewa').value = EV.whatsapp || '';

function cleanWaDigits(num) {
  const digits = String(num || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? '91' + digits : digits;
}

function getOwnerEmail() {
  try {
    const u = JSON.parse(localStorage.getItem('eventora_user'));
    return (u && u.email) ? String(u.email).toLowerCase().trim() : '';
  } catch (e) {
    return '';
  }
}

const rsvpLink = () => {
  const owner = getOwnerEmail();
  const waDigits = cleanWaDigits($('ewa') ? $('ewa').value : EV.whatsapp);
  const base = window.location.protocol === 'file:' ? new URL('rsvp.html', location.href).href : `${location.origin}/rsvp`;
  const qs = new URLSearchParams();
  if (owner) qs.set('owner', owner);
  if (waDigits) qs.set('wa', waDigits);
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
};

function buildWhatsAppUrl(phone, guestName) {
  const link = rsvpLink();
  const eventTitle = ($('ename').value || EV.name || 'our celebration').trim();
  const datePart = ($('edate').value || EV.date) ? ` on ${$('edate').value || EV.date}` : '';
  const greeting = guestName ? `Hello ${guestName}, ` : 'Hello! ';
  const text = `${greeting}you are warmly invited to ${eventTitle}${datePart}. Please confirm your RSVP here: ${link}`;
  const digits = cleanWaDigits(phone);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function syncWhatsAppButton() {
  const waBtn = $('shareWa');
  if (waBtn) waBtn.href = buildWhatsAppUrl('', '');
  const openBtn = $('open');
  if (openBtn) openBtn.href = rsvpLink();
}

let evTimer = null;
const onEventChange = () => {
  EV = {
    name: $('ename').value,
    date: $('edate').value,
    whatsapp: $('ewa') ? $('ewa').value : (EV.whatsapp || '')
  };
  save(EK, EV);
  syncWhatsAppButton();
  clearTimeout(evTimer);
  evTimer = setTimeout(() => {
    fetch('/api/guests/event', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(EV)
    }).catch(() => {});
  }, 400);
};
$('ename').oninput = $('edate').oninput = onEventChange;
if ($('ewa')) $('ewa').oninput = onEventChange;

syncWhatsAppButton();

$('copy').onclick = async () => {
  const link = rsvpLink();
  try {
    await navigator.clipboard.writeText(link);
    $('copied').textContent = 'RSVP link copied. Share it directly on WhatsApp.';
  } catch (e) {
    $('copied').textContent = 'Copy this link: ' + link;
  }
};

const openBtn = $('open');
if (openBtn) {
  openBtn.addEventListener('click', () => {
    openBtn.href = rsvpLink();
  });
}

function draw() {
  const count = (s) => G.filter((g) => g.status === s).length;
  const heads = G.filter((g) => g.status === 'Accepted').reduce((s, g) => s + 1 + (Number(g.plus) || 0), 0);
  $('sum').innerHTML =
    `<div class="stat"><b>${G.length}</b><span>Guests Invited</span></div>
     <div class="stat good"><b>${count('Accepted')}</b><span>Confirmed</span></div>
     <div class="stat bad"><b>${count('Declined')}</b><span>Regrets</span></div>
     <div class="stat warn"><b>${count('Pending')}</b><span>Pending Reply</span></div>
     <div class="stat"><b>${heads}</b><span>Expected Headcount</span></div>
     <div class="stat"><b>${G.filter((g) => g.diet).length}</b><span>Dietary Notes</span></div>`;

  const groups = [...new Set(G.map((g) => g.group).filter(Boolean))].sort();
  const cur = $('grp').value;
  $('grp').innerHTML =
    '<option value="">All groups</option>' +
    groups.map((x) => `<option${x === cur ? ' selected' : ''}>${esc(x)}</option>`).join('');
  $('chips').innerHTML = ['All', ...STATUSES]
    .map(
      (s) =>
        `<button class="chip" data-chip="${s}" aria-pressed="${fStatus === s}">${s}${s === 'All' ? ` (${G.length})` : ` (${count(s)})`}</button>`
    )
    .join('');

  const q = $('q').value.trim().toLowerCase();
  const grp = $('grp').value;
  const list = G.filter(
    (g) =>
      (fStatus === 'All' || g.status === fStatus) &&
      (!grp || g.group === grp) &&
      (!q || (g.name + ' ' + g.email + ' ' + g.phone).toLowerCase().includes(q))
  );

  $('rows').innerHTML =
    list
      .map(
        (g) => `<tr>
    <td><b>${esc(g.name)}</b></td>
    <td>${esc(g.email)}<br><small>${esc(g.phone)}</small></td>
    <td>${esc(g.group) || '-'}</td><td>${Number(g.plus) || 0}</td><td>${esc(g.diet) || '-'}</td>
    <td><select data-st="${g.id}" class="pill p-${g.status}" aria-label="RSVP for ${esc(g.name)}" style="width:auto">${STATUSES.map(
          (s) => `<option${s === g.status ? ' selected' : ''}>${s}</option>`
        ).join('')}</select></td>
    <td><a class="btn main" href="${buildWhatsAppUrl(g.phone, g.name)}" target="_blank" rel="noopener">WhatsApp</a><button class="btn alt" data-edit="${g.id}">Edit</button><button class="btn alt" data-del="${g.id}">Delete</button></td></tr>`
      )
      .join('') ||
    `<tr><td colspan="7" class="empty">${
      G.length ? 'No guests match these filters.' : 'No guests yet. Add your first guest or import a CSV.'
    }</td></tr>`;
  save(GK, G);
}

async function loadGuestsFromServer() {
  try {
    const res = await fetch('/api/guests', { credentials: 'same-origin' });
    if (res.status === 401) {
      window.location.href = '/register?mode=login&redirect=' + encodeURIComponent('/guests');
      return;
    }
    const result = await res.json();
    if (result && result.success) {
      G = Array.isArray(result.data) ? result.data : [];
      if (result.event) {
        EV = { name: result.event.name || EV.name, date: result.event.date || EV.date };
        $('ename').value = EV.name;
        $('edate').value = EV.date;
        save(EK, EV);
      }
      draw();
      return;
    }
  } catch (e) {}

  G = load(GK, []);
  draw();
}

/* add / edit dialog */
function openForm(g) {
  editing = g ? g.id : null;
  $('gerr').textContent = '';
  $('dt').textContent = g ? 'Edit guest' : 'Add guest';
  $('gn').value = g?.name || '';
  $('ge').value = g?.email || '';
  $('gp').value = g?.phone || '';
  $('gg').value = g?.group || '';
  $('gpl').value = g?.plus ?? 0;
  $('gd').value = g?.diet || '';
  $('gs').value = g?.status || 'Pending';
  $('dlg').showModal();
  $('gn').focus();
}

$('add').onclick = () => openForm();
$('gx').onclick = () => $('dlg').close();

$('gf').onsubmit = async (e) => {
  e.preventDefault();
  const name = $('gn').value.trim();
  if (!name) return ($('gerr').textContent = 'Please enter a name.');

  const payload = {
    name,
    email: $('ge').value.trim(),
    phone: $('gp').value.trim(),
    group: $('gg').value.trim(),
    plus: Math.max(0, +$('gpl').value || 0),
    diet: $('gd').value.trim(),
    status: $('gs').value,
    eventName: $('ename').value.trim(),
    eventDate: $('edate').value.trim()
  };

  try {
    if (editing) {
      const res = await fetch('/api/guests/' + encodeURIComponent(editing), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result && result.success && result.data) {
        const idx = G.findIndex((g) => g.id === editing);
        if (idx >= 0) G[idx] = result.data;
      } else {
        const idx = G.findIndex((g) => g.id === editing);
        if (idx >= 0) Object.assign(G[idx], payload);
      }
    } else {
      const res = await fetch('/api/guests', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result && result.success && result.data) {
        G.push(result.data);
      } else {
        G.push({ id: uid(), ...payload });
      }
    }
  } catch (err) {
    if (editing) {
      const idx = G.findIndex((g) => g.id === editing);
      if (idx >= 0) Object.assign(G[idx], payload);
    } else {
      G.push({ id: uid(), ...payload });
    }
  }

  $('dlg').close();
  draw();
};

$('rows').onclick = async (e) => {
  const ed = e.target.dataset.edit;
  const del = e.target.dataset.del;
  if (ed) openForm(G.find((g) => g.id === ed));
  if (del && confirm('Delete this guest?')) {
    try {
      await fetch('/api/guests/' + encodeURIComponent(del), {
        method: 'DELETE',
        credentials: 'same-origin'
      });
    } catch (err) {}
    G = G.filter((g) => g.id !== del);
    draw();
  }
};

$('rows').onchange = async (e) => {
  const id = e.target.dataset.st;
  if (!id) return;
  const newStatus = e.target.value;
  const target = G.find((g) => g.id === id);
  if (target) target.status = newStatus;
  try {
    await fetch('/api/guests/' + encodeURIComponent(id), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  } catch (err) {}
  draw();
};

$('chips').onclick = (e) => {
  const c = e.target.dataset.chip;
  if (c) {
    fStatus = c;
    draw();
  }
};
$('q').oninput = $('grp').onchange = draw;

/* CSV */
$('exp').onclick = () => {
  const lines = [['Name', 'Email', 'Phone', 'Group', 'Dietary', 'PlusOnes', 'Status'].map(csvCell).join(',')].concat(
    G.map((g) => [g.name, g.email, g.phone, g.group, g.diet, g.plus, g.status].map(csvCell).join(','))
  );
  downloadFile('eventora-guests.csv', lines.join('\n'));
};

$('imp').onclick = () => $('file').click();
$('file').onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = async (ev) => {
    try {
      const rows = parseCSV(ev.target.result);
      if (!rows.length) throw new Error('File is empty.');
      const start = rows[0][0].toLowerCase().includes('name') ? 1 : 0;
      const toImport = [];
      for (let i = start; i < rows.length; i++) {
        const [name, email = '', phone = '', group = '', diet = '', plus = '0', status = 'Pending'] = rows[i];
        if (name) {
          toImport.push({
            name,
            email,
            phone,
            group,
            diet,
            plus: Math.max(0, +plus || 0),
            status: STATUSES.includes(status) ? status : 'Pending'
          });
        }
      }

      if (toImport.length) {
        const res = await fetch('/api/guests/import', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guests: toImport,
            eventName: $('ename').value.trim(),
            eventDate: $('edate').value.trim()
          })
        });
        const result = await res.json();
        if (result && result.success && Array.isArray(result.data)) {
          G.push(...result.data);
        } else {
          toImport.forEach((item) => G.push({ id: uid(), ...item }));
        }
      }

      $('msg').textContent = `Imported ${toImport.length} guest(s).`;
      draw();
    } catch (err) {
      $('msg').textContent = 'Could not read CSV: ' + err.message;
      $('msg').style.color = '#DC2626';
    }
  };
  r.readAsText(f);
};

loadGuestsFromServer();
