import * as monaco from "monaco-editor";

const inputContainer = document.getElementById("input-content") as HTMLDivElement;
const outputContainer = document.getElementById("output-content") as HTMLDivElement;
const workerUrl = new URL("./repl.ts", import.meta.url);
const worker = new Worker(workerUrl, { type: "module" });

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

const commonTheme = {
  // fontFamily: "Geist-Mono",
  fontStyle: "monospace",
  fontSize: 16,
  minimap: { enabled: false },
  colorDecorators: false, // Disables hex color swatches and picker
  automaticLayout: true,
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Editor...");

  const inputEditor = monaco.editor.create(inputContainer, {
    value: inputContents.trim(),
    language: "javascript",
    ...commonTheme,
  });
  inputEditor.updateOptions({ fontFamily: "Georgia" });
  const outputEditor = monaco.editor.create(outputContainer, {
    language: "html",
    ...commonTheme,
  });
  outputEditor.updateOptions({ fontFamily: "Geist-Mono, monospace" });

  // listen for changes in the input editor and send the updated code to the worker for compilation
  inputEditor.onDidChangeModelContent(() => {
    worker.postMessage([inputEditor.getValue()]);
  });

  // once the worker sends back the compiled HTML, update the output editor with the result
  worker.onmessage = (result) => {
    outputEditor.setValue(result.data.html.trim());
  };

  // trigger an initial compilation with the default input contents
  worker.postMessage([inputEditor.getValue()]);
});
