(() => {
"use strict";

class XSample extends HTMLElement {
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

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>.sample{border:2px solid #e94560;padding:16px;border-radius:8px;margin:12px 0;}h2{color:#e94560;font-size:1rem;margin:0 0 8px;}p{color:#666;margin:0;}</style>
      <div class="sample">
        <h2>
          Sample Component
        </h2>
        <p>
          This is a nested child component.
        </p>
      </div>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #bindEvents() {
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
  __flareDefineQueue.push(['x-sample', XSample]);
} else {
  customElements.define('x-sample', XSample);
}

})();
