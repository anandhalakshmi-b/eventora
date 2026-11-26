/**
 * Eventora AI Consultation Script
 * Generates wedding and event blueprints, Rupee financial allocations, and multi-day schedules.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupConsultationForm();
  syncConsultationWithRegisteredUser();
});

function applyUserToConsultationFields(user) {
  if (!user) return;
  const eventTypeEl = document.getElementById('eventType') || document.getElementById('consult-event-type');
  const eventDateEl = document.getElementById('eventDate');
  const budgetEl = document.getElementById('budget') || document.getElementById('consult-budget');
  const cityEl = document.getElementById('city') || document.getElementById('consult-city');

  if (eventTypeEl && !eventTypeEl.value && user.eventType) {
    const target = String(user.eventType).toLowerCase().trim();
    const matched = Array.from(eventTypeEl.options).find(opt => {
      const val = String(opt.value || '').toLowerCase();
      const txt = String(opt.textContent || '').toLowerCase();
      return val && (val === target || target.includes(val) || txt.includes(target));
    });
    if (matched) eventTypeEl.value = matched.value;
  }
  if (eventDateEl && !eventDateEl.value && user.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(user.eventDate)) {
    eventDateEl.value = user.eventDate;
  }
  if (budgetEl && !budgetEl.value && Number(user.eventBudget) > 0) {
    budgetEl.value = String(Number(user.eventBudget));
  }
  if (cityEl && !cityEl.value && user.city) {
    cityEl.value = user.city;
  }
}

async function syncConsultationWithRegisteredUser() {
  try {
    const cached = JSON.parse(localStorage.getItem('eventora_user'));
    if (cached) applyUserToConsultationFields(cached);
  } catch (e) {}

  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    if (json && json.success && json.user) {
      try { localStorage.setItem('eventora_user', JSON.stringify(json.user)); } catch (e) {}
      applyUserToConsultationFields(json.user);
    }
  } catch (e) {}
}

function formatINR(val) {
  if (isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function setupConsultationForm() {
  const form = document.getElementById('consultation-form');
  const btn = document.getElementById('btn-generate-plan');
  const resultContainer = document.getElementById('ai-plan-result');
  if (!form || !btn || !resultContainer) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    btn.textContent = 'Generating Event Blueprint...';
    btn.disabled = true;

    setTimeout(() => {
      const eventType = document.getElementById('consult-event-type').value;
      const style = document.getElementById('consult-style').value;
      const guests = Number(document.getElementById('consult-guests').value) || 300;
      const budget = Number(document.getElementById('consult-budget').value) || 3000000;
      const city = document.getElementById('consult-city').value;
      const season = document.getElementById('consult-season').value;
      const notes = document.getElementById('consult-notes').value;

      renderGeneratedPlan({ eventType, style, guests, budget, city, season, notes });

      btn.textContent = 'Regenerate Event Blueprint';
      btn.disabled = false;

      resultContainer.style.display = 'block';
      resultContainer.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  });
}

function renderGeneratedPlan(data) {
  const container = document.getElementById('ai-plan-result');

  // Compute event budget allocations
  const venueCost = Math.round(data.budget * 0.35);
  const cateringCost = Math.round(data.budget * 0.32);
  const photoCost = Math.round(data.budget * 0.11);
  const decorCost = Math.round(data.budget * 0.10);
  const musicCost = Math.round(data.budget * 0.06);
  const attireCost = Math.round(data.budget * 0.04);
  const invitesCost = Math.round(data.budget * 0.02);
  const costPerGuest = Math.round(data.budget / data.guests);

  container.innerHTML = `
    <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 24px; padding: 40px; box-shadow: var(--shadow-modal);">

      <!-- Plan Banner -->
      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="card-badge" style="background:#CFFAFE; color:#0891B2;">Custom Event Blueprint</span>
          <h2 class="heading-lg" style="margin-top: 6px;">${data.style} ${data.eventType}</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px;">
            City: ${data.city} · ${data.guests} Guests · ${data.season} · ${formatINR(data.budget)} Target Budget
          </p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 14px 20px; text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Per-Guest Dining &amp; Logistics</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #0891B2;">${formatINR(costPerGuest)}</div>
          <div style="font-size: 0.7rem; color: #16A34A; font-weight: 600;">Optimal spend efficiency</div>
        </div>
      </div>

      <!-- Executive Overview -->
      <div style="margin-bottom: 36px; background: #FFFBEB; border-left: 4px solid #CA8A04; padding: 20px 24px; border-radius: 12px;">
        <h3 class="heading-sm" style="color: #854D0E; margin-bottom: 8px;">Design Concept &amp; Event Atmosphere</h3>
        <p style="color: #713F12; font-size: 0.95rem; line-height: 1.6;">
          For this ${data.guests}-guest ${data.eventType.toLowerCase()} in ${data.city}, we recommend anchoring the aesthetic in <strong>${data.style}</strong> styling.
          With a target budget of ${formatINR(data.budget)} (${Math.round(data.budget / 100000)} Lakhs), dedicating 32% to curated regional catering paired with 35% for heritage venues or lawns ensures a memorable experience for both families and all guests.
          ${data.notes ? `<br/><br/><em>Special Focus:</em> "${data.notes}"` : ''}
        </p>
      </div>

      <!-- Itemized Budget Breakdown in Rupees -->
      <div style="margin-bottom: 40px;">
        <h3 class="heading-md" style="margin-bottom: 18px;">Recommended Financial Allocations (Rupees)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">

          <div style="background: #EFF6FF; border-radius: 16px; padding: 18px; border: 1px solid #BFDBFE;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #1D4ED8; text-transform: uppercase;">Venue &amp; Stage Lawns (35%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #1E3A8A; margin-top: 4px;">${formatINR(venueCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Banquet rental, heritage courtyard, sound rigging</p>
          </div>

          <div style="background: #F0FDF4; border-radius: 16px; padding: 18px; border: 1px solid #BBF7D0;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #15803D; text-transform: uppercase;">Catering &amp; Desserts (32%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #14532D; margin-top: 4px;">${formatINR(cateringCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Live food counters, main course spread, desserts</p>
          </div>

          <div style="background: #FAF5FF; border-radius: 16px; padding: 18px; border: 1px solid #E9D5FF;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #7E22CE; text-transform: uppercase;">Cinematic Photo &amp; Films (11%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #581C87; margin-top: 4px;">${formatINR(photoCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Pre-event shoot, candid photos, drone aerials</p>
          </div>

          <div style="background: #FFF7ED; border-radius: 16px; padding: 18px; border: 1px solid #FED7AA;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #C2410C; text-transform: uppercase;">Stage &amp; Floral Decor (10%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #7C2D12; margin-top: 4px;">${formatINR(decorCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Fresh marigolds, floral garlands, brass centerpieces</p>
          </div>

          <div style="background: #FEF2F2; border-radius: 16px; padding: 18px; border: 1px solid #FECACA;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #B91C1C; text-transform: uppercase;">Live Band &amp; DJ Music (6%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #7F1D1D; margin-top: 4px;">${formatINR(musicCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Procession band, percussion, LED dance console</p>
          </div>

          <div style="background: #FDF2F8; border-radius: 16px; padding: 18px; border: 1px solid #FBCFE8;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #BE185D; text-transform: uppercase;">Attire, Gifts &amp; Invites (6%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #831843; margin-top: 4px;">${formatINR(attireCost + invitesCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Celebration outfits, invitation cards, sweet boxes</p>
          </div>

        </div>
      </div>

      <!-- Multi-Day Ceremony Schedule -->
      <div style="margin-bottom: 40px;">
        <h3 class="heading-md" style="margin-bottom: 18px;">Recommended Multi-Day Event Schedule</h3>
        <div style="display: flex; flex-direction: column; gap: 14px;">

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;">
            <span class="card-badge" style="background:#CFFAFE; color:#0891B2; margin:0;">Day 1: 11:00 AM</span>
            <div>
              <strong style="color: var(--text-dark); display:block; font-size:0.95rem;">Henna &amp; Daytime Welcome Carnival</strong>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Organic henna artists for family and guests, floral accessory stalls, and live acoustic folk music.</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;">
            <span class="card-badge" style="background:#F3E8FF; color:#9333EA; margin:0;">Day 1: 7:30 PM</span>
            <div>
              <strong style="color: var(--text-dark); display:block; font-size:0.95rem;">Music &amp; Dance Celebration Night</strong>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Family dance performances on a custom LED stage, live percussion set, and evening dinner.</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;">
            <span class="card-badge" style="background:#FEF9C3; color:#CA8A04; margin:0;">Day 2: 10:00 AM</span>
            <div>
              <strong style="color: var(--text-dark); display:block; font-size:0.95rem;">Morning Turmeric &amp; Floral Shower</strong>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Traditional morning blessings, marigold petal showers, and daytime family celebrations.</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;">
            <span class="card-badge" style="background:#DCFCE7; color:#16A34A; margin:0;">Day 2: 6:00 PM</span>
            <div>
              <strong style="color: var(--text-dark); display:block; font-size:0.95rem;">Grand Procession, Garland Exchange &amp; Main Ceremony</strong>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Guest arrival procession (6:00 PM) &bull; Sunset garland exchange on elevated stage (7:30 PM) &bull; Main wedding ceremony (9:00 PM) &bull; Grand Banquet (8:30 PM onwards).</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Action Buttons -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="applyPlanToBudget(${data.budget})">
          Apply ${formatINR(data.budget)} to Budget Calculator
        </button>
        <a href="/venues" class="btn btn-secondary">
          Find Venues in ${data.city}
        </a>
        <a href="/invites" class="btn btn-secondary">
          Design Digital Invitation
        </a>
      </div>

    </div>
  `;
}

window.applyPlanToBudget = function (budget) {
  localStorage.setItem('eventora_target_budget', budget);
  alert(`Target budget of ₹${budget.toLocaleString('en-IN')} saved! Redirecting to Budget Calculator...`);
  window.location.href = '/budget';
};
