# 🔧 Correction de l'erreur 404 WebSocket Socket.io

## Problème identifié

Le script de test retourne **404** pour `/collaboration/socket.io/` :
- ✅ `/socket.io/` fonctionne (200 OK)
- ❌ `/collaboration/socket.io/` retourne 404

## Cause

Le namespace Socket.io dans NestJS n'était pas correctement configuré. Le namespace doit commencer par `/` pour être accessible.

## Solution appliquée

### Modification du Gateway

Dans `apps/server/src/collaboration/collaboration.gateway.ts` :

**Avant** :
```typescript
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'collaboration', // ❌ Manque le slash initial
})
```

**Après** :
```typescript
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/collaboration', // ✅ Namespace avec slash initial
    path: '/socket.io/', // Path Socket.io explicite
})
```

## Redémarrage nécessaire

**⚠️ IMPORTANT** : Le serveur backend doit être redémarré pour que les changements prennent effet.

```bash
# Si le serveur tourne avec nest start --watch, il devrait se recharger automatiquement
# Sinon, redémarrez-le manuellement :
cd apps/server
npm run start:dev
```

## Vérification

Après le redémarrage, testez à nouveau :

```bash
# Test 1: Backend direct
./scripts/test-websocket.sh http://localhost:3002

# Test 2: Via reverse proxy
./scripts/test-websocket.sh http://votre-domaine.com/api
```

**Résultat attendu** : 
- ✅ `/collaboration/socket.io/?EIO=4&transport=polling` devrait retourner 200 OK avec un `sid`

## Si le problème persiste

1. **Vérifiez que le serveur a bien redémarré** :
   ```bash
   curl http://localhost:3002/collaboration/socket.io/?EIO=4&transport=polling
   ```

2. **Vérifiez les logs du serveur** :
   - Cherchez les messages de démarrage Socket.io
   - Vérifiez s'il y a des erreurs de configuration

3. **Vérifiez que le module CollaborationModule est bien importé** :
   - Dans `apps/server/src/app.module.ts`, `CollaborationModule` doit être dans les imports

4. **Testez sans namespace** :
   ```bash
   curl http://localhost:3002/socket.io/?EIO=4&transport=polling
   ```
   - Si ça fonctionne, le problème vient de la configuration du namespace
   - Si ça ne fonctionne pas, le problème vient de Socket.io en général

## Configuration complète

Pour référence, voici la configuration complète du gateway :

```typescript
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/collaboration',
    path: '/socket.io/',
})
export class CollaborationGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    // ...
}
```

Et côté client, l'URL doit être :
- En développement : `http://localhost:3002/collaboration`
- En production (reverse proxy) : `http://votre-domaine.com/api/collaboration`

Socket.io ajoutera automatiquement `/socket.io/` au path, donc :
- En développement : `http://localhost:3002/collaboration/socket.io/`
- En production : `http://votre-domaine.com/api/collaboration/socket.io/`

Le reverse proxy transformera `/api/collaboration/socket.io/` en `/collaboration/socket.io/` côté backend.


