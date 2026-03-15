// ============================================================
// Flare VS Code Extension v0.2.0
// ============================================================

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

let diagnosticCollection;
const documentSymbols = new Map(); // uri -> Map<name, symbol>

function activate(context) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('flare');
  context.subscriptions.push(diagnosticCollection);

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => { if (doc.languageId === 'flare') runDiagnostics(doc); }),
    vscode.workspace.onDidOpenTextDocument(doc => { if (doc.languageId === 'flare') runDiagnostics(doc); }),
    vscode.window.onDidChangeActiveTextEditor(ed => { if (ed?.document.languageId === 'flare') runDiagnostics(ed.document); }),
    vscode.workspace.onDidCloseTextDocument(doc => { diagnosticCollection.delete(doc.uri); documentSymbols.delete(doc.uri.toString()); })
  );

  context.subscriptions.push(vscode.languages.registerHoverProvider('flare', { provideHover }));

  vscode.workspace.textDocuments.forEach(doc => { if (doc.languageId === 'flare') runDiagnostics(doc); });
}

function deactivate() { diagnosticCollection?.dispose(); }

// ═══════════════════════════════════════════
// HOVER DOCS
// ═══════════════════════════════════════════

const HOVER = {
  // ── Script declarations ──
  'state': '**state** — リアクティブ変数\n\n内部状態を宣言します。値を変更するとテンプレートが自動更新されます。\n\n```flare\nstate count: number = 0\nstate name: string = "hello"\nstate items: string[] = []\n```\n\n型注釈と初期値が必須です。',
  'prop': '**prop** — 外部属性\n\n親から受け取る属性を宣言します。HTML属性として反映・監視されます。\n\n```flare\nprop label: string               // 必須\nprop size: number = 16            // デフォルト付き\nprop disabled: boolean = false\n```\n\n型による反映: `string` → getAttribute, `number` → parseFloat, `boolean` → 属性の有無',
  'computed': '**computed** — 派生値\n\nstate/propから自動計算される読み取り専用の値です。依存値が変わると再計算されます。\n\n```flare\ncomputed total: number = items.reduce((s, i) => s + i.price, 0)\ncomputed isValid: boolean = name.length > 0\n```',
  'fn': '**fn** — 関数定義\n\nコンポーネントのメソッドを定義します。内部でstateを変更するとDOMが自動更新されます。\n\n```flare\nfn increment() {\n  count += 1\n}\n\nfn greet(name: string): string {\n  return `Hello, ${name}!`\n}\n\nfn async fetchData() {\n  data = await fetch("/api").then(r => r.json())\n}\n```\n\nテンプレートからは `@click="increment"` のように関数名で参照します。\n`fn` はJavaScriptの `function` ではなく、Flareがリアクティビティを追跡する特別な関数です。\nRust風の短いキーワードを採用し、「Flareの関数」であることを明示しています。',
  'emit': '**emit** — カスタムイベント\n\n親へ通知するイベントを宣言します。CustomEventとしてdispatchされます。\n\n```flare\nemit close: { reason: string }        // デフォルト (bubbles+composed)\nemit(bubbles) notify: void             // バブリングのみ\nemit(composed) select: { id: number }  // Shadow DOM越えのみ\nemit(local) internal: void             // 自身のみ\n```\n\nオプション: `bubbles`, `composed`, `local`\n省略時: `bubbles: true, composed: true`',
  'ref': '**ref** — DOM参照\n\nテンプレート内のDOM要素への直接参照を取得します。\n\n```flare\nref canvas: HTMLCanvasElement\n\non mount {\n  const ctx = canvas.getContext("2d")\n}\n```\n\nテンプレート側: `<canvas ref="canvas" />`',
  'watch': '**watch** — 副作用\n\n値の変更時にDOM以外の副作用を実行します。\n\n```flare\nwatch(count) {\n  localStorage.setItem("count", String(count))\n}\n```',
  'provide': '**provide** — コンテキスト提供\n\n子孫コンポーネントにデータを提供します。\n\n```flare\nprovide theme: Theme = { mode: "dark" }\n```',
  'consume': '**consume** — コンテキスト受信\n\n祖先の `provide` からデータを受信します。\n\n```flare\nconsume theme: Theme\n```',
  'on': '**on** — ライフサイクルフック\n\n```flare\non mount {          // connectedCallback\n  // 初期化処理\n  return () => {}   // クリーンアップ（unmount時に実行）\n}\n\non unmount {        // disconnectedCallback\n}\n\non update(label) {  // attributeChangedCallback\n}\n```',
  'import': '**import** — インポート\n\n他のFlareコンポーネントやTS/JSモジュールを読み込みます。\n\n```flare\nimport XButton from "./button.flare"\nimport { formatDate } from "./utils.ts"\n```\n\nバンドル内ではタグ名で自動参照されるため、import文は省略可能ですが、\n将来のコンパイル時型チェックのために記述を推奨します。',
  'type': '**type** — 型エイリアス\n\nTypeScript互換の型定義です。\n\n```flare\ntype User = { name: string, age: number, email?: string }\ntype Status = "idle" | "loading" | "error"\ntype Result<T> = { ok: true, data: T } | { ok: false, error: string }\n```',
  'async': '**async** — 非同期関数\n\n`fn async` で非同期関数を定義します。\n\n```flare\nfn async fetchUser(id: string) {\n  user = await fetch(`/api/users/${id}`).then(r => r.json())\n}\n```',

  // ── Template directives ──
  '#if': '**#if** — 条件分岐\n\n```flare\n<#if condition="user != null">\n  <p>{{ user.name }}</p>\n<:else-if condition="isLoading">\n  <p>読み込み中...</p>\n<:else>\n  <p>ログインしてください</p>\n</#if>\n```\n\n必須: `condition` 属性',
  '#for': '**#for** — ループ\n\n```flare\n<#for each="item" of="items" key="item.id">\n  <li>{{ item.name }}</li>\n</#for>\n\n// インデックス付き\n<#for each="item, index" of="items" key="item.id">\n  <li>{{ index + 1 }}. {{ item.name }}</li>\n  <:empty>\n    <p>空です</p>\n  </:empty>\n</#for>\n```\n\n必須: `each`, `of`, `key`',

  // ── Directive attributes ──
  'each': '**each** — ループ変数名 (#for 必須)\n\n各要素を受け取る変数名。カンマでインデックスも取得可能。\n\n```\neach="item"          // 要素のみ\neach="item, index"   // 要素 + インデックス\n```',
  'of': '**of** — ループ対象の配列 (#for 必須)\n\nstate/propの配列名を指定します。\n\n```\nof="items"    // state items をループ\n```',
  'key': '**key** — 一意キー (#for 必須)\n\n各アイテムを識別するキー式。DOM更新の効率化に必須。\n\n```\nkey="item.id"   // オブジェクトのIDフィールド\nkey="item"      // プリミティブ値そのもの\n```',
  'condition': '**condition** — 条件式 (#if 必須)\n\nJavaScript式として評価されます。\n\n```\ncondition="user != null"\ncondition="count > 0"\ncondition="status === \'loading\'"\n```',

  // ── Template attributes ──
  ':bind': '**:bind** — 双方向バインディング\n\nフォーム要素とstateを同期します。\n\n```flare\n<input :bind="name" />\n<textarea :bind="desc" />\n<select :bind="selected">...</select>\n```\n\nvalue属性 + input/changeイベントに展開されます。',
  ':class': '**:class** — 動的クラス\n\n```flare\n<div :class="{ active: isActive, bold: isBold }">\n<div :class="[base, isActive && \'active\']">\n```',
  ':style': '**:style** — 動的スタイル\n\n```flare\n<div :style="{ color: textColor, fontSize: `${size}px` }">\n```',
  '@html': '**@html** — 生HTML注入\n\n⚠️ エスケープされません。XSSリスクに注意。\n\n```flare\n<div @html="richContent"></div>\n```\n\n通常の `{{ }}` は自動エスケープされます。',
  'slot': '**slot** — スロット\n\nWeb Component標準。親からコンテンツを挿入できます。\n\n```flare\n// 子: <slot>デフォルト</slot>\n// 子: <slot name="header"></slot>\n// 親: <x-card><h2 slot="header">タイトル</h2></x-card>\n```',

  // ── Meta fields ──
  'name': '**name** — カスタム要素タグ名\n\nハイフンを1つ以上含む必要があります。\n\n```flare\n<meta>\n  name: "x-button"\n</meta>\n```\n\n省略時はファイル名から自動生成されます。',
  'shadow': '**shadow** — Shadow DOMモード\n\n```\nshadow: open     // 外部からアクセス可能（デフォルト）\nshadow: closed   // 外部からアクセス不可\nshadow: none     // Shadow DOM不使用\n```\n\n`none` はTailwind等の外部CSSと併用する場合に便利です。',
};

function provideHover(document, position) {
  const line = document.lineAt(position).text;

  // Try word with @ or : prefix
  let wordRange = document.getWordRangeAtPosition(position, /[@:#][\w-]+(?:\|[\w]+)*/);
  if (!wordRange) wordRange = document.getWordRangeAtPosition(position, /[\w]+/);
  if (!wordRange) return null;
  const word = document.getText(wordRange);

  // Direct match
  if (HOVER[word]) return mkHover(HOVER[word], wordRange);

  // @event with modifiers
  if (word.startsWith('@')) {
    const parts = word.slice(1).split('|');
    const evName = parts[0];
    const mods = parts.slice(1);
    let md = `**@${evName}** — イベントリスナー\n\n\`${evName}\` イベント発火時にハンドラを実行します。\n\n`;
    md += '```flare\n<button @' + word.slice(1) + '="handlerFn">...</button>\n```\n\n';
    md += '値には `fn` で定義した関数名を直接指定します（文字列ではなく関数参照）。\n\n';
    if (mods.length) {
      const modDoc = {
        'prevent': '`e.preventDefault()` — デフォルト動作を防止',
        'stop': '`e.stopPropagation()` — バブリングを停止',
        'once': '一度だけ実行し自動削除',
        'self': 'ターゲットが自分自身の場合のみ',
        'capture': 'キャプチャフェーズで実行',
        'enter': 'Enterキーのみ反応',
        'esc': 'Escapeキーのみ反応',
      };
      md += '**修飾子**:\n';
      mods.forEach(m => { md += `- \`|${m}\` — ${modDoc[m] || '不明な修飾子'}\n`; });
    }
    return mkHover(md, wordRange);
  }

  // :binding
  if (word.startsWith(':') && word.length > 1) {
    const attr = word.slice(1);
    const bindDocs = {
      'bind': '双方向データバインディング。フォーム要素の値とstateを同期。',
      'class': '動的クラス。オブジェクト `{ active: bool }` または配列 `[cls1, cls2]`。',
      'style': '動的スタイル。オブジェクト `{ color: val, fontSize: val }`。',
      'disabled': '動的disabled。`true` で disabled属性を付与、`false` で削除。',
      'checked': '動的checked。チェックボックスの状態を制御。',
      'hidden': '動的hidden。`true` で非表示。',
      'src': '動的src。画像やスクリプトのURLを動的に設定。',
      'href': '動的href。リンク先を動的に設定。',
      'alt': '動的alt。代替テキストを動的に設定。',
      'value': '動的value。一方向の値バインド（:bindとは異なり入力を監視しない）。',
      'placeholder': '動的placeholder。',
    };
    const desc = bindDocs[attr] || `動的属性バインディング。式の結果が \`${attr}\` 属性の値になります。`;
    return mkHover(`**:${attr}** — ${desc}\n\n\`\`\`flare\n<div :${attr}="expression">\n\`\`\``, wordRange);
  }

  // fn keyword special handling
  if (word === 'fn') return mkHover(HOVER['fn'], wordRange);
  if (word === 'async') return mkHover(HOVER['async'], wordRange);
  if (word === 'type') return mkHover(HOVER['type'], wordRange);

  // ── Symbol lookup: show user-defined JSDoc + type info ──
  const uri = document.uri.toString();
  const syms = documentSymbols.get(uri);
  if (syms && syms.has(word)) {
    const sym = syms.get(word);
    let md = '';
    const sourceLabel = { state: 'state', prop: 'prop', computed: 'computed', fn: 'fn', emit: 'emit', ref: 'ref' };
    const kind = sourceLabel[sym.source] || sym.source;

    // Signature line
    if (sym.source === 'fn') {
      const asyncMark = sym.async ? 'async ' : '';
      md += `\`\`\`flare\nfn ${asyncMark}${word}(${sym.params || ''})\n\`\`\`\n\n`;
    } else if (sym.source === 'emit') {
      const opts = sym.options ? `(${sym.options}) ` : '';
      md += `\`\`\`flare\nemit${opts ? `(${sym.options})` : ''} ${word}: ${sym.type}\n\`\`\`\n\n`;
    } else if (sym.source === 'computed') {
      md += `\`\`\`flare\ncomputed ${word}: ${sym.type} = ${sym.expr || '...'}\n\`\`\`\n\n`;
    } else {
      const initStr = sym.init ? ` = ${sym.init}` : '';
      md += `\`\`\`flare\n${kind} ${word}: ${sym.type}${initStr}\n\`\`\`\n\n`;
    }

    // JSDoc description
    if (sym.doc) {
      md += `${sym.doc}\n\n`;
    }

    // Kind badge
    md += `*${kind}* — line ${sym.line}`;

    return mkHover(md, wordRange);
  }

  return null;
}

function mkHover(md, range) {
  const h = new vscode.MarkdownString(md);
  h.isTrusted = true;
  return new vscode.Hover(h, range);
}

// ═══════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════

function runDiagnostics(document) {
  const config = vscode.workspace.getConfiguration('flare');
  if (!config.get('enableDiagnostics', true)) return;

  const source = document.getText();
  const diagnostics = [];

  // Parse blocks
  const blocks = [];
  const blockRe = /<(meta|script|template|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;
  let bm;
  while ((bm = blockRe.exec(source)) !== null) {
    blocks.push({ type: bm[1], content: bm[3], startLine: source.substring(0, bm.index).split('\n').length - 1 });
  }

  if (!blocks.some(b => b.type === 'template')) {
    diagnostics.push(mkDiag(0, 0, 0, 1, '<template> ブロックが見つかりません', 'error'));
    diagnosticCollection.set(document.uri, diagnostics);
    return;
  }

  // ── Build symbol table ──
  const symbols = new Map();
  const scriptBlock = blocks.find(b => b.type === 'script');
  if (scriptBlock) {
    const lines = scriptBlock.content.split('\n');

    // Collect JSDoc comments: /** ... */ above a declaration
    function getJsDoc(lineIndex) {
      let doc = '';
      let j = lineIndex - 1;
      // Single-line: /** comment */
      if (j >= 0 && lines[j].trim().match(/^\/\*\*(.+)\*\/$/)) {
        return lines[j].trim().replace(/^\/\*\*\s*/, '').replace(/\s*\*\/$/, '').trim();
      }
      // Multi-line: /** ... \n * ... \n */
      const collected = [];
      while (j >= 0 && !lines[j].trim().startsWith('/**')) {
        const l = lines[j].trim();
        if (l === '*/') { j--; continue; }
        if (l.startsWith('*')) { collected.unshift(l.replace(/^\*\s?/, '')); j--; continue; }
        break;
      }
      if (j >= 0 && lines[j].trim().startsWith('/**')) {
        const first = lines[j].trim().replace(/^\/\*\*\s?/, '').replace(/\s*\*?\s*$/, '').trim();
        if (first) collected.unshift(first);
        return collected.join('\n').trim();
      }
      return '';
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const docLine = scriptBlock.startLine + i + 1;
      const jsDoc = getJsDoc(i);
      let m;

      if ((m = line.match(/^state\s+(\w+)\s*:\s*([^=]+)\s*=\s*(.+)$/))) {
        symbols.set(m[1], { type: m[2].trim(), source: 'state', line: docLine, init: m[3].trim(), doc: jsDoc });
      } else if ((m = line.match(/^state\s+(\w+)/)) && !line.includes('=')) {
        diagnostics.push(mkDiag(docLine, 0, docLine, line.length, `state '${m[1]}' には初期値（= value）が必要です`, 'error'));
      }
      if ((m = line.match(/^prop\s+(\w+)\s*:\s*([^=]+?)(?:\s*=\s*(.+))?$/)))
        symbols.set(m[1], { type: m[2].trim(), source: 'prop', line: docLine, init: m[3]?.trim(), doc: jsDoc });
      if ((m = line.match(/^computed\s+(\w+)\s*:\s*([^=]+)\s*=\s*(.+)$/)))
        symbols.set(m[1], { type: m[2].trim(), source: 'computed', line: docLine, expr: m[3].trim(), doc: jsDoc });
      if ((m = line.match(/^fn\s+(async\s+)?(\w+)\s*\(([^)]*)\)/)))
        symbols.set(m[2], { type: 'function', source: 'fn', line: docLine, async: !!m[1], params: m[3].trim(), doc: jsDoc });
      if ((m = line.match(/^emit(?:\(([^)]*)\))?\s+(\w+)\s*:\s*(.+)$/)))
        symbols.set(m[2], { type: m[3].trim(), source: 'emit', line: docLine, options: m[1]?.trim(), doc: jsDoc });
      if ((m = line.match(/^ref\s+(\w+)\s*:\s*(.+)$/)))
        symbols.set(m[1], { type: m[2].trim(), source: 'ref', line: docLine, doc: jsDoc });
    }
  }

  // ── Template checks ──
  const templateBlock = blocks.find(b => b.type === 'template');
  if (templateBlock) {
    const tplContent = templateBlock.content;
    const tplLines = tplContent.split('\n');

    // Collect #for loop variables with line ranges
    const loopScopes = []; // { each: string, index?: string, fromLine: number, toLine: number }
    const forOpenRe = /<#for\s+each="([^"]+)"/g;
    let fm;
    while ((fm = forOpenRe.exec(tplContent)) !== null) {
      const eachParts = fm[1].split(',').map(s => s.trim());
      const lineNum = tplContent.substring(0, fm.index).split('\n').length - 1;
      // Find matching </#for>
      const closeIdx = findClose(tplContent, fm.index + fm[0].length, '#for');
      const closeLine = tplContent.substring(0, closeIdx).split('\n').length - 1;
      loopScopes.push({
        each: eachParts[0],
        index: eachParts[1] || null,
        fromLine: lineNum,
        toLine: closeLine,
      });
    }

    const reserved = new Set([
      'true','false','null','undefined','void','typeof','instanceof',
      'new','return','if','else','for','while','const','let','var',
      'function','class','this','super','import','export','from',
      'await','async','try','catch','finally','throw',
      'length','map','filter','reduce','push','pop','trim',
      'includes','indexOf','slice','splice','concat','join','split',
      'toFixed','toString','toUpperCase','toLowerCase','replace','match',
      'startsWith','endsWith','parseInt','parseFloat',
      'String','Number','Boolean','Array','Object','Math','JSON',
      'console','window','document','fetch','Promise','Date','Error',
      'event','e','r','s','i','t','n','ok','data','error',
    ]);

    for (let i = 0; i < tplLines.length; i++) {
      const line = tplLines[i];
      const docLine = templateBlock.startLine + i + 1;

      // Build local scope for this line (loop variables in scope)
      const localSymbols = new Map(symbols);
      for (const scope of loopScopes) {
        if (i >= scope.fromLine && i <= scope.toLine) {
          localSymbols.set(scope.each, { type: 'any', source: 'loop' });
          if (scope.index) localSymbols.set(scope.index, { type: 'number', source: 'loop' });
          // Also add 'index' as common alias
          localSymbols.set('index', { type: 'number', source: 'loop' });
        }
      }

      // Check {{ interpolation }}
      const interpRe = /\{\{\s*(.+?)\s*\}\}/g;
      let im;
      while ((im = interpRe.exec(line)) !== null) {
        const expr = im[1];

        // Method on wrong type
        const methMatch = expr.match(/^(\w+)\.(\w+)\(/);
        if (methMatch) {
          const sym = localSymbols.get(methMatch[1]);
          if (sym) {
            const strMethods = ['toUpperCase','toLowerCase','trim','split','replace','includes','startsWith','endsWith'];
            if (sym.type === 'number' && strMethods.includes(methMatch[2])) {
              const col = im.index + 2;
              diagnostics.push(mkDiag(docLine, col, docLine, col + expr.length,
                `'${methMatch[1]}' は 'number' 型ですが、'${methMatch[2]}' メソッドはありません — String(${methMatch[1]}) を使用してください`, 'error'));
            }
          }
        }

        // Undefined variables
        const ids = expr.match(/\b[a-zA-Z_]\w*\b/g) || [];
        for (const id of ids) {
          if (reserved.has(id)) continue;
          if (localSymbols.has(id)) continue;
          let suggestion = null;
          for (const [key] of localSymbols) { if (lev(id, key) <= 2) { suggestion = key; break; } }
          const col = line.indexOf(id, im.index);
          diagnostics.push(mkDiag(docLine, col >= 0 ? col : 0, docLine, (col >= 0 ? col : 0) + id.length,
            `未定義の識別子 '${id}'${suggestion ? ` — '${suggestion}' のことですか？` : ''}`, 'error'));
        }
      }

      // Check @event handlers reference existing fn
      const eventRe = /@(\w+(?:\|\w+)*)="([^"]*)"/g;
      let em;
      while ((em = eventRe.exec(line)) !== null) {
        const handler = em[2].trim();
        // Extract function name (ignore inline expressions like "count = 0" or "fn(args)")
        const fnName = handler.match(/^(\w+)$/)?.[1] || handler.match(/^(\w+)\s*\(/)?.[1];
        if (fnName && !symbols.has(fnName) && !handler.includes('=')) {
          const col = em.index + em[1].length + 2; // after @event="
          diagnostics.push(mkDiag(docLine, col, docLine, col + handler.length,
            `イベントハンドラ '${fnName}' が <script> 内に定義されていません — fn ${fnName}() { ... } を追加してください`, 'warning'));
        }
      }

      // Check #for required attrs
      if (line.match(/<#for\b/)) {
        if (!line.includes('each='))
          diagnostics.push(mkDiag(docLine, 0, docLine, line.length, '#for: 必須属性 each が不足 — each="変数名"', 'error'));
        if (!line.includes('of='))
          diagnostics.push(mkDiag(docLine, 0, docLine, line.length, '#for: 必須属性 of が不足 — of="配列名"', 'error'));
        if (!line.includes('key='))
          diagnostics.push(mkDiag(docLine, 0, docLine, line.length, '#for: 必須属性 key が不足 — key="一意キー"', 'error'));
      }

      // Check #if required attrs
      if (line.match(/<#if\b/) && !line.includes('condition='))
        diagnostics.push(mkDiag(docLine, 0, docLine, line.length, '#if: 必須属性 condition が不足 — condition="条件式"', 'error'));
    }

    // Unclosed blocks
    const openIf = (tplContent.match(/<#if/g) || []).length;
    const closeIf = (tplContent.match(/<\/#if>/g) || []).length;
    if (openIf > closeIf)
      diagnostics.push(mkDiag(templateBlock.startLine + 1, 0, templateBlock.startLine + 1, 1,
        `未閉じの #if ブロック（開: ${openIf}, 閉: ${closeIf}）`, 'error'));
    const openFor = (tplContent.match(/<#for/g) || []).length;
    const closeFor = (tplContent.match(/<\/#for>/g) || []).length;
    if (openFor > closeFor)
      diagnostics.push(mkDiag(templateBlock.startLine + 1, 0, templateBlock.startLine + 1, 1,
        `未閉じの #for ブロック（開: ${openFor}, 閉: ${closeFor}）`, 'error'));

    // Unused state
    for (const [name, sym] of symbols) {
      if (sym.source !== 'state') continue;
      const re = new RegExp(`\\b${name}\\b`);
      if (re.test(tplContent)) continue;
      // Check script usage
      let usedInScript = false;
      if (scriptBlock) {
        const sLines = scriptBlock.content.split('\n');
        const declIdx = sLines.findIndex(l => l.trim().startsWith(`state ${name}`));
        sLines.forEach((l, idx) => { if (idx !== declIdx && re.test(l)) usedInScript = true; });
      }
      if (!usedInScript)
        diagnostics.push(mkDiag(sym.line, 0, sym.line, 1, `state '${name}' が宣言されましたが使用されていません`, 'warning'));
    }
  }

  // ── Meta validation ──
  const metaBlock = blocks.find(b => b.type === 'meta');
  if (metaBlock) {
    for (const [i, line] of metaBlock.content.split('\n').entries()) {
      const m = line.trim().match(/^\s*name\s*:\s*["']?([^"'\s]+)["']?\s*$/);
      if (m && !m[1].includes('-'))
        diagnostics.push(mkDiag(metaBlock.startLine + i + 1, 0, metaBlock.startLine + i + 1, line.length,
          `カスタム要素名 '${m[1]}' にはハイフンが必要です（例: x-${m[1]}）`, 'error'));
    }
  }

  // Cache symbols for hover provider
  documentSymbols.set(document.uri.toString(), symbols);

  diagnosticCollection.set(document.uri, diagnostics);
}

// ── Helpers ──

function mkDiag(sl, sc, el, ec, msg, level) {
  return new vscode.Diagnostic(
    new vscode.Range(sl, sc, el, ec),
    msg,
    level === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
  );
}

function findClose(content, startPos, blockType) {
  const open = `<${blockType}`, close = `</${blockType}>`;
  let depth = 1, pos = startPos;
  while (depth > 0 && pos < content.length) {
    const no = content.indexOf(open, pos), nc = content.indexOf(close, pos);
    if (nc === -1) return content.length;
    if (no !== -1 && no < nc) { depth++; pos = no + open.length; }
    else { depth--; if (depth === 0) return nc; pos = nc + close.length; }
  }
  return content.length;
}

function lev(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n];
}

module.exports = { activate, deactivate };
