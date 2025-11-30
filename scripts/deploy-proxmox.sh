#!/bin/bash

# Script de déploiement ArchiModeler sur Proxmox LXC
# Usage: ./scripts/deploy-proxmox.sh [container-id] [container-name]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration par défaut
CONTAINER_ID=${1:-100}
CONTAINER_NAME=${2:-archimodeler}
STORAGE=${3:-local-lvm}
NODE_NAME=${4:-$(hostname)}
MEMORY=${5:-2048}  # 2GB
DISK_SIZE=${6:-20}  # 20GB
CPU_CORES=${7:-2}

# Variables du projet
PROJECT_DIR="/opt/archimodeler"
GIT_REPO_URL="${GIT_REPO_URL:-https://github.com/your-org/archimodeler.git}"
BRANCH="${BRANCH:-main}"

echo -e "${GREEN}=== Script de déploiement ArchiModeler sur Proxmox ===${NC}"
echo ""

# Vérifier que nous sommes sur un système Proxmox
if ! command -v pct &> /dev/null; then
    echo -e "${RED}Erreur: La commande 'pct' n'est pas disponible. Ce script doit être exécuté sur un serveur Proxmox.${NC}"
    exit 1
fi

# Vérifier si le container existe déjà
if pct status $CONTAINER_ID &> /dev/null; then
    echo -e "${YELLOW}Le container $CONTAINER_ID existe déjà.${NC}"
    read -p "Voulez-vous le supprimer et en créer un nouveau? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Arrêt et suppression du container existant...${NC}"
        pct stop $CONTAINER_ID 2>/dev/null || true
        pct destroy $CONTAINER_ID
    else
        echo -e "${RED}Abandon.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Étape 1: Création du container LXC${NC}"
echo "  - ID: $CONTAINER_ID"
echo "  - Nom: $CONTAINER_NAME"
echo "  - Stockage: $STORAGE"
echo "  - Mémoire: ${MEMORY}MB"
echo "  - Disque: ${DISK_SIZE}GB"
echo "  - CPU: $CPU_CORES cores"

# Créer le container (Ubuntu 22.04)
pct create $CONTAINER_ID \
    local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
    --hostname $CONTAINER_NAME \
    --storage $STORAGE \
    --memory $MEMORY \
    --cores $CPU_CORES \
    --rootfs ${STORAGE}:${DISK_SIZE} \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --unprivileged 0 \
    --features nesting=1,keyctl=1

if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la création du container.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container créé avec succès${NC}"

# Démarrer le container
echo -e "${GREEN}Étape 2: Démarrage du container${NC}"
pct start $CONTAINER_ID

# Attendre que le container soit prêt
echo "Attente du démarrage du container..."
sleep 5

# Obtenir l'adresse IP du container
CONTAINER_IP=$(pct exec $CONTAINER_ID -- hostname -I | awk '{print $1}')
echo -e "${GREEN}✓ Container démarré (IP: $CONTAINER_IP)${NC}"

# Fonction pour exécuter des commandes dans le container
run_in_container() {
    pct exec $CONTAINER_ID -- bash -c "$1"
}

echo -e "${GREEN}Étape 3: Mise à jour du système${NC}"
run_in_container "export DEBIAN_FRONTEND=noninteractive && apt-get update && apt-get upgrade -y"

echo -e "${GREEN}Étape 4: Installation des dépendances système${NC}"
run_in_container "export DEBIAN_FRONTEND=noninteractive && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    postgresql-client \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx"

# Installer Node.js 20.x
echo -e "${GREEN}Étape 5: Installation de Node.js${NC}"
run_in_container "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
run_in_container "apt-get install -y nodejs"

# Vérifier les versions installées
NODE_VERSION=$(run_in_container "node --version")
NPM_VERSION=$(run_in_container "npm --version")
echo -e "${GREEN}✓ Node.js $NODE_VERSION installé${NC}"
echo -e "${GREEN}✓ npm $NPM_VERSION installé${NC}"

# Configurer Docker
echo -e "${GREEN}Étape 6: Configuration de Docker${NC}"
run_in_container "systemctl enable docker"
run_in_container "systemctl start docker"

# Créer le répertoire du projet
echo -e "${GREEN}Étape 7: Préparation du répertoire du projet${NC}"
run_in_container "mkdir -p $PROJECT_DIR"
run_in_container "chown -R 1000:1000 $PROJECT_DIR"

# Cloner le projet (si URL fournie) ou copier depuis le système hôte
if [ -n "$GIT_REPO_URL" ] && [ "$GIT_REPO_URL" != "https://github.com/your-org/archimodeler.git" ]; then
    echo -e "${GREEN}Étape 8: Clonage du projet depuis Git${NC}"
    run_in_container "cd /opt && git clone -b $BRANCH $GIT_REPO_URL archimodeler"
else
    echo -e "${YELLOW}Étape 8: Copie du projet depuis le système hôte${NC}"
    echo "  Note: Vous devrez copier le projet manuellement dans le container"
    echo "  Commande: pct push $CONTAINER_ID /chemin/vers/projet $PROJECT_DIR"
fi

# Installer les dépendances
echo -e "${GREEN}Étape 9: Installation des dépendances npm${NC}"
run_in_container "cd $PROJECT_DIR && npm install"

# Générer le client Prisma
echo -e "${GREEN}Étape 10: Génération du client Prisma${NC}"
run_in_container "cd $PROJECT_DIR/packages/database && npx prisma generate"

# Créer le fichier .env pour le serveur
echo -e "${GREEN}Étape 11: Configuration de l'environnement${NC}"
run_in_container "cat > $PROJECT_DIR/apps/server/.env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/archimodeler?schema=public

# JWT
JWT_SECRET=\$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# API
API_PORT=3001
API_URL=http://localhost:3001

# WebSocket
WS_URL=http://localhost:3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# OpenSearch
OPENSEARCH_URL=http://localhost:9200

# Environment
NODE_ENV=production
EOF"

# Créer le fichier .env pour le web
run_in_container "cat > $PROJECT_DIR/apps/web/.env << 'EOFENV'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Environment
NODE_ENV=production
EOFENV"

# Créer le fichier .env pour la base de données
run_in_container "cat > $PROJECT_DIR/packages/database/.env << 'EOFENV'
DATABASE_URL=postgresql://user:password@localhost:5432/archimodeler?schema=public
EOFENV"

# Démarrer les services Docker (PostgreSQL et OpenSearch)
echo -e "${GREEN}Étape 12: Démarrage des services Docker${NC}"
run_in_container "cd $PROJECT_DIR && docker-compose up -d"

# Attendre que PostgreSQL soit prêt
echo "Attente du démarrage de PostgreSQL..."
sleep 10

# Exécuter les migrations
echo -e "${GREEN}Étape 13: Exécution des migrations de base de données${NC}"
run_in_container "cd $PROJECT_DIR/packages/database && npx prisma migrate deploy"

# Compiler le projet
echo -e "${GREEN}Étape 14: Compilation du projet${NC}"
run_in_container "cd $PROJECT_DIR && npm run build"

# Créer un service systemd pour le serveur
echo -e "${GREEN}Étape 15: Configuration du service systemd pour le serveur${NC}"
run_in_container "cat > /etc/systemd/system/archimodeler-server.service << 'EOFSERVICE'
[Unit]
Description=ArchiModeler Server
After=network.target docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/apps/server
Environment=NODE_ENV=production
EnvironmentFile=$PROJECT_DIR/apps/server/.env
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOFSERVICE"

# Créer un service systemd pour le web
run_in_container "cat > /etc/systemd/system/archimodeler-web.service << 'EOFSERVICE'
[Unit]
Description=ArchiModeler Web
After=network.target archimodeler-server.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/apps/web
Environment=NODE_ENV=production
EnvironmentFile=$PROJECT_DIR/apps/web/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOFSERVICE"

# Recharger systemd et démarrer les services
run_in_container "systemctl daemon-reload"
run_in_container "systemctl enable archimodeler-server archimodeler-web"
run_in_container "systemctl start archimodeler-server archimodeler-web"

# Configurer Nginx comme reverse proxy
echo -e "${GREEN}Étape 16: Configuration de Nginx${NC}"
run_in_container "cat > /etc/nginx/sites-available/archimodeler << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF"

run_in_container "ln -sf /etc/nginx/sites-available/archimodeler /etc/nginx/sites-enabled/"
run_in_container "rm -f /etc/nginx/sites-enabled/default"
run_in_container "nginx -t && systemctl reload nginx"

echo ""
echo -e "${GREEN}=== Déploiement terminé avec succès! ===${NC}"
echo ""
echo "Informations du container:"
echo "  - ID: $CONTAINER_ID"
echo "  - Nom: $CONTAINER_NAME"
echo "  - IP: $CONTAINER_IP"
echo ""
echo "Services démarrés:"
echo "  - PostgreSQL: localhost:5432"
echo "  - OpenSearch: localhost:9200"
echo "  - Backend API: http://$CONTAINER_IP:3001"
echo "  - Frontend Web: http://$CONTAINER_IP:3000"
echo "  - Nginx: http://$CONTAINER_IP"
echo ""
echo "Commandes utiles:"
echo "  - Accéder au container: pct enter $CONTAINER_ID"
echo "  - Voir les logs serveur: pct exec $CONTAINER_ID -- journalctl -u archimodeler-server -f"
echo "  - Voir les logs web: pct exec $CONTAINER_ID -- journalctl -u archimodeler-web -f"
echo "  - Redémarrer les services: pct exec $CONTAINER_ID -- systemctl restart archimodeler-server archimodeler-web"
echo ""
echo -e "${YELLOW}Note: N'oubliez pas de:${NC}"
echo "  1. Configurer les variables d'environnement dans les fichiers .env"
echo "  2. Configurer un nom de domaine et SSL avec certbot si nécessaire"
echo "  3. Configurer les règles de pare-feu si nécessaire"
echo ""

