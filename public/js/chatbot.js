/**
 * Eventora Dedicated Chatbot Page Script
 * Connects the full-page chatbot UI to /api/chat (OpenAI / Gemini + project context).
 */

document.addEventListener('DOMContentLoaded', () => {
  setupFullChat();
});

function setupFullChat() {
  const form = document.getElementById('full-chat-form');
  const input = document.getElementById('full-chat-input');
  const messagesBox = document.getElementById('full-chat-messages');
  const clearBtn = document.getElementById('btn-clear-chat');
  if (!form || !input || !messagesBox) return;

  const history = [];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    input.value = '';
    appendMessage(query, 'user');
    history.push({ role: 'user', text: query });

    const typing = document.createElement('div');
    typing.className = 'chat-bubble bubble-bot';
    typing.textContent = 'Thinking...';
    messagesBox.appendChild(typing);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: history.slice(-8),
          context: { currentPage: window.location.pathname }
        })
      });
      const data = await res.json();
      typing.remove();

      const replyText = (data && data.reply) || 'I could not process that request right now.';
      history.push({ role: 'ora', text: replyText });
      appendMessage({
        text: replyText,
        link: data && data.link ? { url: data.link, label: data.linkLabel || 'Open Page' } : null
      }, 'bot');
    } catch (err) {
      typing.remove();
      const fallback = window.getBotResponse
        ? window.getBotResponse(query)
        : { text: 'Unable to reach the assistant right now. Please try again.', link: null };
      appendMessage(fallback, 'bot');
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      history.length = 0;
      messagesBox.innerHTML = `
        <div class="chat-bubble bubble-bot">
          Chat history cleared. Ask me anything about Eventora features, venues, budgets, checklists, guests, RSVPs, or invitations.
        </div>
      `;
    });
  }
}

function appendMessage(content, sender) {
  const messagesBox = document.getElementById('full-chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-${sender}`;

  if (sender === 'user') {
    bubble.textContent = content;
  } else {
    const p = document.createElement('p');
    p.style.margin = '0';
    p.textContent = content.text || '';
    bubble.appendChild(p);
    if (content.link && content.link.url) {
      const wrap = document.createElement('div');
      wrap.style.marginTop = '10px';
      const a = document.createElement('a');
      a.href = content.link.url;
      a.className = 'btn btn-secondary btn-sm';
      a.style.cssText = 'font-size:0.75rem; border-color:#CBD5E1; text-decoration:none; display:inline-block; padding:6px 14px; border-radius:999px;';
      a.textContent = content.link.label || 'Open Page';
      wrap.appendChild(a);
      bubble.appendChild(wrap);
    }
  }

  messagesBox.appendChild(bubble);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

window.askSamplePrompt = function (promptText) {
  const input = document.getElementById('full-chat-input');
  const form = document.getElementById('full-chat-form');
  if (input && form) {
    input.value = promptText;
    form.dispatchEvent(new Event('submit'));
  }
};
