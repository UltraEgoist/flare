# Flare API リファレンス

Flare コンパイラおよび CLI の完全な API ドキュメントです。

---

## 目次

- [コンポーネント構文](#コンポーネント構文)
- [クイックスタート](#クイックスタート)
- [`<meta>` ブロック](#meta-ブロック)
- [`<script>` ブロック](#script-ブロック)
- [`<template>` ブロック](#template-ブロック)
- [`<style>` ブロック](#style-ブロック)
- [コンポーネント間連携](#コンポーネント間連携)
- [CLI コマンド](#cli-コマンド)
- [コンパイラ API (Node.js)](#コンパイラ-api-nodejs)
- [診断コード一覧](#診断コード一覧)
- [セキュリティ](#セキュリティ)

---

## コンポーネント構文

`.flare` ファイルは 4 つのブロックで構成されます。`<template>` のみ必須で、他は省略可能です。

```html
<meta>
  name: "x-my-component"
  shadow: open
</meta>

<script>
  state count: number = 0
  prop label: string = "Click me"
  fn increment() { count = count + 1 }
</script>

<template>
  <button @click="increment">{{ label }}: {{ count }}</button>
</template>

<style>
  button { padding: 8px 16px; }
</style>
```

### ブロックの必須/省略ルール

| ブロック | 必須 | 省略時の動作 |
|----------|------|-------------|
| `<meta>` | いいえ | ファイル名からコンポーネント名を自動推定（例: `my-btn.flare` → `my-btn`）。Shadow DOM は `open` |
| `<script>` | いいえ | state/prop/fn なしの静的コンポーネントとして生成 |
| `<template>` | **はい** | コンパイルエラー `E0001` |
| `<style>` | いいえ | スタイルなしで生成 |

---

## クイックスタート

### 1. プロジェクト作成

```bash
npx flare init my-app
cd my-app
```

### 2. コンポーネントを作成

`src/components/hello-world.flare`:

```html
<meta>
  name: "hello-world"
</meta>

<script>
  state greeting: string = "Hello"
  prop name: string = "World"
  computed message = greeting + ", " + name + "!"
  fn toggle() {
    greeting = greeting === "Hello" ? "Hi" : "Hello"
  }
</script>

<template>
  <div class="card">
    <h2>{{ message }}</h2>
    <button @click="toggle">Toggle Greeting</button>
  </div>
</template>

<style>
  .card { padding: 16px; border: 1px solid #ddd; border-radius: 8px; }
  h2 { margin: 0 0 12px; color: #333; }
  button { padding: 8px 16px; cursor: pointer; }
</style>
```

### 3. ビルド & 使用

```bash
npx flare build src/components

# 生成ファイル:
#   dist/components/hello-world.js
#   dist/flare-bundle.js
```

HTML で使用:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="dist/flare-bundle.js"></script>
</head>
<body>
  <!-- prop を属性で渡す -->
  <hello-world name="Flare"></hello-world>

  <!-- デフォルト値を使用 -->
  <hello-world></hello-world>
</body>
</html>
```

---

## `<meta>` ブロック

コンポーネントのメタ情報を YAML 形式で記述します。

| プロパティ | 型 | デフォルト | 説明 |
|-----------|------|-----------|------|
| `name` | `string` | (ファイル名から推定) | カスタム要素名 |
| `shadow` | `"open" \| "closed" \| "none"` | `"open"` | Shadow DOM モード |

### コンポーネント命名規則

Web Components の仕様に準拠し、以下のルールが適用されます:

- **小文字英数字とハイフンのみ** (`a-z`, `0-9`, `-`)
- **ハイフンを1つ以上含む**（必須）— `my-button` ✓、`button` ✗
- **小文字で始まる** — `x-btn` ✓、`1-btn` ✗
- 大文字は使用不可 — `My-Button` ✗

```
✓ 有効な名前: hello-world, x-button, my-app, data-table-row
✗ 無効な名前: Button, myComponent, x_button, 1-test
```

名前が不正な場合、コンパイルエラー `E0003` が発生します。

### `<meta>` 省略時の動作

`<meta>` ブロックを完全に省略した場合:

- `name`: ファイル名をハイフンケースに変換して使用（例: `counter-btn.flare` → `counter-btn`）
- `shadow`: `"open"`（デフォルト）

最小限のコンポーネント:

```html
<!-- meta なしでも OK（ファイル名が hello-world.flare の場合） -->
<template>
  <p>Hello, World!</p>
</template>
```

### Shadow DOM モード

| モード | 説明 | スタイルの挙動 |
|--------|------|---------------|
| `open` | Shadow DOM あり（外部からアクセス可） | Shadow DOM 内で自動スコーピング |
| `closed` | Shadow DOM あり（外部からアクセス不可） | Shadow DOM 内で自動スコーピング |
| `none` | Shadow DOM なし（Light DOM） | `[data-flare-scope]` 属性で CSS スコーピング |

---

## `<script>` ブロック

### 宣言の種類

#### `state` — リアクティブ状態

コンポーネント内部の状態を管理します。`state` 変数が変更されると自動的にDOMが差分更新されます。

```
state count: number = 0
state items: string[] = []
state user: { name: string, age: number } = { name: "", age: 0 }
state status: "idle" | "loading" | "done" = "idle"
```

生成コードでは `#count` のようなプライベートフィールドに変換されます。テンプレートやfn内では `count` として参照できます。

#### `prop` — 外部プロパティ

親コンポーネント（または HTML）から値を受け取るプロパティです。

```
prop label: string = "Default"
prop size: number = 16
prop disabled: boolean = false
prop id: string = ""
```

**propの渡し方 — HTML属性として渡す:**

```html
<!-- 基本的な prop 渡し -->
<x-password label="パスワード" id="pw-field"></x-password>

<!-- number 型: 文字列から自動変換 (parseFloat) -->
<x-counter size="24"></x-counter>

<!-- boolean 型: 属性の有無で判定 (属性があれば true) -->
<x-button disabled></x-button>
```

**prop 受け取り側の例:**

```html
<meta>name: "x-password"</meta>
<script>
  prop label: string = "Password"
  prop id: string = "password"
  prop placeholder: string = "Enter password..."
  state value: string = ""
</script>
<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input :id="id"
           type="password"
           :placeholder="placeholder"
           :bind="value" />
  </div>
</template>
```

**呼び出し側:**

```html
<x-password label="パスワード"
            id="pw-login"
            placeholder="8文字以上入力"></x-password>
```

**型の自動変換ルール:**

| 宣言型 | HTML属性値 | 変換処理 |
|--------|-----------|---------|
| `string` | `"hello"` | そのまま文字列 |
| `number` | `"42"` | `parseFloat("42")` → `42` |
| `boolean` | 属性の有無 | 属性あり → `true`、なし → `false` |

#### `computed` — 算出プロパティ

```
computed fullName = firstName + " " + lastName
computed total = items.length
computed isValid = name.length > 0 && age > 0
```

依存する `state` / `prop` が変化すると自動的に再計算されます。getter として生成されるため、テンプレート内で `{{ fullName }}` のように参照します。

#### `fn` — メソッド

```
fn increment() {
  count = count + 1
}

fn addItem(name: string) {
  items = [...items, name]
}

fn handleSubmit() {
  emitSubmit({ name: name, email: email })
}
```

テンプレート内のイベントハンドラ (`@click="increment"` など) から呼び出します。fn 内では `state` 変数を直接参照・変更できます（生成コードでは `this.#count` に変換されます）。

#### `watch` — 値の監視

```
watch(count) {
  console.log("count changed to", count)
}

watch(firstName, lastName) {
  fullDisplay = firstName + " " + lastName
}
```

指定した変数の変更時にコールバックを実行します。複数の変数を同時に監視可能です。

#### `emit` — カスタムイベント

```
emit change(value: string)
emit submit
emit select(item: { id: number, name: string })
```

生成されるメソッド名は `emit` + イベント名のキャメルケース（例: `emit change` → `emitChange(detail)`）。

**子コンポーネント（イベント発火側）:**

```html
<meta>name: "x-color-picker"</meta>
<script>
  emit select(color: string)
  fn pickColor(c: string) {
    emitSelect(c)
  }
</script>
<template>
  <button @click="pickColor('red')">Red</button>
  <button @click="pickColor('blue')">Blue</button>
</template>
```

**親コンポーネント（リッスン側）:**

```html
<x-color-picker @select="handleColorSelect"></x-color-picker>
```

#### `ref` — DOM 要素参照

```
ref canvas: HTMLCanvasElement
ref inputEl: HTMLInputElement
```

テンプレート内で `ref="canvas"` を指定した要素への参照を取得します。`connectedCallback` 後に利用可能です。

```html
<template>
  <canvas ref="canvas" width="400" height="300"></canvas>
</template>
```

#### `provide` / `consume` — コンテキスト共有

```
// 親コンポーネント
provide theme: string = "dark"

// 子コンポーネント
consume theme: string
```

Shadow DOM のバウンダリを超えてデータを共有するメカニズムです。

#### `type` — 型エイリアス

```
type Status = "active" | "inactive" | "pending"
type User = { name: string, age: number }
type Item = { id: number, title: string, done: boolean }
```

複雑な型に名前を付けて再利用できます。型チェッカーが検証に使用します。

---

## `<template>` ブロック

### 補間 (`{{ }}`)

```html
<p>{{ count }}</p>
<p>{{ user.name.toUpperCase() }}</p>
<p>{{ items.length > 0 ? items.length + "件" : "なし" }}</p>
```

`{{ }}` 内の式は自動的に HTML エスケープされます（`#esc()` 関数で `&`, `<`, `>`, `"`, `'` を変換）。XSS 防御の基本です。

### 静的属性 vs 動的バインディング

```html
<!-- 静的属性: 値は固定の文字列 -->
<input type="password" class="form-input" placeholder="入力してください">

<!-- 動的バインディング (:attr): 値は JavaScript 式 -->
<input :type="inputType" :class="isActive ? 'active' : ''" :placeholder="hint">

<!-- 区別のポイント:
     class="fixed"    → 常に "fixed" という文字列
     :class="variable" → variable という state/prop/computed の値 -->
```

`:` (コロン) プレフィックスの有無で**文字列リテラル**か**変数参照**かが決まります:

| 記法 | 意味 | 例 |
|------|------|-----|
| `class="active"` | 静的な文字列 `"active"` | 常にクラス `active` が付く |
| `:class="cls"` | 変数 `cls` の値 | state/prop `cls` の値がクラスに |
| `href="/about"` | 静的なURL `/about` | 常に `/about` にリンク |
| `:href="url"` | 変数 `url` の値 | state/prop `url` の値が href に |

### 動的属性バインディング (`:attr`)

```html
<div :class="isActive ? 'active' : ''">...</div>
<input :value="name" :disabled="isLocked">
<a :href="url">Link</a>
<img :src="imageUrl" :alt="imageAlt">
```

URL属性 (`:href`, `:src`) には自動的にURL安全性チェック (`#escUrl`) が適用され、`javascript:`, `data:`, `vbscript:`, `blob:`, `file:` プロトコルがブロックされます。

### 双方向バインディング (`:bind`)

`:bind` はフォーム要素の `value` と `state` 変数を同期します。

```html
<script>
  state username: string = ""
  state bio: string = ""
</script>
<template>
  <!-- input: 入力するたびに state が更新される -->
  <input :bind="username" placeholder="ユーザー名" />
  <p>入力値: {{ username }}</p>

  <!-- textarea でも同様 -->
  <textarea :bind="bio"></textarea>
</template>
```

差分DOM更新により、入力中のフォーカスとカーソル位置は自動的に保持されます。

### イベントハンドラ (`@event`)

```html
<!-- 関数呼び出し -->
<button @click="handleClick">Click</button>

<!-- 引数付き呼び出し -->
<button @click="increment(5)">+5</button>

<!-- インライン式 -->
<button @click="count = count + 1">+1</button>

<!-- 修飾子付き -->
<form @submit|prevent="handleSubmit">...</form>
<input @keydown|enter="search">
<button @click|stop="handleClick">Click</button>
```

**イベント修飾子:**

| 修飾子 | 効果 |
|--------|------|
| `\|prevent` | `e.preventDefault()` |
| `\|stop` | `e.stopPropagation()` |
| `\|enter` | Enter キーのみ反応 |
| `\|escape` | Escape キーのみ反応 |
| `\|space` | Space キーのみ反応 |

修飾子は組み合わせ可: `@keydown|prevent|enter="search"`

**イベントオブジェクトへのアクセス:**

イベントハンドラの引数として `e` を使用:

```html
<input @input="handleInput(e.target.value)">
```

### 条件分岐 (`<#if>`)

```html
<#if cond="isLoggedIn">
  <p>Welcome, {{ username }}!</p>
<:else-if cond="isLoading">
  <p>Loading...</p>
<:else>
  <p>Please log in.</p>
</#if>
```

### ループ (`<#for>`)

```html
<#for each="item, index" of="items" key="item.id">
  <li>{{ index + 1 }}. {{ item.name }}</li>
  <:empty>
    <li>No items found.</li>
  </:empty>
</#for>
```

| 属性 | 必須 | 説明 |
|------|------|------|
| `each` | はい | ループ変数名（`item` または `item, index`） |
| `of` | はい | 配列式 |
| `key` | いいえ | 差分更新用のキー式（省略時はインデックス） |

`<:empty>` は配列が空のときに表示される内容です。

### HTML 直接出力 (`@html`)

```html
<div @html="richContent"></div>
```

エスケープされない HTML を挿入します。**信頼できるデータのみ使用してください**（XSS リスク）。型チェッカーが `W0201` 警告を出力します。

### スロット (`<slot>`)

**コンポーネント定義側:**

```html
<meta>name: "x-card"</meta>
<template>
  <div class="card">
    <header><slot name="header">デフォルトヘッダー</slot></header>
    <main><slot></slot></main>
    <footer><slot name="footer"></slot></footer>
  </div>
</template>
```

**使用側:**

```html
<x-card>
  <h2 slot="header">カードタイトル</h2>
  <p>メインコンテンツ</p>
  <span slot="footer">フッター情報</span>
</x-card>
```

スロットは Shadow DOM モード (`open` / `closed`) でネイティブに動作します。`shadow: none` では Web Component のスロット API が利用できないため注意が必要です。

---

## `<style>` ブロック

```html
<style>
  :host { display: block; }
  .container { padding: 16px; }
  @media (max-width: 768px) {
    .container { padding: 8px; }
  }
</style>
```

### スタイルスコーピング

| Shadow DOM モード | スコーピング方法 |
|------------------|-----------------|
| `open` / `closed` | Shadow DOM が自動的にスタイルを隔離 |
| `none` | CSS セレクタに `[data-flare-scope="tag-name"]` を自動付与 |

`shadow: none` モードでは `:host` セレクタが `[data-flare-scope="tag-name"]` に変換されます。

---

## コンポーネント間連携

### 親 → 子: prop で値を渡す

```html
<!-- 親コンポーネント -->
<x-user-card name="田中太郎" age="30" role="admin"></x-user-card>
```

```html
<!-- x-user-card.flare -->
<meta>name: "x-user-card"</meta>
<script>
  prop name: string = ""
  prop age: number = 0
  prop role: string = "user"
</script>
<template>
  <div class="card">
    <h3>{{ name }}</h3>
    <p>年齢: {{ age }} / 権限: {{ role }}</p>
  </div>
</template>
```

### 子 → 親: emit でイベントを通知

```html
<!-- 子: x-search-box.flare -->
<meta>name: "x-search-box"</meta>
<script>
  emit search(query: string)
  state text: string = ""
  fn doSearch() { emitSearch(text) }
</script>
<template>
  <input :bind="text" @keydown|enter="doSearch" placeholder="検索..." />
  <button @click="doSearch">検索</button>
</template>
```

```html
<!-- 親から使用 -->
<x-search-box @search="handleSearch"></x-search-box>
```

### コンポーネントに id / for などの属性を渡す

`prop` で宣言した属性は HTML 標準属性と同じ名前でも使えます:

```html
<meta>name: "x-field"</meta>
<script>
  prop id: string = ""
  prop label: string = ""
  state value: string = ""
</script>
<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input :id="id" :bind="value" />
  </div>
</template>
```

```html
<!-- 使用側: id と label を外部から渡す -->
<x-field id="email" label="メールアドレス"></x-field>
<x-field id="password" label="パスワード"></x-field>
```

---

## CLI コマンド

### `flare init <name>`

新規プロジェクトを生成します。

```bash
flare init my-app
cd my-app
npm install
npm run dev
```

生成されるディレクトリ構造:

```
my-app/
├── flare.config.json
├── package.json
├── src/
│   ├── components/
│   │   └── app.flare
│   ├── lib/
│   │   └── utils.ts
│   └── index.html
└── dist/
```

プロジェクト名のルール: 小文字英数字、ハイフン、ドット、アンダースコアのみ使用可。

### `flare build [src]`

`.flare` ファイルをコンパイルして Web Component (JS/TS) を生成します。

```bash
flare build                    # flare.config.json の設定を使用
flare build src/components     # ディレクトリを直接指定
flare build --target ts        # TypeScript 出力
```

出力:

- `dist/components/*.js` (または `.ts`) — 個別コンポーネント
- `dist/flare-bundle.js` — 全コンポーネントのバンドル

### `flare check [src]`

型チェックと静的解析を実行します（ファイルは生成しません）。

```bash
flare check
flare check src/components
```

### `flare dev`

開発サーバーを起動します（ライブリロード対応）。

```bash
flare dev
flare dev --port 8080
```

### オプション

```bash
flare --help     # ヘルプ表示
flare --version  # バージョン表示
```

---

## 設定ファイル (`flare.config.json`)

```json
{
  "src": "src/components",
  "outdir": "dist",
  "target": "js",
  "bundle": true
}
```

| プロパティ | 型 | デフォルト | 説明 |
|-----------|------|-----------|------|
| `src` | `string` | `"src/components"` | ソースディレクトリ |
| `outdir` | `string` | `"dist"` | 出力ディレクトリ |
| `target` | `"js" \| "ts"` | `"js"` | 出力フォーマット |
| `bundle` | `boolean` | `true` | バンドルファイル生成 |

設定ファイルが存在しない場合はデフォルト値が使用されます。

---

## コンパイラ API (Node.js)

```javascript
const { compile, splitBlocks, parseTemplateNodes, TypeChecker, generate } = require('flare-cli/lib/compiler');
```

### `compile(source: string, options?: object)`

`.flare` ソースをコンパイルします。

```javascript
const result = compile(`
  <meta>name: "x-hello"</meta>
  <script>prop name: string = "World"</script>
  <template><p>Hello, {{ name }}!</p></template>
`);

if (result.success) {
  console.log(result.output);       // 生成された JS コード
  console.log(result.dts);          // TypeScript 型定義 (target: 'ts' 時)
  console.log(result.diagnostics);  // 警告一覧
} else {
  console.error(result.diagnostics); // エラー一覧
}
```

**Options:**

| プロパティ | 型 | デフォルト | 説明 |
|-----------|------|-----------|------|
| `target` | `"js" \| "ts"` | `"js"` | 出力フォーマット |

**Result:**

| プロパティ | 型 | 説明 |
|-----------|------|------|
| `success` | `boolean` | コンパイル成功フラグ |
| `output` | `string` | 生成コード（成功時） |
| `dts` | `string` | 型定義（TS 出力時） |
| `diagnostics` | `Diagnostic[]` | 診断メッセージ一覧 |
| `meta` | `object` | パースされたメタ情報 |

### `splitBlocks(source: string)`

`.flare` ソースを `<meta>`, `<script>`, `<template>`, `<style>` ブロックに分割します。

```javascript
const blocks = splitBlocks(source);
// blocks.meta, blocks.script, blocks.template, blocks.style
```

### `parseTemplateNodes(html: string)`

テンプレート HTML を AST ノード配列にパースします。

### `TypeChecker`

型チェッカークラス。コンポーネント情報を受け取り、診断メッセージを生成します。

### `generate(component: object, options?: object)`

パース済みコンポーネントから JS/TS コードを生成します。

---

## 診断コード一覧

### エラー (Exxx)

| コード | 説明 |
|--------|------|
| `E0001` | `<template>` ブロックが見つからない |
| `E0002` | `<meta>` の `name` が未定義または不正 |
| `E0003` | コンポーネント名が命名規則に違反 |
| `E0004` | テンプレートのパースエラー |
| `E0101` | 型の不一致 (代入) |
| `E0102` | 型の不一致 (メソッド引数) |
| `E0301` | 未定義の識別子 |
| `E0302` | 型に存在しないメソッド呼び出し |

### 警告 (Wxxx)

| コード | 説明 |
|--------|------|
| `W0101` | 未使用の `state` 変数 |
| `W0201` | `@html` 使用時の XSS 警告 |
| `W0202` | 動的 `:href` / `:src` の URL インジェクション警告 |
| `W0203` | 静的 `id` 属性の重複リスク警告 |

---

## セキュリティ

Flare は生成コードに以下のセキュリティ機構を組み込みます:

| 機構 | 対象 | 説明 |
|------|------|------|
| `#esc()` | `{{ }}` 補間 | HTML テキストの自動エスケープ（`&`, `<`, `>`, `"`, `'`） |
| `#escAttr()` | 動的属性 | 属性値のエスケープ（バッククォート、改行を含む） |
| `#escUrl()` | `:href`, `:src` | URL プロトコルの検証。`javascript:`, `data:`, `vbscript:`, `blob:`, `file:` をブロック |
| CSP ヘッダー | 開発サーバー | `unsafe-eval` を使用しない Content-Security-Policy |
| イベント名検証 | `@event` | 英数字とハイフンのみ許可 |
| コンポーネント名検証 | `<meta>` | Web Components 仕様準拠の名前のみ許可 |

**注意事項:**

- `@html` ディレクティブはエスケープをバイパスするため、ユーザー入力を直接渡さないでください
- 動的 `:href` / `:src` は URL エンコードバイパスにも対応（デコード後にプロトコルチェック）
- CSS インジェクション防止のため、Scoped CSS のタグ名はサニタイズされます
