#!/usr/bin/env bash
# One-time local dev setup. Run from the repo root after cloning.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "==> Checking prerequisites..."
for cmd in ruby node npm bundle psql; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: '$cmd' not found. See README for prerequisites." >&2
    exit 1
  fi
done

echo "==> Installing git hooks..."
git -C "$REPO_ROOT" config core.hooksPath hooks

echo "==> Installing backend dependencies..."
cd "$REPO_ROOT/backend"
bundle install

echo "==> Setting up database..."
bin/rails db:create db:migrate db:seed

echo "==> Installing frontend dependencies..."
cd "$REPO_ROOT/frontend"
npm install

echo ""
echo "Done! Start the app with:"
echo "  Backend:  cd backend && bin/rails server"
echo "  Frontend: cd frontend && npm run dev"
