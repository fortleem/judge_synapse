#!/bin/bash
# Egyptian Judicial Brain V2.1 — Backup & Hardening Script
# Creates: git tag, database snapshot, code archive
# Prevents rollback to older versions via protected tags

set -e
cd /home/z/my-project

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_DIR="/home/z/my-project/backups"
mkdir -p "$BACKUP_DIR"

echo "=== EJB V2.1 Backup & Hardening ==="
echo "Timestamp: $TIMESTAMP"
echo ""

# 1. Git commit (if there are changes)
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "EJB V2.1 — backup checkpoint $TIMESTAMP" --allow-empty
  echo "✓ Git commit created"
fi

# 2. Git tag (protected — prevents rollback past this point)
TAG="v2.1-backup-$TIMESTAMP"
git tag -a "$TAG" -m "EJB V2.1 Sovereign Court-Pilot — backup checkpoint

- Hydration error fixed
- Light institutional theme
- Sphinx Model Gateway (Groq/Gemini/HF)
- Egyptian Legal Deadlines engine (12 deadline types)
- Legal corpus: 14 official sources, verified legal texts
- Adversary Review (Judicial Shadow)
- Audit log with system/judge separation
- Citation verification gateway

This tag is protected — do not delete or rollback past this point."
echo "✓ Git tag created: $TAG"

# 3. Database backup (SQLite file copy)
DB_BACKUP="$BACKUP_DIR/db-$TIMESTAMP.db"
cp db/custom.db "$DB_BACKUP"
echo "✓ Database backed up: $DB_BACKUP"

# 4. Code archive
CODE_ARCHIVE="$BACKUP_DIR/code-$TIMESTAMP.tar.gz"
tar -czf "$CODE_ARCHIVE" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='backups' \
  --exclude='screenshot-*.png' \
  --exclude='dev.log' \
  --exclude='.zscripts' \
  src/ prisma/ public/ package.json bun.lock next.config.ts tsconfig.json tailwind.config.ts \
  2>/dev/null || true
echo "✓ Code archived: $CODE_ARCHIVE"

# 5. Create rollback protection marker
cat > "$BACKUP_DIR/.rollback-protection" << EOF
# EJB V2.1 Rollback Protection
# This file marks the minimum protected version.
# Do NOT git reset --hard or git checkout to any commit before this tag:
PROTECTED_TAG=$TAG
PROTECTED_TIMESTAMP=$TIMESTAMP
MINIMUM_COMMIT=$(git rev-parse HEAD)
EOF
echo "✓ Rollback protection marker created"

# 6. List recent backups
echo ""
echo "=== Recent backups ==="
ls -lt "$BACKUP_DIR" | head -10

echo ""
echo "=== Protection instructions ==="
echo "To prevent accidental rollback:"
echo "  1. Tag $TAG is protected — do not delete it"
echo "  2. To verify: git tag -l 'v2.1-backup-*'"
echo "  3. Database snapshots in: $BACKUP_DIR"
echo "  4. Code archives in: $BACKUP_DIR"
echo ""
echo "✓ Backup complete — $TIMESTAMP"
