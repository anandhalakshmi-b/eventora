// MODULE 5 - fills the plain HTML pages: consultation.html, consultation-plan.html, consultation-book.html
(function () {
  const $ = (id) => document.getElementById(id);
  const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const params = new URLSearchParams(location.search);

  function showErrors(errors) {
    const box = $('errors');
    box.hidden = false;
    box.replaceChildren(...errors.map((e) => { const p = document.createElement('p'); p.textContent = e; return p; }));
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async function post(url, body) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return { ok: res.ok, data: await res.json() };
    } catch (e) {
      return { ok: false, data: { errors: ['Could not reach the server. Please try again.'] } };
    }
  }
  function fillList(id, items) {
    $(id).replaceChildren(...items.map((t) => { const li = document.createElement('li'); li.textContent = t; return li; }));
  }

  /* ---- consultation.html : the form ---- */
  const form = $('consult-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const r = await post('/consultation/api/generate', Object.fromEntries(new FormData(form)));
      if (!r.ok) return showErrors(r.data.errors || ['Something went wrong.']);
      location.href = '/consultation/plan?id=' + r.data.planId;
    });
  }

  /* ---- consultation-plan.html : show the generated plan ---- */
  const planRoot = $('plan-root');
  if (planRoot) {
    const id = params.get('id');
    fetch('/consultation/api/plan/' + encodeURIComponent(id))
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) { showErrors(data.errors || ['Plan not found.']); return; }
        const p = data.plan;
        planRoot.hidden = false;
        $('p-meta').textContent = `${data.label} · ${new Date(p.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ${p.city} · ${p.guests} guests · ${inr(p.budget)}`;
        $('p-note').textContent = data.reality;

        $('p-timeline').replaceChildren(...p.timeline.map((t) => {
          const li = document.createElement('li');
          const b = document.createElement('strong'); b.textContent = t.when;
          li.append(b, document.createElement('br'), document.createTextNode(t.task));
          return li;
        }));
        fillList('p-venues', p.venueTypes);
        fillList('p-decor', p.decor);
        $('p-find-venues').href = '/venues?city=' + encodeURIComponent(p.city);

        $('p-vendors').replaceChildren(...p.vendorCategories.map((v) => {
          const li = document.createElement('li'), a = document.createElement('a');
          a.textContent = v; a.href = '/venues?tab=vendors&category=' + encodeURIComponent(v);
          li.appendChild(a); return li;
        }));

        $('p-budget').replaceChildren(...p.budgetSplit.map((b) => {
          const tr = document.createElement('tr');
          [b.category, b.percent + '%', inr(b.amount)].forEach((v) => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
          return tr;
        }));

        $('book-link').href = '/consultation/book?plan=' + encodeURIComponent(p._id);
        const status = $('p-status');
        $('save-btn').addEventListener('click', async () => {
          const r = await post('/consultation/api/save', { planId: p._id });
          status.textContent = r.ok ? 'Plan saved ✅' : 'Could not save. Try again.'; status.hidden = false;
        });
        $('checklist-btn').addEventListener('click', async () => {
          const r = await post('/consultation/api/to-checklist', { planId: p._id });
          if (r.ok && r.data.redirect) return (location.href = r.data.redirect);
          status.textContent = r.ok
            ? 'The Checklist module is not connected yet. Your tasks will be sent once it is merged.'
            : 'Could not send tasks. Try again.';
          status.hidden = false;
        });
      })
      .catch(() => showErrors(['Could not load your plan.']));
  }

  /* ---- consultation-book.html : consultant request ---- */
  const book = $('book-form');
  if (book) {
    $('planId').value = params.get('plan') || '';
    book.addEventListener('submit', async (e) => {
      e.preventDefault();
      const r = await post('/consultation/api/book', Object.fromEntries(new FormData(book)));
      if (!r.ok) return showErrors(r.data.errors || ['Something went wrong.']);
      $('book-section').hidden = true;
      $('confirm').hidden = false;
    });
  }
})();
