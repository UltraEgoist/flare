// Flare Bundle - 2026-03-15T05:16:12.769Z
// 4 component(s)

// Deferred registration queue: all classes are defined first,
// then all customElements.define() calls happen at the end.
// This ensures nested components work regardless of file order.
const __flareDefineQueue = [];

// ── app.flare ──
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

// ── counter-btn.flare ──
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

// ── sample.flare ──
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

// ── todo.flare ──
(() => {
"use strict";

class XTodo extends HTMLElement {
  #items = [];
  #text = "";
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

  #add() {
    if (this.#text.trim() === "") return
        this.#items = [...this.#items, this.#text.trim()]
        this.#text = ""
  }

  #remove(index) {
    this.#items = this.#items.filter((t, i) => i !== index)
  }

  #render() {
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>.todo{max-width:360px;}.input-row{display:flex;gap:8px;margin-bottom:12px;}.inp{flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;outline:none;}.inp:focus{border-color:#667eea;}.add{padding:8px 16px;border:none;border-radius:6px;background:#667eea;color:white;cursor:pointer;}ul{list-style:none;padding:0;}.item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;}.del{background:none;border:none;color:#e94560;cursor:pointer;font-size:1.1rem;}.empty{color:#aaa;font-style:italic;padding:12px 0;}</style>
      <div class="todo">
        <div class="input-row">
          <input data-flare-id="fl-0" class="inp" value="${this.#escAttr(this.#text)}" placeholder="追加..." />
          <button data-flare-id="fl-1" class="add">
            追加
          </button>
        </div>
        <ul>
          ${this.#items.length > 0 ? this.#items.map((item, index) => `
            <li class="item">
              <span>
                ${this.#esc(item)}
              </span>
              <button data-flare-id="fl-2-${index}" class="del">
                ×
              </button>
            </li>
          `).join('') : `
            <li class="empty">
              リストは空です
            </li>
          `}
        </ul>
      </div>
    `;
    this.#shadow.replaceChildren(tpl.content.cloneNode(true));
  }

  #bindEvents() {
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-0"]');
      if (el) {
        const fn_keydown = (e) => { if (e.key !== 'Enter') return; this.#add(); this.#update(); };
        el.addEventListener('keydown', fn_keydown);
        this.#listeners.push([el, 'keydown', fn_keydown]);
        const fn_input = (e) => { this.#text = e.target.value; this.#updateKeepFocus(el); };
        el.addEventListener('input', fn_input);
        this.#listeners.push([el, 'input', fn_input]);
      }
    }
    {
      const el = this.#shadow.querySelector('[data-flare-id="fl-1"]');
      if (el) {
        const fn_click = (e) => { this.#add(); this.#update(); };
        el.addEventListener('click', fn_click);
        this.#listeners.push([el, 'click', fn_click]);
      }
    }
    // Loop event binding: fl-2
    this.#shadow.querySelectorAll('[data-flare-id^="fl-2-"]').forEach(el => {
      const __idx = parseInt(el.getAttribute('data-flare-id').split('-').pop(), 10);
      const fn_click = (e) => { this.#remove(__idx); this.#update(); };
      el.addEventListener('click', fn_click);
      this.#listeners.push([el, 'click', fn_click]);
    });
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
  __flareDefineQueue.push(['x-todo', XTodo]);
} else {
  customElements.define('x-todo', XTodo);
}

})();

// Register all components at once (child components are available when parent renders)
__flareDefineQueue.forEach(([tag, cls]) => {
  if (!customElements.get(tag)) customElements.define(tag, cls);
});
