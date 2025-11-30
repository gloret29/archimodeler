# Guide de déploiement ArchiModeler sur Proxmox

Ce guide explique comment utiliser le script `deploy-proxmox.sh` pour déployer automatiquement ArchiModeler sur une VM Proxmox.

## Prérequis

### Sur le serveur Proxmox

1. **Proxmox VE** installé et fonctionnel
2. **Template Ubuntu 22.04 Cloud Image** disponible
   - Télécharger depuis: https://cloud-images.ubuntu.com/jammy/current/
   - Uploader dans Proxmox: `qm create 9000 --name ubuntu-22.04-cloud --memory 1024 --net0 virtio,bridge=vmbr0`
   - Importer l'image: `qm disk import 9000 jammy-server-cloudimg-amd64.img local-lvm`
   - Configurer: `qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0`
   - Convertir en template: `qm template 9000`
3. **Accès SSH** configuré avec clés SSH
4. **Privilèges root** ou sudo sur le serveur Proxmox
5. **Outils Proxmox** installés (`pve-cluster`, `pve-manager`)

### Base de données PostgreSQL

- PostgreSQL 14+ installé et accessible depuis la VM
- Base de données créée (ou le script peut la créer si vous avez les droits)
- Utilisateur avec les permissions nécessaires

## Utilisation

### 1. Préparer le script

```bash
# Sur le serveur Proxmox, rendre le script exécutable
chmod +x deploy-proxmox.sh
```

### 2. Exécuter le script

```bash
sudo ./deploy-proxmox.sh
```

### 3. Répondre aux questions

Le script vous demandera les informations suivantes :

#### Configuration Proxmox
- **ID de la VM** : Un ID unique (ex: 100, 101, etc.)
- **Nom de la VM** : Nom descriptif (ex: archimodeler-prod)
- **Stockage Proxmox** : Nom du stockage (ex: local-lvm, local-zfs)
- **Pool Proxmox** : Optionnel, laissez vide si aucun pool
- **Réseau Proxmox** : Interface réseau (ex: vmbr0)
- **Taille du disque** : En GB (recommandé: 50GB minimum)
- **Mémoire RAM** : En MB (recommandé: 4096MB minimum, 8192MB pour production)
- **Nombre de CPU** : Nombre de cores (recommandé: 2 minimum, 4 pour production)
- **ID du template** : ID du template Ubuntu (ex: 9000)
- **Adresse IP de la VM** : IP statique avec masque (ex: 192.168.1.100/24)
- **Passerelle** : IP de la passerelle (ex: 192.168.1.1)
- **Serveurs DNS** : DNS servers (ex: 8.8.8.8 8.8.4.4)
- **Clé publique SSH** : Chemin vers la clé ou contenu de la clé

#### Configuration Base de données
- **Hôte PostgreSQL** : IP ou hostname du serveur PostgreSQL
- **Port PostgreSQL** : Port (défaut: 5432)
- **Nom de la base de données** : Nom de la base (ex: archimodeler)
- **Utilisateur PostgreSQL** : Nom d'utilisateur
- **Mot de passe PostgreSQL** : Mot de passe (masqué)

#### Configuration Application
- **JWT Secret** : Clé secrète pour JWT (laissez vide pour génération automatique)
- **Port du serveur backend** : Port de l'API (défaut: 3002)
- **URL publique de l'API** : URL complète de l'API (ex: https://api.votredomaine.com)
- **URL publique du frontend** : URL complète du frontend (ex: https://votredomaine.com)

#### Configuration optionnelle
- **Neo4j URI** : Optionnel, URI de connexion Neo4j
- **Neo4j User** : Optionnel, utilisateur Neo4j
- **Neo4j Password** : Optionnel, mot de passe Neo4j
- **OpenSearch Node** : Optionnel, URL du nœud OpenSearch
- **OpenAI API Key** : Optionnel, clé API OpenAI pour les fonctionnalités AI

#### Configuration Git
- **URL du repository Git** : URL du repository (ex: https://github.com/gloret29/archimodeler.git)
- **Branche à déployer** : Branche Git (défaut: main)

## Ce que fait le script

Le script effectue automatiquement les étapes suivantes :

1. **Création de la VM** sur Proxmox avec la configuration spécifiée
2. **Démarrage de la VM** et attente de la disponibilité SSH
3. **Installation des dépendances** :
   - Mise à jour du système
   - Installation de Node.js 22.x
   - Installation de npm, git, nginx, certbot
   - Installation de PM2 pour la gestion des processus
   - Configuration du firewall (UFW)
4. **Configuration de l'application** :
   - Clonage du repository Git
   - Installation des dépendances npm
   - Configuration des variables d'environnement
   - Génération du client Prisma
   - Exécution des migrations de base de données
   - Seed de la base de données
   - Build de l'application
5. **Configuration des services systemd** :
   - Service pour le backend (archimodeler-backend)
   - Service pour le frontend (archimodeler-frontend)
   - Démarrage automatique au boot
6. **Configuration de Nginx** :
   - Reverse proxy pour le frontend (port 3000)
   - Reverse proxy pour l'API (port 3002)
   - Configuration WebSocket pour la collaboration
   - Configuration pour la documentation API

## Après le déploiement

### Vérifier les services

```bash
# Se connecter à la VM
ssh root@<IP_VM>

# Vérifier le statut des services
systemctl status archimodeler-backend
systemctl status archimodeler-frontend
systemctl status nginx
```

### Voir les logs

```bash
# Logs du backend
journalctl -u archimodeler-backend -f

# Logs du frontend
journalctl -u archimodeler-frontend -f

# Logs Nginx
journalctl -u nginx -f
```

### Redémarrer les services

```bash
systemctl restart archimodeler-backend
systemctl restart archimodeler-frontend
systemctl restart nginx
```

### Configurer SSL/TLS avec Let's Encrypt

```bash
# Sur la VM
certbot --nginx -d votre-domaine.com -d api.votre-domaine.com
```

Le certificat sera automatiquement renouvelé grâce à systemd timer.

### Mettre à jour l'application

```bash
# Se connecter à la VM
ssh root@<IP_VM>

# Passer en utilisateur archimodeler
su - archimodeler

# Aller dans le répertoire de l'application
cd /opt/archimodeler

# Mettre à jour le code
git pull origin main

# Rebuild l'application
npm run build

# Redémarrer les services
exit
systemctl restart archimodeler-backend
systemctl restart archimodeler-frontend
```

## Dépannage

### La VM ne démarre pas

- Vérifier les logs Proxmox : `journalctl -u pve-cluster`
- Vérifier la configuration réseau dans Proxmox
- Vérifier que le template est correctement configuré

### Les services ne démarrent pas

- Vérifier les logs : `journalctl -u archimodeler-backend -n 50`
- Vérifier les variables d'environnement : `cat /opt/archimodeler/apps/server/.env`
- Vérifier la connexion à la base de données : `psql $DATABASE_URL -c "SELECT 1;"`

### Erreur de connexion à la base de données

- Vérifier que PostgreSQL est accessible depuis la VM
- Vérifier les credentials dans le fichier `.env`
- Vérifier que le firewall PostgreSQL autorise les connexions depuis la VM

### Nginx ne fonctionne pas

- Vérifier la configuration : `nginx -t`
- Vérifier les logs : `tail -f /var/log/nginx/error.log`
- Vérifier que les services backend et frontend sont démarrés

## Sécurité

### Recommandations

1. **Changer les mots de passe par défaut** après le premier déploiement
2. **Configurer SSL/TLS** avec Let's Encrypt
3. **Configurer un firewall** strict (déjà fait par le script)
4. **Mettre à jour régulièrement** le système et l'application
5. **Configurer des sauvegardes** régulières de la base de données
6. **Utiliser des clés SSH** au lieu de mots de passe
7. **Configurer fail2ban** (déjà installé par le script)

### Sauvegardes

```bash
# Script de sauvegarde de la base de données (à exécuter régulièrement)
#!/bin/bash
BACKUP_DIR="/var/backups/archimodeler"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/archimodeler_$DATE.sql
# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

## Support

Pour toute question ou problème, consultez :
- La documentation du projet : [README.md](README.md)
- Les issues GitHub : [GitHub Issues](https://github.com/gloret29/archimodeler/issues)


