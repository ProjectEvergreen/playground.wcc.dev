import * as rollup from "rollup";
// TODO: depend on these modules first party?  Does Greenwood need bumps for these too?
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import type { ResourcePlugin } from "@greenwood/cli";

// TODO: could we use this? - https://www.npmjs.com/package/rollup-plugin-polyfill-node
function externalizeFsBuiltinRollupPlugin() {
  return {
    name: "externalize-fs-builtin",
    resolveId(source: string) {
      if (source === "fs") {
        return source;
      }
      return null;
    },
    load(id: string) {
      if (id === "fs") {
        // assumes utf-8 encoding
        return `
          const fs = {
            readFileSync: (url) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', url.href, false); 
              xhr.send(null);

              if (xhr.status === 200) {
                return xhr.responseText;
              }
            },
            promises: {
              readFile: async function(url) {
                const response = await fetch(url);
                const text = await response.text();

                return text;
              },
            }
          }

          export default fs;
        `;
      }
      return null;
    },
  };
}

class ReplBundlerResource {
  extensions: string[];

  constructor() {
    this.extensions = [];
  }

  async shouldIntercept(url: URL) {
    return url.pathname.endsWith("scripts/repl.ts");
  }

  async intercept(url: URL) {
    const bundle = await rollup.rollup({
      input: url.pathname,
      treeshake: false,
      plugins: [externalizeFsBuiltinRollupPlugin(), nodeResolve(), commonjs()],
      onLog(level, log) {
        // silence circular dependency warnings from sucrase
        if (
          log.pluginCode === "CIRCULAR_DEPENDENCY" &&
          log.message.includes("node_modules/sucrase")
        ) {
          return;
        }
      },
    });
    const { output } = await bundle.generate({
      format: "esm",
    });

    return new Response(output[0].code, {
      headers: {
        "Content-Type": "text/javascript",
      },
    });
  }
}

export function replBundlerResourcePlugin(): ResourcePlugin {
  return {
    type: "resource",
    name: "repl-bundler-resource-plugin",
    provider: () => new ReplBundlerResource(),
  };
}
