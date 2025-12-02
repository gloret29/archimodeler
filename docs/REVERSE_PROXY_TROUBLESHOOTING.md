# Guide de Débogage - Reverse Proxy et Authentification

## Problème : "Failed to fetch" lors de l'authentification

Si vous obtenez une erreur "Failed to fetch" lors de la tentative de connexion avec un reverse proxy, suivez ce guide de débogage étape par étape.

## 🔍 Étape 1 : Vérifier les Services

### 1.1 Vérifier que le backend est démarré

```bash
# Vérifier que le backend répond directement
curl http://localhost:3002/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```

**Résultat attendu** : Une réponse HTTP (même 401 est OK, cela signifie que le serveur répond)

### 1.2 Vérifier que le frontend est démarré

```bash
# Vérifier que le frontend répond
curl http://localhost:3000
```

**Résultat attendu** : Le HTML de la page de login

## 🔍 Étape 2 : Vérifier la Configuration du Reverse Proxy

### 2.1 Configuration Nginx Proxy Manager

Assurez-vous que votre configuration correspond à celle décrite dans [NGINX_PROXY_MANAGER_CONFIG.md](../NGINX_PROXY_MANAGER_CONFIG.md).

**Points critiques** :

1. **Proxy Host Principal** :
   - Domain Names : Votre domaine (ex: `archimodeler.example.com`)
   - Forward Port : `3000` (frontend Next.js)
   - ✅ Websockets Support : Activé

2. **Custom Location `/api`** :
   - Location : `/api`
   - Forward Port : `3002` (backend NestJS)
   - ✅ Websockets Support : Activé
   - **Custom Nginx Configuration** :
   ```nginx
   # Enlever le préfixe /api avant de transmettre au backend
   rewrite ^/api/(.*) /$1 break;
   
   # Headers pour le reverse proxy
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header X-Forwarded-Host $host;
   
   # Pour WebSocket
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```

### 2.2 Alternative : Configuration sans rewrite

Si la configuration avec `rewrite` ne fonctionne pas, essayez cette alternative :

```nginx
# Utiliser proxy_pass avec trailing slash pour enlever /api
proxy_pass http://localhost:3002/;

# Headers pour le reverse proxy
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;

# Pour WebSocket
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## 🔍 Étape 3 : Tester via le Reverse Proxy

### 3.1 Tester l'endpoint d'authentification

Remplacez `votre-domaine.com` par votre domaine réel :

```bash
# Tester l'endpoint d'authentification via le reverse proxy
curl https://votre-domaine.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@archimodeler.com","password":"admin123"}'
```

**Résultat attendu** :
- Si le reverse proxy est bien configuré : Une réponse JSON avec `access_token` ou une erreur 401
- Si le reverse proxy n'est pas configuré : Erreur 404 ou "Failed to fetch"

### 3.2 Vérifier les logs Nginx

Dans Nginx Proxy Manager :
1. Allez dans **Logs** → **Access Logs**
2. Filtrez par votre domaine
3. Vérifiez les requêtes vers `/api/auth/login`

**Ce qu'il faut chercher** :
- Code de statut HTTP (200, 401, 404, 502, etc.)
- Les erreurs 502 indiquent que Nginx ne peut pas joindre le backend
- Les erreurs 404 indiquent que la route n'est pas correctement configurée

## 🔍 Étape 4 : Vérifier les Variables d'Environnement

### 4.1 Frontend (Next.js)

Vérifiez le fichier `apps/web/.env.local` ou `apps/web/.env` :

```bash
# Option 1 : Laisser vide pour détection automatique (recommandé avec reverse proxy)
# NEXT_PUBLIC_API_URL=

# Option 2 : Définir explicitement l'URL du reverse proxy
NEXT_PUBLIC_API_URL=https://votre-domaine.com

# Pour SSR (si vous utilisez le SSR)
SSR_API_URL=https://votre-domaine.com
```

**⚠️ IMPORTANT - Problème de Private Network Access (PNA)** :

Si vous avez défini `NEXT_PUBLIC_API_URL` pour pointer vers une IP locale (ex: `http://192.168.1.108:3002`), le navigateur bloquera les requêtes avec une erreur CORS/PNA.

**Solution automatique** : Le code détecte maintenant automatiquement si `NEXT_PUBLIC_API_URL` pointe vers une IP locale et utilise le reverse proxy à la place. Vous verrez un avertissement dans la console :

```
[API Config] NEXT_PUBLIC_API_URL pointe vers une IP locale (http://192.168.1.108:3002). 
Utilisation du reverse proxy (http://archi.gloret.fr) pour éviter les problèmes CORS/PNA.
```

**Recommandation** : Ne définissez pas `NEXT_PUBLIC_API_URL` si vous utilisez un reverse proxy, ou définissez-le pour pointer vers le reverse proxy (pas directement vers le backend).

**⚠️ Important** : Si `NEXT_PUBLIC_API_URL` est défini et pointe vers votre domaine, le code ajoutera automatiquement `/api` devant les endpoints.

### 4.2 Backend (NestJS)

Vérifiez le fichier `apps/server/.env` :

```bash
# Port du backend (doit correspondre à la Forward Port dans Nginx)
PORT=3002

# CORS (optionnel, le backend accepte toutes les origines par défaut)
# CORS_ORIGIN=https://votre-domaine.com
```

## 🔍 Étape 5 : Utiliser la Console du Navigateur

### 5.1 Ouvrir la Console

1. Ouvrez votre navigateur
2. Appuyez sur `F12` ou `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
3. Allez dans l'onglet **Console**

### 5.2 Tenter une connexion

1. Essayez de vous connecter
2. Regardez les messages dans la console

**Messages de débogage attendus** (en mode développement) :
```
[Login Debug] Base URL: https://votre-domaine.com
[Login Debug] Endpoint: /auth/login
[Login Debug] Full URL: https://votre-domaine.com/api/auth/login
[API Config] Fetching: https://votre-domaine.com/api/auth/login
```

### 5.3 Vérifier l'onglet Network

1. Allez dans l'onglet **Network** (Réseau)
2. Tentez une connexion
3. Cherchez la requête vers `/api/auth/login`

**Vérifiez** :
- **Status** : 200 (succès), 401 (mauvais identifiants), 404 (route introuvable), 502 (backend inaccessible)
- **Request URL** : Doit être `https://votre-domaine.com/api/auth/login`
- **Response** : Si 502, le backend n'est pas accessible via le reverse proxy

## 🔍 Étape 6 : Problèmes Courants et Solutions

### Problème 1 : Erreur 502 Bad Gateway

**Cause** : Nginx ne peut pas joindre le backend

**Solutions** :
1. Vérifiez que le backend est démarré : `curl http://localhost:3002/auth/login`
2. Vérifiez que la Forward Port dans Nginx est `3002`
3. Vérifiez que le Forward Hostname/IP est correct (`localhost` ou `127.0.0.1`)
4. Vérifiez les logs Nginx pour plus de détails

### Problème 2 : Erreur 404 Not Found

**Cause** : La route n'est pas correctement configurée

**Solutions** :
1. Vérifiez que la Custom Location `/api` est bien configurée
2. Vérifiez que le `rewrite` ou `proxy_pass` est correct
3. Testez directement le backend : `curl http://localhost:3002/auth/login`

### Problème 3 : Erreur CORS

**Cause** : Le backend rejette la requête à cause de CORS

**Solutions** :
1. Vérifiez que CORS est bien configuré dans `apps/server/src/main.ts`
2. Le backend accepte toutes les origines par défaut (`origin: true`)
3. Si vous avez modifié CORS, assurez-vous que votre domaine est autorisé

### Problème 4 : "Failed to fetch" avec erreur CORS/PNA (Private Network Access)

**Erreur typique** : 
```
Access to fetch has been blocked by CORS policy: The request client is not a secure context 
and the resource is in more-private address space 'local'.
```

**Cause** : Le frontend essaie d'appeler directement une IP locale (ex: `http://192.168.1.108:3002`) au lieu de passer par le reverse proxy. Les navigateurs modernes bloquent cela pour des raisons de sécurité (Private Network Access).

**Solutions** :
1. **Vérifiez `NEXT_PUBLIC_API_URL`** : Si elle est définie et pointe vers une IP locale, supprimez-la ou changez-la pour pointer vers le reverse proxy
2. **Le code détecte maintenant automatiquement** ce problème et utilise le reverse proxy à la place
3. **Vérifiez la console du navigateur** : Vous devriez voir un avertissement indiquant que l'IP locale est détectée
4. **Rechargez la page** après avoir modifié les variables d'environnement

### Problème 5 : "Failed to fetch" (pas de réponse HTTP)

**Cause** : La requête n'atteint même pas le serveur

**Solutions** :
1. Vérifiez que le reverse proxy est démarré
2. Vérifiez que le domaine pointe vers le reverse proxy (DNS)
3. Vérifiez les certificats SSL si vous utilisez HTTPS
4. Vérifiez le firewall (ports 80/443 doivent être ouverts)

### Problème 6 : Double préfixe `/api/api/`

**Cause** : Le code ajoute `/api` alors que l'endpoint commence déjà par `/api`

**Solution** : Le code devrait normalement gérer cela automatiquement. Vérifiez les logs de débogage dans la console.

### Problème 7 : WebSocket ne se connecte pas / Erreurs de timeout

**Erreurs typiques** :
- `WebSocket connection to '...' failed: WebSocket is closed before the connection is established`
- `Notification WebSocket connection error: Error: timeout`
- `Collaboration server unavailable (this is optional)`

**Cause** : Les WebSockets nécessitent une configuration spéciale du reverse proxy pour gérer l'upgrade HTTP vers WebSocket.

**Solutions** :

1. **Vérifiez que Websockets Support est activé** :
   - Dans Nginx Proxy Manager, pour la Custom Location `/api`
   - ✅ **Websockets Support** doit être **Activé**

2. **Vérifiez la configuration Nginx pour les WebSockets** :
   Dans la **Custom Nginx Configuration** de la location `/api`, assurez-vous d'avoir :
   ```nginx
   # Pour WebSocket
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```

3. **Vérifiez les timeouts** :
   Les WebSockets peuvent nécessiter des timeouts plus longs :
   ```nginx
   proxy_connect_timeout 60s;
   proxy_send_timeout 60s;
   proxy_read_timeout 60s;
   ```

4. **Testez la connexion WebSocket** :
   ```bash
   # Installer wscat si nécessaire
   npm install -g wscat
   
   # Tester la connexion WebSocket
   wscat -c ws://votre-domaine.com/api/collaboration/socket.io/?EIO=4&transport=websocket
   ```
   
   **Note** : Socket.io utilise un handshake HTTP initial avant d'upgrader vers WebSocket. Le path complet est `/collaboration/socket.io/` avec le namespace.

5. **Vérifiez les logs de la console du navigateur** :
   Ouvrez la console (F12) et cherchez les messages `[WebSocket Config]` qui indiquent :
   - L'URL WebSocket utilisée
   - Si le reverse proxy est détecté
   - Les options Socket.io configurées

6. **Vérifiez que Socket.io peut faire le handshake initial** :
   Socket.io fait d'abord un handshake HTTP (polling) avant d'upgrader vers WebSocket. Testez :
   ```bash
   curl "http://votre-domaine.com/api/collaboration/socket.io/?EIO=4&transport=polling"
   ```
   
   **Résultat attendu** : Une réponse JSON avec des informations sur la session Socket.io

7. **Configuration Socket.io côté client** :
   Le code configure automatiquement Socket.io pour :
   - Utiliser WebSocket en priorité, puis polling en fallback
   - Permettre l'upgrade de polling vers WebSocket
   - Augmenter les timeouts pour le reverse proxy
   - Utiliser le bon path avec le namespace `/collaboration`

8. **Si le problème persiste** :
   - Vérifiez les logs Nginx pour voir si les requêtes WebSocket arrivent
   - Vérifiez les logs du backend pour voir si les connexions WebSocket sont acceptées
   - Assurez-vous que le firewall n'bloque pas les connexions WebSocket

## 🔍 Étape 7 : Test Complet

### Test 1 : Backend direct

```bash
curl http://localhost:3002/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@archimodeler.com","password":"admin123"}'
```

**Résultat attendu** : `{"access_token":"..."}`

### Test 2 : Backend via reverse proxy

```bash
curl https://votre-domaine.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@archimodeler.com","password":"admin123"}'
```

**Résultat attendu** : `{"access_token":"..."}` (même résultat que Test 1)

### Test 3 : Frontend via reverse proxy

1. Ouvrez `https://votre-domaine.com` dans votre navigateur
2. Tentez de vous connecter avec `admin@archimodeler.com` / `admin123`
3. Vérifiez la console du navigateur pour les erreurs

## 📝 Checklist de Vérification

- [ ] Backend démarré et accessible sur `http://localhost:3002`
- [ ] Frontend démarré et accessible sur `http://localhost:3000`
- [ ] Reverse proxy configuré avec Proxy Host principal (port 3000)
- [ ] Custom Location `/api` configurée (port 3002)
- [ ] Websockets Support activé pour les deux
- [ ] Headers X-Forwarded-* configurés
- [ ] `rewrite` ou `proxy_pass` correctement configuré
- [ ] Variables d'environnement correctes
- [ ] Test curl du backend direct fonctionne
- [ ] Test curl via reverse proxy fonctionne
- [ ] Console du navigateur ne montre pas d'erreurs CORS
- [ ] Logs Nginx ne montrent pas d'erreurs 502

## 🆘 Besoin d'Aide ?

Si le problème persiste après avoir suivi ce guide :

1. **Collectez les informations suivantes** :
   - Messages d'erreur exacts de la console du navigateur
   - Logs Nginx (Access Logs et Error Logs)
   - Résultat des tests curl
   - Configuration actuelle du reverse proxy (sans les mots de passe)

2. **Vérifiez les issues GitHub** pour voir si d'autres ont rencontré le même problème

3. **Créez une nouvelle issue** avec toutes ces informations

