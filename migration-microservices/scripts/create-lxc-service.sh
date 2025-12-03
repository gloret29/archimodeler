#!/bin/bash

# Template pour créer un LXC de service
# Usage: ./create-lxc-service.sh <service-name> <lxc-id> <lxc-ip> <memory> <cores> <disk>

set -e

SERVICE_NAME=$1
LXC_ID=$2
LXC_IP=$3
MEMORY=$4
CORES=$5
DISK=$6

if [ -z "$SERVICE_NAME" ] || [ -z "$LXC_ID" ] || [ -z "$LXC_IP" ] || [ -z "$MEMORY" ] || [ -z "$CORES" ] || [ -z "$DISK" ]; then
    echo "Usage: $0 <service-name> <lxc-id> <lxc-ip> <memory> <cores> <disk>"
    exit 1
fi

# Charger la configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$PROJECT_ROOT/config"

if [ ! -f "$CONFIG_DIR/.env" ]; then
    echo "Erreur: Fichier $CONFIG_DIR/.env non trouvé"
    exit 1
fi

source "$CONFIG_DIR/.env"

LXC_NAME="archimodeler-$SERVICE_NAME"

# Vérifier si le LXC existe déjà
if pct list | grep -q "^$LXC_ID "; then
    echo "LXC $LXC_ID existe déjà"
    exit 1
fi

echo "Création du LXC $LXC_ID: $LXC_NAME"

# Créer le LXC
pct create $LXC_ID \
    $PROXMOX_TEMPLATE \
    --hostname $LXC_NAME \
    --storage $PROXMOX_STORAGE \
    --memory $MEMORY \
    --cores $CORES \
    --rootfs $PROXMOX_STORAGE:$DISK \
    --net0 name=eth0,bridge=$PROXMOX_BRIDGE,ip=$LXC_IP/24,gw=$NETWORK_GATEWAY \
    --unprivileged 0 \
    --features nesting=1,keyctl=1,fuse=1 \
    --start 1

echo "LXC créé, attente du démarrage..."
sleep 5

# Installer les dépendances de base
echo "Installation des dépendances..."
pct exec $LXC_ID -- bash -c "
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl wget git ca-certificates gnupg lsb-release
"

# Installer Docker
echo "Installation de Docker..."
pct exec $LXC_ID -- bash -c "
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    apt-get install -y docker-compose-plugin
    docker --version
    docker compose version
"

# Créer le répertoire du service
pct exec $LXC_ID -- mkdir -p /opt/service

echo "LXC $LXC_ID ($LXC_NAME) créé et configuré"
echo "IP: $LXC_IP"
echo "Pour déployer le service, copiez les fichiers dans /opt/service et exécutez docker compose up -d"




