# Flare 完成度レポート・検証チェックリスト

**作成日:** 2026-03-16
**対象バージョン:** v0.1.0 (commit f629686)

---

## 1. 現状の完成度サマリー

| カテゴリ | 完成度 | 評価 |
|----------|--------|------|
| コンパイラ（JSコード生成） | 85% | ほぼ完成、エッジケース対応済み |
| 型チェッカー | 70% | 基本型チェックは動作、複雑な型推論は未対応 |
| Rustコンパイラ | 40% | ビルドエラーあり（checker.rs修正済み、未検証） |
| CLIツール | 80% | init/build/check/dev 動作確認済み |
| VSCode拡張 | 65% | 構文ハイライト・補完・ホバー・スニペット対応 |
| テストスイート | 75% | 160テスト（compiler 137 + CLI 23）、E2Eテスト未実装 |
| セキュリティ | 80% | 13件の脆弱性修正済み、既知の残課題あり |
| ドキュメント | 75% | API.md大幅拡充済み、チュートリアル不足 |
| 本番運用準備 | 30% | npm publish未、SSR未、Source Map未 |

### 総合評価: **アルファ品質（Alpha）**

ローカル開発での使用は可能。本番Webアプリへの採用には追加の作業が必要。

---

## 2. コンポーネント別の機能状態

### 2.1 コンパイラ (compiler.js — 2,331行)

| 機能 | 状態 | 備考 |
|------|------|------|
| splitBlocks (4ブロック分割) | ✅ 完成 | CRLF正規化、行番号追跡対応 |
| parseTemplateNodes (テンプレートAST) | ✅ 完成 | #if, #for, :else-if, :empty, slot 対応 |
| TypeChecker (型検査) | ⚠️ 基本動作 | プリミティブ型、配列、ユニオン、オブジェクト型対応。ジェネリクス未対応 |
| CodeGen (JS生成) | ✅ 完成 | Shadow DOM 3モード、Scoped CSS、差分DOM更新 |
| CodeGen (TS生成) | ✅ 完成 | .d.ts 生成含む |
| XSSエスケープ | ✅ 完成 | #esc, #escAttr, #escUrl の3段階 |
| 差分DOM更新 | ✅ 完成 | morphdom-lite アルゴリズム |
| イベントバインディング | ✅ 完成 | 修飾子、ループ内ハンドラ対応 |
| 双方向バインディング | ✅ 完成 | :bind で input/textarea |
| provide/consume | ⚠️ 基本動作 | コンテキスト共有、テスト不十分 |
| import 文 | ⚠️ 基本動作 | 構文解析のみ、モジュール解決未実装 |

### 2.2 CLI (flare.js — 895行)

| コマンド | 状態 | 備考 |
|----------|------|------|
| `flare init` | ✅ 完成 | プロジェクト生成、名前検証 |
| `flare build` | ✅ 完成 | 個別JS + バンドル生成 |
| `flare check` | ✅ 完成 | 型チェック・静的解析のみ |
| `flare dev` | ⚠️ 基本動作 | ファイル監視・ライブリロード対応、HMR未実装 |
| `flare --help/--version` | ✅ 完成 | |

### 2.3 VSCode拡張 (extension.js — 1,060行)

| 機能 | 状態 | 備考 |
|------|------|------|
| 構文ハイライト | ✅ 完成 | 4ブロック + Flare固有構文 |
| 自動補完 | ✅ 拡充済み | script/template/attribute/snippet 50+項目 |
| ホバー情報 | ✅ 完成 | キーワード・ディレクティブの説明 |
| エラー診断 | ⚠️ 基本動作 | コンパイラ診断のリアルタイム表示 |
| コードスニペット | ✅ 新規追加 | flare(雛形), flare-minimal |
| 定義ジャンプ | ❌ 未実装 | state/prop への Go to Definition |
| リファクタリング | ❌ 未実装 | 変数名一括変更等 |

---

## 3. セキュリティ状況

### 修正済み (13件)

| ID | 深刻度 | 内容 | 修正状態 |
|----|--------|------|----------|
| S-01 | HIGH | scopeCss() tagName CSS injection | ✅ 修正済み |
| S-02 | HIGH | RegExp injection (escRx) | ✅ 修正済み |
| S-03 | HIGH | Event name injection | ✅ 修正済み |
| S-04 | CRITICAL | #escUrl URL encode bypass | ✅ 修正済み |
| S-05 | HIGH | Component name validation | ✅ 修正済み |
| S-06 | MEDIUM | CSP unsafe-eval in dev server | ✅ 修正済み |
| S-07 | MEDIUM | isInString() backslash handling | ✅ 修正済み |
| S-08 | MEDIUM | txSafe() template literal nesting | ✅ 修正済み |
| S-09 | MEDIUM | Watch dep key sanitization | ✅ 修正済み |
| S-10 | HIGH | Parser error collection | ✅ 修正済み |
| S-11 | HIGH | #escAttr fast-path newline check | ✅ 修正済み |
| S-23 | CRITICAL | Double-encoded path traversal | ✅ 修正済み |
| S-27 | HIGH | Dynamic on* attribute blocking | ✅ 修正済み |

### 既知の残課題

| ID | 深刻度 | 内容 | 推奨対策 |
|----|--------|------|----------|
| S-16 | HIGH | txSafe() テンプレートリテラルのエッジケース | ファズテストで検証 |
| S-17 | HIGH | イベントハンドラ式のコードインジェクション | 式のパース・検証を強化 |
| S-14 | MEDIUM | parseAttrs() ReDoS | パイプの繰り返し回数を制限 |
| S-19 | MEDIUM | CSS セレクタインジェクション（.flareファイル自体が悪意ある場合） | CSPで緩和 |
| S-22 | MEDIUM | dev server symlink TOCTOU | atomic file operations に移行 |

### 設計上の注意事項

- `@html` ディレクティブは意図的にエスケープをバイパスします。ユーザー入力を渡さないでください
- `.flare` ファイル自体は信頼済みソースコードとして扱います（攻撃者が .flare ファイルを書ける場合はコードインジェクション可能）
- dev server はローカル開発専用です。本番環境でのホスティングには使用しないでください

---

## 4. テストカバレッジ

### 現在のテスト (160件)

| カテゴリ | 件数 | カバー範囲 |
|----------|------|-----------|
| splitBlocks | 6 | 4ブロック分割、CRLF、行番号 |
| parseTemplateNodes | 17 | テキスト、補間、要素、属性、#if、#for、ネスト |
| parseType | 7 | プリミティブ、配列、ユニオン、オブジェクト、リテラル |
| TypeChecker | 11 | シンボルテーブル、型不一致、未定義識別子、未使用state |
| compile (基本) | 17 | HTMLElement継承、Shadow DOM、state/prop/computed/emit |
| compile (エラー) | 4 | テンプレート欠損、不正構文 |
| security | 14 | XSS、URL encode、name validation、CSP |
| slot | 3 | デフォルト、名前付き、フォールバック |
| scoped css | 5 | 属性スコープ、:host変換、カンマセレクタ |
| diff DOM | 12 | #getNewTree、#patch、属性差分、テキスト差分、shadow:none |
| integration | 4 | 複合コンポーネント、有効JS出力 |
| edge cases | 31 | 空値、深いネスト、大規模コンポーネント、修飾子 |
| CLI | 23 | init、build、check、設定ファイル |
| **合計** | **160** | |

### 不足しているテスト

| カテゴリ | 優先度 | 内容 |
|----------|--------|------|
| ブラウザE2Eテスト | HIGH | 実際のDOMでコンポーネントが動作するか検証 |
| provide/consume | HIGH | コンテキスト共有の統合テスト |
| dev server | MEDIUM | ライブリロード、ファイル監視のテスト |
| パフォーマンステスト | MEDIUM | 大量コンポーネントのビルド時間、差分DOM更新速度 |
| import 解決 | LOW | モジュール依存関係のテスト |
| Rust コンパイラ | LOW | JS コンパイラとの出力一致検証 |

---

## 5. 今後必要な実装（ロードマップ）

### Phase 1: 本番使用可能にするための必須項目

| # | タスク | 優先度 | 工数目安 |
|---|--------|--------|---------|
| 1 | ブラウザE2Eテスト（Playwright等） | HIGH | 2-3日 |
| 2 | Source Map 対応 | HIGH | 1-2日 |
| 3 | npm publish 準備 (package.json, LICENSE) | HIGH | 0.5日 |
| 4 | エラーメッセージの国際化（日英対応） | MEDIUM | 1日 |
| 5 | HMR（Hot Module Replacement） | MEDIUM | 2-3日 |
| 6 | バンドルサイズ最適化（Tree Shaking） | MEDIUM | 1-2日 |

### Phase 2: 本格運用向け

| # | タスク | 優先度 | 工数目安 |
|---|--------|--------|---------|
| 7 | SSR（Server-Side Rendering） | HIGH | 3-5日 |
| 8 | CSS Modules / CSS-in-JS 対応 | MEDIUM | 2日 |
| 9 | VSCode 定義ジャンプ | MEDIUM | 1-2日 |
| 10 | ジェネリック型サポート | LOW | 2-3日 |

### Phase 3: エコシステム

| # | タスク |
|---|--------|
| 11 | Vite / Webpack プラグイン |
| 12 | ルーターライブラリ |
| 13 | 状態管理ライブラリ |
| 14 | コンポーネントライブラリ |

---

## 6. 動作確認チェックリスト

ユーザーが手動で検証するための項目一覧です。

### 6.1 基本動作

- [ ] `npx flare init test-project` でプロジェクト生成される
- [ ] `cd test-project && npm install` が成功する
- [ ] `npx flare build src/components` でdist/にJSが生成される
- [ ] 生成されたJSファイルの構文が有効（`node -c dist/components/*.js`）
- [ ] index.html で `<script type="module" src="dist/flare-bundle.js">` を読み込み、コンポーネントが表示される

### 6.2 テンプレート機能

- [ ] `{{ variable }}` で値が表示される
- [ ] `<#if cond="...">` で条件分岐が動作する
- [ ] `<#for each="item" of="items">` でリスト表示される
- [ ] `<:empty>` で空配列時のフォールバックが表示される
- [ ] `<:else>` と `<:else-if>` が正しく動作する

### 6.3 リアクティビティ

- [ ] state 変数の変更でDOMが更新される（ボタンクリック等）
- [ ] prop を HTML 属性で渡せる（string, number, boolean）
- [ ] computed が依存値の変更で再計算される
- [ ] `:bind` で input の値と state が同期する
- [ ] フォーカス中の入力フィールドでカーソル位置が保持される

### 6.4 イベント

- [ ] `@click="handler"` でクリックイベントが動作する
- [ ] `@submit|prevent` で preventDefault が適用される
- [ ] `@keydown|enter` で Enter キーのみ反応する
- [ ] `emit` で子→親のカスタムイベントが発火する

### 6.5 Shadow DOM & スタイル

- [ ] `shadow: open` でShadow DOMが生成される
- [ ] `shadow: closed` で外部からアクセス不可
- [ ] `shadow: none` で `[data-flare-scope]` による CSS スコーピング
- [ ] `<slot>` と `<slot name="...">` が動作する

### 6.6 セキュリティ

- [ ] `{{ "<script>alert(1)</script>" }}` がエスケープされる
- [ ] `:href="'javascript:alert(1)'"` が `about:blank` になる
- [ ] `:href="'java%73cript:alert(1)'"` もブロックされる（URL decode後チェック）
- [ ] `:onclick="alert(1)"` がブロックされる（on* 属性フィルタ）
- [ ] 不正なコンポーネント名（`MyComp`、`button`）がエラーになる

### 6.7 CLI & ツール

- [ ] `flare check` が型エラーを検出する
- [ ] `flare dev` で開発サーバーが起動する
- [ ] ファイル変更時に自動再ビルドされる
- [ ] `--target ts` で TypeScript が生成される

### 6.8 VSCode拡張

- [ ] `.flare` ファイルで構文ハイライトが適用される
- [ ] `flare` とタイプしてTABでコンポーネント雛形が挿入される
- [ ] `@click` 等の補完候補が表示される
- [ ] `:placeholder` 等の動的属性補完が表示される
- [ ] キーワードにカーソルを合わせるとホバー情報が表示される

---

## 7. 依存関係

### Node.js コンパイラ

外部依存: **ゼロ** — Node.js 標準ライブラリのみ使用。

### Rust コンパイラ

| クレート | バージョン | 用途 |
|----------|-----------|------|
| regex | 1.x | 正規表現処理 |
| serde | 1.x | シリアライズ |
| serde_json | 1.x | JSON入出力 |

### 生成コード

外部依存: **ゼロ** — Web Components 標準API のみ使用。

ブラウザ互換性:

| 機能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Custom Elements v1 | 67+ | 63+ | 10.1+ | 79+ |
| Shadow DOM v1 | 53+ | 63+ | 10+ | 79+ |
| Private class fields (#) | 74+ | 90+ | 14.1+ | 79+ |
| Template literals | 41+ | 34+ | 9+ | 12+ |

**最小ブラウザバージョン: Chrome 74, Firefox 90, Safari 14.1, Edge 79**

---

## 8. バンドルサイズ

| 項目 | サイズ |
|------|--------|
| コンパイラ (compiler.js) | 94 KB |
| CLI (flare.js) | 23 KB |
| バンドル (8コンポーネント) | 48 KB |
| 個別コンポーネント平均 | 5-7 KB |

生成コードはランタイムライブラリ不要のため、バンドルサイズはコンポーネント数に比例します。
