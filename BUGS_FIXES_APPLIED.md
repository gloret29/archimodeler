# 🔧 Corrections de Bugs Appliquées - ArchiModeler

**Date** : $(date)  
**Statut** : En cours

---

## ✅ Bugs Corrigés

### Bug #10 : Authentification Admin - Vérification Réelle ✅

**Fichier** : `apps/web/app/[locale]/admin/layout.tsx`

**Correction** :
- ✅ Vérification du token JWT via l'API `/users/me`
- ✅ Vérification du rôle Admin dans les rôles de l'utilisateur
- ✅ Redirection automatique si non authentifié ou non autorisé
- ✅ Gestion des erreurs (token expiré, API indisponible)

**Code ajouté** :
```typescript
const checkAuth = async () => {
    const token = API_CONFIG.getAuthToken();
    if (!token) {
        router.push("/home");
        return;
    }

    const response = await API_CONFIG.fetch('/users/me');
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('accessToken');
            router.push("/");
            return;
        }
        throw new Error(`Failed to verify authentication: ${response.status}`);
    }

    const user: User = await response.json();
    const hasAdminRole = user.roles?.some(role => role.name === 'Admin') || false;
    
    if (!hasAdminRole) {
        router.push("/home");
        return;
    }

    setAuthorized(true);
};
```

**Impact** : Les pages admin sont maintenant protégées et nécessitent un rôle Admin valide.

---

### Bug #4 : URLs Hardcodées - Configuration Centralisée ✅ (Partiel)

**Fichiers créés** :
- ✅ `apps/web/lib/api/config.ts` - Configuration centralisée de l'API
- ✅ `apps/web/lib/api/client.ts` - Client API réutilisable avec gestion d'erreurs

**Fichiers mis à jour** :
- ✅ `apps/web/lib/api/views.ts` - Utilise maintenant `API_CONFIG`
- ✅ `apps/web/hooks/useCollaboration.ts` - Utilise `API_CONFIG.wsUrl`
- ✅ `apps/web/app/[locale]/studio/page.tsx` - Utilise `API_CONFIG.fetch()`
- ✅ `apps/web/app/[locale]/admin/layout.tsx` - Utilise `API_CONFIG`
- ✅ `apps/web/components/ai/CoachChat.tsx` - Utilise `API_CONFIG.fetch()`

**Configuration** :
```typescript
// apps/web/lib/api/config.ts
export const API_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
    get wsUrl() {
        return `${this.baseUrl}/collaboration`;
    },
    getAuthToken(): string | null {
        return localStorage.getItem('accessToken');
    },
    getAuthHeaders(additionalHeaders = {}): HeadersInit {
        // Headers avec authentification automatique
    },
    async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
        // Fetch avec authentification automatique
    },
};
```

**Utilisation** :
```typescript
// Avant
fetch('http://localhost:3002/users/me', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
});

// Après
await API_CONFIG.fetch('/users/me');
```

**Fichiers restants à migrer** : ~25 fichiers
- Voir `MIGRATION_GUIDE.md` pour la liste complète

**Impact** : 
- ✅ Configuration centralisée via variable d'environnement `NEXT_PUBLIC_API_URL`
- ✅ Support pour différents environnements (dev/staging/prod)
- ⚠️ Migration en cours (25 fichiers restants)

---

## 🔄 Bugs en Cours de Correction

### Bug #3 : Memory Leak useCollaboration ⚠️ (Partiellement corrigé)

**Statut** : ⚠️ Amélioré mais peut être optimisé

**Améliorations déjà présentes** :
- ✅ Utilisation de `useRef` pour les callbacks (lignes 44-49)
- ✅ Mise à jour des refs dans un `useEffect` séparé (lignes 52-59)

**Amélioration possible** :
- Le `useEffect` principal (ligne 69) n'a que `[viewId]` comme dépendance
- Les callbacks sont dans des refs, donc techniquement OK
- Pattern actuel fonctionne mais pourrait être documenté

**Recommandation** : Le code actuel est fonctionnel. Ajouter des commentaires pour clarifier le pattern.

---

## 📋 Bugs Restants à Traiter

### Bug #1 : JWT dans localStorage 🔴

**Priorité** : 🔴 CRITIQUE  
**Complexité** : Élevée  
**Impact** : Sécurité - Vulnérable aux attaques XSS

**Solution recommandée** :
1. Modifier le backend pour utiliser des cookies HttpOnly
2. Modifier le frontend pour ne plus utiliser localStorage
3. Implémenter un refresh token avec rotation

**Fichiers affectés** : 77 fichiers

---

### Bug #2 : Race Condition Transactions 🔴

**Priorité** : 🔴 CRITIQUE (mais moins critique maintenant)  
**Complexité** : Moyenne  
**Impact** : Incohérence de données (élément existe mais non indexé)

**Statut actuel** :
- L'indexation OpenSearch échoue silencieusement (try/catch dans `search.service.ts`)
- L'élément existe dans PostgreSQL mais n'est pas recherchable
- Acceptable pour une approche "eventually consistent"

**Solution recommandée** :
- Implémenter un retry avec backoff exponentiel
- Ou utiliser une queue asynchrone pour l'indexation
- Ou accepter que l'indexation soit "eventually consistent"

---

### Bug #6 : Validation des Entrées 🟡

**Priorité** : 🟡 MOYENNE  
**Complexité** : Moyenne  
**Impact** : Sécurité et qualité

**Solution recommandée** :
- Utiliser `class-validator` avec des DTOs
- Valider les longueurs, formats, caractères autorisés
- Sanitizer les entrées

---

### Bug #7 : Type Safety (`any`) 🟡

**Priorité** : 🟡 MOYENNE  
**Complexité** : Élevée  
**Impact** : Qualité du code

**Solution recommandée** :
- Définir des types stricts pour toutes les interfaces
- Éviter `any`, utiliser `unknown` si nécessaire
- Utiliser des type guards

---

### Bug #9 : Gestion d'Erreurs 🟡

**Priorité** : 🟡 MOYENNE  
**Complexité** : Moyenne  
**Impact** : Expérience utilisateur

**Solution recommandée** :
- Implémenter un système de notifications (toast)
- Ajouter des retries pour les erreurs réseau
- Implémenter des fallbacks

---

## 📝 Guide de Migration pour URLs Restantes

### Fichiers à migrer (~25 fichiers)

Pour migrer un fichier, suivez ces étapes :

1. **Importer la configuration** :
```typescript
import { API_CONFIG } from '@/lib/api/config';
// ou
import { api } from '@/lib/api/client';
```

2. **Remplacer les fetch hardcodés** :
```typescript
// Avant
fetch('http://localhost:3002/endpoint', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
});

// Après (option 1 - avec API_CONFIG)
await API_CONFIG.fetch('/endpoint');

// Après (option 2 - avec api client)
await api.get('/endpoint');
```

3. **Remplacer les WebSocket** :
```typescript
// Avant
const socket = io('http://localhost:3002/collaboration', {...});

// Après
import { API_CONFIG } from '@/lib/api/config';
const socket = io(API_CONFIG.wsUrl, {...});
```

### Liste des fichiers à migrer

- `apps/web/components/common/UserInfo.tsx`
- `apps/web/components/collaboration/UserChat.tsx`
- `apps/web/app/[locale]/admin/users/page.tsx`
- `apps/web/hooks/useNotifications.ts`
- `apps/web/components/notifications/NotificationCenter.tsx`
- `apps/web/app/[locale]/home/page.tsx`
- `apps/web/components/canvas/nodes/ArchiMateNode.tsx`
- `apps/web/components/canvas/Stencil.tsx`
- `apps/web/app/connectors/[id]/page.tsx`
- `apps/web/app/governance/[id]/page.tsx`
- `apps/web/app/[locale]/admin/packages/page.tsx`
- `apps/web/components/studio/ModelTree.tsx`
- `apps/web/components/canvas/CollaborativeCanvas.tsx`
- `apps/web/components/canvas/ModelingCanvas.tsx`
- `apps/web/components/studio/PackageSelector.tsx`
- `apps/web/components/studio/PropertiesPanel.tsx`
- `apps/web/app/[locale]/admin/stereotypes/page.tsx`
- `apps/web/components/canvas/StereotypePanel.tsx`
- Et ~7 autres fichiers

---

## 🎯 Prochaines Étapes Recommandées

1. **Immédiat** :
   - ✅ Terminer la migration des URLs (25 fichiers restants)
   - 🔄 Documenter le pattern useCollaboration

2. **Court terme** :
   - Implémenter la validation des entrées (Bug #6)
   - Améliorer la gestion d'erreurs (Bug #9)

3. **Moyen terme** :
   - Migrer JWT vers cookies HttpOnly (Bug #1)
   - Améliorer le type safety (Bug #7)

4. **Long terme** :
   - Implémenter retry pour l'indexation (Bug #2)
   - Optimiser les performances

---

## 📊 Résumé des Corrections

| Bug | Statut | Priorité | Fichiers Modifiés |
|-----|--------|----------|-------------------|
| #10 | ✅ Corrigé | 🟡 | 1 fichier |
| #4 | ⚠️ Partiel | 🔴 | 6 fichiers (25 restants) |
| #3 | ⚠️ Amélioré | 🔴 | 0 (déjà corrigé) |
| #1 | 🔴 À faire | 🔴 | 77 fichiers |
| #2 | 🔴 À faire | 🔴 | 1 fichier |
| #6 | 🔴 À faire | 🟡 | Tous les controllers |
| #7 | 🔴 À faire | 🟡 | 50+ fichiers |
| #9 | 🔴 À faire | 🟡 | Tous les fichiers frontend |

---

**Note** : Les corrections sont en cours. Ce document sera mis à jour au fur et à mesure de l'avancement.

