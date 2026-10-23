/**
 * Generates labelled placeholder images (SVG) for every image slot in src/lib/image-slots.json.
 * Placeholders show their purpose, pixel size and aspect ratio on a neutral hatched background so
 * they can never be mistaken for real photography.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const slots = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/image-slots.json'), 'utf8'));
const outDir = path.join(root, 'public/images/placeholders');
fs.mkdirSync(outDir, { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

for (const [key, s] of Object.entries(slots)) {
  const { width: w, height: h } = s;
  const fs1 = Math.round(Math.min(w, h) * 0.07);
  const fs2 = Math.round(fs1 * 0.62);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Placeholder: ${esc(s.label)}">
  <defs>
    <pattern id="hatch" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="24" height="24" fill="#EEF2F8"/>
      <line x1="0" y1="0" x2="0" y2="24" stroke="#DCE3EE" stroke-width="10"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#hatch)"/>
  <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="#9AA8C2" stroke-width="4" stroke-dasharray="18 12"/>
  <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="#0A2961">
    <text x="${w / 2}" y="${h / 2 - fs1 * 0.6}" font-size="${fs1}" font-weight="700">${esc(s.label)}</text>
    <text x="${w / 2}" y="${h / 2 + fs2 * 0.9}" font-size="${fs2}" fill="#4F5A70">${w} × ${h} px · ${s.ratio}</text>
    <text x="${w / 2}" y="${h / 2 + fs2 * 2.4}" font-size="${Math.round(fs2 * 0.8)}" fill="#6B778F">PLACEHOLDER – replace in Admin › Media</text>
  </g>
</svg>
`;
  fs.writeFileSync(path.join(outDir, s.file), svg);
  console.log(`${key.padEnd(18)} → public/images/placeholders/${s.file}`);
}
