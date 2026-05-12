import { greenwoodPluginImportRaw } from "@greenwood/plugin-import-raw";
import { greenwoodPluginCssModules } from "@greenwood/plugin-css-modules";
import { greenwoodPluginImportJsx } from "@greenwood/plugin-import-jsx";
import { replBundlerResourcePlugin } from "./greenwood-plugins/repl-bundler-plugin.ts";
import { monacoEditorEsmShimPlugin } from "./greenwood-plugins/monaco-editor-esm-shim-plugin.ts";
import type { Config } from "@greenwood/cli";

const config: Config = {
  prerender: true,
  plugins: [
    greenwoodPluginCssModules(),
    greenwoodPluginImportRaw(),
    greenwoodPluginImportJsx(),
    replBundlerResourcePlugin(),
    monacoEditorEsmShimPlugin(),
  ],
};

export default config;
