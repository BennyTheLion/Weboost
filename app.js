// Weboost — chat-driven landing page builder
// Talks to your own backend at /api/chat (see api/chat.js), which proxies
// the DeepSeek API. Never call the DeepSeek API directly from this file —
// that would expose your API key to every visitor.

const chatEl = document.getElementById('chat');
const composer = document.getElementById('composer');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const seamEl = document.getElementById('seam');
const previewEl = document.getElementById('preview');
const canvasEmptyEl = document.getElementById('canvasEmpty');
const canvasHintEl = document.getElementById('canvasHint');
const stylePickerEl = document.getElementById('stylePicker');

// Full conversation history sent to the backend on every turn.
// Each item: { role: 'user' | 'assistant', content: string }
let history = [];
let isSending = false;
let conversationLocked = false;

// '' means "let the agent decide" (the default). Any other value is sent
// to the backend as preferredStyle and overrides the agent's own judgment —
// see api/chat.js.
let selectedStyle = '';

// The structured content object from the most recent generate_landing_page
// call (see api/chat.js), cached so the style chips can instantly re-render
// the preview in a different visual style entirely client-side (via
// templates.js) — no backend round trip, no extra DeepSeek call.
let lastContent = null;

if (stylePickerEl) {
  stylePickerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.style-chip');
    if (!btn) return;
    selectedStyle = btn.dataset.style || '';
    stylePickerEl.querySelectorAll('.style-chip').forEach((chip) => {
      const isActive = chip === btn;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', String(isActive));
    });

    // A page already exists — re-render it in the new style right now
    // instead of waiting for the next chat turn. "אוטומטי" has no fixed
    // style of its own, so it does nothing here beyond setting the
    // preference for the agent's *next* generation.
    if (lastContent && selectedStyle) {
      lastContent.style = selectedStyle;
      renderPreview(window.WeboostTemplates.renderTemplate(selectedStyle, lastContent));
    }
  });
}

function addMessage(role, text) {
  const wrap = document.createElement('div');
  wrap.className = `msg msg--${role}`;
  const tag = document.createElement('span');
  tag.className = 'msg__tag';
  tag.textContent = role === 'user' ? 'את/ה' : 'סוכן';
  const p = document.createElement('p');
  p.textContent = text;
  wrap.appendChild(tag);
  wrap.appendChild(p);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrap;
}

function addThinking() {
  const wrap = document.createElement('div');
  wrap.className = 'msg msg--agent msg--thinking';
  wrap.innerHTML = `<span class="msg__tag">סוכן</span><p>חושב…</p>`;
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrap;
}

function setBuilding(active) {
  seamEl.classList.toggle('is-active', active);
}

function setActiveStyleChip(style) {
  if (!stylePickerEl) return;
  stylePickerEl.querySelectorAll('.style-chip').forEach((chip) => {
    const isActive = (chip.dataset.style || '') === style;
    chip.classList.toggle('is-active', isActive);
    chip.setAttribute('aria-pressed', String(isActive));
  });
}

function renderPreview(html) {
  previewEl.srcdoc = html;
  previewEl.classList.add('is-visible');
  canvasEmptyEl.classList.add('is-hidden');
  canvasHintEl.textContent = 'עודכן זה עתה';
}

async function sendMessage(text) {
  history.push({ role: 'user', content: text });
  addMessage('user', text);
  inputEl.value = '';
  isSending = true;
  sendBtn.disabled = true;
  setBuilding(true);

  const thinkingEl = addThinking();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, preferredStyle: selectedStyle })
    });

    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const data = await res.json();

    thinkingEl.remove();
    addMessage('agent', data.reply);
    history.push({ role: 'assistant', content: data.reply });

    if (data.page_html) {
      renderPreview(data.page_html);
      lastContent = data.content || null;
      if (lastContent?.style) setActiveStyleChip(lastContent.style);
    }

    if (data.limit_reached) {
      conversationLocked = true;
      inputEl.placeholder = 'הגעתם למגבלת השיחה — רעננו את הדף כדי להתחיל מחדש.';
    }
  } catch (err) {
    thinkingEl.remove();
    addMessage(
      'agent',
      'לא הצלחתי להתחבר לשרת. בדקו ש-/api/chat פרוס וש-DEEPSEEK_API_KEY מוגדר.'
    );
    console.error(err);
  } finally {
    isSending = false;
    sendBtn.disabled = conversationLocked;
    inputEl.disabled = conversationLocked;
    setBuilding(false);
  }
}

composer.addEventListener('submit', (e) => {
  e.preventDefault();
  if (conversationLocked) return;
  const text = inputEl.value.trim();
  if (!text || isSending) return;
  sendMessage(text);
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});
