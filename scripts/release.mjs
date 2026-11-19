// Usage: pnpm release <patch|minor|major|X.Y.Z>
// Bumps package.json, runs the tests, commits, tags vX.Y.Z and pushes.
// The tag triggers .github/workflows/release.yml which builds the signed APK
// and attaches it to a GitHub Release.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const sh = (cmd) => execSync(cmd, { stdio: 'inherit' });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm release <patch|minor|major|X.Y.Z>');
  process.exit(1);
}
if (out('git status --porcelain')) {
  console.error('Working tree not clean. Commit or stash first.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [ma, mi, pa] = pkg.version.split('.').map(Number);
const next =
  arg === 'major' ? `${ma + 1}.0.0` : arg === 'minor' ? `${ma}.${mi + 1}.0` : arg === 'patch' ? `${ma}.${mi}.${pa + 1}` : arg;
if (!/^\d+\.\d+\.\d+$/.test(next)) {
  console.error(`Invalid version: ${next}`);
  process.exit(1);
}
const [nMa, nMi, nPa] = next.split('.').map(Number);
if (nMi > 99 || nPa > 99) {
  console.error('Minor and patch must stay below 100 (Android versionCode = MAJOR*10000 + MINOR*100 + PATCH).');
  process.exit(1);
}

sh('pnpm test');
sh('pnpm typecheck');
pkg.version = next;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
sh('git add package.json');
sh(`git commit -m "chore(release): v${next}"`);
sh(`git tag -a v${next} -m "v${next}"`);
sh('git push --follow-tags');
console.log(`\n✔ Released v${next} (versionCode ${nMa * 10000 + nMi * 100 + nPa}). GitHub Actions is building the APK.`);
