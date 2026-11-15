/* Guests & RSVPs – front end only, saved in this browser (localStorage).
   Swap load/save for API calls when the backend is ready. */
const GK = 'eventora-guests-v2', EK = 'eventora-event-v2';
const STATUSES = ['Pending', 'Accepted', 'Declined'];
let G = load(GK, null) || [
  { id: uid(), name: 'Suresh & Malini Sharma', email: 'sharma.family@example.com', phone: '98401 23456', group: "Ladkiwale (Bride's Family)", diet: 'Pure Veg / Jain', plus: 3, status: 'Accepted' },
  { id: uid(), name: 'Col. Rajesh Verma', email: 'r.verma@example.com', phone: '98402 34567', group: "Ladkewale (Groom's Side)", diet: 'North Indian Feast', plus: 2, status: 'Accepted' },
  { id: uid(), name: 'Karthik Subramanian', email: 'karthik.subbu@example.com', phone: '98403 45678', group: 'Friends & Cousins', diet: 'South Indian Sadya', plus: 1, status: 'Accepted' },
  { id: uid(), name: 'Dr. Meenakshi & Family', email: 'meenakshi.dr@example.com', phone: '98404 56789', group: 'VIP Elders', diet: 'Traditional Pure Veg', plus: 2, status: 'Pending' },
  { id: uid(), name: 'Anand & Pooja Kapoor', email: 'kapoor.anand@example.com', phone: '98405 67890', group: 'Friends & Cousins', diet: 'Non-Veg Special', plus: 0, status: 'Pending' }
];
let EV = load(EK, { name: "Aarav & Meera's Grand Shaadi", date: '2027-02-18' });
let fStatus = 'All', editing = null;

$('ename').value = EV.name; $('edate').value = EV.date;
$('ename').oninput = $('edate').oninput = () => { EV = { name: $('ename').value, date: $('edate').value }; save(EK, EV); };

const rsvpLink = () => new URL('rsvp.html', location.href).href;
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(rsvpLink()); $('copied').textContent = 'RSVP link copied. Share it with your guests on WhatsApp.'; }
  catch (e) { $('copied').textContent = 'Copy this link: ' + rsvpLink(); }
};

function draw() {
  const count = s => G.filter(g => g.status === s).length;
  const heads = G.filter(g => g.status === 'Accepted').reduce((s, g) => s + 1 + g.plus, 0);
  $('sum').innerHTML =
    `<div class="stat"><b>${G.length}</b><span>Atithi Invited</span></div>
     <div class="stat good"><b>${count('Accepted')}</b><span>Confirmed</span></div>
     <div class="stat bad"><b>${count('Declined')}</b><span>Regrets</span></div>
     <div class="stat warn"><b>${count('Pending')}</b><span>Pending Reply</span></div>
     <div class="stat"><b>${heads}</b><span>Expected Headcount</span></div>
     <div class="stat"><b>${G.filter(g => g.diet).length}</b><span>Dietary Notes</span></div>`;

  const groups = [...new Set(G.map(g => g.group).filter(Boolean))].sort(), cur = $('grp').value;
  $('grp').innerHTML = '<option value="">All groups (Ladkewale & Ladkiwale)</option>' + groups.map(x => `<option${x === cur ? ' selected' : ''}>${esc(x)}</option>`).join('');
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
$('add').onclick = () => openForm();
$('gx').onclick = () => $('dlg').close();
$('gf').onsubmit = e => {
  e.preventDefault();
  const name = $('gn').value.trim();
  if (!name) return $('gerr').textContent = 'Please enter a name.';
  const payload = {
    name, email: $('ge').value.trim(), phone: $('gp').value.trim(),
    group: $('gg').value.trim(), plus: Math.max(0, +$('gpl').value || 0),
    diet: $('gd').value.trim(), status: $('gs').value
  };
  if (editing) Object.assign(G.find(g => g.id === editing), payload);
  else G.push({ id: uid(), ...payload });
  $('dlg').close(); draw();
};

$('rows').onclick = e => {
  const ed = e.target.dataset.edit, del = e.target.dataset.del;
  if (ed) openForm(G.find(g => g.id === ed));
  if (del && confirm('Delete this guest?')) { G = G.filter(g => g.id !== del); draw(); }
};
$('rows').onchange = e => {
  const id = e.target.dataset.st;
  if (id) { G.find(g => g.id === id).status = e.target.value; draw(); }
};

$('chips').onclick = e => {
  const c = e.target.dataset.chip; if (c) { fStatus = c; draw(); }
};
$('q').oninput = $('grp').onchange = draw;

/* CSV */
$('exp').onclick = () => {
  const lines = [['Name','Email','Phone','Group','Dietary','PlusOnes','Status'].map(csvCell).join(',')]
    .concat(G.map(g => [g.name, g.email, g.phone, g.group, g.diet, g.plus, g.status].map(csvCell).join(',')));
  downloadFile('eventora-guests.csv', lines.join('\n'));
};
$('imp').onclick = () => $('file').click();
$('file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const rows = parseCSV(ev.target.result);
      if (!rows.length) throw new Error('File is empty.');
      const start = rows[0][0].toLowerCase().includes('name') ? 1 : 0;
      let added = 0;
      for (let i = start; i < rows.length; i++) {
        const [name, email = '', phone = '', group = '', diet = '', plus = '0', status = 'Pending'] = rows[i];
        if (name) { G.push({ id: uid(), name, email, phone, group, diet, plus: Math.max(0, +plus || 0), status: STATUSES.includes(status) ? status : 'Pending' }); added++; }
      }
      $('msg').textContent = `Imported ${added} guest(s).`; draw();
    } catch (err) { $('msg').textContent = 'Could not read CSV: ' + err.message; $('msg').style.color = '#DC2626'; }
  };
  r.readAsText(f);
};

draw();
