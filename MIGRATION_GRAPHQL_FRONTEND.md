# Migration Frontend vers GraphQL - Guide

## 📋 Résumé

Ce document décrit la migration du frontend vers GraphQL. Les hooks et composants existants basés sur WebSockets (Socket.io) ont été remplacés par des versions GraphQL utilisant Apollo Client.

## ✅ Fichiers Créés

### Configuration
- `apps/web/lib/apollo-client.ts` - Configuration du client Apollo avec support des subscriptions
- `apps/web/components/providers/ApolloProvider.tsx` - Provider Apollo pour l'application

### GraphQL Queries/Mutations/Subscriptions
- `apps/web/lib/graphql/collaboration.ts` - Schémas GraphQL pour la collaboration
- `apps/web/lib/graphql/notifications.ts` - Schémas GraphQL pour les notifications
- `apps/web/lib/graphql/chat.ts` - Schémas GraphQL pour le chat

### Hooks GraphQL
- `apps/web/hooks/useCollaborationGraphQL.ts` - Hook de collaboration avec GraphQL
- `apps/web/hooks/useNotificationsGraphQL.ts` - Hook de notifications avec GraphQL

### Composants GraphQL
- `apps/web/components/collaboration/UserChatGraphQL.tsx` - Composant de chat avec GraphQL

## 🔄 Migration des Composants

### 1. useCollaboration → useCollaborationGraphQL

**Avant (WebSocket)** :
```typescript
import { useCollaboration } from '@/hooks/useCollaboration';

const { users, cursors, isConnected, updateCursor } = useCollaboration({
  viewId: 'view-123',
  user: { id: 'user-1', name: 'John', color: '#FF0000' },
  onNodeChanged: (data) => console.log('Node changed', data),
});
```

**Après (GraphQL)** :
```typescript
import { useCollaborationGraphQL } from '@/hooks/useCollaborationGraphQL';

const { users, cursors, isConnected, updateCursor } = useCollaborationGraphQL({
  viewId: 'view-123',
  user: { id: 'user-1', name: 'John', color: '#FF0000' },
  onNodeChanged: (data) => console.log('Node changed', data),
});
```

### 2. useNotifications → useNotificationsGraphQL

**Avant (WebSocket)** :
```typescript
import { useNotifications } from '@/hooks/useNotifications';

const { notifications, unreadCount } = useNotifications(userId);
```

**Après (GraphQL)** :
```typescript
import { useNotificationsGraphQL } from '@/hooks/useNotificationsGraphQL';

const { notifications, unreadCount, refetchNotifications } = useNotificationsGraphQL(userId);
```

### 3. UserChat → UserChatGraphQL

**Avant (WebSocket)** :
```typescript
import { UserChat } from '@/components/collaboration/UserChat';

<UserChat
  currentUser={currentUser}
  targetUser={targetUser}
  isOpen={isOpen}
  onClose={onClose}
/>
```

**Après (GraphQL)** :
```typescript
import { UserChatGraphQL } from '@/components/collaboration/UserChatGraphQL';

<UserChatGraphQL
  currentUser={currentUser}
  targetUser={targetUser}
  isOpen={isOpen}
  onClose={onClose}
/>
```

## 🚀 Utilisation

### Étape 1 : Vérifier que le Provider Apollo est installé

Le provider Apollo a été ajouté dans `apps/web/app/[locale]/layout.tsx`. Vérifiez qu'il est bien présent.

### Étape 2 : Remplacer les imports

Dans vos composants, remplacez :
- `useCollaboration` → `useCollaborationGraphQL`
- `useNotifications` → `useNotificationsGraphQL`
- `UserChat` → `UserChatGraphQL`

### Étape 3 : Tester

1. Démarrer le backend : `cd apps/server && npm run start:dev`
2. Démarrer le frontend : `cd apps/web && npm run dev`
3. Ouvrir GraphQL Playground : `http://localhost:3002/graphql`
4. Tester les fonctionnalités de collaboration, notifications et chat

## ⚙️ Configuration

### Variables d'environnement

Aucune variable d'environnement supplémentaire n'est requise. Le client Apollo utilise les mêmes variables que l'API REST :
- `NEXT_PUBLIC_API_URL` - URL du backend (optionnel)
- `NEXT_PUBLIC_USE_REVERSE_PROXY` - Utiliser le reverse proxy (optionnel)

Le client Apollo détecte automatiquement :
- L'URL GraphQL HTTP : `${baseUrl}/graphql` ou `${baseUrl}/api/graphql` (si reverse proxy)
- L'URL GraphQL WebSocket : `ws://${host}/graphql` ou `wss://${host}/api/graphql` (si reverse proxy)

## 🔍 Dépannage

### Les subscriptions ne fonctionnent pas

1. Vérifier que le backend GraphQL est démarré
2. Vérifier la console du navigateur pour les erreurs WebSocket
3. Vérifier que le token JWT est présent dans localStorage
4. Vérifier la configuration du reverse proxy (si utilisé)

### Erreurs d'authentification

1. Vérifier que le token JWT est valide
2. Vérifier que le token est présent dans localStorage (`accessToken`)
3. Vérifier que le backend accepte le token dans les headers Authorization

### Les données ne se mettent pas à jour

1. Vérifier que les subscriptions sont bien actives (onglet Network dans DevTools)
2. Vérifier les logs du backend pour voir si les événements sont publiés
3. Vérifier que les filtres de subscription sont corrects

## 📝 Notes

- Les hooks GraphQL peuvent coexister avec les hooks WebSocket pendant la migration
- Les deux systèmes fonctionnent en parallèle, vous pouvez migrer progressivement
- Une fois la migration complète, vous pourrez supprimer les hooks WebSocket

## 🔗 Ressources

- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [GraphQL Subscriptions](https://www.apollographql.com/docs/react/data/subscriptions/)
- [MIGRATION_GRAPHQL.md](./MIGRATION_GRAPHQL.md) - Documentation backend




