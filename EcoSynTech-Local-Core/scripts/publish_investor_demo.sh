#!/usr/bin/env bash
set -euo pipefail

echo "=== Publish Investor Demo ==="

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
echo "Root: $ROOT_DIR"

# Ensure private remote exists as 'private' or 'origin'
if ! git remote | grep -q public; then
  echo "Adding public remote (ecosyntech-public) if needed..."
  git remote add public https://github.com/ecosyntech68vn/ecosyntech-public.git || true
fi

echo "Creating sanitized demo branch from main..."
./scripts/create-demo-branch.sh --push

echo "Pushing sanitized demo to public repo..."
git push public public/demo:main --force

echo "Done. Investor demo is available at:"
echo "https://github.com/ecosyntech68vn/ecosyntech-public/tree/main"
