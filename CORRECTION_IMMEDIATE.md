# 🚨 Correction Immédiate - Failed to fetch avec Reverse Proxy

## Problème

Le frontend essaie d'appeler directement `http://192.168.1.108:3002/auth/login` au lieu d'utiliser le reverse proxy via `http://archi.gloret.fr/api/auth/login`.

**Erreur** : "Access to fetch at 'http://192.168.1.108:3002/auth/login' from origin 'http://archi.gloret.fr' has been blocked by CORS policy"

## Solution en 3 étapes

### Étape 1 : Modifier les variables d'environnement

Sur votre serveur de production, modifiez le fichier `.env` du frontend :

```bash
# Sur le serveur de production
nano /chemin/vers/archimodeler/apps/web/.env
```

**Remplacez** :
```env
NEXT_PUBLIC_API_URL="http://192.168.1.108:3002"
```

**Par** (choisissez une option) :

**Option A - Laisser vide (Recommandé)** :
```env
# Ne pas définir NEXT_PUBLIC_API_URL
# Le frontend utilisera automatiquement window.location.origin
NODE_ENV=production
```

**Option B - Utiliser le même domaine** :
```env
NEXT_PUBLIC_API_URL="http://archi.gloret.fr"
NEXT_PUBLIC_WS_URL="http://archi.gloret.fr"
NODE_ENV=production
```

### Étape 2 : Recompiler le frontend

**⚠️ CRITIQUE** : Les variables `NEXT_PUBLIC_*` sont intégrées au build time. Vous DEVEZ recompiler :

```bash
# Sur le serveur de production
cd /chemin/vers/archimodeler
npm run build --workspace=@repo/web
```

### Étape 3 : Redémarrer le serveur

```bash
# Si vous utilisez systemd
sudo systemctl restart archimodeler-web

# Ou si vous utilisez PM2
pm2 restart archimodeler-web

# Ou si vous utilisez npm directement
# Arrêtez le processus actuel (Ctrl+C) puis :
cd apps/web
npm run start
```

## Vérification

1. **Ouvrez la console du navigateur** (F12) sur `http://archi.gloret.fr`

2. **Regardez les logs `[API Config]`** :
   - Vous devriez voir : `[API Config] Determining baseUrl: { currentOrigin: "http://archi.gloret.fr", ... }`
   - Vous devriez voir : `[API Config] Fetching: http://archi.gloret.fr/api/auth/login`

3. **Vérifiez que les requêtes utilisent le bon domaine** :
   - ✅ Correct : `http://archi.gloret.fr/api/auth/login`
   - ❌ Incorrect : `http://192.168.1.108:3002/auth/login`

## Si vous ne voyez pas les logs `[API Config]`

Cela signifie que l'application n'a pas été recompilée avec les nouvelles modifications. Vérifiez :

1. Que vous avez bien exécuté `npm run build --workspace=@repo/web`
2. Que le build s'est terminé sans erreur
3. Que vous avez bien redémarré le serveur après le build

## Si le problème persiste

1. **Vérifiez que le reverse proxy est bien configuré** :
   - La location `/api` doit être configurée
   - Le rewrite doit enlever le préfixe `/api`
   - Voir [NGINX_PROXY_MANAGER_CONFIG.md](./NGINX_PROXY_MANAGER_CONFIG.md)

2. **Testez directement le backend** :
   ```bash
   curl http://localhost:3002/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
   ```

3. **Testez via le reverse proxy** :
   ```bash
   curl http://archi.gloret.fr/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
   ```

## Notes importantes

- ⚠️ **Un simple redémarrage ne suffit pas** : Les variables `NEXT_PUBLIC_*` sont intégrées au build time
- ⚠️ **Ne jamais utiliser d'IP locale** (192.168.x.x) pour `NEXT_PUBLIC_API_URL` en production avec reverse proxy
- ✅ **Laisser vide** `NEXT_PUBLIC_API_URL` est la solution la plus simple et la plus robuste



