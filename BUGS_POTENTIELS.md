# 🐛 Bugs Potentiels Identifiés

> **Note** : Les bugs critiques et moyens ont été corrigés. Voir les sections "✅ Corrigé" ci-dessous.

## 🔴 Bug Critique 1 : SSR avec Reverse Proxy ✅ CORRIGÉ

**Problème** : Le fallback pour SSR est `http://localhost:3002`, mais en production avec un reverse proxy, le serveur Next.js ne peut pas accéder à `localhost:3002`.

**Fichier** : `apps/web/lib/api/config.ts` ligne 26

**Impact** : Les pages qui font des appels API lors du SSR échoueront en production.

**✅ Solution appliquée** : Utilisation d'une variable d'environnement `SSR_API_URL` pour le SSR.

```typescript
// Fallback pour SSR - utiliser une variable d'environnement si disponible
return process.env.SSR_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
```

---

## 🟡 Bug Moyen 1 : NEXT_PUBLIC_API_URL avec Reverse Proxy ✅ CORRIGÉ

**Problème** : Si `NEXT_PUBLIC_API_URL` est défini et pointe vers le reverse proxy (ex: `http://votre-domaine.com`), le préfixe `/api` n'est pas ajouté. Mais si on accède via le reverse proxy, il faut quand même ajouter `/api`.

**Fichier** : `apps/web/lib/api/config.ts` lignes 16-17, 37, 89

**Impact** : Si `NEXT_PUBLIC_API_URL` est défini pour pointer vers le reverse proxy, les appels API échoueront car ils n'auront pas le préfixe `/api`.

**✅ Solution appliquée** : Détection automatique si `NEXT_PUBLIC_API_URL` pointe vers le reverse proxy (égal à `window.location.origin`).

```typescript
// On ajoute /api si NEXT_PUBLIC_API_URL n'est pas défini OU il pointe vers le reverse proxy
const shouldAddApiPrefix = 
    typeof window !== 'undefined' && 
    (!apiUrl || (apiUrl === window.location.origin)) &&
    !normalizedEndpoint.startsWith('/api');
```

---

## 🟡 Bug Moyen 2 : Endpoint qui commence déjà par /api ✅ CORRIGÉ

**Problème** : Si quelqu'un appelle `API_CONFIG.fetch('/api/auth/login')`, la condition `!endpoint.startsWith('/api')` empêchera l'ajout du préfixe, ce qui créera une URL incorrecte : `http://votre-domaine.com/api/api/auth/login`.

**Fichier** : `apps/web/lib/api/config.ts` ligne 90

**Impact** : Double préfixe `/api/api/` si un endpoint est passé avec `/api` déjà inclus.

**✅ Solution appliquée** : Normalisation de l'endpoint pour enlever le préfixe `/api` s'il existe déjà.

```typescript
// Normaliser l'endpoint : enlever le préfixe /api s'il existe déjà
let normalizedEndpoint = endpoint;
if (normalizedEndpoint.startsWith('/api/')) {
    normalizedEndpoint = normalizedEndpoint.substring(4); // Enlever '/api'
} else if (normalizedEndpoint === '/api') {
    normalizedEndpoint = '/';
}
```

---

## 🟡 Bug Moyen 3 : WebSocket avec Reverse Proxy ✅ CORRIGÉ

**Problème** : Le WebSocket utilise `wsUrl` qui construit l'URL comme `${baseUrl}/api/collaboration`. Mais si le reverse proxy route `/api/*` vers le backend, il faut s'assurer que le backend a bien une route `/collaboration` (sans `/api`).

**Fichier** : `apps/web/lib/api/config.ts` lignes 33-41

**Impact** : Le WebSocket pourrait ne pas se connecter si la route backend n'est pas correctement configurée.

**✅ Vérification effectuée** : Le backend a bien une route WebSocket sur le namespace `collaboration` (pas `/api/collaboration`). Le reverse proxy enlèvera `/api` avant de transmettre, donc `/api/collaboration` → `/collaboration` ✅

**✅ Solution appliquée** : Amélioration de la logique pour détecter si on doit ajouter `/api` pour le WebSocket.

---

## 🟢 Bug Mineur 1 : Swagger Documentation

**Problème** : Swagger est configuré sur `/api-docs` mais le backend n'a pas de préfixe `/api`, donc c'est `/api-docs` directement. Si on accède via le reverse proxy, il faudrait `/api/api-docs` ou configurer une autre route dans le reverse proxy.

**Fichier** : `apps/server/src/main.ts` ligne 55

**Impact** : La documentation Swagger ne sera pas accessible via le reverse proxy.

**Solution** : Soit ajouter une route dans le reverse proxy pour `/api-docs`, soit déplacer Swagger sur `/api/api-docs`.

---

## 🟢 Bug Mineur 2 : Headers CORS en Production

**Problème** : CORS est configuré avec `origin: true` (permet toutes les origines). En production, cela pourrait être un problème de sécurité.

**Fichier** : `apps/server/src/main.ts` ligne 30

**Impact** : Sécurité réduite en production.

**Solution** : Utiliser une variable d'environnement pour restreindre les origines en production.

```typescript
app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    // ...
});
```

---

## 📋 Recommandations

1. **Priorité Haute** : Corriger le bug SSR (Bug Critique 1)
2. **Priorité Moyenne** : Corriger les bugs liés à `NEXT_PUBLIC_API_URL` et la normalisation des endpoints
3. **Priorité Basse** : Améliorer la configuration CORS et Swagger

---

## ✅ Tests à Effectuer

1. Tester l'authentification via le reverse proxy
2. Tester le WebSocket via le reverse proxy
3. Tester le SSR en production
4. Tester avec `NEXT_PUBLIC_API_URL` défini et non défini
5. Tester avec des endpoints qui commencent par `/api`

