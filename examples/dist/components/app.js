(() => {
"use strict";

class XApp extends HTMLElement {
  #count = 0;
  #message = "";
  #shadow;
  #listeners = [];

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

  #increment() {
    this.#count += 1
        this.#message = `カウント: ${this.#count}`
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>.app{font-family:'Segoe UI', system-ui, sans-serif;max-width:520px;margin:40px auto;padding:0 20px;}h1{font-size:1.8rem;margin:0 0 24px;color:#667eea;}h2{font-size:1.1rem;color:#444;margin:20px 0 8px;padding-top:16px;border-top:1px solid #eee;}section{margin-bottom:16px;}.row{display:flex;align-items:center;gap:16px;}.count{font-size:2rem;font-weight:700;color:#667eea;}.msg{margin-top:8px;padding:8px 12px;background:#f0f4ff;border-radius:6px;color:#667eea;font-size:0.85rem;}</style>
      <div class="app">
        <h1>
          Flare フルテスト
        </h1>
        <section>
          <h2>
            1. ネスト
          </h2>
          <x-sample></x-sample>
        </section>
        <section>
          <h2>
            2. emit + prop
          </h2>
          <div class="row">
            <x-counter-btn data-flare-id="fl-0" label="+1"></x-counter-btn>
            <span class="count">
              ${this.#esc(this.#count)}
            </span>
          </div>
          ${this.#message !== '' ? `
            <p class="msg">
              ${this.#esc(this.#message)}
            </p>
          ` : ''}
        </section>
        <section>
          <h2>
            3. ループ + bind
          </h2>
          <x-todo></x-todo>
        </section>
      </div>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_press = (e) => { this.#increment(); this.#update(); };
        el.addEventListener('press', fn_press);
        this.#listeners.push([el, 'press', fn_press]);
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
  __flareDefineQueue.push(['x-app', XApp]);
} else {
  customElements.define('x-app', XApp);
}

})();
