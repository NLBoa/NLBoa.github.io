// Frame times in a browser that cannot be scripted: Safari, DuckDuckGo (both Safari's engine).
//
// Every other check here drives Chrome, and Chrome hides what Safari's engine does differently:
// it halves the frame rate in Low Power Mode, and it repaints (and re-filters) page layers that
// Chrome keeps. This script serves the built site, opens a page in the named app that holds
// the site in a frame, and that page films one visit: resting on the desk, moving the pointer
// across it, clicking the left monitor, pressing Esc. It reports how long each frame took.
//
// Usage: npm run build, then
//   npm run frames -- Safari
//   npm run frames -- DuckDuckGo --runs 3
//   npm run frames -- Safari --css ".city{display:none}"     (the same visit with extra CSS: to find what costs)
// The browser window comes to the front and must stay there; one run takes about 12 seconds.
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const app = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--")) ?? "Safari";
const runs = Number(option("--runs", 1));
const css = option("--css", "");
const port = Number(process.env.PORT ?? 3311);
const root = path.resolve(import.meta.dirname, "../out");

if (!existsSync(root)) {
  console.error("There is no out/ folder yet. Run `npm run build` first.");
  process.exit(1);
}

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".glb": "model/gltf-binary", ".woff2": "font/woff2", ".ico": "image/x-icon", ".pdf": "application/pdf",
};

// The page the browser opens. It runs in the browser, so it is kept as a function and sent as text.
function film(css, run, runs) {
  const frame = document.querySelector("iframe");
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  frame.addEventListener("load", async () => {
    const w = frame.contentWindow;
    const d = frame.contentDocument;
    if (w.__filming) return;
    w.__filming = true;
    if (css) d.head.appendChild(Object.assign(d.createElement("style"), { textContent: css }));
    await wait(5000); // the desk loads, fades in and pulses once

    const frames = [];
    const marks = {};
    let last = w.performance.now();
    const tick = (now) => {
      frames.push([now, now - last]);
      last = now;
      w.requestAnimationFrame(tick);
    };
    w.requestAnimationFrame(tick);
    const mark = (name) => (marks[name] = w.performance.now());

    mark("idle");
    await wait(2500);
    mark("pointer");
    const canvas = d.querySelector("canvas") ?? d.body;
    for (let i = 0; i <= 90; i++) {
      const clientX = w.innerWidth * (0.2 + 0.6 * (i / 90));
      const clientY = w.innerHeight * (0.6 - 0.25 * Math.sin((i / 90) * Math.PI));
      canvas.dispatchEvent(new w.PointerEvent("pointermove", { bubbles: true, clientX, clientY, pointerType: "mouse" }));
      await wait(16);
    }
    await wait(700);
    mark("open");
    // The desk's own link for the left monitor: it flies the camera there, like a click on the screen.
    [...d.querySelectorAll(".hotspots a")].find((a) => /\/projects\/?$/.test(a.getAttribute("href")))?.click();
    await wait(2000);
    const opened = w.location.pathname;
    mark("close");
    d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await wait(2000);
    mark("end");

    const report = {
      run,
      browser: navigator.userAgent.split(" ").slice(-2).join(" "),
      size: `${w.innerWidth}x${w.innerHeight} @${w.devicePixelRatio}x`,
      opened,
      closed: w.location.pathname,
      seen: document.visibilityState === "visible" && document.hasFocus(),
      frames,
      marks,
    };
    await fetch("/__report", { method: "POST", body: JSON.stringify(report) });
    if (run < runs) location.search = `?run=${run + 1}`;
    else document.querySelector("p").textContent = "Done. This tab can be closed.";
  });
  frame.src = "/";
}

const harness = (run) => `<!doctype html><meta charset="utf-8"><title>Frame times</title>
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe{border:0;width:100vw;height:100vh;display:block}
p{position:fixed;left:8px;bottom:8px;margin:0;padding:2px 6px;background:#000c;color:#9f9;font:12px monospace}</style>
<p>Measuring, run ${run} of ${runs}. Keep this window in front.</p><iframe></iframe>
<script>(${film})(${JSON.stringify(css)}, ${run}, ${runs})</script>`;

/** One line per run: for each part of the visit, the usual frame, the longest, and how many came late. */
function summarize(report) {
  const part = (from, to) => {
    const rows = report.frames.filter(([at]) => at >= report.marks[from] && at < report.marks[to]);
    if (!rows.length) return "no frames";
    const times = rows.map(([, took]) => took);
    const usual = [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)];
    // A late frame, and when it came: milliseconds after this part of the visit began.
    const late = rows.filter(([, took]) => took > usual * 1.4).map(([at, took]) => `${Math.round(took)} ms at ${Math.round(at - report.marks[from])}`);
    return `${Math.round(usual)} ms usual, ${String(Math.round(Math.max(...times))).padStart(3)} ms longest, ${late.length} late${late.length ? ` (${late.join(", ")})` : ""}`;
  };
  const wrong = report.opened !== "/projects/" || report.closed !== "/" ? `  (the page did not open and close: ${report.opened}, ${report.closed})` : "";
  const unseen = report.seen ? "" : "  (the window was not in front: these numbers mean nothing)";
  console.log(`\nRun ${report.run}: ${report.browser}, ${report.size}${wrong}${unseen}`);
  console.log(`  resting on the desk   ${part("idle", "pointer")}`);
  console.log(`  pointer over the desk ${part("pointer", "open")}`);
  console.log(`  opening Projects      ${part("open", "close")}`);
  console.log(`  closing it            ${part("close", "end")}`);
}

let received = 0;
const server = createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/__frames") {
    response.writeHead(200, { "content-type": types[".html"], "cache-control": "no-store" });
    return response.end(harness(Number(url.searchParams.get("run") ?? 1)));
  }
  if (url.pathname === "/__report") {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      response.end("ok");
      summarize(JSON.parse(body));
      if (++received >= runs) server.close(() => process.exit(0));
    });
    return;
  }
  const send = (status, file) => {
    response.writeHead(status, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  };
  const file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) return send(404, path.join(root, "404.html"));
  if (existsSync(file) && statSync(file).isDirectory()) {
    const index = path.join(file, "index.html");
    return existsSync(index) ? send(200, index) : send(404, path.join(root, "404.html"));
  }
  return existsSync(file) ? send(200, file) : send(404, path.join(root, "404.html"));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Opening ${app}: ${runs} run${runs === 1 ? "" : "s"}, about ${runs * 12} seconds.${css ? ` Extra CSS: ${css}` : ""}`);
  execFile("open", ["-a", app, `http://127.0.0.1:${port}/__frames`], (error) => {
    if (error) {
      console.error(`Could not open ${app}: ${error.message.trim()}`);
      process.exit(1);
    }
  });
});
setTimeout(() => {
  console.error("\nNo report came back. Is the browser window in front, and did the page load?");
  process.exit(1);
}, (runs * 20 + 20) * 1000).unref();
