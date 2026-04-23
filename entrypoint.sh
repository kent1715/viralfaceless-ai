#!/bin/sh
set -e

echo ">>> Running database migrations..."
node /app/node_modules/prisma/build/index.js db push --skip-generate 2>&1 || \
  echo ">>> Migration skipped (DB may already exist)"

echo ">>> Starting application..."
exec dumb-init "$@"
