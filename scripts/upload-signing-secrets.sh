#!/usr/bin/env bash
# Uploads the local release signing key to GitHub Actions secrets so CI-built
# APKs carry the same signature as local builds (required for app updates).
set -euo pipefail
cd "$(dirname "$0")/../android"

[ -f korbis-release.jks ] && [ -f keystore.properties ] || { echo "Keystore files missing in android/"; exit 1; }
prop() { grep "^$1=" keystore.properties | cut -d= -f2-; }

base64 -w0 korbis-release.jks | gh secret set KR_KEYSTORE_BASE64
printf %s "$(prop storePassword)" | gh secret set KR_KEYSTORE_PASSWORD
printf %s "$(prop keyPassword)" | gh secret set KR_KEY_PASSWORD
printf %s "$(prop keyAlias)" | gh secret set KR_KEY_ALIAS

gh secret list
echo "✔ Signing secrets uploaded."
