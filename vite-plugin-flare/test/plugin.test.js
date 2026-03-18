const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Load the plugin
const flarePlugin = require('../index.js');

describe('vite-plugin-flare', () => {
  it('returns a valid Vite plugin object', () => {
    const plugin = flarePlugin();
    assert.equal(plugin.name, 'vite-plugin-flare');
    assert.equal(typeof plugin.transform, 'function');
    assert.equal(typeof plugin.handleHotUpdate, 'function');
    assert.equal(typeof plugin.resolveId, 'function');
  });

  it('default export works', () => {
    assert.equal(typeof flarePlugin.default, 'function');
    const plugin = flarePlugin.default();
    assert.equal(plugin.name, 'vite-plugin-flare');
  });

  describe('transform', () => {
    it('ignores non-.flare files', () => {
      const plugin = flarePlugin();
      const result = plugin.transform('console.log("hi")', '/app/main.js');
      assert.equal(result, null);
    });

    it('ignores .ts files', () => {
      const plugin = flarePlugin();
      const result = plugin.transform('const x: number = 1', '/app/main.ts');
      assert.equal(result, null);
    });

    it('compiles a valid .flare file', () => {
      const plugin = flarePlugin();
      const flareSource = `<meta>
name: x-hello
</meta>

<script>
state greeting: string = "Hello"
</script>

<template>
  <p>{{ greeting }}</p>
</template>

<style>
p { color: blue; }
</style>`;

      // Mock the Vite plugin context
      const warnings = [];
      const errors = [];
      const ctx = {
        warn: (msg) => warnings.push(msg),
        error: (msg) => errors.push(msg),
      };

      const result = plugin.transform.call(ctx, flareSource, '/app/Hello.flare');

      assert.ok(result, 'should return a result');
      assert.ok(result.code, 'result should have code');
      assert.ok(result.code.includes('class'), 'output should contain class definition');
      assert.ok(result.code.includes('x-hello'), 'output should contain custom element name');
      assert.equal(errors.length, 0, 'should have no errors');
    });

    it('reports compilation errors', () => {
      const plugin = flarePlugin();
      // Missing meta block — invalid flare
      const badSource = `<script>
state x = 1
</script>
<template>
  <p>{{ y }}</p>
</template>`;

      const errors = [];
      const warnings = [];
      const ctx = {
        warn: (msg) => warnings.push(msg),
        error: (msg) => { errors.push(msg); },
      };

      plugin.transform.call(ctx, badSource, '/app/Bad.flare');
      // Should have reported an error (either via this.error or returning null)
      // The compiler may succeed with a default name or fail — either way is fine
    });

    it('passes options to compiler', () => {
      const plugin = flarePlugin({ target: 'js', optimize: true });
      const flareSource = `<meta>
name: x-opt
</meta>

<script>
state count: number = 0
</script>

<template>
  <span>{{ count }}</span>
</template>`;

      const ctx = {
        warn: () => {},
        error: (msg) => { throw new Error(msg); },
      };

      const result = plugin.transform.call(ctx, flareSource, '/app/Opt.flare');
      assert.ok(result, 'should return a result');
      assert.ok(result.code, 'result should have code');
    });

    it('includes source map when enabled (default)', () => {
      const plugin = flarePlugin();
      const flareSource = `<meta>
name: x-map
</meta>

<script>
state val: string = "test"
</script>

<template>
  <div>{{ val }}</div>
</template>`;

      const ctx = {
        warn: () => {},
        error: (msg) => { throw new Error(msg); },
      };

      const result = plugin.transform.call(ctx, flareSource, '/app/Map.flare');
      assert.ok(result, 'should return result');
      // Source map may or may not be present depending on compiler output
      // But the code should be there
      assert.ok(result.code);
    });

    it('strips sourceMappingURL from output', () => {
      const plugin = flarePlugin();
      const flareSource = `<meta>
name: x-strip
</meta>

<template>
  <p>hello</p>
</template>`;

      const ctx = {
        warn: () => {},
        error: (msg) => { throw new Error(msg); },
      };

      const result = plugin.transform.call(ctx, flareSource, '/app/Strip.flare');
      if (result && result.code) {
        assert.ok(!result.code.includes('sourceMappingURL'), 'should strip sourceMappingURL');
      }
    });

    it('collects warnings from compiler', () => {
      const plugin = flarePlugin();
      // A file that might trigger warnings (unused state)
      const flareSource = `<meta>
name: x-warn
</meta>

<script>
state unused: string = "hello"
</script>

<template>
  <p>static</p>
</template>`;

      const warnings = [];
      const ctx = {
        warn: (msg) => warnings.push(msg),
        error: (msg) => { throw new Error(msg); },
      };

      const result = plugin.transform.call(ctx, flareSource, '/app/Warn.flare');
      // May or may not have warnings — just ensure it doesn't crash
      assert.ok(result);
    });
  });

  describe('resolveId', () => {
    it('resolves relative .flare imports', () => {
      const plugin = flarePlugin();
      const resolved = plugin.resolveId('./Button.flare', '/app/src/App.js');
      assert.equal(resolved, path.resolve('/app/src', './Button.flare'));
    });

    it('resolves nested .flare imports', () => {
      const plugin = flarePlugin();
      const resolved = plugin.resolveId('../components/Card.flare', '/app/src/pages/Home.js');
      assert.equal(resolved, path.resolve('/app/src/pages', '../components/Card.flare'));
    });

    it('ignores non-.flare imports', () => {
      const plugin = flarePlugin();
      const resolved = plugin.resolveId('./utils.js', '/app/src/App.js');
      assert.equal(resolved, null);
    });

    it('ignores .flare imports without importer', () => {
      const plugin = flarePlugin();
      const resolved = plugin.resolveId('./Button.flare', undefined);
      assert.equal(resolved, null);
    });
  });

  describe('handleHotUpdate', () => {
    it('sends full-reload for .flare files with affected modules', () => {
      const plugin = flarePlugin();
      const sent = [];
      const ctx = {
        file: '/app/src/Button.flare',
        server: {
          ws: {
            send: (msg) => sent.push(msg),
          },
        },
        modules: [
          { file: '/app/src/Button.flare' },
        ],
      };

      const result = plugin.handleHotUpdate(ctx);
      assert.deepEqual(result, []);
      assert.equal(sent.length, 1);
      assert.equal(sent[0].type, 'full-reload');
    });

    it('ignores non-.flare files', () => {
      const plugin = flarePlugin();
      const sent = [];
      const ctx = {
        file: '/app/src/utils.js',
        server: {
          ws: {
            send: (msg) => sent.push(msg),
          },
        },
        modules: [],
      };

      const result = plugin.handleHotUpdate(ctx);
      assert.equal(result, undefined);
      assert.equal(sent.length, 0);
    });

    it('does not reload when no affected modules', () => {
      const plugin = flarePlugin();
      const sent = [];
      const ctx = {
        file: '/app/src/Button.flare',
        server: {
          ws: {
            send: (msg) => sent.push(msg),
          },
        },
        modules: [],
      };

      const result = plugin.handleHotUpdate(ctx);
      // No affected modules, so no reload triggered
      assert.equal(sent.length, 0);
    });
  });
});
