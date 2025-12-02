# Redémarrer le serveur de développement

## ⚠️ IMPORTANT : Redémarrage nécessaire

Les variables `NEXT_PUBLIC_*` sont injectées au moment du démarrage du serveur Next.js. 
Vous devez **redémarrer** le serveur pour que les changements dans `.env` prennent effet.

## Étapes

1. **Arrêter le serveur actuel** :
   - Appuyez sur `Ctrl+C` dans le terminal où `npm run dev` est en cours
   - Ou tuez le processus : `pkill -f "npm run dev"`

2. **Redémarrer le serveur** :
   ```bash
   cd /home/loret/dev/archimodeler
   npm run dev
   ```

3. **Vérifier dans la console du navigateur** :
   - Ouvrez la console (F12)
   - Rechargez la page
   - Vous devriez voir : `[API Config] No API URL defined, using current origin (reverse proxy): http://archi.gloret.fr`
   - Les requêtes devraient aller vers : `http://archi.gloret.fr/api/auth/login` (pas `192.168.1.108:3002`)

## Si le problème persiste

1. Vérifiez que le `.env` est bien vide :
   ```bash
   cat apps/web/.env
   ```
   Devrait afficher : `NEXT_PUBLIC_API_URL=""`

2. Vérifiez qu'il n'y a pas d'autres fichiers `.env` qui surchargent :
   ```bash
   find apps/web -name ".env*" -type f
   ```

3. Vérifiez les variables d'environnement système :
   ```bash
   env | grep NEXT_PUBLIC
   ```
   (Ne devrait rien afficher, ou seulement les valeurs que vous voulez)


