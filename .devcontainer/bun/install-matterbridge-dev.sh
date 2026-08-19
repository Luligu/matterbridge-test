#!/usr/bin/env bash

# .devcontainer/bun/install-matterbridge-dev.sh v.2.0.0

# This script globally installs Matterbridge from the dev branch.
# To be used only inside the Dev Container with the mounted matterbridge volume.

set -euo pipefail

echo "1.install-matterbridge-dev - Installing Matterbridge from the dev branch..."
cd /
if [ ! -d "/workspaces" ]; then
  echo "Directory /workspaces does not exist. Exiting."
  exit 1
fi

echo "2.install-matterbridge-dev - Preparing Matterbridge directory..."
sudo chown -R bun:bun matterbridge
sudo chmod g+s matterbridge
sudo rm -rf matterbridge/* matterbridge/.[!.]* matterbridge/..?*

echo "3.install-matterbridge-dev - Cloning Matterbridge from the dev branch..."
# Shallow clone for speed (history not needed inside dev container). Remove --depth if full history required.
git clone --depth 1 --single-branch --no-tags -b dev https://github.com/Luligu/matterbridge.git matterbridge
cd matterbridge

echo "4.install-matterbridge-dev - Setting Matterbridge version..."
SHA7=$(git rev-parse --short=7 HEAD) && BASE_VERSION=$(bun -e "console.log(require('./package.json').version.split('-')[0])") && bun -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='${BASE_VERSION}-git-${SHA7}';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');"

echo "5.install-matterbridge-dev - Installing Matterbridge dependencies and building..."
rm -f package-lock.json && bun install && bun run build

echo "6.install-matterbridge-dev - Installing Matterbridge frontend dependencies and building..."
cd apps/frontend && rm -f package-lock.json && bun install && bun run build && cd ../..

echo "7.install-matterbridge-dev - Installing Matterbridge globally..."
# sudo is required because BUN_INSTALL_BIN=/usr/local/bin is root-owned.
# -E preserves HOME so the link registry is written under the bun user's
# home instead of root's, keeping it visible to the non-sudo "bun link"
# calls in post-create.sh/post-start.sh.
sudo -E bun link
sudo chown -R bun:bun /home/bun/.bun
sudo rm -rf .agents .cache .claude .codex .devcontainer .git .github .vscode docker docs reflector screenshots scripts systemd

echo "8.install-matterbridge-dev - Matterbridge has been installed from the dev branch."
