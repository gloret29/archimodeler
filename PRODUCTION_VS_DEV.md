# Production vs Développement avec Reverse Proxy

## ⚠️ Important : Mode Développement vs Production

Si votre application est accessible via `archi.gloret.fr` (reverse proxy), elle devrait être en **mode production**, pas en mode développement.

### Mode Développement (`npm run dev`)

- ✅ Pour le développement local uniquement
- ❌ Ne doit PAS être utilisé en production
- ⚠️ Plus lent et moins sécurisé
- ⚠️ Génère des warnings cross-origin avec reverse proxy

### Mode Production (`npm run build` + `npm run start`)

- ✅ Pour la production
- ✅ Plus rapide et optimisé
- ✅ Pas de warnings cross-origin
- ✅ Meilleure sécurité

## Configuration pour Production avec Reverse Proxy

### 1. Variables d'environnement

**`apps/web/.env`** (ou `.env.production`) :
```env
# Option 1 : Laisser vide (recommandé)
# NEXT_PUBLIC_API_URL=""

# Option 2 : Utiliser le même domaine
NEXT_PUBLIC_API_URL="http://archi.gloret.fr"
NEXT_PUBLIC_WS_URL="http://archi.gloret.fr"

NODE_ENV=production
```

### 2. Compiler l'application

```bash
cd /chemin/vers/archimodeler
npm run build --workspace=@repo/web
```

### 3. Démarrer en mode production

```bash
cd apps/web
npm run start
```

Ou avec systemd/PM2 :
```bash
# systemd
sudo systemctl start archimodeler-web

# PM2
pm2 start npm --name "archimodeler-web" -- start
```

## Configuration pour Développement avec Reverse Proxy

Si vous devez absolument utiliser le mode développement avec reverse proxy (non recommandé), la configuration `allowedDevOrigins` a été ajoutée dans `next.config.js` :

```javascript
allowedDevOrigins: [
    'archi.gloret.fr',
    '192.168.1.108',
    'localhost',
    '127.0.0.1',
],
```

**⚠️ Note** : Le mode développement avec reverse proxy n'est pas recommandé pour la production.

## Vérification

### Mode Production
- Pas de warnings cross-origin
- Application plus rapide
- Logs : `✓ Ready in XXXms` (sans warnings)

### Mode Développement
- Warnings cross-origin (maintenant corrigés)
- Application plus lente
- Hot Module Replacement (HMR) actif
- Logs : `✓ Ready in XXXms` avec warnings

## Recommandation

Pour `archi.gloret.fr` (production), utilisez :
1. `NODE_ENV=production`
2. `npm run build`
3. `npm run start`

Ne pas utiliser `npm run dev` en production.



