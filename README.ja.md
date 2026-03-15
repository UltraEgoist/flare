# Flare 🔥

テンプレートファーストのコンパイル型言語。ネイティブWeb Componentにコンパイルします。

シンプルな `.flare` ファイルを書くだけで、ゼロランタイムのCustom Elements（Shadow DOM・スコープ付きCSS・リアクティビティ・型チェック付き）が手に入ります。

```flare
<meta>
  name: "x-counter"
  shadow: open
</meta>

<script>
  /** 現在のカウント値 */
  state count: number = 0

  fn increment() {
    count += 1
  }
</script>

<template>
  <button @click="increment">カウント: {{ count }}</button>
</template>

<style>
  button { padding: 8px 16px; border-radius: 8px; }
</style>
```

## なぜ Flare？

- **ゼロランタイム** — 標準の `HTMLElement` クラスにコンパイル。フレームワーク・仮想DOM・ランタイムライブラリは一切不要。
- **単一ファイルコンポーネント** — `<meta>`, `<script>`, `<template>`, `<style>` を1つの `.flare` ファイルに。
- **どこでも動く** — 出力はバニラWeb Components。React・Vue・Svelte・素のHTMLで利用可能。
- **組み込みリアクティビティ** — `state` の変更が自動的にDOMに反映。
- **スコープ付きCSS** — Shadow DOMでスタイルが自動隔離。
- **型チェック** — 未定義変数・型不一致・typoをコンパイル時に検出。
- **XSS対策済み** — `{{ }}` は自動エスケープ。生HTMLが必要な場合のみ `@html` でオプトイン。

## クイックスタート

```bash
# 1. flare-cli をダウンロードしてディレクトリに入る
cd flare-cli

# 2. 新規プロジェクトを作成
node bin/flare.js init my-app

# 3. ビルド＆起動
cd my-app
node ../bin/flare.js dev
# → http://localhost:3000 をブラウザで開く
```

## 言語概要

### Script 宣言

```flare
<script>
  state count: number = 0            // リアクティブ変数
  prop  label: string = "default"    // 外部属性
  computed total: number = a + b     // 派生値（読み取り専用）
  ref   canvas: HTMLCanvasElement    // DOM参照

  fn increment() { count += 1 }     // メソッド（DOM自動更新）
  fn async fetchData() { ... }       // 非同期メソッド

  emit close: { reason: string }     // カスタムイベント（bubbles + composed）
  emit(local) internal: void         // バブリングしないイベント

  watch(count) { localStorage.setItem("count", String(count)) }

  on mount { console.log("接続完了") }
  on unmount { console.log("切断完了") }
</script>
```

### Template 構文

```flare
<template>
  {{ expression }}                         <!-- テキスト（自動エスケープ） -->
  <img :src="imageUrl" />                  <!-- 動的属性 -->
  <button @click="handler">クリック</button> <!-- イベント -->
  <input :bind="text" />                   <!-- 双方向バインディング -->

  <#if condition="count > 0">              <!-- 条件分岐 -->
    <p>{{ count }} 件</p>
  <:else>
    <p>データなし</p>
  </#if>

  <#for each="item, index" of="items" key="item.id">
    <li>{{ item.name }}</li>               <!-- ループ -->
    <:empty><p>リストは空です</p></:empty>
  </#for>

  <slot name="header"></slot>              <!-- Web Componentスロット -->
</template>
```

### イベント修飾子

```flare
<form @submit|prevent="handleSubmit">
<div @click|stop="handleClick">
<input @keydown|enter="search">
```

### Emit オプション

```flare
emit close: { reason: string }              // デフォルト: bubbles + composed
emit(bubbles) notify: void                  // バブリングのみ
emit(composed) select: { id: number }       // Shadow DOM越えのみ
emit(local) internal: void                  // 自身のみ
```

## ビルド出力

```
dist/
├── flare-bundle.js        ← 全コンポーネントのバンドル（通常これを使用）
└── components/            ← 個別ファイル（単体利用時）
    ├── app.js
    ├── button.js
    └── card.js
```

```html
<!-- 1行で全コンポーネントが使える -->
<script src="dist/flare-bundle.js"></script>
<x-app></x-app>
```

## コンポーネントの合成

テンプレート内でタグ名を書くだけで他のコンポーネントを使用できます。

```flare
<template>
  <x-card title="ユーザー">
    <x-button label="追加" @press="addUser" />
  </x-card>
</template>
```

バンドルは全コンポーネントの `customElements.define` を一括実行するため、ファイル順に関わらずネストが正しく動作します。

## VS Code 拡張機能

シンタックスハイライト・リアルタイム診断・ホバードキュメント・ファイルアイコンを提供します。

```bash
# インストール
cp -r flare-vscode ~/.vscode/extensions/flare-lang-0.1.0
```

機能:
- Flare構文 + 埋め込みTypeScript/CSSのハイライト
- エラー検出: 未定義変数、型不一致、必須属性の欠落
- JSDocホバー: `/** コメント */` を宣言の上に書くとホバーで表示
- `#for` ループ変数のスコープ追跡

## CLIコマンド

| コマンド | 説明 |
|---------|------|
| `flare init <名前>` | 新規プロジェクト作成 |
| `flare dev` | 開発サーバー起動（ファイル監視付き） |
| `flare build` | 本番ビルド |
| `flare check` | 型チェックのみ |

## セキュリティ

- `{{ }}` テキスト補間は `#esc()` でHTMLエスケープ
- 動的属性（`:src`, `:class` 等）は `#escAttr()` でエスケープ
- `@html` のみ意図的に未エスケープ（信頼できるデータにのみ使用）
- 各コンポーネントはIIFEで包まれスコープが隔離

## ロードマップ

- [ ] Language Server Protocol (LSP) による `fn` 内のTypeScript型チェック
- [ ] Rustコンパイラ実装（ソースは `flare-compiler-rust/` に同梱）
- [ ] HMR（Hot Module Replacement）対応
- [ ] SSR（Server-Side Rendering）対応
- [ ] npm パッケージ公開

## ライセンス

MIT
