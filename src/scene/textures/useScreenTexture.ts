"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { SCREEN_SIZE, type ScreenDrawer, type ScreenFonts } from "./screens";

/** The site's own fonts, as next/font exposes them on <html>. */
function siteFonts(): ScreenFonts {
  const style = getComputedStyle(document.documentElement);
  const sans = style.getPropertyValue("--font-sans").trim();
  const mono = style.getPropertyValue("--font-mono").trim();
  return {
    sans: sans ? `${sans}, system-ui, sans-serif` : "system-ui, sans-serif",
    mono: mono ? `${mono}, ui-monospace, monospace` : "ui-monospace, monospace",
  };
}

/** A canvas a monitor shows, and the texture that carries it. */
class ScreenSurface {
  readonly canvas = document.createElement("canvas");
  readonly texture: CanvasTexture;

  constructor() {
    this.canvas.width = SCREEN_SIZE.width;
    this.canvas.height = SCREEN_SIZE.height;
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.anisotropy = 8;
  }

  paint(draw: ScreenDrawer) {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    draw(ctx, siteFonts());
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}

/** A texture that shows whatever `draw` paints, redrawn once fonts load. */
export function useScreenTexture(draw: ScreenDrawer): CanvasTexture {
  const [surface] = useState(() => new ScreenSurface());
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let cancelled = false;
    const paint = () => {
      if (cancelled) return;
      surface.paint(draw);
      invalidate();
    };
    paint();
    // Canvas text falls back silently until the web fonts are in.
    const fonts = siteFonts();
    Promise.all([
      document.fonts.load(`600 30px ${fonts.sans}`),
      document.fonts.load(`400 19px ${fonts.sans}`),
      document.fonts.load(`500 20px ${fonts.mono}`),
    ]).then(paint, () => {});
    return () => {
      cancelled = true;
    };
  }, [surface, draw, invalidate]);

  useEffect(() => () => surface.dispose(), [surface]);

  return surface.texture;
}
