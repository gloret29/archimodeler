# Fonctionnalités de Renommage - État d'avancement

## ✅ Fonctionnalités implémentées

### 1. Renommage via double-clic
- ✅ Double-clic sur un nœud ouvre un prompt natif
- ✅ Le renommage met à jour le backend
- ✅ Le renommage met à jour l'affichage local

### 2. Renommage via menu contextuel
- ✅ Clic droit sur un nœud → Menu contextuel
- ✅ Option "Rename" disponible
- ✅ Utilise un prompt natif

### 3. Renommage depuis le Repository
- ✅ Boutons Rename/Delete au survol
- ✅ Utilise un prompt natif

## 🎨 Composant RenameDialog créé

Un beau composant de dialog personnalisé a été créé dans :
`apps/web/components/ui/RenameDialog.tsx`

### Fonctionnalités du composant :
- ✅ Design moderne avec backdrop
- ✅ Focus automatique sur l'input
- ✅ Sélection automatique du texte
- ✅ Support des touches Escape et Enter
- ✅ Boutons Cancel et Rename
- ✅ Validation (désactive le bouton si nom vide ou inchangé)

## 🔧 Intégration à faire

Pour utiliser le RenameDialog au lieu du prompt natif, il faut :

1. **Dans ModelingCanvas.tsx** :
   - Importer `RenameDialog`
   - Ajouter un état `renameDialog` avec `{ isOpen, nodeId, currentName, elementId }`
   - Modifier `onNodeDoubleClick` pour ouvrir la dialog au lieu du prompt
   - Modifier `handleRenameNode` (menu contextuel) pour utiliser la dialog
   - Ajouter `handleRenameConfirm` pour gérer la confirmation
   - Rendre le composant `<RenameDialog />` à la fin du JSX

2. **Dans ModelTree.tsx** :
   - Même approche pour remplacer les prompts par la dialog

## 📝 Exemple d'intégration

```tsx
// État
const [renameDialog, setRenameDialog] = useState({
    isOpen: false,
    nodeId: null,
    currentName: '',
    elementId: null,
});

// Handler double-clic
const onNodeDoubleClick = useCallback((event, node) => {
    if (!node.data.elementId) return;
    setRenameDialog({
        isOpen: true,
        nodeId: node.id,
        currentName: String(node.data.label),
        elementId: node.data.elementId,
    });
}, []);

// Handler confirmation
const handleRenameConfirm = async (newName) => {
    // ... logique de renommage
    setRenameDialog({ isOpen: false, nodeId: null, currentName: '', elementId: null });
};

// JSX
<RenameDialog
    isOpen={renameDialog.isOpen}
    currentName={renameDialog.currentName}
    onConfirm={handleRenameConfirm}
    onCancel={() => setRenameDialog({ ...renameDialog, isOpen: false })}
/>
```

## ⚠️ Note

Le fichier ModelingCanvas.tsx a été restauré depuis Git car une tentative d'édition l'a corrompu.
Le composant RenameDialog est prêt à l'emploi et peut être intégré quand vous le souhaitez.
