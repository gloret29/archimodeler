#!/bin/bash

# Script pour générer automatiquement les fichiers Dockerfile et docker-compose.yml
# pour les services manquants à partir du template
# Usage: ./generate-service-files.sh <service-name> <api-path> <has-db> <db-port>

set -e

SERVICE_NAME=$1
API_PATH=$2
HAS_DB=${3:-false}
DB_PORT=${4:-}

if [ -z "$SERVICE_NAME" ] || [ -z "$API_PATH" ]; then
    echo "Usage: $0 <service-name> <api-path> [has-db] [db-port]"
    echo "Exemple: $0 comments /api/comments true 5435"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$PROJECT_ROOT/services/TEMPLATE"
SERVICE_DIR="$PROJECT_ROOT/services/$SERVICE_NAME"

mkdir -p "$SERVICE_DIR"

echo "Génération des fichiers pour le service $SERVICE_NAME..."

# Copier et adapter le Dockerfile
cp "$TEMPLATE_DIR/Dockerfile" "$SERVICE_DIR/Dockerfile"
sed -i "s/SERVICE_NAME/$SERVICE_NAME/g" "$SERVICE_DIR/Dockerfile"

# Copier et adapter le docker-compose.yml
cp "$TEMPLATE_DIR/docker-compose.yml" "$SERVICE_DIR/docker-compose.yml"
sed -i "s/SERVICE_NAME/$SERVICE_NAME/g" "$SERVICE_DIR/docker-compose.yml"
sed -i "s|SERVICE_PATH|$API_PATH|g" "$SERVICE_DIR/docker-compose.yml"

# Adapter selon si le service a une base de données
if [ "$HAS_DB" = "true" ] && [ -n "$DB_PORT" ]; then
    # Ajouter la configuration de base de données
    DB_NAME=$(echo "$SERVICE_NAME" | tr '[:lower:]' '[:upper:]')
    sed -i "/# Adapter selon le service/a\      - DATABASE_URL=postgresql://\${POSTGRES_${DB_NAME}_USER}:\${POSTGRES_${DB_NAME}_PASSWORD}@\${LXC_INFRASTRUCTURE_IP}:${DB_PORT}/\${POSTGRES_${DB_NAME}_DB}" "$SERVICE_DIR/docker-compose.yml"
fi

echo "Fichiers générés dans $SERVICE_DIR"
echo "N'oubliez pas de vérifier et adapter la configuration selon vos besoins !"




