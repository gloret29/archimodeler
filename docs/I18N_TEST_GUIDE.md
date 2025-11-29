# Guide de Test - Internationalisation

## Objectif
Vérifier que l'internationalisation fonctionne correctement sur toutes les pages de l'application.

## Prérequis
- Le serveur de développement doit être en cours d'exécution (`npm run dev` dans `apps/web`)
- Un navigateur web moderne

## Tests à effectuer

### 1. Test de la page d'accueil

**URL**: `http://localhost:3000/en/home`

**Actions**:
- [ ] Vérifier que le titre "Welcome to ArchiModeler" s'affiche en anglais
- [ ] Vérifier que les boutons "Open Studio" et "Settings" sont en anglais
- [ ] Changer l'URL vers `/fr/home`
- [ ] Vérifier que le titre devient "Bienvenue sur ArchiModeler"
- [ ] Vérifier que les boutons deviennent "Ouvrir le Studio" et "Paramètres"

**Résultat attendu**: ✅ Tous les textes changent selon la langue

---

### 2. Test de la page Studio

**URL**: `http://localhost:3000/en/studio`

**Actions**:
- [ ] Vérifier que le titre "ArchiModeler Studio" s'affiche
- [ ] Vérifier que le tooltip du bouton Home affiche "Back to Home"
- [ ] Changer l'URL vers `/fr/studio`
- [ ] Vérifier que le tooltip devient "Retour à l'accueil"

**Résultat attendu**: ✅ Le titre et les tooltips changent selon la langue

---

### 3. Test de la page Settings - Layout

**URL**: `http://localhost:3000/en/settings/profile`

**Actions**:
- [ ] Vérifier que le titre principal est "Settings"
- [ ] Vérifier que le sous-titre est "Manage your account settings..."
- [ ] Vérifier que les onglets sont "Profile", "Appearance", "Language"
- [ ] Vérifier que le bouton est "Back to Home"
- [ ] Changer l'URL vers `/fr/settings/profile`
- [ ] Vérifier que le titre devient "Paramètres"
- [ ] Vérifier que les onglets deviennent "Profil", "Apparence", "Langue"
- [ ] Vérifier que le bouton devient "Retour à l'accueil"

**Résultat attendu**: ✅ Tous les éléments de navigation changent selon la langue

---

### 4. Test de la page Profile

**URL**: `http://localhost:3000/en/settings/profile`

**Actions**:
- [ ] Vérifier que le titre de la section est "Profile"
- [ ] Vérifier que les labels sont "Username" et "Email"
- [ ] Vérifier que les placeholders sont "Your username" et "your.email@example.com"
- [ ] Vérifier que le bouton est "Update profile"
- [ ] Changer l'URL vers `/fr/settings/profile`
- [ ] Vérifier que le titre devient "Profil"
- [ ] Vérifier que les labels deviennent "Nom d'utilisateur" et "Email"
- [ ] Vérifier que les placeholders changent en français
- [ ] Vérifier que le bouton devient "Mettre à jour le profil"

**Résultat attendu**: ✅ Tous les éléments du formulaire changent selon la langue

---

### 5. Test de la page Appearance

**URL**: `http://localhost:3000/en/settings/appearance`

**Actions**:
- [ ] Vérifier que le titre est "Appearance"
- [ ] Vérifier que les options de thème sont "Light" et "Dark"
- [ ] Changer l'URL vers `/fr/settings/appearance`
- [ ] Vérifier que le titre devient "Apparence"
- [ ] Vérifier que les options deviennent "Clair" et "Sombre"

**Résultat attendu**: ✅ Tous les éléments de thème changent selon la langue

---

### 6. Test de la page Language (Test principal)

**URL**: `http://localhost:3000/en/settings/language`

**Actions**:
- [ ] Vérifier que le titre est "Language"
- [ ] Vérifier que deux options sont affichées : "English" et "Français"
- [ ] Vérifier que "English" est sélectionné par défaut
- [ ] Cliquer sur l'option "Français"
- [ ] **Vérifier que l'URL change automatiquement vers `/fr/settings/language`**
- [ ] Vérifier que le titre devient "Langue"
- [ ] Vérifier que "Français" est maintenant sélectionné
- [ ] Cliquer sur "English"
- [ ] **Vérifier que l'URL change automatiquement vers `/en/settings/language`**
- [ ] Vérifier que tout redevient en anglais

**Résultat attendu**: ✅ Le changement de langue est immédiat et persiste dans l'URL

---

### 7. Test de navigation entre pages

**URL**: `http://localhost:3000/fr/settings/profile`

**Actions**:
- [ ] Vérifier que la page est en français
- [ ] Cliquer sur l'onglet "Apparence"
- [ ] **Vérifier que l'URL reste en `/fr/...`**
- [ ] Vérifier que la page Apparence est en français
- [ ] Cliquer sur "Retour à l'accueil"
- [ ] **Vérifier que l'URL devient `/fr/home`**
- [ ] Vérifier que la page d'accueil est en français

**Résultat attendu**: ✅ La langue persiste lors de la navigation

---

### 8. Test de chargement direct

**Actions**:
- [ ] Ouvrir un nouvel onglet
- [ ] Aller directement à `http://localhost:3000/fr/studio`
- [ ] Vérifier que la page se charge en français
- [ ] Ouvrir un autre onglet
- [ ] Aller directement à `http://localhost:3000/en/settings/profile`
- [ ] Vérifier que la page se charge en anglais

**Résultat attendu**: ✅ Les URLs avec locale fonctionnent directement

---

### 9. Test de redirection par défaut

**Actions**:
- [ ] Aller à `http://localhost:3000/`
- [ ] **Vérifier que l'URL est redirigée vers `/en/...`** (langue par défaut)

**Résultat attendu**: ✅ Redirection automatique vers la langue par défaut

---

## Checklist finale

- [ ] Toutes les pages principales sont traduites
- [ ] Le changement de langue est immédiat
- [ ] La langue persiste dans l'URL
- [ ] La navigation conserve la langue sélectionnée
- [ ] Les URLs directes avec locale fonctionnent
- [ ] La redirection par défaut fonctionne

## Problèmes connus

Aucun problème connu pour le moment.

## Rapport de bugs

Si vous trouvez un problème :
1. Noter l'URL exacte
2. Noter la langue sélectionnée
3. Noter le comportement attendu vs observé
4. Créer une issue dans le système de suivi

## Résultat global

**Status**: ✅ PASS / ❌ FAIL

**Notes**:
_Ajouter vos observations ici_
