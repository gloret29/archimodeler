# 🔧 Correction du problème "Failed to fetch" avec Reverse Proxy

## Problème identifié

Le frontend essaie d'appeler directement `http://192.168.1.108:3002/auth/login` au lieu d'utiliser le reverse proxy via `http://archi.gloret.fr/api/auth/login`.

**Erreur CORS** : "Access to fetch at 'http://192.168.1.108:3002/auth/login' from origin 'http://archi.gloret.fr' has been blocked by CORS policy: The request client is not a secure context and the resource is in more-private address space 'local'."

## Cause

Les variables d'environnement `NEXT_PUBLIC_*` sont intégrées au **build time** dans Next.js. Si `NEXT_PUBLIC_API_URL` est défini avec une IP locale (`http://192.168.1.108:3002`) lors du build, cette valeur sera utilisée même si le code a été modifié.

## Solution

### Option 1 : Modifier les variables d'environnement et recompiler (Recommandé)

1. **Modifiez le fichier `.env` de production** :

   Dans `apps/web/.env` (ou votre fichier d'environnement de production), **supprimez ou modifiez** `NEXT_PUBLIC_API_URL` :

   ```env
   # Option A : Laisser vide (recommandé)
   # Le frontend utilisera automatiquement window.location.origin
   # NEXT_PUBLIC_API_URL=""
   
   # Option B : Utiliser le même domaine que le frontend
   NEXT_PUBLIC_API_URL="http://archi.gloret.fr"
   # ou en HTTPS:
   # NEXT_PUBLIC_API_URL="https://archi.gloret.fr"
   
   NODE_ENV=production
   ```

   **⚠️ IMPORTANT** : Ne pas utiliser d'IP locale (192.168.x.x, 10.x.x.x, etc.) en production avec reverse proxy.

2. **Recompilez le frontend** :

   ```bash
   cd /home/loret/dev/archimodeler
   npm run build --workspace=@repo/web
   ```

3. **Redémarrez le serveur de production** :

   ```bash
   # Si vous utilisez PM2
   pm2 restart archimodeler-web
   
   # Ou si vous utilisez systemd
   sudo systemctl restart archimodeler-web
   
   # Ou si vous utilisez npm directement
   npm run start --workspace=@repo/web
   ```

### Option 2 : Utiliser le script de configuration

Un script est disponible pour faciliter la configuration :

```bash
./scripts/fix-reverse-proxy-env.sh
```

Ce script vous demandera :
- Le domaine de votre reverse proxy (ex: `archi.gloret.fr`)
- Si vous utilisez HTTPS

Il créera automatiquement le fichier `apps/web/.env.production` avec la bonne configuration.

## Vérification

1. **Ouvrez la console du navigateur** (F12) sur `http://archi.gloret.fr`

2. **Regardez les logs `[API Config]`** :
   - Vous devriez voir : `[API Config] Determining baseUrl: { apiUrl: "...", isLocalhost: false, currentOrigin: "http://archi.gloret.fr", ... }`
   - Vous devriez voir : `[API Config] Fetching: http://archi.gloret.fr/api/auth/login`

3. **Vérifiez que les requêtes utilisent le bon domaine** :
   - ✅ Correct : `http://archi.gloret.fr/api/auth/login`
   - ❌ Incorrect : `http://192.168.1.108:3002/auth/login`

## Si le problème persiste

1. **Vérifiez que le code a bien été recompilé** :
   - Les variables `NEXT_PUBLIC_*` sont intégrées au build time
   - Un simple redémarrage ne suffit pas, il faut recompiler

2. **Vérifiez la configuration du reverse proxy** :
   - Assurez-vous que la location `/api` est bien configurée
   - Vérifiez que le rewrite enlève bien le préfixe `/api`
   - Voir [NGINX_PROXY_MANAGER_CONFIG.md](./NGINX_PROXY_MANAGER_CONFIG.md)

3. **Vérifiez les logs du backend** :
   ```bash
   # Vérifiez que le backend reçoit bien les requêtes
   tail -f /var/log/archimodeler/server.log
   ```

4. **Testez directement le backend** :
   ```bash
   curl http://localhost:3002/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
   ```

5. **Testez via le reverse proxy** :
   ```bash
   curl http://archi.gloret.fr/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
   ```

## Configuration recommandée pour la production

### Fichier `apps/web/.env.production`

```env
# Ne PAS définir NEXT_PUBLIC_API_URL avec une IP locale
# Laisser vide pour utiliser automatiquement window.location.origin
# ou utiliser le même domaine que le frontend

# Option 1 : Laisser vide (recommandé)
# NEXT_PUBLIC_API_URL=""
# NEXT_PUBLIC_WS_URL=""

# Option 2 : Utiliser le même domaine
NEXT_PUBLIC_API_URL="http://archi.gloret.fr"
NEXT_PUBLIC_WS_URL="http://archi.gloret.fr"

NODE_ENV=production
```

### Fichier `apps/server/.env`

```env
# Le backend peut toujours utiliser localhost
API_PORT=3002
API_URL="http://localhost:3002"
WS_URL="http://localhost:3002"

# Les variables NEXT_PUBLIC_* ne sont pas nécessaires ici
# Elles sont uniquement pour le frontend
```

## Notes importantes

- Les variables `NEXT_PUBLIC_*` sont **intégrées au build time** dans Next.js
- Un simple redémarrage ne suffit pas, il faut **recompiler** après avoir modifié ces variables
- En production avec reverse proxy, **ne jamais utiliser d'IP locale** pour `NEXT_PUBLIC_API_URL`
- Le frontend détecte automatiquement le reverse proxy si `NEXT_PUBLIC_API_URL` n'est pas défini ou pointe vers une IP locale



