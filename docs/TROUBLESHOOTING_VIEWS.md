# Dépannage - Erreur "Failed to create view"

## Problème

Lors de la création d'une nouvelle vue en cliquant sur le bouton "+", l'erreur suivante apparaît :
```
Failed to create view
```

## Causes possibles

### 1. **Package ID invalide ou manquant**

**Symptôme** : L'URL ne contient pas de `packageId` ou le package n'existe pas en base de données.

**Solution** :
1. Vérifier l'URL : `http://localhost:3000/studio?packageId=XXX`
2. S'assurer que le package existe dans la base de données
3. Créer un package si nécessaire

**Créer un package** :
```bash
# Via l'API
curl -X POST http://localhost:3002/model/packages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Mon Package", "description": "Package de test"}'
```

---

### 2. **Backend non démarré**

**Symptôme** : Erreur de connexion réseau

**Solution** :
```bash
cd apps/server
npm run start:dev
```

**Vérifier** : Le serveur doit être accessible sur `http://localhost:3002`

---

### 3. **Token d'authentification manquant ou expiré**

**Symptôme** : Erreur 401 Unauthorized

**Solution** :
1. Se reconnecter à l'application
2. Vérifier que le token est présent dans localStorage :
   ```javascript
   // Dans la console du navigateur
   localStorage.getItem('accessToken')
   ```
3. Si absent, se reconnecter

---

### 4. **Format de données incorrect**

**Symptôme** : Erreur 400 Bad Request

**Solution** : Vérifier que les données envoyées correspondent au format Prisma attendu.

**Format attendu** :
```json
{
  "name": "Ma Vue",
  "modelPackage": { "connect": { "id": "package-uuid" } },
  "content": {}
}
```

**Avec dossier** :
```json
{
  "name": "Ma Vue",
  "modelPackage": { "connect": { "id": "package-uuid" } },
  "folder": { "connect": { "id": "folder-uuid" } },
  "content": {}
}
```

---

### 5. **Erreur de base de données**

**Symptôme** : Erreur 500 Internal Server Error

**Solution** :
1. Vérifier que PostgreSQL est démarré
2. Vérifier les logs du backend
3. Vérifier que les migrations Prisma sont à jour :
   ```bash
   cd apps/server
   npx prisma migrate dev
   ```

---

## Diagnostic

### Étape 1 : Vérifier les logs de la console

Ouvrir la console du navigateur (F12) et chercher :
```
Creating view with data: {...}
API Error: ...
```

### Étape 2 : Vérifier le code de statut HTTP

Le message d'erreur devrait maintenant inclure le code de statut :
```
Failed to create view (Status: 400)
Failed to create view (Status: 401)
Failed to create view (Status: 500)
```

### Étape 3 : Vérifier les logs du backend

Dans le terminal où tourne le serveur NestJS, chercher :
```
[Nest] ERROR ...
```

---

## Solutions rapides

### Solution 1 : Utiliser un package existant

1. Lister les packages disponibles :
   ```bash
   curl http://localhost:3002/model/packages \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. Utiliser un packageId existant dans l'URL :
   ```
   http://localhost:3000/studio?packageId=EXISTING_PACKAGE_ID
   ```

### Solution 2 : Créer un package par défaut

Créer un script pour initialiser un package par défaut :

```typescript
// scripts/create-default-package.ts
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
  const defaultPackage = await prisma.modelPackage.create({
    data: {
      name: 'Default Package',
      description: 'Package par défaut pour les tests',
    },
  });

  console.log('Package créé:', defaultPackage.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Exécuter :
```bash
cd apps/server
npx ts-node scripts/create-default-package.ts
```

### Solution 3 : Mode fallback (vue non-persistée)

Si la création échoue, l'application crée automatiquement une vue non-persistée qui fonctionne localement mais n'est pas sauvegardée.

**Indicateur** : `isPersisted: false` dans le store

---

## Vérifications

### ✅ Checklist de dépannage

- [ ] Le backend est démarré (`npm run start:dev`)
- [ ] PostgreSQL est accessible
- [ ] L'URL contient un `packageId` valide
- [ ] Le package existe en base de données
- [ ] Le token d'authentification est valide
- [ ] Les migrations Prisma sont à jour
- [ ] Pas d'erreur dans les logs du backend

---

## Exemples de messages d'erreur

### Erreur 400 - Bad Request
```
Failed to create view: Validation failed (Status: 400)
```
**Cause** : Format de données incorrect
**Solution** : Vérifier le format Prisma

### Erreur 401 - Unauthorized
```
Failed to create view: Unauthorized (Status: 401)
```
**Cause** : Token manquant ou expiré
**Solution** : Se reconnecter

### Erreur 404 - Not Found
```
Failed to create view: Package not found (Status: 404)
```
**Cause** : Le packageId n'existe pas
**Solution** : Utiliser un packageId valide ou créer le package

### Erreur 500 - Internal Server Error
```
Failed to create view: Internal server error (Status: 500)
```
**Cause** : Erreur de base de données ou du serveur
**Solution** : Vérifier les logs du backend

---

## Contournement temporaire

Si le problème persiste, vous pouvez utiliser des vues non-persistées :

1. Modifier `handleNewTab` pour ne pas utiliser la persistance :
   ```typescript
   const handleNewTab = () => {
     addTab({
       id: `tab-${Date.now()}`,
       viewId: `view-${Date.now()}`,
       viewName: `New View ${tabs.length + 1}`,
       packageId: 'temp',
       isPersisted: false,
     });
   };
   ```

2. Les vues fonctionneront mais ne seront pas sauvegardées

---

## Support

Si le problème persiste après avoir suivi ces étapes :

1. Copier les logs de la console
2. Copier les logs du backend
3. Noter le code de statut HTTP
4. Créer une issue avec ces informations
