# Bugs Trouvés dans ArchiModeler

> **Note**: Les bugs marqués avec ✅ ont été corrigés.

## 🔴 Bugs Critiques

### 1. ✅ Bug dans `relationships.controller.ts` - Paramètre incorrect
**Fichier**: `apps/server/src/model/relationships.controller.ts:59`
**Problème**: Le paramètre `packageId` utilise `@Param` au lieu de `@Query`, mais il n'est pas dans le chemin de la route.
```typescript
async findAll(@Param('packageId') packageId?: string) {
```
**Impact**: Le paramètre `packageId` ne sera jamais récupéré correctement depuis la query string.
**Solution**: Remplacé `@Param` par `@Query` et ajouté `@ApiQuery` pour la documentation Swagger.

---

### 2. ✅ Bug dans `model.service.ts` - Accès à un tableau vide
**Fichier**: `apps/server/src/model/model.service.ts:455`
**Problème**: Accès à `importData.elements[0]` sans vérifier si le tableau est vide.
```typescript
const metamodelName = importData.elements[0]?.metamodel || 'ArchiMate 3.2';
```
**Impact**: Si `elements` est un tableau vide (après validation), cela fonctionne grâce à l'optional chaining, mais c'est fragile. Si la validation échoue, cela pourrait causer une erreur.
**Solution**: Ajouté une vérification explicite que le tableau n'est pas vide avant d'accéder au premier élément.

---

### 3. ✅ Bug dans `model.controller.ts` - Appel incorrect à `findAllFolders()`
**Fichier**: `apps/server/src/model/model.controller.ts:282`
**Problème**: `findAllFolders()` est appelé sans paramètre, mais la méthode retourne un tableau vide si `packageId` n'est pas fourni.
```typescript
findAll() {
    return this.modelService.findAllFolders();
}
```
**Impact**: L'endpoint retourne toujours un tableau vide au lieu de tous les dossiers.
**Solution**: Modifié la méthode `findAllFolders()` pour retourner tous les dossiers si `packageId` n'est pas fourni.

---

### 4. ✅ Bug de sécurité - Génération d'ID non sécurisée
**Fichier**: `apps/server/src/model/relationships.controller.ts:34`
**Problème**: Utilisation de `Math.random()` pour générer des IDs, ce qui n'est pas cryptographiquement sûr et peut causer des collisions.
```typescript
const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```
**Impact**: Risque de collisions d'ID et problèmes de sécurité.
**Solution**: Remplacé par `crypto.randomUUID()` pour une génération d'ID sécurisée et unique.

---

### 5. ✅ Bug potentiel de race condition
**Fichier**: `apps/server/src/model/model.service.ts:32-46`
**Problème**: Dans `createElementSimple`, la création du "Default Package" n'est pas atomique. Si plusieurs requêtes arrivent simultanément, plusieurs packages "Default Package" pourraient être créés.
```typescript
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
```
**Impact**: Création de doublons du "Default Package" en cas de requêtes simultanées.
**Solution**: Ajouté une gestion d'erreur avec retry pour gérer les cas de race condition. Si la création échoue (contrainte unique), on récupère le package existant.

---

## ⚠️ Bugs de Sécurité et Bonnes Pratiques

### 6. Console.log avec informations sensibles
**Fichiers**: Multiple fichiers
**Problème**: Beaucoup de `console.log` qui pourraient exposer des informations sensibles (tokens, mots de passe, données utilisateur).
**Exemples**:
- `apps/server/src/auth/auth.service.ts:16,20` - Logs d'email et de correspondance de mot de passe
- `apps/server/src/model/model.service.ts:27,37,44,55,63,77,85,89,118` - Logs avec des données utilisateur
**Impact**: Fuite d'informations sensibles dans les logs de production.
**Solution**: Remplacer les `console.log` par un système de logging approprié avec niveaux de log, ou les supprimer pour la production.

---

### 7. Gestion d'erreurs inconsistante
**Fichiers**: Multiple fichiers
**Problème**: Certaines méthodes lancent des erreurs génériques sans contexte, d'autres utilisent `console.error` sans propager l'erreur.
**Exemple**: `apps/server/src/model/model.service.ts:123` - Log l'erreur mais la propage quand même (correct), mais d'autres endroits ne le font pas.
**Impact**: Difficulté à déboguer et à gérer les erreurs correctement.
**Solution**: Standardiser la gestion d'erreurs avec des exceptions HTTP appropriées (NestJS).

---

### 8. ✅ Validation manquante
**Fichier**: `apps/server/src/model/relationships.controller.ts:23-53`
**Problème**: Pas de validation que `sourceId` et `targetId` existent et appartiennent au même package avant de créer une relation.
**Impact**: Possibilité de créer des relations invalides (éléments inexistants, éléments de packages différents).
**Solution**: Ajouté des validations complètes avant la création de la relation : vérification de l'existence des éléments source et target, vérification qu'ils appartiennent au même package, et vérification que le packageId correspond.

---

### 9. ✅ Bug dans `importPackage` - Utilisation de `importData.relationships.length`
**Fichier**: `apps/server/src/model/model.service.ts:619`
**Problème**: Utilisation de `importData.relationships.length` dans le résultat, mais `relationships` pourrait être `undefined` si non initialisé correctement.
```typescript
imported: {
    elements: importData.elements.length,
    relationships: importData.relationships.length, // Peut être undefined
    folders: importData.folders.length,
    views: importData.views.length
}
```
**Impact**: Erreur si `relationships` n'est pas défini (même si c'est géré plus haut, c'est fragile).
**Solution**: Remplacé par `(importData.relationships || []).length` pour éviter les erreurs.

---

## 🟡 Bugs Mineurs

### 10. Code mort / TODO non résolu
**Fichier**: `apps/web/components/canvas/ModelingCanvas.tsx:242`
**Problème**: TODO commenté mais non implémenté.
```typescript
// TODO: Fetch views using this element
```
**Impact**: Fonctionnalité incomplète.

---

### 11. Hardcoded URLs
**Fichiers**: Multiple fichiers frontend
**Problème**: URLs hardcodées `http://localhost:3002` dans plusieurs composants.
**Exemples**: 
- `apps/web/components/canvas/StereotypePanel.tsx:52,72,108,118`
- `apps/web/components/notifications/NotificationCenter.tsx:52,67,95,109,123,141`
**Impact**: Ne fonctionnera pas en production ou avec des configurations différentes.
**Solution**: Utiliser des variables d'environnement ou une configuration centralisée.

---

### 12. Gestion d'erreurs frontend avec `alert()`
**Fichiers**: Multiple fichiers frontend
**Problème**: Utilisation de `alert()` pour afficher les erreurs, ce qui n'est pas une bonne pratique UX.
**Exemples**: 
- `apps/web/components/canvas/ModelingCanvas.tsx:227,260,401,405`
**Impact**: Mauvaise expérience utilisateur.
**Solution**: Utiliser un système de notifications/toasts approprié.

---

## 📊 Résumé

- **Bugs Critiques**: 5 (✅ 5 corrigés)
- **Bugs de Sécurité**: 3 (✅ 1 corrigé, 2 restants)
- **Bugs Mineurs**: 4 (✅ 1 corrigé, 3 restants)
- **Total**: 12 bugs identifiés (✅ 7 corrigés, 5 restants)

## 🔧 Priorités de Correction

1. **Haute Priorité**: Bugs 1, 2, 3, 4, 5 (affectent le fonctionnement de base)
2. **Moyenne Priorité**: Bugs 6, 8, 9 (affectent la robustesse)
3. **Basse Priorité**: Bugs 7, 10, 11, 12 (améliorations de code)
