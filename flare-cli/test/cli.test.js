/**
 * CLI Test Suite for Flare
 *
 * Tests the CLI commands (init, build, check) by executing them as child processes.
 * Uses Node.js built-in test runner (node:test) and assert module.
 *
 * テスト対象:
 * - flare init: プロジェクト生成、名前バリデーション、既存ディレクトリチェック
 * - flare build: コンパイルパイプライン、バンドル生成、エラーハンドリング
 * - flare check: 型チェック、診断出力
 * - flare --help / --version: ヘルプ・バージョン表示
 */

const test = require('node:test');
const assert = require('node:assert');
const { execSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CLI_PATH = path.resolve(__dirname, '../bin/flare.js');

// ─── Helper: Run CLI command and capture output ───
function runCli(args, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  try {
    const stdout = execFileSync(process.execPath, [CLI_PATH, ...args], {
      cwd,
      encoding: 'utf-8',
      timeout: 15000,
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return {
      stdout: (err.stdout || '') + (err.stderr || ''),
      exitCode: err.status || 1,
    };
  }
}

// ─── Helper: Create temp directory ───
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'flare-test-'));
}

// ─── Helper: Cleanup temp directory ───
function cleanDir(dir) {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ============================================================
// TESTS: --help / --version
// ============================================================

test('cli --help shows usage information', () => {
  const { stdout, exitCode } = runCli(['--help']);
  assert.strictEqual(exitCode, 0);
  assert.ok(stdout.includes('flare init'), 'should show init command');
  assert.ok(stdout.includes('flare dev'), 'should show dev command');
  assert.ok(stdout.includes('flare build'), 'should show build command');
  assert.ok(stdout.includes('flare check'), 'should show check command');
});

test('cli -h is alias for --help', () => {
  const { stdout, exitCode } = runCli(['-h']);
  assert.strictEqual(exitCode, 0);
  assert.ok(stdout.includes('flare init'));
});

test('cli --version shows version', () => {
  const { stdout, exitCode } = runCli(['--version']);
  assert.strictEqual(exitCode, 0);
  assert.match(stdout.trim(), /^flare \d+\.\d+\.\d+$/);
});

test('cli -v is alias for --version', () => {
  const { stdout, exitCode } = runCli(['-v']);
  assert.strictEqual(exitCode, 0);
  assert.match(stdout.trim(), /^flare \d+\.\d+\.\d+$/);
});

test('cli no args shows help', () => {
  const { stdout, exitCode } = runCli([]);
  assert.strictEqual(exitCode, 0);
  assert.ok(stdout.includes('flare init'));
});

test('cli unknown command shows error', () => {
  const { stdout, exitCode } = runCli(['nonexistent']);
  assert.strictEqual(exitCode, 1);
  assert.ok(stdout.includes('Unknown command'));
});

// ============================================================
// TESTS: flare init
// ============================================================

test('init creates project structure', () => {
  const tmpDir = makeTempDir();
  const projName = 'test-proj';
  try {
    const { stdout, exitCode } = runCli(['init', projName], { cwd: tmpDir });
    assert.strictEqual(exitCode, 0, `init failed: ${stdout}`);

    const projDir = path.join(tmpDir, projName);
    // Verify directories
    assert.ok(fs.existsSync(path.join(projDir, 'src')), 'src/ should exist');
    assert.ok(fs.existsSync(path.join(projDir, 'src', 'components')), 'src/components/ should exist');
    assert.ok(fs.existsSync(path.join(projDir, 'src', 'lib')), 'src/lib/ should exist');
    assert.ok(fs.existsSync(path.join(projDir, 'dist')), 'dist/ should exist');

    // Verify files
    assert.ok(fs.existsSync(path.join(projDir, 'flare.config.json')), 'flare.config.json should exist');
    assert.ok(fs.existsSync(path.join(projDir, 'package.json')), 'package.json should exist');
    assert.ok(fs.existsSync(path.join(projDir, 'src', 'components', 'app.flare')), 'app.flare should exist');
    assert.ok(fs.existsSync(path.join(projDir, 'src', 'index.html')), 'index.html should exist');
    assert.ok(fs.existsSync(path.join(projDir, 'src', 'lib', 'utils.ts')), 'utils.ts should exist');

    // Verify package.json content
    const pkg = JSON.parse(fs.readFileSync(path.join(projDir, 'package.json'), 'utf-8'));
    assert.strictEqual(pkg.name, projName);
    assert.ok(pkg.scripts.dev, 'should have dev script');
    assert.ok(pkg.scripts.build, 'should have build script');

    // Verify flare.config.json content
    const config = JSON.parse(fs.readFileSync(path.join(projDir, 'flare.config.json'), 'utf-8'));
    assert.strictEqual(config.target, 'js');
    assert.strictEqual(config.outdir, 'dist');
    assert.strictEqual(config.src, 'src/components');
  } finally {
    cleanDir(tmpDir);
  }
});

test('init rejects missing project name', () => {
  const { stdout, exitCode } = runCli(['init']);
  assert.strictEqual(exitCode, 1);
  assert.ok(stdout.includes('Usage'));
});

test('init rejects invalid project name (uppercase)', () => {
  const tmpDir = makeTempDir();
  try {
    const { stdout, exitCode } = runCli(['init', 'MyProject'], { cwd: tmpDir });
    assert.strictEqual(exitCode, 1);
    assert.ok(stdout.includes('無効なプロジェクト名'));
  } finally {
    cleanDir(tmpDir);
  }
});

test('init rejects invalid project name (special chars)', () => {
  const tmpDir = makeTempDir();
  try {
    const { stdout, exitCode } = runCli(['init', '@bad/name'], { cwd: tmpDir });
    assert.strictEqual(exitCode, 1);
  } finally {
    cleanDir(tmpDir);
  }
});

test('init rejects existing directory', () => {
  const tmpDir = makeTempDir();
  const projName = 'existing-proj';
  fs.mkdirSync(path.join(tmpDir, projName));
  try {
    const { stdout, exitCode } = runCli(['init', projName], { cwd: tmpDir });
    assert.strictEqual(exitCode, 1);
    assert.ok(stdout.includes('既に存在します'));
  } finally {
    cleanDir(tmpDir);
  }
});

test('init accepts valid names (with hyphen, dot, underscore)', () => {
  const tmpDir = makeTempDir();
  try {
    const { exitCode } = runCli(['init', 'my-app.v2_test'], { cwd: tmpDir });
    assert.strictEqual(exitCode, 0);
    assert.ok(fs.existsSync(path.join(tmpDir, 'my-app.v2_test', 'package.json')));
  } finally {
    cleanDir(tmpDir);
  }
});

// ============================================================
// TESTS: flare build
// ============================================================

test('build compiles .flare files and generates bundle', () => {
  const tmpDir = makeTempDir();
  try {
    // Initialize project
    runCli(['init', 'build-test'], { cwd: tmpDir });
    const projDir = path.join(tmpDir, 'build-test');

    // Run build
    const { stdout, exitCode } = runCli(['build'], { cwd: projDir });
    assert.strictEqual(exitCode, 0, `build failed: ${stdout}`);

    // Check outputs
    assert.ok(fs.existsSync(path.join(projDir, 'dist', 'flare-bundle.js')), 'bundle should exist');
    assert.ok(fs.existsSync(path.join(projDir, 'dist', 'components', 'app.js')), 'component JS should exist');

    // Bundle content
    const bundle = fs.readFileSync(path.join(projDir, 'dist', 'flare-bundle.js'), 'utf-8');
    assert.ok(bundle.includes('__flareDefineQueue'), 'bundle should use deferred registration');
    assert.ok(bundle.includes('customElements.define'), 'bundle should register components');
    assert.ok(bundle.includes('XApp'), 'bundle should contain component class');
  } finally {
    cleanDir(tmpDir);
  }
});

test('build with --target ts outputs .ts files', () => {
  const tmpDir = makeTempDir();
  try {
    runCli(['init', 'ts-test'], { cwd: tmpDir });
    const projDir = path.join(tmpDir, 'ts-test');

    // Update config for ts
    const configPath = path.join(projDir, 'flare.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config.target = 'ts';
    fs.writeFileSync(configPath, JSON.stringify(config));

    const { stdout, exitCode } = runCli(['build'], { cwd: projDir });
    assert.strictEqual(exitCode, 0, `ts build failed: ${stdout}`);
    assert.ok(fs.existsSync(path.join(projDir, 'dist', 'components', 'app.ts')), '.ts file should exist');
  } finally {
    cleanDir(tmpDir);
  }
});

test('build fails on missing source directory', () => {
  const tmpDir = makeTempDir();
  try {
    // Create a minimal config pointing to nonexistent dir
    fs.writeFileSync(path.join(tmpDir, 'flare.config.json'), JSON.stringify({
      src: 'nonexistent',
      outdir: 'dist',
    }));

    const { stdout, exitCode } = runCli(['build'], { cwd: tmpDir });
    assert.strictEqual(exitCode, 1);
    assert.ok(stdout.includes('ソースディレクトリが見つかりません') || stdout.includes('.flare ファイルが見つかりません'));
  } finally {
    cleanDir(tmpDir);
  }
});

test('build reports diagnostics for invalid components', () => {
  const tmpDir = makeTempDir();
  try {
    // Create project with bad component
    const srcDir = path.join(tmpDir, 'src', 'components');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'flare.config.json'), JSON.stringify({
      src: 'src/components', outdir: 'dist',
    }));

    // Write a component with no template (should fail)
    fs.writeFileSync(path.join(srcDir, 'bad.flare'), '<meta>name: "x-bad"</meta><script>state x: number = 0</script>');

    const { stdout, exitCode } = runCli(['build'], { cwd: tmpDir });
    assert.strictEqual(exitCode, 1);
    assert.ok(stdout.includes('template') || stdout.includes('Failed'));
  } finally {
    cleanDir(tmpDir);
  }
});

// ============================================================
// TESTS: flare check
// ============================================================

test('check passes for valid components', () => {
  const tmpDir = makeTempDir();
  try {
    runCli(['init', 'check-test'], { cwd: tmpDir });
    const projDir = path.join(tmpDir, 'check-test');

    const { stdout, exitCode } = runCli(['check'], { cwd: projDir });
    assert.strictEqual(exitCode, 0, `check failed: ${stdout}`);
    assert.ok(stdout.includes('✓') || stdout.includes('app.flare'));
  } finally {
    cleanDir(tmpDir);
  }
});

test('check fails for invalid components', () => {
  const tmpDir = makeTempDir();
  try {
    const srcDir = path.join(tmpDir, 'src', 'components');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'flare.config.json'), JSON.stringify({
      src: 'src/components',
    }));

    // Component with undefined variable reference
    fs.writeFileSync(path.join(srcDir, 'err.flare'), `<meta>name: "x-err"</meta>
<script>state count: number = 0</script>
<template><div>{{ undefinedVar }}</div></template>`);

    const { stdout, exitCode } = runCli(['check'], { cwd: tmpDir });
    assert.strictEqual(exitCode, 1);
    assert.ok(stdout.includes('E0301') || stdout.includes('未定義'));
  } finally {
    cleanDir(tmpDir);
  }
});

test('check handles missing source directory', () => {
  const tmpDir = makeTempDir();
  try {
    fs.writeFileSync(path.join(tmpDir, 'flare.config.json'), JSON.stringify({
      src: 'nonexistent',
    }));

    const { stdout, exitCode } = runCli(['check'], { cwd: tmpDir });
    assert.strictEqual(exitCode, 1);
  } finally {
    cleanDir(tmpDir);
  }
});

// ============================================================
// TESTS: Config handling
// ============================================================

test('build works without config file (uses defaults)', () => {
  const tmpDir = makeTempDir();
  try {
    // Create src/components dir without config
    const srcDir = path.join(tmpDir, 'src', 'components');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'hello.flare'), `<meta>name: "x-hello"</meta>
<script>state msg: string = "hi"</script>
<template><div>{{ msg }}</div></template>`);

    const { stdout, exitCode } = runCli(['build', 'src/components'], { cwd: tmpDir });
    assert.strictEqual(exitCode, 0, `build without config failed: ${stdout}`);
  } finally {
    cleanDir(tmpDir);
  }
});

test('build handles malformed config JSON gracefully', () => {
  const tmpDir = makeTempDir();
  try {
    const srcDir = path.join(tmpDir, 'src', 'components');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'a.flare'), `<meta>name: "x-a"</meta>
<script>state x: number = 0</script>
<template><p>{{ x }}</p></template>`);

    // Write malformed JSON config
    fs.writeFileSync(path.join(tmpDir, 'flare.config.json'), '{invalid json!!!');

    // Should warn but still work with defaults
    // Warning may go to stderr which is merged into stdout in our helper on error
    const { stdout, exitCode } = runCli(['build', 'src/components'], { cwd: tmpDir });
    // Either succeeds (warning went to stderr but build used defaults) or includes warning
    assert.strictEqual(exitCode, 0, `build with bad config failed: ${stdout}`);
  } finally {
    cleanDir(tmpDir);
  }
});

// ============================================================
// TESTS: Build output quality
// ============================================================

test('build output generates valid JavaScript', () => {
  const tmpDir = makeTempDir();
  try {
    runCli(['init', 'jsvalid-test'], { cwd: tmpDir });
    const projDir = path.join(tmpDir, 'jsvalid-test');
    runCli(['build'], { cwd: projDir });

    // Validate generated JS syntax
    const appJs = fs.readFileSync(path.join(projDir, 'dist', 'components', 'app.js'), 'utf-8');
    assert.doesNotThrow(() => new Function(appJs), 'generated JS should be syntactically valid');
  } finally {
    cleanDir(tmpDir);
  }
});

test('build bundle includes all components', () => {
  const tmpDir = makeTempDir();
  try {
    runCli(['init', 'multi-test'], { cwd: tmpDir });
    const projDir = path.join(tmpDir, 'multi-test');
    const srcDir = path.join(projDir, 'src', 'components');

    // Add a second component
    fs.writeFileSync(path.join(srcDir, 'button.flare'), `<meta>name: "x-button"</meta>
<script>
prop label: string = "Click"
fn handleClick() {
  console.log("clicked")
}
</script>
<template><button @click="handleClick">{{ label }}</button></template>
<style>button { cursor: pointer; }</style>`);

    const { stdout, exitCode } = runCli(['build'], { cwd: projDir });
    assert.strictEqual(exitCode, 0, `multi build failed: ${stdout}`);

    const bundle = fs.readFileSync(path.join(projDir, 'dist', 'flare-bundle.js'), 'utf-8');
    assert.ok(bundle.includes('x-app'), 'bundle should contain x-app');
    assert.ok(bundle.includes('x-button'), 'bundle should contain x-button');
    assert.ok(bundle.includes('2 component(s)'), 'bundle header should show 2 components');
  } finally {
    cleanDir(tmpDir);
  }
});
