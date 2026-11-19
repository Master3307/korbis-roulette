// Builds the release APK and copies it to dist-apk/ with a versioned name.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const android = join(root, 'android');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

execSync(`${gradlew} assembleRelease --no-daemon`, { cwd: android, stdio: 'inherit' });

const apk = join(android, 'app/build/outputs/apk/release/app-release.apk');
if (!existsSync(apk)) {
  console.error('APK not found:', apk);
  process.exit(1);
}
const outDir = join(root, 'dist-apk');
mkdirSync(outDir, { recursive: true });
const named = join(outDir, `KorbisRoulette-v${version}.apk`);
copyFileSync(apk, named);
copyFileSync(apk, join(outDir, 'KorbisRoulette-latest.apk'));
console.log(`\n✔ APK ready: ${named}`);
