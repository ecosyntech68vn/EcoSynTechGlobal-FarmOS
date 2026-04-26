#!/bin/bash
# EcoSynTech AI Setup - One-click AI integration

echo "=========================================="
echo "  EcoSynTech AI - Quick Setup"
echo "=========================================="
echo ""

PLATFORM=$(uname -s)
case "$PLATFORM" in
    Linux*)  OS="linux" ;;
    Darwin*) OS="mac" ;;
    CYGWIN*|MINGW*|MSYS*) OS="windows" ;;
    *)     OS="unknown" ;;
esac

echo "Detected: $OS"
echo ""

if [ "$OS" = "windows" ]; then
    echo "Windows detected. Using install-ollama.bat"
    cmd.exe //c "scripts\\install-ollama.bat"
    exit 0
fi

if [ "$OS" = "unknown" ]; then
    echo "Unknown platform. Please install Ollama manually:"
    echo "  1. Download from https://ollama.com"
    echo "  2. Run: ollama serve"
    exit 1
fi

echo "Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

echo ""
echo "Downloading models..."
ollama pull llama3

echo ""
echo "Starting Ollama..."
nohup ollama serve > /dev/null 2>&1 &
sleep 3

echo ""
echo "Verifying..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✓ AI Ready!"
    echo ""
    echo "Model available:"
    curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4
else
    echo "✓ Installed. Start manually: ollama serve"
fi

echo ""
echo "=========================================="
echo "Done! AI integration ready."
echo "=========================================="