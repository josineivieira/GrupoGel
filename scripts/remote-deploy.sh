#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Pulling latest code..."
if [ -d .git ]; then
  git fetch --all --prune
  git reset --hard origin/main
fi

echo "Pulling images and updating containers..."
docker compose pull --ignore-pull-failures || true

docker compose up -d --build --remove-orphans

echo "Cleanup images..."
docker image prune -f || true

echo "Deploy finished."
