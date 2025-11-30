# Système de Notifications - Comportement Actuel

## Vue d'ensemble

Le système de notifications fonctionne en **temps réel via WebSocket** avec un **fallback sur polling HTTP** toutes les 30 secondes.

## Architecture

### Backend

1. **NotificationsService** (`apps/server/src/notifications/notifications.service.ts`)
   - Crée les notifications en base de données (PostgreSQL via Prisma)
   - Émet les notifications via WebSocket via `CollaborationGateway`
   - Gère les opérations CRUD sur les notifications

2. **CollaborationGateway** (`apps/server/src/collaboration/collaboration.gateway.ts`)
   - Gère les connexions WebSocket
   - Gère les rooms de notifications par utilisateur (`notifications:${userId}`)
   - Émet les notifications aux clients connectés dans la room appropriée

### Frontend

1. **NotificationCenter** (`apps/web/components/notifications/NotificationCenter.tsx`)
   - Se connecte au WebSocket au chargement
   - Rejoint la room de notifications de l'utilisateur
   - Écoute les notifications en temps réel
   - Fait du polling toutes les 30 secondes comme backup

## Flux de fonctionnement

### 1. Initialisation (Frontend)

```
1. L'utilisateur se connecte
2. NotificationCenter récupère l'ID utilisateur via `/users/me`
3. Connexion WebSocket à `/collaboration`
4. Émission de `join-notifications` avec `{ userId }`
5. Le backend ajoute le client à la room `notifications:${userId}`
6. Chargement initial des notifications via API REST
```

### 2. Création d'une notification (Backend)

```
1. Un événement déclenche la création (ex: message de chat)
2. NotificationsService.createNotification() est appelé
3. La notification est sauvegardée en base de données
4. CollaborationGateway.emitNotification() est appelé
5. La notification est envoyée à la room `notifications:${userId}`
6. Tous les clients connectés dans cette room reçoivent la notification
```

### 3. Réception d'une notification (Frontend)

```
1. Le client reçoit l'événement `notification:${userId}` via WebSocket
2. La notification est ajoutée à la liste (évite les doublons)
3. Le compteur de non-lus est incrémenté
4. Après 500ms, un refresh via API est fait pour garantir la cohérence
```

## Événements qui déclenchent des notifications

### 1. Messages de Chat (`CHAT_MESSAGE`)
- **Déclencheur** : Envoi d'un message via `handleChatMessage()` dans `collaboration.gateway.ts`
- **Destinataire** : L'utilisateur qui reçoit le message (`data.to`)
- **Contenu** :
  - Type: `CHAT_MESSAGE`
  - Severity: `INFO`
  - Title: `"Nouveau message de {senderName}"`
  - Message: Extrait du message (tronqué à 100 caractères)
  - Metadata: `{ from, fromName, messageId, fullMessage }`

### 2. Change Requests (`CHANGE_REQUEST_*`)
- **Création** (`CHANGE_REQUEST_CREATED`)
  - Déclencheur: Soumission d'une change request pour review
  - Destinataires: Tous les reviewers du package
  - Severity: `INFO`
  
- **Approbation** (`CHANGE_REQUEST_APPROVED`)
  - Déclencheur: Approbation d'une change request
  - Destinataire: Le requester
  - Severity: `SUCCESS`
  
- **Rejet** (`CHANGE_REQUEST_REJECTED`)
  - Déclencheur: Rejet d'une change request
  - Destinataire: Le requester
  - Severity: `WARNING`
  
- **Publication** (`CHANGE_REQUEST_PUBLISHED`)
  - Déclencheur: Publication d'une change request
  - Destinataire: Le requester
  - Severity: `SUCCESS`

## Types de notifications disponibles

Définis dans `packages/database/prisma/schema.prisma`:
- `CHANGE_REQUEST_CREATED`
- `CHANGE_REQUEST_APPROVED`
- `CHANGE_REQUEST_REJECTED`
- `CHANGE_REQUEST_PUBLISHED`
- `ELEMENT_CREATED`
- `ELEMENT_UPDATED`
- `RELATIONSHIP_CREATED`
- `VIEW_CREATED`
- `VIEW_UPDATED`
- `SYSTEM_ALERT`
- `COLLABORATION_INVITE`
- `CHAT_MESSAGE` ✅ (récemment ajouté)

## Affichage (Frontend)

### Interface utilisateur
- **Icône de cloche** avec badge indiquant le nombre de notifications non lues
- **Popover** affichant la liste des notifications
- **Tri** : Plus récentes en premier
- **Indicateurs visuels** :
  - Badge de couleur selon la sévérité (INFO=bleu, WARNING=jaune, ERROR=rouge, SUCCESS=vert)
  - Fond accentué pour les notifications non lues
  - Timestamp formaté selon la locale

### Actions disponibles
- **Marquer comme lue** : Bouton ✓ sur chaque notification non lue
- **Marquer tout comme lu** : Bouton "Mark all read"
- **Supprimer** : Bouton ✗ sur chaque notification
- **Supprimer toutes les lues** : Bouton "Clear read"

## Gestion des erreurs

### Backend
- Si la création de notification échoue, l'erreur est loggée mais n'interrompt pas le processus principal
- Si le WebSocket n'est pas disponible, la notification est quand même sauvegardée en base

### Frontend
- Si le WebSocket échoue, le polling continue de fonctionner
- Si l'API REST échoue, les notifications existantes sont conservées
- Les erreurs 401/500 sont silencieusement ignorées (utilisateur non connecté)

## Points d'attention

### ✅ Points forts
- Notifications en temps réel via WebSocket
- Fallback sur polling pour la résilience
- Évite les doublons
- Gestion des erreurs robuste

### ⚠️ Points à améliorer
1. **Polling redondant** : Le polling toutes les 30 secondes peut être optimisé si le WebSocket fonctionne bien
2. **Refresh après réception** : Le refresh après 500ms peut être supprimé si on fait confiance au WebSocket
3. **Notifications non implémentées** : Certains types (ELEMENT_CREATED, VIEW_CREATED, etc.) ne sont pas encore utilisés
4. **Pas de notification sonore** : Aucun son ou vibration pour les nouvelles notifications
5. **Pas de notification système** : Pas d'intégration avec les notifications du navigateur (Web Notifications API)

## Configuration

- **URL WebSocket** : `${NEXT_PUBLIC_API_URL}/collaboration`
- **Intervalle de polling** : 30 secondes
- **Limite de notifications** : 100 dernières notifications
- **Timeout de refresh** : 500ms après réception WebSocket

## Logs

### Backend
- `Notification created: {id} for user {userId}`
- `Client {clientId} joined notification room for user {userId}`
- `Notification emitted to room {room} for user {userId}`

### Frontend
- `Notification WebSocket connected`
- `Received real-time notification: {notification}`
- `Notification WebSocket disconnected`
- `Notification WebSocket connection error: {error}`

