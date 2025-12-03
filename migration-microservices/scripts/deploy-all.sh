#!/bin/bash

# Script de déploiement complet de tous les services microservices
# Usage: ./deploy-all.sh

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Charger la configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$PROJECT_ROOT/config"

if [ ! -f "$CONFIG_DIR/.env" ]; then
    echo -e "${RED}Erreur: Fichier $CONFIG_DIR/.env non trouvé${NC}"
    echo "Copiez config/env.template en config/.env et configurez-le"
    exit 1
fi

source "$CONFIG_DIR/.env"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Déploiement Microservices ArchiModeler${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Fonction pour vérifier si un LXC existe
lxc_exists() {
    local lxc_id=$1
    pct list | grep -q "^$lxc_id " && return 0 || return 1
}

# Fonction pour créer un LXC
create_lxc() {
    local lxc_id=$1
    local lxc_name=$2
    local lxc_ip=$3
    local memory=$4
    local cores=$5
    local disk=$6
    
    if lxc_exists $lxc_id; then
        echo -e "${YELLOW}LXC $lxc_id ($lxc_name) existe déjà, passage...${NC}"
        return 0
    fi
    
    echo -e "${GREEN}Création LXC $lxc_id: $lxc_name${NC}"
    
    pct create $lxc_id \
        $PROXMOX_TEMPLATE \
        --hostname $lxc_name \
        --storage $PROXMOX_STORAGE \
        --memory $memory \
        --cores $cores \
        --rootfs $PROXMOX_STORAGE:$disk \
        --net0 name=eth0,bridge=$PROXMOX_BRIDGE,ip=$lxc_ip/24,gw=$NETWORK_GATEWAY \
        --unprivileged 0 \
        --features nesting=1,keyctl=1,fuse=1 \
        --start 1
    
    echo -e "${GREEN}LXC $lxc_id créé et démarré${NC}"
    sleep 2
}

# Fonction pour installer Docker dans un LXC
install_docker() {
    local lxc_id=$1
    local lxc_name=$2
    
    echo -e "${GREEN}Installation Docker dans $lxc_name (LXC $lxc_id)${NC}"
    
    pct exec $lxc_id -- bash -c "
        export DEBIAN_FRONTEND=noninteractive
        apt-get update
        apt-get install -y curl wget git ca-certificates gnupg lsb-release
        
        # Installer Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        
        # Installer Docker Compose
        apt-get install -y docker-compose-plugin
        
        # Vérifier
        docker --version
        docker compose version
    "
    
    echo -e "${GREEN}Docker installé dans $lxc_name${NC}"
}

# Fonction pour déployer un service
deploy_service() {
    local lxc_id=$1
    local service_name=$2
    
    echo -e "${GREEN}Déploiement du service $service_name (LXC $lxc_id)${NC}"
    
    # Copier les fichiers du service
    pct push $lxc_id "$PROJECT_ROOT/services/$service_name" /opt/service
    
    # Copier la configuration
    pct push $lxc_id "$CONFIG_DIR/.env" /opt/service/.env
    
    # Déployer le service
    pct exec $lxc_id -- bash -c "
        cd /opt/service
        docker compose pull
        docker compose up -d
    "
    
    echo -e "${GREEN}Service $service_name déployé${NC}"
}

# Étape 1: Créer l'infrastructure
echo -e "${YELLOW}Étape 1: Création de l'infrastructure${NC}"
create_lxc $LXC_INFRASTRUCTURE_ID "archimodeler-infra" "$LXC_INFRASTRUCTURE_IP/24" \
    $LXC_INFRASTRUCTURE_MEMORY $LXC_INFRASTRUCTURE_CORES $LXC_INFRASTRUCTURE_DISK
install_docker $LXC_INFRASTRUCTURE_ID "infrastructure"
deploy_service $LXC_INFRASTRUCTURE_ID "infrastructure"

# Attendre que l'infrastructure soit prête
echo -e "${YELLOW}Attente du démarrage de l'infrastructure...${NC}"
sleep 30

# Étape 2: Créer l'API Gateway
echo -e "${YELLOW}Étape 2: Création de l'API Gateway${NC}"
create_lxc $LXC_GATEWAY_ID "archimodeler-gateway" "$LXC_GATEWAY_IP/24" \
    $LXC_GATEWAY_MEMORY $LXC_GATEWAY_CORES $LXC_GATEWAY_DISK
install_docker $LXC_GATEWAY_ID "gateway"
deploy_service $LXC_GATEWAY_ID "gateway"

# Étape 3: Créer les services
echo -e "${YELLOW}Étape 3: Création des services${NC}"

# Services dans l'ordre de dépendance
services=(
    "metamodel:114:$LXC_METAMODEL_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "iam:102:$LXC_IAM_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "settings:113:$LXC_SETTINGS_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "stereotypes:108:$LXC_STEREOTYPES_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "modeling:103:$LXC_MODELING_IP:$LXC_MODELING_MEMORY:$LXC_MODELING_CORES:100"
    "comments:105:$LXC_COMMENTS_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "notifications:106:$LXC_NOTIFICATIONS_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "workflow:107:$LXC_WORKFLOW_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "collaboration:104:$LXC_COLLABORATION_IP:$LXC_COLLABORATION_MEMORY:$LXC_COLLABORATION_CORES:30"
    "search:109:$LXC_SEARCH_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "connectors:110:$LXC_CONNECTORS_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "ai:111:$LXC_AI_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
    "scripting:112:$LXC_SCRIPTING_IP:$LXC_SERVICE_MEMORY:$LXC_SERVICE_CORES:$LXC_SERVICE_DISK"
)

for service_config in "${services[@]}"; do
    IFS=':' read -r service_name lxc_id lxc_ip memory cores disk <<< "$service_config"
    create_lxc $lxc_id "archimodeler-$service_name" "$lxc_ip/24" $memory $cores $disk
    install_docker $lxc_id "$service_name"
    deploy_service $lxc_id "$service_name"
    sleep 5
done

# Étape 4: Créer l'observabilité
echo -e "${YELLOW}Étape 4: Création de l'observabilité${NC}"
create_lxc $LXC_OBSERVABILITY_ID "archimodeler-observability" "$LXC_OBSERVABILITY_IP/24" \
    $LXC_OBSERVABILITY_MEMORY $LXC_OBSERVABILITY_CORES 100
install_docker $LXC_OBSERVABILITY_ID "observability"
deploy_service $LXC_OBSERVABILITY_ID "observability"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Déploiement terminé !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services déployés :"
echo "  - Infrastructure: LXC $LXC_INFRASTRUCTURE_ID ($LXC_INFRASTRUCTURE_IP)"
echo "  - API Gateway: LXC $LXC_GATEWAY_ID ($LXC_GATEWAY_IP)"
echo "  - Services: LXC 102-114"
echo "  - Observabilité: LXC $LXC_OBSERVABILITY_ID ($LXC_OBSERVABILITY_IP)"
echo ""
echo "Vérifier le statut :"
echo "  pct list"
echo "  curl http://$LXC_GATEWAY_IP/health"




