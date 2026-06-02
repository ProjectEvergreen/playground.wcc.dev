import * as monaco from "monaco-editor";
import { prettify } from "htmlfy";
// TODO: https://github.com/brijeshb42/monaco-themes/issues/65
import nightOwlTheme from "../../node_modules/monaco-themes/themes/Night Owl.json" with { type: "json" };

// Token rule overrides applied on top of monaco-themes' Night Owl so the
// playground matches the Prism "Night Owl" theme used on the wcc.dev website
// (https://github.com/PrismJS/prism-themes/blob/master/themes/prism-night-owl.css).
// Monaco rules are evaluated in order, so appending these makes them win over
// the imported defaults for the same token scopes. See issue #23.
const prismAlignedRules: monaco.editor.ITokenThemeRule[] = [
  // Prism styles comments in italic; monaco-themes' Night Owl leaves them upright.
  { token: "comment", foreground: "637777", fontStyle: "italic" },
  { token: "comment.line.double-slash", foreground: "637777", fontStyle: "italic" },
  // Prism uses a single green (rgb(173,219,103) = #addb67) for all .token.string,
  // while monaco-themes' Night Owl uses peach (#ecc48d) for `string.quoted.*`.
  // Align the JS/TS string scopes that the playground actually renders.
  { token: "string.quoted", foreground: "addb67" },
  { token: "string.quoted.double", foreground: "addb67" },
  { token: "string.quoted.single", foreground: "addb67" },
];

const inputContainer = document.getElementById("input-content") as HTMLDivElement;
const outputContainer = document.getElementById("output-content") as HTMLDivElement;
const workerUrl = new URL("./repl.ts", import.meta.url);
const worker = new Worker(workerUrl, { type: "module" });

// TODO: https://github.com/ProjectEvergreen/playground.wcc.dev/issues/22
// self.MonacoEnvironment = {
// 	getWorkerUrl: function (moduleId, label) {
// 		if (label === 'json') {
// 			return './vs/language/json/json.worker.js';
// 		}
// 		if (label === 'css' || label === 'scss' || label === 'less') {
// 			return './vs/language/css/css.worker.js';
// 		}
// 		if (label === 'html' || label === 'handlebars' || label === 'razor') {
// 			return './vs/language/html/html.worker.js';
// 		}
// 		if (label === 'typescript' || label === 'javascript') {
// 			return './vs/language/typescript/ts.worker.js';
// 		}
// 		return './vs/editor/editor.worker.js';
// 	}
// };

const inputContents = `
const template = document.createElement('template');

template.innerHTML = \`
  <style>
    .footer {
      color: white;
      background-color: #192a27;
    }
  </style>

  <footer class="footer">
    <h4>My Blog &copy; \${new Date().getFullYear()}</h4>
  </footer>
\`;

class Footer extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

export default Footer;

customElements.define('wcc-footer', Footer);
`;

monaco.editor.defineTheme("custom-theme", {
  ...nightOwlTheme,
  // have to specify `base` explicitly or else TS complains
  base: "vs-dark",
  rules: [...nightOwlTheme.rules, ...prismAlignedRules],
});

const commonSettings = {
  fontStyle: "Geist-Mono",
  fontSize: 16,
  minimap: { enabled: false },
  colorDecorators: false, // Disables hex color swatches and picker
  automaticLayout: true,
  theme: "custom-theme",
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Editor...");

  const inputEditor = monaco.editor.create(inputContainer, {
    value: inputContents.trim(),
    language: "javascript",
    ...commonSettings,
  });
  const outputEditor = monaco.editor.create(outputContainer, {
    language: "html",
    ...commonSettings,
    readOnly: true,
  });

  // listen for changes in the input editor and send the updated code to the worker for compilation
  inputEditor.onDidChangeModelContent(() => {
    worker.postMessage([inputEditor.getValue()]);
  });

  // once the worker sends back the compiled HTML, update the output editor with the result
  worker.onmessage = (result) => {
    outputEditor.setValue(prettify(result.data.output));
  };

  // trigger an initial compilation with the default input contents
  worker.postMessage([inputEditor.getValue()]);
});
