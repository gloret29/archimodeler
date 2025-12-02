# Configuration Nginx pour WebSocket Socket.io

## Problème actuel

Le serveur retourne "server error" lors de la connexion WebSocket via le reverse proxy. La configuration actuelle a les headers WebSocket, mais il manque quelques éléments critiques.

## Configuration corrigée pour la location `/api`

Remplacez la section `location /api` dans votre configuration Nginx par celle-ci :

```nginx
location /api {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Scheme $scheme;
    proxy_set_header X-Forwarded-Proto  $scheme;
    proxy_set_header X-Forwarded-For    $remote_addr;
    proxy_set_header X-Real-IP          $remote_addr;
    
    # Configuration WebSocket - CRITIQUE pour Socket.io
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    
    # Timeouts pour WebSocket (plus longs que pour HTTP normal)
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Buffer settings pour WebSocket
    proxy_buffering off;
    
    # Enlever le préfixe /api avant de transmettre au backend
    rewrite ^/api/(.*) /$1 break;
    
    proxy_pass http://192.168.1.108:3002;
    
    # Asset Caching
    include /etc/nginx/conf.d/include/assets.conf;
    
    # Block Exploits
    include /etc/nginx/conf.d/include/block-exploits.conf;
}
```

## Configuration complète du serveur avec map pour Connection header

Ajoutez cette section `map` au début de votre fichier de configuration (avant le bloc `server`) :

```nginx
# Map pour gérer correctement le header Connection pour WebSocket
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

Puis utilisez `$connection_upgrade` dans la location `/api` comme montré ci-dessus.

## Configuration alternative (si la première ne fonctionne pas)

Si la configuration ci-dessus ne fonctionne pas, essayez cette version avec une gestion explicite du header Connection :

```nginx
location /api {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Scheme $scheme;
    proxy_set_header X-Forwarded-Proto  $scheme;
    proxy_set_header X-Forwarded-For    $remote_addr;
    proxy_set_header X-Real-IP          $remote_addr;
    
    # Configuration WebSocket - Version explicite
    proxy_http_version 1.1;
    
    # Gérer le header Connection dynamiquement
    set $connection_upgrade "upgrade";
    if ($http_upgrade = '') {
        set $connection_upgrade "close";
    }
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    
    # Timeouts pour WebSocket
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Buffer settings pour WebSocket
    proxy_buffering off;
    
    # Enlever le préfixe /api avant de transmettre au backend
    rewrite ^/api/(.*) /$1 break;
    
    proxy_pass http://192.168.1.108:3002;
    
    # Asset Caching
    include /etc/nginx/conf.d/include/assets.conf;
    
    # Block Exploits
    include /etc/nginx/conf.d/include/block-exploits.conf;
}
```

## Points critiques

1. **`proxy_http_version 1.1`** : Obligatoire pour WebSocket
2. **`proxy_set_header Upgrade $http_upgrade`** : Transmet le header Upgrade
3. **`proxy_set_header Connection $connection_upgrade`** : Gère dynamiquement le header Connection
4. **`proxy_buffering off`** : Important pour les WebSockets en temps réel
5. **Timeouts augmentés** : 60s pour permettre les longues connexions WebSocket
6. **Ordre des directives** : Les headers WebSocket doivent être définis AVANT le `rewrite` et `proxy_pass`

## Test après modification

1. Rechargez la configuration Nginx :
   ```bash
   sudo nginx -t  # Vérifier la syntaxe
   sudo systemctl reload nginx  # Recharger la configuration
   ```

2. Testez la connexion WebSocket :
   ```bash
   curl "https://archi.gloret.fr/api/socket.io/?EIO=4&transport=polling&ns=/collaboration"
   ```
   
   **Résultat attendu** : JSON avec `sid`, `upgrades`, etc. (pas d'erreur 500)

3. Rechargez la page dans le navigateur et vérifiez la console - les erreurs WebSocket devraient disparaître.

## Si le problème persiste

Vérifiez les logs Nginx :
```bash
tail -f /data/logs/proxy-host-11_error.log
```

Cherchez les erreurs liées aux WebSockets ou aux timeouts.

