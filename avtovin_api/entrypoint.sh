#!/bin/sh
set -e

echo "Initializing database tables..."
python init_db.py

if [ -d /app/static/brand-logos ]; then
    mkdir -p /app/uploads/brand-logos
    cp -n /app/static/brand-logos/*.png /app/uploads/brand-logos/ 2>/dev/null || true
    echo "Brand logos synced to uploads volume."
fi

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
