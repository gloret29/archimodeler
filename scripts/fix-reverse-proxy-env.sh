#!/bin/bash

# Script pour corriger la configuration des variables d'environnement pour le reverse proxy

set -e

echo "🔧 Configuration des variables d'environnement pour le reverse proxy"
echo ""

# Demander le domaine du reverse proxy
read -p "Entrez le domaine de votre reverse proxy (ex: archi.gloret.fr): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Le domaine ne peut pas être vide"
    exit 1
fi

# Demander le protocole
read -p "Utilisez-vous HTTPS? (y/n): " USE_HTTPS

if [ "$USE_HTTPS" = "y" ] || [ "$USE_HTTPS" = "Y" ]; then
    PROTOCOL="https"
else
    PROTOCOL="http"
fi

API_URL="${PROTOCOL}://${DOMAIN}"
WS_URL="${PROTOCOL}://${DOMAIN}"

echo ""
echo "📝 Configuration:"
echo "  - API URL: ${API_URL}"
echo "  - WS URL: ${WS_URL}"
echo ""

# Créer le fichier .env pour le frontend
ENV_FILE="apps/web/.env.production"

cat > "$ENV_FILE" << EOF
# API Configuration pour Reverse Proxy
# IMPORTANT: Ne pas utiliser d'IP locale (192.168.x.x) en production
# Utiliser le même domaine que le frontend pour que le reverse proxy route correctement

# Option 1: Utiliser le même domaine (recommandé)
# Le frontend ajoutera automatiquement le préfixe /api
NEXT_PUBLIC_API_URL="${API_URL}"
NEXT_PUBLIC_WS_URL="${WS_URL}"

# Option 2: Laisser vide pour utiliser automatiquement window.location.origin
# Décommentez les lignes suivantes et commentez celles ci-dessus:
# NEXT_PUBLIC_API_URL=""
# NEXT_PUBLIC_WS_URL=""

# Environment
NODE_ENV=production
EOF

echo "✅ Fichier créé: $ENV_FILE"
echo ""
echo "📋 Contenu du fichier:"
cat "$ENV_FILE"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Recompilez le frontend après avoir modifié les variables d'environnement:"
echo "      npm run build --workspace=@repo/web"
echo ""
echo "   2. Redémarrez le serveur de production"
echo ""
echo "   3. Vérifiez que le reverse proxy route correctement /api vers le backend"
echo ""



