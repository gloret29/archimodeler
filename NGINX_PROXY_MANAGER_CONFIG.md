# Configuration Nginx Proxy Manager pour ArchiModeler

## Configuration du Proxy Host

### Étape 1 : Créer le Proxy Host Principal

1. Dans Nginx Proxy Manager, cliquez sur **"Proxy Hosts"** → **"Add Proxy Host"**

2. Onglet **"Details"** :
   - **Domain Names** : `votre-domaine.com` (ou votre IP)
   - **Scheme** : `http`
   - **Forward Hostname/IP** : `localhost` (ou `127.0.0.1`)
   - **Forward Port** : `3000`
   - ✅ **Cache Assets** : Activé (optionnel)
   - ✅ **Block Common Exploits** : Activé
   - ✅ **Websockets Support** : **Activé** (important pour la collaboration)

3. Onglet **"Advanced"** :
   Ajoutez cette configuration personnalisée :

```nginx
# Headers pour le reverse proxy
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;

# Timeouts pour les longues requêtes
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

4. Cliquez sur **"Save"**

### Étape 2 : Ajouter une Custom Location pour l'API

1. Dans le Proxy Host créé, cliquez sur **"Edit"**

2. Onglet **"Advanced"** → Section **"Custom locations"**

3. Cliquez sur **"Add location"** :

   - **Location** : `/api`
   - **Scheme** : `http`
   - **Forward Hostname/IP** : `localhost` (ou `127.0.0.1`)
   - **Forward Port** : `3002`
   - ✅ **Websockets Support** : **Activé** (important pour Socket.io)

4. Dans **"Custom Nginx Configuration"** pour cette location, ajoutez :

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

5. Cliquez sur **"Save"**

### Étape 3 : Vérifier la Configuration pour Socket.io

**Comment Socket.io fonctionne avec le namespace `/collaboration`** :

1. Le client appelle : `io('http://domain.com/api/collaboration')`
2. Socket.io détecte le namespace `/collaboration` depuis l'URL
3. Socket.io utilise le path par défaut `/socket.io/` pour le handshake
4. L'URL complète devient : `http://domain.com/api/collaboration/socket.io/`
5. Le reverse proxy reçoit : `/api/collaboration/socket.io/`
6. Le rewrite dans `/api` transforme : `/api/collaboration/socket.io/` → `/collaboration/socket.io/`
7. Le backend reçoit : `/collaboration/socket.io/` (correct pour le namespace)

**Conclusion** : La location `/api` avec le rewrite devrait suffire pour gérer les WebSockets Socket.io. 

**Si les WebSockets ne fonctionnent toujours pas**, vous pouvez ajouter une location plus spécifique pour les requêtes Socket.io qui passent par `/api`. Cependant, cette location ne sera utilisée que si Socket.io essaie de se connecter directement à `/api/socket.io/` (sans namespace), ce qui n'est pas notre cas.

**La configuration actuelle avec `/api` devrait fonctionner**. Si vous rencontrez des problèmes, vérifiez :
1. Que **Websockets Support** est bien activé pour `/api`
2. Que les headers `Upgrade` et `Connection` sont configurés
3. Que `proxy_http_version 1.1;` est présent
4. Les logs Nginx pour voir comment les requêtes sont traitées

## Configuration Alternative (Sans rewrite)

Si la configuration avec `rewrite` ne fonctionne pas, utilisez cette alternative :

Dans **"Custom Nginx Configuration"** pour la location `/api` :

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

## Vérification

Une fois configuré, testez :

1. **Frontend** : `http://votre-domaine.com/` → Devrait afficher la page de login
2. **API** : `http://votre-domaine.com/api/auth/login` → Devrait retourner une réponse (401 si pas d'identifiants, 200 si OK)

## Dépannage

### Erreur "Failed to fetch"

1. Vérifiez que le backend est démarré : `curl http://localhost:3002/auth/login`
2. Vérifiez que la custom location `/api` est bien configurée
3. Vérifiez les logs Nginx : Dans Nginx Proxy Manager → Logs

### WebSocket ne fonctionne pas

**Points critiques à vérifier** :

1. **Websockets Support activé** :
   - ✅ Pour la location `/api` (obligatoire)
   - ✅ Pour la location `/api/socket.io` si vous l'avez ajoutée (recommandé)

2. **Headers WebSocket configurés** :
   - `proxy_http_version 1.1;` (obligatoire)
   - `proxy_set_header Upgrade $http_upgrade;`
   - `proxy_set_header Connection "upgrade";`

3. **Ordre des locations** :
   - Les locations plus spécifiques (comme `/api/socket.io`) sont traitées avant les moins spécifiques (comme `/api`)
   - Assurez-vous que le rewrite dans `/api` gère correctement les chemins Socket.io

4. **Test de connexion** :
   ```bash
   # Installer wscat si nécessaire
   npm install -g wscat
   
   # Tester le handshake Socket.io (polling) - avec namespace /collaboration
   curl "http://votre-domaine.com/api/collaboration/socket.io/?EIO=4&transport=polling"
   
   # Devrait retourner une réponse JSON avec des informations Socket.io
   # Si ça fonctionne, le reverse proxy transmet correctement les requêtes Socket.io
   
   # Tester la connexion WebSocket (nécessite un sid du handshake précédent)
   # wscat -c "ws://votre-domaine.com/api/collaboration/socket.io/?EIO=4&transport=websocket&sid=..."
   ```

5. **Vérification dans le navigateur** :
   - Ouvrez la console (F12)
   - Cherchez les messages `[WebSocket Config]` qui indiquent l'URL utilisée
   - Vérifiez les erreurs de connexion WebSocket dans l'onglet Network

6. **Logs Nginx** :
   - Vérifiez les Access Logs pour voir les requêtes vers `/api/collaboration/socket.io/`
   - Vérifiez les Error Logs pour les erreurs de proxy

7. **Consultez le guide de dépannage** :
   - [REVERSE_PROXY_TROUBLESHOOTING.md](./docs/REVERSE_PROXY_TROUBLESHOOTING.md) pour plus de détails sur le dépannage WebSocket

## Configuration SSL (Optionnel)

Pour activer HTTPS :

1. Dans le Proxy Host, onglet **"SSL"**
2. Sélectionnez **"Request a new SSL Certificate"**
3. Cochez **"Force SSL"** et **"HTTP/2 Support"**
4. Cliquez sur **"Save"**



