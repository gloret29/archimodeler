#!/bin/bash

# Script d'export des données depuis le monolithe
# Usage: ./export-monolith.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EXPORT_DIR="$SCRIPT_DIR/exports"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$EXPORT_DIR"

echo "Export des données depuis le monolithe..."

# Configuration (à adapter selon votre environnement)
MONOLITH_DB_HOST=${MONOLITH_DB_HOST:-localhost}
MONOLITH_DB_PORT=${MONOLITH_DB_PORT:-5432}
MONOLITH_DB_NAME=${MONOLITH_DB_NAME:-archimodeler}
MONOLITH_DB_USER=${MONOLITH_DB_USER:-user}
MONOLITH_DB_PASSWORD=${MONOLITH_DB_PASSWORD:-password}

export PGPASSWORD=$MONOLITH_DB_PASSWORD

# Export complet
echo "Export complet de la base..."
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -F c -f "$EXPORT_DIR/monolith_full_$DATE.dump"

# Export par table (pour séparation)
echo "Export par table..."

# IAM
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "User" -t "Role" -t "Permission" -t "Group" \
    -t "_RoleToUser" -t "_PermissionToRole" -t "_GroupToUser" \
    -F c -f "$EXPORT_DIR/iam_$DATE.dump"

# Metamodel
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "Metamodel" -t "ConceptType" -t "RelationType" \
    -t "_SourceRules" -t "_TargetRules" \
    -F c -f "$EXPORT_DIR/metamodel_$DATE.dump"

# Modeling
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "ModelPackage" -t "Element" -t "Relationship" -t "View" -t "Folder" \
    -F c -f "$EXPORT_DIR/modeling_$DATE.dump"

# Comments
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "CommentThread" -t "Comment" -t "CommentMention" \
    -F c -f "$EXPORT_DIR/comments_$DATE.dump"

# Notifications
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "Notification" \
    -F c -f "$EXPORT_DIR/notifications_$DATE.dump"

# Workflow
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "ChangeRequest" \
    -F c -f "$EXPORT_DIR/workflow_$DATE.dump"

# Stereotypes
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "Stereotype" -t "ElementStereotype" -t "RelationshipStereotype" \
    -t "StereotypeConceptType" -t "StereotypeRelationType" \
    -F c -f "$EXPORT_DIR/stereotypes_$DATE.dump"

# Settings
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "SystemSetting" \
    -F c -f "$EXPORT_DIR/settings_$DATE.dump"

# Connectors
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "DataSource" \
    -F c -f "$EXPORT_DIR/connectors_$DATE.dump"

# Chat
pg_dump -h $MONOLITH_DB_HOST -p $MONOLITH_DB_PORT -U $MONOLITH_DB_USER -d $MONOLITH_DB_NAME \
    -t "ChatMessage" \
    -F c -f "$EXPORT_DIR/chat_$DATE.dump"

unset PGPASSWORD

echo "Export terminé dans $EXPORT_DIR"
echo "Date: $DATE"




