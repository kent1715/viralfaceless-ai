#!/bin/sh
set -e

echo ">>> Running database migrations..."
npx prisma db push --skip-generate 2>/dev/null

echo ">>> Starting application..."
exec dumb-init "$@"
