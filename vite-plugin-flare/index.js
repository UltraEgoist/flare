/**
 * vite-plugin-flare
 *
 * Vite plugin for compiling .flare files to Web Components.
 *
 * Usage:
 *   // vite.config.js
 *   import flare from 'vite-plugin-flare'
 *   export default {
 *     plugins: [flare()]
 *   }
 *
 * Options:
 *   - target: 'js' | 'ts' (default: 'js')
 *   - optimize: boolean (default: false) — enable tree-shaking
 *   - sourceMap: boolean (default: true)
 *
 * @module vite-plugin-flare
 */

const path = require('path');

/**
 * Create a Vite plugin for Flare components.
 *
 * @param {Object} [options] - Plugin options
 * @param {string} [options.target='js'] - Output target ('js' or 'ts')
 * @param {boolean} [options.optimize=false] - Enable tree-shaking optimization
 * @param {boolean} [options.sourceMap=true] - Generate source maps
 * @returns {import('vite').Plugin} Vite plugin
 */
function flarePlugin(options = {}) {
  const target = options.target || 'js';
  const optimize = options.optimize || false;
  const enableSourceMap = options.sourceMap !== false;

  // Lazy-load compiler to avoid startup cost
  let compile = null;

  function getCompiler() {
    if (!compile) {
      try {
        // Try to load from @aspect/flare package
        compile = require('@aspect/flare').compile;
      } catch {
        try {
          // Try relative path (monorepo development)
          compile = require('../flare-cli/lib/compiler').compile;
        } catch {
          throw new Error(
            'vite-plugin-flare: Could not find Flare compiler.\n' +
            'Install @aspect/flare as a devDependency:\n' +
            '  npm install -D @aspect/flare'
          );
        }
      }
    }
    return compile;
  }

  return {
    name: 'vite-plugin-flare',

    // Transform .flare files
    transform(code, id) {
      if (!id.endsWith('.flare')) return null;

      const compiler = getCompiler();
      const fileName = path.basename(id);

      const result = compiler(code, fileName, { target, optimize });

      if (!result.success) {
        // Format diagnostics as error message
        const errors = result.diagnostics
          .filter(d => d.level === 'error')
          .map(d => `[${d.code}] ${d.message}`)
          .join('\n');

        this.error(`Flare compilation failed for ${fileName}:\n${errors}`);
        return null;
      }

      // Collect warnings
      for (const d of result.diagnostics) {
        if (d.level === 'warning') {
          this.warn(`[${d.code}] ${d.message}`);
        }
      }

      // Strip the IIFE wrapper for ES module compatibility
      // The output is: import ...\n\n(() => { ... })();
      // We need to keep imports at top-level and unwrap the IIFE
      let output = result.output;

      // Remove sourceMappingURL comment (we provide our own via Vite)
      output = output.replace(/\n\/\/# sourceMappingURL=.*$/, '');

      // Generate source map if enabled
      let map = null;
      if (enableSourceMap && result.sourceMap) {
        map = {
          ...result.sourceMap,
          file: fileName.replace('.flare', '.js'),
          sources: [id],
        };
      }

      return {
        code: output,
        map,
      };
    },

    // Handle HMR for .flare files
    handleHotUpdate({ file, server, modules }) {
      if (!file.endsWith('.flare')) return;

      const affected = modules.filter(m =>
        m.file && m.file.endsWith('.flare')
      );

      if (affected.length > 0) {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
        return [];
      }
    },

    // Resolve .flare imports
    resolveId(source, importer) {
      // Handle bare .flare imports
      if (source.endsWith('.flare') && importer) {
        const resolved = path.resolve(path.dirname(importer), source);
        return resolved;
      }
      return null;
    },
  };
}

module.exports = flarePlugin;
module.exports.default = flarePlugin;
