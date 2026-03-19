# vite-plugin-flare API Reference

Vite で `.flare` ファイルをコンパイルするためのプラグイン。HMR（Hot Module Replacement）対応。

## Installation

```bash
npm install -D vite-plugin-flare @aspect/flare
```

## Setup

```javascript
// vite.config.js
import flare from 'vite-plugin-flare';

export default {
  plugins: [flare()]
};
```

## Options

```javascript
flare({
  target: 'js',       // 出力ターゲット
  optimize: false,     // Tree-shaking 最適化
  sourceMap: true,     // ソースマップ生成
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `'js' \| 'ts'` | `'js'` | コンパイラの出力ターゲット |
| `optimize` | `boolean` | `false` | Tree-shaking 最適化を有効化 |
| `sourceMap` | `boolean` | `true` | ソースマップを生成する |

## Features

### Transform

`.flare` 拡張子のファイルを自動検出し、Flare コンパイラで JavaScript に変換します。

```javascript
// main.js — .flare ファイルをそのまま import 可能
import './components/my-button.flare';
import './components/my-card.flare';
```

### Error Handling

コンパイルエラーは Vite のエラーオーバーレイに表示されます。警告はコンソールに出力されます。

### HMR

`.flare` ファイルの変更を検知し、フルリロードを実行します。将来的には差分更新（fine-grained HMR）に対応予定です。

### Import Resolution

`.flare` ファイルの相対インポートを自動的に解決します。

```javascript
// コンポーネント間の相対インポート
import './child-component.flare';
```

### Source Maps

有効時（デフォルト）、ブラウザの DevTools で `.flare` ソースファイルを直接デバッグできます。

## Compiler Resolution

プラグインは以下の順序でコンパイラを検索します:

1. `@aspect/flare` パッケージ（npm インストール済みの場合）
2. `../flare-cli/lib/compiler`（モノレポ開発時の相対パス）

見つからない場合はエラーをスローします。

## Usage with Flare Router / Store

```javascript
// vite.config.js
import flare from 'vite-plugin-flare';

export default {
  plugins: [flare()],
  resolve: {
    alias: {
      '@aspect/flare-router': '/path/to/flare-router/index.mjs',
      '@aspect/flare-store': '/path/to/flare-store/index.js',
    }
  }
};
```
