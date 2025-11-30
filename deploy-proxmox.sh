#!/bin/bash

###############################################################################
# Script de déploiement ArchiModeler sur Proxmox
# Ce script crée une VM, installe toutes les dépendances et configure l'application
###############################################################################

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que le script est exécuté en tant que root ou avec sudo
if [ "$EUID" -ne 0 ]; then 
    log_error "Ce script doit être exécuté en tant que root ou avec sudo"
    exit 1
fi

# Vérifier que les outils Proxmox sont disponibles
if ! command -v qm &> /dev/null; then
    log_error "La commande 'qm' n'est pas disponible. Ce script doit être exécuté sur un serveur Proxmox."
    exit 1
fi

log_success "Vérifications préliminaires réussies"

###############################################################################
# Configuration Proxmox - À personnaliser selon votre environnement
###############################################################################

log_info "=== Configuration de la VM Proxmox ==="

# Demander les informations Proxmox
read -p "ID de la VM à créer (ex: 100): " VM_ID
read -p "Nom de la VM (ex: archimodeler): " VM_NAME
read -p "Stockage Proxmox (ex: local-lvm): " STORAGE
read -p "Pool Proxmox (optionnel, laissez vide si aucun): " POOL
read -p "Réseau Proxmox (ex: vmbr0): " NETWORK
read -p "Taille du disque en GB (ex: 50): " DISK_SIZE
read -p "Mémoire RAM en MB (ex: 4096): " MEMORY
read -p "Nombre de CPU (ex: 2): " CORES

# Template à utiliser (Ubuntu 22.04 Cloud Image recommandé)
read -p "ID du template à utiliser (ex: 9000 pour ubuntu-22.04-standard): " TEMPLATE_ID

# Informations réseau
read -p "Adresse IP de la VM (ex: 192.168.1.100/24): " VM_IP
read -p "Passerelle (ex: 192.168.1.1): " GATEWAY
read -p "Serveurs DNS (ex: 8.8.8.8 8.8.4.4): " DNS_SERVERS

# Informations de connexion SSH
read -p "Clé publique SSH (chemin ou contenu): " SSH_KEY

###############################################################################
# Création de la VM
###############################################################################

log_info "Création de la VM ${VM_NAME} (ID: ${VM_ID})..."

# Créer la VM
qm create ${VM_ID} \
    --name ${VM_NAME} \
    --memory ${MEMORY} \
    --cores ${CORES} \
    --net0 virtio,bridge=${NETWORK} \
    --scsihw virtio-scsi-pci \
    --scsi0 ${STORAGE}:${DISK_SIZE},format=raw \
    --boot order=scsi0 \
    --agent enabled=1 \
    --ipconfig0 ip=${VM_IP},gw=${GATEWAY} \
    --nameserver "${DNS_SERVERS}" \
    --sshkeys "${SSH_KEY}" \
    --template ${TEMPLATE_ID} \
    --onboot 1

# Ajouter au pool si spécifié
if [ ! -z "$POOL" ]; then
    pvesh create /pools/${POOL} -vms ${VM_ID}
fi

log_success "VM créée avec succès"

# Démarrer la VM
log_info "Démarrage de la VM..."
qm start ${VM_ID}

# Attendre que la VM soit prête (SSH disponible)
log_info "Attente que la VM soit prête (vérification SSH)..."
VM_IP_ONLY=$(echo ${VM_IP} | cut -d'/' -f1)
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${VM_IP_ONLY} "echo 'VM ready'" 2>/dev/null; then
        log_success "VM prête et accessible via SSH"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log_info "Tentative ${RETRY_COUNT}/${MAX_RETRIES} - Attente de 10 secondes..."
    sleep 10
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "La VM n'est pas accessible via SSH après ${MAX_RETRIES} tentatives"
    exit 1
fi

###############################################################################
# Installation sur la VM
###############################################################################

log_info "=== Installation des dépendances sur la VM ==="

# Créer le script d'installation à exécuter sur la VM
INSTALL_SCRIPT=$(cat <<'INSTALL_EOF'
#!/bin/bash
set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Mise à jour du système
log_info "Mise à jour du système..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

# Installation des dépendances de base
log_info "Installation des dépendances de base..."
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    nginx \
    certbot \
    python3-certbot-nginx \
    postgresql-client \
    ufw \
    fail2ban

# Installation de Node.js 22.x
log_info "Installation de Node.js 22.x..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Vérifier l'installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js ${NODE_VERSION} et npm ${NPM_VERSION} installés"

# Installation de PM2 pour la gestion des processus
log_info "Installation de PM2..."
npm install -g pm2

# Configuration du firewall
log_info "Configuration du firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3002/tcp  # API Backend (si accès direct nécessaire)

# Créer l'utilisateur pour l'application
log_info "Création de l'utilisateur archimodeler..."
if ! id "archimodeler" &>/dev/null; then
    useradd -m -s /bin/bash archimodeler
    usermod -aG sudo archimodeler
    # Configurer sudo sans mot de passe pour certaines commandes
    echo "archimodeler ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/sbin/service, /bin/systemctl" >> /etc/sudoers.d/archimodeler
    log_success "Utilisateur archimodeler créé"
else
    log_info "Utilisateur archimodeler existe déjà"
fi

# Créer le répertoire de l'application
APP_DIR="/opt/archimodeler"
mkdir -p ${APP_DIR}
chown archimodeler:archimodeler ${APP_DIR}

log_success "Installation des dépendances terminée"
INSTALL_EOF
)

# Exécuter le script d'installation sur la VM
log_info "Exécution du script d'installation sur la VM..."
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "bash -s" <<< "$INSTALL_SCRIPT"

###############################################################################
# Configuration de l'application
###############################################################################

log_info "=== Configuration de l'application ==="

# Demander les informations de connexion PostgreSQL
echo ""
log_info "Configuration de la base de données PostgreSQL"
read -p "Hôte PostgreSQL (ex: 192.168.1.10): " DB_HOST
read -p "Port PostgreSQL (ex: 5432): " DB_PORT
read -p "Nom de la base de données (ex: archimodeler): " DB_NAME
read -p "Utilisateur PostgreSQL: " DB_USER
read -sp "Mot de passe PostgreSQL: " DB_PASSWORD
echo ""

# Construire la DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Demander les autres variables d'environnement
echo ""
log_info "Configuration des autres variables d'environnement"
read -p "JWT Secret (laissez vide pour générer automatiquement): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        log_info "JWT Secret généré automatiquement avec openssl"
    else
        # Alternative si openssl n'est pas disponible
        JWT_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '\n')
        log_info "JWT Secret généré automatiquement avec /dev/urandom"
    fi
fi

read -p "Port du serveur backend (défaut: 3002): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3002}

read -p "URL publique de l'API (ex: https://api.votredomaine.com, laissez vide pour http://${VM_IP_ONLY}:${BACKEND_PORT}): " API_URL
if [ -z "$API_URL" ]; then
    API_URL="http://${VM_IP_ONLY}:${BACKEND_PORT}"
fi

read -p "URL publique du frontend (ex: https://votredomaine.com, laissez vide pour http://${VM_IP_ONLY}): " FRONTEND_URL
if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="http://${VM_IP_ONLY}"
fi

# Variables optionnelles
read -p "Neo4j URI (optionnel, laissez vide si non utilisé): " NEO4J_URI
read -p "Neo4j User (optionnel): " NEO4J_USER
read -sp "Neo4j Password (optionnel): " NEO4J_PASSWORD
echo ""

read -p "OpenSearch Node (optionnel, ex: http://localhost:9200): " OPENSEARCH_NODE

read -sp "OpenAI API Key (optionnel, pour les fonctionnalités AI): " OPENAI_API_KEY
echo ""

# Demander le repository Git
echo ""
log_info "Configuration du repository Git"
read -p "URL du repository Git (ex: https://github.com/gloret29/archimodeler.git): " GIT_REPO
read -p "Branche à déployer (défaut: main): " GIT_BRANCH
GIT_BRANCH=${GIT_BRANCH:-main}

# Créer le script de déploiement de l'application
# Utiliser un heredoc avec des variables échappées correctement
DEPLOY_SCRIPT=$(cat <<DEPLOY_EOF
#!/bin/bash
set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "\${BLUE}[INFO]\${NC} \$1"; }
log_success() { echo -e "\${GREEN}[SUCCESS]\${NC} \$1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} \$1"; }
log_warning() { echo -e "\${YELLOW}[WARNING]\${NC} \$1"; }

APP_DIR="/opt/archimodeler"
cd \${APP_DIR}

# Cloner ou mettre à jour le repository
if [ -d ".git" ]; then
    log_info "Mise à jour du repository..."
    git fetch origin
    git checkout ${GIT_BRANCH}
    git pull origin ${GIT_BRANCH}
else
    log_info "Clonage du repository..."
    git clone -b ${GIT_BRANCH} ${GIT_REPO} .
fi

# Installer les dépendances
log_info "Installation des dépendances npm..."
npm install

# Créer les fichiers .env
log_info "Configuration des variables d'environnement..."

# .env pour la base de données
cat > packages/database/.env <<ENV_EOF
DATABASE_URL="${DATABASE_URL}"
ENV_EOF

# .env pour le serveur
cat > apps/server/.env <<ENV_EOF
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET="${JWT_SECRET}"
PORT=${BACKEND_PORT}
NODE_ENV=production
ENV_EOF

# Ajouter les variables optionnelles si elles sont définies
if [ -n "${NEO4J_URI}" ]; then
    echo "NEO4J_URI=${NEO4J_URI}" >> apps/server/.env
fi
if [ -n "${NEO4J_USER}" ]; then
    echo "NEO4J_USER=${NEO4J_USER}" >> apps/server/.env
fi
if [ -n "${NEO4J_PASSWORD}" ]; then
    echo "NEO4J_PASSWORD=${NEO4J_PASSWORD}" >> apps/server/.env
fi
if [ -n "${OPENSEARCH_NODE}" ]; then
    echo "OPENSEARCH_NODE=${OPENSEARCH_NODE}" >> apps/server/.env
fi
if [ -n "${OPENAI_API_KEY}" ]; then
    echo "OPENAI_API_KEY=${OPENAI_API_KEY}" >> apps/server/.env
fi

# .env.local pour le frontend
cat > apps/web/.env.local <<ENV_EOF
NEXT_PUBLIC_API_URL=${API_URL}
ENV_EOF

# Générer le client Prisma
log_info "Génération du client Prisma..."
cd packages/database
npm run generate

# Exécuter les migrations
log_info "Exécution des migrations de base de données..."
# Vérifier s'il y a des migrations
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    log_info "Migrations trouvées, exécution avec prisma migrate deploy..."
    npx prisma migrate deploy || log_warning "migrate deploy a échoué, tentative avec db push..." && npx prisma db push
else
    log_info "Aucune migration trouvée, utilisation de db push..."
    npx prisma db push
fi
log_success "Base de données configurée avec succès"

# Vérifier la connexion à la base de données
log_info "Vérification de la connexion à la base de données..."
# Installer postgresql-client si nécessaire (nécessite sudo)
if ! command -v psql &> /dev/null; then
    log_info "Installation de postgresql-client..."
    sudo apt-get update && sudo apt-get install -y postgresql-client
fi
if psql "${DATABASE_URL}" -c "SELECT 1;" > /dev/null 2>&1; then
    log_success "Connexion à la base de données réussie"
else
    log_error "Échec de la connexion à la base de données"
    log_info "Vérifiez que PostgreSQL est accessible et que les credentials sont corrects"
    exit 1
fi

# Seed la base de données si nécessaire
if [ -f "prisma/seed.ts" ]; then
    log_info "Seed de la base de données..."
    npx ts-node prisma/seed.ts || log_warning "Le seed a échoué ou n'est pas nécessaire"
fi

cd \${APP_DIR}

# Build de l'application
log_info "Build de l'application..."
npm run build

log_success "Déploiement de l'application terminé"
DEPLOY_EOF
)

# Exécuter le script de déploiement
log_info "Déploiement de l'application sur la VM..."
# Changer le propriétaire du répertoire avant le déploiement
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "chown -R archimodeler:archimodeler /opt/archimodeler 2>/dev/null || true"
# Exécuter en tant qu'utilisateur archimodeler (mais certaines commandes nécessitent root)
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "su - archimodeler -c 'bash -s'" <<< "$DEPLOY_SCRIPT"

###############################################################################
# Configuration des services systemd
###############################################################################

log_info "=== Configuration des services systemd ==="

# Créer le service systemd pour le backend
BACKEND_SERVICE=$(cat <<SERVICE_EOF
[Unit]
Description=ArchiModeler Backend API
After=network.target

[Service]
Type=simple
User=archimodeler
WorkingDirectory=/opt/archimodeler/apps/server
Environment=NODE_ENV=production
EnvironmentFile=/opt/archimodeler/apps/server/.env
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=archimodeler-backend

[Install]
WantedBy=multi-user.target
SERVICE_EOF
)

# Créer le service systemd pour le frontend
FRONTEND_SERVICE=$(cat <<SERVICE_EOF
[Unit]
Description=ArchiModeler Frontend
After=network.target

[Service]
Type=simple
User=archimodeler
WorkingDirectory=/opt/archimodeler/apps/web
Environment=NODE_ENV=production
EnvironmentFile=/opt/archimodeler/apps/web/.env.local
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=archimodeler-frontend

[Install]
WantedBy=multi-user.target
SERVICE_EOF
)

# Écrire les fichiers de service
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "cat > /etc/systemd/system/archimodeler-backend.service" <<< "$BACKEND_SERVICE"
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "cat > /etc/systemd/system/archimodeler-frontend.service" <<< "$FRONTEND_SERVICE"

# Recharger systemd et démarrer les services
log_info "Démarrage des services..."
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} <<SSH_EOF
systemctl daemon-reload
systemctl enable archimodeler-backend
systemctl enable archimodeler-frontend
systemctl start archimodeler-backend
systemctl start archimodeler-frontend
SSH_EOF

log_success "Services démarrés"

###############################################################################
# Configuration de Nginx
###############################################################################

log_info "=== Configuration de Nginx ==="

# Configuration Nginx
NGINX_CONFIG=$(cat <<NGINX_EOF
# Redirection HTTP vers HTTPS (décommentez après configuration SSL)
# server {
#     listen 80;
#     server_name _;
#     return 301 https://\\\$host\\\$request_uri;
# }

# Configuration pour le frontend et l'API
server {
    listen 80;
    server_name _;

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }

    # WebSocket pour la collaboration
    location /socket.io {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }

    # Documentation API
    location /api-docs {
        proxy_pass http://localhost:${BACKEND_PORT}/api-docs;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
NGINX_EOF
)

# Écrire la configuration Nginx
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "cat > /etc/nginx/sites-available/archimodeler" <<< "$NGINX_CONFIG"
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "ln -sf /etc/nginx/sites-available/archimodeler /etc/nginx/sites-enabled/"
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "rm -f /etc/nginx/sites-enabled/default"
ssh -o StrictHostKeyChecking=no root@${VM_IP_ONLY} "nginx -t && systemctl reload nginx"

log_success "Nginx configuré"

###############################################################################
# Finalisation
###############################################################################

log_success "=== Déploiement terminé avec succès ==="
echo ""
log_info "Résumé de l'installation:"
echo "  - VM ID: ${VM_ID}"
echo "  - VM Name: ${VM_NAME}"
echo "  - IP: ${VM_IP_ONLY}"
echo "  - Frontend: ${FRONTEND_URL}"
echo "  - API: ${API_URL}"
echo "  - Documentation API: ${API_URL}/api-docs"
echo ""
log_info "Commandes utiles:"
echo "  - Vérifier les services: ssh root@${VM_IP_ONLY} 'systemctl status archimodeler-backend archimodeler-frontend'"
echo "  - Voir les logs backend: ssh root@${VM_IP_ONLY} 'journalctl -u archimodeler-backend -f'"
echo "  - Voir les logs frontend: ssh root@${VM_IP_ONLY} 'journalctl -u archimodeler-frontend -f'"
echo "  - Redémarrer les services: ssh root@${VM_IP_ONLY} 'systemctl restart archimodeler-backend archimodeler-frontend'"
echo ""
log_warning "N'oubliez pas de:"
echo "  1. Configurer SSL/TLS avec Let's Encrypt: certbot --nginx -d votre-domaine.com"
echo "  2. Configurer un nom de domaine et mettre à jour les variables d'environnement si nécessaire"
echo "  3. Vérifier que le firewall est correctement configuré"
echo "  4. Configurer les sauvegardes régulières de la base de données"
echo ""

