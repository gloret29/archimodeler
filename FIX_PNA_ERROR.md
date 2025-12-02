# Correction de l'erreur PNA (Private Network Access)

## Problème

L'erreur suivante apparaît :
```
Access to fetch at 'http://192.168.1.108:3002/auth/login' from origin 'http://archi.gloret.fr' 
has been blocked by CORS policy: The request client is not a secure context and the resource 
is in more-private address space `local`.
```

## Cause

Le frontend (servi depuis `archi.gloret.fr` via reverse proxy) essaie d'accéder directement à une IP locale (`192.168.1.108:3002`), ce qui est bloqué par la politique de sécurité du navigateur (Private Network Access).

## Solution

### 1. Modifier le fichier `.env`

Le fichier `apps/web/.env` a été modifié pour avoir `NEXT_PUBLIC_API_URL=""` (vide).

### 2. Redémarrer le serveur de développement

**IMPORTANT** : Les variables `NEXT_PUBLIC_*` sont injectées au moment du démarrage du serveur Next.js. Vous devez **redémarrer** le serveur pour que les changements prennent effet.

```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis redémarrer :
cd /home/loret/dev/archimodeler
npm run dev
```

### 3. Vérification

Après le redémarrage, dans la console du navigateur, vous devriez voir :
```
[API Config] Determining baseUrl: {
  apiUrl: "",
  isLocalhost: false,
  currentOrigin: "http://archi.gloret.fr",
  hostname: "archi.gloret.fr"
}
[API Config] No API URL defined, using current origin (reverse proxy): http://archi.gloret.fr
[API Config] Fetching: http://archi.gloret.fr/api/auth/login
```

Au lieu de :
```
[API Config] Fetching: http://192.168.1.108:3002/auth/login  ❌
```

## Configuration du Reverse Proxy

Assurez-vous que votre reverse proxy (Nginx Proxy Manager) est configuré pour :
1. Router `/api/*` vers le backend NestJS (port 3002)
2. Router `/*` vers le frontend Next.js (port 3000)
3. Gérer les WebSockets pour `/api/collaboration`

Voir `NGINX_PROXY_MANAGER_CONFIG.md` pour les détails.

## Pour le développement local

Si vous développez en local (frontend sur `localhost:3000`), vous pouvez temporairement modifier le `.env` :

```env
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

Mais **ne commitez pas** cette valeur si vous utilisez un reverse proxy en production.

## Alternative : Utiliser le domaine public

Si vous préférez être explicite, vous pouvez aussi définir :

```env
NEXT_PUBLIC_API_URL="http://archi.gloret.fr"
```

Mais laisser vide est recommandé car cela permet une détection automatique.


