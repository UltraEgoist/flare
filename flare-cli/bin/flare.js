#!/usr/bin/env node

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

function banner() {
  console.log(`\n${c.info('╔══════════════════════════════════════════╗')}`);
  console.log(`${c.info('║')}      Flare v${VERSION}                        ${c.info('║')}`);
  console.log(`${c.info('╚══════════════════════════════════════════╝')}\n`);
}

// ═══════════════════════════════════════════
// flare init <project-name>
// ═══════════════════════════════════════════
function cmdInit() {
  const name = args[1];
  if (!name) { console.error(c.err('Usage: flare init <project-name>')); process.exit(1); }

  // P1-26: Validate project name (npm standard: lowercase, numbers, hyphens, underscores, dots)
  if (!/^[a-z0-9][-a-z0-9_.]*$/.test(name)) {
    console.error(c.err(`無効なプロジェクト名: '${name}'. 小文字、数字、ハイフン、アンダースコア、ドットのみ使用できます`));
    process.exit(1);
  }

  const dir = path.resolve(name);
  if (fs.existsSync(dir)) { console.error(c.err(`ディレクトリ '${name}' は既に存在します`)); process.exit(1); }

  console.log(`\n  ${c.info('▸')} ${c.b('Creating')} ${name}/\n`);

  // Create directories
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

  // flare.config.json
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

  // package.json
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

  // index.html
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

  // utils.ts placeholder
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
function cmdBuild() {
  const config = loadConfig();
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

  const files = collectFlareFiles(srcDir);
  if (files.length === 0) {
    console.error(c.err(`.flare ファイルが見つかりません: ${srcDir}`));
    process.exit(1);
  }

  let success = 0, fail = 0;
  const bundleParts = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);
    console.log(`${c.b('▸')} Compiling ${fileName}...`);

    const result = compile(source, fileName, { target });
    for (const d of result.diagnostics) {
      const icon = d.level === 'error' ? c.err('✗') : c.warn('⚠');
      console.log(`  ${icon} [${d.code}] ${d.message}`);
      if (d.hint) console.log(`    ${c.d(`= hint: ${d.hint}`)}`);
    }

    if (result.success) {
      // Write individual file to components/ subdirectory
      const outName = fileName.replace('.flare', `.${target === 'ts' ? 'ts' : 'js'}`);
      const outPath = path.join(componentsDir, outName);
      fs.writeFileSync(outPath, result.output);
      const size = (Buffer.byteLength(result.output) / 1024).toFixed(1);
      console.log(`  ${c.ok('✓')} → components/${outName} (${size} KB)`);

      // Collect for bundle
      bundleParts.push(`// ── ${fileName} ──\n${result.output}`);
      success++;
    } else {
      console.log(`  ${c.err('✗ Failed')}`);
      fail++;
    }
    console.log();
  }

  // Write bundle to dist/ root
  if (bundleParts.length > 0) {
    const bundleHeader = `// Flare Bundle - ${new Date().toISOString()}\n// ${bundleParts.length} component(s)\n\n`;
    // P2-40: Add comment warning if ESM format is requested (not yet fully supported)
    let esmWarning = '';
    if (config.format === 'esm') {
      esmWarning = `// WARNING: ESM format requested but bundler is script-tag only.\n// ESM support coming in a future version.\n`;
    }
    const deferred = `// Deferred registration queue: all classes are defined first,\n// then all customElements.define() calls happen at the end.\n// This ensures nested components work regardless of file order.\nconst __flareDefineQueue = [];\n\n`;
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
function cmdCheck() {
  const config = loadConfig();
  const srcDir = path.resolve(config.src || args[1] || 'src/components');
  // P1-26b: Define target variable (was undefined before)
  const target = getArg('--target') || config.target || 'js';

  if (!fs.existsSync(srcDir)) {
    console.error(c.err(`ソースディレクトリが見つかりません: ${srcDir}`));
    process.exit(1);
  }

  console.log(`\n${c.info('Flare Check')}\n`);

  const files = collectFlareFiles(srcDir);
  let hasErrors = false;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);
    const result = compile(source, fileName, { target });

    if (result.diagnostics.length === 0) {
      console.log(`  ${c.ok('✓')} ${fileName}`);
    } else {
      for (const d of result.diagnostics) {
        if (d.level === 'error') hasErrors = true;
        const icon = d.level === 'error' ? c.err('✗') : c.warn('⚠');
        console.log(`  ${icon} ${fileName}: [${d.code}] ${d.message}`);
        if (d.hint) console.log(`    ${c.d(`= hint: ${d.hint}`)}`);
      }
    }
  }

  console.log();
  if (hasErrors) process.exit(1);
}

// ═══════════════════════════════════════════
// flare dev
// ═══════════════════════════════════════════
function cmdDev() {
  const config = loadConfig();
  const srcDir = path.resolve(config.src || 'src/components');
  const outDir = path.resolve(config.outdir || 'dist');
  const htmlDir = path.resolve('src');
  const port = parseInt(getArg('--port') || '3000', 10);

  fs.mkdirSync(outDir, { recursive: true });
  banner();

  // Initial build
  buildAll(srcDir, outDir);

  // Watch for changes
  console.log(`${c.info('▸')} Watching ${srcDir} for changes...`);
  let debounce = null;
  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.flare')) return;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      console.log(`\n${c.info('▸')} ${filename} changed, recompiling...`);
      // P2-38: Wrap buildAll in try/catch to handle build failures gracefully
      try {
        buildAll(srcDir, outDir);
      } catch (err) {
        console.error(c.err(`Build error: ${err.message}`));
      }
    }, 150);
  });

  // Simple static server
  // P2-36: Add MIME types for .ts, .jsx, .tsx, .wasm, .mjs
  const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ts': 'text/typescript', '.jsx': 'text/jsx', '.tsx': 'text/tsx',
    '.wasm': 'application/wasm', '.mjs': 'text/javascript',
  };

  const server = http.createServer((req, res) => {
    let url = req.url === '/' ? '/index.html' : req.url;
    url = url.split('?')[0];

    // Security: decode and normalize path, block path traversal
    url = decodeURIComponent(url);
    if (url.includes('\0') || /\.\./.test(url)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    // Allowed root directories for serving files
    const allowedRoots = [path.resolve(htmlDir), path.resolve(outDir), path.resolve(process.cwd())];

    // Try multiple locations
    const candidates = [
      path.join(htmlDir, url),
      path.join(outDir, url.replace(/^\/dist\//, '')),
      path.join(process.cwd(), url),
    ];

    // Special handling for /dist/* paths
    if (url.startsWith('/dist/')) {
      candidates.unshift(path.join(outDir, url.replace('/dist/', '')));
    }

    for (const filePath of candidates) {
      const resolved = path.resolve(filePath);
      // Security: resolve symlinks and ensure resolved path is within an allowed root
      let realPath = resolved;
      try {
        realPath = fs.realpathSync(resolved);
      } catch (e) {
        // File doesn't exist yet, use resolved path as-is
      }
      if (!allowedRoots.some(root => realPath.startsWith(root + path.sep) || realPath === root)) continue;
      if (fs.existsSync(realPath) && fs.statSync(realPath).isFile()) {
        const ext = path.extname(realPath);
        const mime = MIME[ext] || 'application/octet-stream';
        // P2-34: Add CORS header
        // P2-35: Add CSP header for dev mode
        res.writeHead(200, {
          'Content-Type': mime + '; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': '*',
          'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
        });
        fs.createReadStream(realPath).pipe(res);
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });

  // P2-37: Add error handler for port conflicts
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
function buildAll(srcDir, outDir) {
  const config = loadConfig();
  const bundleName = config.bundle || 'flare-bundle.js';
  const componentsDir = path.join(outDir, 'components');
  fs.mkdirSync(componentsDir, { recursive: true });
  const files = collectFlareFiles(srcDir);
  let success = 0, fail = 0;
  const bundleParts = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);
    const result = compile(source, fileName);

    if (result.success) {
      const outName = fileName.replace('.flare', '.js');
      fs.writeFileSync(path.join(componentsDir, outName), result.output);
      bundleParts.push(`// ── ${fileName} ──\n${result.output}`);
      success++;
    } else {
      fail++;
      for (const d of result.diagnostics) {
        const icon = d.level === 'error' ? c.err('✗') : c.warn('⚠');
        console.log(`  ${icon} ${fileName}: ${d.message}`);
      }
    }
  }

  // Write bundle to dist/ root
  if (bundleParts.length > 0) {
    const bundleHeader = `// Flare Bundle - ${new Date().toISOString()}\n// ${bundleParts.length} component(s)\n\n`;
    // P2-40: Add comment warning if ESM format is requested (not yet fully supported)
    let esmWarning = '';
    if (config.format === 'esm') {
      esmWarning = `// WARNING: ESM format requested but bundler is script-tag only.\n// ESM support coming in a future version.\n`;
    }
    const deferred = `const __flareDefineQueue = [];\n\n`;
    const bundleFooter = `\n__flareDefineQueue.forEach(([tag, cls]) => {\n  if (!customElements.get(tag)) customElements.define(tag, cls);\n});\n`;
    fs.writeFileSync(path.join(outDir, bundleName), bundleHeader + esmWarning + deferred + bundleParts.join('\n') + bundleFooter);
  }

  if (fail === 0) {
    console.log(`  ${c.ok('✓')} ${success} file${success !== 1 ? 's' : ''} compiled → ${bundleName}`);
  } else {
    console.log(`  ${c.warn(`${fail} error(s)`)}, ${success} compiled`);
  }
}

// ─── Config ───
function loadConfig() {
  const configPath = path.resolve('flare.config.json');
  if (fs.existsSync(configPath)) {
    try { return JSON.parse(fs.readFileSync(configPath, 'utf-8')); }
    // P2-39: Log warning when JSON parse fails instead of silently returning {}
    catch (e) {
      console.warn(c.warn(`⚠ Warning: flare.config.json のパース失敗: ${e.message}`));
      return {};
    }
  }
  return {};
}

// ─── Utilities ───
function collectFlareFiles(dir) {
  const p = path.resolve(dir);
  if (!fs.existsSync(p)) return [];
  if (fs.statSync(p).isFile() && dir.endsWith('.flare')) return [p];
  if (!fs.statSync(p).isDirectory()) return [];
  const files = [];
  for (const entry of fs.readdirSync(p, { recursive: true })) {
    const full = path.join(p, entry);
    if (full.endsWith('.flare') && fs.statSync(full).isFile()) files.push(full);
  }
  return files;
}

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

// ═══════════════════════════════════════════
// Dispatch
// ═══════════════════════════════════════════
switch (cmd) {
  case 'init': cmdInit(); break;
  case 'build': cmdBuild(); break;
  case 'dev': cmdDev(); break;
  case 'check': cmdCheck(); break;
  case '--version': case '-v': console.log(`flare ${VERSION}`); break;
  case '--help': case '-h': case undefined: printHelp(); break;
  default: console.error(c.err(`Unknown command: ${cmd}`)); printHelp(); process.exit(1);
}

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
