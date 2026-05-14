/* =============================================================================
   Tayo360 AI Assistant Widget
   Self-injecting, framework-free, embeddable on any website.
   Drop this one file into your site and it builds itself.

   Usage:
     <script src="https://your-cdn.example.com/tayo360-widget.js" defer></script>

   Optional config — set BEFORE the script tag loads:
     <script>
       window.Tayo360Config = {
         webhookUrl: 'https://your-n8n.example.com/webhook/tayo360-lead',
         brandName: 'Tayo360',
         botName: 'Tayo360 Assistant',
         primaryColor: '#0a2540',
         accentColor: '#1a73a8'
       };
     </script>
     <script src="tayo360-widget.js" defer></script>

   Tayo360 — Automate. Simplify. Scale.
   ============================================================================= */

   (() => {
    'use strict';
  
    if (window.__tayo360WidgetLoaded) return;       // prevent double-injection
    window.__tayo360WidgetLoaded = true;
  
    // ============================================================================
    // CONFIG
    // ============================================================================
    const DEFAULTS = {
      webhookUrl: '',                                // n8n endpoint (Phase 2+)
      brandName: 'Tayo360',
      botName: 'Tayo360 Assistant',
      statusText: 'Online · usually replies instantly',
      poweredByText: 'Powered by Tayo360',
      primaryColor: '#0a2540',
      accentColor: '#1a73a8',
      teal: '#7fd9e8',
      typingDelay: { min: 600, max: 1100 },
      autoOpenAfterMs: 0,                            // 0 = disabled
      storageKey: 'tayo360_widget_state'
    };
  
    const CONFIG = Object.assign({}, DEFAULTS, window.Tayo360Config || {});
  
    // ============================================================================
    // QUICK ACTIONS & CONTENT
    // ============================================================================
    const QUICK_ACTIONS = {
      initial: [
        { label: 'AI Receptionist',     value: 'AI Receptionist' },
        { label: 'Website Design',      value: 'Website Design' },
        { label: 'Automation Help',     value: 'Automation Help' },
        { label: 'Educational Products', value: 'Educational Products' },
        { label: 'Book Consultation',   value: 'Book Consultation' },
        { label: 'Learn About Services', value: 'Learn About Services' }
      ],
      contactTimes: [
        { label: 'Morning',   value: 'Morning' },
        { label: 'Afternoon', value: 'Afternoon' },
        { label: 'Evening',   value: 'Evening' },
        { label: 'Anytime',   value: 'Anytime' }
      ]
    };
  
    const SERVICE_BLURBS = {
      'AI Receptionist':
        "Our AI Receptionist works 24/7 as your virtual front desk — answering questions, qualifying inquiries, and routing them to your team.",
      'Website Design':
        "Tayo360 builds modern, conversion-focused websites that look as polished as the brands they represent.",
      'Automation Help':
        "Tayo360 automates repetitive business workflows using AI systems, smart integrations, and orchestration tools like n8n.",
      'Educational Products':
        "We offer curriculum, books, and learning resources designed for schools, childcare centers, and training programs.",
      'Book Consultation':
        "Excellent — let's get a discovery call scheduled. I'll just need a few quick details to connect you with the right person.",
      'Learn About Services':
        "Tayo360 offers a full stack of AI-powered services: workflow automation, AI agents, voice systems, AI receptionist, website design, email marketing, SEO, and educational products."
    };
  
    // ============================================================================
    // STYLES (injected into <head>)
    // ============================================================================
    const CSS = `
      .t360-widget * { box-sizing: border-box; }
      .t360-widget, .t360-widget * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
        line-height: 1.5;
      }
  
      /* ---------- Launcher ---------- */
      .t360-launcher {
        position: fixed; bottom: 24px; right: 24px;
        width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(135deg, ${CONFIG.primaryColor}, ${CONFIG.accentColor});
        color: #fff; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 12px 32px rgba(10,37,64,0.18), 0 4px 8px rgba(10,37,64,0.08);
        z-index: 2147483646;
        transition: transform 0.25s cubic-bezier(0.22,1,0.36,1),
                    box-shadow 0.25s cubic-bezier(0.22,1,0.36,1);
      }
      .t360-launcher:hover {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 24px 64px rgba(10,37,64,0.22), 0 8px 16px rgba(10,37,64,0.10);
      }
      .t360-launcher__pulse {
        position: absolute; inset: 0; border-radius: 50%;
        background: ${CONFIG.accentColor}; opacity: 0.5;
        animation: t360-pulse 2.5s infinite; z-index: -1;
      }
      @keyframes t360-pulse {
        0%   { transform: scale(1);   opacity: 0.6; }
        100% { transform: scale(1.6); opacity: 0;   }
      }
      .t360-launcher__icon, .t360-launcher__close {
        width: 26px; height: 26px; pointer-events: none;
        transition: opacity 0.2s, transform 0.2s;
      }
      .t360-launcher__close { position: absolute; opacity: 0; transform: rotate(-90deg); }
      .t360-launcher[aria-expanded="true"] .t360-launcher__icon  { opacity: 0; transform: rotate(90deg); }
      .t360-launcher[aria-expanded="true"] .t360-launcher__close { opacity: 1; transform: rotate(0); }
      .t360-launcher[aria-expanded="true"] .t360-launcher__pulse { display: none; }
  
      /* ---------- Panel ---------- */
      .t360-panel {
        position: fixed; bottom: 100px; right: 24px;
        width: 380px; max-width: calc(100vw - 32px);
        height: 600px; max-height: calc(100vh - 140px);
        background: #fff; border-radius: 16px;
        box-shadow: 0 24px 64px rgba(10,37,64,0.18), 0 8px 16px rgba(10,37,64,0.08);
        display: flex; flex-direction: column; overflow: hidden;
        z-index: 2147483647;
        transform-origin: bottom right;
        animation: t360-open 0.3s cubic-bezier(0.16,1,0.3,1) both;
      }
      .t360-panel[hidden] { display: none; }
      @keyframes t360-open {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to   { opacity: 1; transform: translateY(0)    scale(1);    }
      }
  
      /* ---------- Header ---------- */
      .t360-header {
        background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.accentColor} 100%);
        color: #fff; padding: 18px 20px;
        display: flex; align-items: center; justify-content: space-between;
        position: relative;
      }
      .t360-header::after {
        content: ""; position: absolute; inset: 0;
        background: radial-gradient(ellipse at top left, rgba(255,255,255,0.08), transparent 60%);
        pointer-events: none;
      }
      .t360-brand { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
      .t360-avatar {
        width: 38px; height: 38px; border-radius: 50%;
        background: rgba(255,255,255,0.18);
        display: flex; align-items: center; justify-content: center;
        border: 1px solid rgba(255,255,255,0.25);
      }
      .t360-avatar svg { width: 22px; height: 22px; }
      .t360-title { font-weight: 600; font-size: 15px; color: #fff; }
      .t360-status {
        font-size: 12px; color: rgba(255,255,255,0.78);
        display: flex; align-items: center; gap: 6px; margin-top: 2px;
      }
      .t360-status-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #4ade80; box-shadow: 0 0 0 2px rgba(74,222,128,0.25);
      }
      .t360-close-btn {
        width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: none; cursor: pointer;
        color: rgba(255,255,255,0.85);
        display: flex; align-items: center; justify-content: center;
        transition: background-color 0.2s; position: relative; z-index: 1;
      }
      .t360-close-btn:hover { background: rgba(255,255,255,0.12); }
      .t360-close-btn svg { width: 18px; height: 18px; }
  
      /* ---------- Messages ---------- */
      .t360-messages {
        flex: 1; overflow-y: auto; padding: 20px 18px;
        background: #fafbfd; scroll-behavior: smooth;
      }
      .t360-messages::-webkit-scrollbar { width: 6px; }
      .t360-messages::-webkit-scrollbar-thumb { background: #d6dee9; border-radius: 3px; }
      .t360-messages::-webkit-scrollbar-track { background: transparent; }
  
      .t360-msg { display: flex; margin-bottom: 14px; animation: t360-msg-in 0.3s cubic-bezier(0.16,1,0.3,1) both; }
      @keyframes t360-msg-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .t360-bubble {
        max-width: 80%; padding: 11px 15px;
        border-radius: 16px; font-size: 14px; line-height: 1.5;
        word-wrap: break-word; box-shadow: 0 1px 2px rgba(10,37,64,0.04);
      }
      .t360-msg--bot  { justify-content: flex-start; }
      .t360-msg--bot  .t360-bubble {
        background: #fff; color: #1d2433;
        border: 1px solid #e6ebf2; border-bottom-left-radius: 4px;
      }
      .t360-msg--user { justify-content: flex-end; }
      .t360-msg--user .t360-bubble {
        background: ${CONFIG.primaryColor}; color: #fff;
        border-bottom-right-radius: 4px;
      }
  
      /* ---------- Typing indicator ---------- */
      .t360-msg--typing .t360-bubble { padding: 14px 16px; display: inline-flex; gap: 4px; }
      .t360-msg--typing .t360-dot {
        width: 7px; height: 7px; border-radius: 50%; background: #b3bccc;
        animation: t360-typing 1.2s infinite ease-in-out;
      }
      .t360-msg--typing .t360-dot:nth-child(2) { animation-delay: 0.15s; }
      .t360-msg--typing .t360-dot:nth-child(3) { animation-delay: 0.30s; }
      @keyframes t360-typing {
        0%, 60%, 100% { transform: translateY(0);    opacity: 0.4; }
        30%           { transform: translateY(-5px); opacity: 1;   }
      }
  
      /* ---------- Quick actions ---------- */
      .t360-quick {
        padding: 12px 18px; display: flex; flex-wrap: wrap; gap: 6px;
        background: #fafbfd; border-top: 1px solid #e6ebf2;
      }
      .t360-quick:empty { display: none; }
      .t360-quick-btn {
        background: #fff; border: 1px solid #d6dee9; cursor: pointer;
        border-radius: 999px; padding: 7px 13px;
        font-size: 12.5px; color: #1d2433; font-weight: 500;
        transition: border-color 0.2s, background-color 0.2s, color 0.2s;
      }
      .t360-quick-btn:hover {
        border-color: ${CONFIG.accentColor};
        background: #f4f8fc; color: ${CONFIG.primaryColor};
      }
  
      /* ---------- Input ---------- */
      .t360-input-form {
        display: flex; align-items: center; gap: 8px;
        padding: 14px 14px 12px; background: #fff;
        border-top: 1px solid #e6ebf2;
      }
      .t360-input {
        flex: 1; border: 1px solid #d6dee9; border-radius: 999px;
        padding: 10px 16px; font-size: 14px; color: #1d2433;
        background: #fafbfd; outline: none; font-family: inherit;
        transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
      }
      .t360-input:focus {
        border-color: ${CONFIG.accentColor}; background: #fff;
        box-shadow: 0 0 0 3px rgba(26,115,168,0.10);
      }
      .t360-input::placeholder { color: #8892a6; }
      .t360-send {
        width: 38px; height: 38px; border-radius: 50%; border: none;
        background: ${CONFIG.primaryColor}; color: #fff; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background-color 0.2s, transform 0.15s; flex-shrink: 0;
      }
      .t360-send:hover { background: ${CONFIG.accentColor}; transform: scale(1.05); }
      .t360-send svg { width: 16px; height: 16px; }
  
      /* ---------- Footer ---------- */
      .t360-footer {
        text-align: center; font-size: 11px; color: #8892a6;
        padding: 10px; background: #fff;
        border-top: 1px solid #e6ebf2; letter-spacing: 0.02em;
      }
      .t360-footer strong { color: #1d2433; font-weight: 600; }
  
      /* ---------- Mobile ---------- */
      @media (max-width: 480px) {
        .t360-panel {
          width: 100vw; height: 100vh;
          max-width: 100vw; max-height: 100vh;
          bottom: 0; right: 0; border-radius: 0;
        }
        .t360-launcher { bottom: 18px; right: 18px; }
      }
  
      /* ---------- Reduced motion ---------- */
      @media (prefers-reduced-motion: reduce) {
        .t360-widget *, .t360-widget *::before, .t360-widget *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
  
    function injectStyles() {
      const style = document.createElement('style');
      style.id = 't360-widget-styles';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  
    // ============================================================================
    // HTML INJECTION
    // ============================================================================
    function injectHTML() {
      const root = document.createElement('div');
      root.className = 't360-widget';
      root.innerHTML = `
        <button class="t360-launcher" id="t360Launcher"
                aria-label="Open ${escape(CONFIG.brandName)} AI Assistant"
                aria-expanded="false" aria-controls="t360Panel">
          <span class="t360-launcher__pulse" aria-hidden="true"></span>
          <svg class="t360-launcher__icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          <span class="t360-launcher__close" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
        </button>
  
        <section class="t360-panel" id="t360Panel" role="dialog"
                 aria-modal="false" aria-labelledby="t360Title" hidden>
          <header class="t360-header">
            <div class="t360-brand">
              <span class="t360-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </span>
              <div>
                <div class="t360-title" id="t360Title">${escape(CONFIG.botName)}</div>
                <div class="t360-status">
                  <span class="t360-status-dot" aria-hidden="true"></span>
                  ${escape(CONFIG.statusText)}
                </div>
              </div>
            </div>
            <button class="t360-close-btn" id="t360Close" aria-label="Close chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </header>
  
          <div class="t360-messages" id="t360Messages" aria-live="polite"></div>
          <div class="t360-quick" id="t360Quick"></div>
  
          <form class="t360-input-form" id="t360Form" autocomplete="off">
            <input type="text" id="t360Input" class="t360-input"
                   placeholder="Type your message…" aria-label="Message input" required />
            <button type="submit" class="t360-send" aria-label="Send message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
  
          <footer class="t360-footer">
            ${escape(CONFIG.poweredByText.replace('Tayo360', ''))}
            <strong>${escape(CONFIG.brandName)}</strong>
          </footer>
        </section>
      `;
      document.body.appendChild(root);
      return root;
    }
  
    function escape(s) {
      return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  
    // ============================================================================
    // STATE & LOGIC
    // ============================================================================
    const state = {
      open: false,
      step: 'idle',
      awaitingFreeText: false,
      lead: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        organization: '',
        role: '',
        serviceInterest: '',
        businessNeed: '',
        preferredContactTime: '',
        leadSource: 'Website AI Assistant',
        submittedAt: null
      }
    };
  
    let els = {};
  
    function $(id) { return document.getElementById(id); }
  
    // ---------- Messages ----------
    function renderMessage(text, role = 'bot') {
      const wrap = document.createElement('div');
      wrap.className = `t360-msg t360-msg--${role}`;
      const bubble = document.createElement('div');
      bubble.className = 't360-bubble';
      bubble.textContent = text;
      wrap.appendChild(bubble);
      els.messages.appendChild(wrap);
      els.messages.scrollTop = els.messages.scrollHeight;
      return wrap;
    }
  
    function showTyping() {
      const wrap = document.createElement('div');
      wrap.className = 't360-msg t360-msg--bot t360-msg--typing';
      wrap.id = 't360TypingIndicator';
      wrap.innerHTML = '<div class="t360-bubble"><span class="t360-dot"></span><span class="t360-dot"></span><span class="t360-dot"></span></div>';
      els.messages.appendChild(wrap);
      els.messages.scrollTop = els.messages.scrollHeight;
    }
  
    function hideTyping() {
      const t = $('t360TypingIndicator');
      if (t) t.remove();
    }
  
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  
    async function botSay(messages) {
      const arr = Array.isArray(messages) ? messages : [messages];
      for (const text of arr) {
        showTyping();
        const delay = CONFIG.typingDelay.min +
                      Math.random() * (CONFIG.typingDelay.max - CONFIG.typingDelay.min);
        await sleep(delay);
        hideTyping();
        renderMessage(text, 'bot');
      }
    }
  
    // ---------- Quick actions ----------
    function renderQuickActions(actions) {
      clearQuickActions();
      actions.forEach(({ label, value }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 't360-quick-btn';
        btn.textContent = label;
        btn.addEventListener('click', () => handleQuickAction(value));
        els.quick.appendChild(btn);
      });
    }
    function clearQuickActions() { els.quick.innerHTML = ''; }
  
    // ---------- Conversation ----------
    async function startConversation() {
      if (state.step !== 'idle') return;
      state.step = 'greeting';
      await botSay([
        `Hi there — welcome to ${CONFIG.brandName}.`,
        "I'm here to help you explore our AI-powered solutions. What brings you here today?"
      ]);
      state.step = 'service';
      renderQuickActions(QUICK_ACTIONS.initial);
    }
  
    async function handleQuickAction(value) {
      renderMessage(value, 'user');
      clearQuickActions();
  
      if (state.step === 'service') {
        state.lead.serviceInterest = value;
        const blurb = SERVICE_BLURBS[value];
        if (blurb) await botSay(blurb);
        await botSay([
          "Would you like our team to reach out about this?",
          "Let's start with your first name."
        ]);
        state.step = 'name_first';
        state.awaitingFreeText = true;
        return;
      }
  
      if (state.step === 'contact_time') {
        state.lead.preferredContactTime = value;
        await finishLead();
      }
    }
  
    async function handleUserText(text) {
      renderMessage(text, 'user');
  
      switch (state.step) {
        case 'name_first':
          state.lead.firstName = text;
          await botSay("And your last name?");
          state.step = 'name_last';
          break;
  
        case 'name_last':
          state.lead.lastName = text;
          await botSay(`Thanks, ${state.lead.firstName}. What's the best email to reach you at?`);
          state.step = 'email';
          break;
  
        case 'email':
          if (!isValidEmail(text)) {
            await botSay("That doesn't look like a valid email — could you double-check it?");
            break;
          }
          state.lead.email = text;
          await botSay("Great. What's a good phone number for follow-up?");
          state.step = 'phone';
          break;
  
        case 'phone':
          state.lead.phone = text;
          await botSay("What's the name of your organization or business?");
          state.step = 'org';
          break;
  
        case 'org':
          state.lead.organization = text;
          await botSay("And what's your role there?");
          state.step = 'role';
          break;
  
        case 'role':
          state.lead.role = text;
          await botSay("Briefly — what's the business need you're hoping we can help with?");
          state.step = 'need';
          break;
  
        case 'need':
          state.lead.businessNeed = text;
          await botSay("Last question — when's the best time to reach you?");
          state.step = 'contact_time';
          state.awaitingFreeText = false;
          renderQuickActions(QUICK_ACTIONS.contactTimes);
          break;
  
        default:
          await botSay([
            "Thanks for that. Let me get a few details so our team can follow up properly.",
            "What's your first name?"
          ]);
          state.step = 'name_first';
          state.awaitingFreeText = true;
          break;
      }
    }
  
    async function finishLead() {
      state.lead.submittedAt = new Date().toISOString();
      state.step = 'done';
      state.awaitingFreeText = false;
      clearQuickActions();
  
      await botSay([
        `Thank you, ${state.lead.firstName}.`,
        "Your information has been captured and shared with our team. Someone will be in touch shortly.",
        "Is there anything else you'd like to know in the meantime?"
      ]);
  
      sendLeadToWebhook(state.lead);
    }
  
    // ---------- Webhook ----------
    async function sendLeadToWebhook(lead) {
      console.group(`%c[${CONFIG.brandName}] Lead captured`,
                    `color:${CONFIG.accentColor};font-weight:bold;`);
      console.table(lead);
      console.groupEnd();
  
      if (!CONFIG.webhookUrl) return;
  
      try {
        const res = await fetch(CONFIG.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead)
        });
        if (!res.ok) console.warn(`[${CONFIG.brandName}] Webhook non-OK status:`, res.status);
      } catch (err) {
        console.error(`[${CONFIG.brandName}] Webhook error:`, err);
      }
    }
  
    function isValidEmail(s) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
    }
  
    // ---------- Panel controls ----------
    function openPanel() {
      els.panel.hidden = false;
      state.open = true;
      els.launcher.setAttribute('aria-expanded', 'true');
      if (state.step === 'idle') startConversation();
      setTimeout(() => els.input.focus({ preventScroll: true }), 350);
    }
  
    function closePanel() {
      els.panel.hidden = true;
      state.open = false;
      els.launcher.setAttribute('aria-expanded', 'false');
    }
  
    function togglePanel() {
      state.open ? closePanel() : openPanel();
    }
  
    // ============================================================================
    // BOOT
    // ============================================================================
    function boot() {
      injectStyles();
      injectHTML();
  
      els = {
        launcher: $('t360Launcher'),
        panel:    $('t360Panel'),
        close:    $('t360Close'),
        messages: $('t360Messages'),
        quick:    $('t360Quick'),
        form:     $('t360Form'),
        input:    $('t360Input')
      };
  
      els.launcher.addEventListener('click', togglePanel);
      els.close.addEventListener('click', closePanel);
  
      els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = els.input.value.trim();
        if (!text) return;
        els.input.value = '';
        await handleUserText(text);
      });
  
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.open) closePanel();
      });
  
      // Optional: allow external triggers (e.g. a "Talk to us" button on the page)
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-tayo360-open]');
        if (trigger) { e.preventDefault(); if (!state.open) openPanel(); }
      });
  
      if (CONFIG.autoOpenAfterMs > 0) {
        setTimeout(() => { if (!state.open) openPanel(); }, CONFIG.autoOpenAfterMs);
      }
  
      // Public API
      window.Tayo360 = {
        open: openPanel,
        close: closePanel,
        toggle: togglePanel,
        version: '1.0.0'
      };
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  
  })();