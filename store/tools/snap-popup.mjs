// Renders the real popup (with mock data) into PNGs used inside the store screenshots.
import { launch } from "./cdp.mjs";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const out = resolve("../build/popup"); mkdirSync(out, { recursive: true });
const b = await launch();
for (const scheme of ["light", "dark"]) {
await b.scheme(scheme);
const file = resolve("popup-mock.html");
const cases = [
  ["site", "?view=site&lang=en", ""],
  ["site-expanded", "?view=site&lang=en", "document.querySelector('.list > li:first-child .toggle, .list > li:first-child button')?.click()"],
  ["group", "?view=group&lang=en", ""],
  ["fa", "?view=site&lang=fa", ""]
];
for (const [name, q, js] of cases) {
  await b.open(file, 420, 900, q);
  if (js) { await b.eval(js); await new Promise(r => setTimeout(r, 300)); }
  const h = await b.eval("Math.ceil(document.body.getBoundingClientRect().height)");
  await b.shot(`${out}/${name}-${scheme}.png`, { x: 0, y: 0, width: 420, height: Math.min(h, 900) });
  console.log(name, h);
}
}
b.close();
