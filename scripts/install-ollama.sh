#!/bin/bash

set -e

echo "=========================================="
echo "  EcoSynTech - Ollama AI Installer"
echo=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OLLAMA_DIR="$SCRIPT_DIR/.ollama"
OLLAMA_PORT=11434

check_ollama() {
    if command -v ollama &> /dev/null; then
        echo "✓ Ollama đã được cài đặt"
        return 0
    fi
    return 1
}

check_running() {
    if curl -s http://localhost:$OLLAMA_PORT/api/tags &> /dev/null; then
        echo "✓ Ollama đang chạy ở port $OLLAMA_PORT"
        return 0
    fi
    return 1
}

install_ollama() {
    echo "📥 Đang cài đặt Ollama..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ollama 2>/dev/null || curl -fsSL https://ollama.com/install.sh | sh
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://ollama.com/install.sh | sh
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        echo "Windows: Vui lòng tải Ollama từ https://ollama.com"
        echo "Sau đó chạy: ollama serve"
        return 1
    fi
    
    echo "✓ Đã cài đặt Ollama"
}

pull_model() {
    local model=$1
    echo "📥 Đang tải model: $model ..."
    ollama pull $model
    echo "✓ Đã tải $model"
}

start_ollama() {
    echo "🚀 Đang khởi động Ollama..."
    nohup ollama serve > /dev/null 2>&1 &
    sleep 2
    
    if check_running; then
        echo "✓ Ollama đang chạy!"
    else
        echo "⚠ Không thể khởi động. Thử chạy thủ công: ollama serve"
    fi
}

stop_ollama() {
    pkill -f ollama 2>/dev/null || true
    echo "✓ Đã dừng Ollama"
}

show_menu() {
    echo ""
    echo "Chọn thao tác:"
    echo "  1) Cài đặt Ollama + Model mặc định (llama3)"
    echo "  2) Chỉ cài đặt Ollama (không model)"
    echo "  3) Cài đặt nhiều model"
    echo "  4) Khởi động Ollama"
    echo "  5) Dừng Ollama"
    echo "  6) Kiểm tra trạng thái"
    echo "  7) Cập nhật Ollama"
    echo "  8) Thoát"
    echo ""
    read -p "Chọn (1-8): " choice
}

install_all() {
    if ! check_ollama; then
        install_ollama
    fi
    
    pull_model "llama3"
    start_ollama
}

install_multiple() {
    echo "Các model phổ biến:"
    echo "  llama3     - Model mạnh, đa năng"
    echo "  phi3      - Model nhẹ, nhanh"
    echo "  mistral   - Model cân bằng"
    echo "  codellama - Code generation"
    echo "  mistral  - Model viết lách"
    echo ""
    read -p "Nhập model (cách nhau bởi dấu cách): " models
    
    for model in $models; do
        pull_model "$model"
    done
    
    start_ollama
}

show_status() {
    echo ""
    echo "=== Trạng thái Ollama ==="
    
    if check_ollama; then
        echo "✓ Ollama: Đã cài đặt"
        ollama --version
    else
        echo "✗ Ollama: Chưa cài đặt"
    fi
    
    echo ""
    if check_running; then
        echo "✓ Server: Đang chạy"
        echo ""
        echo "Model đã cài đặt:"
        curl -s http://localhost:$OLLAMA_PORT/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4
    else
        echo "✗ Server: Không chạy"
    fi
}

update_ollama() {
    echo "📥 Đang cập nhật Ollama..."
    if command -v ollama &> /dev/null; then
        ollama upgrade
        echo "✓ Đã cập nhật"
    else
        install_ollama
    fi
}

main() {
    if [ "$1" ]; then
        case $1 in
            1) install_all ;;
            2) install_ollama ;;
            3) install_multiple ;;
            4) start_ollama ;;
            5) stop_ollama ;;
            6) show_status ;;
            7) update_ollama ;;
            *) echo "Thoát" ;;
        esac
        return
    fi
    
    show_menu
    
    case $choice in
        1) install_all ;;
        2) install_ollama ;;
        3) install_multiple ;;
        4) start_ollama ;;
        5) stop_ollama ;;
        6) show_status ;;
        7) update_ollama ;;
        8) echo "Tạm biệt!"; exit 0 ;;
        *) echo "Lựa chọn không hợp lệ"; exit 1 ;;
    esac
}

main "$@"