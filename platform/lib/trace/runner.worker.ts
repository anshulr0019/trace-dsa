import { runCode } from "./interpreter";
self.onmessage = (event) => {
  const { code, inputs, id } = event.data;
  self.postMessage({ id, ...runCode(code, inputs) });
};
