# Migration vers GraphQL - Guide Complet

## 📋 Vue d'ensemble

Ce document décrit la migration du projet ArchiModeler de WebSockets (Socket.io) vers GraphQL avec Subscriptions. Cette migration permet de :
- ✅ Remplacer les WebSockets par GraphQL Subscriptions
- ✅ Unifier l'API (queries, mutations, subscriptions) dans un seul protocole
- ✅ Améliorer le type-safety avec la génération automatique de types
- ✅ Simplifier la configuration (pas de configuration spéciale pour les reverse proxies)

## 🏗️ Architecture

### Backend (NestJS)

#### Structure des fichiers
```
apps/server/src/graphql/
├── graphql.module.ts          # Module GraphQL principal
├── pubsub.ts                  # Service PubSub pour les subscriptions
├── guards/
│   └── gql-auth.guard.ts     # Guard d'authentification JWT pour GraphQL
└── resolvers/
    ├── collaboration.resolver.ts  # Resolver pour la collaboration
    ├── notifications.resolver.ts  # Resolver pour les notifications
    └── chat.resolver.ts          # Resolver pour le chat
```

#### Configuration GraphQL

Le module GraphQL est configuré dans `apps/server/src/graphql/graphql.module.ts` :

- **Endpoint HTTP** : `/graphql` (queries et mutations)
- **Endpoint WebSocket** : `ws://domain/graphql` (subscriptions)
- **Playground** : Disponible à `/graphql` (mode développement)
- **Authentification** : JWT via Bearer token dans les headers ou paramètres de connexion WebSocket

### Frontend (Next.js)

#### Installation requise

```bash
cd apps/web
npm install @apollo/client graphql graphql-ws
```

#### Configuration Apollo Client

Créer `apps/web/lib/apollo-client.ts` :

```typescript
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3002/graphql',
});

const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(
  createClient({
    url: (process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:3002/graphql').replace('http://', 'ws://').replace('https://', 'wss://'),
    connectionParams: () => {
      const token = localStorage.getItem('accessToken');
      return {
        authorization: token ? `Bearer ${token}` : '',
        token: token || '',
      };
    },
  })
) : null;

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink)
    )
  : authLink.concat(httpLink);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
```

## 📝 Schémas GraphQL

### Collaboration

#### Mutations

```graphql
mutation JoinView($viewId: String!, $user: UserInput!) {
  joinView(viewId: $viewId, user: $user)
}

mutation LeaveView($viewId: String!) {
  leaveView(viewId: $viewId)
}

mutation UpdateCursor($viewId: String!, $position: CursorPositionInput!) {
  updateCursor(viewId: $viewId, position: $position)
}

mutation UpdateNode($viewId: String!, $node: JSON!) {
  updateNode(viewId: $viewId, node: $node)
}

mutation UpdateEdge($viewId: String!, $edge: JSON!) {
  updateEdge(viewId: $viewId, edge: $edge)
}

mutation DeleteNode($viewId: String!, $nodeId: String!) {
  deleteNode(viewId: $viewId, nodeId: $nodeId)
}

mutation DeleteEdge($viewId: String!, $edgeId: String!) {
  deleteEdge(viewId: $edgeId, edgeId: $edgeId)
}

mutation NotifyViewSaved($viewId: String!, $savedBy: SavedByInput!) {
  notifyViewSaved(viewId: $viewId, savedBy: $savedBy)
}
```

#### Subscriptions

```graphql
subscription CursorUpdates($viewId: String!) {
  cursorUpdates(viewId: $viewId) {
    userId
    viewId
    position {
      x
      y
    }
  }
}

subscription NodeUpdates($viewId: String!) {
  nodeUpdates(viewId: $viewId) {
    userId
    viewId
    node
  }
}

subscription EdgeUpdates($viewId: String!) {
  edgeUpdates(viewId: $viewId) {
    userId
    viewId
    edge
  }
}

subscription UserJoined($viewId: String!) {
  userJoined(viewId: $viewId) {
    userId
    viewId
    user {
      id
      name
      color
    }
    users {
      id
      name
      color
    }
  }
}

subscription UserLeft($viewId: String!) {
  userLeft(viewId: $viewId) {
    userId
    viewId
    users {
      id
      name
      color
    }
  }
}

subscription ViewSaved($viewId: String!) {
  viewSaved(viewId: $viewId) {
    viewId
    savedBy {
      id
      name
    }
  }
}
```

### Notifications

#### Queries

```graphql
query Notifications {
  notifications {
    id
    type
    severity
    title
    message
    read
    createdAt
    metadata
  }
}

query UnreadNotificationCount {
  unreadNotificationCount
}
```

#### Subscriptions

```graphql
subscription NotificationAdded {
  notificationAdded {
    id
    type
    severity
    title
    message
    read
    createdAt
    metadata
  }
}
```

### Chat

#### Queries

```graphql
query ChatHistory($targetUserId: String!) {
  chatHistory(targetUserId: $targetUserId) {
    id
    from
    to
    message
    timestamp
    senderName
  }
}
```

#### Mutations

```graphql
mutation SendChatMessage($to: String!, $message: String!) {
  sendChatMessage(to: $to, message: $message) {
    id
    from
    to
    message
    timestamp
    senderName
  }
}
```

#### Subscriptions

```graphql
subscription ChatMessageAdded($targetUserId: String!) {
  chatMessageAdded(targetUserId: $targetUserId) {
    id
    from
    to
    message
    timestamp
    senderName
  }
}
```

## 🔄 Migration des Hooks Frontend

### useCollaboration

**Avant (WebSocket)** :
```typescript
const socket = io(wsUrl);
socket.emit('join-view', { viewId, user });
socket.on('cursor-update', handleCursorUpdate);
```

**Après (GraphQL)** :
```typescript
import { useMutation, useSubscription } from '@apollo/client';
import { JOIN_VIEW, CURSOR_UPDATES } from './graphql/collaboration';

const [joinView] = useMutation(JOIN_VIEW);
const { data } = useSubscription(CURSOR_UPDATES, {
  variables: { viewId },
});
```

### useNotifications

**Avant (WebSocket)** :
```typescript
const socket = io(wsUrl);
socket.emit('join-notifications', { userId });
socket.on(`notification:${userId}`, handleNotification);
```

**Après (GraphQL)** :
```typescript
import { useQuery, useSubscription } from '@apollo/client';
import { NOTIFICATIONS, NOTIFICATION_ADDED } from './graphql/notifications';

const { data } = useQuery(NOTIFICATIONS);
const { data: newNotification } = useSubscription(NOTIFICATION_ADDED);
```

### UserChat

**Avant (WebSocket)** :
```typescript
const socket = io(wsUrl);
socket.emit('join-chat', { userId, targetUserId });
socket.emit('chat-message', { from, to, message });
socket.on('chat-message', handleMessage);
```

**Après (GraphQL)** :
```typescript
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { CHAT_HISTORY, SEND_CHAT_MESSAGE, CHAT_MESSAGE_ADDED } from './graphql/chat';

const { data: history } = useQuery(CHAT_HISTORY, { variables: { targetUserId } });
const [sendMessage] = useMutation(SEND_CHAT_MESSAGE);
const { data: newMessage } = useSubscription(CHAT_MESSAGE_ADDED, {
  variables: { targetUserId },
});
```

## 🚀 Déploiement

### Variables d'environnement

#### Backend
```env
# Pas de changement nécessaire
JWT_SECRET=your-secret-key
```

#### Frontend
```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3002/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3002/graphql
# Ou en production :
NEXT_PUBLIC_GRAPHQL_URL=https://your-domain.com/api/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=wss://your-domain.com/api/graphql
```

### Configuration Reverse Proxy

GraphQL fonctionne sur le même endpoint HTTP (`/graphql`) et utilise WebSocket pour les subscriptions. La configuration du reverse proxy doit supporter les WebSockets (comme pour Socket.io).

**Nginx** :
```nginx
location /api/graphql {
    proxy_pass http://backend:3002/graphql;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## ✅ Avantages de la Migration

1. **Unification de l'API** : Toutes les opérations (queries, mutations, subscriptions) dans un seul protocole
2. **Type-safety** : Génération automatique de types TypeScript depuis le schéma GraphQL
3. **Documentation automatique** : Le schéma GraphQL sert de documentation
4. **Meilleure organisation** : Code plus structuré avec les resolvers
5. **Outils de développement** : GraphQL Playground intégré
6. **Flexibilité** : Facile d'ajouter de nouveaux champs sans casser les clients existants

## ⚠️ Points d'attention

1. **WebSockets toujours nécessaires** : GraphQL Subscriptions utilise WebSockets en arrière-plan, mais la configuration est plus simple
2. **Migration progressive** : Les WebSockets existants peuvent coexister pendant la migration
3. **Performance** : GraphQL peut être plus lourd que REST pour des requêtes simples, mais offre plus de flexibilité

## 📚 Ressources

- [NestJS GraphQL Documentation](https://docs.nestjs.com/graphql/quick-start)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [GraphQL Subscriptions](https://www.apollographql.com/docs/apollo-server/data/subscriptions/)




