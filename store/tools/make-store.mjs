import { launch } from "./cdp.mjs";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
const out = resolve("../assets"); mkdirSync(out, { recursive: true });
const b = await launch();
for (const n of [1, 2, 3, 4, 5]) { await b.open(resolve("scenes.html"), 1280, 800, `?s=${n}`); await b.shot(`${out}/screenshot-${n}.png`); }
await b.open(resolve("scenes.html"), 440, 280, "?s=small"); await b.shot(`${out}/promo-small-440x280.png`);
await b.open(resolve("scenes.html"), 1400, 560, "?s=marquee"); await b.shot(`${out}/promo-marquee-1400x560.png`);
b.close();
