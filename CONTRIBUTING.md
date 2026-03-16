# Contributing to Flare

Flareへのコントリビューションに興味を持っていただきありがとうございます。

## 開発環境のセットアップ

```bash
git clone https://github.com/yourname/flare.git
cd flare
```

### 必要なもの

- Node.js 18以上
- （Rustコンパイラの開発には）Rust 1.75以上

### ディレクトリ構成

```
flare/
├── flare-cli/              ← CLIツール＋コンパイラ（メイン）
│   ├── bin/flare.js        ← CLIコマンド
│   └── lib/compiler.js     ← コンパイラコア
├── flare-vscode/           ← VS Code拡張機能
├── flare-compiler-rust/    ← Rust版コンパイラ（将来の本番用）
├── flare-compiler-ts/      ← TSプロトタイプ（参照用）
└── docs/                   ← ドキュメント
```

### テスト

```bash
# 全テスト実行（コンパイラ 100件 + CLI 23件 = 123件）
npm test

# 構文チェック
npm run lint

# サンプルコンポーネントの型チェック
npm run check

# テストプロジェクトを作成
node flare-cli/bin/flare.js init test-project
cd test-project
node ../flare-cli/bin/flare.js build
node ../flare-cli/bin/flare.js dev
```

## コントリビューションの種類

### バグ報告

GitHub Issues で報告してください。以下の情報があると助かります。

- `.flare` ファイルの内容（最小再現コード）
- 期待する動作
- 実際の動作
- コンパイル出力（`dist/` 内のJS）
- ブラウザのDevToolsコンソールのエラー

### 機能提案

GitHub Issues に Feature Request として投稿してください。

Flareの設計方針として優先されるもの:
- Web Component標準への準拠
- ゼロランタイムの維持
- 直感的な構文（jQueryを使っていたエンジニアにも理解しやすい）
- コンパイル時の安全性（XSS対策、型チェック）

### コード貢献

1. Issue を確認または作成
2. フォーク → ブランチ作成（`feature/xxx` または `fix/xxx`）
3. 変更を実装
4. テスト: `node flare-cli/bin/flare.js build` で既存サンプルが壊れていないことを確認
5. Pull Request を送信

## コンパイラのアーキテクチャ

コンパイラは4つのフェーズで動作します。

```
.flare ファイル
    ↓
Phase 1: splitBlocks()    ← <meta>,<script>,<template>,<style> に分離
    ↓
Phase 2: parseScript()    ← state/prop/fn/emit等をAST化
         parseTemplate()  ← HTMLとディレクティブをノードツリーに
    ↓
Phase 3: TypeChecker      ← 変数の存在・型の一致・未使用を検査
    ↓
Phase 4: generate()       ← Custom Element クラス (JS) を出力
    ↓
.js ファイル
```

### 変更する場合のガイド

- **構文の追加**: `parseScript()` にパターンを追加 → `TypeChecker` にルールを追加 → `generate()` で出力
- **テンプレートディレクティブの追加**: `parseTemplateNodes()` にパターンを追加 → `tplStr()` / `elStr()` で出力
- **CLIコマンドの追加**: `bin/flare.js` の `switch(cmd)` に追加
- **VS Code拡張の変更**: `flare-vscode/extension.js` の診断ロジックまたはホバー情報を更新

### コーディング規約

- インデント: 2スペース
- 文字列: シングルクォート
- セミコロン: あり
- コメント: 日本語または英語

## 未実装の領域（貢献歓迎）

- [ ] **Language Server Protocol**: `fn` 内のTypeScript型チェック
- [x] ~~**差分レンダリング**: 仮想DOM差分による効率的DOM更新~~ → morphdom-lite実装済み
- [ ] **HMR**: WebSocket経由のホットリロード
- [ ] **SSR**: サーバーサイドレンダリング
- [ ] **sourcemap**: コンパイル前後の行マッピング
- [ ] **Rust版コンパイラ**: `flare-compiler-rust/` のビルド・テスト
- [ ] **他エディタの拡張**: JetBrains / Vim / Neovim
- [x] ~~**テストフレームワーク**: コンパイラの自動テスト~~ → 123テスト実装済み

## ライセンス

MIT License で公開しています。コントリビューションも同じライセンスの下で提供されます。
