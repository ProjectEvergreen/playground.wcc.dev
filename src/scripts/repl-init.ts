import * as monaco from "monaco-editor/esm/vs/editor/editor.main.js";

const inputContainer = document.getElementById("input-container") as HTMLDivElement;
const outputContainer = document.getElementById("output-container") as HTMLDivElement;
const workerUrl = new URL("./repl.ts", import.meta.url);
const worker = new Worker(workerUrl, { type: "module" });

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
      <h4>My Blog &copy; ${new Date().getFullYear()}</h4>
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

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Monaco Editor...", { monaco });

  const inputEditor = monaco.editor.create(inputContainer, {
    value: inputContents,
    language: "javascript",
  });

  const outputEditor = monaco.editor.create(outputContainer, {
    // value: "<h1>Output</h1>",
    language: "html",
  });

  inputEditor.onDidChangeModelContent(() => {
    const inputContent = inputEditor.getValue();
    console.log("Input content changed", { inputContent });
    // const worker = new Worker(workerUrl, { type: "module" });
    worker.postMessage([inputContent]);
  });

  worker.onmessage = (result) => {
    outputEditor.setValue(result.data.html);
  };

  worker.postMessage([inputEditor.getValue()]);
});
