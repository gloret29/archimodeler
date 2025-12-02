# Configuration pour Reverse Proxy

## Variables d'environnement

### En développement local

Dans `apps/web/.env` :

```env
NEXT_PUBLIC_API_URL="http://localhost:3002"
NEXT_PUBLIC_WS_URL="http://localhost:3002"
NODE_ENV=development
```

### En production avec reverse proxy

**IMPORTANT** : Pour utiliser le reverse proxy, vous avez **deux options** :

#### Option 1 : Ne pas définir NEXT_PUBLIC_API_URL (Recommandé)

Dans `apps/web/.env` (ou variables d'environnement de production) :

```env
# Ne PAS définir NEXT_PUBLIC_API_URL
# Laisser vide pour utiliser automatiquement window.location.origin
NODE_ENV=production
```

Le frontend utilisera automatiquement `window.location.origin` et ajoutera le préfixe `/api` pour les requêtes API.

#### Option 2 : Définir NEXT_PUBLIC_API_URL avec le même domaine que le frontend

Dans `apps/web/.env` (ou variables d'environnement de production) :

```env
# Utiliser le même domaine que le frontend (via reverse proxy)
NEXT_PUBLIC_API_URL="https://votre-domaine.com"
# ou
NEXT_PUBLIC_API_URL="http://votre-domaine.com"
NODE_ENV=production
```

**⚠️ NE PAS utiliser une IP locale** (192.168.x.x, 10.x.x.x, etc.) en production avec reverse proxy, car cela causera des problèmes de Private Network Access (PNA) du navigateur.

## Comment ça fonctionne

1. **En développement local** (`localhost:3000`) :
   - Le frontend utilise directement `NEXT_PUBLIC_API_URL` (ex: `http://localhost:3002`)
   - Les requêtes vont directement vers le backend sans préfixe `/api`
   - Exemple : `http://localhost:3002/auth/login`

2. **En production avec reverse proxy** :
   - Si `NEXT_PUBLIC_API_URL` n'est pas défini ou pointe vers une IP locale, le frontend utilise `window.location.origin`
   - Les requêtes utilisent le préfixe `/api` qui est routé par le reverse proxy
   - Exemple : `https://votre-domaine.com/api/auth/login` → reverse proxy → `http://localhost:3002/auth/login`

## Vérification

Ouvrez la console du navigateur (F12) et regardez les logs `[API Config]` pour voir :
- Quelle URL de base est utilisée
- Si le préfixe `/api` est ajouté
- Les URLs complètes des requêtes

## Dépannage

### "Failed to fetch" derrière un reverse proxy

1. **Vérifiez les logs de la console** :
   - Ouvrez la console du navigateur (F12)
   - Regardez les logs `[API Config]`
   - Vérifiez quelle URL est utilisée

2. **Vérifiez la configuration du reverse proxy** :
   - Assurez-vous que la location `/api` est bien configurée
   - Vérifiez que le rewrite enlève bien le préfixe `/api`
   - Vérifiez les logs Nginx

3. **Vérifiez les variables d'environnement** :
   - En production, ne définissez PAS `NEXT_PUBLIC_API_URL` avec une IP locale
   - Laissez-le vide ou utilisez le même domaine que le frontend

4. **Testez directement le backend** :
   ```bash
   curl http://localhost:3002/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
   ```

5. **Testez via le reverse proxy** :
   ```bash
   curl https://votre-domaine.com/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
   ```

## Exemple de configuration Nginx Proxy Manager

Voir [NGINX_PROXY_MANAGER_CONFIG.md](./NGINX_PROXY_MANAGER_CONFIG.md) pour la configuration complète.



