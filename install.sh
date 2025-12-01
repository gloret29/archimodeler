#!/bin/bash
set -e

echo "🚀 Installation d'ArchiModeler"
echo ""

# Vérifier si Docker est accessible
if ! docker ps &>/dev/null; then
    echo "❌ Erreur: Docker n'est pas accessible."
    echo "   Veuillez vous déconnecter et vous reconnecter, ou exécutez:"
    echo "   newgrp docker"
    exit 1
fi

cd "$(dirname "$0")"

echo "📦 Démarrage des services Docker..."
# Créer les volumes si nécessaire
docker volume create postgres_data 2>/dev/null || true
docker volume create opensearch_data 2>/dev/null || true

# Démarrer PostgreSQL
echo "  → Démarrage PostgreSQL..."
docker run -d \
  --name archimodeler-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=archimodeler \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:15 2>/dev/null || docker start archimodeler-postgres 2>/dev/null || echo "  ⚠️  PostgreSQL déjà en cours d'exécution"

# Attendre que PostgreSQL soit prêt
echo "  → Attente de PostgreSQL..."
sleep 5
until docker exec archimodeler-postgres pg_isready -U user &>/dev/null; do
    echo "  → En attente..."
    sleep 2
done

# Démarrer OpenSearch
echo "  → Démarrage OpenSearch..."
docker run -d \
  --name archimodeler-opensearch \
  -e cluster.name=archimodeler-cluster \
  -e node.name=opensearch-node1 \
  -e discovery.type=single-node \
  -e bootstrap.memory_lock=true \
  -e "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m" \
  -e DISABLE_INSTALL_DEMO_CONFIG=true \
  -e DISABLE_SECURITY_PLUGIN=true \
  --ulimit memlock=-1:-1 \
  --ulimit nofile=65536:65536 \
  -p 9200:9200 \
  -p 9600:9600 \
  -v opensearch_data:/usr/share/opensearch/data \
  --restart unless-stopped \
  opensearchproject/opensearch:2.11.0 2>/dev/null || docker start archimodeler-opensearch 2>/dev/null || echo "  ⚠️  OpenSearch déjà en cours d'exécution"

# Démarrer OpenSearch Dashboards
echo "  → Démarrage OpenSearch Dashboards..."
docker run -d \
  --name archimodeler-opensearch-dashboards \
  --link archimodeler-opensearch:opensearch \
  -e OPENSEARCH_HOSTS='["http://opensearch:9200"]' \
  -e DISABLE_SECURITY_DASHBOARDS_PLUGIN=true \
  -p 5601:5601 \
  --restart unless-stopped \
  opensearchproject/opensearch-dashboards:2.11.0 2>/dev/null || docker start archimodeler-opensearch-dashboards 2>/dev/null || echo "  ⚠️  OpenSearch Dashboards déjà en cours d'exécution"

echo ""
echo "✅ Services Docker démarrés"
echo ""

# Vérifier que les fichiers .env existent
if [ ! -f "packages/database/.env" ]; then
    echo "📝 Création du fichier .env pour la base de données..."
    echo 'DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler?schema=public"' > packages/database/.env
fi

if [ ! -f "apps/server/.env" ]; then
    echo "📝 Création du fichier .env pour le serveur..."
    JWT_SECRET=$(openssl rand -base64 32)
    cat > apps/server/.env << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler?schema=public"

# JWT
JWT_SECRET="${JWT_SECRET}"
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
fi

if [ ! -f "apps/web/.env" ]; then
    echo "📝 Création du fichier .env pour le web..."
    cat > apps/web/.env << EOF
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"

# Environment
NODE_ENV=development
EOF
fi

echo ""
echo "🗄️  Configuration de la base de données..."

cd packages/database

echo "  → Génération du client Prisma..."
npx prisma generate

echo "  → Application des migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push

echo "  → Initialisation des données (seed)..."
npx ts-node prisma/seed.ts

cd ../..

echo ""
echo "✅ Installation terminée !"
echo ""
echo "🚀 Pour démarrer l'application, exécutez:"
echo "   npm run dev"
echo ""
echo "📱 L'application sera accessible à:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - Documentation Swagger: http://localhost:3001/api"
echo ""
echo "🔐 Première connexion:"
echo "   Email: admin@archimodeler.com"
echo "   Mot de passe: admin123"
echo "   ⚠️  Changez le mot de passe après la première connexion !"







