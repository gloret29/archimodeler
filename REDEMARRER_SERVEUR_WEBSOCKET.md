# 🔄 Redémarrage du serveur pour activer les WebSockets

## Problème

Le namespace `/collaboration` retourne 404 même après les modifications. Socket.io fonctionne (`/socket.io/` répond), mais le namespace n'est pas accessible.

## Solution : Redémarrer complètement le serveur

**⚠️ IMPORTANT** : Le serveur doit être **complètement arrêté puis redémarré** pour que les changements prennent effet.

### Étapes

1. **Arrêter le serveur actuel** :
   - Trouvez le terminal où le serveur tourne
   - Appuyez sur `Ctrl+C` pour arrêter le processus
   - Attendez que le processus soit complètement arrêté

2. **Vérifier qu'aucun processus ne tourne** :
   ```bash
   ps aux | grep -E "(nest|node.*3002)" | grep -v grep
   ```
   - Si vous voyez des processus, tuez-les : `kill <PID>`

3. **Redémarrer le serveur** :
   ```bash
   cd /home/loret/dev/archimodeler/apps/server
   npm run start:dev
   ```

4. **Attendre que le serveur démarre complètement** :
   - Vous devriez voir : `🚀 Server is running on: http://0.0.0.0:3002`
   - Attendez quelques secondes supplémentaires pour que Socket.io s'initialise

5. **Tester la connexion Socket.io** :
   ```bash
   # Test 1: Socket.io sans namespace (doit fonctionner)
   curl "http://localhost:3002/socket.io/?EIO=4&transport=polling"
   # Résultat attendu : JSON avec sid, upgrades, etc.
   
   # Test 2: Socket.io avec namespace (doit fonctionner après redémarrage)
   curl "http://localhost:3002/collaboration/socket.io/?EIO=4&transport=polling"
   # Résultat attendu : JSON avec sid, upgrades, etc. (pas 404)
   ```

## Configuration actuelle

### Gateway (`apps/server/src/collaboration/collaboration.gateway.ts`)
```typescript
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/collaboration',
})
```

### Main (`apps/server/src/main.ts`)
```typescript
const app = await NestFactory.create(AppModule, {
    cors: true,
});

app.useWebSocketAdapter(new IoAdapter(app));
```

## Si le problème persiste après redémarrage

1. **Vérifiez les logs du serveur** pour voir s'il y a des erreurs Socket.io
2. **Vérifiez que CollaborationModule est bien importé** dans `AppModule`
3. **Vérifiez que le gateway est bien dans les providers** de `CollaborationModule`
4. **Testez sans namespace** pour confirmer que Socket.io fonctionne

## Vérification finale

Une fois le serveur redémarré, testez :

```bash
# Backend direct
curl "http://localhost:3002/collaboration/socket.io/?EIO=4&transport=polling"

# Via reverse proxy
curl "https://archi.gloret.fr/api/collaboration/socket.io/?EIO=4&transport=polling"
```

**Résultat attendu** : JSON avec `sid`, `upgrades`, etc. (pas 404)

Une fois que ça fonctionne, les WebSockets côté client devraient fonctionner correctement.


