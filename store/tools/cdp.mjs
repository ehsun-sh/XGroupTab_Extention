// Minimal Chrome DevTools Protocol driver (no dependencies) for screenshots & frame capture.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function launch() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars",
    "--force-device-scale-factor=1", "--allow-file-access-from-files", "--no-first-run",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "xgt-"))}`, "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {}
    await sleep(200);
  }
  const page = targets.find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  let seq = 0; const pending = new Map();
  ws.addEventListener("message", (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++seq; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  const api = {
    async open(file, w, h, query = "") {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await send("Page.navigate", { url: pathToFileURL(file).href + query });
      await sleep(900);
    },
    async scheme(v) { await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: v }] }); },
    async eval(expr) { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); return r.result && r.result.value; },
    async shot(out, clip) {
      const r = await send("Page.captureScreenshot", clip ? { format: "png", clip: { ...clip, scale: 1 } } : { format: "png" });
      writeFileSync(out, Buffer.from(r.data, "base64"));
    },
    async transparent() { await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } }); },
    async jpeg(out) { const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 92 }); writeFileSync(out, Buffer.from(r.data, "base64")); },
    close() { ws.close(); proc.kill(); }
  };
  return api;
}
