#!/bin/bash
# Push Egyptian Judicial Smart V2.1 to GitHub
# Usage: bash scripts/push-github.sh <github-token> <repo-name>
# Example: bash scripts/push-github.sh ghp_xxx egyptian-judicial-smart

set -e
cd /home/z/my-project

TOKEN="${1:-$GITHUB_TOKEN}"
REPO_NAME="${2:-egyptian-judicial-smart}"

if [ -z "$TOKEN" ]; then
  echo "❌ GitHub token required"
  echo "Usage: bash scripts/push-github.sh <token> [repo-name]"
  echo "   or: GITHUB_TOKEN=xxx bash scripts/push-github.sh"
  exit 1
fi

echo "=== Egyptian Judicial Smart V2.1 — GitHub Push ==="
echo "Repo: $REPO_NAME"
echo ""

# 1. Create GitHub repo via API
echo "1. Creating GitHub repository..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.github.com/user/repos" \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"Egyptian Judicial Smart V2.1 — Sovereign Judicial Intelligence Platform\",\"private\":true,\"auto_init\":false}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo "✓ Repository created"
  CLONE_URL=$(echo "$BODY" | grep -o '"clone_url":"[^"]*"' | head -1 | cut -d'"' -f4)
  SSH_URL=$(echo "$BODY" | grep -o '"ssh_url":"[^"]*"' | head -1 | cut -d'"' -f4)
elif [ "$HTTP_CODE" = "422" ]; then
  echo "⚠ Repository may already exist — continuing"
  USER=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/user | grep -o '"login":"[^"]*"' | cut -d'"' -f4)
  CLONE_URL="https://$TOKEN@github.com/$USER/$REPO_NAME.git"
else
  echo "❌ Failed to create repo (HTTP $HTTP_CODE)"
  echo "$BODY" | head -5
  exit 1
fi

# 2. Add remote
echo "2. Adding remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$CLONE_URL"
echo "✓ Remote added"

# 3. Push
echo "3. Pushing to GitHub..."
git push -u origin main 2>&1 || {
  echo "⚠ Push failed — trying with token in URL..."
  USER=$(echo "$CLONE_URL" | grep -o 'github.com[:/][^/]*' | cut -d'/' -f2)
  git remote set-url origin "https://$USER:$TOKEN@github.com/$USER/$REPO_NAME.git"
  git push -u origin main
}

echo ""
echo "✓ Push complete!"
echo "Repository: https://github.com/$USER/$REPO_NAME"
echo ""
echo "Note: .env, node_modules, db/, backups/, uploads/ are gitignored"
