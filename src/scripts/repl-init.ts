import * as monaco from "monaco-editor";
import { prettify } from "htmlfy";
// TODO: https://github.com/brijeshb42/monaco-themes/issues/65
import nightOwlTheme from "../../node_modules/monaco-themes/themes/Night Owl.json" with { type: "json" };

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

customElements.define('x-footer', Footer);
`;

monaco.editor.defineTheme("custom-theme", {
  ...nightOwlTheme,
  // have to specify `base` explicitly or else TS complains
  base: "vs-dark",
});

const commonSettings = {
  fontStyle: "Geist-Mono",
  fontSize: 16,
  minimap: { enabled: false },
  colorDecorators: false, // Disables hex color swatches and picker
  automaticLayout: true,
  theme: "custom-theme",
};

// https://gist.github.com/RoboPhred/f767bea5cbc972e04155a625dc11da11
// Important Bit #1: Typescript must see the 'file' it is editing as having a .tsx extension
const modelUri = monaco.Uri.file("file.tsx");

// Important Bit #2
// By default, monaco use the "value" property to create its own model without any extensions, so typescript assumes ".ts"
// We need to create a custom model using the desired file name (uri). See the last arg.
const codeModel = monaco.editor.createModel(
  inputContents.trim(),
  "typescript",
  modelUri, // Pass the file name to the model here.
);

// Important Bit #3: Tell typescript to use 'react' for jsx files.
// TODO: support wc-compiler jsxImportSource
monaco.typescript.typescriptDefaults.setCompilerOptions({
  jsx: monaco.typescript.JsxEmit.Preserve,
});

// TODO: additional diagnostics
monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Editor...");
  const languageSelector = document.getElementById("input-language") as HTMLSelectElement;

  const inputEditor = monaco.editor.create(inputContainer, {
    value: inputContents.trim(),
    language: "typescript",
    ...commonSettings,
  });
  const outputEditor = monaco.editor.create(outputContainer, {
    language: "html",
    ...commonSettings,
    readOnly: true,
  });

  inputEditor.setModel(codeModel);
  monaco.editor.setModelLanguage(inputEditor.getModel()!, "typescript");

  // listen for changes in the input editor and send the updated code to the worker for compilation
  inputEditor.onDidChangeModelContent(() => {
    worker.postMessage([inputEditor.getValue(), languageSelector.value ?? "javascript"]);
  });

  // once the worker sends back the compiled HTML, update the output editor with the result
  worker.onmessage = (result) => {
    if (result.data.err) {
      console.error("Error in worker:", result.data.err);
      outputEditor.setValue(`Error: ${result.data.err.message || result.data.err}`);
      return;
    }

    outputEditor.setValue(prettify(result.data.output));
  };

  // trigger an initial compilation with the default input contents
  worker.postMessage([inputEditor.getValue()]);
});
