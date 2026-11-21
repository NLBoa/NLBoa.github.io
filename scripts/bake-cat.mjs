// Builds public/models/cat.bin from the cat's shape in src/scene/cat/build/.
// Node runs the TypeScript directly (type stripping), so those files import each other with ".ts".
//
//   npm run assets:cat

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const started = performance.now();
const { bake } = await import(path.join(root, "src/scene/cat/build/bake.ts"));
const { file, vertices, triangles, headStart } = bake();

const out = path.join(root, "public/models/cat.bin");
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, Buffer.from(file));

console.log(
  `cat.bin: ${vertices} vertices, ${triangles} triangles (${headStart / 3} body, ${triangles - headStart / 3} head and ears), ` +
    `${(file.byteLength / 1024).toFixed(1)} KB, ${((performance.now() - started) / 1000).toFixed(1)} s`,
);
