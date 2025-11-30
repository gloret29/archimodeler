# Recommandations de Refactoring ArchiModeler

> Analyse du code et propositions d'amélioration pour la maintenabilité, la performance et la qualité du code

## 📋 Table des Matières

1. [Priorité Haute](#priorité-haute)
2. [Priorité Moyenne](#priorité-moyenne)
3. [Priorité Basse](#priorité-basse)
4. [Améliorations Architecturales](#améliorations-architecturales)
5. [Plan d'Action](#plan-daction)

---

## Priorité Haute

### 1. Refactoring du Composant Studio (`apps/web/app/[locale]/studio/page.tsx`)

**Problème** :
- Composant monolithique de 640+ lignes
- 19 `useState` et `useEffect` (complexité élevée)
- 9 utilisations de `any` (perte de type safety)
- Mélange de logique métier, gestion d'état et rendu
- Difficile à tester et maintenir

**Recommandations** :

#### 1.1 Extraire la logique métier dans des hooks personnalisés

```typescript
// hooks/useStudioState.ts
export function useStudioState() {
  const [repositoryWidth, setRepositoryWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  // ... autres états
  
  return {
    repositoryWidth,
    setRepositoryWidth,
    isResizing,
    setIsResizing,
    selectedElement,
    setSelectedElement,
    // ...
  };
}

// hooks/useCanvasContent.ts
export function useCanvasContent(activeTabId: string | null) {
  const [currentCanvasContent, setCurrentCanvasContent] = useState<CanvasContent | null>(null);
  // Logique de gestion du contenu du canvas
  return { currentCanvasContent, setCurrentCanvasContent };
}

// hooks/useSaveHandler.ts
export function useSaveHandler() {
  const { saveActiveTab } = useTabsStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = useCallback(async () => {
    // Logique de sauvegarde
  }, [/* deps */]);
  
  return { handleSave, isSaving };
}
```

#### 1.2 Créer des composants plus petits

```typescript
// components/studio/StudioHeader.tsx
export function StudioHeader({ onSave, onSaveAs, isSaving }: StudioHeaderProps) {
  // Header avec boutons Save/Save As
}

// components/studio/StudioLayout.tsx
export function StudioLayout({ 
  repositoryWidth, 
  onRepositoryResize,
  children 
}: StudioLayoutProps) {
  // Layout avec repository redimensionnable
}
```

#### 1.3 Remplacer les types `any`

```typescript
// types/studio.ts
export interface CanvasContent {
  nodes: Node[];
  edges: Edge[];
}

export interface SelectedElement {
  id: string;
  name: string;
  type: string;
}

export interface SelectedRelationship {
  id: string;
  name: string;
  type: string;
}
```

**Impact** : Réduction de la complexité cyclomatique, meilleure testabilité, meilleure maintenabilité

---

### 2. Centraliser la Gestion des Erreurs

**Problème** :
- 168 occurrences de `console.log/error/warn` dans le frontend
- Mélange de `console.error`, `alert()`, et `useDialog()`
- Pas de logging structuré côté backend
- Gestion d'erreurs incohérente

**Recommandations** :

#### 2.1 Créer un service de logging frontend

```typescript
// lib/logger.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console[level](`[${level.toUpperCase()}]`, message, context || '');
    }
    // En production, envoyer à un service de logging (Sentry, LogRocket, etc.)
  }
  
  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, { error, ...context });
  }
  
  // ... autres méthodes
}

export const logger = new Logger();
```

#### 2.2 Créer un hook pour la gestion d'erreurs

```typescript
// hooks/useErrorHandler.ts
export function useErrorHandler() {
  const { alert } = useDialog();
  const { toast } = useToast();
  
  const handleError = useCallback(async (
    error: Error | unknown,
    context?: string
  ) => {
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    logger.error(message, error instanceof Error ? error : undefined, { context });
    
    await alert({
      title: 'Erreur',
      message: message,
      type: 'error',
    });
  }, [alert]);
  
  return { handleError };
}
```

#### 2.3 Améliorer le logging backend

```typescript
// apps/server/src/common/logger.service.ts
@Injectable()
export class LoggerService {
  private readonly logger = new Logger();
  
  log(context: string, message: string, meta?: Record<string, unknown>) {
    this.logger.log(message, { context, ...meta });
  }
  
  error(context: string, message: string, trace?: string, meta?: Record<string, unknown>) {
    this.logger.error(message, { context, trace, ...meta });
  }
}
```

**Impact** : Meilleure traçabilité, debugging facilité, expérience utilisateur améliorée

---

### 3. Extraire les Appels API dans des Hooks/Services

**Problème** :
- 30 fichiers avec des appels API directs (`api.get`, `api.post`, etc.)
- Duplication de code pour la gestion des erreurs
- Pas de cache ni de retry automatique
- Difficile à tester

**Recommandations** :

#### 3.1 Créer des hooks pour chaque ressource

```typescript
// hooks/api/useElements.ts
export function useElements(packageId: string) {
  const [elements, setElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchElements = async () => {
      setLoading(true);
      try {
        const data = await api.get<Element[]>(`/model/elements?packageId=${packageId}`);
        setElements(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch elements'));
      } finally {
        setLoading(false);
      }
    };
    
    if (packageId) {
      fetchElements();
    }
  }, [packageId]);
  
  return { elements, loading, error, refetch: () => fetchElements() };
}

// hooks/api/useViews.ts
export function useViews(packageId: string) {
  // ...
}

// hooks/api/useComments.ts (déjà existant, mais améliorer)
```

#### 3.2 Créer un client API avec retry et cache

```typescript
// lib/api/client-enhanced.ts
class ApiClient {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  async get<T>(url: string, options?: { cache?: boolean; retry?: number }): Promise<T> {
    const cacheKey = `GET:${url}`;
    
    // Vérifier le cache
    if (options?.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data as T;
      }
    }
    
    // Retry logic
    const maxRetries = options?.retry ?? 3;
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const data = await api.get<T>(url);
        
        // Mettre en cache
        if (options?.cache) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
        }
        
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError;
  }
}

export const apiClient = new ApiClient();
```

**Impact** : Réduction de la duplication, meilleure performance (cache), meilleure résilience (retry)

---

## Priorité Moyenne

### 4. Refactoring des Services Backend Volumineux

**Problème** :
- `model.service.ts` : 891 lignes
- `comments.service.ts` : 700+ lignes
- Violation du principe de responsabilité unique (SRP)
- Difficile à tester et maintenir

**Recommandations** :

#### 4.1 Diviser `ModelService` en services spécialisés

```typescript
// model/services/elements.service.ts
@Injectable()
export class ElementsService {
  constructor(private prisma: PrismaService) {}
  
  async create(dto: CreateElementDto): Promise<Element> {
    // Logique de création d'élément
  }
  
  async update(id: string, dto: UpdateElementDto): Promise<Element> {
    // Logique de mise à jour
  }
  
  // ... autres méthodes liées aux éléments
}

// model/services/relationships.service.ts
@Injectable()
export class RelationshipsService {
  // Logique spécifique aux relations
}

// model/services/views.service.ts
@Injectable()
export class ViewsService {
  // Logique spécifique aux vues
}

// model/model.service.ts (orchestrateur)
@Injectable()
export class ModelService {
  constructor(
    private elementsService: ElementsService,
    private relationshipsService: RelationshipsService,
    private viewsService: ViewsService,
  ) {}
  
  // Méthodes qui coordonnent les services spécialisés
}
```

#### 4.2 Extraire la logique métier dans des classes dédiées

```typescript
// model/validators/relationship-validator.ts
export class RelationshipValidator {
  validate(sourceType: string, targetType: string, relationshipType: string): boolean {
    // Logique de validation des relations ArchiMate
  }
}

// model/builders/element-builder.ts
export class ElementBuilder {
  buildFromConceptType(conceptType: ConceptType, data: Partial<Element>): Element {
    // Logique de construction d'élément
  }
}
```

**Impact** : Meilleure testabilité, respect du SRP, code plus maintenable

---

### 5. Standardiser les Types et Interfaces

**Problème** :
- Interfaces dupliquées dans plusieurs fichiers
- Types `any` utilisés à la place de types spécifiques
- Pas de types partagés entre frontend et backend

**Recommandations** :

#### 5.1 Créer un package de types partagés

```typescript
// packages/types/src/index.ts
export interface Element {
  id: string;
  name: string;
  type: string;
  packageId: string;
  // ...
}

export interface Relationship {
  id: string;
  name: string;
  type: string;
  sourceId: string;
  targetId: string;
  // ...
}

export interface View {
  id: string;
  name: string;
  packageId: string;
  content: {
    nodes: Node[];
    edges: Edge[];
  };
  // ...
}

// packages/types/src/api.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### 5.2 Utiliser les types Prisma générés

```typescript
// Au lieu de redéfinir les interfaces
import { Element, Relationship, View } from '@prisma/client';
import type { Element as ElementWithRelations } from '@prisma/client';
```

**Impact** : Cohérence des types, réduction de la duplication, meilleure autocomplétion

---

### 6. Améliorer la Gestion d'État Globale

**Problème** :
- Plusieurs stores Zustand non coordonnés
- État dupliqué entre stores
- Pas de middleware pour le logging/persistance

**Recommandations** :

#### 6.1 Créer un store unifié avec slices

```typescript
// store/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { tabsSlice } from './slices/tabsSlice';
import { canvasSlice } from './slices/canvasSlice';
import { selectionSlice } from './slices/selectionSlice';

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (...a) => ({
        ...tabsSlice(...a),
        ...canvasSlice(...a),
        ...selectionSlice(...a),
      }),
      { name: 'archimodeler-store' }
    )
  )
);
```

#### 6.2 Ajouter des middlewares pour la persistance sélective

```typescript
// store/middleware/persistence.ts
export const persistenceMiddleware = (config: any) => (set: any, get: any, api: any) =>
  config(
    (...args: any[]) => {
      set(...args);
      // Persister seulement certaines parties de l'état
      const state = get();
      localStorage.setItem('app-state', JSON.stringify({
        tabs: state.tabs,
        // Ne pas persister le contenu du canvas (trop volumineux)
      }));
    },
    get,
    api
  );
```

**Impact** : État plus prévisible, meilleure performance, debugging facilité

---

## Priorité Basse

### 7. Optimiser les Performances

**Recommandations** :

#### 7.1 Mémoriser les composants coûteux

```typescript
// components/studio/ModelTree.tsx
export const ModelTree = React.memo(({ elements, onSelect }: ModelTreeProps) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.elements === nextProps.elements;
});
```

#### 7.2 Utiliser `useMemo` et `useCallback` judicieusement

```typescript
// Dans les composants avec beaucoup de calculs
const filteredElements = useMemo(() => {
  return elements.filter(el => el.name.includes(searchQuery));
}, [elements, searchQuery]);

const handleSelect = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);
```

#### 7.3 Implémenter la pagination/virtualisation pour les grandes listes

```typescript
// components/common/VirtualizedList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedList<T>({ items, renderItem }: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  // ...
}
```

**Impact** : Meilleure réactivité, réduction de la consommation mémoire

---

### 8. Améliorer les Tests

**Recommandations** :

#### 8.1 Ajouter des tests unitaires pour les hooks

```typescript
// hooks/__tests__/useComments.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useComments } from '../useComments';

describe('useComments', () => {
  it('should fetch comments for targets', async () => {
    const { result } = renderHook(() => useComments([
      { type: 'ELEMENT', id: 'elem-1' }
    ]));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.commentsMap).toBeDefined();
  });
});
```

#### 8.2 Ajouter des tests d'intégration pour les services

```typescript
// apps/server/src/comments/__tests__/comments.service.spec.ts
describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: PrismaService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CommentsService, PrismaService],
    }).compile();
    
    service = module.get<CommentsService>(CommentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });
  
  it('should create a comment thread', async () => {
    // Test
  });
});
```

**Impact** : Confiance dans les refactorings, détection précoce des régressions

---

## Améliorations Architecturales

### 9. Implémenter un Pattern Repository

**Recommandations** :

```typescript
// apps/server/src/common/repositories/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaService) {}
  
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(filters?: any): Promise<T[]>;
  abstract create(data: any): Promise<T>;
  abstract update(id: string, data: any): Promise<T>;
  abstract delete(id: string): Promise<void>;
}

// apps/server/src/model/repositories/elements.repository.ts
@Injectable()
export class ElementsRepository extends BaseRepository<Element> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
  
  async findById(id: string): Promise<Element | null> {
    return this.prisma.element.findUnique({ where: { id } });
  }
  
  // ...
}
```

**Impact** : Abstraction de la couche données, facilité de changement de base de données

---

### 10. Implémenter un Système d'Événements

**Recommandations** :

```typescript
// apps/server/src/common/events/event-emitter.service.ts
@Injectable()
export class EventEmitterService {
  private emitter = new EventEmitter();
  
  emit(event: string, data: any) {
    this.emitter.emit(event, data);
  }
  
  on(event: string, handler: (data: any) => void) {
    this.emitter.on(event, handler);
  }
}

// Utilisation
@Injectable()
export class CommentsService {
  constructor(
    private eventEmitter: EventEmitterService,
    // ...
  ) {}
  
  async createThread(userId: string, dto: CreateCommentThreadDto) {
    const thread = await this.prisma.commentThread.create({ /* ... */ });
    
    // Émettre un événement
    this.eventEmitter.emit('comment.thread.created', {
      threadId: thread.id,
      userId,
      targetType: dto.targetType,
      targetId: dto.targetId,
    });
    
    return thread;
  }
}
```

**Impact** : Découplage des modules, extensibilité

---

## Plan d'Action

### Phase 1 : Fondations (2-3 semaines)
1. ✅ Créer le service de logging
2. ✅ Créer le hook `useErrorHandler`
3. ✅ Extraire les types dans `packages/types`
4. ✅ Créer les hooks API de base (`useElements`, `useViews`, etc.)

### Phase 2 : Refactoring Studio (2-3 semaines)
1. ✅ Diviser `studio/page.tsx` en hooks et composants plus petits
2. ✅ Remplacer tous les `any` par des types spécifiques
3. ✅ Implémenter le store unifié avec slices

### Phase 3 : Backend (2-3 semaines)
1. ✅ Diviser `ModelService` en services spécialisés
2. ✅ Implémenter le pattern Repository
3. ✅ Améliorer le logging backend

### Phase 4 : Optimisations (1-2 semaines)
1. ✅ Ajouter la mémorisation des composants
2. ✅ Implémenter le cache API
3. ✅ Ajouter la virtualisation pour les grandes listes

### Phase 5 : Tests (2 semaines)
1. ✅ Ajouter des tests unitaires pour les hooks
2. ✅ Ajouter des tests d'intégration pour les services
3. ✅ Ajouter des tests E2E pour les flux critiques

---

## Métriques de Succès

- **Complexité cyclomatique** : Réduction de 30% dans les composants principaux
- **Couverture de tests** : Atteindre 70% de couverture
- **Types `any`** : Réduire de 90% (de 9 à <1 dans studio/page.tsx)
- **Duplication de code** : Réduction de 40%
- **Temps de chargement** : Amélioration de 20% grâce au cache et à la mémorisation

---

*Document de Recommandations de Refactoring - Version 1.0*  
*Dernière mise à jour : 2025-11-30*

