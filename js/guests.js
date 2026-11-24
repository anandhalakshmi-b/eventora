/* Guests & RSVPs – front end only, saved in this browser (localStorage).
   Swap load/save for API calls when the backend is ready. */
const GK = 'eventora-guests', EK = 'eventora-event';
const STATUSES = ['Pending', 'Accepted', 'Declined'];
let G = load(GK, null) || [
  { id: uid(), name: 'Ravi Kumar', email: 'ravi@example.com', phone: '9000000011', group: 'Family', diet: 'Vegetarian', plus: 2, status: 'Accepted' },
  { id: uid(), name: 'Anita Sharma', email: 'anita@example.com', phone: '9000000012', group: 'Family', diet: '', plus: 1, status: 'Pending' },
  { id: uid(), name: 'Karthik S', email: 'karthik@example.com', phone: '9000000013', group: 'Friends', diet: 'Nut allergy', plus: 0, status: 'Accepted' },
  { id: uid(), name: 'Divya Menon', email: 'divya@example.com', phone: '9000000014', group: 'Friends', diet: 'Vegan', plus: 1, status: 'Declined' },
  { id: uid(), name: 'Mr. Iyer', email: 'iyer@example.com', phone: '9000000015', group: 'Colleagues', diet: '', plus: 0, status: 'Pending' }
];
let EV = load(EK, { name: "Aarav & Meera's Wedding", date: '' });
let fStatus = 'All', editing = null;

$('ename').value = EV.name; $('edate').value = EV.date;
$('ename').oninput = $('edate').oninput = () => { EV = { name: $('ename').value, date: $('edate').value }; save(EK, EV); };

const rsvpLink = () => new URL('rsvp.html', location.href).href;
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(rsvpLink()); $('copied').textContent = 'RSVP link copied. Share it with your guests.'; }
  catch (e) { $('copied').textContent = 'Copy this link: ' + rsvpLink(); }
};

function draw() {
  const count = s => G.filter(g => g.status === s).length;
  const heads = G.filter(g => g.status === 'Accepted').reduce((s, g) => s + 1 + g.plus, 0);
  $('sum').innerHTML =
    `<div class="stat"><b>${G.length}</b><span>Guests invited</span></div>
     <div class="stat good"><b>${count('Accepted')}</b><span>Accepted</span></div>
     <div class="stat bad"><b>${count('Declined')}</b><span>Declined</span></div>
     <div class="stat warn"><b>${count('Pending')}</b><span>Pending</span></div>
     <div class="stat"><b>${heads}</b><span>Expected headcount</span></div>
     <div class="stat"><b>${G.filter(g => g.diet).length}</b><span>Dietary notes</span></div>`;

  const groups = [...new Set(G.map(g => g.group).filter(Boolean))].sort(), cur = $('grp').value;
  $('grp').innerHTML = '<option value="">All groups</option>' + groups.map(x => `<option${x === cur ? ' selected' : ''}>${esc(x)}</option>`).join('');
  $('chips').innerHTML = ['All', ...STATUSES].map(s =>
    `<button class="chip" data-chip="${s}" aria-pressed="${fStatus === s}">${s}${s === 'All' ? ` (${G.length})` : ` (${count(s)})`}</button>`).join('');

  const q = $('q').value.trim().toLowerCase(), grp = $('grp').value;
  const list = G.filter(g => (fStatus === 'All' || g.status === fStatus) && (!grp || g.group === grp) &&
    (!q || (g.name + g.email + g.phone).toLowerCase().includes(q)));
  $('rows').innerHTML = list.map(g => `<tr>
    <td><b>${esc(g.name)}</b></td>
    <td>${esc(g.email)}<br><small>${esc(g.phone)}</small></td>
    <td>${esc(g.group) || '-'}</td><td>${g.plus}</td><td>${esc(g.diet) || '-'}</td>
    <td><select data-st="${g.id}" class="pill p-${g.status}" aria-label="RSVP for ${esc(g.name)}" style="width:auto">${STATUSES.map(s => `<option${s === g.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
    <td><button class="btn alt" data-edit="${g.id}">Edit</button><button class="btn alt" data-del="${g.id}">Delete</button></td></tr>`).join('')
    || `<tr><td colspan="7" class="empty">${G.length ? 'No guests match these filters.' : 'No guests yet. Add your first guest or import a CSV.'}</td></tr>`;
  save(GK, G);
}

/* add / edit dialog */
function openForm(g) {
  editing = g ? g.id : null; $('gerr').textContent = '';
  $('dt').textContent = g ? 'Edit guest' : 'Add guest';
  $('gn').value = g?.name || ''; $('ge').value = g?.email || ''; $('gp').value = g?.phone || '';
  $('gg').value = g?.group || ''; $('gpl').value = g?.plus ?? 0; $('gd').value = g?.diet || ''; $('gs').value = g?.status || 'Pending';
  $('dlg').showModal(); $('gn').focus();
}
$('add').onclick = () => openForm(null);
$('gx').onclick = () => $('dlg').close();
$('gf').onsubmit = e => {
  e.preventDefault();
  const name = $('gn').value.trim(), email = $('ge').value.trim();
  if (!name) return $('gerr').textContent = 'Please enter the guest name.';
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return $('gerr').textContent = 'Enter a valid email address.';
  const data = { name, email, phone: $('gp').value.trim(), group: $('gg').value.trim(), diet: $('gd').value.trim(),
    plus: Math.max(0, +$('gpl').value || 0), status: $('gs').value };
  if (editing) Object.assign(G.find(g => g.id === editing), data); else G.push({ id: uid(), ...data });
  $('dlg').close(); draw();
};

/* table + filter events */
$('rows').onclick = e => {
  const ed = e.target.dataset.edit, del = e.target.dataset.del;
  if (ed) openForm(G.find(g => g.id === ed));
  if (del && confirm('Remove this guest?')) { G = G.filter(g => g.id !== del); draw(); }
};
$('rows').onchange = e => { const id = e.target.dataset.st; if (id) { G.find(g => g.id === id).status = e.target.value; draw(); } };
$('chips').onclick = e => { if (e.target.dataset.chip) { fStatus = e.target.dataset.chip; draw(); } };
$('q').oninput = $('grp').onchange = draw;

/* CSV import / export */
$('imp').onclick = () => $('file').click();
$('file').onchange = async () => {
  const f = $('file').files[0]; if (!f) return;
  const rows = parseCSV(await f.text()), head = rows.shift().map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''));
  const col = n => head.indexOf(n); let n = 0;
  rows.forEach(r => {
    const get = k => (col(k) >= 0 ? (r[col(k)] || '').trim() : '');
    if (!get('name')) return;
    const st = STATUSES.find(s => s.toLowerCase() === get('status').toLowerCase()) || 'Pending';
    G.push({ id: uid(), name: get('name'), email: get('email'), phone: get('phone'), group: get('group'), diet: get('dietary'), plus: Math.max(0, parseInt(get('plusones')) || 0), status: st }); n++;
  });
  $('msg').textContent = n ? `Imported ${n} guest${n > 1 ? 's' : ''}.` : 'No guests found. Check that the file has a "name" column.';
  $('file').value = ''; draw();
};
$('exp').onclick = () => downloadFile('eventora-guests.csv',
  [['name','email','phone','group','dietary','plusones','status'].join(',')]
    .concat(G.map(g => [g.name, g.email, g.phone, g.group, g.diet, g.plus, g.status].map(csvCell).join(','))).join('\n'));
draw();
