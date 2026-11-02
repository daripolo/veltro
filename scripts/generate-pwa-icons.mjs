/**
 * Generates every icon the PWA needs from the Veltro placeholder mark.
 *
 *   node scripts/generate-pwa-icons.mjs
 *
 * The brand mark is an asterisk on a signal-orange tile until a real Veltro
 * logo exists. Drawing it as an inline SVG keeps the icons reproducible and
 * avoids depending on an old raster asset.
 *
 * Outputs:
 *   src/app/icon.png                     32x32   favicon
 *   src/app/apple-icon.png               180x180 iOS home screen
 *   public/icons/icon-192.png            192x192 manifest
 *   public/icons/icon-512.png            512x512 manifest
 *   public/icons/icon-maskable-192.png   192x192 maskable (safe-zone padded)
 *   public/icons/icon-maskable-512.png   512x512 maskable (safe-zone padded)
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SIGNAL = "#ea580c"; // Veltro signal orange
const INK = "#0b0b0b"; // near-black used on orange surfaces

/**
 * Build a square icon: a solid background with the asterisk mark centred
 * inside it.
 *
 * @param {number} size             output edge length in px
 * @param {object} opts
 * @param {string} opts.background  tile colour
 * @param {string} opts.markColor   asterisk colour
 * @param {number} opts.ratio       mark height as a fraction of the canvas
 */
function iconSvg(size, { background, markColor, ratio }) {
  // The lucide asterisk path spans 12 of the 24 viewBox units vertically, so
  // a scale of 2 * ratio yields a mark that is `ratio` of the canvas tall.
  const scale = ratio * 2;
  // Counter-scale the stroke so it stays a constant 2/24 of the canvas.
  const strokeWidth = 2 / scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <rect width="24" height="24" fill="${background}" />
    <g transform="translate(12 12) scale(${scale}) translate(-12 -12)">
      <path
        d="M12 6v12M17.196 9 6.804 15M6.804 9l10.392 6"
        fill="none"
        stroke="${markColor}"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  </svg>`;
}

async function composeIcon(size, opts) {
  return sharp(Buffer.from(iconSvg(size, opts)))
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  await mkdir(path.join(root, "public/icons"), { recursive: true });

  const targets = [
    // [output, size, ratio]
    ["src/app/icon.png", 32, 0.78],
    ["src/app/apple-icon.png", 180, 0.72],
    ["public/icons/icon-192.png", 192, 0.72],
    ["public/icons/icon-512.png", 512, 0.72],
    // Maskable icons get extra padding so the mark survives Android's
    // circular/squircle mask, which can crop up to 10% from each edge.
    ["public/icons/icon-maskable-192.png", 192, 0.5],
    ["public/icons/icon-maskable-512.png", 512, 0.5],
  ];

  for (const [rel, size, ratio] of targets) {
    const out = path.join(root, rel);
    await mkdir(path.dirname(out), { recursive: true });
    const buf = await composeIcon(size, {
      background: SIGNAL,
      markColor: INK,
      ratio,
    });
    await sharp(buf).toFile(out);
    console.log(`✓ ${rel} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
