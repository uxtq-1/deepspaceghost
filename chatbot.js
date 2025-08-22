/* ===========================================
   Chattia UI — Hardened JS (Safe & Self)
   - No HTML injection; textContent only
   - Strict fetch with timeout, CORS-safe options
   - EN/ES + Theme toggles
   - Honeypot reporting hardening
   - Keyboard UX + ARIA updates
   =========================================== */

'use strict';

// ===== API ENDPOINTS (point to your edge/CF Worker later if desired)
const BASE_API = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net';
const WORKER_CHAT_URL = BASE_API + '/chat';
const WORKER_END_SESSION_URL = BASE_API + '/end-session';
const WORKER_HONEYPOT_URL = BASE_API + '/honeypot-trip';

// ===== Network helpers
function fetchJSON(url, options = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const opts = {
    method: 'POST',
    mode: 'cors',
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
    body: options.body || '{}',
    signal: ctrl.signal
  };
  return fetch(url, opts)
    .then(async (r) => {
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('bad-content-type');
      return r.json();
    })
    .catch((e) => { clearTimeout(t); throw e; });
}

/**
 * Builds the HTML structure for the chatbot and injects it into the page.
 */
function buildChatbotUI() {
  const chatbotHTML = `
    <!-- Reopen (when minimized) -->
    <button id="chat-open-btn" aria-label="Open chat" aria-controls="chatbot-container" aria-expanded="false">
      <i class="fa-solid fa-comments" aria-hidden="true"></i>
      <span class="sr-only">Open chat</span>
    </button>

    <!-- Chatbot -->
    <div id="chatbot-container" role="dialog" aria-modal="true" aria-label="Chattia">
      <div id="chatbot-header">
        <span id="title" data-en="Chattia" data-es="Chattia">Chattia</span>
        <div>
          <button id="langEN" class="ctrl" type="button" aria-pressed="true">EN</button>
          <button id="langES" class="ctrl" type="button" aria-pressed="false">ES</button>
          <button id="lightCtrl" class="ctrl" type="button" aria-pressed="true" data-en="Light" data-es="Claro">Light</button>
          <button id="darkCtrl" class="ctrl" type="button" aria-pressed="false" data-en="Dark" data-es="Oscuro">Dark</button>
          <button id="minimizeBtn" type="button" title="Minimize" aria-label="Minimize chat">
            <i class="fa-solid fa-minus" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Dialogue viewport -->
      <div id="chat-log" role="log" aria-live="polite" aria-atomic="false"></div>

      <div id="chatbot-form-container">
        <form id="chatbot-input-grid" autocomplete="off" novalidate>
          <!-- Row 1: brand -->
          <div id="input-toolbar" aria-label="Ops Online Support">
            <div id="brand"
              data-en="Ops Online Support"
              data-es="Soporte en Línea OPS"
              title="Ops Online Support"></div>
          </div>

          <!-- Row 2: input + buttons -->
          <div id="input-main">
            <textarea
              id="chatbot-input"
              rows="3"
              placeholder="Place your message here..."
              required
              maxlength="512"
              inputmode="text"
              autocapitalize="sentences"
              autocomplete="off"
              data-en-ph="Place your message here..."
              data-es-ph="Coloque su mensaje aquí..."></textarea>
          </div>

          <div id="button-stack">
            <button id="chatbot-send" type="submit" class="btn" disabled aria-label="Send">
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              <span class="sr-only">Send</span>
            </button>
            <button id="chatbot-close" type="button" class="btn secondary" aria-label="Close chat">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              <span class="sr-only">Close</span>
            </button>
          </div>

          <!-- Hidden honeypots -->
          <div class="hp-wrap" aria-hidden="true">
            <label class="hp-label" for="hp_text">Do not fill</label>
            <input type="text" id="hp_text" name="hp_text" tabindex="-1" autocomplete="off" />
            <label class="hp-label" for="hp_check">I am human</label>
            <input type="checkbox" id="hp_check" name="hp_check" tabindex="-1" />
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);
}

// ===== Main initialization
function initChatbot() {
  buildChatbotUI();

  // DOM
  const qs = (s) => document.querySelector(s), qsa = (s) => [...document.querySelectorAll(s)];
  const container = qs('#chatbot-container');
  const header = qs('#chatbot-header');
  const log = qs('#chat-log');
  const gridForm = qs('#chatbot-input-grid');
  const input = qs('#chatbot-input');
  const sendBtn = qs('#chatbot-send');
  const closeBtn = qs('#chatbot-close');
  const minimizeBtn = qs('#minimizeBtn');
  const openBtn = qs('#chat-open-btn');
  const langEN = qs('#langEN');
  const langES = qs('#langES');
  const lightCtrl = qs('#lightCtrl');
  const darkCtrl = qs('#darkCtrl');
  const brand = qs('#brand');
  const transNodes = qsa('[data-en]');
  const phNodes = qsa('[data-en-ph]');
  const hpText = qs('#hp_text');
  const hpCheck = qs('#hp_check');

  // Brand builder (preserves spaces)
  function buildBrand(text) {
    brand.innerHTML = '';
    let i = 0;
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch;
      s.style.setProperty('--i', String(i++));
      brand.appendChild(s);
    }
  }
  buildBrand(brand.dataset.en || 'Ops Online Support');

  // Language controls
  function setLanguage(toES) {
    document.documentElement.lang = toES ? 'es' : 'en';
    langEN.setAttribute('aria-pressed', String(!toES));
    langES.setAttribute('aria-pressed', String(toES));
    transNodes.forEach(n => n.textContent = toES ? (n.dataset.es || n.textContent) : (n.dataset.en || n.textContent));
    phNodes.forEach(n => n.placeholder = toES ? (n.dataset.esPh || n.placeholder) : (n.dataset.enPh || n.placeholder));
    buildBrand(toES ? (brand.dataset.es || 'Soporte en Línea OPS') : (brand.dataset.en || 'Ops Online Support'));
  }
  langEN.addEventListener('click', () => setLanguage(false));
  langES.addEventListener('click', () => setLanguage(true));

  // Theme controls
  function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    lightCtrl.setAttribute('aria-pressed', String(!dark));
    darkCtrl.setAttribute('aria-pressed', String(dark));
  }
  lightCtrl.addEventListener('click', () => setTheme(false));
  darkCtrl.addEventListener('click', () => setTheme(true));

  // Auto-grow (~3 lines)
  function autoGrow() {
    input.style.height = 'auto';
    const maxPx = 84;
    input.style.height = Math.min(input.scrollHeight, maxPx) + 'px';
  }
  input.addEventListener('input', () => { autoGrow(); updateSendEnabled(); });
  autoGrow();
  updateSendEnabled();

  // Dialogue helpers
  function addMsg(txt, cls) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + cls;
    div.textContent = txt;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  // Honeypot protection
  async function reportHoneypot(reason) {
    try {
      await fetchJSON(WORKER_HONEYPOT_URL, { body: JSON.stringify({ reason, ts: Date.now(), ua: navigator.userAgent }) }, 5000);
    } catch { /* silent */ }
  }
  function lockUIForHoneypot() {
    sendBtn.disabled = true;
    input.disabled = true;
    addMsg('Security: blocked due to suspicious activity.', 'bot');
    alert('Security check failed. This session has been blocked.');
  }
  ['change', 'input', 'click'].forEach(ev => {
    hpText.addEventListener(ev, () => { reportHoneypot('hp_text_touched'); lockUIForHoneypot(); }, { passive: true });
    hpCheck.addEventListener(ev, () => { reportHoneypot('hp_check_ticked'); lockUIForHoneypot(); }, { passive: true });
  });

  // ESC: close chat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeChat();
  });

  // Enable/disable Send
  function updateSendEnabled() {
    const hasText = input.value.trim().length > 0;
    sendBtn.disabled = !hasText || input.disabled;
  }

  // Enter to submit (Shift+Enter = newline)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) gridForm.requestSubmit();
    }
  });

  // Submit
  gridForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (hpText.value.trim() !== '' || hpCheck.checked) {
      await reportHoneypot('honeypot_on_submit');
      lockUIForHoneypot();
      return;
    }

    if (sendBtn.disabled) return;

    const msg = input.value.trim();
    if (!msg) { updateSendEnabled(); return; }

    addMsg(msg, 'user');
    input.value = ''; autoGrow(); updateSendEnabled();
    addMsg('…', 'bot');
    log.setAttribute('aria-busy', 'true');

    try {
      const resp = await fetchJSON(WORKER_CHAT_URL, {
        body: JSON.stringify({ message: msg })
      }, 12000);

      const reply = (resp && typeof resp.reply === 'string') ? String(resp.reply).slice(0, 2000) : 'No reply.';
      log.lastChild.textContent = reply;

    } catch (err) {
      log.lastChild.textContent = 'Error: Can’t reach AI.';
    } finally {
      log.removeAttribute('aria-busy');
    }
  });

  // Close (X) — clear, terminate, fully close
  async function terminateSession() {
    try { await fetchJSON(WORKER_END_SESSION_URL, { body: JSON.stringify({}) }, 5000); } catch {}
  }
  function clearUIState() {
    log.innerHTML = '';
    input.value = '';
    autoGrow();
    updateSendEnabled();
  }
  function closeChat() {
    clearUIState();
    terminateSession();
    container.style.display = 'none';
    container.setAttribute('aria-hidden', 'true');
    openBtn.style.display = 'none';
    openBtn.setAttribute('aria-expanded', 'false');
  }
  closeBtn.addEventListener('click', closeChat);

  // Minimize — keep state, allow reopen
  function minimizeChat() {
    container.style.display = 'none';
    container.setAttribute('aria-hidden', 'true');
    openBtn.style.display = 'inline-flex';
    openBtn.setAttribute('aria-expanded', 'false');
  }
  function openChat() {
    container.style.display = '';
    container.removeAttribute('aria-hidden');
    openBtn.style.display = 'none';
    openBtn.setAttribute('aria-expanded', 'true');
  }
  minimizeBtn.addEventListener('click', minimizeChat);
  openBtn.addEventListener('click', openChat);

  // Header drag
  let dragging = false, dragStart = { x: 0, y: 0 }, boxStart = { x: 0, y: 0 };
  function ensureAbsPosition() {
    const rect = container.getBoundingClientRect();
    container.style.left = rect.left + 'px';
    container.style.top = rect.top + 'px';
    container.style.right = 'auto';
    container.style.bottom = 'auto';
  }
  function clampToViewport(x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = container.getBoundingClientRect();
    const maxX = vw - rect.width;
    const maxY = vh - rect.height;
    return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) };
  }
  header.addEventListener('pointerdown', (e) => {
    dragging = true;
    header.setPointerCapture?.(e.pointerId);
    ensureAbsPosition();
    const rect = container.getBoundingClientRect();
    dragStart.x = e.clientX; dragStart.y = e.clientY;
    boxStart.x = rect.left; boxStart.y = rect.top;
  });
  header.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const t = clampToViewport(boxStart.x + dx, boxStart.y + dy);
    container.style.left = t.x + 'px';
    container.style.top = t.y + 'px';
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    header.releasePointerCapture?.(e.pointerId);
  };
  header.addEventListener('pointerup', endDrag);
  header.addEventListener('pointercancel', endDrag);

  // One-time brand shine (respect reduced motion)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function playShine() {
    if (reducedMotion) return;
    brand.classList.remove('shine'); void brand.offsetWidth; brand.classList.add('shine');
    setTimeout(() => brand.classList.remove('shine'), 1200);
  }
  setTimeout(playShine, 350);
}

// Initialize once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}
