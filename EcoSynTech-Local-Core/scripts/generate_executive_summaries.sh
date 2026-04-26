#!/usr/bin/env bash
set -euo pipefail

##############################################
# Auto-generate executive summaries (HTML/PDF)
# - All-in-one bilingual Exec Summary (EXECUTIVE_SUMMARY.md)
# - English/Vietnamese One-Pager (EXECUTIVE_SUMMARY_ONEPAGER_VN_EN.html)
##############################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || realpath "$SCRIPT_DIR/..")"

MD_FILE="$ROOT_DIR/EXECUTIV_SUMMARY.md"  # safe-guard; fallback below
MD_FILE="$ROOT_DIR/EXECUTIVE_SUMMARY.md"
ONEPAGER_HTML="$ROOT_DIR/EXECUTIVE_SUMMARY_ONEPAGER_VN_EN.html"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/exports}"

LOG() { echo -e "[EXPORT] $1"; }
ERR() { echo -e "[ERROR] $1" >&2; }
INFO() { echo -e "[INFO] $1"; }

mkdir -p "$OUTPUT_DIR"

FORMAT="all"
if [[ $# -ge 1 ]]; then
  case "$1" in
    all|pdf|html) FORMAT="$1" ;;
    *) FORMAT="all" ;;
  esac
fi

log_exit_if_missing() {
  if [ ! -f "$MD_FILE" ]; then
    ERR "Markdown executive summary missing: $MD_FILE"
    exit 1
  fi
}

log_exit_if_missing

if command -v pandoc >/dev/null 2>&1; then
  HTML_OUT="$OUTPUT_DIR/EXECUTIVE_SUMMARY.html"
  PDF_OUT="$OUTPUT_DIR/EXECUTIVE_SUMMARY.pdf"

  log_exit_if_missing
  INFO "Converting EXECUTIVE_SUMMARY.md to HTML: $HTML_OUT"
  pandoc "$MD_FILE" -f markdown -t html -s -o "$HTML_OUT" || { ERR "Failed to generate HTML from MD"; exit 2; }

  if [[ "$FORMAT" == "html" || "$FORMAT" == "all" ]]; then
    INFO "HTML export completed: $HTML_OUT"
  fi

  if [[ "$FORMAT" == "pdf" || "$FORMAT" == "all" ]]; then
    INFO "Generating PDF: $PDF_OUT (XeLaTeX)"
    pandoc "$MD_FILE" -f markdown -t pdf --pdf-engine=xelatex -s -o "$PDF_OUT" || {
      ERR "PDF generation failed. Ensure a TeX engine is installed (xelatex).";
      # Don't exit; allow HTML-only as fallback
    }
  fi
else
  INFO "Pandoc not found. Skipping MD->HTML/PDF generation."
  # Fallback: try to generate PDF from existing bilingual HTML if available
  if command -v wkhtmltopdf >/dev/null 2>&1 && [ -f "$ONEPAGER_HTML" ]; then
    PDF_1PAGER="$OUTPUT_DIR/EXECUTIVE_SUMMARY_ONEPAGER_VN_EN.pdf"
    wkhtmltopdf "$ONEPAGER_HTML" "$PDF_1PAGER" || true
    INFO "Generated fallback PDF for one-pager: $PDF_1PAGER"
  fi
fi

# Also export the one-pager if HTML is available and wkhtmltopdf exists
if command -v wkhtmltopdf >/dev/null 2>&1 && [ -f "$ONEPAGER_HTML" ]; then
  ONEPAGER_PDF="$OUTPUT_DIR/EXECUTIVE_SUMMARY_ONEPAGER_VN_EN.pdf"
  wkhtmltopdf "$ONEPAGER_HTML" "$ONEPAGER_PDF" || {
    ERR "Failed to convert one-pager HTML to PDF."
  }
  INFO "One-pager PDF exported: $ONEPAGER_PDF"
fi

INFO "Export completed. Output directory: $OUTPUT_DIR"
