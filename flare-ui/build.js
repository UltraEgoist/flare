#!/usr/bin/env node
/**
 * Build script for @aspect/flare-ui
 *
 * Compiles all .flare components in components/ to individual JS files
 * and a combined bundle (dist/flare-ui.js).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { compile } = require('../flare-cli/lib/compiler');

const COMPONENTS_DIR = path.join(__dirname, 'components');
const DIST_DIR = path.join(__dirname, 'dist');

function build() {
  // Ensure dist/ exists
  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

  const flareFiles = fs.readdirSync(COMPONENTS_DIR).filter(f => f.endsWith('.flare'));

  const bundleParts = [];
  const componentNames = [];
  let errorCount = 0;

  for (const file of flareFiles) {
    const src = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8');
    const result = compile(src, file);

    if (!result.success) {
      console.error(`✗ ${file}`);
      for (const d of result.diagnostics) {
        console.error(`  ${d.level}: ${d.message} (line ${d.span?.line || '?'})`);
      }
      errorCount++;
      continue;
    }

    // Strip sourceMappingURL for bundle
    const code = result.output.replace(/\n\/\/# sourceMappingURL=.*$/, '');

    // Write individual file
    const jsName = file.replace('.flare', '.js');
    fs.writeFileSync(path.join(DIST_DIR, jsName), result.output, 'utf-8');

    // Add to bundle
    const tagName = file.replace('.flare', '');
    bundleParts.push(`// ── ${tagName} ──\n${code}`);
    componentNames.push(tagName);

    // Warnings
    const warns = result.diagnostics.filter(d => d.level === 'warning');
    const status = warns.length > 0 ? `✓ ${file} (${warns.length} warning(s))` : `✓ ${file}`;
    console.log(status);
  }

  // Write combined bundle
  const banner = `/**\n * @aspect/flare-ui v0.1.0\n * Components: ${componentNames.join(', ')}\n * Generated: ${new Date().toISOString()}\n */\n\n`;
  const bundle = banner + bundleParts.join('\n\n');
  fs.writeFileSync(path.join(DIST_DIR, 'flare-ui.js'), bundle, 'utf-8');

  console.log(`\nBuild complete: ${componentNames.length} components → dist/flare-ui.js`);
  if (errorCount > 0) {
    console.error(`${errorCount} component(s) failed to compile.`);
    process.exit(1);
  }
}

build();
