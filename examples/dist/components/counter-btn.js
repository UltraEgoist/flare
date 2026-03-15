(() => {
"use strict";

class XCounterBtn extends HTMLElement {
  #shadow;
  #listeners = [];

  static get observedAttributes() {
    return ['label'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
  }

  disconnectedCallback() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'label') { this.#prop_label = newVal || ''; this.#update(); }
  }

  #prop_label = "+1";
  get label() { return this.#prop_label; }

  #emit_press(detail) {
    this.dispatchEvent(new CustomEvent('press', { detail, bubbles: true, composed: true }));
  }

  #handleClick() {
    this.#emit_press()
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>.btn{padding:10px 24px;border:none;border-radius:8px;background:#667eea;color:white;font-size:1rem;cursor:pointer;}.btn:hover{background:#5a6fd6;}</style>
      <button data-flare-id="fl-0" class="btn">
        ${this.#esc(this.#prop_label)}
      </button>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_click = (e) => { this.#handleClick(); this.#update(); };
        el.addEventListener('click', fn_click);
        this.#listeners.push([el, 'click', fn_click]);
      }
    }
  }

  #update() {
    this.#listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this.#listeners = [];
    this.#render();
    this.#bindEvents();
  }

  #updateKeepFocus(focusedEl) {
    const fid = focusedEl?.getAttribute('data-flare-id');
    const selStart = focusedEl?.selectionStart;
    const selEnd = focusedEl?.selectionEnd;
    this.#update();
    if (fid) {
      const el = this.#shadow.querySelector(`[data-flare-id="${fid}"]`);
      if (el) { el.focus(); if (selStart != null) { el.selectionStart = selStart; el.selectionEnd = selEnd; } }
    }
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
    if (!/[&<>"'`]/.test(s)) return s;
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;');
  }
}

if (typeof __flareDefineQueue !== 'undefined') {
  __flareDefineQueue.push(['x-counter-btn', XCounterBtn]);
} else {
  customElements.define('x-counter-btn', XCounterBtn);
}

})();
