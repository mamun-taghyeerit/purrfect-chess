#!/usr/bin/env bash
set -euo pipefail

# scripts/setup-dev-env.sh
# Standardized setup for humans, CI, and Copilot Coding Agents.
# - Ensures correct Node (from .nvmrc) via nvm
# - Ensures Yarn classic (v1)
# - Installs dependencies and vendors Stockfish

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f .nvmrc ]]; then
  echo "ERROR: .nvmrc not found at repo root. Please add it and re-run." >&2
  exit 1
fi

# Install nvm if not present
if ! command -v nvm >/dev/null 2>&1; then
  echo "nvm not found; installing..."
  export NVM_DIR="$HOME/.nvm"
  mkdir -p "$NVM_DIR"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  # shellcheck disable=SC1090
  [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
else
  # Ensure nvm is loaded in non-login shells
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1090
  [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
fi

# Install/use Node as per .nvmrc
nvm install
nvm use

# Ensure Yarn classic (v1) is available
if ! command -v yarn >/dev/null 2>&1; then
  echo "Installing Yarn classic (v1)..."
  npm i -g yarn@1.22.22
else
  # If yarn is not v1, enforce v1 for this project (postinstall uses yarn)
  if ! yarn --version | grep -Eq '^1\.'; then
    echo "Detected Yarn $(yarn --version); installing Yarn classic (v1)..."
    npm i -g yarn@1.22.22
  fi
fi

echo "Installing dependencies via Yarn (using lockfile)..."
yarn install --frozen-lockfile

echo "Vendoring Stockfish binaries..."
yarn vendor:stockfish || true

# Show versions for traceability
echo ""
echo "Tool versions:"
node -v
npm -v
yarn --version || true

echo ""
echo "Setup complete. You can now run:"
echo "  yarn dev       # Vite app"
echo "  yarn next:dev  # Next.js app"
