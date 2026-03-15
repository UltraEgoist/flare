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
