#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Pulling latest code (if git repo)"
if [ -d .git ]; then
  git fetch --all --prune
  git reset --hard origin/$(git rev-parse --abbrev-ref HEAD)
else
  echo "No .git found; continuing with local files"
fi

echo "==> Building and starting containers with docker-compose"
# ensure docker-compose exists
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found in PATH. Please install Docker on this host." >&2
  exit 1
fi

docker compose pull --ignore-pull-failures || true

docker compose up -d --build --remove-orphans

echo "==> Done. Services should be running (ports: 5000)"

echo "Run 'docker compose logs -f' to follow logs"