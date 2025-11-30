# Manuel Utilisateur ArchiModeler

> Guide complet pour utiliser ArchiModeler - Plateforme collaborative de modélisation d'architecture d'entreprise

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Premiers Pas](#premiers-pas)
3. [Interface Utilisateur](#interface-utilisateur)
4. [Création et Gestion des Modèles](#création-et-gestion-des-modèles)
5. [Modélisation](#modélisation)
6. [Collaboration](#collaboration)
7. [Commentaires et Annotations](#commentaires-et-annotations)
8. [Personnalisation](#personnalisation)
9. [Administration](#administration)
10. [FAQ et Dépannage](#faq-et-dépannage)

---

## Introduction

### Qu'est-ce qu'ArchiModeler ?

ArchiModeler est une plateforme web collaborative pour créer, gérer et visualiser des modèles d'architecture d'entreprise conformes au standard **ArchiMate 3.2**. Elle permet aux équipes de travailler ensemble en temps réel sur des diagrammes d'architecture complexes.

### Fonctionnalités Principales

- ✅ **Modélisation ArchiMate 3.2** - Tous les éléments et relations du standard
- 🎨 **Interface Moderne** - Interface intuitive inspirée de Figma
- 🌐 **Collaboration Temps Réel** - Édition simultanée avec plusieurs utilisateurs
- 💬 **Chat et Commentaires** - Communication intégrée dans l'application
- 🌍 **Multilingue** - Support français et anglais
- 🎯 **Organisation Hiérarchique** - Dossiers et packages pour structurer vos modèles
- 🔍 **Recherche Avancée** - Trouvez rapidement vos éléments
- 📊 **Vues Multiples** - Créez plusieurs diagrammes dans des onglets

---

## Premiers Pas

### Connexion

1. Accédez à l'URL de votre instance ArchiModeler
2. Cliquez sur **"Se connecter"** ou **"Login"**
3. Entrez votre **email** et **mot de passe**
4. Cliquez sur **"Connexion"**

> **Note** : Si vous n'avez pas de compte, contactez votre administrateur système.

### Page d'Accueil

Après connexion, vous arrivez sur la **page d'accueil** qui affiche :
- **Dashboard** - Vue d'ensemble de vos modèles
- **Notifications** - Centre de notifications avec badge de compteur
- **Menu de navigation** - Accès aux différentes sections

### Navigation Principale

- **🏠 Accueil** - Retour à la page d'accueil
- **🎨 Studio** - Ouvrir l'éditeur de modélisation
- **⚙️ Paramètres** - Configuration de votre profil et préférences
- **👤 Profil** - Informations de votre compte

---

## Interface Utilisateur

### Le Studio

Le Studio est l'interface principale pour créer et modifier vos modèles d'architecture.

#### Composants de l'Interface

```
┌─────────────────────────────────────────────────────────────┐
│  [Menu]  [Onglets]                    [Save] [Save As] [⚙️] │
├──────────┬──────────────────────────────────────┬───────────┤
│          │                                      │           │
│  Palette │         Canvas (Zone de travail)    │ Repository│
│  (Gauche)│                                      │  (Droite) │
│          │                                      │           │
│  - Bus.  │                                      │  - Dossiers│
│  - App.  │                                      │  - Éléments│
│  - Tech. │                                      │  - Relations│
│          │                                      │  - Vues   │
│          │                                      │           │
├──────────┴──────────────────────────────────────┴───────────┤
│  [Propriétés] - Panneau des propriétés de l'élément sélectionné│
└─────────────────────────────────────────────────────────────┘
```

#### Panneaux Principaux

1. **Palette (Gauche)**
   - Liste des éléments ArchiMate disponibles
   - Organisés par couche (Business, Application, Technology)
   - Glissez-déposez pour créer des éléments

2. **Canvas (Centre)**
   - Zone de travail principale
   - Créez et organisez vos diagrammes
   - Zoom et pan disponibles

3. **Repository (Droite)**
   - Arborescence de vos éléments, relations et vues
   - Organisé par dossiers
   - Redimensionnable

4. **Panneau des Propriétés (Bas)**
   - Affiche les propriétés de l'élément sélectionné
   - Permet de modifier les détails
   - Onglet Commentaires pour les discussions

---

## Création et Gestion des Modèles

### Sélectionner un Package

Avant de commencer à modéliser, vous devez sélectionner un **Package de Modèle** :

1. Cliquez sur **"Studio"** dans le menu
2. Si aucun package n'est sélectionné, une boîte de dialogue apparaît
3. Sélectionnez un package existant ou créez-en un nouveau
4. Cliquez sur **"Ouvrir"**

> **Note** : Les packages isolent vos modèles. Tous les éléments, relations et vues d'un package sont indépendants.

### Créer une Nouvelle Vue

1. Dans le **Repository**, cliquez avec le bouton droit sur un dossier
2. Sélectionnez **"Nouvelle Vue"** ou **"New View"**
3. Entrez un nom pour la vue
4. La vue s'ouvre automatiquement dans un nouvel onglet

### Gérer les Onglets

- **Ouvrir plusieurs vues** : Cliquez sur différentes vues dans le repository
- **Basculer entre les onglets** : Cliquez sur l'onglet souhaité
- **Fermer un onglet** : Cliquez sur le **X** sur l'onglet
- **Indicateur de modification** : Un point orange apparaît sur les onglets modifiés

### Sauvegarder une Vue

1. Cliquez sur l'icône **💾 Sauvegarder** en haut à droite
2. Le contenu actuel du canvas (positions, styles, relations) est sauvegardé
3. Un message de confirmation apparaît

### Sauvegarder une Vue Sous

1. Cliquez sur l'icône **📋 Sauvegarder sous** à droite du bouton Sauvegarder
2. Entrez un nouveau nom pour la vue
3. Une nouvelle vue est créée avec le contenu actuel
4. La nouvelle vue s'ouvre automatiquement dans un nouvel onglet

---

## Modélisation

### Créer un Élément

#### Méthode 1 : Glisser-Déposer depuis la Palette

1. Dans la **Palette** (gauche), trouvez l'élément souhaité
2. **Glissez** l'élément vers le **Canvas**
3. **Déposez** à l'endroit souhaité
4. L'élément est créé et apparaît dans le Repository

#### Méthode 2 : Menu Contextuel sur un Dossier

1. Dans le **Repository**, cliquez avec le bouton droit sur un dossier
2. Sélectionnez **"Créer un élément ArchiMate"** ou **"Create ArchiMate Element"**
3. Choisissez la couche (Business, Application, Technology)
4. Sélectionnez le type d'élément
5. L'élément est créé dans le dossier et peut être ajouté à une vue

### Renommer un Élément

#### Méthode 1 : Double-Clic

1. **Double-cliquez** sur l'élément sur le canvas
2. Une boîte de dialogue apparaît
3. Entrez le nouveau nom
4. Cliquez sur **"Renommer"** ou appuyez sur **Entrée**

#### Méthode 2 : Menu Contextuel

1. **Clic droit** sur l'élément
2. Sélectionnez **"Renommer"** ou **"Rename"**
3. Entrez le nouveau nom
4. Confirmez

### Créer une Relation

1. **Cliquez** sur le point de connexion (handle) d'un élément source
2. **Glissez** vers l'élément cible
3. Si plusieurs types de relations sont possibles, un menu apparaît
4. **Sélectionnez** le type de relation souhaité
5. La relation est créée avec validation ArchiMate automatique

> **Note** : Seules les relations valides selon le standard ArchiMate sont proposées.

### Supprimer un Élément

#### Retirer de la Vue (Non-destructive)

1. **Clic droit** sur l'élément sur le canvas
2. Sélectionnez **"Retirer de la vue"** ou **"Remove from View"**
3. L'élément reste dans le Repository mais disparaît de la vue actuelle

#### Supprimer du Repository

1. **Clic droit** sur l'élément
2. Sélectionnez **"Supprimer du Repository"** ou **"Delete from Repository"**
3. Une confirmation apparaît
4. Confirmez la suppression
5. L'élément est définitivement supprimé

> **⚠️ Attention** : La suppression du Repository est définitive et affecte toutes les vues.

### Personnaliser l'Apparence

1. **Sélectionnez** un ou plusieurs éléments sur le canvas
2. Le **Panneau de Mise en Forme** apparaît automatiquement en bas
3. Personnalisez :
   - **Couleurs** : Fond, bordure, texte
   - **Bordures** : Largeur
   - **Polices** : Taille, couleur
   - **Opacité** : Transparence de l'élément
   - **Arêtes** : Couleur, largeur, style de ligne (pour les relations)

Les modifications sont appliquées **en temps réel**.

### Organiser Automatiquement

1. Cliquez sur le bouton **"Auto Layout"** en haut à droite du canvas
2. Choisissez un algorithme :
   - **Circular** : Disposition en cercle
   - **Hierarchical** : Organisation hiérarchique selon les connexions
   - **Grid** : Disposition en grille régulière
   - **Force-Directed** : Simulation de forces pour une disposition naturelle
3. Les éléments sont automatiquement réorganisés

### Menu Contextuel

#### Sur un Élément (Clic Droit)

- **Renommer** - Renommer l'élément
- **Retirer de la Vue** - Retirer de la vue actuelle (non-destructive)
- **Supprimer du Repository** - Supprimer complètement

#### Sur un Dossier (Clic Droit)

- **Nouveau Dossier** - Créer un sous-dossier
- **Créer un élément ArchiMate** - Créer directement un élément dans le dossier
- **Nouvelle Vue** - Créer une nouvelle vue dans le dossier

---

## Collaboration

### Édition en Temps Réel

Plusieurs utilisateurs peuvent éditer la même vue simultanément :

- **Curseurs Collaboratifs** : Les curseurs des autres utilisateurs sont visibles avec leurs noms
- **Synchronisation** : Les modifications sont synchronisées en temps réel
- **Indicateur de Connexion** : Badge en haut à droite indiquant le nombre d'utilisateurs actifs

### Liste des Utilisateurs Actifs

1. Cliquez sur le badge d'utilisateurs actifs en haut à droite
2. Une liste s'affiche avec :
   - Noms des utilisateurs connectés
   - Avatars colorés
   - Indicateur de messages non lus (pastille)

### Chat Direct

1. Dans la liste des utilisateurs actifs, cliquez sur un utilisateur
2. Un panneau de chat s'ouvre
3. Tapez votre message et appuyez sur **Entrée**
4. Les messages sont envoyés en temps réel
5. Les notifications toast apparaissent pour les nouveaux messages

### Gestion des Conversations

1. Cliquez sur votre **avatar** en haut à droite
2. Sélectionnez **"Conversations"** ou **"Chats"**
3. La liste de vos conversations s'affiche
4. Cliquez sur une conversation pour l'ouvrir
5. Un badge indique le nombre de messages non lus

---

## Commentaires et Annotations

### Ajouter un Commentaire

1. **Sélectionnez** un élément ou une relation sur le canvas
2. Le **Panneau des Propriétés** s'affiche en bas
3. Cliquez sur l'onglet **"Commentaires"** ou **"Comments"**
4. Tapez votre commentaire dans la zone de texte
5. **Mentionnez des utilisateurs** en tapant `@` suivi du nom (autocomplétion disponible)
6. Cliquez sur **"Démarrer une discussion"** ou **"Start Discussion"**

### Répondre à un Commentaire

1. Dans le panneau des commentaires, trouvez le commentaire
2. Cliquez sur **"Répondre"** ou **"Reply"**
3. Tapez votre réponse
4. Vous pouvez également mentionner des utilisateurs avec `@`
5. Cliquez sur **"Ajouter une réponse"** ou **"Add Reply"**

### Mentions d'Utilisateurs

- Tapez `@` dans un commentaire
- Une liste de suggestions apparaît automatiquement
- Utilisez les **flèches haut/bas** pour naviguer
- Appuyez sur **Entrée** pour sélectionner
- Les utilisateurs mentionnés reçoivent une notification

### Résoudre un Thread

1. Dans le panneau des commentaires, trouvez le thread
2. Cliquez sur **"Résoudre"** ou **"Resolve"**
3. Le thread est marqué comme résolu
4. Cliquez sur **"Rouvrir"** ou **"Unresolve"** pour le rouvrir

### Annotations Visuelles

- Les éléments avec des commentaires affichent un **badge** sur le canvas
- Le badge indique le nombre de commentaires
- Les éléments avec des commentaires non résolus ont un badge coloré
- Cliquez sur le badge pour ouvrir le panneau des commentaires

### Modifier ou Supprimer un Commentaire

1. Trouvez votre commentaire dans le thread
2. Cliquez sur **"Modifier"** ou **"Edit"** (icône crayon)
3. Modifiez le texte
4. Cliquez sur **"Enregistrer"** ou **"Save"**
5. Pour supprimer, cliquez sur **"Supprimer"** ou **"Delete"** (icône poubelle)
6. Confirmez la suppression

---

## Personnalisation

### Paramètres Utilisateur

Accédez aux paramètres via le menu **⚙️ Paramètres** :

#### Profil

- **Nom** : Modifier votre nom complet
- **Email** : Votre adresse email (non modifiable)
- **Langue** : Choisir votre langue préférée (Français/English)
- **Mot de passe** : Changer votre mot de passe

#### Apparence

- **Thème** : Choisir entre thème clair et thème sombre
- Les préférences sont sauvegardées automatiquement

### Préférences de Langue

1. Allez dans **Paramètres** > **Profil**
2. Sélectionnez votre langue préférée dans le menu déroulant
3. La langue est appliquée immédiatement
4. Votre préférence est sauvegardée dans votre profil

### Thème Sombre

1. Allez dans **Paramètres** > **Apparence**
2. Sélectionnez **"Sombre"** ou **"Dark"**
3. L'interface passe en thème sombre immédiatement
4. Tous les éléments et symboles s'adaptent automatiquement

---

## Administration

> **Note** : Cette section est réservée aux utilisateurs avec le rôle **System Administrator**.

### Accès à l'Administration

1. Cliquez sur votre **avatar** en haut à droite
2. Si vous êtes administrateur, l'option **"Administration"** ou **"Admin"** apparaît
3. Cliquez pour accéder au panneau d'administration

### Gestion des Utilisateurs

- **Créer un utilisateur** : Ajouter un nouvel utilisateur au système
- **Modifier un utilisateur** : Changer les informations ou rôles
- **Supprimer un utilisateur** : Retirer un utilisateur du système
- **Assigner des rôles** : Gérer les permissions des utilisateurs

### Gestion des Packages

- **Créer un package** : Créer un nouveau package de modèle
- **Modifier un package** : Changer le nom ou la description
- **Dupliquer un package** : Créer une copie complète avec toutes les données
- **Supprimer un package** : Retirer un package (⚠️ action définitive)

### Configuration de la Palette

1. Allez dans **Administration** > **Configuration**
2. Section **"Palette"**
3. Cochez/décochez les types d'éléments ArchiMate à afficher
4. Les modifications sont appliquées immédiatement dans le Studio

### Gestion des Stéréotypes

- **Créer un stéréotype** : Définir un nouveau stéréotype
- **Attribuer des types** : Lier le stéréotype à des types d'éléments/relations
- **Définir des propriétés** : Créer des attributs personnalisés
- **Appliquer aux éléments** : Utiliser les stéréotypes dans vos modèles

---

## FAQ et Dépannage

### Questions Fréquentes

#### Comment puis-je partager mon modèle avec d'autres utilisateurs ?

Les modèles sont partagés automatiquement au niveau du package. Tous les utilisateurs ayant accès au package peuvent voir et modifier les éléments, relations et vues.

#### Puis-je annuler une action ?

La fonctionnalité d'annulation (Undo/Redo) est en cours de développement. Pour l'instant, assurez-vous de sauvegarder régulièrement vos vues.

#### Comment exporter mon diagramme ?

La fonctionnalité d'export (PNG, SVG, PDF) est en cours de développement. Pour l'instant, vous pouvez utiliser les outils de capture d'écran de votre navigateur.

#### Les modifications sont-elles sauvegardées automatiquement ?

Non, vous devez cliquer sur le bouton **"Sauvegarder"** pour enregistrer les modifications. Un indicateur (point orange) sur l'onglet vous rappelle si vous avez des modifications non sauvegardées.

#### Comment puis-je voir l'historique des modifications ?

La fonctionnalité de versioning avec historique est en cours de développement. Pour l'instant, utilisez les commentaires pour documenter les changements importants.

#### Que faire si je perds ma connexion ?

Si vous perdez votre connexion :
1. Vérifiez votre connexion internet
2. Rechargez la page (F5)
3. Reconnectez-vous si nécessaire
4. Vos modifications non sauvegardées peuvent être perdues

#### Comment signaler un problème ?

Contactez votre administrateur système ou ouvrez un ticket de support via l'interface d'administration.

### Problèmes Courants

#### Le canvas ne répond pas

1. Vérifiez que vous avez sélectionné le bon onglet
2. Essayez de zoomer/dézoomer (molette de la souris)
3. Rechargez la page (F5)

#### Les éléments ne s'affichent pas correctement

1. Vérifiez que vous avez sauvegardé la vue
2. Vérifiez que l'élément existe dans le Repository
3. Essayez de retirer et réajouter l'élément à la vue

#### Les notifications ne s'affichent pas

1. Vérifiez que les notifications ne sont pas bloquées par votre navigateur
2. Vérifiez votre connexion WebSocket (badge de connexion en haut à droite)
3. Rechargez la page si nécessaire

#### Les commentaires ne se chargent pas

1. Vérifiez que vous avez sélectionné un élément ou une relation
2. Vérifiez votre connexion internet
3. Rechargez la page si nécessaire

---

## Raccourcis Clavier

| Action | Raccourci |
|--------|-----------|
| Sauvegarder | `Ctrl + S` (Windows/Linux) ou `Cmd + S` (Mac) |
| Renommer | `F2` (sur un élément sélectionné) |
| Supprimer | `Delete` ou `Suppr` (sur un élément sélectionné) |
| Zoom avant | `Ctrl + Molette` ou `Ctrl + +` |
| Zoom arrière | `Ctrl + Molette` ou `Ctrl + -` |
| Réinitialiser le zoom | `Ctrl + 0` |
| Pan (déplacer) | `Espace + Clic et glisser` |
| Sélection multiple | `Ctrl + Clic` (Windows/Linux) ou `Cmd + Clic` (Mac) |
| Commentaire (Ctrl+Entrée) | `Ctrl + Entrée` pour envoyer un commentaire |

---

## Glossaire

- **ArchiMate** : Standard de modélisation d'architecture d'entreprise
- **Canvas** : Zone de travail principale pour créer les diagrammes
- **Élément** : Objet ArchiMate (ex: BusinessActor, ApplicationComponent)
- **Package** : Conteneur isolé pour organiser les modèles
- **Palette** : Liste des éléments ArchiMate disponibles
- **Relation** : Lien entre deux éléments selon les règles ArchiMate
- **Repository** : Arborescence de tous vos éléments, relations et vues
- **Stéréotype** : Extension personnalisée d'un élément ou d'une relation
- **Thread** : Discussion de commentaires sur un élément/relation
- **Vue** : Diagramme représentant une partie de votre modèle

---

## Support

### Ressources

- **Documentation Technique** : Voir les fichiers README.md et ARCHITECTURE.md
- **Guide de Développement** : Voir DEV_GUIDE.md
- **Spécifications** : Voir SPECIFICATIONS.md

### Contact

- **Email Support** : support@archimodeler.com
- **Discord** : [Rejoindre notre serveur](https://discord.gg/archimodeler)
- **Issues GitHub** : [GitHub Issues](https://github.com/gloret29/archimodeler/issues)

---

*Manuel Utilisateur ArchiModeler - Version 1.0*  
*Dernière mise à jour : 2025-11-30*

