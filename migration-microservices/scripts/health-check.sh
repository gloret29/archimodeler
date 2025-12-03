#!/bin/bash

# Script de vérification de santé de tous les services
# Usage: ./health-check.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$PROJECT_ROOT/config"

if [ ! -f "$CONFIG_DIR/.env" ]; then
    echo "Erreur: Fichier $CONFIG_DIR/.env non trouvé"
    exit 1
fi

source "$CONFIG_DIR/.env"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Vérification de Santé des Services"
echo "=========================================="
echo ""

# Fonction pour vérifier un service
check_service() {
    local service_name=$1
    local lxc_id=$2
    local health_url=$3
    
    echo -n "Vérification $service_name (LXC $lxc_id)... "
    
    # Vérifier si le LXC existe et est démarré
    if ! pct list | grep -q "^$lxc_id "; then
        echo -e "${RED}LXC n'existe pas${NC}"
        return 1
    fi
    
    local status=$(pct status $lxc_id | awk '{print $2}')
    if [ "$status" != "running" ]; then
        echo -e "${RED}LXC non démarré (status: $status)${NC}"
        return 1
    fi
    
    # Vérifier les containers Docker
    if ! pct exec $lxc_id -- docker compose ps 2>/dev/null | grep -q "Up"; then
        echo -e "${YELLOW}Containers non démarrés${NC}"
        return 1
    fi
    
    # Vérifier l'endpoint de santé si fourni
    if [ -n "$health_url" ]; then
        if curl -sf "$health_url" > /dev/null 2>&1; then
            echo -e "${GREEN}OK${NC}"
            return 0
        else
            echo -e "${YELLOW}Health check échoué${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}OK${NC}"
        return 0
    fi
}

# Vérifier l'infrastructure
echo "=== Infrastructure ==="
check_service "Infrastructure" $LXC_INFRASTRUCTURE_ID "http://$LXC_INFRASTRUCTURE_IP:9200/_cluster/health"
echo ""

# Vérifier l'API Gateway
echo "=== API Gateway ==="
check_service "API Gateway" $LXC_GATEWAY_ID "http://$LXC_GATEWAY_IP/health"
echo ""

# Vérifier les services
echo "=== Services ==="
check_service "IAM" $LXC_IAM_ID "http://$LXC_GATEWAY_IP/api/iam/health"
check_service "Modeling" $LXC_MODELING_ID "http://$LXC_GATEWAY_IP/api/modeling/health"
check_service "Collaboration" $LXC_COLLABORATION_ID "http://$LXC_GATEWAY_IP/api/collaboration/health"
check_service "Comments" $LXC_COMMENTS_ID "http://$LXC_GATEWAY_IP/api/comments/health"
check_service "Notifications" $LXC_NOTIFICATIONS_ID "http://$LXC_GATEWAY_IP/api/notifications/health"
check_service "Workflow" $LXC_WORKFLOW_ID "http://$LXC_GATEWAY_IP/api/workflow/health"
check_service "Stereotypes" $LXC_STEREOTYPES_ID "http://$LXC_GATEWAY_IP/api/stereotypes/health"
check_service "Search" $LXC_SEARCH_ID "http://$LXC_GATEWAY_IP/api/search/health"
check_service "Connectors" $LXC_CONNECTORS_ID "http://$LXC_GATEWAY_IP/api/connectors/health"
check_service "AI" $LXC_AI_ID "http://$LXC_GATEWAY_IP/api/ai/health"
check_service "Scripting" $LXC_SCRIPTING_ID "http://$LXC_GATEWAY_IP/api/scripting/health"
check_service "Settings" $LXC_SETTINGS_ID "http://$LXC_GATEWAY_IP/api/settings/health"
check_service "Metamodel" $LXC_METAMODEL_ID "http://$LXC_GATEWAY_IP/api/metamodel/health"
echo ""

# Vérifier l'observabilité
echo "=== Observabilité ==="
check_service "Observability" $LXC_OBSERVABILITY_ID "http://$LXC_OBSERVABILITY_IP:3000/api/health"
echo ""

echo "=========================================="
echo "Vérification terminée"
echo "=========================================="




