/**
 * Eventora Dedicated Chatbot Page Script
 * Manages full-page conversational intelligence and suggested prompts.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupFullChat();
});

function setupFullChat() {
  const form = document.getElementById('full-chat-form');
  const input = document.getElementById('full-chat-input');
  const messagesBox = document.getElementById('full-chat-messages');
  const clearBtn = document.getElementById('btn-clear-chat');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    input.value = '';
    appendMessage(query, 'user');

    // Simulate bot thinking
    setTimeout(() => {
      const reply = window.getBotResponse(query);
      appendMessage(reply, 'bot');
    }, 400);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      messagesBox.innerHTML = `
        <div class="chat-bubble bubble-bot">
          Chat history cleared. How else may I assist your event planning?
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
    let html = `<p>${content.text}</p>`;
    if (content.link) {
      html += `
        <div style="margin-top: 10px;">
          <a href="${content.link.url}" class="btn btn-secondary btn-sm" style="font-size:0.75rem; border-color:#CBD5E1;">
            ${content.link.label}
          </a>
        </div>
      `;
    }
    bubble.innerHTML = html;
  }

  messagesBox.appendChild(bubble);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

window.askSamplePrompt = function(promptText) {
  const input = document.getElementById('full-chat-input');
  if (input) {
    input.value = promptText;
    document.getElementById('full-chat-form').dispatchEvent(new Event('submit'));
  }
};
