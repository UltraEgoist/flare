# Flare Framework セキュリティ監査レポート

**監査日:** 2026-03-19
**対象バージョン:** 0.1.0
**対象範囲:** flare-cli, flare-router, flare-store, flare-ui, vite-plugin-flare

---

## 総合評価

| カテゴリ | リスクレベル | 状態 |
|---------|-------------|------|
| XSS（クロスサイトスクリプティング） | LOW | 対策済み |
| コードインジェクション | CRITICAL | 要対応（HMR の eval） |
| パストラバーサル | LOW | 多層防御済み |
| プロトタイプ汚染 | LOW | 対策済み |
| ReDoS（正規表現DoS） | LOW | 安全なパターン |
| オープンリダイレクト | MEDIUM | 要対応 |
| CORS / CSP | MEDIUM | 開発環境で緩い設定 |
| 依存関係の脆弱性 | NONE | 外部依存ゼロ |

**総合スコア:** 外部依存ゼロかつテンプレートXSS対策が堅固。HMRのeval使用とルーターのパス検証が主要な改善点。

---

## CRITICAL: HMR ランタイムの eval() 使用

**ファイル:** `flare-cli/bin/flare.js` (HMR WebSocket ハンドラ)

**問題:** 開発サーバーの HMR（Hot Module Replacement）機能で、WebSocket 経由で受け取ったコード文字列を `eval()` で実行している。

**リスク:**
- ローカルネットワーク上の攻撃者が WebSocket メッセージを改ざんし、任意のコードを実行可能
- WSS（TLS）が強制されていないため、中間者攻撃のリスクあり

**影響範囲:** 開発環境のみ（本番ビルドには含まれない）

**推奨対応:**
1. WebSocket 接続を `127.0.0.1` にバインドし、外部からの接続を拒否
2. WebSocket メッセージに HMAC 署名を付与し、改ざんを検知
3. `eval()` の代わりにモジュール再読み込み（dynamic import）を使用

---

## HIGH: ルーターのオープンリダイレクト

**ファイル:** `flare-router/index.mjs` (`navigate` 関数)

**問題:** `router.push()` でプロトコルスキームの検証が行われていない。

```javascript
// 攻撃例
router.push('javascript:alert(1)');      // XSS
router.push('//attacker.com/phishing');   // オープンリダイレクト
router.push('data:text/html,...');        // データURL
```

**推奨対応:**
```javascript
function isValidPath(to) {
  if (typeof to !== 'string') return false;
  // プロトコルスキームを拒否
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(to)) return false;
  // プロトコル相対URLを拒否
  if (to.startsWith('//')) return false;
  return true;
}
```

---

## HIGH: deepClone の深度制限なし

**ファイル:** `flare-store/index.js:424-436`

**問題:** `deepClone()` に再帰深度の制限がなく、循環参照や深くネストされたオブジェクトでスタックオーバーフローが発生する。

```javascript
// 攻撃例
const a = {};
a.self = a; // 循環参照 → スタックオーバーフロー
store.setState(a);
```

**推奨対応:**
```javascript
function deepClone(obj, depth = 0) {
  if (depth > 50) throw new Error('deepClone: maximum depth exceeded');
  if (obj === null || typeof obj !== 'object') return obj;
  // 循環参照検出用の WeakSet も追加
  ...
}
```

---

## MEDIUM: 開発サーバーの CSP / CORS 設定

**ファイル:** `flare-cli/bin/flare.js:947-952`

**問題:**
- `Access-Control-Allow-Origin: *` で全オリジンからの要求を許可
- CSP に `'unsafe-inline'` が含まれ、インラインスクリプトが許可

**影響:** 開発環境のみだが、同一ネットワーク上の他デバイスからの攻撃ベクタになりうる。

**推奨対応:**
- `Access-Control-Allow-Origin` を `http://localhost:*` に制限
- CSP の nonce ベース対応を検討

---

## 実装済みセキュリティ対策（良好）

### テンプレート XSS 対策

コンパイラが生成するコードでは、テンプレート補間 `{{ expr }}` の出力が常に `#esc()` 関数でエスケープされます。

```javascript
// 生成コード内
#esc(expr)  // HTML エンティティエスケープ: <, >, &, ", '
```

また、属性値には `#escAttr()`、URL 値には `#escUrl()` が使用されています。

### イベントハンドラー検証

型チェッカーがイベントハンドラ属性（`@click` 等）に対して以下を検証します:

- `eval`, `Function()`, `constructor`, `__proto__`, `prototype` の拒否
- セミコロン（複数文）の拒否
- 文字列リテラルの拒否（コード隠蔽防止）
- テンプレートリテラルの拒否

### パストラバーサル多層防御

開発サーバーは以下の5段階で防御しています:

1. 多重 URL デコード対策（ループでデコードし、`..` や `\0` を検出）
2. `path.resolve()` による正規化
3. シンリンク検出（`lstatSync` → `realpathSync`）
4. `allowedRoots` によるディレクトリ制限
5. ファイル存在確認の TOCTOU 対策

### プロトタイプ汚染対策

`deepClone()` が `Object.prototype.hasOwnProperty.call()` を使用し、プロトタイプチェーンのプロパティをコピーしません。

### evalSafeInit の安全な実装

SSR での初期値評価は、リテラル値（`true`, `false`, `null`, 数値, 文字列, `[]`, `{}`）と `JSON.parse()` のみを許可する安全な実装です。`eval()` は使用していません。

### 外部依存ゼロ

全パッケージが外部 npm 依存を持たず、サプライチェーン攻撃のリスクがありません。

---

## 改善ロードマップ

| 優先度 | 項目 | 対象 |
|--------|------|------|
| P0 | HMR WebSocket を localhost にバインド | flare-cli |
| P0 | router.push() のパス検証追加 | flare-router |
| P1 | deepClone に深度制限 + 循環参照検出追加 | flare-store |
| P1 | CSP の origin 制限強化 | flare-cli |
| P2 | Content-Security-Policy の nonce 対応 | flare-cli |
| P2 | Subresource Integrity (SRI) サポート | flare-cli build |
