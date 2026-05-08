#!/bin/bash
set -e

echo "Building all packages..."
npm run build

echo "Publishing @kagami-cli/plugin..."
npm publish -w packages/plugin

echo "Publishing @kagami-cli/plugin-mangadex..."
npm publish -w packages/plugin-mangadex

echo "Publishing @kagami-cli/plugin-mangalib..."
npm publish -w packages/plugin-mangalib

echo "Publishing kagami-cli..."
npm publish -w packages/cli

echo "All packages published successfully!"
