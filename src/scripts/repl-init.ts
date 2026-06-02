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

customElements.define('wcc-footer', Footer);
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

const extensionLanguageMapper = {
  js: "javascript",
  ts: "typescript",
  jsx: "javascript",
  tsx: "typescript",
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Editor...");
  const languageSelector = document.getElementById("input-language") as HTMLSelectElement;

  const inputEditor = monaco.editor.create(inputContainer, {
    value: inputContents.trim(),
    language:
      extensionLanguageMapper[languageSelector.value as keyof typeof extensionLanguageMapper] ??
      "javascript",
    ...commonSettings,
  });
  const outputEditor = monaco.editor.create(outputContainer, {
    language: "html",
    ...commonSettings,
    readOnly: true,
  });

  languageSelector.addEventListener("change", () => {
    const language =
      extensionLanguageMapper[languageSelector.value as keyof typeof extensionLanguageMapper] ??
      "javascript";
    monaco.editor.setModelLanguage(inputEditor.getModel()!, language);
  });

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
