// This script will be loaded by the loader.js and will build the chatbot UI

// --- Configuration ---
const FIREBASE_FUNCTION_URL = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/chat';
const WORKER_CHAT_URL = FIREBASE_FUNCTION_URL;
const WORKER_END_SESSION_URL = FIREBASE_FUNCTION_URL + '/end-session';
const WORKER_HONEYPOT_URL = FIREBASE_FUNCTION_URL + '/honeypot-trip';

/**
 * Builds the HTML structure for the chatbot and injects it into the page.
 */
function buildChatbotUI() {
    const chatbotHTML = `
        <!-- Reopen (when minimized) -->
        <button id="chat-open-btn" aria-label="Open chat">
            <i class="fa-solid fa-comments"></i>
        </button>

        <!-- Chatbot -->
        <div id="chatbot-container" role="dialog" aria-modal="true" aria-label="Chattia">
            <div id="chatbot-header">
                <span id="title" data-en="Chattia" data-es="Chattia">Chattia</span>
                <div>
                    <span id="langCtrl" class="ctrl" role="button" aria-label="Toggle language">EN</span>
                    &nbsp;|&nbsp;
                    <span id="themeCtrl" class="ctrl" role="button" aria-label="Toggle theme">Dark</span>
                    <button id="minimizeBtn" type="button" title="Minimize">
                        <i class="fa-solid fa-minus"></i>
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
                            rows="1"
                            placeholder="Type your message..."
                            required
                            maxlength="512"
                            data-en-ph="Type your message..."
                            data-es-ph="Escriba su mensaje..."></textarea>
                    </div>

                    <div id="button-stack">
                        <button id="chatbot-send" type="submit" class="btn" disabled aria-label="Send">
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                        <button id="chatbot-close" type="button" class="btn secondary" aria-label="Close chat">
                            <i class="fa-solid fa-xmark"></i>
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


/**
 * Main initialization function for the chatbot.
 * This function is called once the DOM is ready.
 */
function initChatbot() {
    buildChatbotUI();

    /* ===== DOM ===== */
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
    const langCtrl = qs('#langCtrl');
    const themeCtrl = qs('#themeCtrl');
    const brand = qs('#brand');
    const transNodes = qsa('[data-en]');
    const phNodes = qsa('[data-en-ph]');
    const hpText = qs('#hp_text');
    const hpCheck = qs('#hp_check');

    /* ===== Brand builder (spaces preserved) ===== */
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

    /* Language toggle */
    langCtrl.textContent = 'ES';
    langCtrl.addEventListener('click', () => {
        const goES = langCtrl.textContent === 'ES';
        document.documentElement.lang = goES ? 'es' : 'en';
        langCtrl.textContent = goES ? 'EN' : 'ES';
        transNodes.forEach(n => n.textContent = goES ? (n.dataset.es || n.textContent) : (n.dataset.en || n.textContent));
        phNodes.forEach(n => n.placeholder = goES ? (n.dataset.esPh || n.placeholder) : (n.dataset.enPh || n.placeholder));
        buildBrand(goES ? (brand.dataset.es || 'Soporte en Línea OPS') : (brand.dataset.en || 'Ops Online Support'));
    });

    /* Theme toggle */
    themeCtrl.addEventListener('click', () => {
        const toDark = themeCtrl.textContent === 'Dark';
        document.body.classList.toggle('dark', toDark);
        themeCtrl.textContent = toDark ? 'Light' : 'Dark';
    });

    /* Auto-grow (~2 lines) */
    function autoGrow() {
        input.style.height = 'auto';
        const maxPx = 48;
        input.style.height = Math.min(input.scrollHeight, maxPx) + 'px';
    }
    input.addEventListener('input', () => { autoGrow(); updateSendEnabled(); });
    autoGrow(); // Initial call
    updateSendEnabled(); // Initial call

    /* Dialogue helpers */
    function addMsg(txt, cls) {
        const div = document.createElement('div');
        div.className = 'chat-msg ' + cls;
        div.textContent = txt;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    }

    /* ===== Honeypot protection ===== */
    async function reportHoneypot(reason) {
        try {
            await fetch(WORKER_HONEYPOT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, ts: Date.now(), ua: navigator.userAgent })
            });
        } catch (e) { }
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

    /* ESC key: close chat */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeChat();
        }
    });

    /* ===== Enable/disable Send: requires text ===== */
    function updateSendEnabled() {
        const hasText = input.value.trim().length > 0;
        sendBtn.disabled = !hasText || input.disabled;
    }

    /* ===== Enter to submit (Shift+Enter = newline) ===== */
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (sendBtn.disabled) {
                return;
            }
            gridForm.requestSubmit();
        }
    });

    /* ===== Submit ===== */
    gridForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (hpText.value.trim() !== '' || hpCheck.checked) {
            await reportHoneypot('honeypot_on_submit');
            lockUIForHoneypot();
            return;
        }
        if (sendBtn.disabled) { return; }
        const msg = input.value.trim();
        if (!msg) { updateSendEnabled(); return; }
        addMsg(msg, 'user');
        input.value = ''; autoGrow(); updateSendEnabled();
        addMsg('…', 'bot');
        try {
            const r = await fetch(WORKER_CHAT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            const d = await r.json();
            log.lastChild.textContent = d.reply || 'No reply.';
        } catch {
            log.lastChild.textContent = 'Error: Can’t reach AI.';
        }
    });

    /* ===== Close (X) — clear, terminate, fully close ===== */
    async function terminateSession() {
        try { await fetch(WORKER_END_SESSION_URL, { method: 'POST' }); } catch (e) { }
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

    /* ===== Minimize — keep state, allow reopen ===== */
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

    /* ===== Header drag (draggable enabled) ===== */
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

    /* ===== One-time brand shine ===== */
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function playShine() {
        if (reducedMotion) return;
        brand.classList.remove('shine'); void brand.offsetWidth; brand.classList.add('shine');
        setTimeout(() => brand.classList.remove('shine'), 1200);
    }
    setTimeout(playShine, 350);
}

// --- Initialize the chatbot ---
// We wait for the DOM to be fully loaded before initializing the chatbot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
