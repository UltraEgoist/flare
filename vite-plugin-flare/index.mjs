/**
 * vite-plugin-flare (ESM entry)
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
 * @module vite-plugin-flare
 */

import { createRequire } from 'module';
import { basename, resolve, dirname } from 'path';

const require = createRequire(import.meta.url);

/**
 * Create a Vite plugin for Flare components.
 *
 * @param {Object} [options] - Plugin options
 * @param {string} [options.target='js'] - Output target ('js' or 'ts')
 * @param {boolean} [options.optimize=false] - Enable tree-shaking optimization
 * @param {boolean} [options.sourceMap=true] - Generate source maps
 * @returns {import('vite').Plugin} Vite plugin
 */
export default function flarePlugin(options = {}) {
  const target = options.target || 'js';
  const optimize = options.optimize || false;
  const enableSourceMap = options.sourceMap !== false;

  // Lazy-load compiler to avoid startup cost
  let compile = null;

  function getCompiler() {
    if (!compile) {
      try {
        compile = require('@aspect/flare').compile;
      } catch {
        try {
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

    transform(code, id) {
      if (!id.endsWith('.flare')) return null;

      const compiler = getCompiler();
      const fileName = basename(id);
      const result = compiler(code, fileName, { target, optimize });

      if (!result.success) {
        const errors = result.diagnostics
          .filter(d => d.level === 'error')
          .map(d => `[${d.code}] ${d.message}`)
          .join('\n');
        this.error(`Flare compilation failed for ${fileName}:\n${errors}`);
        return null;
      }

      for (const d of result.diagnostics) {
        if (d.level === 'warning') {
          this.warn(`[${d.code}] ${d.message}`);
        }
      }

      let output = result.output;
      output = output.replace(/\n\/\/# sourceMappingURL=.*$/, '');

      let map = null;
      if (enableSourceMap && result.sourceMap) {
        map = {
          ...result.sourceMap,
          file: fileName.replace('.flare', '.js'),
          sources: [id],
        };
      }

      return { code: output, map };
    },

    handleHotUpdate({ file, server, modules }) {
      if (!file.endsWith('.flare')) return;

      const affected = modules.filter(m =>
        m.file && m.file.endsWith('.flare')
      );

      if (affected.length > 0) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      }
    },

    resolveId(source, importer) {
      if (source.endsWith('.flare') && importer) {
        return resolve(dirname(importer), source);
      }
      return null;
    },
  };
}
