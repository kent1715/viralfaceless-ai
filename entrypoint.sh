#!/bin/sh
# If DB doesn't exist in volume, copy the initialized one
if [ ! -f /app/data/prod.db ]; then
    echo ">>> Initializing database from seed..."
    cp /app/init.db /app/data/prod.db 2>/dev/null
fi
echo ">>> Starting ViralFaceless AI..."
exec dumb-init "$@"
