#!/bin/zsh
# Deploy TravelBook to Vercel (https://travelbook-gilt.vercel.app)
#
# Usage: ./scripts/deploy-web.sh
#
# This script:
# 1. Builds the Expo web export
# 2. Flattens font/image asset paths (Vercel's edge 503s on deep pnpm paths)
# 3. Rewrites JS bundle references to match the flat paths
# 4. Deploys to Vercel production
# 5. Aliases to travelbook-gilt.vercel.app

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 1. Building Expo web export ==="
corepack pnpm --filter @workspace/mobile exec expo export --platform web

DIST="artifacts/mobile/dist"
JS_FILE=$(find "$DIST/_expo" -name "*.js" | head -1)

echo "=== 2. Flattening asset paths ==="
mkdir -p "$DIST/assets/fonts" "$DIST/assets/images"

# Copy fonts
find "$DIST/assets/__node_modules" -name "*.ttf" -exec sh -c 'cp "$1" "'$DIST'/assets/fonts/$(basename "$1")"' _ {} \; 2>/dev/null || true

# Copy images
find "$DIST/assets/__node_modules" -name "*.png" -exec sh -c 'cp "$1" "'$DIST'/assets/images/$(basename "$1")"' _ {} \; 2>/dev/null || true

echo "=== 3. Rewriting JS bundle references ==="
# Font paths: deep node_modules → flat assets/fonts/
sed -i '' -E 's|assets/__node_modules/[^"]*Fonts/([^"]+\.ttf)|assets/fonts/\1|g' "$JS_FILE"
sed -i '' -E 's|assets/__node_modules/[^"]*inter/[^/]*/([^"]+\.ttf)|assets/fonts/\1|g' "$JS_FILE"

# Image paths: deep node_modules → flat assets/images/
sed -i '' -E 's|assets/__node_modules/[^"]+/([^"/]+\.png)|assets/images/\1|g' "$JS_FILE"

# Remove deep source dirs
rm -rf "$DIST/assets/__node_modules"

REMAINING=$(grep -c 'assets/__node_modules' "$JS_FILE" 2>/dev/null || echo "0")
echo "Remaining deep refs: $REMAINING (should be 0)"

echo "=== 4. Deploying to Vercel ==="
# Ensure Vercel project link
mkdir -p "$DIST/.vercel"
cat > "$DIST/.vercel/project.json" << 'EOF'
{
  "projectId": "prj_hguq6mWaQAkdpECcOlSOdIDOR0nD",
  "orgId": "team_iamRyZwjUdPsQCKsUqYgVdnv"
}
EOF

cd "$DIST"
DEPLOY_URL=$(vercel deploy --prod --yes 2>&1 | grep "Production:" | awk '{print $2}')
echo "Deployed: $DEPLOY_URL"

echo "=== 5. Aliasing ==="
vercel alias "$DEPLOY_URL" travelbook-gilt.vercel.app

echo ""
echo "✅ Live at: https://travelbook-gilt.vercel.app"
