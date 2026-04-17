import { generate } from "astring";
// @ts-expect-error
import { ACORN_OPTIONS } from "@greenwood/cli/src/lib/parsing-utils.js";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import type { ResourcePlugin } from "@greenwood/cli";

// https://github.com/microsoft/monaco-editor/issues/886
// have to strip out CSS `import` statements from the ESM build of Monaco Editor,
// otherwise the browser will attempt to load them as ESM and fail
class StripCssImportsResource {
  extensions: string[];
  contentType: string;

  constructor() {
    this.extensions = ["js"];
    this.contentType = "application/javascript";
  }

  async shouldIntercept(url: URL) {
    return url.pathname.includes("node_modules/monaco-editor") && url.pathname.endsWith(".js");
  }

  async intercept(url: URL, request: Request, response: Response) {
    // console.log("Intercepting Monaco Editor ESM resource:", url.pathname);
    const contents = await response.text();
    // TODO: acorn my be too heavy for this. could maybe just do a naive string replace
    const tree = acorn.parse(contents, ACORN_OPTIONS);

    walk.simple(tree, {
      ImportDeclaration(node) {
        // @ts-expect-error for us value will (probably) always be a string
        if (node?.source?.value?.endsWith(".css")) {
          // console.log("Stripping CSS import:", node.source.value);

          tree.body.forEach((element) => {
            if (
              element.type === "ImportDeclaration" &&
              element.source.value === node.source.value
            ) {
              // Remove the element from the body
              tree.body = tree.body.filter((child) => child !== element);
            }
          });
        }
      },
    });

    return new Response(generate(tree), {
      headers: {
        "Content-Type": this.contentType,
      },
    });
  }
}

export function monacoEditorEsmShimPlugin(): ResourcePlugin {
  return {
    type: "resource",
    name: "monaco-editor-esm-shim-plugin:resource",
    provider: () => new StripCssImportsResource(),
  };
}
