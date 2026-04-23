#!/bin/sh
set -e

echo ">>> Running database migrations..."
npx prisma db push --skip-generate 2>/dev/null || bunx prisma db push --skip-generate

echo ">>> Starting application..."
exec dumb-init "$@"
