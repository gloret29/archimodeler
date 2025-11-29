# Guide de Test - Collaboration Temps Réel

## Objectif
Tester le système de collaboration en temps réel permettant à plusieurs utilisateurs de travailler simultanément sur les mêmes vues.

## Prérequis

1. **Backend démarré** :
   ```bash
   cd apps/server
   npm run start:dev
   ```
   Le serveur WebSocket doit être accessible sur `http://localhost:3002`

2. **Frontend démarré** :
   ```bash
   cd apps/web
   npm run dev
   ```
   L'application web doit être accessible sur `http://localhost:3000`

## Tests à effectuer

### 1. Test du système d'onglets

**Objectif** : Vérifier que plusieurs vues peuvent être ouvertes simultanément

**Étapes** :
1. Accéder à `/studio?packageId=test`
2. Vérifier qu'un premier onglet "Main View" est créé
3. Cliquer sur le bouton **"+"** dans la barre d'onglets
4. Vérifier qu'un nouvel onglet "New View 2" apparaît
5. Créer 2-3 onglets supplémentaires
6. Cliquer sur différents onglets pour basculer entre les vues
7. Cliquer sur le **"X"** d'un onglet pour le fermer
8. Vérifier que l'onglet actif change automatiquement

**Résultat attendu** :
- ✅ Les onglets s'affichent correctement
- ✅ Le basculement entre onglets fonctionne
- ✅ La fermeture d'onglets fonctionne
- ✅ L'onglet actif est visuellement distinct

---

### 2. Test de connexion WebSocket

**Objectif** : Vérifier que la connexion WebSocket s'établit correctement

**Étapes** :
1. Ouvrir la console du navigateur (F12)
2. Accéder à `/studio?packageId=test`
3. Observer les logs de la console

**Résultat attendu** :
- ✅ Message "Connected to collaboration server" dans la console
- ✅ Pas d'erreur de connexion
- ✅ Badge utilisateurs affiche "1" (vous seul)

---

### 3. Test multi-utilisateurs (même machine)

**Objectif** : Tester la collaboration avec plusieurs fenêtres

**Étapes** :
1. Ouvrir le navigateur en mode normal
2. Se connecter et accéder à `/studio?packageId=test`
3. Noter le `viewId` dans l'URL ou la console
4. Ouvrir une fenêtre en **navigation privée** (Ctrl+Shift+N)
5. Se connecter avec un autre compte (ou simuler)
6. Accéder à la même URL avec le même `packageId`

**Résultat attendu** :
- ✅ Les deux fenêtres affichent "2" dans le badge utilisateurs
- ✅ Cliquer sur le badge affiche les 2 utilisateurs
- ✅ Chaque utilisateur a une couleur différente

---

### 4. Test des curseurs collaboratifs

**Objectif** : Vérifier que les curseurs des autres utilisateurs sont visibles

**Étapes** :
1. Avec 2 fenêtres ouvertes sur la même vue
2. Dans la fenêtre 1, bouger la souris sur le canvas
3. Observer la fenêtre 2

**Résultat attendu** :
- ✅ Le curseur de l'utilisateur 1 apparaît dans la fenêtre 2
- ✅ Le curseur est coloré selon la couleur de l'utilisateur
- ✅ Le nom de l'utilisateur s'affiche à côté du curseur
- ✅ Le curseur suit les mouvements en temps réel

---

### 5. Test de déconnexion

**Objectif** : Vérifier le comportement lors de la déconnexion

**Étapes** :
1. Avec 2 fenêtres ouvertes
2. Fermer complètement la fenêtre 1
3. Observer la fenêtre 2

**Résultat attendu** :
- ✅ Le badge utilisateurs passe à "1"
- ✅ L'utilisateur 1 disparaît de la liste
- ✅ Le curseur de l'utilisateur 1 disparaît

---

### 6. Test de reconnexion

**Objectif** : Vérifier la reconnexion automatique

**Étapes** :
1. Ouvrir une vue dans le Studio
2. Arrêter le serveur backend (`Ctrl+C` dans le terminal)
3. Observer l'interface
4. Redémarrer le serveur backend
5. Attendre quelques secondes

**Résultat attendu** :
- ✅ Un message "Reconnecting..." apparaît quand le serveur est arrêté
- ✅ La connexion se rétablit automatiquement
- ✅ Le message disparaît quand la connexion est rétablie

---

### 7. Test de performance avec plusieurs onglets

**Objectif** : Vérifier que l'application reste fluide avec plusieurs onglets

**Étapes** :
1. Ouvrir 5-6 onglets dans le Studio
2. Basculer rapidement entre les onglets
3. Bouger la souris dans chaque onglet
4. Observer la fluidité

**Résultat attendu** :
- ✅ Le basculement entre onglets est instantané
- ✅ Pas de lag lors du mouvement de la souris
- ✅ Pas de fuite mémoire visible

---

### 8. Test de la liste des utilisateurs actifs

**Objectif** : Vérifier l'affichage de la liste des utilisateurs

**Étapes** :
1. Avec 2-3 fenêtres ouvertes sur la même vue
2. Cliquer sur le badge utilisateurs
3. Observer le popover

**Résultat attendu** :
- ✅ Le popover s'affiche
- ✅ Tous les utilisateurs sont listés
- ✅ Chaque utilisateur a sa couleur affichée
- ✅ Le statut "Connected" est affiché
- ✅ Le nombre d'utilisateurs est correct

---

## Tests avancés

### 9. Test de charge (optionnel)

**Objectif** : Tester avec plusieurs utilisateurs simultanés

**Étapes** :
1. Ouvrir 10 fenêtres/onglets différents
2. Tous sur la même vue
3. Bouger la souris dans plusieurs fenêtres

**Résultat attendu** :
- ✅ Tous les curseurs sont visibles
- ✅ Pas de dégradation majeure des performances
- ✅ Les événements sont bien synchronisés

---

### 10. Test de changement de vue

**Objectif** : Vérifier le comportement lors du changement de vue

**Étapes** :
1. Ouvrir 2 vues dans 2 onglets différents
2. Dans la fenêtre 1, être sur l'onglet "View 1"
3. Dans la fenêtre 2, être sur l'onglet "View 2"
4. Basculer les onglets

**Résultat attendu** :
- ✅ Les utilisateurs ne se voient que dans la même vue
- ✅ Changer d'onglet met à jour la liste des utilisateurs
- ✅ Les curseurs ne s'affichent que pour la vue active

---

## Checklist de validation

### Fonctionnalités de base
- [ ] Système d'onglets fonctionne
- [ ] Connexion WebSocket établie
- [ ] Badge utilisateurs affiche le bon nombre
- [ ] Liste des utilisateurs accessible

### Collaboration
- [ ] Curseurs collaboratifs visibles
- [ ] Curseurs suivent les mouvements en temps réel
- [ ] Noms d'utilisateurs affichés
- [ ] Couleurs différentes par utilisateur

### Robustesse
- [ ] Déconnexion gérée correctement
- [ ] Reconnexion automatique fonctionne
- [ ] Pas de crash avec plusieurs onglets
- [ ] Performances acceptables

### UX
- [ ] Interface fluide et réactive
- [ ] Indicateurs visuels clairs
- [ ] Pas de confusion entre les vues
- [ ] Fermeture d'onglets intuitive

---

## Problèmes connus et limitations

### ⚠️ Limitations actuelles

1. **Synchronisation partielle** : Seuls les curseurs sont synchronisés en temps réel. Les modifications de nœuds/relations ne sont pas encore synchronisées.

2. **Utilisateurs fictifs** : Les noms d'utilisateurs sont générés aléatoirement. L'intégration avec le système d'authentification n'est pas encore faite.

3. **Pas de persistance** : Les modifications ne sont pas sauvegardées automatiquement.

4. **Pas de gestion de conflits** : Si deux utilisateurs modifient le même élément, le dernier gagne (last-write-wins).

### 🐛 Bugs potentiels

1. **Curseurs fantômes** : Parfois, un curseur peut rester affiché après la déconnexion d'un utilisateur. Rafraîchir la page résout le problème.

2. **Reconnexion lente** : La reconnexion peut prendre quelques secondes après un arrêt du serveur.

3. **Performance avec beaucoup d'utilisateurs** : Non testé avec plus de 10 utilisateurs simultanés.

---

## Logs de débogage

### Console navigateur

Pour voir les événements WebSocket :
```javascript
// Ouvrir la console (F12)
// Les logs suivants devraient apparaître :
- "Connected to collaboration server"
- "User joined: User XXX"
- "User left: XXX"
```

### Console serveur

Pour voir les événements côté serveur :
```bash
# Dans le terminal du serveur
[CollaborationGateway] Client connected: abc123
[CollaborationGateway] User User 456 joined view view-123
[CollaborationGateway] Client disconnected: abc123
```

---

## Rapport de test

**Date** : ___________
**Testeur** : ___________
**Version** : ___________

### Résultats

| Test | Status | Notes |
|------|--------|-------|
| Système d'onglets | ⬜ PASS / ⬜ FAIL | |
| Connexion WebSocket | ⬜ PASS / ⬜ FAIL | |
| Multi-utilisateurs | ⬜ PASS / ⬜ FAIL | |
| Curseurs collaboratifs | ⬜ PASS / ⬜ FAIL | |
| Déconnexion | ⬜ PASS / ⬜ FAIL | |
| Reconnexion | ⬜ PASS / ⬜ FAIL | |
| Performance | ⬜ PASS / ⬜ FAIL | |
| Liste utilisateurs | ⬜ PASS / ⬜ FAIL | |

### Observations

_Ajouter vos observations ici_

### Bugs trouvés

_Lister les bugs découverts_

### Améliorations suggérées

_Proposer des améliorations_
