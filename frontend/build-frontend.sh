#!/bin/bash
echo "Building FileNest Frontend with optimized settings..."

# Set optimization environment variables
export NODE_OPTIONS="--max-old-space-size=8192"
export GENERATE_SOURCEMAP=false
export CI=false
export INLINE_RUNTIME_CHUNK=false
export TSC_COMPILE_ON_ERROR=true

# Clean cache directory if it exists
if [ -d "node_modules/.cache" ]; then
  echo "Cleaning cache directory..."
  rm -rf "node_modules/.cache"
fi

# Run the build
echo "Starting optimized build..."
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed. Trying with lower optimization..."
  export NODE_OPTIONS="--max-old-space-size=4096"
  echo "Retrying build with 4GB memory limit..."
  npm run build
fi

echo "Build process complete." 