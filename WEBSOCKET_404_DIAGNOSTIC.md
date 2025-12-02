# 🔍 Diagnostic : Erreur 404 WebSocket Socket.io

## Problème

Le namespace `/collaboration` retourne 404 :
- ✅ `/socket.io/` fonctionne (200 OK) - Socket.io fonctionne sans namespace
- ❌ `/collaboration/socket.io/` retourne 404 - Le namespace n'est pas accessible

## Modifications apportées

1. **Namespace corrigé** : `namespace: '/collaboration'` (avec slash initial)
2. **Adapter Socket.io ajouté** : `app.useWebSocketAdapter(new IoAdapter(app))` dans `main.ts`

## Actions à effectuer

### 1. Redémarrer le serveur backend

**⚠️ IMPORTANT** : Le serveur doit être complètement redémarré pour que les changements prennent effet.

```bash
# Arrêter le serveur actuel (Ctrl+C dans le terminal où il tourne)
# Puis redémarrer :
cd apps/server
npm run start:dev
```

### 2. Vérifier que le serveur a bien démarré

Attendez que vous voyiez dans les logs :
```
🚀 Server is running on: http://0.0.0.0:3002
```

### 3. Tester à nouveau

```bash
# Test direct backend
curl "http://localhost:3002/collaboration/socket.io/?EIO=4&transport=polling"

# Devrait retourner quelque chose comme :
# 0{"sid":"...","upgrades":["websocket"],...}
```

### 4. Si ça ne fonctionne toujours pas

Vérifiez les logs du serveur pour voir s'il y a des erreurs de configuration Socket.io.

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
// Configurer l'adapter Socket.io pour les WebSockets
app.useWebSocketAdapter(new IoAdapter(app));
```

### Module (`apps/server/src/collaboration/collaboration.module.ts`)
```typescript
@Module({
    imports: [...],
    providers: [CollaborationGateway],
    exports: [CollaborationGateway],
})
```

## Si le problème persiste après redémarrage

1. **Vérifiez les logs du serveur** pour des erreurs Socket.io
2. **Vérifiez que CollaborationModule est importé** dans `AppModule`
3. **Testez sans namespace** pour confirmer que Socket.io fonctionne
4. **Vérifiez la version de Socket.io** : `npm list socket.io` dans `apps/server`

## Prochaines étapes

Une fois que `/collaboration/socket.io/` fonctionne (retourne 200 avec un `sid`), les WebSockets côté client devraient fonctionner correctement.


