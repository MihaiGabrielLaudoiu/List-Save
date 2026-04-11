#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

SSH_KEY="${SSH_KEY:-}"
REMOTE="${REMOTE:-}"
REMOTE_PATH="${REMOTE_PATH:-/opt/listandsave}"

if [ -n "$SSH_KEY" ] && [ -n "$REMOTE" ]; then
  echo "Deploying via SSH to $REMOTE..."
  rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='.env.local' \
    -e "ssh -i $SSH_KEY" \
    ./ "$REMOTE:$REMOTE_PATH/"
  ssh -i "$SSH_KEY" "$REMOTE" "cd $REMOTE_PATH && docker compose down --remove-orphans 2>/dev/null; docker compose build && docker compose up -d"
  echo "Deployed to $REMOTE"
else
  echo "Building locally..."
  docker compose down --remove-orphans 2>/dev/null || true
  docker compose build
  docker compose up -d
fi

sleep 8
docker compose ps
echo ""
echo "Health: http://127.0.0.1:${APP_PORT_MAP:-3020}/health"