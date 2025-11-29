# Guide de Dépannage - Connexion Base de Données

## 🔍 Diagnostic du Problème de Connexion

### 1. Vérifier que les conteneurs Docker sont démarrés

```bash
# Vérifier l'état des conteneurs
docker ps

# Si les conteneurs ne sont pas démarrés, les lancer
docker-compose up -d

# Vérifier les logs en cas d'erreur
docker-compose logs postgres
docker-compose logs neo4j
```

### 2. Vérifier les variables d'environnement

Les fichiers `.env` ont été créés avec les configurations suivantes :

**PostgreSQL** (d'après docker-compose.yml) :
- Host: `localhost`
- Port: `5432`
- User: `user`
- Password: `password`
- Database: `archimodeler`
- URL: `postgresql://user:password@localhost:5432/archimodeler?schema=public`

**Neo4j** (d'après docker-compose.yml) :
- URI: `bolt://localhost:7687`
- User: `neo4j`
- Password: `password`

### 3. Vérifier la connexion PostgreSQL

```bash
# Tester la connexion PostgreSQL directement
psql -h localhost -U user -d archimodeler

# Ou avec la variable d'environnement
psql $DATABASE_URL
```

### 4. Générer le client Prisma

```bash
# À la racine du projet
cd packages/database
npx prisma generate

# Ou depuis la racine avec npm
npm run generate --workspace=@repo/database
```

### 5. Appliquer les migrations Prisma

```bash
# Appliquer toutes les migrations
cd packages/database
npx prisma migrate deploy

# Ou pousser le schéma (développement uniquement)
npx prisma db push
```

### 6. Vérifier la connexion depuis le serveur NestJS

```bash
# Démarrer le serveur en mode debug
cd apps/server
npm run start:dev

# Vérifier les logs de connexion
# Vous devriez voir :
# - "Neo4j connection established" pour Neo4j
# - Pas d'erreur Prisma pour PostgreSQL
```

## 🐛 Problèmes Courants

### Erreur: "Can't reach database server"

**Cause** : Les conteneurs Docker ne sont pas démarrés.

**Solution** :
```bash
docker-compose up -d
```

### Erreur: "P1001: Can't reach database server at `localhost:5432`"

**Cause** : PostgreSQL n'est pas accessible ou le port est différent.

**Solution** :
1. Vérifier que PostgreSQL est démarré : `docker ps | grep postgres`
2. Vérifier le port : `docker-compose ps`
3. Si le port est différent, mettre à jour `DATABASE_URL` dans `.env`

### Erreur: "P1000: Authentication failed"

**Cause** : Mauvais identifiants dans `DATABASE_URL`.

**Solution** :
1. Vérifier les identifiants dans `docker-compose.yml`
2. Mettre à jour `DATABASE_URL` dans `.env` avec les bons identifiants

### Erreur: "P1003: Database `archimodeler` does not exist"

**Cause** : La base de données n'a pas été créée.

**Solution** :
```bash
# Créer la base de données
docker exec -it <postgres-container-id> psql -U user -c "CREATE DATABASE archimodeler;"

# Ou laisser Prisma la créer automatiquement
npx prisma db push
```

### Erreur Neo4j: "Failed to connect to Neo4j"

**Cause** : Neo4j n'est pas démarré ou mauvais identifiants.

**Solution** :
1. Vérifier que Neo4j est démarré : `docker ps | grep neo4j`
2. Vérifier les logs : `docker-compose logs neo4j`
3. Vérifier les variables d'environnement : `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`

### Erreur: "Prisma Client has not been generated yet"

**Cause** : Le client Prisma n'a pas été généré.

**Solution** :
```bash
cd packages/database
npx prisma generate
```

## 📝 Checklist de Vérification

- [ ] Les conteneurs Docker sont démarrés (`docker ps`)
- [ ] Le fichier `.env` existe à la racine et dans `apps/server/`
- [ ] Les variables `DATABASE_URL`, `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` sont définies
- [ ] Le client Prisma est généré (`npx prisma generate`)
- [ ] Les migrations sont appliquées (`npx prisma migrate deploy`)
- [ ] Le serveur NestJS peut se connecter (vérifier les logs)

## 🔧 Commandes Utiles

```bash
# Redémarrer tous les services
docker-compose restart

# Voir les logs en temps réel
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Tester la connexion PostgreSQL
docker exec -it <postgres-container> psql -U user -d archimodeler

# Tester la connexion Neo4j
docker exec -it <neo4j-container> cypher-shell -u neo4j -p password
```

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Neo4j Driver](https://neo4j.com/docs/javascript-manual/current/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
