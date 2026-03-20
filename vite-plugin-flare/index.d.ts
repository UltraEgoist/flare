/**
 * vite-plugin-flare — Type definitions
 */

import type { Plugin } from 'vite';

export interface FlarePluginOptions {
  /** Output target: 'js' or 'ts' */
  target?: 'js' | 'ts';
  /** Enable tree-shaking optimization */
  optimize?: boolean;
  /** Generate source maps (default: true) */
  sourceMap?: boolean;
}

/** Create a Vite plugin for Flare components */
declare function flarePlugin(options?: FlarePluginOptions): Plugin;

export default flarePlugin;
export { flarePlugin };
