/**
 * Eventora Invitation Studio Script
 * Handles real-time canvas preview, template switching, html2canvas export, and MongoDB saving.
 */

let currentTemplate = 'floral';
let savedInvites = [];

document.addEventListener('DOMContentLoaded', () => {
  setupTemplateSwitcher();
  setupLiveInputSync();
  setupActionButtons();
  loadSavedInvites();
});

// Setup template selection
function setupTemplateSwitcher() {
  const container = document.getElementById('template-options');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const template = btn.getAttribute('data-template');
    currentTemplate = template;

    // Reset button styles
    container.querySelectorAll('button').forEach(b => {
      b.style.border = '1px solid #CBD5E1';
    });

    // Highlight active
    btn.style.border = '2px solid #DB2777';

    // Update canvas template class
    const canvas = document.getElementById('invite-canvas');
    canvas.className = `invite-canvas template-${template}`;

    // Adjust logo filter for royal theme
    const logo = document.getElementById('preview-logo');
    if (template === 'royal') {
      logo.style.filter = 'brightness(0) invert(1)';
    } else {
      logo.style.filter = 'none';
    }
  });
}

// Live typing synchronizer
function setupLiveInputSync() {
  const fields = [
    { input: 'invite-title', target: 'preview-title' },
    { input: 'invite-hosts', target: 'preview-hosts' },
    { input: 'invite-date', target: 'preview-date' },
    { input: 'invite-time', target: 'preview-time' },
    { input: 'invite-venue', target: 'preview-venue' },
    { input: 'invite-address', target: 'preview-address' },
    { input: 'invite-message', target: 'preview-message' }
  ];

  fields.forEach(({ input, target }) => {
    const inputEl = document.getElementById(input);
    const targetEl = document.getElementById(target);
    if (inputEl && targetEl) {
      inputEl.addEventListener('input', () => {
        targetEl.textContent = inputEl.value || '';
      });
    }
  });
}

// Setup Save & Download actions
function setupActionButtons() {
  const btnSave = document.getElementById('btn-save-invite');
  const btnDownload = document.getElementById('btn-download-png');
  const statusMsg = document.getElementById('save-status-msg');

  // Save to MongoDB
  btnSave.addEventListener('click', async () => {
    const payload = {
      template: currentTemplate,
      details: {
        title: document.getElementById('invite-title').value,
        hosts: document.getElementById('invite-hosts').value,
        date: document.getElementById('invite-date').value,
        time: document.getElementById('invite-time').value,
        venue: document.getElementById('invite-venue').value,
        address: document.getElementById('invite-address').value,
        message: document.getElementById('invite-message').value
      }
    };

    btnSave.textContent = 'Saving...';
    try {
      const res = await window.EventoraAPI.invites.create(payload);
      if (res.success) {
        statusMsg.textContent = '✓ Saved to your MongoDB account!';
        statusMsg.style.display = 'block';
        loadSavedInvites();
        setTimeout(() => { statusMsg.style.display = 'none'; }, 4000);
      } else {
        alert(res.message || 'Error saving invite');
      }
    } catch (err) {
      console.error('Error saving invite:', err);
      alert('Could not save invite to database.');
    } finally {
      btnSave.textContent = '💾 Save to MongoDB';
    }
  });

  // Download high-resolution PNG using html2canvas
  btnDownload.addEventListener('click', async () => {
    const canvasEl = document.getElementById('invite-canvas');
    if (!canvasEl) return;

    if (typeof html2canvas === 'undefined') {
      alert('html2canvas library is loading, please try again in a moment.');
      return;
    }

    btnDownload.textContent = 'Generating PNG...';
    try {
      const canvas = await html2canvas(canvasEl, {
        scale: 2, // High resolution for crisp printing
        useCORS: true,
        backgroundColor: null
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const hostsName = document.getElementById('invite-hosts').value.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Eventora_${hostsName}_Invitation.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('html2canvas error:', error);
      alert('Failed to generate PNG image. Please try again.');
    } finally {
      btnDownload.textContent = '📷 Download as PNG';
    }
  });
}

// Load and list saved invites from MongoDB
async function loadSavedInvites() {
  const container = document.getElementById('saved-invites-list');
  const countSpan = document.getElementById('saved-invites-count');
  if (!container) return;

  try {
    const res = await window.EventoraAPI.invites.getAll();
    if (res.success && res.data && res.data.length > 0) {
      savedInvites = res.data;
      countSpan.textContent = savedInvites.length;

      container.innerHTML = savedInvites.map(inv => `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.85rem; color: var(--text-dark);">${inv.details?.hosts || 'Event Invite'}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${inv.template} • ${inv.details?.date || ''}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm" style="padding: 4px 8px; font-size: 0.75rem; background: #FFFFFF; border: 1px solid #CBD5E1;" onclick="loadInviteIntoEditor('${inv._id}')">Load</button>
            <button class="btn btn-sm" style="padding: 4px 8px; font-size: 0.75rem; color: var(--accent-red); background: none;" onclick="deleteSavedInvite('${inv._id}')">&times;</button>
          </div>
        </div>
      `).join('');
    } else {
      countSpan.textContent = '0';
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 12px;">No saved designs yet.</div>';
    }
  } catch (err) {
    console.error('Error fetching saved invites:', err);
  }
}

window.loadInviteIntoEditor = function(id) {
  const inv = savedInvites.find(x => x._id === id);
  if (!inv) return;

  // Set template
  currentTemplate = inv.template || 'floral';
  const canvas = document.getElementById('invite-canvas');
  canvas.className = `invite-canvas template-${currentTemplate}`;

  // Update form fields
  if (inv.details) {
    document.getElementById('invite-title').value = inv.details.title || '';
    document.getElementById('invite-hosts').value = inv.details.hosts || '';
    document.getElementById('invite-date').value = inv.details.date || '';
    document.getElementById('invite-time').value = inv.details.time || '';
    document.getElementById('invite-venue').value = inv.details.venue || '';
    document.getElementById('invite-address').value = inv.details.address || '';
    document.getElementById('invite-message').value = inv.details.message || '';

    // Trigger update on preview nodes
    document.getElementById('preview-title').textContent = inv.details.title || '';
    document.getElementById('preview-hosts').textContent = inv.details.hosts || '';
    document.getElementById('preview-date').textContent = inv.details.date || '';
    document.getElementById('preview-time').textContent = inv.details.time || '';
    document.getElementById('preview-venue').textContent = inv.details.venue || '';
    document.getElementById('preview-address').textContent = inv.details.address || '';
    document.getElementById('preview-message').textContent = inv.details.message || '';
  }
};

window.deleteSavedInvite = async function(id) {
  if (!confirm('Delete this saved invitation?')) return;
  try {
    const res = await window.EventoraAPI.invites.delete(id);
    if (res.success) {
      loadSavedInvites();
    }
  } catch (e) {
    console.error(e);
  }
};
