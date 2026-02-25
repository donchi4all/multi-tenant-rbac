#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/rbac-generated-test"
RBAC_BIN="$ROOT_DIR/node_modules/.bin/rbac"

echo "[1/8] Checking local RBAC CLI binary..."
if [ ! -x "$RBAC_BIN" ]; then
  echo "Missing RBAC CLI binary at $RBAC_BIN"
  echo "Run: npm install"
  exit 1
fi

echo "[2/8] Running doctor..."
DOCTOR_JSON="$("$RBAC_BIN" doctor)"
echo "$DOCTOR_JSON" > "$ROOT_DIR/.rbac-doctor.latest.json"
node -e "const r=JSON.parse(process.argv[1]); if(!r.hasRbacCli||!r.hasRbacPackage){process.exit(1)}" "$DOCTOR_JSON"

echo "[3/8] Generating RBAC files with auto-detected config..."
rm -rf "$OUT_DIR"
"$RBAC_BIN" init --out "$OUT_DIR"

echo "[4/8] Validating generated manifest..."
VALIDATE_JSON="$("$RBAC_BIN" validate --manifest "$OUT_DIR/rbac.init.json")"
echo "$VALIDATE_JSON" > "$ROOT_DIR/.rbac-validate.latest.json"
node -e "const r=JSON.parse(process.argv[1]); if(!r.valid){process.exit(1)}" "$VALIDATE_JSON"

echo "[5/8] Checking manifest mappings..."
node -e "const fs=require('fs');const p=process.argv[1];const m=JSON.parse(fs.readFileSync(p,'utf8'));if(m.models.users!=='rbac_admins_v2'||m.keys.userId!=='adminId'||m.keys.tenantId!=='workspaceId'){process.exit(1)}" "$OUT_DIR/rbac.init.json"

echo "[6/8] Checking generated migration/model artifacts..."
test -f "$OUT_DIR/sequelize/models/rbac_admin_role_links_v2.ts"
test -f "$OUT_DIR/sequelize/models/rbac_acl_permissions_v2.ts"
ls "$OUT_DIR"/sequelize/migrations/*create-rbac_admin_role_links_v2.js >/dev/null
ls "$OUT_DIR"/sequelize/migrations/*create-rbac_acl_permissions_v2.js >/dev/null

echo "[7/8] Verifying CLI seed utility..."
"$RBAC_BIN" seed --out "$OUT_DIR/rbac.seed.json" >/dev/null
test -f "$OUT_DIR/rbac.seed.json"

echo "[8/8] Building TypeScript example..."
cd "$ROOT_DIR"
npm run build >/dev/null

echo "All-round typed-generic smoke test passed."
