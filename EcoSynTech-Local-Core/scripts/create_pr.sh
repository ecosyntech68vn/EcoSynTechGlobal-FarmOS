#!/usr/bin/env bash
set -euo pipefail

OWNER="ecosyntech68vn"
REPO="Ecosyntech-web"
BASE="${BASE_BRANCH:-main}"
HEAD="${HEAD_BRANCH:-feat/ai-bootstrap}"
TITLE="${TITLE:-feat(ai-bootstrap): add model bootstrap script and docs}"
BODY="${BODY:-This PR adds bootstrap scripts for optional AI models (lightweight and large). It includes setup-models script, bootstrap README, and PR automation.}"

TOKEN="${GITHUB_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  echo "GITHUB_TOKEN is not set. Aborting PR creation." >&2
  exit 1
fi

REPO_API="https://api.github.com/repos/$OWNER/$REPO/pulls"
read -r -d '' PAYLOAD <<EOF
{
  "title": "$TITLE",
  "head": "$HEAD",
  "base": "$BASE",
  "body": "$BODY"
}
EOF

response=$(curl -sS -X POST -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" -d "$PAYLOAD" "$REPO_API")
PR_URL=$(echo "$response" | sed -n 's/.*"html_url": "\([^"']*\)".*/\1/p')

if [[ -n "$PR_URL" && "$PR_URL" != "null" ]]; then
  echo "PR created: $PR_URL"
else
  echo "PR creation failed. Response: $response" >&2
  exit 1
fi
