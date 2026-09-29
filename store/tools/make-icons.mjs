import { launch } from "./cdp.mjs";
import { resolve } from "node:path";
const b = await launch();
await b.transparent();
for (const s of [16, 32, 48, 128]) {
  const f = s >= 48 ? "icon.svg" : "icon-small.svg";
  await b.open(resolve("icon.html"), s, s, `?f=${f}&s=${s}`);
  await b.eval(`document.documentElement.style.background='transparent'`);
  await b.shot(resolve(`../../icons/icon${s}.png`), { x: 0, y: 0, width: s, height: s });
}
b.close();
