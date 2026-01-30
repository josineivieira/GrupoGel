#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_DIR="$ROOT/backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Copy DB
if [ -f backend/data/db.json ]; then
  cp backend/data/db.json "$BACKUP_DIR/db.json"
  echo "Saved db.json -> $BACKUP_DIR/db.json"
fi

# Archive uploads
if [ -d backend/uploads ]; then
  tar -czf "$BACKUP_DIR/uploads.tar.gz" -C backend uploads
  echo "Saved uploads -> $BACKUP_DIR/uploads.tar.gz"
fi

echo "Backup complete: $BACKUP_DIR"