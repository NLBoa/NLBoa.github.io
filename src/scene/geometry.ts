import { BoxGeometry, ExtrudeGeometry, Shape, type BufferGeometry } from "three";

/** A rectangle with rounded corners, centered on the origin. */
export function roundedRect(width: number, height: number, radius: number): Shape {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w, h - r);
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w + r, h);
  shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w, -h + r);
  shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

type SlabOptions = {
  width: number;
  /** Thickness along the extrusion axis. */
  thickness: number;
  /** The other in-plane dimension. */
  length: number;
  /** Corner radius seen face-on. */
  radius: number;
  /** Softening of the two face edges. */
  bevel?: number;
  /**
   * "flat": lies on the desk (width x, thickness y, length z), origin at the
   * bottom center. "upright": faces the viewer (width x, length y,
   * thickness z), origin at the center.
   */
  orientation: "flat" | "upright";
  curveSegments?: number;
};

/** A rounded-corner plate: trackpad, keyboard body, monitor shell, keys. */
export function slab({
  width,
  thickness,
  length,
  radius,
  bevel = 0,
  orientation,
  curveSegments = 6,
}: SlabOptions): BufferGeometry {
  const b = Math.min(bevel, thickness / 2 - 1e-5);
  const geometry = new ExtrudeGeometry(roundedRect(width - b * 2, length - b * 2, radius - b), {
    depth: thickness - b * 2,
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments,
  });
  if (orientation === "flat") {
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, b, 0);
  } else {
    geometry.translate(0, 0, -thickness / 2 + b);
  }
  return geometry;
}

/**
 * A box whose UVs are in real units, so a tiling texture keeps its scale on
 * every face. Texture V (the wood grain) runs along the box's width.
 */
export function woodBox(width: number, height: number, depth: number, tile: number): BufferGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    if (Math.abs(normal.getY(i)) > 0.5) uv.setXY(i, z / tile, x / tile);
    else if (Math.abs(normal.getZ(i)) > 0.5) uv.setXY(i, y / tile, x / tile);
    else uv.setXY(i, y / tile, z / tile);
  }
  uv.needsUpdate = true;
  return geometry;
}
