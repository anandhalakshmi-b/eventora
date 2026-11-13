/* Budget Calculator & Tracker – front end only, saved in this browser (localStorage).
   Swap load/save for API calls when the backend is ready. */
const KEY = 'eventora-budget';
const CATS = ['Venue','Catering','Decor','Photography','Makeup','Music & DJ','Invites','Travel','Other'];
const COL = ['#2563EB','#EA580C','#9333EA','#0891B2','#DB2777','#DC2626','#CA8A04','#16A34A','#64748B'];

let B = load(KEY, null) || { total: 500000, items: [
  { id: uid(), cat: 'Venue', est: 150000, act: 140000 },
  { id: uid(), cat: 'Catering', est: 120000, act: 135000 },
  { id: uid(), cat: 'Decor', est: 60000, act: 0 },
  { id: uid(), cat: 'Photography', est: 50000, act: 45000 },
  { id: uid(), cat: 'Music & DJ', est: 30000, act: 0 },
  { id: uid(), cat: 'Invites', est: 10000, act: 8000 }
]};
let editing = null;
$('cats').innerHTML = CATS.map(c => `<option value="${c}">`).join('');

function group(key) {
  const m = {};
  B.items.forEach(i => m[i.cat] = (m[i.cat] || 0) + (+i[key] || 0));
  return m;
}
const colourFor = c => COL[(CATS.includes(c) ? CATS.indexOf(c) : CATS.length - 1)];

function draw() {
  const est = B.items.reduce((s, i) => s + i.est, 0), act = B.items.reduce((s, i) => s + i.act, 0);
  const left = B.total - act, pct = B.total ? Math.min(100, act / B.total * 100) : 0;
  $('total').value = B.total || '';

  /* summary + warnings */
  $('sum').innerHTML =
    `<div class="stat"><b>${rupee(B.total)}</b><span>Total budget</span></div>
     <div class="stat warn"><b>${rupee(est)}</b><span>Estimated</span></div>
     <div class="stat"><b>${rupee(act)}</b><span>Spent so far</span></div>
     <div class="stat ${left < 0 ? 'bad' : 'good'}"><b>${rupee(Math.abs(left))}</b><span>${left < 0 ? 'Over budget' : 'Remaining'}</span></div>`;
  $('warn').innerHTML = left < 0 ? `<div class="banner bad" role="alert">⚠ You are over budget by ${rupee(-left)}. Review your spending.</div>`
    : est > B.total && B.total ? `<div class="banner warn">Your estimates are ${rupee(est - B.total)} above your total budget.</div>`
    : pct >= 90 ? '<div class="banner warn">You have used over 90% of your budget.</div>'
    : B.items.length ? '<div class="banner ok">You are within budget. Keep going!</div>' : '';
  $('fill').style.width = pct + '%'; $('bar').classList.toggle('over', left < 0);

  /* table */
  $('rows').innerHTML = B.items.map(i => {
    const d = i.act - i.est;
    return `<tr><td><b>${esc(i.cat)}</b></td><td>${rupee(i.est)}</td><td>${rupee(i.act)}</td>
      <td style="color:${d > 0 ? '#DC2626' : '#16A34A'};font-weight:700">${i.act ? (d > 0 ? '+' : '') + rupee(d).replace('₹-', '-₹') : '-'}</td>
      <td><button class="btn alt" data-edit="${i.id}">Edit</button><button class="btn alt" data-del="${i.id}">Delete</button></td></tr>`;
  }).join('') || '<tr><td colspan="5" class="empty">No expenses yet. Add your first one above.</td></tr>';

  /* pie chart (CSS conic gradient) */
  const g = group('est'), keys = Object.keys(g), tot = est || 1; let from = 0;
  $('pie').style.background = keys.length ? 'conic-gradient(' + keys.map(k => {
    const to = from + g[k] / tot * 100, s = `${colourFor(k)} ${from}% ${to}%`; from = to; return s;
  }).join(',') + ')' : '#E5E7EB';
  $('legend').innerHTML = keys.map(k => `<li><i style="background:${colourFor(k)}"></i>${esc(k)}<span>${Math.round(g[k] / tot * 100)}%</span></li>`).join('');

  /* bar chart: estimated vs actual */
  const ga = group('act'), max = Math.max(1, ...keys.map(k => Math.max(g[k], ga[k] || 0)));
  $('bars').innerHTML = keys.map(k => `<div><b>${esc(k)}</b>
    <em><i class="est" style="width:${g[k] / max * 70}%"></i>${rupee(g[k])}</em>
    <em><i class="act" style="width:${(ga[k] || 0) / max * 70}%"></i>${rupee(ga[k] || 0)}</em></div>`).join('')
    + (keys.length ? '<p style="font-size:.8rem;margin:0"><span style="color:#FCA5A5">■</span> Estimated &nbsp; <span style="color:#DC2626">■</span> Actual</p>' : '<p class="empty">Add expenses to see the chart.</p>');
  save(KEY, B);
}

/* add / edit */
function resetForm() { editing = null; $('f').reset(); $('ftitle').textContent = 'Add an expense'; $('fbtn').textContent = 'Add expense'; $('fcancel').hidden = true; $('ferr').textContent = ''; }
$('f').onsubmit = e => {
  e.preventDefault();
  const cat = $('cat').value.trim(), est = $('est').value, act = $('act').value || 0;
  if (!cat) return $('ferr').textContent = 'Please enter a category.';
  if (est === '' || +est < 0 || +act < 0) return $('ferr').textContent = 'Enter an estimated amount of 0 or more.';
  if (editing) Object.assign(B.items.find(i => i.id === editing), { cat, est: +est, act: +act });
  else B.items.push({ id: uid(), cat, est: +est, act: +act });
  resetForm(); draw();
};
$('fcancel').onclick = resetForm;
$('setTotal').onclick = () => { B.total = Math.max(0, +$('total').value || 0); draw(); };

$('rows').onclick = e => {
  const ed = e.target.dataset.edit, del = e.target.dataset.del;
  if (ed) { const i = B.items.find(x => x.id === ed); editing = ed;
    $('cat').value = i.cat; $('est').value = i.est; $('act').value = i.act;
    $('ftitle').textContent = 'Edit expense'; $('fbtn').textContent = 'Save changes'; $('fcancel').hidden = false; $('cat').focus(); }
  if (del && confirm('Delete this expense?')) { B.items = B.items.filter(x => x.id !== del); if (editing === del) resetForm(); draw(); }
};
$('reset').onclick = () => { if (confirm('Remove all expenses?')) { B.items = []; resetForm(); draw(); } };

/* export */
$('csv').onclick = () => {
  const lines = [['Category','Estimated','Actual','Difference'].map(csvCell).join(',')]
    .concat(B.items.map(i => [i.cat, i.est, i.act, i.act - i.est].map(csvCell).join(',')))
    .concat([['Total budget', B.total].map(csvCell).join(',')]);
  downloadFile('eventora-budget.csv', lines.join('\n'));
};
draw();
