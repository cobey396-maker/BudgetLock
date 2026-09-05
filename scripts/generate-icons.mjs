#!/usr/bin/env node
/**
 * Rasterises public/icon.svg into the PNG sizes browsers and app stores expect,
 * plus the Open Graph share card. Run `npm run icons` after changing the mark;
 * the output is committed so a normal install/build needs no image tooling.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import sharp from "sharp";

const OUT = "public/icons";
const source = readFileSync("public/icon.svg");

// Maskable icons must keep the mark inside the safe zone (the inner 80% circle),
// so the artwork is padded rather than bleeding to the edges.
const MASKABLE_PADDING = 0.1;
const BG = "#17171C";

await mkdir(OUT, { recursive: true });

const write = async (buffer, name) => {
  await writeFile(`${OUT}/${name}`, buffer);
  console.log(`  ${OUT}/${name}`);
};

for (const size of [96, 128, 192, 256, 384, 512]) {
  await write(await sharp(source, { density: 384 }).resize(size, size).png().toBuffer(), `icon-${size}.png`);
}

// iOS home-screen icon: no transparency, no rounding (the OS masks it itself).
await write(
  await sharp(source, { density: 384 })
    .resize(180, 180)
    .flatten({ background: BG })
    .png()
    .toBuffer(),
  "apple-touch-icon.png"
);

for (const size of [192, 512]) {
  const inner = Math.round(size * (1 - MASKABLE_PADDING * 2));
  const pad = Math.round((size - inner) / 2);
  await write(
    await sharp(source, { density: 384 })
      .resize(inner, inner)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
      .png()
      .toBuffer(),
    `maskable-${size}.png`
  );
}

// favicon.ico equivalent that every browser accepts.
await writeFile(
  "public/favicon.ico",
  await sharp(source, { density: 384 }).resize(32, 32).flatten({ background: BG }).png().toBuffer()
);
console.log("  public/favicon.ico");

// ── Open Graph / Twitter share card ──────────────────────────────────────────
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0%" stop-color="#3DDC97" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#3DDC97" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5FF0B6"/>
      <stop offset="100%" stop-color="#2BC286"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#131318"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(118 176) scale(3.4)">
    <path d="M8 40 A28 28 0 0 1 56 40" stroke="#2E2E37" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M8 40 A28 28 0 0 1 44 14.6" stroke="url(#mint)" stroke-width="7" stroke-linecap="round" fill="none"/>
    <line x1="32" y1="40" x2="14" y2="26" stroke="#F2F2F5" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="32" cy="40" r="4" fill="#F2F2F5"/>
  </g>
  <text x="118" y="404" fill="#F2F2F5" font-family="Helvetica, Arial, sans-serif" font-size="82" font-weight="700" letter-spacing="-2">BudgetLock</text>
  <text x="118" y="470" fill="#C9C9D1" font-family="Helvetica, Arial, sans-serif" font-size="34">Set a monthly limit. Watch the needle.</text>
  <text x="118" y="518" fill="#8B8B96" font-family="Helvetica, Arial, sans-serif" font-size="34">Stay out of the red.</text>
  <rect x="118" y="556" width="164" height="8" rx="4" fill="url(#mint)"/>
</svg>`;
await writeFile("public/og.png", await sharp(Buffer.from(og)).png().toBuffer());
console.log("  public/og.png");
