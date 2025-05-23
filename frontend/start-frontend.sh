#!/bin/bash
echo "Running FileNest Frontend with optimized settings..."

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
export GENERATE_SOURCEMAP=false

# Clean cache directory if it exists
if [ -d "node_modules/.cache" ]; then
  echo "Cleaning cache directory..."
  rm -rf "node_modules/.cache"
fi

# Start the application
echo "Starting frontend..."
npm start 