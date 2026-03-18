/**
 * @aspect/flare-ui v0.1.0
 * Components: fl-alert, fl-badge, fl-button, fl-card, fl-dialog, fl-input, fl-spinner, fl-tabs, fl-toggle
 * Generated: 2026-03-18T23:55:28.711Z
 */

// ── fl-alert ──
(() => {
"use strict";

class FlAlert extends HTMLElement {
  #visible = true;
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['variant', 'dismissible', 'title'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    { const v = this.getAttribute('variant'); if (v !== null) this.#prop_variant = v || "info"; }
    { const v = this.getAttribute('dismissible'); if (v !== null) this.#prop_dismissible = v !== null && v !== 'false'; }
    { const v = this.getAttribute('title'); if (v !== null) this.#prop_title = v || ""; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'variant') { this.#prop_variant = newVal || ''; this.#update(); }
    if (name === 'dismissible') { this.#prop_dismissible = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'title') { this.#prop_title = newVal || ''; this.#update(); }
  }

  #prop_variant = "info";
  get variant() { return this.#prop_variant; }

  #prop_dismissible = false;
  get dismissible() { return this.#prop_dismissible; }

  #prop_title = "";
  get title() { return this.#prop_title; }

  #emit_dismiss(detail) {
    this.dispatchEvent(new CustomEvent('dismiss', { detail, bubbles: true, composed: true }));
  }

  #handleDismiss() {
    this.#visible = false
      this.#emit_dismiss()
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:block;}.fl-alert{display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem 1rem;border-radius:8px;border-left:4px solid;font-size:0.875rem;}.fl-alert--info{background:#eff6ff;border-color:#3b82f6;color:#1e40af;}.fl-alert--success{background:#ecfdf5;border-color:#10b981;color:#065f46;}.fl-alert--warning{background:#fffbeb;border-color:#f59e0b;color:#92400e;}.fl-alert--error{background:#fef2f2;border-color:#ef4444;color:#991b1b;}.fl-alert__content{flex:1;min-width:0;}.fl-alert__title{display:block;margin-bottom:0.25rem;}.fl-alert__message{line-height:1.5;}.fl-alert__dismiss{border:none;background:none;font-size:1.25rem;color:inherit;opacity:0.6;cursor:pointer;padding:0;line-height:1;}.fl-alert__dismiss:hover{opacity:1;}</style>
      ${this.#visible ? `
        <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-alert', 'fl-alert--' + this.#prop_variant]))}" role="alert">
          <div class="fl-alert__content">
            ${this.#prop_title ? `
              <strong class="fl-alert__title">
                ${this.#esc(this.#prop_title)}
              </strong>
            ` : ''}
            <div class="fl-alert__message">
              <slot>
              </slot>
            </div>
          </div>
          ${this.#prop_dismissible ? `
            <button data-flare-id="fl-0" class="fl-alert__dismiss" aria-label="Dismiss">
              &times;
            </button>
          ` : ''}
        </div>
      ` : ''}
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:block;}.fl-alert{display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem 1rem;border-radius:8px;border-left:4px solid;font-size:0.875rem;}.fl-alert--info{background:#eff6ff;border-color:#3b82f6;color:#1e40af;}.fl-alert--success{background:#ecfdf5;border-color:#10b981;color:#065f46;}.fl-alert--warning{background:#fffbeb;border-color:#f59e0b;color:#92400e;}.fl-alert--error{background:#fef2f2;border-color:#ef4444;color:#991b1b;}.fl-alert__content{flex:1;min-width:0;}.fl-alert__title{display:block;margin-bottom:0.25rem;}.fl-alert__message{line-height:1.5;}.fl-alert__dismiss{border:none;background:none;font-size:1.25rem;color:inherit;opacity:0.6;cursor:pointer;padding:0;line-height:1;}.fl-alert__dismiss:hover{opacity:1;}</style>
      ${this.#visible ? `
        <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-alert', 'fl-alert--' + this.#prop_variant]))}" role="alert">
          <div class="fl-alert__content">
            ${this.#prop_title ? `
              <strong class="fl-alert__title">
                ${this.#esc(this.#prop_title)}
              </strong>
            ` : ''}
            <div class="fl-alert__message">
              <slot>
              </slot>
            </div>
          </div>
          ${this.#prop_dismissible ? `
            <button data-flare-id="fl-0" class="fl-alert__dismiss" aria-label="Dismiss">
              &times;
            </button>
          ` : ''}
        </div>
      ` : ''}
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_click = (e) => { this.#handleDismiss(e); this.#update(); };
        el.addEventListener('click', fn_click);
        this.#listeners.push([el, 'click', fn_click]);
      }
    }
  }

  #bindRefs() {
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-alert', FlAlert]);
} else {
  customElements.define('fl-alert', FlAlert);
}

})();


// ── fl-badge ──
(() => {
"use strict";

class FlBadge extends HTMLElement {
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['variant', 'size', 'pill', 'dot'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    { const v = this.getAttribute('variant'); if (v !== null) this.#prop_variant = v || "default"; }
    { const v = this.getAttribute('size'); if (v !== null) this.#prop_size = v || "md"; }
    { const v = this.getAttribute('pill'); if (v !== null) this.#prop_pill = v !== null && v !== 'false'; }
    { const v = this.getAttribute('dot'); if (v !== null) this.#prop_dot = v !== null && v !== 'false'; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'variant') { this.#prop_variant = newVal || ''; this.#update(); }
    if (name === 'size') { this.#prop_size = newVal || ''; this.#update(); }
    if (name === 'pill') { this.#prop_pill = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'dot') { this.#prop_dot = newVal !== null && newVal !== 'false'; this.#update(); }
  }

  #prop_variant = "default";
  get variant() { return this.#prop_variant; }

  #prop_size = "md";
  get size() { return this.#prop_size; }

  #prop_pill = false;
  get pill() { return this.#prop_pill; }

  #prop_dot = false;
  get dot() { return this.#prop_dot; }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:inline-flex;}.fl-badge{display:inline-flex;align-items:center;gap:0.375em;font-weight:500;border-radius:4px;white-space:nowrap;}.fl-badge--sm{font-size:0.6875rem;padding:0.125rem 0.5rem;}.fl-badge--md{font-size:0.75rem;padding:0.175rem 0.625rem;}.fl-badge--pill{border-radius:9999px;}.fl-badge--default{background:#f3f4f6;color:#374151;}.fl-badge--primary{background:#dbeafe;color:#1d4ed8;}.fl-badge--success{background:#d1fae5;color:#065f46;}.fl-badge--warning{background:#fef3c7;color:#92400e;}.fl-badge--danger{background:#fee2e2;color:#991b1b;}.fl-badge__dot-indicator{width:0.5em;height:0.5em;border-radius:50%;background:currentColor;}</style>
      <span class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-badge', 'fl-badge--' + this.#prop_variant, 'fl-badge--' + this.#prop_size, this.#prop_pill ? 'fl-badge--pill' : '', this.#prop_dot ? 'fl-badge--dot' : '']))}">
        ${this.#prop_dot ? `
          <span class="fl-badge__dot-indicator">
          </span>
        ` : ''}
        <slot>
        </slot>
      </span>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:inline-flex;}.fl-badge{display:inline-flex;align-items:center;gap:0.375em;font-weight:500;border-radius:4px;white-space:nowrap;}.fl-badge--sm{font-size:0.6875rem;padding:0.125rem 0.5rem;}.fl-badge--md{font-size:0.75rem;padding:0.175rem 0.625rem;}.fl-badge--pill{border-radius:9999px;}.fl-badge--default{background:#f3f4f6;color:#374151;}.fl-badge--primary{background:#dbeafe;color:#1d4ed8;}.fl-badge--success{background:#d1fae5;color:#065f46;}.fl-badge--warning{background:#fef3c7;color:#92400e;}.fl-badge--danger{background:#fee2e2;color:#991b1b;}.fl-badge__dot-indicator{width:0.5em;height:0.5em;border-radius:50%;background:currentColor;}</style>
      <span class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-badge', 'fl-badge--' + this.#prop_variant, 'fl-badge--' + this.#prop_size, this.#prop_pill ? 'fl-badge--pill' : '', this.#prop_dot ? 'fl-badge--dot' : '']))}">
        ${this.#prop_dot ? `
          <span class="fl-badge__dot-indicator">
          </span>
        ` : ''}
        <slot>
        </slot>
      </span>
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
  }

  #bindRefs() {
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-badge', FlBadge]);
} else {
  customElements.define('fl-badge', FlBadge);
}

})();


// ── fl-button ──
(() => {
"use strict";

class FlButton extends HTMLElement {
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    { const v = this.getAttribute('variant'); if (v !== null) this.#prop_variant = v || "primary"; }
    { const v = this.getAttribute('size'); if (v !== null) this.#prop_size = v || "md"; }
    { const v = this.getAttribute('disabled'); if (v !== null) this.#prop_disabled = v !== null && v !== 'false'; }
    { const v = this.getAttribute('loading'); if (v !== null) this.#prop_loading = v !== null && v !== 'false'; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'variant') { this.#prop_variant = newVal || ''; this.#update(); }
    if (name === 'size') { this.#prop_size = newVal || ''; this.#update(); }
    if (name === 'disabled') { this.#prop_disabled = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'loading') { this.#prop_loading = newVal !== null && newVal !== 'false'; this.#update(); }
  }

  #prop_variant = "primary";
  get variant() { return this.#prop_variant; }

  #prop_size = "md";
  get size() { return this.#prop_size; }

  #prop_disabled = false;
  get disabled() { return this.#prop_disabled; }

  #prop_loading = false;
  get loading() { return this.#prop_loading; }

  #emit_press(detail) {
    this.dispatchEvent(new CustomEvent('press', { detail, bubbles: true, composed: true }));
  }

  #handleClick() {
    if (!this.#prop_disabled && !this.#prop_loading) {
        this.#emit_press()
      }
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:inline-block;}.fl-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.5em;border:none;border-radius:6px;font-family:inherit;font-weight:500;cursor:pointer;transition:background 0.15s, box-shadow 0.15s, opacity 0.15s;line-height:1;white-space:nowrap;}.fl-btn:focus-visible{outline:2px solid #3b82f6;outline-offset:2px;}.fl-btn--sm{padding:0.375rem 0.75rem;font-size:0.8125rem;}.fl-btn--md{padding:0.5rem 1rem;font-size:0.875rem;}.fl-btn--lg{padding:0.625rem 1.5rem;font-size:1rem;}.fl-btn--primary{background:#3b82f6;color:#fff;}.fl-btn--primary:hover:not(:disabled){background:#2563eb;}.fl-btn--secondary{background:#e5e7eb;color:#1f2937;}.fl-btn--secondary:hover:not(:disabled){background:#d1d5db;}.fl-btn--danger{background:#ef4444;color:#fff;}.fl-btn--danger:hover:not(:disabled){background:#dc2626;}.fl-btn--ghost{background:transparent;color:#3b82f6;}.fl-btn--ghost:hover:not(:disabled){background:#eff6ff;}.fl-btn--disabled{opacity:0.5;cursor:not-allowed;}.fl-btn--loading{cursor:wait;}.fl-btn__spinner{display:inline-block;width:1em;height:1em;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:fl-spin 0.6s linear infinite;}@keyframes fl-spin{to{transform:rotate(360deg);}}</style>
      <button data-flare-id="fl-0" class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-btn', 'fl-btn--' + this.#prop_variant, 'fl-btn--' + this.#prop_size, this.#prop_disabled ? 'fl-btn--disabled' : '', this.#prop_loading ? 'fl-btn--loading' : '']))}" ${this.#prop_disabled || this.#prop_loading ? 'disabled' : ''}>
        ${this.#prop_loading ? `
          <span class="fl-btn__spinner">
          </span>
        ` : ''}
        <span class="fl-btn__content">
          <slot>
          </slot>
        </span>
      </button>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:inline-block;}.fl-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.5em;border:none;border-radius:6px;font-family:inherit;font-weight:500;cursor:pointer;transition:background 0.15s, box-shadow 0.15s, opacity 0.15s;line-height:1;white-space:nowrap;}.fl-btn:focus-visible{outline:2px solid #3b82f6;outline-offset:2px;}.fl-btn--sm{padding:0.375rem 0.75rem;font-size:0.8125rem;}.fl-btn--md{padding:0.5rem 1rem;font-size:0.875rem;}.fl-btn--lg{padding:0.625rem 1.5rem;font-size:1rem;}.fl-btn--primary{background:#3b82f6;color:#fff;}.fl-btn--primary:hover:not(:disabled){background:#2563eb;}.fl-btn--secondary{background:#e5e7eb;color:#1f2937;}.fl-btn--secondary:hover:not(:disabled){background:#d1d5db;}.fl-btn--danger{background:#ef4444;color:#fff;}.fl-btn--danger:hover:not(:disabled){background:#dc2626;}.fl-btn--ghost{background:transparent;color:#3b82f6;}.fl-btn--ghost:hover:not(:disabled){background:#eff6ff;}.fl-btn--disabled{opacity:0.5;cursor:not-allowed;}.fl-btn--loading{cursor:wait;}.fl-btn__spinner{display:inline-block;width:1em;height:1em;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:fl-spin 0.6s linear infinite;}@keyframes fl-spin{to{transform:rotate(360deg);}}</style>
      <button data-flare-id="fl-0" class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-btn', 'fl-btn--' + this.#prop_variant, 'fl-btn--' + this.#prop_size, this.#prop_disabled ? 'fl-btn--disabled' : '', this.#prop_loading ? 'fl-btn--loading' : '']))}" ${this.#prop_disabled || this.#prop_loading ? 'disabled' : ''}>
        ${this.#prop_loading ? `
          <span class="fl-btn__spinner">
          </span>
        ` : ''}
        <span class="fl-btn__content">
          <slot>
          </slot>
        </span>
      </button>
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_click = (e) => { this.#handleClick(e); this.#update(); };
        el.addEventListener('click', fn_click);
        this.#listeners.push([el, 'click', fn_click]);
      }
    }
  }

  #bindRefs() {
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-button', FlButton]);
} else {
  customElements.define('fl-button', FlButton);
}

})();


// ── fl-card ──
(() => {
"use strict";

class FlCard extends HTMLElement {
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['variant', 'padding', 'clickable'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    { const v = this.getAttribute('variant'); if (v !== null) this.#prop_variant = v || "elevated"; }
    { const v = this.getAttribute('padding'); if (v !== null) this.#prop_padding = v || "md"; }
    { const v = this.getAttribute('clickable'); if (v !== null) this.#prop_clickable = v !== null && v !== 'false'; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'variant') { this.#prop_variant = newVal || ''; this.#update(); }
    if (name === 'padding') { this.#prop_padding = newVal || ''; this.#update(); }
    if (name === 'clickable') { this.#prop_clickable = newVal !== null && newVal !== 'false'; this.#update(); }
  }

  #prop_variant = "elevated";
  get variant() { return this.#prop_variant; }

  #prop_padding = "md";
  get padding() { return this.#prop_padding; }

  #prop_clickable = false;
  get clickable() { return this.#prop_clickable; }

  #emit_press(detail) {
    this.dispatchEvent(new CustomEvent('press', { detail, bubbles: true, composed: true }));
  }

  #handleClick() {
    if (this.#prop_clickable) { this.#emit_press() }
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:block;}.fl-card{border-radius:8px;background:#fff;overflow:hidden;transition:box-shadow 0.2s, transform 0.1s;}.fl-card--elevated{box-shadow:0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);}.fl-card--outlined{border:1px solid #e5e7eb;}.fl-card--flat{background:#f9fafb;}.fl-card--clickable{cursor:pointer;}.fl-card--clickable:hover{box-shadow:0 4px 6px rgba(0,0,0,0.1);transform:translateY(-1px);}.fl-card--clickable:active{transform:translateY(0);}.fl-card--pad-none > .fl-card__body{padding:0;}.fl-card--pad-sm > .fl-card__body{padding:0.75rem;}.fl-card--pad-md > .fl-card__body{padding:1rem;}.fl-card--pad-lg > .fl-card__body{padding:1.5rem;}.fl-card__header{padding:1rem 1rem 0;}.fl-card__header:empty{display:none;}.fl-card__footer{padding:0 1rem 1rem;}.fl-card__footer:empty{display:none;}::slotted([slot="header"]){font-weight:600;font-size:1.125rem;color:#111827;}</style>
      <div data-flare-id="fl-0" class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-card', 'fl-card--' + this.#prop_variant, 'fl-card--pad-' + this.#prop_padding, this.#prop_clickable ? 'fl-card--clickable' : '']))}">
        <div class="fl-card__header">
          <slot name="header">
          </slot>
        </div>
        <div class="fl-card__body">
          <slot>
          </slot>
        </div>
        <div class="fl-card__footer">
          <slot name="footer">
          </slot>
        </div>
      </div>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:block;}.fl-card{border-radius:8px;background:#fff;overflow:hidden;transition:box-shadow 0.2s, transform 0.1s;}.fl-card--elevated{box-shadow:0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);}.fl-card--outlined{border:1px solid #e5e7eb;}.fl-card--flat{background:#f9fafb;}.fl-card--clickable{cursor:pointer;}.fl-card--clickable:hover{box-shadow:0 4px 6px rgba(0,0,0,0.1);transform:translateY(-1px);}.fl-card--clickable:active{transform:translateY(0);}.fl-card--pad-none > .fl-card__body{padding:0;}.fl-card--pad-sm > .fl-card__body{padding:0.75rem;}.fl-card--pad-md > .fl-card__body{padding:1rem;}.fl-card--pad-lg > .fl-card__body{padding:1.5rem;}.fl-card__header{padding:1rem 1rem 0;}.fl-card__header:empty{display:none;}.fl-card__footer{padding:0 1rem 1rem;}.fl-card__footer:empty{display:none;}::slotted([slot="header"]){font-weight:600;font-size:1.125rem;color:#111827;}</style>
      <div data-flare-id="fl-0" class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-card', 'fl-card--' + this.#prop_variant, 'fl-card--pad-' + this.#prop_padding, this.#prop_clickable ? 'fl-card--clickable' : '']))}">
        <div class="fl-card__header">
          <slot name="header">
          </slot>
        </div>
        <div class="fl-card__body">
          <slot>
          </slot>
        </div>
        <div class="fl-card__footer">
          <slot name="footer">
          </slot>
        </div>
      </div>
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_click = (e) => { this.#handleClick(e); this.#update(); };
        el.addEventListener('click', fn_click);
        this.#listeners.push([el, 'click', fn_click]);
      }
    }
  }

  #bindRefs() {
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-card', FlCard]);
} else {
  customElements.define('fl-card', FlCard);
}

})();


// ── fl-dialog ──
(() => {
"use strict";

class FlDialog extends HTMLElement {
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['open', 'title', 'closable', 'size'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    { const v = this.getAttribute('open'); if (v !== null) this.#prop_open = v !== null && v !== 'false'; }
    { const v = this.getAttribute('title'); if (v !== null) this.#prop_title = v || ""; }
    { const v = this.getAttribute('closable'); if (v !== null) this.#prop_closable = v !== null && v !== 'false'; }
    { const v = this.getAttribute('size'); if (v !== null) this.#prop_size = v || "md"; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'open') { this.#prop_open = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'title') { this.#prop_title = newVal || ''; this.#update(); }
    if (name === 'closable') { this.#prop_closable = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'size') { this.#prop_size = newVal || ''; this.#update(); }
  }

  #prop_open = false;
  get open() { return this.#prop_open; }

  #prop_title = "";
  get title() { return this.#prop_title; }

  #prop_closable = true;
  get closable() { return this.#prop_closable; }

  #prop_size = "md";
  get size() { return this.#prop_size; }

  #emit_close(detail) {
    this.dispatchEvent(new CustomEvent('close', { detail, bubbles: true, composed: true }));
  }

  #handleClose() {
    if (this.#prop_closable) {
        this.#prop_open = false
        this.#emit_close()
      }
  }

  #handleBackdrop() {
    if (e.target === e.currentTarget) {
        this.#handleClose()
      }
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:contents;}.fl-dialog__backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fl-dialog-fade 0.15s ease;}.fl-dialog{background:#fff;border-radius:12px;box-shadow:0 20px 25px rgba(0,0,0,0.15);max-height:85vh;display:flex;flex-direction:column;animation:fl-dialog-slide 0.2s ease;}.fl-dialog--sm{width:min(24rem, 90vw);}.fl-dialog--md{width:min(32rem, 90vw);}.fl-dialog--lg{width:min(48rem, 90vw);}.fl-dialog__header{display:flex;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid #e5e7eb;}.fl-dialog__title{flex:1;margin:0;font-size:1.125rem;font-weight:600;color:#111827;}.fl-dialog__close{border:none;background:none;font-size:1.5rem;color:#6b7280;cursor:pointer;padding:0 0.25rem;line-height:1;border-radius:4px;}.fl-dialog__close:hover{color:#111827;background:#f3f4f6;}.fl-dialog__body{padding:1.25rem;overflow-y:auto;flex:1;}.fl-dialog__footer{padding:0.75rem 1.25rem;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:0.5rem;}.fl-dialog__footer:empty{display:none;}@keyframes fl-dialog-fade{from{opacity:0;}to{opacity:1;}}@keyframes fl-dialog-slide{from{transform:translateY(-12px);opacity:0;}to{transform:translateY(0);opacity:1;}}</style>
      ${this.#prop_open ? `
        <div data-flare-id="fl-0" class="fl-dialog__backdrop">
          <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-dialog', 'fl-dialog--' + this.#prop_size]))}" role="dialog" aria-modal="true" aria-label="${this.#escAttr(this.#prop_title)}">
            <div class="fl-dialog__header">
              ${this.#prop_title ? `
                <h2 class="fl-dialog__title">
                  ${this.#esc(this.#prop_title)}
                </h2>
              ` : ''}
              <slot name="header">
              </slot>
              ${this.#prop_closable ? `
                <button data-flare-id="fl-1" class="fl-dialog__close" aria-label="Close">
                  &times;
                </button>
              ` : ''}
            </div>
            <div class="fl-dialog__body">
              <slot>
              </slot>
            </div>
            <div class="fl-dialog__footer">
              <slot name="footer">
              </slot>
            </div>
          </div>
        </div>
      ` : ''}
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:contents;}.fl-dialog__backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fl-dialog-fade 0.15s ease;}.fl-dialog{background:#fff;border-radius:12px;box-shadow:0 20px 25px rgba(0,0,0,0.15);max-height:85vh;display:flex;flex-direction:column;animation:fl-dialog-slide 0.2s ease;}.fl-dialog--sm{width:min(24rem, 90vw);}.fl-dialog--md{width:min(32rem, 90vw);}.fl-dialog--lg{width:min(48rem, 90vw);}.fl-dialog__header{display:flex;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid #e5e7eb;}.fl-dialog__title{flex:1;margin:0;font-size:1.125rem;font-weight:600;color:#111827;}.fl-dialog__close{border:none;background:none;font-size:1.5rem;color:#6b7280;cursor:pointer;padding:0 0.25rem;line-height:1;border-radius:4px;}.fl-dialog__close:hover{color:#111827;background:#f3f4f6;}.fl-dialog__body{padding:1.25rem;overflow-y:auto;flex:1;}.fl-dialog__footer{padding:0.75rem 1.25rem;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:0.5rem;}.fl-dialog__footer:empty{display:none;}@keyframes fl-dialog-fade{from{opacity:0;}to{opacity:1;}}@keyframes fl-dialog-slide{from{transform:translateY(-12px);opacity:0;}to{transform:translateY(0);opacity:1;}}</style>
      ${this.#prop_open ? `
        <div data-flare-id="fl-0" class="fl-dialog__backdrop">
          <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-dialog', 'fl-dialog--' + this.#prop_size]))}" role="dialog" aria-modal="true" aria-label="${this.#escAttr(this.#prop_title)}">
            <div class="fl-dialog__header">
              ${this.#prop_title ? `
                <h2 class="fl-dialog__title">
                  ${this.#esc(this.#prop_title)}
                </h2>
              ` : ''}
              <slot name="header">
              </slot>
              ${this.#prop_closable ? `
                <button data-flare-id="fl-1" class="fl-dialog__close" aria-label="Close">
                  &times;
                </button>
              ` : ''}
            </div>
            <div class="fl-dialog__body">
              <slot>
              </slot>
            </div>
            <div class="fl-dialog__footer">
              <slot name="footer">
              </slot>
            </div>
          </div>
        </div>
      ` : ''}
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_click = (e) => { this.#handleBackdrop(e); this.#update(); };
        el.addEventListener('click', fn_click);
        this.#listeners.push([el, 'click', fn_click]);
      }
    }
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-1"]');
      if (el) {
        const fn_click = (e) => { this.#handleClose(e); this.#update(); };
        el.addEventListener('click', fn_click);
        this.#listeners.push([el, 'click', fn_click]);
      }
    }
  }

  #bindRefs() {
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-dialog', FlDialog]);
} else {
  customElements.define('fl-dialog', FlDialog);
}

})();


// ── fl-input ──
(() => {
"use strict";

class FlInput extends HTMLElement {
  static formAssociated = true;
  #internals;

  #focused = false;
  #inputEl = null;
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['label', 'placeholder', 'value', 'disabled', 'required', 'error', 'hint'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#internals = this.attachInternals();
  }

  connectedCallback() {
    { const v = this.getAttribute('label'); if (v !== null) this.#prop_label = v || ""; }
    { const v = this.getAttribute('placeholder'); if (v !== null) this.#prop_placeholder = v || ""; }
    { const v = this.getAttribute('value'); if (v !== null) this.#prop_value = v || ""; }
    { const v = this.getAttribute('disabled'); if (v !== null) this.#prop_disabled = v !== null && v !== 'false'; }
    { const v = this.getAttribute('required'); if (v !== null) this.#prop_required = v !== null && v !== 'false'; }
    { const v = this.getAttribute('error'); if (v !== null) this.#prop_error = v || ""; }
    { const v = this.getAttribute('hint'); if (v !== null) this.#prop_hint = v || ""; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'label') { this.#prop_label = newVal || ''; this.#update(); }
    if (name === 'placeholder') { this.#prop_placeholder = newVal || ''; this.#update(); }
    if (name === 'value') { this.#prop_value = newVal || ''; this.#update(); }
    if (name === 'disabled') { this.#prop_disabled = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'required') { this.#prop_required = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'error') { this.#prop_error = newVal || ''; this.#update(); }
    if (name === 'hint') { this.#prop_hint = newVal || ''; this.#update(); }
  }

  formAssociatedCallback(form) {
  }

  formDisabledCallback(disabled) {
  }

  formResetCallback() {
    this.#prop_value = ""
      this.#setFormValue("")
      this.#setValidity({})
  }

  formStateRestoreCallback(state, mode) {
  }

  get form() { return this.#internals.form; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  get willValidate() { return this.#internals.willValidate; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }

  #setFormValue(value, state) {
    this.#internals.setFormValue(value, state);
  }

  #setValidity(flags, message, anchor) {
    this.#internals.setValidity(flags, message, anchor);
  }

  #prop_label = "";
  get label() { return this.#prop_label; }

  #prop_placeholder = "";
  get placeholder() { return this.#prop_placeholder; }

  #prop_value = "";
  get value() { return this.#prop_value; }

  #prop_disabled = false;
  get disabled() { return this.#prop_disabled; }

  #prop_required = false;
  get required() { return this.#prop_required; }

  #prop_error = "";
  get error() { return this.#prop_error; }

  #prop_hint = "";
  get hint() { return this.#prop_hint; }

  #emit_input(detail) {
    this.dispatchEvent(new CustomEvent('input', { detail, bubbles: true, composed: true }));
  }

  #emit_change(detail) {
    this.dispatchEvent(new CustomEvent('change', { detail, bubbles: true, composed: true }));
  }

  #handleInput() {
    this.#prop_value = e.target.this.#prop_value
      this.#emit_input(this.#prop_value)
      this.#setFormValue(this.#prop_value)
      if (this.#prop_required && !this.#prop_value) {
        this.#setValidity({ valueMissing: true }, "Required")
      } else {
        this.#setValidity({})
      }
  }

  #handleChange() {
    this.#emit_change(e.target.this.#prop_value)
  }

  #handleFocus() {
    this.#focused = true
  }

  #handleBlur() {
    this.#focused = false
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:block;}.fl-input{margin-bottom:0.75rem;}.fl-input__label{display:block;font-size:0.875rem;font-weight:500;color:#374151;margin-bottom:0.25rem;}.fl-input__required{color:#ef4444;margin-left:2px;}.fl-input__wrapper{display:flex;align-items:center;border:1px solid #d1d5db;border-radius:6px;background:#fff;transition:border-color 0.15s, box-shadow 0.15s;overflow:hidden;}.fl-input--focused .fl-input__wrapper{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.15);}.fl-input--error .fl-input__wrapper{border-color:#ef4444;}.fl-input--error.fl-input--focused .fl-input__wrapper{box-shadow:0 0 0 3px rgba(239,68,68,0.15);}.fl-input__field{flex:1;border:none;outline:none;padding:0.5rem 0.75rem;font:inherit;font-size:0.875rem;color:#1f2937;background:transparent;}.fl-input__field::placeholder{color:#9ca3af;}.fl-input__field:disabled{cursor:not-allowed;opacity:0.5;}.fl-input__error{font-size:0.75rem;color:#ef4444;margin:0.25rem 0 0;}.fl-input__hint{font-size:0.75rem;color:#6b7280;margin:0.25rem 0 0;}::slotted([slot="prefix"]),::slotted([slot="suffix"]){display:flex;align-items:center;padding:0 0.5rem;color:#6b7280;}</style>
      <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-input', this.#focused ? 'fl-input--focused' : '', this.#prop_error ? 'fl-input--error' : '', this.#prop_disabled ? 'fl-input--disabled' : '']))}">
        ${this.#prop_label ? `
          <label class="fl-input__label">
            ${this.#esc(this.#prop_label)}
            ${this.#prop_required ? `
              <span class="fl-input__required">
                *
              </span>
            ` : ''}
          </label>
        ` : ''}
        <div class="fl-input__wrapper">
          <slot name="prefix">
          </slot>
          <input data-flare-id="fl-0" data-ref="inputEl" class="fl-input__field" value="${this.#escAttr(this.#prop_value)}" placeholder="${this.#escAttr(this.#prop_placeholder)}" ${this.#prop_disabled ? 'disabled' : ''} required="${this.#escAttr(this.#prop_required)}" />
          <slot name="suffix">
          </slot>
        </div>
        ${this.#prop_error ? `
          <p class="fl-input__error">
            ${this.#esc(this.#prop_error)}
          </p>
        ` : ''}
        ${this.#prop_hint ? `
          <p class="fl-input__hint">
            ${this.#esc(this.#prop_hint)}
          </p>
        ` : ''}
      </div>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:block;}.fl-input{margin-bottom:0.75rem;}.fl-input__label{display:block;font-size:0.875rem;font-weight:500;color:#374151;margin-bottom:0.25rem;}.fl-input__required{color:#ef4444;margin-left:2px;}.fl-input__wrapper{display:flex;align-items:center;border:1px solid #d1d5db;border-radius:6px;background:#fff;transition:border-color 0.15s, box-shadow 0.15s;overflow:hidden;}.fl-input--focused .fl-input__wrapper{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.15);}.fl-input--error .fl-input__wrapper{border-color:#ef4444;}.fl-input--error.fl-input--focused .fl-input__wrapper{box-shadow:0 0 0 3px rgba(239,68,68,0.15);}.fl-input__field{flex:1;border:none;outline:none;padding:0.5rem 0.75rem;font:inherit;font-size:0.875rem;color:#1f2937;background:transparent;}.fl-input__field::placeholder{color:#9ca3af;}.fl-input__field:disabled{cursor:not-allowed;opacity:0.5;}.fl-input__error{font-size:0.75rem;color:#ef4444;margin:0.25rem 0 0;}.fl-input__hint{font-size:0.75rem;color:#6b7280;margin:0.25rem 0 0;}::slotted([slot="prefix"]),::slotted([slot="suffix"]){display:flex;align-items:center;padding:0 0.5rem;color:#6b7280;}</style>
      <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-input', this.#focused ? 'fl-input--focused' : '', this.#prop_error ? 'fl-input--error' : '', this.#prop_disabled ? 'fl-input--disabled' : '']))}">
        ${this.#prop_label ? `
          <label class="fl-input__label">
            ${this.#esc(this.#prop_label)}
            ${this.#prop_required ? `
              <span class="fl-input__required">
                *
              </span>
            ` : ''}
          </label>
        ` : ''}
        <div class="fl-input__wrapper">
          <slot name="prefix">
          </slot>
          <input data-flare-id="fl-0" data-ref="inputEl" class="fl-input__field" value="${this.#escAttr(this.#prop_value)}" placeholder="${this.#escAttr(this.#prop_placeholder)}" ${this.#prop_disabled ? 'disabled' : ''} required="${this.#escAttr(this.#prop_required)}" />
          <slot name="suffix">
          </slot>
        </div>
        ${this.#prop_error ? `
          <p class="fl-input__error">
            ${this.#esc(this.#prop_error)}
          </p>
        ` : ''}
        ${this.#prop_hint ? `
          <p class="fl-input__hint">
            ${this.#esc(this.#prop_hint)}
          </p>
        ` : ''}
      </div>
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_input = (e) => { this.#handleInput(e); this.#update(); };
        el.addEventListener('input', fn_input);
        this.#listeners.push([el, 'input', fn_input]);
        const fn_change = (e) => { this.#handleChange(e); this.#update(); };
        el.addEventListener('change', fn_change);
        this.#listeners.push([el, 'change', fn_change]);
        const fn_focus = (e) => { this.#handleFocus(e); this.#update(); };
        el.addEventListener('focus', fn_focus);
        this.#listeners.push([el, 'focus', fn_focus]);
        const fn_blur = (e) => { this.#handleBlur(e); this.#update(); };
        el.addEventListener('blur', fn_blur);
        this.#listeners.push([el, 'blur', fn_blur]);
      }
    }
  }

  #bindRefs() {
    this.#inputEl = this.#shadow.querySelector('[data-ref="inputEl"]');
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-input', FlInput]);
} else {
  customElements.define('fl-input', FlInput);
}

})();


// ── fl-spinner ──
(() => {
"use strict";

class FlSpinner extends HTMLElement {
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['size', 'color', 'label'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    { const v = this.getAttribute('size'); if (v !== null) this.#prop_size = v || "md"; }
    { const v = this.getAttribute('color'); if (v !== null) this.#prop_color = v || "#3b82f6"; }
    { const v = this.getAttribute('label'); if (v !== null) this.#prop_label = v || "Loading"; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'size') { this.#prop_size = newVal || ''; this.#update(); }
    if (name === 'color') { this.#prop_color = newVal || ''; this.#update(); }
    if (name === 'label') { this.#prop_label = newVal || ''; this.#update(); }
  }

  #prop_size = "md";
  get size() { return this.#prop_size; }

  #prop_color = "#3b82f6";
  get color() { return this.#prop_color; }

  #prop_label = "Loading";
  get label() { return this.#prop_label; }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:inline-flex;}.fl-spinner{display:inline-flex;flex-direction:column;align-items:center;gap:0.5rem;}.fl-spinner--sm .fl-spinner__svg{width:1.25rem;height:1.25rem;}.fl-spinner--md .fl-spinner__svg{width:2rem;height:2rem;}.fl-spinner--lg .fl-spinner__svg{width:3rem;height:3rem;}.fl-spinner__svg{animation:fl-spinner-rotate 1s linear infinite;}.fl-spinner__track{stroke:#e5e7eb;}.fl-spinner__circle{stroke-linecap:round;stroke-dasharray:80, 200;stroke-dashoffset:0;animation:fl-spinner-dash 1.5s ease-in-out infinite;}@keyframes fl-spinner-rotate{to{transform:rotate(360deg);}}@keyframes fl-spinner-dash{0%{stroke-dasharray:1, 200;stroke-dashoffset:0;}50%{stroke-dasharray:90, 200;stroke-dashoffset:-35;}100%{stroke-dasharray:90, 200;stroke-dashoffset:-124;}}</style>
      <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-spinner', 'fl-spinner--' + this.#prop_size]))}" role="status" aria-label="${this.#escAttr(this.#prop_label)}">
        <svg class="fl-spinner__svg" viewBox="0 0 50 50">
          <circle class="fl-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="4">
          </circle>
          <circle class="fl-spinner__circle" cx="25" cy="25" r="20" fill="none" stroke-width="4" stroke="${this.#escAttr(this.#prop_color)}">
          </circle>
        </svg>
      </div>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:inline-flex;}.fl-spinner{display:inline-flex;flex-direction:column;align-items:center;gap:0.5rem;}.fl-spinner--sm .fl-spinner__svg{width:1.25rem;height:1.25rem;}.fl-spinner--md .fl-spinner__svg{width:2rem;height:2rem;}.fl-spinner--lg .fl-spinner__svg{width:3rem;height:3rem;}.fl-spinner__svg{animation:fl-spinner-rotate 1s linear infinite;}.fl-spinner__track{stroke:#e5e7eb;}.fl-spinner__circle{stroke-linecap:round;stroke-dasharray:80, 200;stroke-dashoffset:0;animation:fl-spinner-dash 1.5s ease-in-out infinite;}@keyframes fl-spinner-rotate{to{transform:rotate(360deg);}}@keyframes fl-spinner-dash{0%{stroke-dasharray:1, 200;stroke-dashoffset:0;}50%{stroke-dasharray:90, 200;stroke-dashoffset:-35;}100%{stroke-dasharray:90, 200;stroke-dashoffset:-124;}}</style>
      <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-spinner', 'fl-spinner--' + this.#prop_size]))}" role="status" aria-label="${this.#escAttr(this.#prop_label)}">
        <svg class="fl-spinner__svg" viewBox="0 0 50 50">
          <circle class="fl-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="4">
          </circle>
          <circle class="fl-spinner__circle" cx="25" cy="25" r="20" fill="none" stroke-width="4" stroke="${this.#escAttr(this.#prop_color)}">
          </circle>
        </svg>
      </div>
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
  }

  #bindRefs() {
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-spinner', FlSpinner]);
} else {
  customElements.define('fl-spinner', FlSpinner);
}

})();


// ── fl-tabs ──
(() => {
"use strict";

class FlTabs extends HTMLElement {
  #selected = "";
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['items', 'active', 'variant'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    { const v = this.getAttribute('items'); if (v !== null) this.#prop_items = v || ""; }
    { const v = this.getAttribute('active'); if (v !== null) this.#prop_active = v || ""; }
    { const v = this.getAttribute('variant'); if (v !== null) this.#prop_variant = v || "line"; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
    if (this.#prop_active) {
        this.#selected = this.#prop_active
      } else if (this.#tabList.length > 0) {
        this.#selected = this.#tabList[0]
      }
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'items') { this.#prop_items = newVal || ''; this.#update(); }
    if (name === 'active') { this.#prop_active = newVal || ''; this.#update(); }
    if (name === 'variant') { this.#prop_variant = newVal || ''; this.#update(); }
  }

  #prop_items = "";
  get items() { return this.#prop_items; }

  #prop_active = "";
  get active() { return this.#prop_active; }

  #prop_variant = "line";
  get variant() { return this.#prop_variant; }

  get #tabList() { return this.#prop_items.split(",").map(t => t.trim()).filter(Boolean); }

  #emit_change(detail) {
    this.dispatchEvent(new CustomEvent('change', { detail, bubbles: true, composed: true }));
  }

  #handleSelect() {
    this.#selected = name
      this.#emit_change(name)
  }

  #watch_active() {
    this.#selected = this.#prop_active
  }


  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:block;}.fl-tabs__nav{display:flex;gap:0.25rem;margin-bottom:1rem;}.fl-tabs__nav--line{border-bottom:2px solid #e5e7eb;gap:0;}.fl-tabs__tab{padding:0.5rem 1rem;border:none;background:none;font:inherit;font-size:0.875rem;font-weight:500;color:#6b7280;cursor:pointer;transition:color 0.15s, background 0.15s;border-radius:6px;position:relative;}.fl-tabs__nav--line .fl-tabs__tab{border-radius:0;margin-bottom:-2px;border-bottom:2px solid transparent;}.fl-tabs__tab:hover{color:#374151;}.fl-tabs__nav--line .fl-tabs__tab--active{color:#3b82f6;border-bottom-color:#3b82f6;}.fl-tabs__nav--pill .fl-tabs__tab--active{background:#3b82f6;color:#fff;}.fl-tabs__panel{min-height:2rem;}</style>
      <div class="fl-tabs">
        <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-tabs__nav', 'fl-tabs__nav--' + this.#prop_variant]))}" role="tablist">
          ${this.#tabList.map((tab, __idx) => `
            <button data-flare-id="fl-0-${__idx}" class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-tabs__tab', tab === this.#selected ? 'fl-tabs__tab--active' : '']))}" role="tab">
              ${this.#esc(tab)}
            </button>
          `).join('')}
        </div>
        <div class="fl-tabs__panel" role="tabpanel">
          <slot>
          </slot>
        </div>
      </div>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:block;}.fl-tabs__nav{display:flex;gap:0.25rem;margin-bottom:1rem;}.fl-tabs__nav--line{border-bottom:2px solid #e5e7eb;gap:0;}.fl-tabs__tab{padding:0.5rem 1rem;border:none;background:none;font:inherit;font-size:0.875rem;font-weight:500;color:#6b7280;cursor:pointer;transition:color 0.15s, background 0.15s;border-radius:6px;position:relative;}.fl-tabs__nav--line .fl-tabs__tab{border-radius:0;margin-bottom:-2px;border-bottom:2px solid transparent;}.fl-tabs__tab:hover{color:#374151;}.fl-tabs__nav--line .fl-tabs__tab--active{color:#3b82f6;border-bottom-color:#3b82f6;}.fl-tabs__nav--pill .fl-tabs__tab--active{background:#3b82f6;color:#fff;}.fl-tabs__panel{min-height:2rem;}</style>
      <div class="fl-tabs">
        <div class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-tabs__nav', 'fl-tabs__nav--' + this.#prop_variant]))}" role="tablist">
          ${this.#tabList.map((tab, __idx) => `
            <button data-flare-id="fl-0-${__idx}" class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-tabs__tab', tab === this.#selected ? 'fl-tabs__tab--active' : '']))}" role="tab">
              ${this.#esc(tab)}
            </button>
          `).join('')}
        </div>
        <div class="fl-tabs__panel" role="tabpanel">
          <slot>
          </slot>
        </div>
      </div>
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
    // Loop event binding: fl-0
    this.#shadow.querySelectorAll('[data-flare-id^="fl-0-"]').forEach(el => {
      const __idx = parseInt(el.getAttribute('data-flare-id').split('-').pop(), 10);
      const fn_click = (e) => { this.#handleSelect(tab); this.#update(); };
      el.addEventListener('click', fn_click);
      this.#listeners.push([el, 'click', fn_click]);
    });
  }

  #bindRefs() {
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    const __watchFire_active = this.#active !== this.#__prev_active;
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
    if (__watchFire_active) {
      this.#watch_active();
      this.#__prev_active = this.#active;
    }
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-tabs', FlTabs]);
} else {
  customElements.define('fl-tabs', FlTabs);
}

})();


// ── fl-toggle ──
(() => {
"use strict";

class FlToggle extends HTMLElement {
  static formAssociated = true;
  #internals;

  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['checked', 'disabled', 'label', 'size'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#internals = this.attachInternals();
  }

  connectedCallback() {
    { const v = this.getAttribute('checked'); if (v !== null) this.#prop_checked = v !== null && v !== 'false'; }
    { const v = this.getAttribute('disabled'); if (v !== null) this.#prop_disabled = v !== null && v !== 'false'; }
    { const v = this.getAttribute('label'); if (v !== null) this.#prop_label = v || ""; }
    { const v = this.getAttribute('size'); if (v !== null) this.#prop_size = v || "md"; }
    this.#render();
    this.#bindEvents();
    this.#bindRefs();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'checked') { this.#prop_checked = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'disabled') { this.#prop_disabled = newVal !== null && newVal !== 'false'; this.#update(); }
    if (name === 'label') { this.#prop_label = newVal || ''; this.#update(); }
    if (name === 'size') { this.#prop_size = newVal || ''; this.#update(); }
  }

  formAssociatedCallback(form) {
  }

  formDisabledCallback(disabled) {
  }

  formResetCallback() {
    this.#prop_checked = false
      this.#setFormValue("")
  }

  formStateRestoreCallback(state, mode) {
  }

  get form() { return this.#internals.form; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  get willValidate() { return this.#internals.willValidate; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }

  #setFormValue(value, state) {
    this.#internals.setFormValue(value, state);
  }

  #setValidity(flags, message, anchor) {
    this.#internals.setValidity(flags, message, anchor);
  }

  #prop_checked = false;
  get checked() { return this.#prop_checked; }

  #prop_disabled = false;
  get disabled() { return this.#prop_disabled; }

  #prop_label = "";
  get label() { return this.#prop_label; }

  #prop_size = "md";
  get size() { return this.#prop_size; }

  #emit_change(detail) {
    this.dispatchEvent(new CustomEvent('change', { detail, bubbles: true, composed: true }));
  }

  #handleToggle() {
    if (!this.#prop_disabled) {
        this.#prop_checked = !this.#prop_checked
        this.#emit_change(this.#prop_checked)
        this.#setFormValue(this.#prop_checked ? "on" : "")
      }
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:inline-block;}.fl-toggle{display:inline-flex;align-items:center;gap:0.5rem;cursor:pointer;}.fl-toggle--disabled{opacity:0.5;cursor:not-allowed;}.fl-toggle__track{position:relative;border:none;border-radius:999px;background:#d1d5db;cursor:inherit;padding:0;transition:background 0.2s;}.fl-toggle--sm .fl-toggle__track{width:2rem;height:1.125rem;}.fl-toggle--md .fl-toggle__track{width:2.75rem;height:1.5rem;}.fl-toggle__track:focus-visible{outline:2px solid #3b82f6;outline-offset:2px;}.fl-toggle__thumb{position:absolute;top:2px;left:2px;background:#fff;border-radius:50%;transition:transform 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);}.fl-toggle--sm .fl-toggle__thumb{width:0.875rem;height:0.875rem;}.fl-toggle--md .fl-toggle__thumb{width:1.25rem;height:1.25rem;}.fl-toggle--sm .fl-toggle__thumb--on{transform:translateX(0.875rem);}.fl-toggle--md .fl-toggle__thumb--on{transform:translateX(1.25rem);}.fl-toggle__label{font-size:0.875rem;color:#374151;user-select:none;}</style>
      <label class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-toggle', 'fl-toggle--' + this.#prop_size, this.#prop_disabled ? 'fl-toggle--disabled' : '']))}">
        <button data-flare-id="fl-0" class="fl-toggle__track" role="switch" aria-checked="${this.#escAttr(this.#prop_checked ? 'true' : 'false')}" ${this.#prop_disabled ? 'disabled' : ''}>
          <span class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-toggle__thumb', this.#prop_checked ? 'fl-toggle__thumb--on' : '']))}">
          </span>
        </button>
        ${this.#prop_label ? `
          <span class="fl-toggle__label">
            ${this.#esc(this.#prop_label)}
          </span>
        ` : ''}
      </label>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #getNewTree() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>:host{display:inline-block;}.fl-toggle{display:inline-flex;align-items:center;gap:0.5rem;cursor:pointer;}.fl-toggle--disabled{opacity:0.5;cursor:not-allowed;}.fl-toggle__track{position:relative;border:none;border-radius:999px;background:#d1d5db;cursor:inherit;padding:0;transition:background 0.2s;}.fl-toggle--sm .fl-toggle__track{width:2rem;height:1.125rem;}.fl-toggle--md .fl-toggle__track{width:2.75rem;height:1.5rem;}.fl-toggle__track:focus-visible{outline:2px solid #3b82f6;outline-offset:2px;}.fl-toggle__thumb{position:absolute;top:2px;left:2px;background:#fff;border-radius:50%;transition:transform 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);}.fl-toggle--sm .fl-toggle__thumb{width:0.875rem;height:0.875rem;}.fl-toggle--md .fl-toggle__thumb{width:1.25rem;height:1.25rem;}.fl-toggle--sm .fl-toggle__thumb--on{transform:translateX(0.875rem);}.fl-toggle--md .fl-toggle__thumb--on{transform:translateX(1.25rem);}.fl-toggle__label{font-size:0.875rem;color:#374151;user-select:none;}</style>
      <label class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-toggle', 'fl-toggle--' + this.#prop_size, this.#prop_disabled ? 'fl-toggle--disabled' : '']))}">
        <button data-flare-id="fl-0" class="fl-toggle__track" role="switch" aria-checked="${this.#escAttr(this.#prop_checked ? 'true' : 'false')}" ${this.#prop_disabled ? 'disabled' : ''}>
          <span class="${this.#escAttr(((v) => Array.isArray(v) ? v.filter(Boolean).join(' ') : typeof v === 'object' && v !== null ? Object.entries(v).filter(([,b])=>b).map(([k])=>k).join(' ') : String(v || ''))(['fl-toggle__thumb', this.#prop_checked ? 'fl-toggle__thumb--on' : '']))}">
          </span>
        </button>
        ${this.#prop_label ? `
          <span class="fl-toggle__label">
            ${this.#esc(this.#prop_label)}
          </span>
        ` : ''}
      </label>
    `;
    return tpl.content;
  }

  #patch(parent, newContent) {
    const newNodes = Array.from(newContent.childNodes);
    const oldNodes = Array.from(parent.childNodes);
    const max = Math.max(oldNodes.length, newNodes.length);
    for (let i = 0; i < max; i++) {
      const o = oldNodes[i], n = newNodes[i];
      if (!n) { parent.removeChild(o); continue; }
      if (!o) { parent.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
        parent.replaceChild(n.cloneNode(true), o); continue;
      }
      if (o.nodeType === 3) {
        if (o.textContent !== n.textContent) o.textContent = n.textContent;
        continue;
      }
      if (o.nodeType === 1) {
        const oA = o.attributes, nA = n.attributes;
        for (let j = nA.length - 1; j >= 0; j--) {
          const a = nA[j];
          if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
        }
        for (let j = oA.length - 1; j >= 0; j--) {
          if (!n.hasAttribute(oA[j].name)) o.removeAttribute(oA[j].name);
        }
        if (o.tagName === 'STYLE') {
          if (o.textContent !== n.textContent) o.textContent = n.textContent;
          continue;
        }
        this.#patch(o, n);
      }
    }
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_click = (e) => { this.#handleToggle(e); this.#update(); };
        el.addEventListener('click', fn_click);
        this.#listeners.push([el, 'click', fn_click]);
      }
    }
  }

  #bindRefs() {
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#patch(this.#shadow, this.#getNewTree());
    this.#bindEvents();
    this.#bindRefs();
  }

  #updateKeepFocus(focusedEl) {
    this.#update();
  }

  #esc(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"']/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  #escAttr(val) {
    if (val == null) return '';
    const s = String(val);
    if (!/[&<>"'`\n\r]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;');
  }

  #escUrl(val) {
    if (val == null) return '';
    const s = String(val).trim();
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch(e) {}
    const normalized = decoded.replace(/[\s\x00-\x1F]/g, '');
    if (/(javascript|data|vbscript|blob|file)\s*:/i.test(normalized)) return 'about:blank';
    return this.#escAttr(s);
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['fl-toggle', FlToggle]);
} else {
  customElements.define('fl-toggle', FlToggle);
}

})();
