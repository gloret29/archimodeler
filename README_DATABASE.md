# Configuration de la Base de Données - Guide Rapide

## 🚀 Démarrage Rapide

### 1. Démarrer les conteneurs Docker

```bash
docker-compose up -d
```

Cela démarre :
- PostgreSQL sur le port 5432
- Neo4j sur les ports 7474 (HTTP) et 7687 (Bolt)
- OpenSearch sur le port 9200

### 2. Vérifier que les fichiers .env existent

Les fichiers `.env` ont été créés avec les configurations suivantes :

- **Racine** : `/workspace/.env`
- **Server** : `/workspace/apps/server/.env`

### 3. Générer le client Prisma

```bash
npm run db:generate
```

Ou manuellement :
```bash
cd packages/database
npx prisma generate
```

### 4. Appliquer les migrations

```bash
npm run db:push
```

Ou manuellement :
```bash
cd packages/database
npx prisma db push
```

### 5. Tester les connexions

```bash
npm run test-db
```

## 📋 Variables d'Environnement

Les fichiers `.env` contiennent :

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler?schema=public"

# Neo4j
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="password"

# OpenSearch
OPENSEARCH_NODE="http://localhost:9200"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server
PORT=3002
```

## 🔧 Commandes Utiles

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer le schéma à la base de données
npm run db:push

# Tester les connexions
npm run test-db

# Voir les logs Docker
docker-compose logs -f

# Redémarrer les services
docker-compose restart
```

## 🐛 Problèmes Courants

### Les conteneurs ne démarrent pas

```bash
# Vérifier l'état
docker ps -a

# Voir les logs
docker-compose logs

# Redémarrer
docker-compose restart
```

### Erreur "Can't reach database server"

1. Vérifier que Docker est démarré
2. Vérifier que les conteneurs sont actifs : `docker ps`
3. Vérifier les ports : `docker-compose ps`

### Erreur "Prisma Client has not been generated"

```bash
npm run db:generate
```

### Erreur "Database does not exist"

```bash
npm run db:push
```

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `TROUBLESHOOTING_DATABASE.md` - Guide de dépannage complet
- `ARCHITECTURE.md` - Architecture technique
- [Documentation Prisma](https://www.prisma.io/docs)
