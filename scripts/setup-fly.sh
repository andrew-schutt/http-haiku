#!/usr/bin/env bash
# One-time setup for Fly.io deployment.
# Run this from the repo root the first time you deploy.
# Subsequent deploys: `fly deploy`

set -e

APP_NAME="http-haiku"
DB_NAME="${APP_NAME}-db"
REGION="ord"

echo "==> Installing Fly CLI (if needed)..."
if ! command -v fly &>/dev/null; then
  brew install flyctl
fi

echo "==> Authenticating..."
fly auth login

echo "==> Creating the app (skips Postgres — we create it separately)..."
fly launch \
  --name "$APP_NAME" \
  --region "$REGION" \
  --no-deploy \
  --copy-config

echo "==> Provisioning Postgres cluster..."
fly postgres create \
  --name "$DB_NAME" \
  --region "$REGION" \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 1

echo "==> Attaching Postgres to app (sets DATABASE_URL secret)..."
fly postgres attach "$DB_NAME" --app "$APP_NAME"

echo ""
echo "==> Creating cache and queue databases on the same Postgres cluster..."
echo "    Run the following commands one at a time when prompted:"
echo ""
echo "    fly postgres connect -a $DB_NAME"
echo "    (in psql):"
echo "      CREATE DATABASE http_haiku_cache;"
echo "      CREATE DATABASE http_haiku_queue;"
echo "      \\q"
echo ""
read -rp "Press Enter once you've created the two extra databases..."

echo "==> Reading DATABASE_URL to build CACHE_DATABASE_URL and QUEUE_DATABASE_URL..."
DB_URL=$(fly secrets list --app "$APP_NAME" --json | python3 -c "
import sys, json
secrets = json.load(sys.stdin)
for s in secrets:
    if s['Name'] == 'DATABASE_URL':
        print(s.get('Digest', ''))
        break
" 2>/dev/null || echo "")

echo ""
echo "    The DATABASE_URL secret was set by 'fly postgres attach'."
echo "    You can inspect it with: fly ssh console -a $APP_NAME -C 'echo \$DATABASE_URL'"
echo ""
echo "==> Setting CACHE_DATABASE_URL and QUEUE_DATABASE_URL..."
echo "    Replace <user>, <password>, <host>, <port> below with values from DATABASE_URL."
echo ""
echo "    fly secrets set \\"
echo "      CACHE_DATABASE_URL='postgres://<user>:<password>@<host>:<port>/http_haiku_cache' \\"
echo "      QUEUE_DATABASE_URL='postgres://<user>:<password>@<host>:<port>/http_haiku_queue' \\"
echo "      --app $APP_NAME"
echo ""
read -rp "Press Enter once you've set CACHE_DATABASE_URL and QUEUE_DATABASE_URL..."

echo "==> Setting SECRET_KEY_BASE..."
fly secrets set \
  SECRET_KEY_BASE="$(openssl rand -hex 64)" \
  --app "$APP_NAME"

echo "==> Deploying..."
fly deploy --app "$APP_NAME"

echo ""
echo "==> Seeding the database (one-time)..."
fly ssh console --app "$APP_NAME" -C "bundle exec rails db:seed"

echo ""
echo "==> Done! Visit https://${APP_NAME}.fly.dev"
echo ""
echo "Useful commands:"
echo "  fly status              # check app health"
echo "  fly logs                # stream logs"
echo "  fly ssh console         # open a shell"
echo "  fly deploy              # deploy new version"
