// Records promo.html frame-by-frame and encodes MP4 (1280x720, 30fps) with ffmpeg.
import { launch } from "./cdp.mjs";
import { resolve } from "node:path";
import { mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
const FPS = 30;
const only = process.argv.slice(2).map(Number);
const frames = resolve("../build/frames");
rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
const b = await launch();
await b.scheme("light");
await b.open(resolve("../promo/promo.html"), 1280, 720, "?record");
const total = await b.eval("XGT.TOTAL");
if (only.length) {
  for (const s of only) { await b.eval(`XGT.seek(${s})`); await b.shot(`${frames}/t${s}.png`); }
  b.close(); process.exit(0);
}
const n = Math.round(total * FPS);
for (let i = 0; i <= n; i++) {
  await b.eval(`XGT.seek(${i / FPS})`);
  await b.jpeg(`${frames}/f${String(i).padStart(5, "0")}.jpg`);
}
b.close();
const out = resolve("../assets/promo-video-1280x720.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${frames}/f%05d.jpg`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", out]);
console.log("wrote", out, n + 1, "frames");
