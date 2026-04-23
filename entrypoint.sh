#!/bin/sh

# Skip DB migration in container - tables are auto-created by Prisma on first query
# Run migration manually if needed: docker exec viralfaceless-ai npx prisma db push

echo ">>> Starting ViralFaceless AI..."
exec dumb-init "$@"
