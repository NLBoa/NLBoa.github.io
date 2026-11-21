/**
 * Surface nets: turns a distance field (negative inside) into a smooth closed mesh.
 * One vertex per grid cell the surface passes through, one quad per grid edge it crosses.
 */

import type { Vec3 } from "../rig.ts";

export type Field = (x: number, y: number, z: number) => number;

export function surfaceNets(field: Field, min: Vec3, max: Vec3, cell: number): { positions: number[]; indices: number[] } {
  const nx = Math.ceil((max[0] - min[0]) / cell) + 1;
  const ny = Math.ceil((max[1] - min[1]) / cell) + 1;
  const nz = Math.ceil((max[2] - min[2]) / cell) + 1;
  const values = new Float32Array(nx * ny * nz);
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);

  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) values[at(i, j, k)] = field(min[0] + i * cell, min[1] + j * cell, min[2] + k * cell);

  const cellVertex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cellAt = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const positions: number[] = [];

  // The 12 edges of a cell as pairs of corner numbers (corner = x + 2y + 4z).
  const edges = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7];
  const corner = new Float32Array(8);

  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let inside = 0;
        for (let c = 0; c < 8; c++) {
          const v = values[at(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))];
          corner[c] = v;
          if (v < 0) inside++;
        }
        if (inside === 0 || inside === 8) continue;
        let x = 0;
        let y = 0;
        let z = 0;
        let n = 0;
        for (let e = 0; e < 24; e += 2) {
          const a = edges[e];
          const b = edges[e + 1];
          const va = corner[a];
          const vb = corner[b];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          x += (a & 1) + t * ((b & 1) - (a & 1));
          y += ((a >> 1) & 1) + t * (((b >> 1) & 1) - ((a >> 1) & 1));
          z += ((a >> 2) & 1) + t * (((b >> 2) & 1) - ((a >> 2) & 1));
          n++;
        }
        cellVertex[cellAt(i, j, k)] = positions.length / 3;
        positions.push(min[0] + (i + x / n) * cell, min[1] + (j + y / n) * cell, min[2] + (k + z / n) * cell);
      }

  const indices: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) indices.push(a, c, b, a, d, c);
    else indices.push(a, b, c, a, c, d);
  };

  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const v = values[at(i, j, k)] < 0;
        // An edge along +x, +y, +z from this node: the four cells around it make a quad.
        if (v !== values[at(i + 1, j, k)] < 0)
          quad(cellVertex[cellAt(i, j - 1, k - 1)], cellVertex[cellAt(i, j, k - 1)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j - 1, k)], !v);
        if (v !== values[at(i, j + 1, k)] < 0)
          quad(cellVertex[cellAt(i - 1, j, k - 1)], cellVertex[cellAt(i - 1, j, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j, k - 1)], !v);
        if (v !== values[at(i, j, k + 1)] < 0)
          quad(cellVertex[cellAt(i - 1, j - 1, k)], cellVertex[cellAt(i, j - 1, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i - 1, j, k)], !v);
      }

  return { positions, indices };
}

/** The field's gradient, normalized: the surface normal at a point on it. */
export function gradient(field: Field, x: number, y: number, z: number, eps: number): Vec3 {
  const gx = field(x + eps, y, z) - field(x - eps, y, z);
  const gy = field(x, y + eps, z) - field(x, y - eps, z);
  const gz = field(x, y, z + eps) - field(x, y, z - eps);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
}
