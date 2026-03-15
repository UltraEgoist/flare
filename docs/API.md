# Flare API リファレンス

Flare コンパイラおよび CLI の API ドキュメントです。

---

## コンポーネント構文

`.flare` ファイルは 4 つのブロックで構成されます:

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

---

## `<meta>` ブロック

コンポーネントのメタ情報を YAML 形式で記述します。

| プロパティ | 型 | デフォルト | 説明 |
|-----------|------|-----------|------|
| `name` | `string` | (必須) | カスタム要素名。`x-` プレフィックス必須 |
| `shadow` | `"open" \| "closed" \| "none"` | `"open"` | Shadow DOM モード |

`shadow: none` の場合、スタイルは `[data-flare-scope]` 属性で自動スコーピングされます。

---

## `<script>` ブロック

### 宣言の種類

#### `state` — リアクティブ状態

```
state count: number = 0
state items: string[] = []
state user: { name: string, age: number } = { name: "", age: 0 }
```

`state` 変数が変更されると、コンポーネントが自動的に再レンダリングされます。

#### `prop` — 外部プロパティ

```
prop label: string = "Default"
prop size: number = 16
prop disabled: boolean = false
```

HTML 属性として外部から値を渡せます: `<x-my-comp label="Hello" size="24">`

属性値は宣言した型に自動変換されます（number → `parseFloat`、boolean → `attr !== null`）。

#### `computed` — 算出プロパティ

```
computed fullName = firstName + " " + lastName
computed total = items.length
```

依存する `state` / `prop` が変化すると自動的に再計算されます。

#### `fn` — メソッド

```
fn increment() {
  count = count + 1
}

fn greet(name: string) {
  console.log("Hello, " + name)
}
```

テンプレート内のイベントハンドラから呼び出せます。

#### `watch` — 値の監視

```
watch(count) {
  console.log("count changed to", count)
}

watch(firstName, lastName) {
  fullDisplay = firstName + " " + lastName
}
```

指定した変数の変更時にコールバックを実行します。

#### `emit` — カスタムイベント

```
emit change(value: string)
emit submit
```

`this.emitChange(value)` のようなメソッドが自動生成されます。親コンポーネントは `@change="handler"` でリッスンできます。

#### `ref` — DOM 要素参照

```
ref canvas: HTMLCanvasElement
```

テンプレート内で `ref="canvas"` を指定した要素を参照できます。`connectedCallback` 後に利用可能です。

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
```

複雑な型に名前を付けて再利用できます。

---

## `<template>` ブロック

### 補間

```html
<p>{{ count }}</p>
<p>{{ user.name.toUpperCase() }}</p>
```

`{{ }}` 内の式は自動的に HTML エスケープされます（XSS 防御）。

### 動的属性バインディング (`:attr`)

```html
<div :class="isActive ? 'active' : ''">...</div>
<input :value="name" :disabled="isLocked">
<a :href="url">Link</a>
```

### 双方向バインディング (`:bind`)

```html
<input :bind="text" />
<textarea :bind="content"></textarea>
```

`input` イベントで自動的に `state` を更新し、再レンダリングします。

### イベントハンドラ (`@event`)

```html
<button @click="handleClick">Click</button>
<button @click="increment(5)">+5</button>
<form @submit|prevent="handleSubmit">...</form>
<input @keydown|enter="search">
```

修飾子: `|prevent` (`preventDefault`), `|stop` (`stopPropagation`), `|enter`, `|escape`, `|space`

### 条件分岐 (`<#if>`)

```html
<#if cond="isLoggedIn">
  <p>Welcome, {{ username }}!</p>
<#else-if cond="isLoading">
  <p>Loading...</p>
<#else>
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

`each`: ループ変数名（`item` または `item, index`）
`of`: 配列式
`key`: 差分更新用のキー式
`<:empty>`: 配列が空の場合に表示される内容

### HTML 直接出力 (`@html`)

```html
<div @html="richContent"></div>
```

エスケープされない HTML を挿入します。信頼できるデータのみ使用してください（XSS リスク）。

### スロット (`<slot>`)

```html
<!-- デフォルトスロット -->
<slot></slot>

<!-- 名前付きスロット -->
<slot name="header"></slot>
<slot name="footer"></slot>
```

Shadow DOM モード（`open` / `closed`）でネイティブに動作します。

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

Shadow DOM モードではスタイルは自動的にスコーピングされます。`shadow: none` モードでは CSS セレクタに `[data-flare-scope="tag-name"]` が自動付与されます。

`:host` セレクタはホスト要素自体にスタイルを適用します。

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
const result = compile('<meta>name: "x-hello"</meta>...');

if (result.ok) {
  console.log(result.code);       // 生成された JS コード
  console.log(result.dts);        // TypeScript 型定義 (target: 'ts' 時)
  console.log(result.diagnostics); // 警告一覧
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
| `ok` | `boolean` | コンパイル成功フラグ |
| `code` | `string` | 生成コード（成功時） |
| `dts` | `string` | 型定義（TS 出力時） |
| `diagnostics` | `Diagnostic[]` | 診断メッセージ一覧 |
| `meta` | `object` | パースされたメタ情報 |

### `splitBlocks(source: string)`

`.flare` ソースを `<meta>`, `<script>`, `<template>`, `<style>` ブロックに分割します。

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
