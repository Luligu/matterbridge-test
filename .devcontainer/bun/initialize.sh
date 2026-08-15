#!/usr/bin/env bash

# .devcontainer/bun/initialize.sh v.2.0.0

# This script runs on the host before the Dev Container is created to set up the Docker environment.

set -euo pipefail

echo "Welcome to Matterbridge Plugin Dev Container (initialize.sh)"
echo ""

echo "1.initialize - Creating the Matterbridge Docker network..."
docker network inspect matterbridge >/dev/null 2>&1 || docker network create matterbridge

echo "2.initialize - Building the bun dev container image..."
# Built and tagged explicitly (rather than relying on the CLI's auto-generated tag, which is
# derived only from the workspace folder path and would collide with the node variant's image).
docker build --pull -t "$(basename "$PWD")-bun" .devcontainer/bun

echo "3.initialize - Initialization completed!"
