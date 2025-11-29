# Guide de Renommage des Vues

## Fonctionnalité

Le système d'onglets permet maintenant de **renommer les vues** de trois façons différentes :

### 1. Double-clic sur l'onglet

**Étapes** :
1. Double-cliquer sur le nom de l'onglet
2. Une boîte de dialogue s'ouvre
3. Entrer le nouveau nom
4. Cliquer sur "Rename" ou appuyer sur Entrée

**Avantages** : Rapide et intuitif

---

### 2. Menu contextuel (clic droit)

**Étapes** :
1. Faire un clic droit sur l'onglet
2. Sélectionner "Rename" dans le menu
3. Entrer le nouveau nom dans la boîte de dialogue
4. Valider

**Avantages** : Découvrable, offre aussi l'option "Close"

---

### 3. Depuis le store (programmatique)

```typescript
import { useTabsStore } from '@/store/useTabsStore';

const { updateTabName } = useTabsStore();

// Renommer un onglet
updateTabName('tab-id', 'Nouveau nom');
```

---

## Composants

### RenameTabDialog

**Fichier** : `components/studio/RenameTabDialog.tsx`

Dialogue modal pour renommer une vue.

**Props** :
- `open: boolean` - État d'ouverture du dialogue
- `currentName: string` - Nom actuel de la vue
- `onOpenChange: (open: boolean) => void` - Callback de changement d'état
- `onRename: (newName: string) => void` - Callback de validation

**Fonctionnalités** :
- Validation : le nom ne peut pas être vide
- Auto-focus sur le champ de saisie
- Validation par Entrée ou bouton
- Annulation par Échap ou bouton Cancel

---

### ViewTabs (mis à jour)

**Fichier** : `components/studio/ViewTabs.tsx`

**Nouvelles fonctionnalités** :
- Double-clic pour renommer
- Menu contextuel avec options :
  - ✏️ Rename
  - ❌ Close
- Gestion de l'état du dialogue de renommage

---

## Store Zustand

### updateTabName

**Signature** :
```typescript
updateTabName: (tabId: string, newName: string) => void
```

**Comportement** :
- Trouve l'onglet par son ID
- Met à jour son nom
- Conserve toutes les autres propriétés

---

## UX/UI

### Indicateurs visuels

- **Hover** : L'onglet change de couleur au survol
- **Active** : L'onglet actif a un fond distinct
- **Menu contextuel** : Icônes claires pour chaque action
- **Dialogue** : Design cohérent avec le reste de l'application

### Raccourcis

| Action | Méthode |
|--------|---------|
| Renommer | Double-clic sur l'onglet |
| Renommer | Clic droit → Rename |
| Fermer | Clic sur X |
| Fermer | Clic droit → Close |
| Nouveau | Clic sur + |

---

## Tests

### Test de renommage par double-clic

1. Ouvrir une vue dans le Studio
2. Double-cliquer sur l'onglet "Main View"
3. Vérifier que le dialogue s'ouvre
4. Entrer "Ma Vue Personnalisée"
5. Cliquer sur "Rename"
6. Vérifier que l'onglet affiche le nouveau nom

**Résultat attendu** : ✅ Le nom est mis à jour

---

### Test de renommage par menu contextuel

1. Faire un clic droit sur un onglet
2. Vérifier que le menu s'affiche avec "Rename" et "Close"
3. Cliquer sur "Rename"
4. Entrer un nouveau nom
5. Valider

**Résultat attendu** : ✅ Le nom est mis à jour

---

### Test de validation

1. Ouvrir le dialogue de renommage
2. Effacer tout le texte
3. Vérifier que le bouton "Rename" est désactivé
4. Entrer un nom
5. Vérifier que le bouton est activé

**Résultat attendu** : ✅ Validation fonctionne

---

### Test d'annulation

1. Ouvrir le dialogue de renommage
2. Modifier le nom
3. Cliquer sur "Cancel"
4. Vérifier que le nom n'a pas changé

**Résultat attendu** : ✅ Annulation fonctionne

---

## Améliorations futures

### Suggestions

- [ ] Validation du nom (caractères interdits, longueur max)
- [ ] Historique des noms
- [ ] Noms uniques (empêcher les doublons)
- [ ] Renommage inline (sans dialogue)
- [ ] Raccourci clavier (F2)
- [ ] Undo/Redo du renommage

---

## Code Example

### Utilisation complète

```tsx
import { useTabsStore } from '@/store/useTabsStore';
import ViewTabs from '@/components/studio/ViewTabs';

function MyComponent() {
  const { addTab } = useTabsStore();

  const handleNewTab = () => {
    addTab({
      id: `tab-${Date.now()}`,
      viewId: `view-${Date.now()}`,
      viewName: 'New View',
      packageId: 'pkg-123',
    });
  };

  return (
    <div>
      <ViewTabs onNewTab={handleNewTab} />
      {/* Reste de l'interface */}
    </div>
  );
}
```

---

## Résolution de problèmes

### Le dialogue ne s'ouvre pas

**Vérifier** :
- Les composants shadcn/ui sont installés (dialog, label)
- Le state `renameDialogOpen` est géré correctement
- Pas d'erreur dans la console

### Le nom ne se met pas à jour

**Vérifier** :
- La fonction `updateTabName` est appelée
- Le `tabId` est correct
- Le store Zustand fonctionne (vérifier avec React DevTools)

### Le menu contextuel ne s'affiche pas

**Vérifier** :
- Le composant `context-menu` est installé
- Le clic droit n'est pas intercepté par un autre élément
- Le navigateur permet les menus contextuels personnalisés
