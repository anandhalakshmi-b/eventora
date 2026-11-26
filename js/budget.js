/* Budget Calculator & Tracker */
const KEY = 'eventora-budget';
const CATS = [
  'Ceremony Venue & Hall',
  'Traditional Catering & Sweets',
  'Decor & Fresh Flowers',
  'Bridal Makeup & Styling',
  'Candid Photography & Film',
  'Music, DJ & Sound',
  'Invitations & Gift Boxes',
  'Jewellery & Attire',
  'Ceremony Arrangements',
  'Guest Hospitality & Rooms',
  'Other'
];
const COL = ['#2563EB','#EA580C','#9333EA','#0891B2','#DB2777','#DC2626','#CA8A04','#16A34A','#D97706','#4F46E5','#64748B'];

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('eventora_user')); } catch (e) { return null; }
}

const ACTIVE_USER = getCurrentUser();
const USER_KEY = ACTIVE_USER && (ACTIVE_USER.email || ACTIVE_USER.id)
  ? String(ACTIVE_USER.email || ACTIVE_USER.id).toLowerCase().trim()
  : '';
const STORAGE_KEY = USER_KEY ? `${KEY}:${USER_KEY}` : KEY;

try { localStorage.removeItem('eventora-budget'); } catch (e) {}

let B = USER_KEY ? load(STORAGE_KEY, null) : null;
if (!B || typeof B !== 'object' || !Array.isArray(B.items)) {
  B = { total: Number(ACTIVE_USER && ACTIVE_USER.eventBudget) || 0, items: [] };
} else if ((!B.total || B.total === 0) && ACTIVE_USER && Number(ACTIVE_USER.eventBudget) > 0 && B.items.length === 0) {
  B.total = Number(ACTIVE_USER.eventBudget);
}

function applyBudgetHeroUser(u) {
  if (!u) return;
  const heroTitle = document.querySelector('.hero-content h1');
  const heroKicker = document.querySelector('.hero-kicker');
  const heroDesc = document.querySelector('.hero-content p:not(.hero-kicker)');
  if (heroTitle) {
    if (u.eventName) {
      heroTitle.textContent = `${u.eventName} Budget`;
    } else if (u.name) {
      const first = u.name.split(' ')[0];
      heroTitle.textContent = `${first}'s Event Budget Tracker`;
    }
  }
  if (heroKicker) {
    heroKicker.textContent = u.eventType
      ? `${u.eventType.toUpperCase()} BUDGET`
      : 'FINANCES & EVENT PLANNING';
  }
  if (heroDesc && u.eventDate) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(u.eventDate));
    const dateLabel = m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : u.eventDate;
    heroDesc.textContent = `Tracking expenses for ${u.eventName || u.eventType || 'your event'} on ${dateLabel}.`;
  }
}

if (ACTIVE_USER) {
  applyBudgetHeroUser(ACTIVE_USER);
}

let editing = null;
$('cats').innerHTML = CATS.map((c) => `<option value="${c}">`).join('');

function group(key) {
  const m = {};
  B.items.forEach((i) => (m[i.cat] = (m[i.cat] || 0) + (+i[key] || 0)));
  return m;
}
const colourFor = (c) => COL[CATS.includes(c) ? CATS.indexOf(c) : CATS.length - 1];

let syncTimer = null;
function syncBudgetToServer() {
  if (!USER_KEY) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fetch('/api/budget', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: Number(B.total) || 0, items: B.items || [] })
    }).catch(() => {});
  }, 150);
}

function draw(shouldSync = true) {
  const est = B.items.reduce((s, i) => s + (+i.est || 0), 0);
  const act = B.items.reduce((s, i) => s + (+i.act || 0), 0);
  const left = B.total - act;
  const rawPct = B.total ? Math.round((act / B.total) * 100) : 0;
  const pct = B.total ? Math.min(100, (act / B.total) * 100) : 0;
  $('total').value = B.total || '';

  if ($('pctLabel')) {
    $('pctLabel').textContent = `${rawPct}% spent`;
  }

  /* summary + warnings */
  $('sum').innerHTML =
    `<div class="stat"><b>${rupee(B.total)}</b><span>Estimated budget</span></div>
     <div class="stat warn"><b>${rupee(est)}</b><span>Planned expenses</span></div>
     <div class="stat"><b>${rupee(act)}</b><span>Spent so far</span></div>
     <div class="stat ${left < 0 ? 'bad' : 'good'}"><b>${rupee(Math.abs(left))}</b><span>${left < 0 ? 'Over budget' : 'Remaining'}</span></div>`;
  $('warn').innerHTML = left < 0
    ? `<div class="banner bad" role="alert">You are over budget by ${rupee(-left)}. Review your spending.</div>`
    : est > B.total && B.total
    ? `<div class="banner warn">Your planned expenses are ${rupee(est - B.total)} above your estimated budget.</div>`
    : pct >= 90
    ? '<div class="banner warn">You have used over 90% of your budget.</div>'
    : B.items.length
    ? '<div class="banner ok">You are within budget.</div>'
    : '';
  $('fill').style.width = pct + '%';
  $('bar').classList.toggle('over', left < 0);

  /* table */
  $('rows').innerHTML =
    B.items
      .map((i) => {
        const d = (+i.act || 0) - (+i.est || 0);
        return `<tr><td><b>${esc(i.cat)}</b></td><td>${rupee(i.est)}</td><td>${rupee(i.act)}</td>
      <td style="color:${d > 0 ? '#DC2626' : '#16A34A'};font-weight:700">${i.act ? (d > 0 ? '+' : '') + rupee(d).replace('₹-', '-₹') : '-'}</td>
      <td><button class="btn alt" data-edit="${i.id}">Edit</button><button class="btn alt" data-del="${i.id}">Delete</button></td></tr>`;
      })
      .join('') || '<tr><td colspan="5" class="empty">No expenses yet. Add your first expense or load a template.</td></tr>';

  /* pie chart (CSS conic gradient) */
  const g = group('est');
  const keys = Object.keys(g);
  const tot = est || 1;
  let from = 0;
  $('pie').style.background = keys.length
    ? 'conic-gradient(' +
      keys
        .map((k) => {
          const to = from + (g[k] / tot) * 100;
          const s = `${colourFor(k)} ${from}% ${to}%`;
          from = to;
          return s;
        })
        .join(',') +
      ')'
    : '#E5E7EB';
  $('legend').innerHTML = keys
    .map((k) => `<li><i style="background:${colourFor(k)}"></i>${esc(k)}<span>${Math.round((g[k] / tot) * 100)}%</span></li>`)
    .join('');

  /* bar chart: estimated vs actual */
  const ga = group('act');
  const max = Math.max(1, ...keys.map((k) => Math.max(g[k], ga[k] || 0)));
  $('bars').innerHTML =
    keys
      .map(
        (k) => `<div><b>${esc(k)}</b>
    <em><i class="est" style="width:${(g[k] / max) * 70}%"></i>${rupee(g[k])}</em>
    <em><i class="act" style="width:${((ga[k] || 0) / max) * 70}%"></i>${rupee(ga[k] || 0)}</em></div>`
      )
      .join('') +
    (keys.length
      ? '<p style="font-size:.8rem;margin:0"><span style="color:#FCA5A5">&#9632;</span> Estimated &nbsp; <span style="color:#DC2626">&#9632;</span> Actual</p>'
      : '<p class="empty">Add expenses to see the chart.</p>');
  if (USER_KEY) save(STORAGE_KEY, B);
  if (shouldSync) syncBudgetToServer();
}

/* add / edit */
function resetForm() {
  editing = null;
  $('f').reset();
  $('ftitle').textContent = 'Add an expense';
  $('fbtn').textContent = 'Add expense';
  $('fcancel').hidden = true;
  $('ferr').textContent = '';
}

$('f').onsubmit = (e) => {
  e.preventDefault();
  const cat = $('cat').value.trim();
  const est = $('est').value;
  const act = $('act').value || 0;
  if (!cat) return ($('ferr').textContent = 'Please enter a category.');
  if (est === '' || +est < 0 || +act < 0) return ($('ferr').textContent = 'Enter an estimated amount of 0 or more.');
  if (editing) Object.assign(B.items.find((i) => i.id === editing), { cat, est: +est, act: +act });
  else B.items.push({ id: uid(), cat, est: +est, act: +act });
  resetForm();
  draw(true);
};

$('fcancel').onclick = resetForm;
$('setTotal').onclick = () => {
  B.total = Math.max(0, +$('total').value || 0);
  try {
    if (ACTIVE_USER) {
      ACTIVE_USER.eventBudget = B.total;
      localStorage.setItem('eventora_user', JSON.stringify(ACTIVE_USER));
    }
  } catch (e) {}
  draw(true);
};

$('rows').onclick = (e) => {
  const ed = e.target.dataset.edit;
  const del = e.target.dataset.del;
  if (ed) {
    const i = B.items.find((x) => x.id === ed);
    editing = ed;
    $('cat').value = i.cat;
    $('est').value = i.est;
    $('act').value = i.act;
    $('ftitle').textContent = 'Edit expense';
    $('fbtn').textContent = 'Save changes';
    $('fcancel').hidden = false;
    $('cat').focus();
  }
  if (del && confirm('Delete this expense?')) {
    B.items = B.items.filter((x) => x.id !== del);
    if (editing === del) resetForm();
    draw(true);
  }
};

$('reset').onclick = () => {
  if (confirm('Remove all expenses?')) {
    B.items = [];
    resetForm();
    draw(true);
  }
};

/* export */
$('csv').onclick = () => {
  const lines = [['Category', 'Estimated', 'Actual', 'Difference'].map(csvCell).join(',')]
    .concat(B.items.map((i) => [i.cat, i.est, i.act, i.act - i.est].map(csvCell).join(',')))
    .concat([['Estimated budget', B.total].map(csvCell).join(',')]);
  downloadFile('eventora-budget.csv', lines.join('\n'));
};

draw(false);

Promise.all([
  fetch('/api/budget', { credentials: 'same-origin', cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
])
  .then(([res, meRes]) => {
    if (meRes && meRes.authenticated && meRes.user) {
      localStorage.setItem('eventora_user', JSON.stringify(meRes.user));
      applyBudgetHeroUser(meRes.user);
    }
    if (res && res.success && res.data) {
      const serverItems = Array.isArray(res.data.items) ? res.data.items : [];
      const serverTotal = res.data.total !== undefined ? (Number(res.data.total) || 0) : (Number(res.eventBudget) || 0);
      B = { total: serverTotal, items: serverItems };
      draw(false);
    }
  })
  .catch(() => {});
