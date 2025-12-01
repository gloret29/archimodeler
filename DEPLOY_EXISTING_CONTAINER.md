# Guide de Déploiement ArchiModeler sur Container Proxmox Existant

Ce guide explique comment déployer ArchiModeler dans un container Proxmox LXC Debian existant avec PostgreSQL déjà installé.

## 📋 Prérequis

- Container Proxmox LXC Debian existant et fonctionnel
- PostgreSQL installé et accessible (sur le même container ou sur un autre container)
- Accès root ou sudo sur le container
- Au moins 2GB de RAM et 10GB d'espace disque disponibles

### Architecture PostgreSQL

Ce guide supporte deux configurations :

1. **PostgreSQL sur le même container** : PostgreSQL est installé directement dans le container où vous déployez ArchiModeler
2. **PostgreSQL sur un autre container** : PostgreSQL est installé dans un container Proxmox séparé (configuration recommandée pour la production)

Si PostgreSQL est sur un autre container, vous devrez :
- Connaître l'adresse IP du container PostgreSQL
- Configurer PostgreSQL pour accepter les connexions réseau
- Utiliser l'IP du container PostgreSQL dans les fichiers `.env` au lieu de `localhost`

## 🚀 Installation Automatique (Recommandé)

Un script d'installation automatique et interactif est disponible pour simplifier le déploiement :

```bash
# Télécharger le script
wget https://raw.githubusercontent.com/gloret29/archimodeler/main/scripts/install-archimodeler.sh

# Ou si vous avez déjà cloné le projet
cd /opt/archimodeler
chmod +x scripts/install-archimodeler.sh

# Exécuter le script
./scripts/install-archimodeler.sh
```

Le script vous guidera à travers :
- ✅ Vérification des prérequis système
- ✅ Configuration interactive (PostgreSQL, ports, domaines, etc.)
- ✅ Installation automatique de toutes les dépendances
- ✅ Configuration des fichiers .env
- ✅ Initialisation de la base de données
- ✅ Configuration des services systemd
- ✅ Configuration de Nginx
- ✅ Démarrage des services

**Note** : Le script demande interactivement toutes les informations nécessaires (IP PostgreSQL, ports, mots de passe, etc.)

---

## 🔍 Étape 0: Vérification de l'Environnement (Installation Manuelle)

### Se connecter au container ArchiModeler

Connectez-vous au container où vous allez installer ArchiModeler :

```bash
# Depuis le serveur Proxmox
pct enter <container-archimodeler-id>

# Ou via SSH si configuré
ssh root@<container-archimodeler-ip>
```

### Vérifier PostgreSQL

**Si PostgreSQL est sur le même container** :

```bash
# Vérifier que PostgreSQL est installé
psql --version

# Vérifier que PostgreSQL est démarré
systemctl status postgresql

# Si PostgreSQL n'est pas démarré
systemctl start postgresql
systemctl enable postgresql
```

**Si PostgreSQL est sur un autre container** :

1. **Trouver l'IP du container PostgreSQL** :
   ```bash
   # Depuis le serveur Proxmox
   pct exec <container-postgres-id> -- hostname -I
   ```

2. **Vérifier que le container PostgreSQL est accessible** :
   ```bash
   # Depuis le container ArchiModeler
   ping <IP_CONTAINER_POSTGRES>
   ```

3. **Installer le client PostgreSQL** (si nécessaire) :
   ```bash
   apt-get install -y postgresql-client
   ```

4. **Tester la connexion** :
   ```bash
   # Tester la connexion (vous devrez peut-être configurer PostgreSQL d'abord - voir Étape 4)
   psql -h <IP_CONTAINER_POSTGRES> -U postgres -c "SELECT version();"
   ```

## 📦 Étape 1: Installation des Dépendances Système

Mettez à jour le système et installez les dépendances nécessaires :

```bash
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

# Installer les dépendances de base
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx
```

## 🟢 Étape 2: Installation de Node.js

Installez Node.js 20.x (version recommandée) :

```bash
# Ajouter le repository NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Installer Node.js
apt-get install -y nodejs

# Vérifier l'installation
node --version  # Doit afficher v20.x.x
npm --version   # Doit afficher 10.x.x
```

## 🐳 Étape 3: Configuration de Docker

Configurez Docker pour exécuter OpenSearch (PostgreSQL n'est pas nécessaire via Docker) :

```bash
# Démarrer et activer Docker
systemctl enable docker
systemctl start docker

# Vérifier que Docker fonctionne
docker --version
docker ps
```

## 🗄️ Étape 4: Préparation de la Base de Données PostgreSQL

### Cas 1: PostgreSQL sur le même container

Si PostgreSQL est installé sur le même container, connectez-vous directement :

```bash
# Se connecter à PostgreSQL (remplacez 'postgres' par votre utilisateur admin)
sudo -u postgres psql

# Ou si vous avez un mot de passe configuré
psql -U postgres
```

### Cas 2: PostgreSQL sur un autre container (Votre cas)

Si PostgreSQL est sur un autre container Proxmox, vous devez :

1. **Trouver l'adresse IP du container PostgreSQL** :
   ```bash
   # Depuis le serveur Proxmox
   pct exec <container-postgres-id> -- hostname -I
   # Ou
   pct config <container-postgres-id> | grep ip
   ```

2. **Se connecter au container PostgreSQL** :
   ```bash
   # Depuis le serveur Proxmox
   pct enter <container-postgres-id>
   
   # Puis dans le container PostgreSQL
   sudo -u postgres psql
   ```

3. **Vérifier que PostgreSQL accepte les connexions distantes** :
   
   Dans le container PostgreSQL, modifiez `/etc/postgresql/*/main/postgresql.conf` :
   ```bash
   # Trouver la version de PostgreSQL
   psql --version
   
   # Éditer le fichier de configuration (remplacez la version)
   nano /etc/postgresql/15/main/postgresql.conf
   ```
   
   Décommentez ou modifiez la ligne :
   ```conf
   listen_addresses = '*'  # ou '0.0.0.0'
   ```
   
   Modifiez `/etc/postgresql/*/main/pg_hba.conf` pour autoriser les connexions depuis le réseau :
   ```bash
   nano /etc/postgresql/15/main/pg_hba.conf
   ```
   
   Ajoutez une ligne pour autoriser les connexions depuis le réseau local :
   ```conf
   # IPv4 local connections:
   host    all             all             192.168.1.0/24          md5
   # ou pour autoriser depuis n'importe quelle IP du container ArchiModeler
   host    all             all             0.0.0.0/0               md5
   ```
   
   Redémarrez PostgreSQL :
   ```bash
   systemctl restart postgresql
   ```

### Créer la base de données et l'utilisateur

Dans le shell PostgreSQL (sur le container PostgreSQL), exécutez les commandes suivantes :

```sql
-- Créer la base de données
CREATE DATABASE archimodeler;

-- Créer un utilisateur (remplacez 'archimodeler_user' et 'votre_mot_de_passe' par vos valeurs)
CREATE USER archimodeler_user WITH PASSWORD 'votre_mot_de_passe';

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON DATABASE archimodeler TO archimodeler_user;

-- Se connecter à la base de données et accorder les privilèges sur le schéma
\c archimodeler
GRANT ALL ON SCHEMA public TO archimodeler_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO archimodeler_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO archimodeler_user;

-- Quitter PostgreSQL
\q
```

### Tester la connexion depuis le container ArchiModeler

Depuis le container où vous allez installer ArchiModeler, testez la connexion :

```bash
# Installer le client PostgreSQL si nécessaire
apt-get install -y postgresql-client

# Tester la connexion (remplacez par les bonnes valeurs)
psql -h <IP_CONTAINER_POSTGRES> -U archimodeler_user -d archimodeler

# Si la connexion fonctionne, vous devriez voir le prompt PostgreSQL
# Tapez \q pour quitter
```

**Note importante** : Notez les informations de connexion :
- **Host** : L'adresse IP du container PostgreSQL (ex: `192.168.1.114`)
- **Port** : `5432` (port par défaut, ou celui configuré)
- **Database** : `archimodeler`
- **User** : `archimodeler_user` (ou celui que vous avez créé)
- **Password** : Le mot de passe que vous avez défini

## 📥 Étape 5: Cloner le Projet

Créez le répertoire et clonez le projet :

```bash
# Créer le répertoire
mkdir -p /opt/archimodeler
cd /opt

# Cloner le repository
git clone https://github.com/gloret29/archimodeler.git

# Ou si vous avez le projet localement, copiez-le
# Depuis le serveur Proxmox (hors container) :
# pct push <container-id> /chemin/vers/archimodeler /opt/archimodeler

cd archimodeler
```

## 🔧 Étape 6: Modifier docker-compose.yml pour Exclure PostgreSQL

Puisque vous utilisez PostgreSQL existant, modifiez `docker-compose.yml` pour ne lancer que OpenSearch :

```bash
cd /opt/archimodeler
nano docker-compose.yml
```

Modifiez le fichier pour commenter ou supprimer la section PostgreSQL :

```yaml
version: '3.8'
services:
  # PostgreSQL est géré en dehors de Docker
  # postgres:
  #   image: postgres:15
  #   environment:
  #     POSTGRES_USER: user
  #     POSTGRES_PASSWORD: password
  #     POSTGRES_DB: archimodeler
  #   ports:
  #     - "5432:5432"
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data

  opensearch:
    image: opensearchproject/opensearch:2.11.0
    environment:
      - cluster.name=archimodeler-cluster
      - node.name=opensearch-node1
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
      - DISABLE_INSTALL_DEMO_CONFIG=true
      - DISABLE_SECURITY_PLUGIN=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    ports:
      - "9200:9200"
      - "9600:9600"
    volumes:
      - opensearch_data:/usr/share/opensearch/data

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.11.0
    ports:
      - "5601:5601"
    environment:
      OPENSEARCH_HOSTS: '["http://opensearch:9200"]'
      DISABLE_SECURITY_DASHBOARDS_PLUGIN: "true"
    depends_on:
      - opensearch

volumes:
  # postgres_data:  # Plus nécessaire
  opensearch_data:
```

## 📝 Étape 7: Configuration des Variables d'Environnement

### Créer le fichier `.env` pour la base de données

```bash
cd /opt/archimodeler/packages/database
cat > .env << EOF
DATABASE_URL="postgresql://archimodeler_user:votre_mot_de_passe@<IP_CONTAINER_POSTGRES>:5432/archimodeler?schema=public"
EOF
```

**Important** : Remplacez :
- `archimodeler_user` par votre utilisateur PostgreSQL
- `votre_mot_de_passe` par le mot de passe de l'utilisateur
- `<IP_CONTAINER_POSTGRES>` par l'adresse IP du container PostgreSQL (ex: `192.168.1.114`)
- `5432` si vous utilisez un port différent
- Si PostgreSQL est sur le même container, utilisez `localhost` au lieu de l'IP

### Créer le fichier `.env` pour le serveur

```bash
cd /opt/archimodeler/apps/server

# Générer un secret JWT sécurisé
JWT_SECRET=$(openssl rand -base64 32)

cat > .env << EOF
# Database (utilisez votre PostgreSQL existant - remplacez <IP_CONTAINER_POSTGRES> par l'IP du container PostgreSQL)
DATABASE_URL="postgresql://archimodeler_user:votre_mot_de_passe@<IP_CONTAINER_POSTGRES>:5432/archimodeler?schema=public"

# JWT
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="7d"

# API
API_PORT=3001
API_URL="http://localhost:3001"

# WebSocket
WS_URL="http://localhost:3001"

# Frontend (remplacez par votre domaine ou IP publique)
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"

# OpenSearch
OPENSEARCH_URL="http://localhost:9200"

# Environment
NODE_ENV=production
EOF
```

### Créer le fichier `.env` pour le frontend

```bash
cd /opt/archimodeler/apps/web

cat > .env << EOF
# API Configuration (remplacez par votre domaine ou IP publique)
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"

# Environment
NODE_ENV=production
EOF
```

**Note** : Si vous accédez à l'application depuis l'extérieur du container, remplacez `localhost` par :
- L'adresse IP publique du container, ou
- Votre nom de domaine (ex: `https://archimodeler.example.com`)

## 📦 Étape 8: Installation des Dépendances npm

```bash
cd /opt/archimodeler

# Installer toutes les dépendances
npm install

# Générer le client Prisma
cd packages/database
npx prisma generate
cd ../..
```

## 🐳 Étape 9: Démarrer OpenSearch

Démarrez uniquement OpenSearch via Docker Compose :

```bash
cd /opt/archimodeler

# Démarrer OpenSearch et OpenSearch Dashboards
docker-compose up -d

# Vérifier que les services sont démarrés
docker ps

# Vous devriez voir :
# - archimodeler-opensearch-1
# - archimodeler-opensearch-dashboards-1
```

Attendez quelques secondes que OpenSearch soit prêt :

```bash
# Vérifier la santé d'OpenSearch
curl http://localhost:9200/_cluster/health
```

## 🗄️ Étape 10: Initialiser la Base de Données

Exécutez les migrations Prisma pour créer les tables :

```bash
cd /opt/archimodeler/packages/database

# Appliquer les migrations
npx prisma migrate deploy

# Initialiser les données (créer les rôles et l'utilisateur admin)
npx ts-node prisma/seed.ts
```

Le script de seed crée :
- Les rôles par défaut (Consumer, Contributor, Designer, Lead Designer, System Administrator)
- Un utilisateur administrateur :
  - **Email** : `admin@archimodeler.com`
  - **Mot de passe** : `admin`
  
⚠️ **IMPORTANT** : Changez le mot de passe de l'administrateur après la première connexion !

## 🏗️ Étape 11: Compiler le Projet

```bash
cd /opt/archimodeler

# Compiler tous les packages
npm run build
```

Cette étape peut prendre plusieurs minutes.

## ⚙️ Étape 12: Configurer les Services Systemd

Créez les services systemd pour démarrer automatiquement l'application.

### Service pour le serveur backend

```bash
cat > /etc/systemd/system/archimodeler-server.service << 'EOF'
[Unit]
Description=ArchiModeler Server
After=network.target postgresql.service docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/archimodeler/apps/server
Environment=NODE_ENV=production
EnvironmentFile=/opt/archimodeler/apps/server/.env
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

### Service pour le frontend web

```bash
cat > /etc/systemd/system/archimodeler-web.service << 'EOF'
[Unit]
Description=ArchiModeler Web
After=network.target archimodeler-server.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/archimodeler/apps/web
Environment=NODE_ENV=production
EnvironmentFile=/opt/archimodeler/apps/web/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

### Activer et démarrer les services

```bash
# Recharger systemd
systemctl daemon-reload

# Activer les services (démarrage automatique au boot)
systemctl enable archimodeler-server archimodeler-web

# Démarrer les services
systemctl start archimodeler-server archimodeler-web

# Vérifier le statut
systemctl status archimodeler-server
systemctl status archimodeler-web
```

## 🌐 Étape 13: Configurer Nginx comme Reverse Proxy

Créez la configuration Nginx :

```bash
cat > /etc/nginx/sites-available/archimodeler << 'EOF'
server {
    listen 80;
    server_name _;  # Remplacez par votre domaine si vous en avez un

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
EOF
```

Activez la configuration :

```bash
# Créer le lien symbolique
ln -sf /etc/nginx/sites-available/archimodeler /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Recharger Nginx
systemctl reload nginx
```

## 🔒 Étape 14: Configurer SSL (Optionnel mais Recommandé)

Si vous avez un nom de domaine, configurez SSL avec Let's Encrypt :

```bash
# Modifier d'abord /etc/nginx/sites-available/archimodeler
# Remplacer "server_name _;" par "server_name votre-domaine.com;"

# Obtenir un certificat SSL
certbot --nginx -d votre-domaine.com

# Certbot modifie automatiquement la configuration Nginx
```

## ✅ Étape 15: Vérification du Déploiement

### Vérifier les services

```bash
# Vérifier les services systemd
systemctl status archimodeler-server
systemctl status archimodeler-web
systemctl status nginx
systemctl status postgresql
systemctl status docker

# Vérifier les containers Docker
docker ps

# Vérifier les ports
netstat -tlnp | grep -E '3000|3001|5432|9200|80|443'
```

### Vérifier les logs

```bash
# Logs du serveur
journalctl -u archimodeler-server -f

# Logs du frontend
journalctl -u archimodeler-web -f

# Logs Nginx
journalctl -u nginx -f

# Logs Docker (OpenSearch)
docker-compose logs -f
```

### Tester l'application

1. **Frontend** : Ouvrez http://IP_DU_CONTAINER (ou votre domaine)
2. **Backend API** : http://IP_DU_CONTAINER/api (documentation Swagger)
3. **Connexion** :
   - Email : `admin@archimodeler.com`
   - Mot de passe : `admin`
   - ⚠️ Changez le mot de passe immédiatement !

## 🔧 Commandes Utiles

### Gestion des services

```bash
# Redémarrer les services
systemctl restart archimodeler-server
systemctl restart archimodeler-web

# Arrêter les services
systemctl stop archimodeler-server archimodeler-web

# Voir les logs
journalctl -u archimodeler-server -n 50
journalctl -u archimodeler-web -n 50
```

### Gestion de la base de données

**Si PostgreSQL est sur le même container** :
```bash
# Se connecter à PostgreSQL
psql -U archimodeler_user -d archimodeler

# Sauvegarder la base de données
pg_dump -U archimodeler_user archimodeler > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer une sauvegarde
psql -U archimodeler_user archimodeler < backup_20241130_120000.sql
```

**Si PostgreSQL est sur un autre container** :
```bash
# Se connecter à PostgreSQL (remplacez <IP_CONTAINER_POSTGRES> par l'IP du container)
psql -h <IP_CONTAINER_POSTGRES> -U archimodeler_user -d archimodeler

# Sauvegarder la base de données
pg_dump -h <IP_CONTAINER_POSTGRES> -U archimodeler_user archimodeler > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer une sauvegarde
psql -h <IP_CONTAINER_POSTGRES> -U archimodeler_user archimodeler < backup_20241130_120000.sql
```

### Mise à jour du projet

```bash
cd /opt/archimodeler

# Récupérer les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install

# Appliquer les nouvelles migrations
cd packages/database
npx prisma migrate deploy
npx prisma generate
cd ../..

# Recompiler
npm run build

# Redémarrer les services
systemctl restart archimodeler-server archimodeler-web
```

## 🐛 Dépannage

### Le serveur ne démarre pas

1. Vérifiez que PostgreSQL est démarré :
   ```bash
   systemctl status postgresql
   ```

2. Vérifiez la connexion à la base de données :
   ```bash
   psql -U archimodeler_user -d archimodeler -c "SELECT 1;"
   ```

3. Vérifiez les variables d'environnement :
   ```bash
   cat /opt/archimodeler/apps/server/.env
   ```

4. Vérifiez les logs :
   ```bash
   journalctl -u archimodeler-server -n 50
   ```

### Erreur "Cannot connect to database"

1. **Si PostgreSQL est sur un autre container** :
   - Vérifiez que vous pouvez ping le container PostgreSQL :
     ```bash
     ping <IP_CONTAINER_POSTGRES>
     ```
   - Vérifiez que PostgreSQL écoute sur le réseau (pas seulement localhost) :
     ```bash
     # Depuis le container PostgreSQL
     netstat -tlnp | grep 5432
     # Doit afficher 0.0.0.0:5432 ou l'IP du container, pas seulement 127.0.0.1:5432
     ```
   - Vérifiez la configuration `postgresql.conf` (listen_addresses = '*')
   - Vérifiez la configuration `pg_hba.conf` (autorisation des connexions réseau)
   - Testez la connexion depuis le container ArchiModeler :
     ```bash
     psql -h <IP_CONTAINER_POSTGRES> -U archimodeler_user -d archimodeler
     ```

2. **Si PostgreSQL est sur le même container** :
   - Vérifiez que PostgreSQL écoute sur le bon port :
     ```bash
     netstat -tlnp | grep 5432
     ```
   - Testez la connexion manuellement :
     ```bash
     psql -U archimodeler_user -d archimodeler -h localhost
     ```

3. Vérifiez les permissions de l'utilisateur PostgreSQL :
   ```bash
   # Depuis le container PostgreSQL
   sudo -u postgres psql -c "\du archimodeler_user"
   ```

4. Vérifiez le pare-feu (si activé) :
   ```bash
   # Sur le container PostgreSQL, autoriser le port 5432
   ufw allow 5432/tcp
   # Ou vérifier iptables
   iptables -L -n | grep 5432
   ```

### OpenSearch ne démarre pas

1. Vérifiez les logs Docker :
   ```bash
   docker-compose logs opensearch
   ```

2. Vérifiez que Docker fonctionne :
   ```bash
   systemctl status docker
   ```

3. Vérifiez les ressources disponibles (OpenSearch nécessite au moins 512MB de RAM) :
   ```bash
   free -h
   ```

### Le frontend ne se connecte pas au backend

1. Vérifiez que le backend est démarré :
   ```bash
   curl http://localhost:3001/api
   ```

2. Vérifiez les variables `NEXT_PUBLIC_API_URL` et `NEXT_PUBLIC_WS_URL` dans `apps/web/.env`

3. Vérifiez la configuration Nginx

## 🔐 Sécurité

### Recommandations

1. **Changez le mot de passe admin** immédiatement après la première connexion
2. **Utilisez des mots de passe forts** pour l'utilisateur PostgreSQL
3. **Configurez un pare-feu** pour limiter l'accès aux ports :
   ```bash
   apt-get install -y ufw
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw enable
   ```
4. **Utilisez SSL/TLS** avec certbot pour les connexions sécurisées
5. **Configurez des sauvegardes régulières** de la base de données

### Sauvegarde automatique

Créez un script de sauvegarde quotidienne :

**Si PostgreSQL est sur le même container** :
```bash
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U archimodeler_user archimodeler > $BACKUP_DIR/archimodeler_$DATE.sql
# Garder seulement les 7 derniers backups
ls -t $BACKUP_DIR/archimodeler_*.sql 2>/dev/null | tail -n +8 | xargs rm -f
EOF
```

**Si PostgreSQL est sur un autre container** :
```bash
# Remplacez <IP_CONTAINER_POSTGRES> par l'IP du container PostgreSQL
cat > /opt/backup-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR
pg_dump -h <IP_CONTAINER_POSTGRES> -U archimodeler_user archimodeler > \$BACKUP_DIR/archimodeler_\$DATE.sql
# Garder seulement les 7 derniers backups
ls -t \$BACKUP_DIR/archimodeler_*.sql 2>/dev/null | tail -n +8 | xargs rm -f
EOF
```

**Activer le script** :
```bash
chmod +x /opt/backup-db.sh

# Ajouter au crontab (sauvegarde quotidienne à 2h du matin)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-db.sh") | crontab -
```

## 📞 Support

Pour plus d'informations, consultez :
- [README.md](./README.md)
- [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
- [DEPLOY_PROXMOX.md](./DEPLOY_PROXMOX.md)

---

## 📝 Script d'Installation Automatique

Un script d'installation automatique est disponible dans `scripts/install-archimodeler.sh`. Ce script :

- ✅ Vérifie automatiquement les prérequis système
- ✅ Demande interactivement toutes les configurations nécessaires
- ✅ Installe toutes les dépendances
- ✅ Configure PostgreSQL (local ou distant)
- ✅ Clone et configure le projet
- ✅ Configure les services systemd et Nginx
- ✅ Démarre tous les services

**Utilisation** :
```bash
chmod +x scripts/install-archimodeler.sh
./scripts/install-archimodeler.sh
```

Le script est inspiré des [Proxmox VE Helper-Scripts](https://community-scripts.github.io/ProxmoxVE/) pour une expérience d'installation similaire.

---

*Guide de Déploiement sur Container Existant - Version 1.0*  
*Dernière mise à jour : 2025-01-27*

)