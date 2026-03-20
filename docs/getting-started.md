# Flare Getting Started ガイド

このガイドでは、Flare を使って最初の Web Component を作成し、ブラウザで動かすまでの手順を説明します。

---

## 前提条件

- **Node.js 18 以上** がインストールされていること
- ターミナル（コマンドプロンプト / PowerShell / bash）が使えること

```bash
node --version   # v18.0.0 以上であることを確認
```

---

## 1. プロジェクトのセットアップ

### 方法 A: `flare init` で自動生成（推奨）

```bash
# リポジトリをクローン
git clone https://github.com/aspect/flare.git
cd flare

# 新しいプロジェクトを作成
node flare-cli/bin/flare.js init my-app
cd my-app
```

これにより以下の構造が生成されます:

```
my-app/
├── src/
│   └── my-app.flare      # メインコンポーネント
├── index.html             # エントリーポイント
└── flare.config.json      # 設定ファイル
```

### 方法 B: 手動セットアップ

```bash
mkdir my-app && cd my-app
mkdir src
```

`flare.config.json` を作成:

```json
{
  "src": "src",
  "out": "dist",
  "bundle": "flare-bundle.js"
}
```

---

## 2. 最初のコンポーネントを作る

`src/hello-world.flare` を作成してください:

```flare
<meta>
name: "hello-world"
shadow: open
</meta>

<script>
state name: string = "World"

fn handleInput(e) {
  name = e.target.value
}
</script>

<template>
  <div class="container">
    <h1>Hello, {{ name }}!</h1>
    <input
      :value="name"
      placeholder="名前を入力..."
      @input="handleInput"
    />
  </div>
</template>

<style>
:host {
  display: block;
  font-family: system-ui, sans-serif;
}
.container {
  max-width: 400px;
  margin: 2rem auto;
  text-align: center;
}
h1 {
  color: #3b82f6;
  font-size: 2rem;
}
input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}
input:focus {
  border-color: #3b82f6;
}
</style>
```

### .flare ファイルの構造

Flare コンポーネントは 4 つのブロックで構成されます:

| ブロック | 役割 |
|----------|------|
| `<meta>` | コンポーネント名、Shadow DOM モードなどの設定 |
| `<script>` | リアクティブな状態、関数、ライフサイクルを定義 |
| `<template>` | HTML テンプレート（`{{ }}` で動的バインディング） |
| `<style>` | Shadow DOM でスコープ化された CSS |

---

## 3. ビルドして動かす

### 開発モード（HMR 付き）

```bash
# プロジェクトのルートに戻り開発サーバーを起動
node ../flare-cli/bin/flare.js dev
```

ブラウザで `http://localhost:3000` を開くと、コンポーネントが表示されます。ファイルを編集するとリアルタイムで更新されます。

### プロダクションビルド

```bash
node ../flare-cli/bin/flare.js build
```

`dist/` フォルダにコンパイル済みの JavaScript が生成されます:

```
dist/
├── flare-bundle.js       # 全コンポーネント（一括読み込み用）
└── components/
    └── hello-world.js    # 個別コンポーネント
```

### HTML で読み込む

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>My Flare App</title>
</head>
<body>
  <hello-world></hello-world>
  <script src="dist/flare-bundle.js"></script>
</body>
</html>
```

---

## 4. 基本的な構文を学ぶ

### リアクティブ state

`state` で宣言した変数が変更されると、テンプレートが自動的に再描画されます。

```flare
<script>
state count: number = 0

fn increment() {
  count += 1
}
</script>

<template>
  <p>{{ count }}</p>
  <button @click="increment">+1</button>
</template>
```

### 外部から値を受け取る prop

`prop` は HTML 属性から値を受け取ります。属性が変わると自動で反映されます。

```flare
<script>
prop label: string = "Click me"
prop variant: string = "primary"
</script>

<template>
  <button :class="variant">{{ label }}</button>
</template>
```

```html
<!-- 使用例 -->
<my-button label="送信" variant="primary"></my-button>
```

### 算出プロパティ computed

`computed` は依存する値から自動計算される読み取り専用のプロパティです。

```flare
<script>
state items: string[] = []
computed total: number = items.length
computed isEmpty: boolean = items.length === 0
</script>
```

### 条件分岐 `<#if>`

```flare
<template>
  <#if condition="count > 0">
    <p>{{ count }} 件のアイテム</p>
  <:else-if condition="loading">
    <p>読み込み中...</p>
  <:else>
    <p>アイテムがありません</p>
  </#if>
</template>
```

### ループ `<#for>`

```flare
<template>
  <ul>
    <#for each="item, index" of="items" key="item.id">
      <li>{{ index + 1 }}. {{ item.name }}</li>
    <:empty>
      <li>リストが空です</li>
    </#for>
  </ul>
</template>
```

### イベント処理

```flare
<script>
fn handleClick() {
  console.log("clicked!")
}

fn handleSubmit() {
  // フォーム送信処理
}
</script>

<template>
  <button @click="handleClick">クリック</button>
  <form @submit|prevent="handleSubmit">
    <!-- |prevent で e.preventDefault() が自動適用 -->
  </form>
</template>
```

利用可能なイベント修飾子:

| 修飾子 | 効果 |
|--------|------|
| `\|prevent` | `event.preventDefault()` |
| `\|stop` | `event.stopPropagation()` |
| `\|once` | 一度だけ発火 |
| `\|self` | `event.target === event.currentTarget` のみ |
| `\|enter` | Enter キーのみ |
| `\|escape` | Escape キーのみ |

### カスタムイベント emit

```flare
<script>
emit close: { reason: string }

fn handleClose() {
  $emit('close', { reason: 'user-action' })
}
</script>
```

```html
<!-- 親側で受信 -->
<my-dialog onclose="handleDialogClose(event)"></my-dialog>
```

### 双方向バインディング :bind

```flare
<script>
state text: string = ""
</script>

<template>
  <input :bind="text" />
  <p>入力: {{ text }}</p>
</template>
```

---

## 5. コンポーネントを組み合わせる

Flare コンポーネントは通常の HTML タグとして使えます。import 不要です。

`src/task-item.flare`:

```flare
<meta>
name: "task-item"
shadow: open
</meta>

<script>
prop label: string = ""
prop done: boolean = false
emit toggle: void
</script>

<template>
  <div :class="done ? 'done' : ''">
    <button @click="$emit('toggle')">
      <#if condition="done">✓<:else>○</#if>
    </button>
    <span>{{ label }}</span>
  </div>
</template>

<style>
.done span { text-decoration: line-through; color: #999; }
button { cursor: pointer; border: none; background: none; font-size: 1.2rem; }
</style>
```

`src/task-list.flare`:

```flare
<meta>
name: "task-list"
shadow: open
</meta>

<script>
state tasks: string[] = ["Learn Flare", "Build an app"]
</script>

<template>
  <h2>タスク一覧</h2>
  <#for each="task, i" of="tasks">
    <task-item :label="task"></task-item>
  </#for>
</template>
```

バンドルが全コンポーネントを登録するので、ファイルの順序を気にする必要はありません。

---

## 6. エコシステム

Flare にはフレームワーク級の機能を提供するパッケージがあります:

### flare-router — SPA ルーティング

```bash
# index.html で読み込む
<script src="flare-router/index.js"></script>
```

```javascript
import { createRouter } from '@aspect/flare-router';

const router = createRouter({
  routes: [
    { path: '/', component: 'page-home' },
    { path: '/about', component: 'page-about' },
    { path: '/users/:id', component: 'user-detail' },
  ]
});
```

テンプレートでルーターコンポーネントを使用:

```html
<flare-router>
  <flare-route></flare-route>
</flare-router>
<flare-link to="/about">About</flare-link>
```

### flare-store — 状態管理

```javascript
import { createStore } from '@aspect/flare-store';

const store = createStore({
  state: { count: 0 },
  actions: {
    increment(state) { return { count: state.count + 1 } }
  },
  getters: {
    doubled(state) { return state.count * 2 }
  }
});
```

undo/redo、ミドルウェア、セレクター購読にも対応しています。

### flare-ui — UIコンポーネントライブラリ

`<fl-button>`, `<fl-input>`, `<fl-dialog>`, `<fl-tabs>` など 9 種類のアクセシブルなコンポーネントが利用可能です。

```html
<fl-button variant="primary" size="md">送信</fl-button>
<fl-dialog open heading="確認">本当に削除しますか？</fl-dialog>
<fl-tabs>
  <fl-tab-panel label="タブ1">内容1</fl-tab-panel>
  <fl-tab-panel label="タブ2">内容2</fl-tab-panel>
</fl-tabs>
```

### vite-plugin-flare — Vite 統合

```javascript
// vite.config.js
import flarePlugin from '@aspect/vite-plugin-flare';

export default {
  plugins: [flarePlugin({ src: 'src' })]
};
```

Vite の HMR と組み合わせてシームレスな開発体験を実現します。

---

## 7. VS Code サポート

```bash
cp -r flare-vscode ~/.vscode/extensions/flare-lang-0.1.0
```

提供される機能:

- `.flare` ファイルのシンタックスハイライト
- リアルタイムのエラー検出（未定義変数、型エラー）
- JSDoc ホバードキュメント
- ファイルアイコン

---

## 8. Vite で使う

Vite プロジェクトと組み合わせる場合:

```bash
npm create vite@latest my-vite-app -- --template vanilla
cd my-vite-app
```

`vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import flarePlugin from '../vite-plugin-flare';

export default defineConfig({
  plugins: [flarePlugin({ src: 'src' })]
});
```

これで `.flare` ファイルを通常のモジュールとして import できます:

```javascript
import './components/my-counter.flare';
```

---

## 9. 型チェック

Flare コンパイラには組み込みの型チェッカーがあります:

```bash
node flare-cli/bin/flare.js check
```

検出される問題:

- 未定義変数の参照
- 型の不一致（number に string を代入など）
- 未宣言の prop 属性の使用
- テンプレート内の無効な変数参照

```flare
<script>
state count: number = 0
</script>

<template>
  <!-- ⚠ "cont" は未定義 → コンパイルエラー -->
  <p>{{ cont }}</p>
</template>
```

### 対応する型

`string`, `number`, `boolean`, `void`, `any`, `string[]`, `number[]`, `Array<T>`, `Map<K,V>`, `Set<T>`, `Record<K,V>`, `HTMLElement` およびその派生型

---

## 10. デバッグのヒント

### エラーバウンダリ

コンポーネントに `on error` ハンドラを追加すると、ランタイムエラーをキャッチしてフォールバック UI を表示できます:

```flare
<script>
state data: any = null

fn async loadData() {
  const res = await fetch('/api/data')
  data = await res.json()
}

on mount {
  loadData()
}

on error {
  console.error("Component error:", error)
}
</script>
```

### 開発サーバーの HMR

`flare dev` はファイル変更を検知して、変更されたコンポーネントだけをブラウザに送信します。状態は可能な限り保持されます。

HMR を無効にしたい場合:

```bash
node flare-cli/bin/flare.js dev --no-hmr
```

---

## 次のステップ

- [API リファレンス](api/) — 各パッケージの詳細な API ドキュメント
- [技術学習ガイド](LEARNING_GUIDE.md) — コンパイラの内部構造を学ぶ
- [セキュリティ監査レポート](security/SECURITY_AUDIT.md) — セキュリティ設計の詳細
- [Todo アプリ例](../examples/todo-app/) — 実用的なサンプルアプリ

---

## トラブルシューティング

### イベントハンドラで文字列が使えない

Flare のテンプレートでは、イベントハンドラに文字列リテラルやインライン関数は書けません。代わりに名前付き関数を使ってください:

```flare
<!-- ✗ これはエラー -->
<button @click="setFilter('all')">All</button>

<!-- ✓ 名前付き関数を使う -->
<script>
fn setFilterAll() {
  filter = "all"
}
</script>
<template>
  <button @click="setFilterAll">All</button>
</template>
```

### Shadow DOM 内で外部 CSS が効かない

`shadow: open` のコンポーネントは Shadow DOM 内にスタイルが閉じています。外部のグローバル CSS は影響しません。コンポーネント内の `<style>` ブロックでスタイルを定義してください。

### コンポーネントが表示されない

1. `<meta>` の `name` がハイフンを含む有効なカスタム要素名になっているか確認
2. HTML 内のタグ名と `name` が一致しているか確認
3. `dist/flare-bundle.js` がロードされているか確認（ブラウザのコンソールを確認）
