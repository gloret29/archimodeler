# Guide de Développement ArchiModeler (OpenEA-Platform)

## 1.1 Analyse des Exigences et Choix Technologiques
Pour répliquer les fonctionnalités du Team Server dans un environnement cloud-native moderne généré par Antigravity, nous devons opérer une transition technologique stratégique tout en conservant les principes de gestion de données relationnelles et hiérarchiques.

| Composant Bizzdesign (Legacy) | Technologie Cible (Antigravity Stack) | Justification Architecturale |
| :--- | :--- | :--- |
| **Backend** : Java / Team Server (Jetty) | **Node.js (NestJS)** | NestJS offre une structure modulaire stricte (Modules, Providers) idéale pour implémenter des règles de gouvernance complexes similaires à celles de Bizzdesign. |
| **Base de Données** : SQL Server / DB2 / File System (.xmam) | **PostgreSQL + Prisma ORM** | PostgreSQL gère nativement le JSONB pour les attributs flexibles des métamodèles tout en assurant l'intégrité référentielle pour le RBAC. Prisma offre un typage fort nécessaire pour la génération de code par IA. |
| **Frontend** : Qt /.NET (Enterprise Studio) | **React + React Flow** | React Flow est la bibliothèque standard actuelle pour les graphes interactifs sur le web, capable de remplacer le moteur de rendu graphique desktop de Bizzdesign. |
| **Authentification** : SAML 2.0 / AD FS / Entra ID | **Auth.js (NextAuth)** | Support natif et flexible pour OIDC et SAML, facilitant l'intégration avec les IdP d'entreprise comme mentionné dans la documentation Bizzdesign. |

## 1.2 Séquence de Prompts 1 : Initialisation du Monorepo et du Socle Technique
L'objectif de cette première séquence est de demander à l'agent Antigravity de configurer l'environnement de développement. Il est crucial de spécifier une architecture Monorepo pour permettre le partage de types (TypeScript interfaces) entre le backend (le Repository) et le frontend (le Studio et Horizzon).

**Instruction pour l'Architecte :** Copiez le prompt ci-dessous dans la vue "Manager" d'Antigravity.

### Prompt 1.1 : Configuration du Workspace
*   **Rôle** : Tu es un Architecte Solution Senior spécialisé dans les applications SaaS d'entreprise à haute performance.
*   **Tâche** : Initialise un nouveau projet monorepo pour une plateforme d'Architecture d'Entreprise nommée "OpenEA-Platform".
*   **Structure** : Utilise Turborepo pour gérer le workspace.
*   **Applications** : Crée deux dossiers dans `/apps` :
    *   `server` : Une application NestJS (mode strict TypeScript) qui servira d'API REST et de moteur de règles.
    *   `web` : Une application Next.js (App Router) qui servira à la fois pour le studio de modélisation et le portail de collaboration.
*   **Packages Partagés** : Crée un package `packages/database` contenant la configuration Prisma ORM et un package `packages/types` pour les définitions TypeScript partagées (DTOs ArchiMate).
*   **Styling** : Installe et configure Tailwind CSS et Shadcn/UI dans l'application web pour assurer une interface utilisateur professionnelle et cohérente.
*   **Contrainte** : N'écris pas encore de logique métier. Concentre-toi sur la configuration de l'infrastructure, des linters (ESLint), et des fichiers Docker Compose pour une base de données PostgreSQL locale.
*   **Artéfact Attendu** : Un fichier `ARCHITECTURE.md` détaillant la structure du monorepo et un script `init.sh` fonctionnel pour lancer l'environnement de développement.

**Analyse de la Réponse Attendue :**
L'agent Antigravity va générer la structure de fichiers. L'utilisation de Turborepo est essentielle car Bizzdesign sépare clairement les logiques de "Team Server" (Server) et "Enterprise Studio" (Web Client). Le partage des types via `packages/types` prépare le terrain pour le métamodèle : les objets définis dans le backend (comme `BusinessActor`) seront immédiatement utilisables par le frontend sans duplication de code, réduisant les erreurs de synchronisation.

## 1.3 Séquence de Prompts 2 : La Couche d'Identité et de Sécurité (RBAC)
Bizzdesign utilise un modèle de sécurité granulaire. Les rôles ne sont pas binaires (Admin/User) mais contextuels : un utilisateur peut être "Designer" sur un projet et "Consumer" sur un autre. De plus, l'intégration SAML est critique pour les grandes entreprises.

### Prompt 1.2 : Implémentation du RBAC et de l'Authentification
*   **Contexte** : Nous devons reproduire le modèle de sécurité de Bizzdesign Horizzon. L'application nécessite une gestion fine des droits d'accès basée sur des rôles (RBAC).
*   **Tâche** : Dans l'application server (NestJS), implémente le module d'authentification et d'autorisation.
*   **Authentification** : Utilise Passport.js. Configure une stratégie locale (email/password) pour le développement et prépare une stratégie générique SAML 2.0 pour l'intégration future avec Entra ID.
*   **Modèle de Données (Prisma)** : Définis les modèles `User`, `Role`, `Permission`, et `Group`.
*   **Définition des Rôles** : Crée un script de "seeding" pour insérer les rôles standards suivants :
    *   `Consumer` : Lecture seule, commentaires.
    *   `Contributor` : Édition de blocs de données spécifiques, pas de modification de structure.
    *   `Designer` : Création et modification de modèles.
    *   `Lead Designer` : Gestion des métamodèles et des versions.
    *   `System Administrator` : Gestion des utilisateurs et des licences.
*   **Guards** : Crée des Guards NestJS personnalisés (`@Roles('Designer')`) pour protéger les futurs endpoints de l'API.
*   **Artéfact Attendu** : Le fichier `schema.prisma` mis à jour et les fichiers du module Auth (Controller, Service, Strategy).

**Insight Analytique :**
L'inclusion explicite du rôle "Contributor" dès cette phase est cruciale. Dans Bizzdesign, ce rôle permet à des experts métier de remplir des attributs (coûts, responsables) sans casser les modèles d'architecture. Si ce rôle n'est pas prévu dans la base de données dès le départ, il sera très difficile de l'ajouter ultérieurement sans refondre toute la logique d'accès.

# Chapitre 2 : Le Moteur de Métamodèle Dynamique (Le Cœur du Système)
C'est ici que réside la complexité majeure. Bizzdesign n'est pas un simple outil de dessin ; c'est un outil de modélisation basé sur des métamodèles stricts (ArchiMate, BPMN, UML) définis dans des fichiers `.xmam`. Antigravity doit générer un système capable d'ingérer et d'appliquer ces schémas dynamiquement.

## 2.1 Conception du Schéma de Métadonnées
Contrairement à une application classique où une table `User` a des colonnes fixes, un outil d'AE doit supporter des milliers de types d'objets (`ApplicationComponent`, `BusinessProcess`, `TechnologyDevice`) qui évoluent dans le temps. Créer une table SQL par type d'objet est ingérable. Nous devons utiliser un modèle EAV (Entity-Attribute-Value) ou, plus moderne, utiliser la puissance du JSONB de PostgreSQL.

## 2.2 Séquence de Prompts 3 : Infrastructure du Métamodèle

### Prompt 2.1 : Création du Moteur de Métamodèle
*   **Rôle** : Architecte de Données Expert.
*   **Tâche** : Conçois et implémente le schéma de base de données pour supporter un système de métamodèles dynamiques type ArchiMate 3.1.
*   **Entités Principales** : Ajoute les modèles suivants au `schema.prisma` :
    *   `ModelPackage` : Le conteneur principal (équivalent au fichier `.xma`).
    *   `Metamodel` : Définit le langage (ex: "ArchiMate 3.1", "BPMN 2.0").
    *   `ConceptType` : Les types d'objets disponibles (ex: "BusinessActor"). Doit être lié à un `Metamodel`.
    *   `RelationType` : Les types de liens possibles (ex: "Assignment", "Flow"). Définit les règles de validité (SourceType -> TargetType).
    *   `Element` : L'instance d'un objet dans un modèle. Doit avoir un champ `properties` de type JSONB pour stocker les attributs flexibles.
    *   `Relationship` : L'instance d'un lien. Relie deux `Element`s.
*   **Logique de Versionning (Time Travel)** : Bizzdesign permet de voir l'état du modèle à n'importe quel moment passé. Implémente un pattern de versionning. Chaque mise à jour sur un `Element` ou `Relationship` ne doit pas écraser la ligne existante mais créer une nouvelle version ou utiliser des timestamps `validFrom` / `validTo`.
*   **API** : Génère un service NestJS capable d'importer une définition de métamodèle (format JSON) et de peupler les tables `ConceptType` et `RelationType`.
*   **Artéfact Attendu** : Le schéma Prisma complet et un fichier JSON d'exemple représentant un sous-ensemble du métamodèle ArchiMate (ex: couche Business uniquement) pour tester l'import.

**Analyse Critique :**
Le point sur le "Time Travel" est inspiré directement des capacités du repository Bizzdesign. Sans cette gestion temporelle au niveau de la donnée, les fonctionnalités de comparaison de scénarios ("As-Is" vs "To-Be") et d'audit, essentielles aux architectes d'entreprise, seraient impossibles à implémenter. L'utilisation de JSONB pour les propriétés permet de répliquer la flexibilité des "Profils Personnalisés" de Bizzdesign, où les utilisateurs peuvent ajouter des champs ad-hoc (ex: "Budget CAPEX") sans migration de base de données.

### Prompt 2.2 : Importation du Standard ArchiMate
*   **Tâche** : Utilise l'agent pour générer un script de migration (seed) qui peuple la base de données avec le standard ArchiMate 3.1.
*   **Détails** :
    *   Crée les types : `BusinessActor`, `BusinessRole`, `BusinessProcess`, `ApplicationComponent`, `ApplicationService`, `Node`, `Device`.
    *   Crée les relations valides selon la spécification ArchiMate : Un `BusinessActor` peut avoir une relation `Assignment` vers un `BusinessRole`. Un `ApplicationComponent` peut `Realize` un `ApplicationService`.
*   **Contrainte** : Sois exhaustif sur les règles de relation. Ces règles serviront plus tard au "Smart Connector" dans l'interface graphique.

# Chapitre 3 : L'Interface de Modélisation (Réplication d'Enterprise Studio)
Cette phase vise à remplacer le client lourd Enterprise Studio par une interface web performante. L'enjeu est la performance de rendu (milliers d'objets) et l'ergonomie (Smart Connectors).

## 3.1 Séquence de Prompts 4 : Le Canvas de Modélisation

### Prompt 3.1 : Développement du Canvas React Flow
*   **Contexte** : Nous devons construire l'équivalent web d'Enterprise Studio. L'utilisateur doit pouvoir glisser-déposer des objets et créer des liens.
*   **Tâche** : Dans l'application web, crée le composant `ModelingCanvas`.
*   **Bibliothèque** : Utilise React Flow pour le moteur de graphe.
*   **Palette d'Objets** : Crée une barre latérale ("Stencil") qui liste les `ConceptType`s disponibles, regroupés par couche (Business, Application, Technology). Cette liste doit être récupérée dynamiquement depuis l'API backend (`GET /metamodels/archimate/concepts`).
*   **Drag-and-Drop** : Implémente la logique permettant de glisser un item de la palette vers le canvas pour instancier un `Element`.
*   **Personnalisation des Nœuds** : Crée des composants React personnalisés pour les nœuds ArchiMate. Ils doivent respecter la notation visuelle standard (couleur jaune pour Business, bleu turquoise pour Application, vert pour Technology) et inclure l'icône appropriée (acteur, composant, etc.).
*   **Artéfact Attendu** : Une page fonctionnelle `/studio` où l'on peut ajouter des nœuds Business et Application.

## 3.2 Séquence de Prompts 5 : Logique de Connexion Intelligente (Smart Connector)
Une fonctionnalité signature de Bizzdesign est la création rapide de relations valides. L'utilisateur tire un trait, et l'outil propose uniquement les relations permises par le standard (ex: "Utilisé par", "Déclenche").

### Prompt 3.2 : Implémentation du Smart Connector
*   **Tâche** : Améliore le `ModelingCanvas` pour gérer la création de liens intelligents.
*   **Interception** : Lorsqu'un utilisateur tire un lien (Edge) d'un Nœud A vers un Nœud B, ne crée pas le lien immédiatement. Ouvre une modale ou un menu contextuel ("Quick Create Menu").
*   **Validation Dynamique** : Ce menu doit interroger le backend (ou un cache local des `RelationType`s) pour savoir quelles relations sont permises entre le type du Nœud A et le type du Nœud B.
    *   Exemple : Si Source = `BusinessActor` et Cible = `BusinessProcess`, le menu doit proposer `Triggering` ou `Flow`, mais pas `Realization`.
*   **Dérivation** : Intègre la logique de "Relations Dérivées" d'ArchiMate. Si aucun lien direct n'est possible, vérifie si une chaîne de relations existe et propose de créer une relation dérivée si le standard le permet.
*   **Réf** : Inspire-toi du comportement décrit dans la documentation Bizzdesign "Drawing objects and relations using the quick-create pop-up window".

**Analyse :** Ce prompt force l'agent à implémenter la logique métier d'ArchiMate directement dans l'interface, transformant un simple outil de dessin en véritable outil d'architecture assistée.

# Chapitre 4 : Scripting et Automatisation (Remplacement du TPCL)
Bizzdesign utilise le langage TPCL (Tcl-based) pour les scripts d'analyse et de reporting. Pour une application moderne, nous allons remplacer cela par un moteur de script JavaScript/TypeScript sécurisé, exécuté côté serveur.

## 4.1 Séquence de Prompts 6 : Le Moteur de Scripting Sandboxé

### Prompt 4.1 : Service d'Exécution de Scripts
*   **Contexte** : Les utilisateurs avancés (Architectes) doivent pouvoir exécuter des scripts pour l'analyse d'impact (ex: "Lister toutes les applications obsolètes utilisées par des processus critiques"). Bizzdesign utilise TPCL pour cela.
*   **Tâche** : Implémente un service `ScriptingEngine` dans le backend NestJS.
*   **Technologie** : Utilise la bibliothèque `vm2` ou un conteneur isolé pour exécuter du code JavaScript utilisateur de manière sécurisée (Sandbox).
*   **API Exposée (DSL)** : Injecte un objet global `model` dans le contexte du script qui expose des méthodes simplifiées imitant la puissance de TPCL :
    *   `model.findAll(type)` : Retourne tous les objets d'un type.
    *   `element.getRelations()` : Retourne les connexions entrantes/sortantes.
    *   `element.attr(name)` : Accède aux propriétés.
    *   `output(data)` : Fonction pour retourner les résultats sous forme de tableau.
*   **Exemple de Migration TPCL** : Le script doit pouvoir interpréter une logique similaire à `forall "ApplicationComponent" app in model {... }` mais en syntaxe JS : `model.findAll('ApplicationComponent').forEach(app =>...)`.
*   **Artéfact Attendu** : Un endpoint API `POST /scripts/execute` qui prend du code JS en entrée et retourne le résultat de l'exécution JSON.

**Implication Stratégique :** En remplaçant TPCL par JavaScript, nous ouvrons la plateforme à une communauté de développeurs beaucoup plus large, tout en conservant la capacité d'automatisation critique pour les rapports de métriques (Metrics) et les graphiques matriciels.

# Chapitre 5 : Portail Collaboratif et Gouvernance (Horizzon)
Bizzdesign Horizzon est le portail de consommation. Il se distingue par ses tableaux de bord et ses workflows de validation.

## 5.1 Séquence de Prompts 7 : Tableaux de Bord et Recherche (OpenSearch)

### Prompt 5.1 : Intégration OpenSearch pour les Dashboards
*   **Tâche** : Implémente la couche d'analyse et de recherche pour le portail collaboratif.
*   **Indexation** : Configure un service qui écoute les événements de modification de modèle (`ElementUpdated`, `ElementCreated`) et synchronise les données vers une instance OpenSearch (ou Elasticsearch).
*   **Recherche** : Crée un endpoint de recherche global capable de filtrer par facettes (Type, Couche, Propriétés).
*   **Dashboards** : Dans le frontend, crée une page "Dashboard". Utilise une librairie de charts (comme Recharts ou Nivo) pour afficher des agrégations provenant d'OpenSearch.
    *   Exemple : Camembert "Répartition des Applications par Statut de Cycle de Vie".
*   **Référence** : Reproduis la capacité de Horizzon à afficher des métriques basées sur les attributs des objets.

## 5.2 Séquence de Prompts 8 : Workflow de Gouvernance
Le module "Model Governance" permet de valider les données avant publication.

### Prompt 5.2 : Moteur de Workflow
*   **Tâche** : Implémente un système de gestion des changements (Change Request).
*   **Machine à États** : Définis les états d'un modèle : `Draft` -> `In Review` -> `Approved` -> `Published`.
*   **Règles de Qualité** : Intègre un moteur de règles (similaire au scripting engine) qui exécute des vérifications automatiques lors de la transition `Draft` -> `In Review`.
    *   Exemple de règle : "Toute Application doit avoir un Propriétaire défini".
*   **Interface de Revue** : Crée une vue pour les utilisateurs Lead Designer listant les demandes de changement, affichant un "Diff" visuel (comparaison graphique Avant/Après) et permettant d'approuver ou rejeter.

# Chapitre 6 : Intégration et API Ouverte (Bizzdesign Connect)
Pour qu'un outil d'AE soit utile, il doit se nourrir des données opérationnelles (CMDB). Bizzdesign excelle dans l'import/export via "Bizzdesign Connect".

## 6.1 Séquence de Prompts 9 : Connecteurs de Données

### Prompt 6.1 : Framework ETL et Connecteur ServiceNow
*   **Contexte** : Nous devons importer des données depuis des sources externes comme ServiceNow ou Excel et les mapper vers le métamodèle ArchiMate.
*   **Tâche** : Construis un module "Data Connectors".
*   **Open API** : Finalise l'API REST du Repository pour qu'elle soit conforme aux spécifications de la "Bizzdesign Open API". Assure-toi que les endpoints permettent de créer des "Collections" externes en lecture seule.
*   **Connecteur Générique** : Crée une interface `IDataSource` avec des méthodes `fetch()` et `map()`.
*   **Implémentation ServiceNow** : Crée une implémentation qui se connecte à l'API Table de ServiceNow.
*   **Mapping UI** : Développe une interface utilisateur permettant de mapper graphiquement les colonnes de la source (ex: `sys_id`, `name`, `install_status`) vers les attributs du métamodèle (`id`, `name`, `lifecycle`).
*   **Réconciliation** : Implémente une logique de synchronisation périodique (Cron job) qui met à jour le modèle sans écraser les enrichissements manuels faits dans l'outil.

**Détail Technique :** Le prompt doit insister sur la gestion des "clés primaires externes". Dans Bizzdesign, les objets importés gardent une référence à leur ID source pour permettre les mises à jour futures.

# Chapitre 7 : Intelligence Artificielle (SmartPack et Diagram Describer)
Enfin, nous utilisons les capacités natives d'Antigravity pour intégrer des fonctionnalités d'IA générative, équivalentes au "SmartPack" de Bizzdesign.

## 7.1 Séquence de Prompts 10 : Fonctionnalités GenAI

### Prompt 7.1 : Assistant "Diagram Describer" et Coach
*   **Tâche** : Intègre les modèles Gemini ou Claude via l'API AI SDK.
*   **Diagram Describer** : Crée un service qui prend en entrée le JSON d'une vue (liste des nœuds et relations visibles) et génère une description textuelle naturelle.
    *   **Prompt Système pour l'IA** : "Tu es un architecte expert. Analyse ce graphe et décris les flux de données et les dépendances critiques. Identifie les risques potentiels."
    *   Cette fonctionnalité doit être accessible via un bouton "Générer Description" dans le portail Horizzon.
*   **How-to Coach** : Indexe la documentation technique générée (et potentiellement des guides ArchiMate) dans une base vectorielle (pgvector sur PostgreSQL). Crée un chatbot dans l'interface ("Coach") qui répond aux questions de modélisation (ex: "Comment modéliser un microservice en ArchiMate?") en utilisant un pipeline RAG (Retrieval-Augmented Generation).

# Chapitre 8 : Internationalisation (i18n) et Système de Dialogues

## 8.1 Internationalisation avec next-intl

### Architecture i18n

L'internationalisation a été implémentée en utilisant **next-intl**, une bibliothèque moderne pour Next.js qui offre un support complet de l'internationalisation avec routing basé sur les locales.

**Structure des fichiers :**
- `apps/web/messages/en.json` - Traductions anglaises
- `apps/web/messages/fr.json` - Traductions françaises
- `apps/web/i18n/request.ts` - Configuration next-intl
- `apps/web/middleware.ts` - Middleware de routage i18n
- `apps/web/navigation.ts` - Utilitaires de navigation i18n

**Fonctionnalités implémentées :**
- Support de 2 langues (EN/FR) avec possibilité d'extension
- Routes avec locale (`/en/studio`, `/fr/studio`)
- Traduction de toutes les pages principales (Studio, Admin, Settings, etc.)
- Page de sélection de langue dans les paramètres
- Changement de langue en temps réel sans rechargement
- Persistance de la langue dans le profil utilisateur (base de données)
- Composant LocaleSwitcher pour changement rapide
- Composant LocaleSync pour synchronisation avec le backend

**Utilisation dans les composants :**

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
    const t = useTranslations('Studio');
    
    return <h1>{t('title')}</h1>;
}
```

**Navigation i18n-aware :**

```tsx
import { Link } from '@/navigation';

<Link href="/studio">Studio</Link> // Préserve automatiquement la locale
```

### Migration de base de données

Une migration Prisma a été créée pour ajouter le champ `locale` au modèle `User` :
- Migration : `packages/database/prisma/migrations/20251130154241_add_user_locale/`
- Le champ `locale` stocke la préférence de langue de l'utilisateur
- Synchronisation automatique lors du changement de langue

## 8.2 Système de Dialogues Centralisé

### Architecture

Un système de dialogues centralisé a été implémenté pour standardiser l'affichage des dialogues dans toute l'application.

**Composants :**
- `DialogContext.tsx` - Context React pour gestion centralisée
- `useDialog.tsx` - Hook personnalisé pour API unifiée
- `AlertDialog.tsx` - Dialogues d'alerte/confirmation
- `MessageDialog.tsx` - Dialogues d'information
- `PromptDialog.tsx` - Dialogues de saisie

**Utilisation :**

```tsx
import { useDialog } from '@/hooks/useDialog';

function MyComponent() {
    const dialog = useDialog();
    
    // Afficher une alerte
    dialog.alert({
        title: 'Confirmation',
        message: 'Êtes-vous sûr ?',
        onConfirm: () => console.log('Confirmé')
    });
    
    // Afficher un message
    dialog.message({
        title: 'Information',
        message: 'Opération réussie'
    });
    
    // Afficher un prompt
    dialog.prompt({
        title: 'Saisie',
        message: 'Entrez votre nom',
        onConfirm: (value) => console.log(value)
    });
}
```

**Avantages :**
- API unifiée et cohérente
- Réduction de la duplication de code
- Gestion centralisée de l'état des dialogues
- Support de l'internationalisation intégré
- Accessibilité améliorée (ARIA, focus management)