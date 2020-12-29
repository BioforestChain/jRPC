import { HolderReflect } from "@bfchain/comlink";
import { installWebEnv } from "./envWrapper/webEnv";

function testRunner(scriptUrl?: string) {
  const A = "~aAa~";
  installWebEnv(
    scriptUrl,
    (moduleA) => {
      /**随便一个常量 */
      const a = A;
      moduleA.export(a, "a");
      moduleA.export(document, "document");
    },
    async (moduleB, console) => {
      const a = await moduleB.import<typeof A>("a");
      Reflect.set(globalThis, "a", a);
      console.assert(a === A, "import");

      const document = await moduleB.import<Document>("document");
      Reflect.set(globalThis, "document", document);
      const div = await document.createElement<HTMLDivElement>("div");
      const id = `id-${self.name}-${Math.random().toString(36).slice(2)}`;
      const textContent = `T~${self.name}~#${id}~T`;
      div.id = id;
      div.textContent = textContent;

      document.body.appendChild(div as never);
      console.log(await div.textContent);
      console.assert((await div.textContent) === textContent, "textContent");
      const div2 = await document.querySelector<HTMLDivElement>("#" + id);

      console.assert(
        JSON.stringify(HolderReflect.getHolderReflect(div)!.getIOB()) ===
          JSON.stringify(HolderReflect.getHolderReflect(div2)!.getIOB()),
        "ref",
      );
    },
    (moduleB, console) => {
      /// test import
      const a = moduleB.import<typeof A>("a");
      Reflect.set(self, "a", a);
      console.assert(a === A, "import");

      const document = moduleB.import<Document>("document");
      Reflect.set(self, "document", document);
      const div = document.createElement("div");
      const id = `id-${self.name}-${Math.random().toString(36).slice(2)}`;
      const textContent = `T~${self.name}~#${id}~T`;
      div.id = id;
      div.textContent = textContent;
      document.body.appendChild(div);
      console.assert(div.textContent === textContent, "textContent");
      const div2 = document.querySelector<HTMLDivElement>("#" + id);
      console.assert(div2 === div, "ref");
    },
  );
}
Reflect.set(self, "testRunner", testRunner);
if (typeof document !== "object") {
  testRunner();
} else {
  testRunner(document.querySelector("script")!.src);
}
