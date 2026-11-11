/**
 * Every third-party asset on the site. The /credits page is generated from
 * this list, so adding an asset means adding an entry here.
 */
export type Credit = {
  title: string;
  creator: string;
  /** What it is on this site. */
  usedFor: string;
  sourceUrl: string;
  license: { name: string; url: string };
  /** What was changed from the original. */
  changes: string;
};

export const credits: Credit[] = [
  {
    title: "Apple Magic Keyboard",
    creator: "infohack",
    usedFor: "The keycaps and legends of the keyboard on the desk",
    sourceUrl: "https://sketchfab.com/3d-models/apple-magic-keyboard-faa71198d6884781bf8a9cf89a26b930",
    // The exact link on the model's Sketchfab page.
    license: { name: "CC Attribution (CC BY 4.0)", url: "http://creativecommons.org/licenses/by/4.0/" },
    changes:
      "Cropped from the full-size keyboard to the compact layout, keeping only the keycaps; the body was rebuilt. Rescaled, re-centered, recolored slightly darker, geometry compressed and the texture resized to 1024 px.",
  },
  {
    title: "Walnut Veneer",
    creator: "Jenelle van Heerden, Poly Haven",
    usedFor: "The desk top",
    sourceUrl: "https://polyhaven.com/a/walnut_veneer",
    license: { name: "CC0 1.0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
    changes: "Color and normal maps at 1k converted to WebP; tinted darker; roughness map not used.",
  },
  {
    title: "Schibsted Grotesk",
    creator: "Schibsted",
    usedFor: "The typeface for text",
    sourceUrl: "https://fonts.google.com/specimen/Schibsted+Grotesk",
    license: { name: "SIL Open Font License 1.1", url: "https://openfontlicense.org" },
    changes: "None.",
  },
  {
    title: "IBM Plex Mono",
    creator: "IBM",
    usedFor: "The monospace typeface",
    sourceUrl: "https://fonts.google.com/specimen/IBM+Plex+Mono",
    license: { name: "SIL Open Font License 1.1", url: "https://openfontlicense.org" },
    changes: "None.",
  },
];
