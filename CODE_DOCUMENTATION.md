# Documentation du Code ArchiModeler

> Guide pour comprendre et documenter le code source d'ArchiModeler

## 📋 Table des Matières

1. [Structure du Code](#structure-du-code)
2. [Conventions de Nommage](#conventions-de-nommage)
3. [Documentation JSDoc](#documentation-jsdoc)
4. [Patterns et Architectures](#patterns-et-architectures)
5. [Standards de Code](#standards-de-code)
6. [Exemples](#exemples)

---

## Structure du Code

### Architecture Monorepo (Turborepo)

```
archimodeler/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── app/                # Pages (App Router)
│   │   │   ├── [locale]/       # Routes internationalisées
│   │   │   │   ├── studio/     # Page principale du studio
│   │   │   │   ├── admin/      # Page d'administration
│   │   │   │   └── settings/   # Page de paramètres
│   │   │   └── layout.tsx      # Layout racine
│   │   ├── components/         # Composants React
│   │   │   ├── canvas/         # Composants de diagramming
│   │   │   ├── studio/         # Composants du studio
│   │   │   ├── collaboration/  # Composants de collaboration
│   │   │   ├── comments/       # Composants de commentaires
│   │   │   ├── notifications/  # Composants de notifications
│   │   │   ├── common/         # Composants communs
│   │   │   └── ui/             # Composants UI (shadcn/ui)
│   │   ├── hooks/              # Hooks React personnalisés
│   │   ├── contexts/           # Contextes React
│   │   ├── store/              # Stores Zustand
│   │   ├── lib/                # Utilitaires et helpers
│   │   │   ├── api/            # Configuration API
│   │   │   └── types/          # Types TypeScript
│   │   └── messages/           # Fichiers de traduction i18n
│   └── server/                 # Backend NestJS
│       └── src/
│           ├── main.ts         # Point d'entrée
│           ├── app.module.ts   # Module racine
│           ├── auth/           # Module d'authentification
│           ├── users/          # Module utilisateurs
│           ├── model/          # Module de modélisation
│           ├── collaboration/  # Module de collaboration
│           ├── comments/       # Module de commentaires
│           ├── notifications/  # Module de notifications
│           ├── prisma/         # Service Prisma
│           └── ...             # Autres modules
├── packages/
│   ├── database/               # Schéma Prisma
│   │   └── prisma/
│   │       ├── schema.prisma   # Schéma de base de données
│   │       └── migrations/     # Migrations
│   ├── types/                  # Types TypeScript partagés
│   └── ui/                     # Composants UI partagés
└── scripts/                    # Scripts utilitaires
```

### Organisation des Modules Backend (NestJS)

Chaque module suit la structure standard NestJS :

```
module-name/
├── module-name.module.ts    # Définition du module
├── module-name.service.ts   # Logique métier
├── module-name.controller.ts # Endpoints REST
└── dto/                     # Data Transfer Objects (optionnel)
    └── create-*.dto.ts
```

### Organisation des Composants Frontend (React)

Les composants sont organisés par fonctionnalité :

```
feature/
├── ComponentName.tsx        # Composant principal
├── SubComponent.tsx         # Sous-composants
├── types.ts                 # Types TypeScript locaux
└── utils.ts                 # Utilitaires locaux (optionnel)
```

---

## Conventions de Nommage

### Fichiers et Dossiers

- **Composants React** : `PascalCase.tsx` (ex: `ModelingCanvas.tsx`)
- **Hooks** : `camelCase.ts` avec préfixe `use` (ex: `useCollaboration.ts`)
- **Utilitaires** : `camelCase.ts` (ex: `apiClient.ts`)
- **Types** : `camelCase.ts` ou `types.ts` (ex: `comments.ts`)
- **Constantes** : `UPPER_SNAKE_CASE.ts` (ex: `API_CONSTANTS.ts`)
- **Dossiers** : `kebab-case` ou `camelCase` (ex: `canvas/`, `useCollaboration/`)

### Variables et Fonctions

- **Variables** : `camelCase` (ex: `activeTab`, `currentUser`)
- **Fonctions** : `camelCase` avec verbe (ex: `handleSave`, `fetchUsers`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`)
- **Types/Interfaces** : `PascalCase` (ex: `User`, `CommentThread`)
- **Enums** : `PascalCase` (ex: `CommentTargetType`)

### Classes et Services

- **Classes** : `PascalCase` (ex: `CommentsService`)
- **Services NestJS** : `*Service` (ex: `CommentsService`)
- **Controllers NestJS** : `*Controller` (ex: `CommentsController`)
- **Modules NestJS** : `*Module` (ex: `CommentsModule`)

---

## Documentation JSDoc

### Format Standard

Utilisez JSDoc pour documenter les fonctions, classes et types :

```typescript
/**
 * Description courte de la fonction/classe.
 * 
 * Description détaillée si nécessaire (optionnel).
 * 
 * @param {Type} paramName - Description du paramètre
 * @param {Type} [optionalParam] - Paramètre optionnel
 * @returns {Type} Description de la valeur de retour
 * @throws {ErrorType} Quand cette erreur est levée
 * @example
 * // Exemple d'utilisation
 * const result = myFunction('example');
 */
```

### Exemples par Type

#### Fonctions

```typescript
/**
 * Sauvegarde le contenu actuel de la vue dans la base de données.
 * 
 * @param {string} viewId - ID de la vue à sauvegarder
 * @param {Object} content - Contenu à sauvegarder (nodes et edges)
 * @param {Array} content.nodes - Liste des nœuds du canvas
 * @param {Array} content.edges - Liste des arêtes du canvas
 * @returns {Promise<void>} Promesse résolue après sauvegarde
 * @throws {Error} Si la vue n'existe pas ou si la sauvegarde échoue
 * 
 * @example
 * await saveView('view-123', {
 *   nodes: [...],
 *   edges: [...]
 * });
 */
async function saveView(viewId: string, content: { nodes: any[]; edges: any[] }): Promise<void> {
  // ...
}
```

#### Composants React

```typescript
/**
 * Composant principal du canvas de modélisation.
 * 
 * Affiche un canvas interactif basé sur React Flow permettant de créer
 * et modifier des diagrammes ArchiMate. Gère le drag & drop, les connexions
 * et la validation des relations.
 * 
 * @param {ModelingCanvasProps} props - Propriétés du composant
 * @param {string} props.packageId - ID du package de modèle
 * @param {string} props.viewName - Nom de la vue
 * @param {Array} props.nodes - Nœuds contrôlés (optionnel)
 * @param {Array} props.edges - Arêtes contrôlées (optionnel)
 * 
 * @example
 * <ModelingCanvas
 *   packageId="pkg-123"
 *   viewName="Main View"
 *   nodes={nodes}
 *   edges={edges}
 * />
 */
export default function ModelingCanvas({ packageId, viewName, nodes, edges }: ModelingCanvasProps) {
  // ...
}
```

#### Services NestJS

```typescript
/**
 * Service de gestion des commentaires et annotations.
 * 
 * Fournit les opérations CRUD pour les commentaires, la gestion des mentions
 * d'utilisateurs et l'envoi de notifications.
 * 
 * @class CommentsService
 */
@Injectable()
export class CommentsService {
  /**
   * Crée un nouveau thread de commentaires avec un commentaire initial.
   * 
   * @param {string} userId - ID de l'utilisateur créateur
   * @param {CreateCommentThreadDto} dto - Données du thread à créer
   * @returns {Promise<CommentThread>} Le thread créé avec ses commentaires
   * @throws {NotFoundException} Si la cible du commentaire n'existe pas
   * 
   * @example
   * const thread = await commentsService.createThread(userId, {
   *   targetType: 'ELEMENT',
   *   targetId: 'elem-123',
   *   initialComment: 'Ceci est un commentaire'
   * });
   */
  async createThread(userId: string, dto: CreateCommentThreadDto): Promise<CommentThread> {
    // ...
  }
}
```

#### Types et Interfaces

```typescript
/**
 * Propriétés du composant ModelingCanvas.
 * 
 * @interface ModelingCanvasProps
 */
interface ModelingCanvasProps {
  /** ID du package de modèle */
  packageId: string;
  
  /** Nom de la vue */
  viewName: string;
  
  /** Nœuds du canvas (contrôlés) */
  nodes?: Node[];
  
  /** Arêtes du canvas (contrôlées) */
  edges?: Edge[];
  
  /** Callback appelé lors du changement de nœuds */
  onNodesChange?: (changes: NodeChange[]) => void;
  
  /** Callback appelé lors du changement d'arêtes */
  onEdgesChange?: (changes: EdgeChange[]) => void;
}
```

---

## Patterns et Architectures

### Pattern Module (NestJS)

Chaque module NestJS suit ce pattern :

```typescript
/**
 * Module de gestion des commentaires.
 * 
 * Fournit les fonctionnalités de commentaires et annotations sur les éléments,
 * relations et vues du modèle.
 * 
 * @module CommentsModule
 */
@Module({
  imports: [PrismaModule, NotificationsModule, CollaborationModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
```

### Pattern Hook Personnalisé (React)

Les hooks personnalisés suivent ce pattern :

```typescript
/**
 * Hook pour gérer la collaboration en temps réel.
 * 
 * Gère la connexion WebSocket, la synchronisation des curseurs,
 * et la communication entre utilisateurs.
 * 
 * @param {UseCollaborationOptions} options - Options de configuration
 * @param {string} options.viewId - ID de la vue pour la session
 * @param {User} options.user - Informations de l'utilisateur actuel
 * @returns {UseCollaborationReturn} État et fonctions de collaboration
 * 
 * @example
 * const { users, isConnected, sendMessage } = useCollaboration({
 *   viewId: 'view-123',
 *   user: { id: 'user-1', name: 'John', color: '#FF0000' }
 * });
 */
export function useCollaboration(options: UseCollaborationOptions): UseCollaborationReturn {
  // ...
}
```

### Pattern Store Zustand

Les stores Zustand suivent ce pattern :

```typescript
/**
 * Store Zustand pour gérer les onglets de vues.
 * 
 * Gère l'état des onglets ouverts, l'onglet actif, et les opérations
 * de création, sauvegarde et fermeture d'onglets.
 * 
 * @interface TabsStore
 */
interface TabsStore {
  /** Liste des onglets ouverts */
  tabs: Tab[];
  
  /** ID de l'onglet actif */
  activeTabId: string | null;
  
  /**
   * Ajoute un nouvel onglet.
   * 
   * @param {Tab} tab - Onglet à ajouter
   */
  addTab: (tab: Tab) => void;
  
  /**
   * Sauvegarde le contenu de l'onglet actif.
   * 
   * @param {Object} content - Contenu à sauvegarder
   * @returns {Promise<void>}
   */
  saveActiveTab: (content: { nodes: any[]; edges: any[] }) => Promise<void>;
}
```

---

## Standards de Code

### TypeScript

- **Types stricts** : Utilisez `strict: true` dans `tsconfig.json`
- **Évitez `any`** : Utilisez des types spécifiques ou `unknown`
- **Interfaces vs Types** : Préférez les interfaces pour les objets, types pour les unions/intersections
- **Enums** : Utilisez des enums pour les valeurs constantes

### React

- **Composants fonctionnels** : Utilisez toujours des composants fonctionnels avec hooks
- **Hooks personnalisés** : Extrayez la logique réutilisable dans des hooks
- **Memoization** : Utilisez `React.memo`, `useMemo`, `useCallback` judicieusement
- **Props** : Définissez toujours les types des props avec TypeScript

### NestJS

- **Dependency Injection** : Utilisez l'injection de dépendances pour tous les services
- **DTOs** : Utilisez des DTOs pour valider les entrées
- **Guards** : Utilisez des guards pour l'authentification et l'autorisation
- **Exception Filters** : Utilisez des exception filters pour gérer les erreurs

### Gestion d'Erreurs

```typescript
/**
 * Gère les erreurs de manière cohérente.
 * 
 * @param {Error} error - L'erreur à gérer
 * @param {string} context - Contexte de l'erreur (ex: "saveView")
 * @returns {void}
 */
function handleError(error: Error, context: string): void {
  console.error(`[${context}] Error:`, error);
  // Logging, notification, etc.
}
```

### Logging

```typescript
/**
 * Logs structurés pour le débogage.
 * 
 * Utilisez des logs avec contexte pour faciliter le débogage.
 */
console.log('[ComponentName] Action:', { param1, param2 });
console.error('[ComponentName] Error:', error);
```

---

## Exemples

### Exemple Complet : Service NestJS

```typescript
/**
 * Service de gestion des commentaires et annotations.
 * 
 * Ce service gère toutes les opérations liées aux commentaires :
 * - Création de threads de discussion
 * - Ajout de commentaires et réponses
 * - Gestion des mentions d'utilisateurs
 * - Envoi de notifications
 * 
 * @class CommentsService
 * @example
 * // Dans un controller
 * constructor(private commentsService: CommentsService) {}
 * 
 * @Post('threads')
 * async createThread(@Body() dto: CreateCommentThreadDto) {
 *   return this.commentsService.createThread(userId, dto);
 * }
 */
@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => CollaborationGateway))
    private collaborationGateway?: CollaborationGateway,
  ) {}

  /**
   * Crée un nouveau thread de commentaires.
   * 
   * @param {string} userId - ID de l'utilisateur créateur
   * @param {CreateCommentThreadDto} dto - Données du thread
   * @returns {Promise<CommentThread>} Thread créé avec commentaires
   */
  async createThread(userId: string, dto: CreateCommentThreadDto): Promise<CommentThread> {
    // Implémentation...
  }
}
```

### Exemple Complet : Composant React

```typescript
/**
 * Composant de panneau de commentaires.
 * 
 * Affiche les commentaires associés à un élément ou une relation,
 * permet d'ajouter de nouveaux commentaires et de répondre aux existants.
 * 
 * @component CommentPanel
 * @param {CommentPanelProps} props - Propriétés du composant
 * 
 * @example
 * <CommentPanel
 *   targetType="ELEMENT"
 *   targetId="elem-123"
 *   currentUserId="user-1"
 * />
 */
export default function CommentPanel({
  targetType,
  targetId,
  currentUserId,
}: CommentPanelProps) {
  // Implémentation...
}
```

### Exemple Complet : Hook Personnalisé

```typescript
/**
 * Hook pour gérer les commentaires d'une cible.
 * 
 * Fournit les fonctionnalités de récupération, création et gestion
 * des commentaires pour un élément, une relation ou une vue.
 * 
 * @param {UseCommentsOptions} options - Options de configuration
 * @returns {UseCommentsReturn} État et fonctions pour gérer les commentaires
 * 
 * @example
 * const { threads, createThread, addComment, isLoading } = useComments({
 *   targetType: 'ELEMENT',
 *   targetId: 'elem-123'
 * });
 */
export function useComments(options: UseCommentsOptions): UseCommentsReturn {
  // Implémentation...
}
```

---

## Bonnes Pratiques

### Documentation

1. **Documentez les fonctions publiques** : Toutes les fonctions exportées doivent avoir une documentation JSDoc
2. **Documentez les types complexes** : Les interfaces et types complexes doivent être documentés
3. **Ajoutez des exemples** : Les fonctions complexes doivent avoir des exemples d'utilisation
4. **Documentez les paramètres** : Tous les paramètres doivent être documentés avec leur type et description

### Code

1. **Nommage explicite** : Utilisez des noms de variables et fonctions explicites
2. **Fonctions courtes** : Les fonctions doivent faire une seule chose
3. **Évitez la duplication** : Extrayez le code répétitif dans des fonctions/hooks réutilisables
4. **Gestion d'erreurs** : Toujours gérer les erreurs de manière appropriée

### Tests

1. **Tests unitaires** : Testez les fonctions et services isolément
2. **Tests d'intégration** : Testez les interactions entre composants
3. **Tests E2E** : Testez les flux utilisateur complets

---

## Outils de Documentation

### Génération de Documentation

```bash
# Installer TypeDoc (générateur de documentation TypeScript)
npm install --save-dev typedoc

# Générer la documentation
npx typedoc --out docs/api src/
```

### Configuration TypeDoc

Créez un fichier `typedoc.json` :

```json
{
  "entryPoints": ["apps/server/src", "apps/web"],
  "out": "docs/api",
  "exclude": ["**/*.spec.ts", "**/*.test.ts", "node_modules"],
  "theme": "default",
  "name": "ArchiModeler API Documentation"
}
```

---

## Références

- [JSDoc Documentation](https://jsdoc.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Documentation](https://react.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeDoc Documentation](https://typedoc.org/)

---

*Guide de Documentation du Code ArchiModeler - Version 1.0*  
*Dernière mise à jour : 2025-11-30*

