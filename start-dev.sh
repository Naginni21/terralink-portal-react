#!/bin/bash
echo "Starting Vercel dev server on port 6001..."
echo "======================================="
vercel dev --listen 6001 2>&1 | while IFS= read -r line; do
    echo "[$(date '+%H:%M:%S')] $line"
done