import { renderToString } from "wc-compiler";

onmessage = async (e) => {
  console.log("Worker: Message received from main script", { e });
  const input = e.data[0];
  const language = e.data[1] ?? "javascript";
  const props = e.data[2] ?? null;
  const wrappingEntryTag = true;

  console.log({ input, language, props });

  let err;
  let output;

  try {
    const inputURL = URL.createObjectURL(new Blob([input], { type: "application/javascript" }));
    const { html } = await renderToString(new URL(inputURL), wrappingEntryTag, props);

    output = html;
  } catch (e) {
    console.error(e);
    err = e;
  }

  if (err) {
    postMessage({ err });
  } else {
    console.log("Worker: Posting message back to main script", { output });
    postMessage({ output });
  }
};
