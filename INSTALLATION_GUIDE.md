# Guide d'Installation ArchiModeler

> Guide complet pour installer et configurer ArchiModeler en développement ou en production

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation en Développement](#installation-en-développement)
3. [Installation en Production](#installation-en-production)
4. [Configuration](#configuration)
5. [Vérification de l'Installation](#vérification-de-linstallation)
6. [Dépannage](#dépannage)

---

## Prérequis

### Logiciels Requis

- **Node.js** : Version 18.0.0 ou supérieure (recommandé : 20.x)
- **npm** : Version 9.0.0 ou supérieure (inclus avec Node.js)
- **PostgreSQL** : Version 14 ou supérieure (recommandé : 15)
- **Docker** et **Docker Compose** : Pour les services (PostgreSQL, OpenSearch)
- **Git** : Pour cloner le repository

### Vérification des Prérequis

```bash
# Vérifier Node.js
node --version
# Doit afficher v18.x.x ou supérieur

# Vérifier npm
npm --version
# Doit afficher 9.x.x ou supérieur

# Vérifier Docker
docker --version
docker-compose --version

# Vérifier PostgreSQL (si installé localement)
psql --version
```

### Espace Disque

- **Minimum** : 2 GB d'espace libre
- **Recommandé** : 5 GB ou plus pour les données et les dépendances

---

## Installation en Développement

### Étape 1 : Cloner le Repository

```bash
git clone https://github.com/gloret29/archimodeler.git
cd archimodeler
```

### Étape 2 : Installer les Dépendances

```bash
# Installer toutes les dépendances du monorepo
npm install
```

Cette commande installe automatiquement les dépendances pour :
- Le projet racine
- L'application web (`apps/web`)
- L'application serveur (`apps/server`)
- Les packages partagés (`packages/*`)

**Durée estimée** : 2-5 minutes selon votre connexion internet

### Étape 3 : Démarrer les Services Docker

ArchiModeler nécessite PostgreSQL et OpenSearch. Le moyen le plus simple est d'utiliser Docker Compose :

```bash
# Démarrer PostgreSQL et OpenSearch
docker-compose up -d
```

Cette commande démarre :
- **PostgreSQL** sur le port `5432`
- **OpenSearch** sur le port `9200`
- **OpenSearch Dashboards** sur le port `5601`

**Vérification** :

```bash
# Vérifier que les conteneurs sont en cours d'exécution
docker ps

# Vous devriez voir :
# - archimodeler-postgres-1
# - archimodeler-opensearch-1
# - archimodeler-opensearch-dashboards-1
```

### Étape 4 : Configurer la Base de Données

#### Créer le fichier `.env` pour la base de données

Créez un fichier `.env` dans `packages/database/` :

```bash
cd packages/database
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler?schema=public"
EOF
cd ../..
```

> **Note** : Les identifiants par défaut sont définis dans `docker-compose.yml`. Pour la production, changez-les !

#### Générer le Client Prisma

```bash
cd packages/database
npx prisma generate
cd ../..
```

#### Exécuter les Migrations

```bash
cd packages/database
npx prisma migrate dev
cd ../..
```

Cette commande :
- Crée toutes les tables dans PostgreSQL
- Applique toutes les migrations
- Génère le client Prisma

#### Initialiser les Données (Seed)

```bash
cd packages/database
npx ts-node prisma/seed.ts
cd ../..
```

Le script de seed crée :
- Les rôles par défaut (Consumer, Contributor, Designer, Lead Designer, System Administrator)
- Un utilisateur administrateur (email: `admin@archimodeler.com`, password: `admin`)
- Le métamodèle ArchiMate de base

> **⚠️ Important** : Changez le mot de passe de l'administrateur après la première connexion !

### Étape 5 : Configurer les Variables d'Environnement

#### Backend (`apps/server/.env`)

Créez un fichier `.env` dans `apps/server/` :

```bash
cd apps/server
cat > .env << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler?schema=public"

# JWT
JWT_SECRET="votre-secret-jwt-tres-securise-changez-moi"
JWT_EXPIRES_IN="7d"

# API
API_PORT=3001
API_URL="http://localhost:3001"

# WebSocket
WS_URL="http://localhost:3001"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"

# OpenSearch
OPENSEARCH_URL="http://localhost:9200"

# Environment
NODE_ENV=development
EOF
cd ../..
```

> **Générer un JWT_SECRET sécurisé** :
> ```bash
> openssl rand -base64 32
> ```

#### Frontend (`apps/web/.env`)

Créez un fichier `.env` dans `apps/web/` :

```bash
cd apps/web
cat > .env << EOF
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"

# Environment
NODE_ENV=development
EOF
cd ../..
```

### Étape 6 : Lancer l'Application

```bash
# Depuis la racine du projet
npm run dev
```

Cette commande démarre :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Documentation Swagger** : http://localhost:3001/api

**Première connexion** :
1. Ouvrez http://localhost:3000
2. Connectez-vous avec :
   - Email : `admin@archimodeler.com`
   - Mot de passe : `admin`
3. **Changez immédiatement le mot de passe** dans les paramètres !

---

## Installation en Production

### Option 1 : Déploiement sur Proxmox (Recommandé)

Pour un déploiement automatisé sur Proxmox LXC, utilisez le script fourni :

```bash
# Rendre le script exécutable
chmod +x scripts/deploy-proxmox.sh

# Exécuter le script
./scripts/deploy-proxmox.sh [container-id] [container-name]
```

**Paramètres** :
- `container-id` : ID du container (défaut: 100)
- `container-name` : Nom du container (défaut: archimodeler)

Le script configure automatiquement :
- Container LXC Ubuntu 22.04
- Node.js 20.x
- Docker et Docker Compose
- PostgreSQL et OpenSearch
- Services systemd
- Nginx comme reverse proxy
- SSL avec certbot (optionnel)

**Documentation complète** : Voir [DEPLOY_PROXMOX.md](./DEPLOY_PROXMOX.md)

### Option 2 : Installation Manuelle sur Serveur

#### Prérequis Serveur

- Ubuntu 22.04 LTS (ou distribution Linux similaire)
- Accès root ou sudo
- Au moins 2GB de RAM
- Au moins 20GB d'espace disque

#### Installation des Dépendances Système

```bash
# Mettre à jour le système
sudo apt-get update
sudo apt-get upgrade -y

# Installer les dépendances
sudo apt-get install -y \
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

# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

#### Configuration Docker

```bash
# Démarrer Docker
sudo systemctl enable docker
sudo systemctl start docker

# Ajouter votre utilisateur au groupe docker (optionnel, pour éviter sudo)
sudo usermod -aG docker $USER
# Déconnexion/reconnexion nécessaire pour que cela prenne effet
```

#### Cloner et Installer le Projet

```bash
# Cloner le repository
cd /opt
sudo git clone https://github.com/gloret29/archimodeler.git
sudo chown -R $USER:$USER archimodeler
cd archimodeler

# Installer les dépendances
npm install

# Générer le client Prisma
cd packages/database
npx prisma generate
cd ../..
```

#### Configuration de l'Environnement

Créez les fichiers `.env` comme décrit dans la section [Configuration](#configuration) ci-dessus, mais avec les valeurs de production :

**`packages/database/.env`** :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler?schema=public"
```

**`apps/server/.env`** :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler?schema=public"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="7d"
API_PORT=3001
API_URL="http://localhost:3001"
WS_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://votre-domaine.com"
NEXT_PUBLIC_WS_URL="http://votre-domaine.com"
OPENSEARCH_URL="http://localhost:9200"
NODE_ENV=production
```

**`apps/web/.env`** :
```env
NEXT_PUBLIC_API_URL="http://votre-domaine.com"
NEXT_PUBLIC_WS_URL="http://votre-domaine.com"
NODE_ENV=production
```

#### Démarrer les Services Docker

```bash
# Démarrer PostgreSQL et OpenSearch
docker-compose up -d

# Vérifier qu'ils sont démarrés
docker ps
```

#### Initialiser la Base de Données

```bash
cd packages/database
npx prisma migrate deploy
npx ts-node prisma/seed.ts
cd ../..
```

#### Compiler le Projet

```bash
# Compiler tous les packages
npm run build
```

#### Configurer les Services Systemd

**`/etc/systemd/system/archimodeler-server.service`** :

```ini
[Unit]
Description=ArchiModeler Server
After=network.target docker.service

[Service]
Type=simple
User=www-data
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
```

**`/etc/systemd/system/archimodeler-web.service`** :

```ini
[Unit]
Description=ArchiModeler Web
After=network.target archimodeler-server.service

[Service]
Type=simple
User=www-data
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
```

**Activer et démarrer les services** :

```bash
sudo systemctl daemon-reload
sudo systemctl enable archimodeler-server archimodeler-web
sudo systemctl start archimodeler-server archimodeler-web

# Vérifier le statut
sudo systemctl status archimodeler-server
sudo systemctl status archimodeler-web
```

#### Configurer Nginx

**`/etc/nginx/sites-available/archimodeler`** :

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

**Activer la configuration** :

```bash
sudo ln -sf /etc/nginx/sites-available/archimodeler /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### Configurer SSL (Optionnel mais Recommandé)

```bash
sudo certbot --nginx -d votre-domaine.com
```

---

## Configuration

### Variables d'Environnement Importantes

#### Base de Données

- **`DATABASE_URL`** : URL de connexion PostgreSQL
  - Format : `postgresql://user:password@host:port/database?schema=public`
  - Exemple : `postgresql://user:password@localhost:5432/archimodeler?schema=public`

#### Sécurité

- **`JWT_SECRET`** : Secret pour signer les tokens JWT
  - **⚠️ CRITIQUE** : Changez-le en production !
  - Génération : `openssl rand -base64 32`
- **`JWT_EXPIRES_IN`** : Durée de validité des tokens (défaut: `7d`)

#### URLs

- **`NEXT_PUBLIC_API_URL`** : URL publique de l'API backend
- **`NEXT_PUBLIC_WS_URL`** : URL publique du WebSocket
- **`API_PORT`** : Port du serveur backend (défaut: `3001`)

#### OpenSearch

- **`OPENSEARCH_URL`** : URL d'OpenSearch (défaut: `http://localhost:9200`)

### Configuration de la Base de Données

#### Changer les Identifiants PostgreSQL

1. Modifiez `docker-compose.yml` :
```yaml
postgres:
  environment:
    POSTGRES_USER: votre_nouveau_user
    POSTGRES_PASSWORD: votre_nouveau_password
    POSTGRES_DB: archimodeler
```

2. Redémarrez le conteneur :
```bash
docker-compose down
docker-compose up -d
```

3. Mettez à jour `DATABASE_URL` dans tous les fichiers `.env`

### Configuration du Pare-feu

```bash
# Installer ufw
sudo apt-get install -y ufw

# Autoriser SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le pare-feu
sudo ufw enable
```

---

## Vérification de l'Installation

### Vérifier les Services

```bash
# Vérifier Docker
docker ps
# Doit afficher : postgres, opensearch, opensearch-dashboards

# Vérifier les services systemd (production)
sudo systemctl status archimodeler-server
sudo systemctl status archimodeler-web
sudo systemctl status nginx

# Vérifier les ports
netstat -tlnp | grep -E '3000|3001|5432|9200'
```

### Tester l'Application

1. **Frontend** : Ouvrez http://localhost:3000 (ou votre domaine)
2. **Backend API** : Ouvrez http://localhost:3001/api (documentation Swagger)
3. **OpenSearch** : Ouvrez http://localhost:9200 (vérifier la santé)
4. **OpenSearch Dashboards** : Ouvrez http://localhost:5601

### Tester la Connexion à la Base de Données

```bash
# Depuis packages/database
npx prisma studio
# Ouvre une interface graphique sur http://localhost:5555
```

### Vérifier les Logs

```bash
# Logs du serveur (production)
sudo journalctl -u archimodeler-server -f
sudo journalctl -u archimodeler-web -f

# Logs Docker
docker-compose logs -f
```

---

## Dépannage

### Problèmes Courants

#### Le serveur ne démarre pas

**Symptôme** : Erreur au démarrage du serveur

**Solutions** :
1. Vérifiez que PostgreSQL est démarré :
   ```bash
   docker ps | grep postgres
   ```

2. Vérifiez la connexion à la base de données :
   ```bash
   cd packages/database
   npx prisma db pull
   ```

3. Vérifiez les variables d'environnement :
   ```bash
   cat apps/server/.env
   ```

#### Erreur "Cannot connect to database"

**Symptôme** : Erreur de connexion PostgreSQL

**Solutions** :
1. Vérifiez que le conteneur PostgreSQL est démarré :
   ```bash
   docker-compose ps
   ```

2. Vérifiez les logs PostgreSQL :
   ```bash
   docker-compose logs postgres
   ```

3. Vérifiez l'URL de connexion dans `.env` :
   ```bash
   echo $DATABASE_URL
   ```

4. Testez la connexion manuellement :
   ```bash
   docker exec -it archimodeler-postgres-1 psql -U user -d archimodeler
   ```

#### Erreur "Prisma Client not generated"

**Symptôme** : Erreur `@prisma/client did not initialize yet`

**Solution** :
```bash
cd packages/database
npx prisma generate
cd ../..
```

#### Le frontend ne se connecte pas au backend

**Symptôme** : Erreurs CORS ou connexion refusée

**Solutions** :
1. Vérifiez que le backend est démarré :
   ```bash
   curl http://localhost:3001/api
   ```

2. Vérifiez les variables `NEXT_PUBLIC_API_URL` et `NEXT_PUBLIC_WS_URL`

3. Vérifiez les logs du backend pour les erreurs CORS

#### Erreur "Port already in use"

**Symptôme** : Le port 3000 ou 3001 est déjà utilisé

**Solutions** :
1. Trouvez le processus qui utilise le port :
   ```bash
   # Linux/Mac
   lsof -i :3000
   lsof -i :3001
   
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   ```

2. Arrêtez le processus ou changez le port dans les fichiers `.env`

#### Erreur lors des migrations Prisma

**Symptôme** : Erreur lors de `prisma migrate dev` ou `prisma migrate deploy`

**Solutions** :
1. Vérifiez que la base de données est accessible
2. Vérifiez les permissions de l'utilisateur PostgreSQL
3. Réinitialisez la base de données (⚠️ supprime toutes les données) :
   ```bash
   cd packages/database
   npx prisma migrate reset
   ```

### Logs Utiles

```bash
# Logs du serveur backend (développement)
# Les logs s'affichent dans le terminal où vous avez lancé `npm run dev`

# Logs du serveur backend (production)
sudo journalctl -u archimodeler-server -n 50

# Logs du frontend (production)
sudo journalctl -u archimodeler-web -n 50

# Logs Docker
docker-compose logs -f

# Logs PostgreSQL
docker-compose logs postgres

# Logs OpenSearch
docker-compose logs opensearch
```

### Réinitialisation Complète

Si vous rencontrez des problèmes majeurs, vous pouvez réinitialiser complètement :

```bash
# Arrêter tous les services
docker-compose down

# Supprimer les volumes (⚠️ supprime toutes les données)
docker-compose down -v

# Supprimer node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Réinstaller
npm install

# Redémarrer les services
docker-compose up -d

# Réinitialiser la base de données
cd packages/database
npx prisma migrate reset
cd ../..
```

---

## Mise à Jour

### Mettre à Jour le Code

```bash
# Récupérer les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install

# Appliquer les nouvelles migrations
cd packages/database
npx prisma migrate deploy
npx prisma generate
cd ../..

# Recompiler (production)
npm run build

# Redémarrer les services (production)
sudo systemctl restart archimodeler-server archimodeler-web
```

### Sauvegarder la Base de Données

```bash
# Créer une sauvegarde
docker exec archimodeler-postgres-1 pg_dump -U user archimodeler > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer une sauvegarde
docker exec -i archimodeler-postgres-1 psql -U user archimodeler < backup_20241130_120000.sql
```

---

## Support

### Ressources

- **Documentation** : Voir [README.md](./README.md)
- **Manuel Utilisateur** : Voir [USER_MANUAL.md](./USER_MANUAL.md)
- **Guide de Déploiement Proxmox** : Voir [DEPLOY_PROXMOX.md](./DEPLOY_PROXMOX.md)

### Contact

- **Email Support** : support@archimodeler.com
- **Issues GitHub** : [GitHub Issues](https://github.com/gloret29/archimodeler/issues)

---

*Guide d'Installation ArchiModeler - Version 1.0*  
*Dernière mise à jour : 2025-11-30*


