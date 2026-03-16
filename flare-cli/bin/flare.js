#!/usr/bin/env node

/**
 * @fileoverview Flare CLI - Web Component Compiler Command-Line Interface
 *
 * このファイルは Flare CLI の メインエントリーポイントです。
 * 以下の4つのコマンドをサポートしています：
 *
 * - init    : 新規プロジェクトの雛形を生成
 * - build   : 本番ビルド（全 .flare ファイルをコンパイル、バンドル生成）
 * - dev     : 開発サーバー起動（ファイル監視、ホットリビルド対応）
 * - check   : 型チェックのみ実行（出力生成なし）
 *
 * ## アーキテクチャ
 *
 * 1. **コマンド ディスパッチ**: process.argv[2] でコマンド判定 → 対応関数呼び出し
 * 2. **設定管理**: flare.config.json から設定読み込み（デフォルト値でフォールバック）
 * 3. **コンパイラ連携**: ../lib/compiler の compile() 関数で .flare → JS/TS 変換
 * 4. **バンドルシステム**: 全コンポーネントを __flareDefineQueue で遅延登録
 *    → 親・子コンポーネント順序に依存しない登録を実現
 * 5. **開発サーバー**: Node.js http モジュールで静的ファイル配信
 *    → パストラバーサル対策、シンリンク解決済み
 *
 * ## セキュリティ対策
 *
 * - パストラバーサル防止: ".." や "\0" を含むパスを拒否
 * - シンリンク解決: fs.realpathSync() で実パスを取得、allowedRoots チェック
 * - CORS/CSP ヘッダ: 開発時の動的コンテンツ読み込みに対応しつつ、不正スクリプト注入を制限
 * - プロジェクト名検証: npm 標準の package name パターンに準拠
 */

// ============================================================
// Flare CLI
// Commands: init, build, dev, check
// ============================================================

const fs = require('fs');
const path = require('path');
const http = require('http');
const { compile } = require('../lib/compiler');

const VERSION = '0.1.0';
const args = process.argv.slice(2);
const cmd = args[0];

// ─── Color helpers ───
/**
 * ターミナルの ANSI カラーコード定義と色付けヘルパー関数
 * @type {Object}
 * @property {string} reset - リセットコード
 * @property {string} bold - 太字コード
 * @property {string} dim - 薄暗いコード
 * @property {string} red - 赤色コード
 * @property {string} green - 緑色コード
 * @property {string} yellow - 黄色コード
 * @property {string} cyan - シアンコード
 * @property {Function} ok - 成功メッセージ（緑色）
 * @property {Function} err - エラーメッセージ（赤色）
 * @property {Function} warn - 警告メッセージ（黄色）
 * @property {Function} info - 情報メッセージ（シアン色）
 * @property {Function} b - 太字テキスト
 * @property {Function} d - 薄暗いテキスト
 */
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
  ok(t) { return `${this.green}${t}${this.reset}`; },
  err(t) { return `${this.red}${t}${this.reset}`; },
  warn(t) { return `${this.yellow}${t}${this.reset}`; },
  info(t) { return `${this.cyan}${t}${this.reset}`; },
  b(t) { return `${this.bold}${t}${this.reset}`; },
  d(t) { return `${this.dim}${t}${this.reset}`; },
};

/**
 * CLI ヘッダーバナーを表示する
 * Flare のロゴとバージョン情報を表示（初期化時、ビルド開始時など）
 *
 * @function banner
 * @returns {void}
 */
function banner() {
  console.log(`\n${c.info('╔══════════════════════════════════════════╗')}`);
  console.log(`${c.info('║')}      Flare v${VERSION}                        ${c.info('║')}`);
  console.log(`${c.info('╚══════════════════════════════════════════╝')}\n`);
}

// ═══════════════════════════════════════════
// flare init <project-name>
// ═══════════════════════════════════════════

/**
 * 新規 Flare プロジェクトの雛形を生成する
 *
 * プロジェクト構造：
 * ```
 * <project>/
 *   ├── flare.config.json  - Flare 設定ファイル
 *   ├── package.json       - npm パッケージ定義
 *   ├── src/
 *   │   ├── index.html     - サンプル HTML
 *   │   ├── components/
 *   │   │   └── app.flare  - ルートコンポーネント
 *   │   └── lib/
 *   │       └── utils.ts   - ユーティリティ関数プレースホルダ
 *   └── dist/              - ビルド出力先（空）
 * ```
 *
 * ## プロジェクト名検証
 * npm の package name 標準に準拠：
 * - 小文字のみ
 * - 数字、ハイフン、アンダースコア、ドットを含可能
 * - 先頭は小文字か数字
 * パターン: /^[a-z0-9][-a-z0-9_.]*$/
 *
 * @function cmdInit
 * @returns {void}
 */
function cmdInit() {
  const name = args[1];
  if (!name) { console.error(c.err('Usage: flare init <project-name>')); process.exit(1); }

  // P1-26: Validate project name (npm standard: lowercase, numbers, hyphens, underscores, dots)
  // プロジェクト名がパッケージ名として有効か検証
  // これにより npm publish 時のエラーを事前に防ぐ
  if (!/^[a-z0-9][-a-z0-9_.]*$/.test(name)) {
    console.error(c.err(`無効なプロジェクト名: '${name}'. 小文字、数字、ハイフン、アンダースコア、ドットのみ使用できます`));
    process.exit(1);
  }

  const dir = path.resolve(name);
  // 既存ディレクトリの存在確認（既存プロジェクトへの誤上書き防止）
  if (fs.existsSync(dir)) { console.error(c.err(`ディレクトリ '${name}' は既に存在します`)); process.exit(1); }

  console.log(`\n  ${c.info('▸')} ${c.b('Creating')} ${name}/\n`);

  // Create directories
  // プロジェクト構造の基本ディレクトリをすべて作成
  const dirs = [
    '',
    'src',
    'src/components',
    'src/lib',
    'dist',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(dir, d), { recursive: true });
  }

  // flare.config.json - ビルドとコンパイルの設定ファイル
  fs.writeFileSync(path.join(dir, 'flare.config.json'), JSON.stringify({
    target: 'js',
    outdir: 'dist',
    bundle: 'flare-bundle.js',
    shadow: 'open',
    sourcemap: false,
    minify: false,
    src: 'src/components',
  }, null, 2) + '\n');
  console.log(`    ${c.ok('✓')} flare.config.json`);

  // package.json - npm パッケージメタデータと NPM scripts
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: name,
    version: '0.0.1',
    private: true,
    scripts: {
      dev: 'flare dev',
      build: 'flare build',
      check: 'flare check',
    },
  }, null, 2) + '\n');
  console.log(`    ${c.ok('✓')} package.json`);

  // Root component: app.flare
  // サンプルコンポーネント：シンプルなカウンター実装
  const appFlare = `<meta>
  name: "x-app"
  shadow: open
</meta>

<script>
  state count: number = 0

  fn increment() {
    count += 1
  }
</script>

<template>
  <div class="app">
    <h1>Flare へようこそ！</h1>
    <p>このコンポーネントを編集して開発を始めましょう。</p>
    <div class="counter">
      <span class="value">{{ count }}</span>
      <button class="btn" @click="increment">+1</button>
    </div>
  </div>
</template>

<style>
  .app {
    font-family: 'Segoe UI', system-ui, sans-serif;
    max-width: 480px;
    margin: 60px auto;
    text-align: center;
    color: #333;
  }
  h1 {
    font-size: 2rem;
    margin: 0 0 8px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p {
    color: #888;
    margin: 0 0 32px;
  }
  .counter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .value {
    font-size: 3rem;
    font-weight: 700;
    color: #667eea;
    min-width: 80px;
  }
  .btn {
    padding: 12px 32px;
    border-radius: 8px;
    border: none;
    background: #667eea;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }
  .btn:hover { background: #5a6fd6; }
  .btn:active { transform: scale(0.96); }
</style>
`;
  fs.writeFileSync(path.join(dir, 'src', 'components', 'app.flare'), appFlare);
  console.log(`    ${c.ok('✓')} src/components/app.flare`);

  // index.html - エントリーHTMLファイル
  // コンパイル済みのバンドル JS を読み込み、ルートコンポーネント <x-app> をマウント
  const indexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; background: #fafafa; }
  </style>
</head>
<body>
  <x-app></x-app>
  <!-- Flare: 全コンポーネントが1つにバンドルされます -->
  <script src="dist/flare-bundle.js"><\/script>
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, 'src', 'index.html'), indexHtml);
  console.log(`    ${c.ok('✓')} src/index.html`);

  // utils.ts placeholder - TypeScript ユーティリティ関数のサンプル
  fs.writeFileSync(path.join(dir, 'src', 'lib', 'utils.ts'), '// ユーティリティ関数をここに記述\nexport function formatDate(d: Date): string {\n  return d.toLocaleDateString("ja-JP");\n}\n');
  console.log(`    ${c.ok('✓')} src/lib/utils.ts`);

  console.log(`\n  ${c.ok('✓ Done!')}\n`);
  console.log(`  次のステップ:\n`);
  console.log(`    ${c.b(`cd ${name}`)}`);
  console.log(`    ${c.b('flare dev')}\n`);
}

// ═══════════════════════════════════════════
// flare build
// ═══════════════════════════════════════════

/**
 * 本番ビルドを実行する
 *
 * 処理の流れ：
 * 1. flare.config.json から設定を読み込む（CLI引数でオーバーライド可）
 * 2. ソースディレクトリ内のすべての .flare ファイルを探す
 * 3. 各ファイルをコンパイル（JS または TS 出力）
 * 4. 出力先ディレクトリ/components/ に個別ファイルを生成
 * 5. すべてのコンパイル済みコンポーネントを1つの Bundle にまとめる
 * 6. Bundle 内で __flareDefineQueue を使用して遅延登録を実装
 *
 * ## バンドルシステム (__flareDefineQueue)
 * コンポーネントの登録順序に依存するバグを防ぐため、以下の仕組みを採用：
 * - コンパイラが各コンポーネントクラスを定義する際、
 *   __flareDefineQueue.push([tagName, ComponentClass]) で キュー登録
 * - Bundle の末尾で、キュー内のすべてのコンポーネントを customElements.define()
 * - これにより、親コンポーネントが出現する前に子コンポーネントが
 *   customElements に登録済みの状態が保証される
 *
 * @function cmdBuild
 * @returns {void}
 */
function cmdBuild() {
  const config = loadConfig();
  // CLI引数 > config ファイル > デフォルト値 の優先度で設定値を決定
  const srcDir = path.resolve(config.src || args[1] || 'src/components');
  const outDir = path.resolve(getArg('--outdir') || config.outdir || 'dist');
  const target = getArg('--target') || config.target || 'js';
  const bundleName = config.bundle || 'flare-bundle.js';

  if (!fs.existsSync(srcDir)) {
    console.error(c.err(`ソースディレクトリが見つかりません: ${srcDir}`));
    process.exit(1);
  }

  const componentsDir = path.join(outDir, 'components');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(componentsDir, { recursive: true });
  banner();

  // ソースディレクトリから全 .flare ファイルを再帰的に探索
  const files = collectFlareFiles(srcDir);
  if (files.length === 0) {
    console.error(c.err(`.flare ファイルが見つかりません: ${srcDir}`));
    process.exit(1);
  }

  let success = 0, fail = 0;
  const bundleParts = [];

  // 各 .flare ファイルをコンパイル
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);
    console.log(`${c.b('▸')} Compiling ${fileName}...`);

    // コンパイラ実行（../lib/compiler の compile() 関数を使用）
    const result = compile(source, fileName, { target });

    // 診断情報（エラー/警告）を表示
    for (const d of result.diagnostics) {
      const icon = d.level === 'error' ? c.err('✗') : c.warn('⚠');
      console.log(`  ${icon} [${d.code}] ${d.message}`);
      if (d.hint) console.log(`    ${c.d(`= hint: ${d.hint}`)}`);
    }

    if (result.success) {
      // 個別コンポーネントファイルを components/ サブディレクトリに出力
      // target が 'ts' の場合は .ts、デフォルト .js に変換
      const outName = fileName.replace('.flare', `.${target === 'ts' ? 'ts' : 'js'}`);
      const outPath = path.join(componentsDir, outName);
      fs.writeFileSync(outPath, result.output);
      const size = (Buffer.byteLength(result.output) / 1024).toFixed(1);
      console.log(`  ${c.ok('✓')} → components/${outName} (${size} KB)`);

      // Bundle に追加するため、コンパイル済みソースコードを蓄積
      // （コメント区切り付き）
      bundleParts.push(`// ── ${fileName} ──\n${result.output}`);
      success++;
    } else {
      console.log(`  ${c.err('✗ Failed')}`);
      fail++;
    }
    console.log();
  }

  // Bundle ファイルを dist/ ルートに生成
  // （個別ファイルとは異なり、すべてのコンポーネントを1つにまとめたもの）
  if (bundleParts.length > 0) {
    const bundleHeader = `// Flare Bundle - ${new Date().toISOString()}\n// ${bundleParts.length} component(s)\n\n`;
    // P2-40: Add comment warning if ESM format is requested (not yet fully supported)
    // ESM 形式がリクエストされた場合の警告コメント
    // （現在のバンドラーは script タグ形式のみサポート）
    let esmWarning = '';
    if (config.format === 'esm') {
      esmWarning = `// WARNING: ESM format requested but bundler is script-tag only.\n// ESM support coming in a future version.\n`;
    }
    // デferred registration queue の宣言と初期化
    // （各コンポーネントクラスがこのキューに push 〜 末尾で一括 define）
    const deferred = `// Deferred registration queue: all classes are defined first,\n// then all customElements.define() calls happen at the end.\n// This ensures nested components work regardless of file order.\nconst __flareDefineQueue = [];\n\n`;
    // Bundle の末尾：キュー内のすべてのコンポーネントを customElements に登録
    const bundleFooter = `\n// Register all components at once (child components are available when parent renders)\n__flareDefineQueue.forEach(([tag, cls]) => {\n  if (!customElements.get(tag)) customElements.define(tag, cls);\n});\n`;
    const bundleContent = bundleHeader + esmWarning + deferred + bundleParts.join('\n') + bundleFooter;
    const bundlePath = path.join(outDir, bundleName);
    fs.writeFileSync(bundlePath, bundleContent);
    const bundleSize = (Buffer.byteLength(bundleContent) / 1024).toFixed(1);
    console.log(`${c.info('▸')} Bundle: ${c.b(bundleName)} (${bundleSize} KB, ${bundleParts.length} components)`);
  }

  console.log(`${c.ok('Done!')} ${success}/${success + fail} files compiled.\n`);
  if (fail > 0) process.exit(1);
}

// ═══════════════════════════════════════════
// flare check
// ═══════════════════════════════════════════

/**
 * 型チェックと診断を実行する（ファイル出力なし）
 *
 * 用途：
 * - CI/CD パイプラインでの構文・型チェック
 * - エディタ統合での on-save 検証
 * - 開発時の即座なエラー検出（実際のビルド前）
 *
 * 処理：
 * 1. ソースディレクトリ内のすべての .flare ファイルをコンパイル
 * 2. コンパイルは実行するが、出力ファイルは生成しない
 * 3. 診断情報（エラー/警告）を表示
 * 4. エラーが存在する場合、exit code 1 で終了
 *
 * P1-26b: Define target variable (was undefined before)
 * target 変数が定義されていなかったバグを修正
 *
 * @function cmdCheck
 * @returns {void}
 */
function cmdCheck() {
  const config = loadConfig();
  const srcDir = path.resolve(config.src || args[1] || 'src/components');
  // target 変数を定義してコンパイラに渡す
  const target = getArg('--target') || config.target || 'js';

  if (!fs.existsSync(srcDir)) {
    console.error(c.err(`ソースディレクトリが見つかりません: ${srcDir}`));
    process.exit(1);
  }

  console.log(`\n${c.info('Flare Check')}\n`);

  const files = collectFlareFiles(srcDir);
  let hasErrors = false;

  // 各ファイルのコンパイル結果を診断（ファイルは出力しない）
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);
    const result = compile(source, fileName, { target });

    if (result.diagnostics.length === 0) {
      console.log(`  ${c.ok('✓')} ${fileName}`);
    } else {
      // 診断情報を表示
      for (const d of result.diagnostics) {
        if (d.level === 'error') hasErrors = true;
        const icon = d.level === 'error' ? c.err('✗') : c.warn('⚠');
        console.log(`  ${icon} ${fileName}: [${d.code}] ${d.message}`);
        if (d.hint) console.log(`    ${c.d(`= hint: ${d.hint}`)}`);
      }
    }
  }

  console.log();
  // エラーが発見された場合は exit code 1 で終了（CI検証用）
  if (hasErrors) process.exit(1);
}

// ═══════════════════════════════════════════
// flare dev
// ═══════════════════════════════════════════

/**
 * 開発サーバーを起動する（ホットリビルド対応）
 *
 * 機能：
 * 1. 初期ビルド：ソースディレクトリの .flare ファイルをコンパイル
 * 2. ファイル監視：.flare ファイルの変更を検知 → デバウンス付き自動リビルド
 * 3. 静的ファイルサーバー：HTML、CSS、JS などを localhost:PORT で配信
 * 4. セキュリティ対策：
 *    - パストラバーサル攻撃防止
 *    - シンリンク解決と allowedRoots チェック
 *    - CORS / CSP ヘッダ設定
 *    - MIME タイプの適切な設定
 *
 * ## ファイル監視とデバウンス
 * ファイル変更イベントは頻繁に発火するため、150ms のデバウンスで
 * リビルド実行を制御 → 不要なコンパイル回数を削減
 *
 * ## セキュリティ実装
 * - Path Traversal 防止：URL から ".." や "\0" を検出 → 403 拒否
 * - Symlink 解決：fs.realpathSync() で実パスを取得
 * - Allowed Roots チェック：解決済みパスが allowedRoots 以下にあることを確認
 * - CORS ヘッダ：開発時に外部からのリソース読み込みを許可（'*'）
 * - CSP ヘッダ：'unsafe-inline' / 'unsafe-eval' を許可（開発用。本番では制限すべき）
 *
 * @function cmdDev
 * @returns {void}
 */
function cmdDev() {
  const config = loadConfig();
  const srcDir = path.resolve(config.src || 'src/components');
  const outDir = path.resolve(config.outdir || 'dist');
  const htmlDir = path.resolve('src');
  // CLI引数からポート番号を取得（デフォルト 3000）
  const port = parseInt(getArg('--port') || '3000', 10);

  fs.mkdirSync(outDir, { recursive: true });
  banner();

  // 初期ビルド実行
  buildAll(srcDir, outDir);

  // ファイル監視開始
  // .flare ファイルの変更を検知して自動リビルド
  console.log(`${c.info('▸')} Watching ${srcDir} for changes...`);
  let debounce = null;
  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.flare')) return;
    if (debounce) clearTimeout(debounce);
    // デバウンス：150ms 以内の連続変更は1回の再ビルドにまとめる
    debounce = setTimeout(() => {
      console.log(`\n${c.info('▸')} ${filename} changed, recompiling...`);
      // P2-38: Wrap buildAll in try/catch to handle build failures gracefully
      // ビルド失敗がサーバーを停止させないよう、エラーハンドリングを実装
      try {
        buildAll(srcDir, outDir);
      } catch (err) {
        console.error(c.err(`Build error: ${err.message}`));
      }
    }, 150);
  });

  // 静的ファイルサーバー初期化
  // P2-36: Add MIME types for .ts, .jsx, .tsx, .wasm, .mjs
  // ファイル拡張子と MIME タイプのマッピング
  const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ts': 'text/typescript', '.jsx': 'text/jsx', '.tsx': 'text/tsx',
    '.wasm': 'application/wasm', '.mjs': 'text/javascript',
  };

  const server = http.createServer((req, res) => {
    // URL の正規化：ルート "/" は index.html にマップ
    let url = req.url === '/' ? '/index.html' : req.url;
    // クエリ文字列を削除
    url = url.split('?')[0];

    // セキュリティ：パストトラバーサル攻撃対策
    // 多重エンコード攻撃（%252e%252e 等）対策: デコードを繰り返し実行
    let prevUrl;
    do {
      prevUrl = url;
      try { url = decodeURIComponent(url); } catch(e) { break; }
    } while (url !== prevUrl);
    // ".." または null 文字を検出 → 403 Forbidden を返却
    if (url.includes('\0') || /\.\./.test(url)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    // セキュリティ：許可されたルートディレクトリを定義
    // この範囲外のファイルは提供しない
    const allowedRoots = [path.resolve(htmlDir), path.resolve(outDir), path.resolve(process.cwd())];

    // セキュリティ：複数の場所からファイルを探す（優先順）
    // 1. HTML ディレクトリ（通常は src/）
    // 2. ビルド出力ディレクトリ（dist/）
    // 3. カレントワーキングディレクトリ
    const candidates = [
      path.join(htmlDir, url),
      path.join(outDir, url.replace(/^\/dist\//, '')),
      path.join(process.cwd(), url),
    ];

    // /dist/* パスの特殊処理（ビルド出力をルートの dist/ で配信）
    if (url.startsWith('/dist/')) {
      candidates.unshift(path.join(outDir, url.replace('/dist/', '')));
    }

    // 各候補パスを順番にチェック
    for (const filePath of candidates) {
      const resolved = path.resolve(filePath);
      // セキュリティ：シンリンク解決と allowedRoots 検証
      let realPath = resolved;
      try {
        // シンリンクを解決して実パスを取得
        realPath = fs.realpathSync(resolved);
      } catch (e) {
        // ファイルが存在しない場合は resolved パスのまま続行
      }
      // 実パスが allowedRoots の範囲内にあることを確認
      // (パストトラバーサル後でのチェック)
      if (!allowedRoots.some(root => realPath.startsWith(root + path.sep) || realPath === root)) continue;
      // ファイルが存在し、かつファイルであることを確認
      if (fs.existsSync(realPath) && fs.statSync(realPath).isFile()) {
        const ext = path.extname(realPath);
        const mime = MIME[ext] || 'application/octet-stream';
        // P2-34: Add CORS header
        // P2-35: Add CSP header for dev mode
        // セキュリティヘッダの設定
        res.writeHead(200, {
          'Content-Type': mime + '; charset=utf-8',
          'Cache-Control': 'no-cache',  // 開発中はキャッシュさせない
          'X-Content-Type-Options': 'nosniff',  // MIME スニッフィング防止
          'Access-Control-Allow-Origin': '*',  // 開発時は全オリジンを許可
          'Content-Security-Policy': "default-src 'self' 'unsafe-inline'",  // S-06: unsafe-eval を除去
        });
        // ファイルをストリーム形式で送信（大きなファイルでもメモリ効率的）
        fs.createReadStream(realPath).pipe(res);
        return;
      }
    }

    // どの候補にもマッチしない → 404 Not Found を返却
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });

  // P2-37: Add error handler for port conflicts
  // ポート使用中エラーを処理して、分かりやすいエラーメッセージを表示
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(c.err(`ポート ${port} は既に使用されています。別のポートを指定してください:`));
      console.error(c.err(`  flare dev --port ${port + 1}`));
      process.exit(1);
    } else {
      throw err;
    }
  });

  server.listen(port, () => {
    console.log(`${c.ok('▸')} Dev server: ${c.b(`http://localhost:${port}`)}`);
    console.log(`${c.d('  Ctrl+C to stop')}\n`);
  });
}

// ─── Build helper ───

/**
 * 開発モード用の高速ビルルパー関数
 *
 * cmdDev() の ファイル監視コールバックや初期ビルドから呼ばれる
 * 静粛なコンパイル処理を実装：
 * - 個別ファイルを components/ に出力
 * - Bundle を dist/ ルートに生成
 * - ビルド失敗時も、エラーメッセージを表示して処理を続行
 *   （サーバーは停止させない）
 *
 * 実装上の注意：
 * - cmdBuild() と異なり、詳細な診断情報は表示しない（開発用）
 * - デバウンス内から呼ばれるため、処理は高速化されている
 * - バンドルは常に生成される（ファイル数=0 でない限り）
 *
 * @function buildAll
 * @param {string} srcDir - ソースディレクトリパス
 * @param {string} outDir - 出力先ディレクトリパス
 * @returns {void}
 */
function buildAll(srcDir, outDir) {
  const config = loadConfig();
  const bundleName = config.bundle || 'flare-bundle.js';
  const componentsDir = path.join(outDir, 'components');
  fs.mkdirSync(componentsDir, { recursive: true });
  // ソースから .flare ファイルを探索
  const files = collectFlareFiles(srcDir);
  let success = 0, fail = 0;
  const bundleParts = [];

  // 各ファイルをコンパイル
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);
    // コンパイラ実行（target 指定なし = デフォルト JS）
    const result = compile(source, fileName);

    if (result.success) {
      // 個別ファイルを components/ に出力
      const outName = fileName.replace('.flare', '.js');
      fs.writeFileSync(path.join(componentsDir, outName), result.output);
      // バンドル用に蓄積
      bundleParts.push(`// ── ${fileName} ──\n${result.output}`);
      success++;
    } else {
      fail++;
      // エラーメッセージを表示（簡潔なフォーマット）
      for (const d of result.diagnostics) {
        const icon = d.level === 'error' ? c.err('✗') : c.warn('⚠');
        console.log(`  ${icon} ${fileName}: ${d.message}`);
      }
    }
  }

  // Bundle ファイルを生成
  // （cmd を問わず、buildAll 呼び出し時は必ず生成）
  if (bundleParts.length > 0) {
    const bundleHeader = `// Flare Bundle - ${new Date().toISOString()}\n// ${bundleParts.length} component(s)\n\n`;
    // P2-40: Add comment warning if ESM format is requested (not yet fully supported)
    // ESM 形式の警告（ESM サポートは将来予定）
    let esmWarning = '';
    if (config.format === 'esm') {
      esmWarning = `// WARNING: ESM format requested but bundler is script-tag only.\n// ESM support coming in a future version.\n`;
    }
    // デferred registration queue の初期化
    const deferred = `const __flareDefineQueue = [];\n\n`;
    // 全コンポーネントを一括登録
    const bundleFooter = `\n__flareDefineQueue.forEach(([tag, cls]) => {\n  if (!customElements.get(tag)) customElements.define(tag, cls);\n});\n`;
    fs.writeFileSync(path.join(outDir, bundleName), bundleHeader + esmWarning + deferred + bundleParts.join('\n') + bundleFooter);
  }

  // コンパイル結果をコンソール表示
  if (fail === 0) {
    console.log(`  ${c.ok('✓')} ${success} file${success !== 1 ? 's' : ''} compiled → ${bundleName}`);
  } else {
    console.log(`  ${c.warn(`${fail} error(s)`)}, ${success} compiled`);
  }
}

// ─── Config ───

/**
 * flare.config.json からプロジェクト設定を読み込む
 *
 * ## 設定ファイル形式
 * ```json
 * {
 *   "target": "js",              // 出力形式：js または ts
 *   "outdir": "dist",            // ビルド出力先ディレクトリ
 *   "bundle": "flare-bundle.js", // バンドルファイル名
 *   "shadow": "open",            // Shadow DOM モード
 *   "sourcemap": false,          // ソースマップ生成
 *   "minify": false,             // コード最小化
 *   "src": "src/components",     // ソースディレクトリ
 *   "format": "esm"              // モジュール形式（ESM は開発中）
 * }
 * ```
 *
 * ## エラーハンドリング
 * - ファイルが存在しない場合 → 空オブジェクト {} を返す（デフォルト値使用）
 * - JSON パース失敗 → 警告を表示し、空オブジェクト {} を返す（デフォルト値使用）
 * - P2-39: Log warning when JSON parse fails instead of silently returning {}
 *   パース失敗時に警告を出力することで、デバッグを容易にする
 *
 * @function loadConfig
 * @returns {Object} パースされた設定オブジェクト。ファイルが存在しない場合や
 *                   パース失敗時は空オブジェクト。
 */
function loadConfig() {
  const configPath = path.resolve('flare.config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    // P2-39: Log warning when JSON parse fails instead of silently returning {}
    // JSON パース失敗時に警告メッセージを出力
    catch (e) {
      console.warn(c.warn(`⚠ Warning: flare.config.json のパース失敗: ${e.message}`));
      return {};
    }
  }
  return {};
}

// ─── Utilities ───

/**
 * ディレクトリ内のすべての .flare ファイルを再帰的に探索する
 *
 * 用途：
 * - プロジェクト内の全コンポーネントファイルを一括取得
 * - buildAll(), cmdBuild(), cmdCheck() から呼ばれる
 *
 * 処理フロー：
 * 1. 指定パスを絶対パスに解決
 * 2. パスが存在しない場合 → 空配列を返す
 * 3. ファイルであり、かつ .flare で終わる場合 → そのファイルのみを配列で返す
 * 4. ディレクトリの場合 → 再帰的にすべての .flare ファイルを探す
 *
 * 例：
 * ```
 * src/components/
 *   ├── app.flare
 *   ├── header/
 *   │   └── header.flare
 *   └── footer/
 *       └── footer.flare
 * ```
 * → ['/path/to/app.flare', '/path/to/header/header.flare', '/path/to/footer/footer.flare']
 *
 * @function collectFlareFiles
 * @param {string} dir - 探索対象のディレクトリパス（ファイルの場合はそのファイルのみ対象）
 * @returns {string[]} 見つかった .flare ファイルのパスの配列
 */
function collectFlareFiles(dir) {
  const p = path.resolve(dir);
  // パスが存在しない場合は空配列を返す
  if (!fs.existsSync(p)) return [];
  // ファイルであり、.flare で終わる場合 → そのファイルのみを返す
  if (fs.statSync(p).isFile() && dir.endsWith('.flare')) return [p];
  // ファイルだが .flare でない場合 → 空配列を返す
  if (!fs.statSync(p).isDirectory()) return [];

  const files = [];
  // ディレクトリの全ファイルを再帰的に走査（recursive: true）
  for (const entry of fs.readdirSync(p, { recursive: true })) {
    const full = path.join(p, entry);
    // .flare で終わり、かつファイルである場合のみリストに追加
    if (full.endsWith('.flare') && fs.statSync(full).isFile()) files.push(full);
  }
  return files;
}

/**
 * CLI 引数から指定されたオプションの値を取得する
 *
 * 用法：
 * ```
 * flare build --outdir my-dist --target ts
 * getArg('--outdir')  // 'my-dist'
 * getArg('--target')  // 'ts'
 * getArg('--port')    // null（指定なし）
 * ```
 *
 * 処理：
 * - args 配列（process.argv.slice(2)）から指定名を探す
 * - 見つかった場合、その直後の要素を値として返す
 * - 見つからない、または値がない場合は null を返す
 *
 * @function getArg
 * @param {string} name - 探すオプション名（例：'--outdir'、'--port'）
 * @returns {string|null} オプションの値、または null
 */
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

// ═══════════════════════════════════════════
// Dispatch
// ═══════════════════════════════════════════

/**
 * CLI コマンドディスパッチャー
 *
 * process.argv[2] で指定されたコマンドを解析して、対応する関数を実行
 *
 * サポートコマンド：
 * - init    → cmdInit()    新規プロジェクト初期化
 * - build   → cmdBuild()   本番ビルド
 * - dev     → cmdDev()     開発サーバー起動
 * - check   → cmdCheck()   型チェック
 * - --version / -v        バージョン表示
 * - --help / -h / (空)    ヘルプ表示
 */
switch (cmd) {
  case 'init': cmdInit(); break;
  case 'build': cmdBuild(); break;
  case 'dev': cmdDev(); break;
  case 'check': cmdCheck(); break;
  case '--version': case '-v': console.log(`flare ${VERSION}`); break;
  case '--help': case '-h': case undefined: printHelp(); break;
  default: console.error(c.err(`Unknown command: ${cmd}`)); printHelp(); process.exit(1);
}

/**
 * CLI ヘルプメッセージを表示する
 *
 * 以下の場合に呼ばれる：
 * - flare -h / --help を実行
 * - flare を引数なしで実行
 * - unknown command が指定された
 *
 * 表示内容：
 * - 使用方法（Usage）
 * - 利用可能なコマンド
 * - グローバルオプション
 *
 * @function printHelp
 * @returns {void}
 */
function printHelp() {
  console.log(`
${c.b('Flare')} v${VERSION} - Web Component コンパイラ

${c.b('Usage:')}
  flare init <name>        新規プロジェクト作成
  flare dev                開発サーバー起動 (HMR)
  flare build              本番ビルド
  flare check              型チェックのみ

${c.b('Options:')}
  --target js|ts           出力フォーマット (default: js)
  --outdir <dir>           出力先ディレクトリ (default: dist)
  --port <number>          dev server ポート (default: 3000)
  -v, --version            バージョン表示
  -h, --help               ヘルプ表示
`);
}
