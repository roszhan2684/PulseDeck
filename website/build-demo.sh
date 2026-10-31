#!/bin/bash
# Builds the web demo of the app into website/demo (served at /demo on the marketing site).
# Vercel's CLI never uploads folders named node_modules, so Expo's asset paths
# (assets/node_modules/...) are moved to assets/vendor/... and references rewritten.
set -e
cd "$(dirname "$0")/.."
rm -rf website/demo
EXPO_WEB_BASE_URL=/demo EXPO_PUBLIC_DEMO_AUTOLOGIN=1 npx expo export --platform web --output-dir website/demo
mv website/demo/assets/node_modules website/demo/assets/vendor
grep -rl "assets/node_modules/" website/demo --include=*.js --include=*.html --include=*.json | xargs sed -i '' 's#assets/node_modules/#assets/vendor/#g'
echo "demo built: $(du -sh website/demo | cut -f1)"
