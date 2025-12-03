#!/bin/bash

# Script de test pour diagnostiquer les problèmes WebSocket Socket.io

DOMAIN="${1:-http://localhost:3002}"
NAMESPACE="/collaboration"

echo "🔍 Test de connexion WebSocket Socket.io"
echo "========================================"
echo ""
echo "Domain: $DOMAIN"
echo "Namespace: $NAMESPACE"
echo ""

# Test 1: Handshake polling (HTTP)
echo "📡 Test 1: Handshake polling (HTTP)"
echo "-----------------------------------"
POLLING_URL="${DOMAIN}${NAMESPACE}/socket.io/?EIO=4&transport=polling"
echo "URL: $POLLING_URL"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$POLLING_URL" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Succès! Le handshake polling fonctionne"
    echo "Réponse:"
    echo "$BODY" | head -c 500
    echo ""
    echo ""
    
    # Extraire le sid si présent
    SID=$(echo "$BODY" | grep -o '"sid":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$SID" ]; then
        echo "Session ID (sid): $SID"
        echo ""
        
        # Test 2: Connexion WebSocket avec le sid
        echo "📡 Test 2: Connexion WebSocket (nécessite wscat)"
        echo "-----------------------------------"
        WS_URL="${DOMAIN}${NAMESPACE}/socket.io/?EIO=4&transport=websocket&sid=${SID}"
        echo "URL WebSocket: $WS_URL"
        echo ""
        echo "Pour tester la connexion WebSocket, installez wscat et exécutez:"
        echo "  npm install -g wscat"
        echo "  wscat -c \"ws://votre-domaine.com/api/collaboration/socket.io/?EIO=4&transport=websocket&sid=${SID}\""
    fi
else
    echo "❌ Échec! Code HTTP: $HTTP_CODE"
    echo "Réponse:"
    echo "$BODY"
    echo ""
    echo "🔧 Vérifications à faire:"
    echo "  1. Le backend est-il démarré sur le port correct?"
    echo "  2. Le reverse proxy route-t-il correctement /api vers le backend?"
    echo "  3. Les logs Nginx montrent-ils des erreurs?"
    echo "  4. Le namespace '/collaboration' est-il correctement configuré côté backend?"
fi

echo ""
echo "========================================"
echo "Test terminé"



