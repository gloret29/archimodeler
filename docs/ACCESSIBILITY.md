# Guide d'Accessibilité - ArchiModeler

Ce document décrit les fonctionnalités d'accessibilité implémentées dans ArchiModeler conformément à la Phase 10.2.

## Vue d'ensemble

ArchiModeler a été conçu pour être accessible à tous les utilisateurs, y compris ceux qui utilisent des technologies d'assistance comme les lecteurs d'écran, la navigation au clavier, ou qui ont besoin d'un contraste élevé.

## Fonctionnalités Implémentées

### 1. Navigation au Clavier

#### Composant "Skip to Content"
- Un lien "Aller au contenu principal" apparaît automatiquement lors de la navigation au clavier (Tab)
- Permet de sauter directement au contenu principal sans passer par tous les éléments de navigation
- Visible uniquement au focus clavier

#### Hooks de Navigation Clavier

**useKeyboardNavigation**
```typescript
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

useKeyboardNavigation({
  shortcut: 'ctrl+k',
  handler: (e) => {
    // Ouvrir la recherche
  },
  preventDefault: true,
  stopPropagation: false
});
```

**useKeyboardShortcuts**
```typescript
import { useKeyboardShortcuts } from '@/hooks/useKeyboardNavigation';

useKeyboardShortcuts([
  { shortcut: 'ctrl+s', handler: () => save() },
  { shortcut: 'ctrl+n', handler: () => newView() },
]);
```

**useListKeyboardNavigation**
```typescript
import { useListKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

const { handleKeyDown } = useListKeyboardNavigation(
  items,
  (item, index) => selectItem(item),
  () => closeList()
);
```

#### Raccourcis Clavier Supportés
- **Tab / Shift+Tab** : Navigation entre les éléments interactifs
- **Flèches Haut/Bas** : Navigation dans les listes
- **Enter / Espace** : Activer un élément
- **Escape** : Fermer les menus/dialogs
- **Home / End** : Aller au début/fin d'une liste

### 2. Support Lecteur d'Écran

#### Composant LiveRegion
Pour annoncer les changements d'état aux lecteurs d'écran :

```typescript
import { LiveRegion, useLiveRegion } from '@/components/accessibility/LiveRegion';

// Dans un composant
const { announce } = useLiveRegion('polite');
announce('Vue enregistrée avec succès');
```

#### Attributs ARIA Utilisés

**Rôles Sémantiques**
- `role="main"` : Contenu principal
- `role="navigation"` : Navigation
- `role="banner"` : En-tête
- `role="list"` / `role="listitem"` : Listes
- `role="alert"` : Messages d'erreur importants
- `role="status"` : Messages informatifs

**Attributs ARIA**
- `aria-label` : Étiquette pour les lecteurs d'écran
- `aria-describedby` : Référence à une description
- `aria-required` : Champ requis
- `aria-invalid` : Champ invalide
- `aria-busy` : Élément en cours de chargement
- `aria-live` : Région live (polite/assertive)
- `aria-atomic` : Annoncer tout le contenu de la région

**Exemple d'utilisation**
```tsx
<Input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
```

### 3. Contraste et Lisibilité

#### Classes Utilitaires CSS

**Screen Reader Only**
```tsx
<span className="sr-only">Texte visible uniquement pour les lecteurs d'écran</span>
```

**Focus Visible**
```tsx
<button className="focus-visible-ring">Bouton</button>
```

**Touch Target**
```tsx
<button className="touch-target">Bouton accessible</button>
```

#### Support des Préférences Utilisateur

**Contraste Élevé**
- Support automatique de `prefers-contrast: high`
- Bordures et anneaux de focus plus visibles
- Contraste amélioré en mode sombre

**Mouvement Réduit**
- Support automatique de `prefers-reduced-motion: reduce`
- Animations et transitions désactivées
- Scroll behavior automatique

### 4. Améliorations des Composants

#### Formulaires
- Labels associés aux champs (`htmlFor` / `id`)
- Messages d'erreur avec `role="alert"` et `aria-live="assertive"`
- Indication des champs requis (`aria-required`)
- Validation avec `aria-invalid`

#### Boutons
- Labels descriptifs avec `aria-label` si nécessaire
- État de chargement avec `aria-busy`
- Tailles de cible tactiles minimales (44x44px)

#### Navigation
- Structure sémantique avec `<nav>` et `role="navigation"`
- Listes avec `role="list"` et `role="listitem"`
- Navigation au clavier complète

## Conformité WCAG

Les fonctionnalités implémentées respectent les critères WCAG 2.1 niveau AA :

- ✅ **1.1.1** Contenu non textuel (alternatives textuelles)
- ✅ **1.3.1** Info et relations (structure sémantique)
- ✅ **1.4.3** Contraste (minimum 4.5:1)
- ✅ **2.1.1** Clavier (toutes les fonctionnalités accessibles au clavier)
- ✅ **2.1.2** Pas de piège au clavier
- ✅ **2.4.1** Contourner les blocs (Skip to content)
- ✅ **2.4.3** Ordre de focus (ordre logique)
- ✅ **2.4.7** Focus visible
- ✅ **3.2.1** Au focus (pas de changement de contexte)
- ✅ **4.1.2** Nom, rôle, valeur (attributs ARIA)

## Utilisation pour les Développeurs

### Ajouter un Composant Accessible

```tsx
import { useLiveRegion } from '@/components/accessibility/LiveRegion';

function MyComponent() {
  const { announce } = useLiveRegion('polite');
  
  const handleSave = async () => {
    await save();
    announce('Élément enregistré avec succès');
  };
  
  return (
    <button
      onClick={handleSave}
      className="focus-visible-ring touch-target"
      aria-label="Enregistrer l'élément"
    >
      Enregistrer
    </button>
  );
}
```

### Ajouter la Navigation Clavier

```tsx
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

function MyComponent() {
  useKeyboardNavigation({
    shortcut: 'ctrl+s',
    handler: () => save(),
  });
  
  return <div>...</div>;
}
```

### Améliorer un Formulaire

```tsx
<form>
  <Label htmlFor="name">Nom</Label>
  <Input
    id="name"
    type="text"
    required
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? 'name-error' : undefined}
  />
  {hasError && (
    <p id="name-error" role="alert" aria-live="assertive">
      Le nom est requis
    </p>
  )}
</form>
```

## Tests d'Accessibilité

### Outils Recommandés
- **axe DevTools** : Extension Chrome/Firefox
- **WAVE** : Extension navigateur
- **Lighthouse** : Audit d'accessibilité intégré
- **NVDA / JAWS** : Lecteurs d'écran pour tests

### Checklist de Test
- [ ] Navigation complète au clavier (Tab, Shift+Tab, flèches)
- [ ] Tous les éléments interactifs accessibles au clavier
- [ ] Focus visible sur tous les éléments
- [ ] Lecteur d'écran annonce correctement les changements
- [ ] Contraste suffisant (minimum 4.5:1)
- [ ] Labels associés aux champs de formulaire
- [ ] Messages d'erreur annoncés
- [ ] Structure sémantique correcte (headings, landmarks)

## Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

## Notes

- Les fonctionnalités d'accessibilité sont intégrées par défaut dans tous les nouveaux composants
- Les composants existants sont progressivement améliorés
- Les traductions incluent des clés d'accessibilité dans `Accessibility.*`

---

*Dernière mise à jour : Phase 10.2 - Accessibilité*





