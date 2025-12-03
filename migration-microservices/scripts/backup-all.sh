#!/bin/bash

# Script de sauvegarde de tous les services
# Usage: ./backup-all.sh [backup-dir]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$PROJECT_ROOT/config"
BACKUP_DIR=${1:-/opt/backups/archimodeler}
DATE=$(date +%Y%m%d_%H%M%S)

if [ ! -f "$CONFIG_DIR/.env" ]; then
    echo "Erreur: Fichier $CONFIG_DIR/.env non trouvé"
    exit 1
fi

source "$CONFIG_DIR/.env"

mkdir -p "$BACKUP_DIR/$DATE"

echo "Sauvegarde de tous les services dans $BACKUP_DIR/$DATE"

# Sauvegarder les LXC
echo "Sauvegarde des LXC..."
for lxc_id in 100 101 102 103 104 105 106 107 108 109 110 111 112 113 114 115; do
    if pct list | grep -q "^$lxc_id "; then
        echo "Sauvegarde LXC $lxc_id..."
        vzdump $lxc_id --storage local --compress gzip --dumpdir "$BACKUP_DIR/$DATE" || echo "Erreur sauvegarde LXC $lxc_id"
    fi
done

# Sauvegarder les bases de données
echo "Sauvegarde des bases de données..."
pct exec 100 -- bash -c "
    export PGPASSWORD=\$POSTGRES_IAM_PASSWORD
    docker exec postgres-iam pg_dump -U iam_user iam > /tmp/iam_backup.sql
    docker cp postgres-iam:/tmp/iam_backup.sql /tmp/
" || echo "Erreur sauvegarde IAM DB"

# Copier les backups depuis le LXC
pct pull 100 /tmp/iam_backup.sql "$BACKUP_DIR/$DATE/iam_backup.sql" || true

# Répéter pour chaque base de données...

echo "Sauvegarde terminée dans $BACKUP_DIR/$DATE"




