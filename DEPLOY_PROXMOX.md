# Guide de Déploiement ArchiModeler sur Proxmox

Ce guide explique comment déployer ArchiModeler sur un container LXC Proxmox.

## Prérequis

- Serveur Proxmox VE installé et fonctionnel
- Accès root ou sudo sur le serveur Proxmox
- Template Ubuntu 22.04 disponible dans Proxmox
- Au moins 2GB de RAM et 20GB d'espace disque disponibles

## Méthode 1: Script Automatique (Recommandé)

### Étape 1: Préparer le script

Le script `scripts/deploy-proxmox.sh` automatise tout le processus de déploiement.

```bash
# Rendre le script exécutable
chmod +x scripts/deploy-proxmox.sh
```

### Étape 2: Exécuter le script

```bash
# Déploiement avec paramètres par défaut
./scripts/deploy-proxmox.sh

# Ou avec paramètres personnalisés
./scripts/deploy-proxmx.sh [container-id] [container-name] [storage] [node] [memory] [disk] [cpu-cores]

# Exemple:
./scripts/deploy-proxmox.sh 100 archimodeler local-lvm pve1 4096 30 4
```

**Paramètres:**
- `container-id`: ID du container (défaut: 100)
- `container-name`: Nom du container (défaut: archimodeler)
- `storage`: Stockage Proxmox (défaut: local-lvm)
- `node`: Nom du nœud Proxmox (défaut: hostname)
- `memory`: Mémoire en MB (défaut: 2048)
- `disk`: Taille du disque en GB (défaut: 20)
- `cpu-cores`: Nombre de cœurs CPU (défaut: 2)

### Étape 3: Copier le projet dans le container

Si vous n'utilisez pas Git, copiez le projet manuellement:

```bash
# Depuis le système hôte Proxmox
pct push 100 /chemin/vers/archimodeler /opt/archimodeler
```

Ou depuis un autre serveur:

```bash
# Sur le serveur source
tar czf archimodeler.tar.gz archimodeler/
scp archimodeler.tar.gz root@proxmox-server:/tmp/

# Sur le serveur Proxmox
pct push 100 /tmp/archimodeler.tar.gz /tmp/
pct exec 100 -- tar xzf /tmp/archimodeler.tar.gz -C /opt/
```

## Méthode 2: Installation Manuelle

### Étape 1: Créer le container LXC

```bash
# Créer un container Ubuntu 22.04
pct create 100 \
    local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
    --hostname archimodeler \
    --storage local-lvm \
    --memory 2048 \
    --cores 2 \
    --rootfs local-lvm:20 \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --unprivileged 0 \
    --features nesting=1,keyctl=1

# Démarrer le container
pct start 100

# Accéder au container
pct enter 100
```

### Étape 2: Installer les dépendances système

```bash
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
apt-get install -y \
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
    python3-certbot-nginx
```

### Étape 3: Installer Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### Étape 4: Configurer Docker

```bash
systemctl enable docker
systemctl start docker
```

### Étape 5: Cloner et installer le projet

```bash
# Créer le répertoire
mkdir -p /opt/archimodeler
cd /opt

# Cloner le projet (ou copier depuis le système hôte)
git clone https://github.com/your-org/archimodeler.git
cd archimodeler

# Installer les dépendances
npm install

# Générer le client Prisma
cd packages/database
npx prisma generate
cd ../..
```

### Étape 6: Configurer l'environnement

Créer les fichiers `.env`:

**`apps/server/.env`:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/archimodeler?schema=public
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
API_PORT=3001
API_URL=http://localhost:3001
WS_URL=http://localhost:3001
OPENSEARCH_URL=http://localhost:9200
NODE_ENV=production
```

**`apps/web/.env`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
NODE_ENV=production
```

**`packages/database/.env`:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/archimodeler?schema=public
```

### Étape 7: Démarrer les services Docker

```bash
cd /opt/archimodeler
docker-compose up -d

# Vérifier que les services sont démarrés
docker ps
```

### Étape 8: Exécuter les migrations

```bash
cd /opt/archimodeler/packages/database
npx prisma migrate deploy
```

### Étape 9: Compiler le projet

```bash
cd /opt/archimodeler
npm run build
```

### Étape 10: Configurer les services systemd

**`/etc/systemd/system/archimodeler-server.service`:**
```ini
[Unit]
Description=ArchiModeler Server
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/archimodeler/apps/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**`/etc/systemd/system/archimodeler-web.service`:**
```ini
[Unit]
Description=ArchiModeler Web
After=network.target archimodeler-server.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/archimodeler/apps/web
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activer et démarrer les services:

```bash
systemctl daemon-reload
systemctl enable archimodeler-server archimodeler-web
systemctl start archimodeler-server archimodeler-web

# Vérifier le statut
systemctl status archimodeler-server
systemctl status archimodeler-web
```

### Étape 11: Configurer Nginx

**`/etc/nginx/sites-available/archimodeler`:**
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Activer la configuration:

```bash
ln -sf /etc/nginx/sites-available/archimodeler /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### Étape 12: Configurer SSL (Optionnel)

```bash
certbot --nginx -d votre-domaine.com
```

## Vérification du Déploiement

### Vérifier les services

```bash
# Vérifier les services systemd
systemctl status archimodeler-server
systemctl status archimodeler-web
systemctl status nginx
systemctl status docker

# Vérifier les containers Docker
docker ps

# Vérifier les logs
journalctl -u archimodeler-server -f
journalctl -u archimodeler-web -f
```

### Tester l'application

- Frontend: http://IP_DU_CONTAINER:3000
- Backend API: http://IP_DU_CONTAINER:3001
- Via Nginx: http://IP_DU_CONTAINER

## Commandes Utiles

### Gestion du container

```bash
# Accéder au container
pct enter 100

# Arrêter le container
pct stop 100

# Démarrer le container
pct start 100

# Redémarrer le container
pct reboot 100

# Voir les informations du container
pct config 100
```

### Gestion des services

```bash
# Redémarrer les services
systemctl restart archimodeler-server
systemctl restart archimodeler-web

# Voir les logs
journalctl -u archimodeler-server -f
journalctl -u archimodeler-web -f

# Arrêter les services
systemctl stop archimodeler-server archimodeler-web
```

### Mise à jour du projet

```bash
# Accéder au container
pct enter 100

# Aller dans le répertoire du projet
cd /opt/archimodeler

# Mettre à jour depuis Git
git pull origin main

# Installer les nouvelles dépendances
npm install

# Exécuter les migrations
cd packages/database
npx prisma migrate deploy
cd ../..

# Recompiler
npm run build

# Redémarrer les services
systemctl restart archimodeler-server archimodeler-web
```

## Dépannage

### Le container ne démarre pas

```bash
# Vérifier les logs
pct enter 100
journalctl -xe
```

### Les services ne démarrent pas

```bash
# Vérifier les logs
journalctl -u archimodeler-server -n 50
journalctl -u archimodeler-web -n 50

# Vérifier les ports
netstat -tlnp | grep -E '3000|3001'
```

### Problèmes de base de données

```bash
# Vérifier que PostgreSQL est démarré
docker ps | grep postgres

# Vérifier la connexion
docker exec -it archimodeler-postgres-1 psql -U user -d archimodeler
```

### Problèmes de compilation

```bash
# Nettoyer et réinstaller
cd /opt/archimodeler
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
npm install
npm run build
```

## Sécurité

### Recommandations

1. **Changer les mots de passe par défaut** dans les fichiers `.env`
2. **Configurer un pare-feu** pour limiter l'accès aux ports
3. **Utiliser SSL/TLS** avec certbot pour les connexions sécurisées
4. **Configurer des sauvegardes régulières** de la base de données
5. **Mettre à jour régulièrement** le système et les dépendances

### Configuration du pare-feu

```bash
# Installer ufw
apt-get install -y ufw

# Autoriser SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le pare-feu
ufw enable
```

## Sauvegarde

### Sauvegarde de la base de données

```bash
# Créer un script de sauvegarde
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec archimodeler-postgres-1 pg_dump -U user archimodeler > $BACKUP_DIR/archimodeler_$DATE.sql
# Garder seulement les 7 derniers backups
ls -t $BACKUP_DIR/archimodeler_*.sql | tail -n +8 | xargs rm -f
EOF

chmod +x /opt/backup-db.sh

# Ajouter au crontab (sauvegarde quotidienne à 2h du matin)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-db.sh") | crontab -
```

### Sauvegarde complète du container

```bash
# Depuis le serveur Proxmox
vzdump 100 --storage local --compress gzip
```

## Support

Pour plus d'informations, consultez:
- [README.md](./README.md)
- [DEV_GUIDE.md](./DEV_GUIDE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
