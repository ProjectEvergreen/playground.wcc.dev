import { replBundlerResourcePlugin } from './repl-bundler-plugin.ts';
import type { Config } from "@greenwood/cli";

const config: Config = {
  plugins: [
    replBundlerResourcePlugin()
  ]
};

export default config;
