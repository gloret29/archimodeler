# ArchiModeler - Spécifications Techniques et Fonctionnelles

## Vue d'ensemble

ArchiModeler est une application web collaborative pour la modélisation d'architecture d'entreprise basée sur le standard ArchiMate 3.2. L'application permet de créer, gérer et visualiser des modèles d'architecture à travers une interface moderne et intuitive.

## Architecture Technique

### Stack Technologique

#### Frontend
- **Framework**: Next.js 16.0.5 (App Router)
- **Langage**: TypeScript
- **UI Components**: 
  - shadcn/ui (composants réutilisables)
  - Lucide React (icônes)
- **Diagramming**: @xyflow/react (React Flow)
- **Styling**: Tailwind CSS

#### Backend
- **Framework**: NestJS
- **Langage**: TypeScript
- **ORM**: Prisma 5.22.0
- **Base de données**: PostgreSQL
- **Authentification**: JWT (localStorage)

#### Monorepo
- **Gestionnaire**: Turborepo 2.6.1
- **Structure**:
  - `apps/web` - Application frontend Next.js
  - `apps/server` - API backend NestJS
  - `apps/docs` - Documentation
  - `packages/database` - Schéma Prisma partagé
  - `packages/types` - Types TypeScript partagés
  - `packages/ui` - Composants UI partagés

### Architecture de Base de Données

#### Modèle de Données Principal

```prisma
// Métamodèle ArchiMate
model Metamodel {
  id          String        @id @default(uuid())
  name        String        @unique
  version     String
  description String?
  conceptTypes ConceptType[]
}

// Types de concepts ArchiMate
model ConceptType {
  id           String    @id @default(uuid())
  name         String
  category     String    // Layer (Business, Application, Technology, etc.)
  metamodelId  String
  metamodel    Metamodel @relation(fields: [metamodelId], references: [id])
  elements     Element[]
  
  @@unique([name, metamodelId])
}

// Éléments du modèle
model Element {
  id             String      @id @default(uuid())
  name           String
  conceptTypeId  String
  conceptType    ConceptType @relation(fields: [conceptTypeId], references: [id])
  modelPackageId String
  modelPackage   ModelPackage @relation(fields: [modelPackageId], references: [id])
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

// Packages de modèles
model ModelPackage {
  id          String    @id @default(uuid())
  name        String
  description String?
  elements    Element[]
  views       View[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// Vues de diagrammes
model View {
  id             String       @id @default(uuid())
  name           String
  content        Json         // Stocke nodes et edges
  modelPackageId String
  modelPackage   ModelPackage @relation(fields: [modelPackageId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}
```

## Fonctionnalités

### 1. Gestion des Éléments ArchiMate

#### 1.1 Création d'Éléments

**Description**: Permet de créer des éléments ArchiMate depuis la palette ou le repository.

**Flux utilisateur**:
1. L'utilisateur glisse un élément depuis la palette vers le canvas
2. Le frontend envoie une requête POST à `/model/elements`
3. Le backend crée automatiquement:
   - Le metamodel "ArchiMate 3.2" (si inexistant)
   - Le ConceptType correspondant (si inexistant)
   - L'élément avec le package par défaut
4. L'élément apparaît sur le canvas et dans le repository

**Endpoints API**:
```typescript
POST /model/elements
Body: {
  name: string;
  type: string;      // Ex: "BusinessActor"
  layer: string;     // Ex: "Business"
  packageId: string; // "default-package-id" ou UUID
}
Response: Element
```

**Implémentation Backend**:
```typescript
// apps/server/src/model/model.service.ts
async createElementSimple(dto: CreateElementDto) {
  // 1. Créer/trouver le package par défaut
  let packageId = dto.packageId;
  if (packageId === 'default-package-id') {
    let defaultPackage = await this.prisma.modelPackage.findFirst({
      where: { name: 'Default Package' }
    });
    if (!defaultPackage) {
      defaultPackage = await this.prisma.modelPackage.create({
        data: {
          name: 'Default Package',
          description: 'Default model package'
        }
      });
    }
    packageId = defaultPackage.id;
  }

  // 2. Créer/trouver le metamodel
  let metamodel = await this.prisma.metamodel.findUnique({
    where: { name: 'ArchiMate 3.2' }
  });
  if (!metamodel) {
    metamodel = await this.prisma.metamodel.create({
      data: {
        name: 'ArchiMate 3.2',
        version: '3.2',
        description: 'ArchiMate 3.2 Metamodel'
      }
    });
  }

  // 3. Créer/trouver le concept type
  let conceptType = await this.prisma.conceptType.findUnique({
    where: {
      name_metamodelId: {
        name: dto.type,
        metamodelId: metamodel.id
      }
    }
  });
  if (!conceptType) {
    conceptType = await this.prisma.conceptType.create({
      data: {
        name: dto.type,
        category: dto.layer,
        metamodelId: metamodel.id
      }
    });
  }

  // 4. Créer l'élément
  const element = await this.prisma.element.create({
    data: {
      name: dto.name,
      conceptTypeId: conceptType.id,
      modelPackageId: packageId
    },
    include: {
      conceptType: true
    }
  });

  await this.searchService.indexElement(element);
  return element;
}
```

#### 1.2 Renommage d'Éléments

**Description**: Permet de renommer un élément via double-clic ou menu contextuel avec une interface moderne.

**Flux utilisateur**:
1. **Double-clic** sur un nœud OU **Clic droit → Rename**
2. Une belle dialog modale s'ouvre avec:
   - Titre "Rename Element"
   - Input pré-rempli avec le nom actuel
   - Focus automatique et sélection du texte
   - Boutons "Cancel" et "Rename"
3. L'utilisateur modifie le nom et valide
4. Le backend met à jour l'élément
5. Le nom est mis à jour partout (canvas, repository)

**Composant RenameDialog**:
```typescript
// apps/web/components/ui/RenameDialog.tsx
interface RenameDialogProps {
    isOpen: boolean;
    currentName: string;
    onConfirm: (newName: string) => void;
    onCancel: () => void;
}

export default function RenameDialog({
    isOpen,
    currentName,
    onConfirm,
    onCancel
}: RenameDialogProps) {
    const [name, setName] = useState(currentName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(currentName);
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, currentName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && name !== currentName) {
            onConfirm(name.trim());
        } else {
            onCancel();
        }
    };

    // ... UI avec backdrop, input, boutons
}
```

**Endpoints API**:
```typescript
PUT /model/elements/:id
Body: {
  name: string;
}
Response: Element
```

**Fonctionnalités UX**:
- ✅ Focus automatique sur l'input
- ✅ Sélection automatique du texte
- ✅ Validation avec Enter
- ✅ Annulation avec Escape
- ✅ Bouton "Rename" désactivé si nom vide ou inchangé
- ✅ Backdrop semi-transparent cliquable pour fermer
- ✅ Design moderne avec ombre et bordures arrondies

#### 1.3 Suppression d'Éléments

**Description**: Permet de supprimer un élément de la vue ou du repository.

**Options de suppression**:

1. **Remove from View** (Clic droit → Remove from View)
   - Supprime uniquement du canvas actuel
   - L'élément reste dans le repository
   - Aucun appel API

2. **Delete from Repository** (Clic droit → Delete from Repository)
   - Supprime complètement l'élément
   - Confirmation requise
   - Supprime de toutes les vues
   - Appel API DELETE

**Endpoints API**:
```typescript
DELETE /model/elements/:id
Response: void
```

### 2. Gestion des Vues

#### 2.1 Création de Vues

**Description**: Permet de sauvegarder l'état actuel du canvas comme une vue.

**Flux utilisateur**:
1. L'utilisateur clique sur "Save View"
2. Un prompt demande le nom de la vue
3. Le contenu (nodes + edges) est envoyé au backend
4. La vue est sauvegardée avec le package associé

**Endpoints API**:
```typescript
POST /model/views
Body: {
  name: string;
  content: {
    nodes: Node[];
    edges: Edge[];
  };
  modelPackage: {
    connect: { id: string }
  };
}
Response: View
```

**Gestion du Package par Défaut**:
```typescript
// apps/server/src/model/model.service.ts
async createView(data: Prisma.ViewCreateInput) {
  // Gérer le package par défaut
  if (data.modelPackage && 'connect' in data.modelPackage) {
    const connectData = data.modelPackage.connect as any;
    if (connectData.id === 'default-package-id') {
      let defaultPackage = await this.prisma.modelPackage.findFirst({
        where: { name: 'Default Package' }
      });
      if (!defaultPackage) {
        defaultPackage = await this.prisma.modelPackage.create({
          data: {
            name: 'Default Package',
            description: 'Default model package'
          }
        });
      }
      data = {
        ...data,
        modelPackage: { connect: { id: defaultPackage.id } }
      };
    }
  }
  return this.prisma.view.create({ data });
}
```

### 3. Relations ArchiMate (Smart Connectors)

#### 3.1 Validation des Relations

**Description**: Valide automatiquement les relations possibles entre deux éléments selon ArchiMate 3.2.

**Flux utilisateur**:
1. L'utilisateur connecte deux nœuds
2. Le système vérifie les relations valides
3. Si aucune relation valide → Message d'erreur
4. Si une seule relation valide → Application automatique
5. Si plusieurs relations valides → Menu de sélection

**Implémentation**:
```typescript
// apps/web/lib/metamodel.ts
export function getValidRelations(
  sourceType: string,
  targetType: string
): string[] {
  const key = `${sourceType}-${targetType}`;
  return ARCHIMATE_RELATIONS[key] || [];
}

// Exemple de règles
const ARCHIMATE_RELATIONS: Record<string, string[]> = {
  'BusinessActor-BusinessRole': ['Assignment'],
  'BusinessRole-BusinessProcess': ['Assignment', 'Serving'],
  'BusinessProcess-ApplicationService': ['Realization', 'Serving'],
  // ... autres règles ArchiMate
};
```

**Composant ConnectionMenu**:
```typescript
// apps/web/components/canvas/ConnectionMenu.tsx
interface ConnectionMenuProps {
    position: { x: number; y: number };
    relations: string[];
    onSelect: (relation: string) => void;
    onClose: () => void;
}

export default function ConnectionMenu({
    position,
    relations,
    onSelect,
    onClose
}: ConnectionMenuProps) {
    return (
        <div
            className="fixed z-50 bg-white rounded-lg shadow-lg"
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            <div className="p-2">
                <h3 className="text-sm font-semibold mb-2">
                    Select Relationship
                </h3>
                {relations.map((relation) => (
                    <button
                        key={relation}
                        onClick={() => onSelect(relation)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    >
                        {relation}
                    </button>
                ))}
            </div>
        </div>
    );
}
```

### 4. Menu Contextuel (Clic Droit)

**Description**: Menu contextuel riche pour les nœuds du canvas.

**Options disponibles**:
1. **Rename** - Ouvre la dialog de renommage
2. **Remove from View** - Supprime du canvas uniquement
3. **Delete from Repository** - Supprime complètement (avec confirmation)

**Composant NodeContextMenu**:
```typescript
// apps/web/components/canvas/NodeContextMenu.tsx
interface NodeContextMenuProps {
    position: { x: number; y: number };
    nodeData: {
        label: string;
        elementId?: string;
    };
    onRename: () => void;
    onRemoveFromView: () => void;
    onDeleteFromRepository: () => void;
    onClose: () => void;
}

export default function NodeContextMenu({
    position,
    nodeData,
    onRename,
    onRemoveFromView,
    onDeleteFromRepository,
    onClose
}: NodeContextMenuProps) {
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="fixed z-50 bg-white rounded-lg shadow-lg"
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
            >
                <div className="px-3 py-2 text-xs font-semibold">
                    {nodeData.label}
                </div>
                <button onClick={onRename}>
                    <Edit2 className="h-4 w-4" />
                    Rename
                </button>
                <button onClick={onRemoveFromView}>
                    <X className="h-4 w-4" />
                    Remove from View
                </button>
                <div className="border-t" />
                <button onClick={onDeleteFromRepository}>
                    <Trash2 className="h-4 w-4" />
                    Delete from Repository
                </button>
            </div>
        </>
    );
}
```

## Patterns et Bonnes Pratiques

### 1. Gestion d'État

**React Hooks utilisés**:
- `useState` - État local des composants
- `useCallback` - Mémorisation des callbacks
- `useRef` - Références DOM
- `useEffect` - Effets de bord

**Exemple de gestion d'état complexe**:
```typescript
const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    currentName: string;
    elementId: string | null;
}>({
    isOpen: false,
    nodeId: null,
    currentName: '',
    elementId: null,
});
```

### 2. Gestion des Erreurs

**Frontend**:
```typescript
try {
    const res = await fetch(url, options);
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Error:', res.status, errorText);
        alert(`Failed: ${res.status} - ${errorText.substring(0, 200)}`);
        return;
    }
    const data = await res.json();
    // Traitement
} catch (err) {
    console.error(err);
    alert('Error: ' + (err as Error).message);
}
```

**Backend**:
```typescript
try {
    // Logique métier
    console.log('Creating element with DTO:', dto);
    const element = await this.prisma.element.create({ data });
    console.log('Element created successfully:', element.id);
    return element;
} catch (error) {
    console.error('Error in createElementSimple:', error);
    throw error;
}
```

### 3. Authentification

**Stockage du Token**:
```typescript
const token = localStorage.getItem('accessToken');
```

**Headers API**:
```typescript
headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
}
```

### 4. Drag & Drop

**Implémentation React Flow**:
```typescript
const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    
    const dataStr = event.dataTransfer.getData('application/reactflow');
    const { type, layer, label, existingId } = JSON.parse(dataStr);
    
    const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
    });
    
    // Créer l'élément si nouveau
    if (!existingId) {
        const res = await fetch('/model/elements', {
            method: 'POST',
            body: JSON.stringify({ name: label, type, layer, packageId })
        });
        const newElement = await res.json();
        elementId = newElement.id;
    }
    
    // Ajouter au canvas
    const newNode = {
        id: getId(),
        type: 'archimate',
        position,
        data: { label, type, layer, elementId }
    };
    setNodes((nds) => nds.concat(newNode));
}, [reactFlowInstance, setNodes]);
```

## Sécurité

### 1. Authentification JWT
- Token stocké dans localStorage
- Envoyé dans header Authorization
- Validation côté serveur

### 2. Validation des Données
- Validation Prisma au niveau du schéma
- Validation NestJS avec DTOs
- Validation frontend avant envoi

### 3. Contraintes de Base de Données
- Foreign keys pour l'intégrité référentielle
- Unique constraints sur les noms
- Indexes pour les performances

## Performance

### 1. Optimisations Frontend
- `useCallback` pour éviter les re-renders
- Mémorisation des composants lourds
- Lazy loading des composants

### 2. Optimisations Backend
- Indexes sur les champs fréquemment requêtés
- Includes Prisma pour éviter les N+1
- Caching (à implémenter)

### 3. Optimisations Base de Données
- Indexes sur foreign keys
- Unique indexes pour les recherches
- Pagination (à implémenter)

## Déploiement

### Prérequis
- Node.js 22.17.0
- PostgreSQL
- npm ou pnpm

### Variables d'Environnement
```env
DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

### Commandes
```bash
# Installation
npm install

# Génération Prisma
npx prisma generate

# Migrations
npx prisma migrate dev

# Seed
npx ts-node prisma/seed.ts

# Développement
npm run dev

# Build
npm run build

# Production
npm run start
```

## Roadmap

### Court Terme
- [ ] Intégrer RenameDialog dans ModelTree
- [ ] Améliorer la confirmation de suppression avec dialog personnalisée
- [ ] Ajouter la gestion des dossiers dans le repository
- [ ] Implémenter la recherche d'éléments

### Moyen Terme
- [ ] Collaboration temps réel (Yjs + Liveblocks)
- [ ] Export de diagrammes (PNG, SVG, PDF)
- [ ] Import/Export ArchiMate XML
- [ ] Versioning des modèles

### Long Terme
- [ ] IA pour suggestions de modélisation
- [ ] Templates de modèles
- [ ] Analyse d'impact
- [ ] Génération de documentation

## Support et Contribution

### Documentation
- Code documenté avec JSDoc
- README.md à jour
- Spécifications techniques (ce document)

### Tests
- Tests unitaires (à implémenter)
- Tests d'intégration (à implémenter)
- Tests E2E (à implémenter)

### Git Workflow
- Branches feature/
- Commits conventionnels
- Pull requests avec review

---

**Version**: 1.0.0  
**Date**: 29 novembre 2025  
**Auteur**: ArchiModeler Team
