/**
 * Eventora AI Consultation Script
 * Synthesizes comprehensive Indian Shaadi blueprints, Rupee financial allocations, and multi-day ceremony timelines.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupConsultationForm();
});

function formatINR(val) {
  if (isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function setupConsultationForm() {
  const form = document.getElementById('consultation-form');
  const btn = document.getElementById('btn-generate-plan');
  const resultContainer = document.getElementById('ai-plan-result');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    btn.textContent = 'Synthesizing Shaadi Blueprint... ⏳';
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

      btn.textContent = '✨ Regenerate Shaadi Blueprint';
      btn.disabled = false;

      resultContainer.style.display = 'block';
      resultContainer.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  });
}

function renderGeneratedPlan(data) {
  const container = document.getElementById('ai-plan-result');

  // Compute Indian wedding budget allocations
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
          <span class="card-badge" style="background:#CFFAFE; color:#0891B2;">Custom Indian Event Blueprint</span>
          <h2 class="heading-lg" style="margin-top: 6px;">${data.style} ${data.eventType}</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px;">
            📍 ${data.city} • 👥 ${data.guests} Guests • 🗓️ ${data.season} • 💰 ${formatINR(data.budget)} Target Budget
          </p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 14px 20px; text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Per-Guest Thali & Logistics</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #0891B2;">${formatINR(costPerGuest)}</div>
          <div style="font-size: 0.7rem; color: #16A34A; font-weight: 600;">Optimal spend efficiency</div>
        </div>
      </div>

      <!-- Executive Overview -->
      <div style="margin-bottom: 36px; background: #FFFBEB; border-left: 4px solid #CA8A04; padding: 20px 24px; border-radius: 12px;">
        <h3 class="heading-sm" style="color: #854D0E; margin-bottom: 8px;">Design Concept & Cultural Atmosphere</h3>
        <p style="color: #713F12; font-size: 0.95rem; line-height: 1.6;">
          For this ${data.guests}-guest ${data.eventType.toLowerCase()} in ${data.city}, our AI recommends anchoring the aesthetic in <strong>${data.style}</strong> motifs. 
          With a target budget of ${formatINR(data.budget)} (${Math.round(data.budget / 100000)} Lakhs), dedicating 32% to authentic multi-course regional catering (live chaat stations, tandoor kebabs, and live saffron sweets) paired with 35% for royal heritage lawns guarantees an unforgettable experience for both Ladkewale and Ladkiwale.
          ${data.notes ? `<br/><br/><em>Special Focus:</em> "${data.notes}"` : ''}
        </p>
      </div>

      <!-- Itemized Budget Breakdown in Rupees -->
      <div style="margin-bottom: 40px;">
        <h3 class="heading-md" style="margin-bottom: 18px;">Recommended Financial Allocations (Rupees)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          
          <div style="background: #EFF6FF; border-radius: 16px; padding: 18px; border: 1px solid #BFDBFE;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #1D4ED8; text-transform: uppercase;">Venue & Mandap Lawns (35%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #1E3A8A; margin-top: 4px;">${formatINR(venueCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Palace rental, haveli courtyard, sound truss</p>
          </div>

          <div style="background: #F0FDF4; border-radius: 16px; padding: 18px; border: 1px solid #BBF7D0;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #15803D; text-transform: uppercase;">Catering, Chaat & Sweets (32%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #14532D; margin-top: 4px;">${formatINR(cateringCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Live Chaat street, royal curries, hot Jalebi</p>
          </div>

          <div style="background: #FAF5FF; border-radius: 16px; padding: 18px; border: 1px solid #E9D5FF;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #7E22CE; text-transform: uppercase;">Cinematic Photo & Films (11%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #581C87; margin-top: 4px;">${formatINR(photoCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Pre-wedding film, candid photos, drone aerials</p>
          </div>

          <div style="background: #FFF7ED; border-radius: 16px; padding: 18px; border: 1px solid #FED7AA;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #C2410C; text-transform: uppercase;">Mandap & Floral Decor (10%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #7C2D12; margin-top: 4px;">${formatINR(decorCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Marigolds, Rajnigandha strings, brass urlis</p>
          </div>

          <div style="background: #FEF2F2; border-radius: 16px; padding: 18px; border: 1px solid #FECACA;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #B91C1C; text-transform: uppercase;">Baraat Dhol & Sangeet DJ (6%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #7F1D1D; margin-top: 4px;">${formatINR(musicCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Brass band, Punjabi dhol, LED sangeet console</p>
          </div>

          <div style="background: #FDF2F8; border-radius: 16px; padding: 18px; border: 1px solid #FBCFE8;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #BE185D; text-transform: uppercase;">Lehenga, Sherwani & Invites (6%)</span>
            <div style="font-size: 1.35rem; font-weight: 900; color: #831843; margin-top: 4px;">${formatINR(attireCost + invitesCost)}</div>
            <p style="font-size: 0.75rem; color: #475569; margin-top: 4px;">Bridal zardozi, safas, shahi patrika, mithai box</p>
          </div>

        </div>
      </div>

      <!-- Multi-Day Indian Ceremony Schedule -->
      <div style="margin-bottom: 40px;">
        <h3 class="heading-md" style="margin-bottom: 18px;">Recommended Multi-Day Ceremony Schedule</h3>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;">
            <span class="card-badge" style="background:#CFFAFE; color:#0891B2; margin:0;">Day 1: 11:00 AM</span>
            <div>
              <strong style="color: var(--text-dark); display:block; font-size:0.95rem;">Bridal Mehendi & Bangle Carnival</strong>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Organic dark-stain henna application for bride and family. Interactive bangles and floral jewellery stalls with live folk beats.</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;">
            <span class="card-badge" style="background:#F3E8FF; color:#9333EA; margin:0;">Day 1: 7:30 PM</span>
            <div>
              <strong style="color: var(--text-dark); display:block; font-size:0.95rem;">Sangeet Night & Bollywood Flashmob</strong>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Family dance performances on customized LED stage, live Punjabi Dhol jugalbandi, and fusion cocktails.</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;">
            <span class="card-badge" style="background:#FEF9C3; color:#CA8A04; margin:0;">Day 2: 10:00 AM</span>
            <div>
              <strong style="color: var(--text-dark); display:block; font-size:0.95rem;">Auspicious Haldi & Phoolon Ki Holi</strong>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Herbal Kasturi Haldi application, yellow marigold petal showers, and traditional Chooda ceremony with live dholak.</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;">
            <span class="card-badge" style="background:#DCFCE7; color:#16A34A; margin:0;">Day 2: 6:00 PM</span>
            <div>
              <strong style="color: var(--text-dark); display:block; font-size:0.95rem;">Grand Baraat, Sunset Varmala & Sacred Pheras</strong>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Baraat procession (6:00 PM) &bull; Sunset Varmala on elevated lotus stage with cold pyro (7:30 PM) &bull; Sacred Vedic Pheras around the Havankund (9:00 PM) &bull; Royal Feast (8:30 PM onwards).</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Action Buttons -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="applyPlanToBudget(${data.budget})">
          💰 Apply ${formatINR(data.budget)} to Budget Calculator
        </button>
        <a href="venues.html" class="btn btn-secondary">
          🏰 Find Palaces & Lawns in ${data.city} &rarr;
        </a>
        <a href="invites.html" class="btn btn-secondary">
          💌 Design Shahi Patrika &rarr;
        </a>
      </div>

    </div>
  `;
}

window.applyPlanToBudget = function(budget) {
  localStorage.setItem('eventora_target_budget', budget);
  alert(`Target Shaadi budget of ₹${budget.toLocaleString('en-IN')} saved! Redirecting to Budget Calculator...`);
  window.location.href = 'budget.html';
};
