# Changelog

Flare 言語の全変更履歴です。

## [0.2.0] - 2026-03-17

### Added
- **差分DOM更新（Diff-based DOM Rendering）**: `#update()` でフル再レンダリングの代わりに morphdom-lite アルゴリズムによるDOM差分パッチを実装。フォーカス・カーソル位置も自然に保持
- **Scoped CSS**: `shadow: none` モード時に CSS セレクタを `[data-flare-scope="tag-name"]` でスコーピング
- **E2Eテストスイート**: 軽量DOMシミュレーションによるコンポーネント統合テスト 17 件を追加
- **provide/consume 統合テスト**: コンテキスト共有の包括的テスト 17 件を追加
- **VSCode スニペット**: `flare`（雛形）、`flare-minimal` を追加
- **VSCode 属性補完**: 20+ の動的属性（`:placeholder`, `:for`, `:id` 等）とイベント補完を追加
- **npm publish 準備**: package.json の bin/main/files/engines 設定、.npmignore 作成
- **包括的テストスイート**: 合計 216 件（compiler 176 + E2E 17 + CLI 23）

### Security
- **S-01〜S-10**: XSS防御、URL検証、名前バリデーション等 10 件修正
- **S-11**: `#escAttr` の fast-path で改行チェック漏れを修正
- **S-14**: `parseAttrs()` の ReDoS 脆弱性を修正（修飾子数上限を 10 に制限）
- **S-17**: イベントハンドラ式のコードインジェクション防止（eval/Function/文字列リテラル等を禁止）
- **S-23**: 多重URLデコードによるパストラバーサルを防止
- **S-27**: 動的 `on*` イベントハンドラ属性をブロック

### Fixed
- **VSCode fn 解析**: `m[3]` 参照エラーにより全 fn 宣言が未登録になるバグを修正
- **VSCode ホバー**: `<script>` 内の `prop name` に `<meta>` タグのドキュメントが表示される問題を修正（ブロックコンテキスト検出を追加）
- **動的属性の重複**: `:bind` と `:value` が同一要素にある場合の `value` 属性重複を防止
- **ループ内 prop 変換**: `txLoop()` でループ変数と同名の prop/computed/ref が誤変換される問題を修正
- **自動命名**: ファイル名にハイフンが含まれる場合 `x-` プレフィックスを付与しない（`sample-test.flare` → `sample-test`）
- `test` スクリプトから存在しない `test-bugs.js` への参照を削除

---

## [0.1.0] - P0/P1/P2 バグ修正リリース

### Fixed (58 件の修正)

#### P0 — クラッシュ / データ破損 (11 件)
- コンパイラが不正な `<meta>` ブロックでクラッシュする問題
- `shadow: none` モードで `this.#shadow` 参照エラー
- `<#for>` ブロックの `index` 変数が未定義になる問題
- `<#if>` / `<#for>` のネスト時にパースが破損する問題
- `<:empty>` ブロックが `<#for>` 外で使用時にクラッシュ
- `emit` 宣言の不正パースによるコード生成エラー
- TypeScript 出力で `.d.ts` が不正な構文を生成
- `state` の初期値に配列リテラルを使用時のパースエラー
- バンドル生成時にファイル書き込みがクラッシュ
- `--target ts` でオブジェクト型の出力が壊れる問題
- `computed` 式のパースが `=` を含む式で失敗

#### P1 — 不正な出力 / セキュリティ (20 件)
- XSS: `{{ }}` 補間がエスケープされない → `#esc()` 導入
- XSS: 動的属性バインディングがエスケープされない → `#escAttr()` 導入
- XSS: 動的 URL 属性に `javascript:` プロトコルを許可 → `#escUrl()` 導入
- `attributeChangedCallback` が `observedAttributes` 未定義で動作しない
- `prop` のデフォルト値が属性から読み取られない
- `:bind` ディレクティブが `input` イベントをリッスンしない
- イベント修飾子 (`@click|prevent`) が正しくコード生成されない
- `computed` プロパティがリアクティブ更新に含まれない
- Shadow DOM モードで `<style>` が重複挿入される
- `<slot>` 要素のネイティブ動作が確認されていなかった
- TypeScript 出力で型注釈が欠落するケース
- バンドルヘッダーのコンポーネント数カウントが不正
- `@event` ハンドラで引数付き関数呼び出しが壊れる
- `:class` 動的バインディングで三項演算子が動作しない
- `watch` 宣言が複数の依存変数に対応していない
- `provide`/`consume` のコード生成が不完全
- `ref` バインディングの初期化タイミングが不正
- `else-if` チェーンの条件評価順序が間違っている
- `dev` サーバーのパストラバーサル脆弱性
- 静的 `id` 属性の重複警告が出ない

#### P2 — 診断 / DX (27 件)
- 型チェッカーが `for` ループ変数を未定義と報告
- 型チェッカーが文字列リテラル内の識別子を誤検出
- 型チェッカーのオブジェクト型フィールドチェックが不完全
- 型チェッカーが union 型の代入互換性を検証しない
- 型チェッカーが配列要素型の不一致を検出しない
- `null` / `undefined` 型リテラルのパース未対応
- 型エイリアス (`type Name = ...`) の解決が不完全
- number 型に string メソッド呼び出し時のエラーメッセージ改善
- 未使用 `state` 変数の警告が機能しない
- `@html` 使用時の XSS 警告が出ない
- 動的 `:href` / `:src` 属性の URL インジェクション警告
- CLI `check` コマンドの診断出力フォーマット改善
- CLI `build` コマンドのエラーメッセージ改善
- `flare init` の名前バリデーション強化
- 設定ファイルの不正 JSON に対するグレースフルハンドリング
- VSCode 拡張: ホバー情報の説明文改善
- VSCode 拡張: 構文ハイライトパターンの修正
- VSCode 拡張: 診断メッセージの日本語化
- VSCode 拡張: 補完候補のドキュメント追加
- VSCode 拡張: シンボル定義ジャンプの精度向上
- コンパイラ出力の CSS ミニファイ
- バンドルにコンポーネント遅延登録 (`__flareDefineQueue`) 追加
- `connectedCallback` / `disconnectedCallback` の生成改善
- `attributeChangedCallback` の型変換処理
- `#render` メソッドのインデント・フォーマット改善
- テンプレートの空白ノーマライゼーション
- エラーコード体系の整理 (E0xxx / W0xxx)

---

## [0.1.0] - 初回リリース機能

### Added
- **コンパイラ**: `.flare` → Web Component (JS/TS) コンパイルパイプライン
- **テンプレート構文**: `{{ }}` 補間、`<#if>`/`<#else>`/`<#else-if>`、`<#for>`/`<:empty>`
- **ディレクティブ**: `:bind`、`:class`、`:attr`、`@event`（修飾子対応）、`@html`
- **型システム**: `state`、`prop`、`computed`、`fn`、`watch`、`emit`、`ref`、`provide`/`consume`
- **型チェッカー**: プリミティブ型、配列型、オブジェクト型、union 型、型エイリアス
- **Shadow DOM**: `open` / `closed` / `none` モード対応
- **TypeScript 出力**: `--target ts` で `.ts` + `.d.ts` 生成
- **XSS 防御**: 自動エスケープ (`#esc`, `#escAttr`, `#escUrl`)
- **CLI**: `flare init` / `flare build` / `flare check` / `flare dev`
- **Dev サーバー**: ライブリロード、ファイル監視
- **バンドラー**: 全コンポーネントを単一 JS ファイルにバンドル
- **VSCode 拡張**: 構文ハイライト、診断、ホバー、補完、定義ジャンプ、シンボル
- **Rust コンパイラ**: 実験的な Rust 実装 (`flare-compiler-rust`)
