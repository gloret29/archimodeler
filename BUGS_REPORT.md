# 🐛 Rapport de Bugs - ArchiModeler

**Date** : 29 Novembre 2025  
**Analyse** : Auto (Cursor AI)

---

## 🔴 Bugs Critiques (Priorité Haute)

### 1. **Sécurité : Stockage des tokens JWT dans localStorage**

**Fichiers affectés** :
- `apps/web/app/[locale]/page.tsx:38`
- `apps/web/app/[locale]/studio/page.tsx:37`
- `apps/web/components/canvas/ModelingCanvas.tsx` (multiples)
- `apps/web/components/studio/ModelTree.tsx` (multiples)
- Et 20+ autres fichiers

**Problème** :
```typescript
localStorage.setItem('accessToken', data.access_token);
const token = localStorage.getItem('accessToken');
```

**Impact** : Vulnérable aux attaques XSS. Un script malveillant peut voler le token.

**Solution recommandée** :
- Utiliser des cookies HttpOnly pour les tokens
- Ou utiliser un service de gestion d'état sécurisé
- Implémenter un refresh token avec rotation

**Priorité** : 🔴 **CRITIQUE**

---

### 2. **Race Condition : Transaction PostgreSQL/Neo4j non atomique**

**Fichier** : `apps/server/src/model/model.service.ts`

**Problème** :
```typescript
// Ligne 99-118
const element = await this.prisma.element.create({...}); // ✅ Succès PostgreSQL
await this.searchService.indexElement(element); // ⚠️ Peut échouer
await this.relationshipsService.ensureElementNode(...); // ❌ Peut échouer
// Si Neo4j échoue, l'élément existe dans PostgreSQL mais pas dans Neo4j
```

**Impact** : Incohérence de données entre PostgreSQL et Neo4j. L'élément existe dans PostgreSQL mais pas dans Neo4j, causant des erreurs lors de la création de relations.

**Solution recommandée** :
- Implémenter un pattern Saga ou Compensation
- Ou utiliser des transactions distribuées (2PC)
- Ou implémenter un mécanisme de réconciliation

**Priorité** : 🔴 **CRITIQUE**

---

### 3. **Memory Leak : Event listeners non nettoyés dans useCollaboration**

**Fichier** : `apps/web/hooks/useCollaboration.ts:141`

**Problème** :
```typescript
useEffect(() => {
    // ... setup socket listeners
    return () => {
        if (socket.connected) {
            socket.emit('leave-view', { viewId });
        }
        socket.disconnect();
    };
}, [viewId]); // ⚠️ Manque user, onNodeChanged, etc.
```

**Impact** : Les callbacks `onNodeChanged`, `onEdgeChanged`, etc. peuvent référencer des valeurs obsolètes, causant des fuites mémoire et des comportements inattendus.

**Solution recommandée** :
- Ajouter toutes les dépendances nécessaires
- Utiliser `useRef` pour les callbacks
- Nettoyer tous les event listeners explicitement

**Priorité** : 🔴 **CRITIQUE**

---

### 4. **Hardcoded URLs : Configuration non centralisée**

**Fichiers affectés** :
- `apps/web/app/[locale]/studio/page.tsx:39,50`
- `apps/web/hooks/useCollaboration.ts:57`
- `apps/web/components/canvas/ModelingCanvas.tsx` (multiples)
- Et 30+ autres fichiers

**Problème** :
```typescript
fetch('http://localhost:3002/model/packages', {...})
const socket = io('http://localhost:3002/collaboration', {...})
```

**Impact** : Impossible de déployer en production sans modifier le code. Pas de support pour différents environnements (dev/staging/prod).

**Solution recommandée** :
- Créer un fichier de configuration centralisé
- Utiliser des variables d'environnement Next.js (`NEXT_PUBLIC_API_URL`)
- Créer un service API client réutilisable

**Priorité** : 🔴 **CRITIQUE**

---

### 5. **Gestion d'erreurs : Sessions Neo4j non fermées en cas d'erreur**

**Fichier** : `apps/server/src/neo4j/relationships.service.ts:236-330`

**Problème** :
```typescript
async migrateFromPostgres(prisma: any) {
    const session = this.neo4jService.getSession();
    try {
        // ... code qui peut throw
    } finally {
        await session.close(); // ✅ OK ici
    }
}
```

Mais dans `executeQuery` :
```typescript
async executeQuery<T>(query: string, params?: Record<string, any>): Promise<T[]> {
    const session = this.getSession();
    try {
        // ... peut throw
    } finally {
        await session.close(); // ✅ OK
    }
}
```

**Impact** : Si une exception est levée avant le `finally`, la session peut rester ouverte, causant des fuites de connexions.

**Solution recommandée** : Le code semble correct, mais vérifier que toutes les exceptions sont bien catchées.

**Priorité** : 🟡 **MOYENNE** (code semble OK mais à vérifier)

---

## 🟡 Bugs Majeurs (Priorité Moyenne)

### 6. **Validation manquante : Pas de validation des entrées utilisateur**

**Fichiers affectés** :
- `apps/server/src/model/model.service.ts:34`
- `apps/server/src/auth/auth.service.ts:13`
- Tous les controllers

**Problème** :
```typescript
async createElementSimple(dto: { name: string; type: string; layer: string; packageId: string }) {
    // Pas de validation de dto.name, dto.type, etc.
    // Injection possible de valeurs malveillantes
}
```

**Impact** : Injection SQL possible (bien que Prisma protège), mais pas de validation des formats, longueurs, caractères spéciaux.

**Solution recommandée** :
- Utiliser `class-validator` avec des DTOs
- Valider les longueurs, formats, caractères autorisés
- Sanitizer les entrées

**Priorité** : 🟡 **MOYENNE**

---

### 7. **Type Safety : Utilisation excessive de `any`**

**Fichiers affectés** :
- `apps/server/src/model/model.service.ts:199,273`
- `apps/web/hooks/useCollaboration.ts:148,152`
- `apps/web/store/useTabsStore.ts:50`
- Et 50+ autres fichiers

**Problème** :
```typescript
const connectData = data.modelPackage.connect as any; // ⚠️
const obj: any = {}; // ⚠️
```

**Impact** : Perte des avantages de TypeScript, erreurs potentielles à l'exécution.

**Solution recommandée** :
- Définir des types stricts pour toutes les interfaces
- Éviter `any`, utiliser `unknown` si nécessaire
- Utiliser des type guards

**Priorité** : 🟡 **MOYENNE**

---

### 8. **TODO Critique : handleSave ne sauvegarde pas le contenu réel**

**Fichier** : `apps/web/app/[locale]/studio/page.tsx:145`

**Problème** :
```typescript
const handleSave = async () => {
    // TODO: Get actual canvas content from React Flow
    const content = {
        nodes: [], // ⚠️ Toujours vide !
        edges: [], // ⚠️ Toujours vide !
        savedAt: new Date().toISOString(),
    };
    await saveActiveTab(content);
};
```

**Impact** : La fonction "Save" ne sauvegarde rien ! Les modifications du canvas sont perdues.

**Solution recommandée** :
- Récupérer le contenu réel depuis React Flow
- Utiliser `useReactFlow().getNodes()` et `getEdges()`

**Priorité** : 🟡 **MOYENNE**

---

### 9. **Gestion d'erreurs : Console.error sans notification utilisateur**

**Fichiers affectés** : Tous les fichiers frontend

**Problème** :
```typescript
.catch(err => {
    console.error('Failed to fetch users:', error);
    // ⚠️ Pas de notification à l'utilisateur
    // ⚠️ Pas de retry
    // ⚠️ Pas de fallback
});
```

**Impact** : L'utilisateur ne sait pas que quelque chose a échoué. Expérience utilisateur dégradée.

**Solution recommandée** :
- Implémenter un système de notifications (toast)
- Ajouter des retries pour les erreurs réseau
- Implémenter des fallbacks

**Priorité** : 🟡 **MOYENNE**

---

### 10. **Authentification : Pas de vérification réelle dans admin layout**

**Fichier** : `apps/web/app/[locale]/admin/layout.tsx:19`

**Problème** :
```typescript
// TODO: Real auth check with JWT/API
const token = localStorage.getItem("accessToken");
if (!token) {
    // ⚠️ Juste un warning, pas de redirection
    console.warn("No token found, assuming dev mode or redirecting");
}
```

**Impact** : Les pages admin sont accessibles sans authentification réelle. Sécurité compromise.

**Solution recommandée** :
- Vérifier le token avec l'API
- Rediriger vers login si invalide
- Utiliser un middleware Next.js pour protéger les routes

**Priorité** : 🟡 **MOYENNE**

---

## 🟢 Bugs Mineurs (Priorité Basse)

### 11. **Logging : Console.log en production**

**Fichiers affectés** : Tous les fichiers backend et frontend

**Problème** :
```typescript
console.log('Creating element with DTO:', dto);
console.log('User found: ${email}, Password match: ${isMatch}');
```

**Impact** : Logs sensibles en production, performance dégradée.

**Solution recommandée** :
- Utiliser un logger structuré (Winston, Pino)
- Niveaux de log (debug, info, warn, error)
- Filtrer les logs en production

**Priorité** : 🟢 **BASSE**

---

### 12. **User ID aléatoire : Pas de persistance**

**Fichier** : `apps/web/app/[locale]/studio/page.tsx:90-94`

**Problème** :
```typescript
const currentUser = {
    id: Math.random().toString(36).substring(7), // ⚠️ Change à chaque render
    name: `User ${Math.floor(Math.random() * 1000)}`, // ⚠️ Change à chaque render
    color: '#4ECDC4',
};
```

**Impact** : L'utilisateur change d'ID à chaque re-render, causant des problèmes de collaboration.

**Solution recommandée** :
- Stocker l'ID utilisateur dans le store ou localStorage
- Utiliser l'ID de l'utilisateur authentifié

**Priorité** : 🟢 **BASSE**

---

### 13. **Dépendances manquantes : useEffect dans useCollaboration**

**Fichier** : `apps/web/hooks/useCollaboration.ts:141`

**Problème** :
```typescript
}, [viewId]); // ⚠️ Manque user, onNodeChanged, onEdgeChanged, etc.
```

**Impact** : Les callbacks peuvent être obsolètes, causant des bugs subtils.

**Solution recommandée** :
- Ajouter toutes les dépendances
- Ou utiliser `useRef` pour les callbacks

**Priorité** : 🟢 **BASSE** (déjà mentionné dans bug #3)

---

### 14. **Synchronisation : Pas de gestion de conflits**

**Fichier** : `apps/web/components/canvas/CollaborativeCanvas.tsx`

**Problème** : Pas d'implémentation OT/CRDT pour la synchronisation collaborative.

**Impact** : Conflits lors d'éditions simultanées, perte de données.

**Solution recommandée** :
- Implémenter Operational Transform (OT)
- Ou Conflict-free Replicated Data Types (CRDT)
- Ou verrouillage d'éléments

**Priorité** : 🟢 **BASSE** (fonctionnalité prévue mais non implémentée)

---

### 15. **Performance : Pas de debounce sur les mises à jour de curseur**

**Fichier** : `apps/web/hooks/useCollaboration.ts:144`

**Problème** :
```typescript
const updateCursor = useCallback((position: CursorPosition) => {
    socketRef.current?.emit('cursor-move', { viewId, position });
}, [viewId]);
```

**Impact** : Trop d'événements émis, surcharge du serveur et du réseau.

**Solution recommandée** :
- Ajouter un debounce (100-200ms)
- Throttle les événements

**Priorité** : 🟢 **BASSE**

---

## 📊 Résumé

| Priorité | Nombre | Bugs |
|----------|--------|------|
| 🔴 Critique | 5 | Sécurité, Transactions, Memory leaks, Configuration |
| 🟡 Majeure | 5 | Validation, Types, TODOs, Erreurs, Auth |
| 🟢 Mineure | 5 | Logging, User ID, Dépendances, Sync, Performance |

**Total** : 15 bugs identifiés

---

## 🎯 Recommandations Prioritaires

1. **Immédiat** : Corriger les bugs critiques (#1, #2, #3, #4)
2. **Court terme** : Implémenter la validation (#6) et corriger les TODOs (#8, #10)
3. **Moyen terme** : Améliorer la gestion d'erreurs (#9) et le type safety (#7)
4. **Long terme** : Optimiser les performances (#15) et implémenter la synchronisation (#14)

---

## 📝 Notes

- Certains bugs peuvent être des fonctionnalités non implémentées (TODOs)
- La plupart des bugs de sécurité nécessitent une refactorisation importante
- Les bugs de performance peuvent être traités progressivement

---

**Prochaines étapes** :
1. Créer des issues GitHub pour chaque bug
2. Prioriser selon l'impact utilisateur
3. Assigner aux développeurs
4. Suivre la résolution
