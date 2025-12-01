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

## 🔴 Bug Sécurité 1 : Token JWT dans localStorage

**Problème** : Le token JWT est stocké dans `localStorage`, ce qui le rend vulnérable aux attaques XSS (Cross-Site Scripting). Un script malveillant injecté pourrait voler le token.

**Fichiers** : 
- `apps/web/lib/api/config.ts` ligne 55
- Multiple fichiers utilisent `localStorage.getItem('accessToken')` (28 occurrences)

**Impact** : Risque de sécurité élevé - vol de session possible via XSS.

**Solution** : Migrer vers des cookies HttpOnly qui ne sont pas accessibles via JavaScript.

**TODO** : Déjà documenté dans `apps/web/lib/api/config.ts` ligne 51 : `// TODO: Migrer vers cookies HttpOnly (Bug #1)`

---

## 🟡 Bug Sécurité 2 : Logs de Mots de Passe

**Problème** : Le service d'authentification log des informations sensibles dans la console, notamment si le mot de passe correspond (`Password match: ${isMatch}`).

**Fichier** : `apps/server/src/auth/auth.service.ts` lignes 16, 20

**Impact** : Fuite d'informations sensibles dans les logs. Risque de sécurité moyen.

**Solution** : Retirer les logs de debug ou utiliser un logger avec niveaux de log appropriés.

```typescript
// ❌ À éviter
console.log(`User found: ${email}, Password match: ${isMatch}`);

// ✅ Préférer
this.logger.debug(`User authentication attempt: ${email}`);
```

---

## 🟡 Bug Sécurité 3 : Certificat SAML Fake

**Problème** : La stratégie SAML utilise un certificat fake (`'fake-cert'`) en dur dans le code.

**Fichier** : `apps/server/src/auth/strategies/saml.strategy.ts` ligne 12

**Impact** : L'authentification SAML ne fonctionnera pas en production. Risque de sécurité moyen.

**Solution** : Configurer le certificat réel via une variable d'environnement.

```typescript
cert: process.env.SAML_CERT || process.env.SAML_CERT_PATH,
```

**TODO** : Déjà documenté dans le code : `// TODO: Configure with real IdP certificate`

---

## 🟡 Bug Sécurité 4 : Mot de Passe Neo4j par Défaut

**Problème** : Le service Neo4j utilise un mot de passe par défaut `'password'` si la variable d'environnement n'est pas définie.

**Fichier** : `apps/server/src/neo4j/neo4j.service.ts` ligne 11

**Impact** : Si `NEO4J_PASSWORD` n'est pas défini, utilisation d'un mot de passe faible par défaut. Risque de sécurité moyen.

**Solution** : Forcer l'utilisation d'une variable d'environnement ou lancer une erreur si elle n'est pas définie.

```typescript
const password = process.env.NEO4J_PASSWORD;
if (!password) {
    throw new Error('NEO4J_PASSWORD environment variable is required');
}
```

---

## 🟢 Bug Code 1 : Utilisation de console.log au lieu d'un Logger

**Problème** : De nombreux fichiers utilisent `console.log`, `console.error`, `console.warn` au lieu du logger NestJS approprié.

**Fichiers** : 
- `apps/server/src/main.ts` lignes 63-64
- `apps/server/src/auth/auth.service.ts` lignes 16, 20
- `apps/server/src/model/model.service.ts` (plusieurs occurrences)
- `apps/server/src/neo4j/neo4j.service.ts` lignes 19, 21-22
- `apps/server/src/comments/comments.controller.ts` (plusieurs occurrences)
- Et beaucoup d'autres...

**Impact** : Pas de contrôle sur les niveaux de log, pas de formatage cohérent, difficulté à filtrer les logs en production.

**Solution** : Utiliser le `Logger` de NestJS partout.

```typescript
import { Logger } from '@nestjs/common';

export class MyService {
    private readonly logger = new Logger(MyService.name);
    
    someMethod() {
        this.logger.log('Info message');
        this.logger.error('Error message', error);
        this.logger.warn('Warning message');
    }
}
```

---

## 🟢 Bug Code 2 : onModuleDestroy sans Gestion d'Erreur

**Problème** : La méthode `onModuleDestroy` dans `Neo4jService` n'a pas de gestion d'erreur. Si `driver.close()` échoue, cela pourrait causer des problèmes lors de l'arrêt de l'application.

**Fichier** : `apps/server/src/neo4j/neo4j.service.ts` lignes 27-29

**Impact** : Risque faible, mais pourrait empêcher un arrêt propre de l'application.

**Solution** : Ajouter un try-catch pour gérer les erreurs.

```typescript
async onModuleDestroy() {
    try {
        await this.driver.close();
    } catch (error) {
        this.logger.error('Error closing Neo4j driver:', error);
    }
}
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

