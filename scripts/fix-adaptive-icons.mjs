// Post-processing for `pnpm icons` (@capacitor/assets):
//  1. @capacitor/assets wraps the adaptive icon layers in a 16.7% inset, which shrinks
//     the icon by a third on top of Android's own safe zone. Our foreground artwork
//     already keeps its motif inside the safe zone, so the inset is removed.
//  2. It also writes the layers at 48dp size; adaptive layers are 108dp, so they are
//     re-rendered from assets/ at full resolution to stay sharp.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = new URL('..', import.meta.url);
const res = new URL('android/app/src/main/res/', root);

for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const file = new URL(`mipmap-anydpi-v26/${name}`, res);
  const xml = readFileSync(file, 'utf8');
  const fixed = xml.replace(/<inset android:drawable="([^"]+)" android:inset="[^"]+"\s*\/>/g, '<bitmap android:src="$1" android:gravity="fill" />');
  writeFileSync(file, fixed);
  console.log(`${fixed === xml ? '·' : '✔'} ${name}`);
}

const require = createRequire(createRequire(import.meta.url).resolve('@capacitor/assets'));
const sharp = require('sharp');
const densities = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, f] of Object.entries(densities)) {
  const px = Math.round(108 * f);
  for (const layer of ['foreground', 'background']) {
    const out = new URL(`mipmap-${d}/ic_launcher_${layer}.png`, res);
    await sharp(new URL(`assets/icon-${layer}.png`, root).pathname).resize(px, px).png().toFile(out.pathname);
  }
  console.log(`✔ mipmap-${d} layers ${px}px`);
}
