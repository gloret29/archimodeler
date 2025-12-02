# 🔧 Correction des erreurs de timeout WebSocket

## Problème

Erreur de timeout lors de la connexion WebSocket Socket.io derrière un reverse proxy :
```
timeout
```

## Causes possibles

1. **Reverse proxy ne transmet pas correctement les requêtes Socket.io**
2. **Timeout trop court** pour le handshake initial
3. **WebSocket direct ne fonctionne pas** avec le reverse proxy (nécessite handshake HTTP initial)
4. **Configuration Nginx incomplète** pour les WebSockets

## Solution appliquée

### 1. Configuration Socket.io modifiée

La configuration Socket.io a été modifiée pour :
- **Commencer par polling (HTTP)** au lieu de WebSocket direct
- **Upgrader automatiquement** vers WebSocket une fois la connexion établie
- **Timeout augmenté** à 30 secondes
- **Plus de tentatives de reconnexion** (15 au lieu de 10)

### 2. Vérifications à faire

#### A. Vérifier la configuration Nginx

Dans Nginx Proxy Manager, pour la location `/api`, assurez-vous d'avoir :

```nginx
# Enlever le préfixe /api avant de transmettre au backend
rewrite ^/api/(.*) /$1 break;

# Headers pour le reverse proxy
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;

# Configuration WebSocket OBLIGATOIRE
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# Timeouts pour les connexions WebSocket longues
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

#### B. Vérifier que Websockets Support est activé

Dans Nginx Proxy Manager :
1. Allez dans votre Proxy Host
2. Section **"Custom locations"** → Location `/api`
3. ✅ **Websockets Support** doit être **Activé**

#### C. Tester la connexion Socket.io

**Test 1 : Handshake polling (HTTP)**
```bash
curl "http://votre-domaine.com/api/collaboration/socket.io/?EIO=4&transport=polling"
```

**Résultat attendu** : Une réponse JSON avec des informations Socket.io (sid, upgrades, etc.)

**Si ça échoue** :
- Vérifiez que le backend est démarré : `curl http://localhost:3002/collaboration/socket.io/?EIO=4&transport=polling`
- Vérifiez les logs Nginx pour voir si la requête arrive au backend

**Test 2 : Vérifier les logs du navigateur**

Ouvrez la console du navigateur (F12) et cherchez :
- `[WebSocket Config] Socket.io configuration:` - Vérifiez que `transports: ['polling', 'websocket']`
- `[NotificationCenter] WebSocket connection error:` - Regardez les détails de l'erreur
- `[useCollaboration] WebSocket connection error:` - Regardez les détails de l'erreur

#### D. Vérifier les logs Nginx

Dans Nginx Proxy Manager → Logs → Access Logs :
- Cherchez les requêtes vers `/api/collaboration/socket.io/`
- Vérifiez les codes de statut (200 = OK, 404 = route introuvable, 502 = backend inaccessible)

## Stratégie de connexion

Avec la nouvelle configuration, Socket.io :

1. **Commence par polling (HTTP)** : `/api/collaboration/socket.io/?EIO=4&transport=polling`
   - Plus fiable avec les reverse proxies
   - Établit d'abord une connexion HTTP normale
   - Obtient un `sid` (session ID) du serveur

2. **Upgrade vers WebSocket** : Une fois la connexion polling établie, Socket.io upgrade automatiquement vers WebSocket
   - Utilise le `sid` obtenu lors du handshake polling
   - Connexion WebSocket : `/api/collaboration/socket.io/?EIO=4&transport=websocket&sid=...`

3. **Mémorise l'upgrade** : Pour les reconnexions futures, Socket.io se souvient que WebSocket fonctionne et peut l'utiliser directement

## Test de diagnostic

Un script de test est disponible pour diagnostiquer les problèmes WebSocket :

```bash
# Tester directement le backend (sans reverse proxy)
./scripts/test-websocket.sh http://localhost:3002

# Tester via le reverse proxy
./scripts/test-websocket.sh http://votre-domaine.com/api
```

Ce script teste :
1. Le handshake polling (HTTP) - doit retourner 200 avec un `sid`
2. La connexion WebSocket (si wscat est installé)

## Si le problème persiste

### Option 1 : Vérifier que le backend accepte les connexions Socket.io

```bash
# Tester directement le backend
curl "http://localhost:3002/collaboration/socket.io/?EIO=4&transport=polling"
```

**Résultat attendu** : Réponse JSON avec `sid` et `upgrades`

### Option 2 : Vérifier les logs du backend

Dans les logs du backend NestJS, vous devriez voir :
```
[CollaborationGateway] Client connected to collaboration namespace: <socket-id>
```

Si vous ne voyez pas ces logs, le backend ne reçoit pas les connexions.

### Option 3 : Désactiver temporairement le reverse proxy

Pour tester si le problème vient du reverse proxy :
1. Modifiez temporairement `NEXT_PUBLIC_API_URL` pour pointer directement vers le backend
2. Testez la connexion WebSocket
3. Si ça fonctionne, le problème vient de la configuration du reverse proxy

### Option 4 : Vérifier le firewall

Assurez-vous que :
- Le port 3002 (backend) est accessible depuis le reverse proxy
- Le port 80/443 (reverse proxy) est accessible depuis l'extérieur
- Aucun firewall ne bloque les connexions WebSocket

## Configuration recommandée

### Frontend (apps/web/.env)

```env
# Ne PAS définir NEXT_PUBLIC_API_URL avec une IP locale
# Laisser vide pour utiliser automatiquement window.location.origin
# ou utiliser le même domaine que le frontend
NEXT_PUBLIC_API_URL="http://votre-domaine.com"
# ou laisser vide
NODE_ENV=production
```

### Backend (apps/server/.env)

```env
PORT=3002
# Le backend peut toujours utiliser localhost
```

### Nginx Proxy Manager

1. **Proxy Host Principal** :
   - Domain Names : `votre-domaine.com`
   - Forward Port : `3000` (frontend)
   - ✅ Websockets Support : Activé

2. **Custom Location `/api`** :
   - Forward Port : `3002` (backend)
   - ✅ Websockets Support : Activé
   - Custom Nginx Configuration : Voir section A ci-dessus

## Logs de débogage

Avec la nouvelle configuration, vous verrez dans la console du navigateur :

```
[WebSocket Config] Socket.io configuration: {
  wsUrl: "http://votre-domaine.com/api/collaboration",
  isUsingReverseProxy: true,
  transports: ["polling", "websocket"],
  timeout: 30000,
  ...
}
```

Si vous voyez une erreur de timeout, vérifiez :
1. Les logs Nginx pour voir si la requête arrive au backend
2. Les logs du backend pour voir s'il reçoit la requête
3. La configuration Nginx pour les WebSockets

## Résumé

La nouvelle configuration :
- ✅ Commence par polling (HTTP) pour éviter les problèmes de timeout
- ✅ Upgrade automatiquement vers WebSocket une fois connecté
- ✅ Timeout augmenté à 30 secondes
- ✅ Logs détaillés pour le débogage
- ✅ Plus de tentatives de reconnexion

Si le problème persiste après ces modifications, vérifiez :
1. La configuration Nginx (Websockets Support activé, headers corrects)
2. Les logs Nginx et backend
3. La connectivité réseau entre le reverse proxy et le backend

