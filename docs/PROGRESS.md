# Flare プロジェクト進捗レポート

最終更新: 2026-03-20

---

## 全体サマリー

Flare は `.flare` ファイルをネイティブ Web Components にコンパイルするテンプレートファースト言語です。コンパイラ、ルーター、ストア、UIライブラリ、Viteプラグイン、VS Code拡張の6パッケージで構成されるモノレポ構成を採用しています。

**現在のステータス: β版相当 — 基本機能は完成、実用可能**

---

## 完了済み機能

### コンパイラ (`flare-cli`)
- 5フェーズコンパイルパイプライン（Split → Parse → TypeCheck → CodeGen → Output）
- リアクティブ state/prop/computed/ref/watch
- テンプレート構文: `{{ }}`, `<#if>`, `<#for>`, `:bind`, `@event`, `@html`, `<slot>`
- イベント修飾子: `|prevent`, `|stop`, `|once`, `|self`, `|enter`, `|escape`
- カスタムイベント emit（bubbles/composed/local オプション）
- 型チェッカー（ジェネリクス対応: `Array<T>`, `Map<K,V>`, `Set<T>`）
- TypeScript 出力 (`--target ts`) + `.d.ts` 生成
- ソースマップ V3
- Diff-based DOM レンダリング（morphdom-lite）
- XSS 保護（テキスト/属性/URL 自動エスケープ）
- エラーバウンダリ (`on error` ライフサイクルフック)
- Form-Associated Custom Elements (ElementInternals)
- IIFE スコープ分離
- i18n メッセージシステム
- 開発サーバー（HMR、ファイル監視、パストラバーサル保護）

### HMR (`flare dev`)
- WebSocket ベースのリアルタイム更新
- Fine-grained HMR: `__flareClasses` レジストリによるコンポーネントレベル更新
- プロトタイプスワップ方式（`Object.setPrototypeOf`）で既存インスタンスを更新
- 状態保存・復元（`__flareState` + 属性バックアップ）
- Blob URL 実行（eval 不使用、CSP 互換）
- `--no-hmr` フラグでフルリロードモードに切替可能
- localhost のみバインド、CSP/CORS ヘッダ設定済み

### ルーター (`flare-router`)
- ハッシュベース SPA ルーティング
- 動的パラメータ (`:id`)、ネストルート、ワイルドカード
- ナビゲーションガード（beforeEach/afterEach/beforeResolve）
- `<flare-router>`, `<flare-route>`, `<flare-link>` Web Components
- URL インジェクション防止（`javascript:`, `data:`, `vbscript:` ブロック）
- ESM/CJS デュアルフォーマット + TypeScript 型定義

### ストア (`flare-store`)
- Flux ライクな actions/getters パターン
- セレクター購読 (`select`)、バッチ更新 (`batch`)
- Undo/Redo（`enableHistory` オプション）
- ミドルウェアシステム（logger 等）
- `combineStores` による複数ストア統合
- deepClone 安全性（深度制限50、循環参照検知）
- ESM/CJS デュアルフォーマット + TypeScript 型定義

### UI ライブラリ (`flare-ui`)
- 9 コンポーネント: fl-button, fl-input, fl-card, fl-dialog, fl-badge, fl-alert, fl-tabs, fl-spinner, fl-toggle
- アクセシビリティ対応（ARIA 属性、キーボード操作、フォーカス管理）
- Shadow DOM + CSS カスタムプロパティによるテーマ
- TypeScript 型定義 + HTMLElementTagNameMap 拡張

### Vite プラグイン (`vite-plugin-flare`)
- `.flare` ファイルの自動コンパイル
- Vite HMR 統合
- import 解決（`import './component.flare'`）
- TypeScript 型定義

### VS Code 拡張 (`flare-vscode`)
- シンタックスハイライト（Flare + 埋め込み TS/CSS）
- リアルタイム診断（未定義変数、型エラー）
- JSDoc ホバードキュメント
- ファイルアイコン

### セキュリティ
- eval() 完全排除（Blob URL 方式に置換）
- URL プロトコル検証（router + compiler）
- CSP ヘッダ設定（`script-src 'self' blob:`）
- CORS 制限（localhost のみ）
- パストラバーサル保護（多重エンコード対策、symlink 検査）
- deepClone スタックオーバーフロー防止
- セキュリティ監査レポート（`docs/security/SECURITY_AUDIT.md`）
- 脆弱性開示ポリシー（`SECURITY.md`）

### ドキュメント
- README.md（英語）+ README.ja.md（日本語）
- Getting Started チュートリアル (`docs/getting-started.md`)
- API リファレンス: compiler, router, store, ui, vite-plugin
- 技術学習ガイド (`docs/LEARNING_GUIDE.md`)
- セキュリティ監査レポート
- CONTRIBUTING.md, CHANGELOG.md

### テスト
- **合計 460 テスト、全パス**
  - コンパイラ: 289
  - CLI: 29
  - E2E: 17
  - ルーター: 37
  - ストア: 32
  - UI: 39
  - Vite プラグイン: 17

### サンプルアプリ
- Todo アプリ (`examples/todo-app/`) — フィルタリング、完了/削除、エラーバウンダリ

---

## 残タスク（インパクト順）

### P1: 高インパクト

| タスク | 内容 | 見積もり |
|--------|------|----------|
| **SSR サポート** | `renderToString()` 関数、ハイドレーション対応。SEO・初期表示速度に直結 | ~40h |
| **LSP (Language Server Protocol)** | `fn` ブロック内の完全な TypeScript 型チェック。VS Code IntelliSense 統合 | ~30h |

### P2: 中インパクト

| タスク | 内容 | 見積もり |
|--------|------|----------|
| **npm パッケージ公開** | .npmignore 整備、パッケージバージョン戦略、CI/CD パイプライン | ~8h |
| **Rust コンパイラ修正** | `flare-compiler-rust/` にビルドエラーあり。WASM 出力で10倍速コンパイル目標 | ~20h |
| **バンドルサイズ最適化** | `--optimize` フラグの実装（tree-shaking、minification） | ~15h |

### P3: 低インパクト（品質向上）

| タスク | 内容 | 見積もり |
|--------|------|----------|
| **Playwright E2E テスト** | 実ブラウザでのコンポーネントレンダリング・イベント検証 | ~12h |
| **追加サンプルアプリ** | ブログ、ダッシュボード、ルーティング付き SPA | ~10h |
| **CSS プリプロセッサ対応** | SCSS/Less の `<style lang="scss">` サポート | ~8h |
| **アクセシビリティ監査** | WCAG 2.1 AA 準拠チェック（UIライブラリ） | ~6h |

### P4: 将来検討

| タスク | 内容 |
|--------|------|
| **ESM バンドル出力** | `format: "esm"` による ES Module バンドル |
| **プラグインシステム** | コンパイラプラグイン API（カスタムディレクティブ等） |
| **デバッグツール** | Chrome DevTools 拡張（状態インスペクタ） |
| **パフォーマンスベンチマーク** | 他フレームワークとのレンダリング速度比較 |

---

## コミット履歴

```
8300767 feat: Getting Startedガイド、SECURITY.md、Fine-grained HMR改善
aed2de1 feat: TypeScript型定義、エラーバウンダリ、ESM/CJS exports整備、Todoデモアプリ
b14d469 security: HMR eval除去、ルーターパス検証、deepClone安全性強化、CSP/CORS制限
520d77e docs: API リファレンスとセキュリティ監査レポートを追加
45fc14c docs: 進捗レポート v2 更新
1422a33 feat: flare-ui コンポーネントライブラリ、型チェッカー改善、進捗レポート
9f201b8 feat: ルーター、ストア、Generic型サポート追加
```
