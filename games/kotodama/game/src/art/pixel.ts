import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';

/**
 * A tiny paletted bitmap. Sprites and tiles are drawn into one of these with
 * simple primitives, then rasterized once into an SkImage (see toImage()).
 */
export class PixelCanvas {
  readonly px: (string | null)[];
  constructor(readonly w: number, readonly h: number) {
    this.px = new Array(w * h).fill(null);
  }
  set(x: number, y: number, c: string | null) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return;
    this.px[yi * this.w + xi] = c;
  }
  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x] ?? null;
  }
  rect(x: number, y: number, w: number, h: number, c: string | null) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  /** Filled ellipse inside the box (x, y, w, h). */
  ellipse(x: number, y: number, w: number, h: number, c: string) {
    const cx = x + (w - 1) / 2;
    const cy = y + (h - 1) / 2;
    const rx = w / 2;
    const ry = h / 2;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const dx = (x + i - cx) / rx;
        const dy = (y + j - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) this.set(x + i, y + j, c);
      }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, c);
  }
  /** Draw from a string grid; '.' = skip. */
  stamp(x: number, y: number, rows: string[], palette: Record<string, string>) {
    rows.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch !== '.' && palette[ch]) this.set(x + i, y + j, palette[ch] as string);
      }),
    );
  }
  /** 1px dark outline around every filled pixel: the classic sprite look. */
  outline(c: string) {
    const filled = this.px.map((p) => p !== null);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (filled[y * this.w + x]) continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const xx = x + (dx as number);
          const yy = y + (dy as number);
          return xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && filled[yy * this.w + xx];
        });
        if (n) this.set(x, y, c);
      }
  }
  flipX(): PixelCanvas {
    const out = new PixelCanvas(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) out.set(this.w - 1 - x, y, this.get(x, y));
    return out;
  }
}

/**
 * Rasterize to a real bitmap (RGBA bytes → SkImage). Drawn later with nearest-
 * neighbour sampling, so a 16×16 sprite scales up crisply and the whole map is ONE
 * image draw per frame instead of thousands of rects.
 */
export function toImage(canvas: PixelCanvas): SkImage {
  const bytes = new Uint8Array(canvas.w * canvas.h * 4);
  const cache = new Map<string, [number, number, number]>();
  canvas.px.forEach((c, i) => {
    if (!c) return;
    let rgb = cache.get(c);
    if (!rgb) {
      const n = parseInt(c.slice(1, 7), 16);
      rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      cache.set(c, rgb);
    }
    bytes.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
  });
  const image = Skia.Image.MakeImage(
    { width: canvas.w, height: canvas.h, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 },
    Skia.Data.fromBytes(bytes),
    canvas.w * 4,
  );
  if (!image) throw new Error('Skia could not create image');
  return image;
}

/** Deterministic hash → [0,1), for per-tile variation without an RNG object. */
export function hash2(x: number, y: number, salt = 0): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + 255 * amount)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
