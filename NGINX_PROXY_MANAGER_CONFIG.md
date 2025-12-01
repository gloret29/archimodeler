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

1. Assurez-vous que **Websockets Support** est activé pour la location `/api`
2. Vérifiez que les headers `Upgrade` et `Connection` sont configurés
3. Testez la connexion WebSocket : `wscat -c ws://votre-domaine.com/api/collaboration`

## Configuration SSL (Optionnel)

Pour activer HTTPS :

1. Dans le Proxy Host, onglet **"SSL"**
2. Sélectionnez **"Request a new SSL Certificate"**
3. Cochez **"Force SSL"** et **"HTTP/2 Support"**
4. Cliquez sur **"Save"**


