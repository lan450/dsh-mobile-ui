#!/usr/bin/env bash
#
# dsh-mobile-ui installer — macOS / Linux.
#
# Clones the plugin into a DSH profile's plugins/ directory, registers it in
# the profile package.json and cordis.patch.yml (idempotent — safe to run
# again; upgrades pull the latest main), and prints the restart hint.
#
# Usage:
#   bash install.sh                 # install into the web profile
#   PROFILE=tui bash install.sh     # install into another profile
#   DSH_HOME=/custom bash install.sh  # custom DSH home
#
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/lan450/dsh-mobile-ui.git}"
BRANCH="${BRANCH:-main}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE="${PROFILE:-web}"
PLUGIN_NAME="dsh-mobile-ui"

if ! command -v git >/dev/null 2>&1; then
  echo "error: git is required" >&2
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "error: pnpm is required (dsh profiles install plugins via pnpm)" >&2
  exit 1
fi

PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"
PLUGIN_DIR="$PROFILE_DIR/plugins/$PLUGIN_NAME"

if [ ! -d "$PROFILE_DIR" ]; then
  echo "error: profile directory not found: $PROFILE_DIR" >&2
  exit 1
fi

echo "==> Cloning $PLUGIN_NAME into $PLUGIN_DIR"
if [ -d "$PLUGIN_DIR/.git" ]; then
  git -C "$PLUGIN_DIR" fetch --depth 1 origin "$BRANCH" >/dev/null
  git -C "$PLUGIN_DIR" reset --hard "origin/$BRANCH" >/dev/null
else
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$PLUGIN_DIR" >/dev/null
fi

echo "==> Registering in $PROFILE_DIR/package.json"
if ! grep -q "\"$PLUGIN_NAME\"" "$PROFILE_DIR/package.json"; then
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$PROFILE_DIR/package.json" "$PLUGIN_NAME" <<'PY'
import json, sys
path, name = sys.argv[1], sys.argv[2]
with open(path) as f:
    data = json.load(f)
data.setdefault("dependencies", {})[name] = "file:plugins/" + name
with open(path, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY
  else
    echo "error: python3 required to edit package.json" >&2
    exit 1
  fi
else
  echo "    already registered"
fi

echo "==> pnpm install (links $PLUGIN_NAME into node_modules)"
(
  cd "$PROFILE_DIR"
  pnpm install >/dev/null
)

# pnpm 对 file: 依赖会把包复制进 node_modules（不是链接），之后改插件源码
# 不会生效。这里把 node_modules 里的副本替换成指向 plugins/ 的符号链接，
# 让「改 lib/client.js → 刷新页面即生效」成立。路径从 node_modules 出发，
# 顶级包只需 ../plugins/<name>（scoped 包才是 ../../plugins/<name>）。
echo "==> Linking $PROFILE_DIR/node_modules/$PLUGIN_NAME -> plugins/$PLUGIN_NAME"
rm -rf "$PROFILE_DIR/node_modules/$PLUGIN_NAME"
ln -s "../plugins/$PLUGIN_NAME" "$PROFILE_DIR/node_modules/$PLUGIN_NAME"
if [ ! -f "$PROFILE_DIR/node_modules/$PLUGIN_NAME/package.json" ]; then
  echo "error: symlink target does not resolve — plugins/$PLUGIN_NAME missing?" >&2
  exit 1
fi

echo "==> Registering in $PROFILE_DIR/cordis.patch.yml"
if grep -q "name: '$PLUGIN_NAME'" "$PROFILE_DIR/cordis.patch.yml" 2>/dev/null; then
  echo "    already registered"
else
  cat >> "$PROFILE_DIR/cordis.patch.yml" <<EOF

# dsh-mobile-ui: mobile layout adaptation for the web UI (browser half).
- insert:
    - id: mobile-ui
      name: '$PLUGIN_NAME'
EOF
  echo "    appended"
fi

echo
echo "Done. Restart the profile to apply:"
echo "  launchctl kickstart -k gui/\$(id -u)/com.deepseekai.dsh   # if launched via launchd"
echo "  # or simply restart your 'dsh web' process, then refresh the Web UI on the phone."
