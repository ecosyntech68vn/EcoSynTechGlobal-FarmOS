#!/usr/bin/env bash
set -euo pipefail
echo "[Bootstrap] AI models bootstrap started"
BASE_DIR="$(cd "$(dirname "$0")/.."; pwd)"
MODEL_DIR="$BASE_DIR/models"
mkdir -p "$MODEL_DIR"
AI_SMALL="${AI_SMALL_MODEL:-1}"
AI_LARGE="${AI_LARGE_MODEL:-0}"
echo "[Bootstrap] SMALL=$AI_SMALL LARGE=$AI_LARGE"
SMALL_FILE="$MODEL_DIR/plant_disease.tflite"
LARGE_FILE="$MODEL_DIR/irrigation_lstm.onnx"

download() {
  local url="$1"; local dest="$2"
  if [[ -z "$url" ]]; then
    echo "[Bootstrap] No URL provided for $dest"
    return 0
  fi
  # Support Google Drive direct downloads (two-step confirmation)
  download_drive() {
    local gurl="$1"; local gdest="$2"
    if [[ -z "$gurl" ]]; then return 0; fi
    # Extract file id from common Drive URL formats
    local file_id=""
    if [[ "$gurl" =~ /d/([^/?]+) ]]; then
      file_id=${BASH_REMATCH[1]}
    elif [[ "$gurl" =~ id=([^&]+) ]]; then
      file_id=${BASH_REMATCH[1]}
    fi
    if [[ -z "$file_id" ]]; then
      echo "[Bootstrap] Could not extract Drive file ID from URL: $gurl"; return 0
    fi
    if command -v curl >/dev/null 2>&1; then
      curl -sc /tmp/gcookie "https://drive.google.com/uc?export=download&id=${file_id}" >/dev/null
      confirm=$(awk '/download/ {print $NF}' /tmp/gcookie 2>/dev/null || true)
      if [[ -n "$confirm" ]]; then
        curl -L -b /tmp/gcookie "https://drive.google.com/uc?export=download&confirm=${confirm}&id=${file_id}" -o "$gdest"
      else
        curl -L -o "$gdest" "https://drive.google.com/uc?export=download&id=${file_id}"
      fi
      echo "[Bootstrap] Downloaded (Drive) $gdest"
      return 0
    fi
    if command -v wget >/dev/null 2>&1; then
      wget --load-cookies /tmp/gcookie.txt "https://drive.google.com/uc?export=download&id=${file_id}" -O "$gdest" || true
      echo "[Bootstrap] Downloaded (Drive) $gdest"
      return 0
    fi
    echo "[Bootstrap] Drive download not supported: missing curl/wget" >&2
  }
  if command -v curl >/dev/null 2>&1; then
    curl -fL "$url" -o "$dest" && echo "[Bootstrap] Downloaded $dest"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$dest" "$url" && echo "[Bootstrap] Downloaded $dest"
  else
    echo "[Bootstrap] No HTTP downloader available (curl/wget)" >&2
  fi
}

if [[ "$AI_SMALL" != "0" && "$AI_SMALL" != "false" ]]; then
  if [[ -f "$SMALL_FILE" ]]; then
    echo "[Bootstrap] Small model exists: $SMALL_FILE"
  else
    if [[ -f "$BASE_DIR/models/plant_disease.tflite" ]]; then
      cp "$BASE_DIR/models/plant_disease.tflite" "$SMALL_FILE"
      echo "[Bootstrap] Copied small model from repo into $SMALL_FILE"
    else
      DEFAULT_SMALL_URL="https://raw.githubusercontent.com/ecosyntech68vn/Ecosyntech-web/main/models/plant_disease.tflite"
      download "$DEFAULT_SMALL_URL" "$SMALL_FILE" || true
    fi
  fi
fi

if [[ "$AI_LARGE" == "1" || "$AI_LARGE" == "true" ]]; then
  if [[ -f "$LARGE_FILE" ]]; then
    echo "[Bootstrap] Large model already exists: $LARGE_FILE"
  else
    AI_ONNX_URL="${AI_ONNX_URL:-}"
    if [[ -n "$AI_ONNX_URL" ]]; then
      if [[ "$AI_ONNX_URL" =~ drive.google.com ]]; then
        download_drive "$AI_ONNX_URL" "$LARGE_FILE" || true
      else
        download "$AI_ONNX_URL" "$LARGE_FILE" || true
      fi
    else
      echo "[Bootstrap] AI_ONNX_URL not provided; skipping large model download"
    fi
  fi
fi

echo "[Bootstrap] Completed. Models dir: $MODEL_DIR"
