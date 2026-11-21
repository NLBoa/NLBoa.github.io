import {
  BufferAttribute,
  Data3DTexture,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  RGFormat,
  RepeatWrapping,
  UnsignedByteType,
} from "three";

/** Fur lengths in the model file are stored as a fraction of this (see build/bake.ts). */
export const FUR_MAX = 0.08;

/**
 * The model file as a geometry. The fur is drawn as "shells": the same skin drawn many times,
 * each copy pushed a little further out along the strands, with only the strands that reach that
 * far left in. The copies are instances of one geometry, so the whole coat is one draw call.
 */
export function catGeometry(file: ArrayBuffer, shells: number): { body: InstancedBufferGeometry; head: InstancedBufferGeometry } {
  const view = new DataView(file);
  if (String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)) !== "CAT1") {
    throw new Error("not a cat model");
  }
  const count = view.getUint32(4, true);
  const indexCount = view.getUint32(8, true);
  const headStart = view.getUint32(12, true);
  let o = 16;
  const take = <T>(make: (offset: number) => T, bytes: number): T => {
    const array = make(o);
    o += bytes;
    return array;
  };
  const position = take((at) => new Float32Array(file, at, count * 3), count * 12);
  const normal = take((at) => new Int8Array(file, at, count * 4), count * 4);
  const skinIndex = take((at) => new Uint8Array(file, at, count * 4), count * 4);
  const skinWeight = take((at) => new Uint8Array(file, at, count * 4), count * 4);
  const coat = take((at) => new Uint8Array(file, at, count * 4), count * 4);
  const fur = take((at) => new Int8Array(file, at, count * 4), count * 4);
  const index = new Uint16Array(file, o, indexCount);

  const attributes = {
    position: new BufferAttribute(position, 3),
    normal: new BufferAttribute(normal, 4, true),
    skinIndex: new BufferAttribute(skinIndex, 4),
    skinWeight: new BufferAttribute(skinWeight, 4, true),
    coat: new BufferAttribute(coat, 4, true),
    fur: new BufferAttribute(fur, 4, true),
  };
  const indices = new BufferAttribute(index, 1);

  // Two parts of the one model, sharing its data: the body's long coat needs every layer, the
  // shorter fur of the head and paws fewer.
  const part = (start: number, count: number, layers: number) => {
    const geometry = new InstancedBufferGeometry();
    for (const [name, attribute] of Object.entries(attributes)) geometry.setAttribute(name, attribute);
    geometry.setIndex(indices);
    geometry.setDrawRange(start, count);
    // Outermost shell first, so the strands in front hide the fur under them early.
    const heights = new Float32Array(layers);
    for (let i = 0; i < layers; i++) heights[i] = 1 - i / (layers - 1);
    geometry.setAttribute("shell", new InstancedBufferAttribute(heights, 1));
    geometry.instanceCount = layers;
    return geometry;
  };
  return { body: part(0, headStart, shells), head: part(headStart, indexCount - headStart, Math.max(8, Math.round(shells * 0.75))) };
}

/**
 * A block of noise that says, at every point in space, how far up a strand reaches there.
 * Strands are little cones standing on scattered points; slicing the block with the cat's skin
 * gives each patch of skin its own tufts. Red: how high the strand stands here. Green: a number
 * per strand, for strand-to-strand color.
 */
export function furNoise(size = 40, cells = 8): Data3DTexture {
  let seed = 20261120;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const points = new Float32Array(cells * cells * cells * 5);
  for (let i = 0; i < cells * cells * cells; i++) {
    points[i * 5] = random();
    points[i * 5 + 1] = random();
    points[i * 5 + 2] = random();
    points[i * 5 + 3] = 0.45 + 0.55 * random(); // how long this strand is
    points[i * 5 + 4] = random();
  }
  const data = new Uint8Array(size * size * size * 2);
  const scale = cells / size;
  const wrap = (v: number) => ((v % cells) + cells) % cells;
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const px = (x + 0.5) * scale;
        const py = (y + 0.5) * scale;
        const pz = (z + 0.5) * scale;
        const cx = Math.floor(px);
        const cy = Math.floor(py);
        const cz = Math.floor(pz);
        let best = 0;
        let id = 0;
        for (let k = -1; k <= 1; k++)
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) {
              const c = (wrap(cx + i) + cells * (wrap(cy + j) + cells * wrap(cz + k))) * 5;
              const d = Math.hypot(cx + i + points[c] - px, cy + j + points[c + 1] - py, cz + k + points[c + 2] - pz);
              // A strand tapers: the further from its middle, the lower its surface.
              const height = points[c + 3] * Math.max(0, 1 - Math.pow(d / 0.66, 1.5));
              if (height > best) {
                best = height;
                id = points[c + 4];
              }
            }
        const o = (x + size * (y + size * z)) * 2;
        data[o] = Math.round(best * 255);
        data[o + 1] = Math.round(id * 255);
      }
  const texture = new Data3DTexture(data, size, size, size);
  texture.format = RGFormat;
  texture.type = UnsignedByteType;
  texture.wrapS = texture.wrapT = texture.wrapR = RepeatWrapping;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

/** Adds the shell displacement to a material's vertex shader: each copy of the skin is pushed out along the strands. */
function furVertex(source: string): string {
  return source
    .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        attribute float shell;
        attribute vec4 fur;
        attribute vec4 coat;
        uniform float uDroop;
        uniform float uTime;
        uniform float uPurr;
        varying float vShell;
        varying float vFurLen;
        varying vec3 vRest;
        varying vec3 vCoat;`,
      )
    .replace(
        "#include <skinning_vertex>",
        /* glsl */ `#include <skinning_vertex>
        {
          float furLen = fur.w * ${FUR_MAX.toFixed(3)};
          vec3 comb = fur.xyz;
          #ifdef USE_SKINNING
            comb = ( skinMatrix * vec4( comb, 0.0 ) ).xyz;
          #endif
          float lay = clamp( length( fur.xyz ), 0.0, 1.0 );
          // A strand leaves the skin fairly upright, then bends over along the comb and sags.
          vec3 dir = normalize( objectNormal ) * ( 1.0 - lay * 0.85 ) + comb * 0.7;
          vec3 bend = comb * 0.55 + vec3( 0.0, -uDroop, 0.0 );
          vec3 offset = dir * shell + bend * shell * shell;
          // The purr: the tips shiver.
          float shiver = sin( uTime * 150.0 + position.x * 90.0 + position.z * 70.0 ) * uPurr;
          offset += normalize( objectNormal ) * shiver * 0.03 * shell;
          transformed += offset * furLen;
          vShell = shell;
          vFurLen = furLen;
          vRest = position;
          vCoat = coat.rgb;
        }`,
      );
}

export type FurUniforms = {
  uFurNoise: { value: Data3DTexture };
  /** Strand pattern repeats per meter. */
  uFurFreq: { value: number };
  /** How much the strands sag under their own weight. */
  uDroop: { value: number };
  /** Seconds, for the purr's tremble. */
  uTime: { value: number };
  /** 0 to 1: how strongly the coat trembles. */
  uPurr: { value: number };
};

/**
 * The coat's material: the scene's ordinary lit material (so the screens, the light bar and the
 * warm fill all fall on the cat as on everything else), with the shells added to it.
 */
export function furMaterial(noise: Data3DTexture): { material: MeshPhysicalMaterial; uniforms: FurUniforms } {
  const uniforms: FurUniforms = {
    uFurNoise: { value: noise },
    uFurFreq: { value: 1 / 0.0135 },
    uDroop: { value: 0.22 },
    uTime: { value: 0 },
    uPurr: { value: 0 },
  };
  const material = new MeshPhysicalMaterial({
    color: "#ffffff",
    roughness: 0.92,
    metalness: 0,
    // A soft glow where light grazes the coat, as real fur has.
    sheen: 1,
    sheenRoughness: 0.55,
    sheenColor: "#b9b2a6",
  });
  // Strand edges are softened by multisampling instead of blending, so the shells never need sorting.
  material.alphaToCoverage = true;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = furVertex(shader.vertexShader);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        uniform highp sampler3D uFurNoise;
        uniform float uFurFreq;
        varying float vShell;
        varying float vFurLen;
        varying vec3 vRest;
        varying vec3 vCoat;`,
      )
      .replace(
        "#include <color_fragment>",
        /* glsl */ `{
          vec2 strand = texture( uFurNoise, vRest * uFurFreq ).rg;
          // Whole tufts stand taller or shorter than their neighbors.
          float tuft = texture( uFurNoise, vRest * uFurFreq * 0.19 + 0.37 ).r;
          float top = strand.r * mix( 0.62, 1.0, smoothstep( 0.05, 0.7, tuft ) );
          // Short fur (the face, the paws) is dense and even: a velvet, not separate tufts.
          float shortness = 1.0 - smoothstep( 0.004, 0.022, vFurLen );
          top = mix( top, 1.0, shortness * 0.6 );
          // Bare skin (the nose) and the innermost layer are solid.
          float furry = smoothstep( 0.0003, 0.002, vFurLen );
          float height = vShell * furry;
          float alpha = height <= 0.0 ? 1.0 : clamp( ( top - height ) / 0.09 + 0.5, 0.0, 1.0 );
          if ( alpha < 0.04 ) discard;

          vec3 coatColor = pow( vCoat, vec3( 2.2 ) );
          // Roots are a paler grey undercoat; the pattern lives in the outer part of each hair.
          vec3 undercoat = mix( coatColor, vec3( 0.2, 0.19, 0.18 ), 0.55 * ( 1.0 - 0.75 * shortness ) );
          vec3 hair = mix( undercoat, coatColor, smoothstep( 0.05, 0.5, height ) );
          // Strand-to-strand variation, and a lighter tip on each hair.
          hair *= mix( 0.78, 1.16, strand.g );
          hair *= 1.0 + 0.22 * smoothstep( 0.7, 1.0, height );
          // Deep in the coat it is dark: strands shade each other.
          float depth = mix( mix( 0.3, 0.78, shortness ), 1.0, pow( height, 0.75 ) );
          diffuseColor.rgb = hair * mix( 1.0, depth, furry );
          diffuseColor.a = alpha;
        }`,
      );
  };
  return { material, uniforms };
}

/**
 * The canvas is see-through where nothing has been drawn (the window's glass), and the coat does
 * not write alpha (see body.ts). This fills alpha in under the coat: the skin, puffed out to
 * about half the fur's depth, drawn into the alpha channel only.
 */
export function hullGeometry(coat: InstancedBufferGeometry, height = 0.5): InstancedBufferGeometry {
  const geometry = new InstancedBufferGeometry();
  for (const name of ["position", "normal", "skinIndex", "skinWeight", "coat", "fur"]) geometry.setAttribute(name, coat.getAttribute(name));
  geometry.setIndex(coat.getIndex());
  // The whole model, whichever part's geometry was handed in.
  geometry.setDrawRange(0, Infinity);
  geometry.setAttribute("shell", new InstancedBufferAttribute(new Float32Array([height]), 1));
  geometry.instanceCount = 1;
  return geometry;
}

export function hullMaterial(uniforms: FurUniforms): MeshBasicMaterial {
  const material = new MeshBasicMaterial({ color: "#000000", depthWrite: false });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = furVertex(shader.vertexShader);
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
      varying float vShell;
      varying float vFurLen;
      varying vec3 vRest;
      varying vec3 vCoat;`,
    );
  };
  return material;
}
