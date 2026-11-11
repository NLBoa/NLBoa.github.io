// Serves the exported site (out/) the way GitHub Pages does: under the base
// path, folders answer with their index.html, and unknown addresses get
// 404.html with status 404.
// Usage: npm run preview   (after npm run build; honors NEXT_PUBLIC_BASE_PATH and PORT)
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../out");
const prefix = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const port = Number(process.env.PORT ?? 3200);

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".svg": "image/svg+xml", ".png": "image/png",
  ".webp": "image/webp", ".glb": "model/gltf-binary", ".woff2": "font/woff2", ".ico": "image/x-icon", ".pdf": "application/pdf",
};

if (!existsSync(root)) {
  console.error("There is no out/ folder yet. Run `npm run build` first.");
  process.exit(1);
}

createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const send = (status, file) => {
    response.writeHead(status, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  };
  const notFound = () => send(404, path.join(root, "404.html"));

  if (prefix && url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return notFound();
  const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || "/";
  const file = path.join(root, relative);
  if (!file.startsWith(root)) return notFound();

  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith("/")) {
      response.writeHead(301, { location: `${url.pathname}/${url.search}` });
      return response.end();
    }
    const index = path.join(file, "index.html");
    return existsSync(index) ? send(200, index) : notFound();
  }
  if (existsSync(file)) return send(200, file);
  if (existsSync(`${file}.html`)) return send(200, `${file}.html`);
  return notFound();
}).listen(port, () => console.log(`http://localhost:${port}${prefix}/`));
