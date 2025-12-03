#!/bin/bash

echo "=== Test du namespace Socket.io ==="
echo ""

BASE_URL="http://localhost:3002"

echo "1. Test Socket.io de base (sans namespace):"
curl -s "${BASE_URL}/socket.io/?EIO=4&transport=polling" | head -c 200
echo ""
echo ""

echo "2. Test namespace /collaboration:"
curl -s "${BASE_URL}/collaboration/socket.io/?EIO=4&transport=polling" 2>&1 | head -c 200
echo ""
echo ""

echo "3. Vérification des processus serveur:"
ps aux | grep -E "(nest|node.*3002)" | grep -v grep | head -3
echo ""

echo "4. Test via reverse proxy (si configuré):"
if [ -n "$REVERSE_PROXY_URL" ]; then
    curl -s "${REVERSE_PROXY_URL}/api/collaboration/socket.io/?EIO=4&transport=polling" 2>&1 | head -c 200
    echo ""
else
    echo "REVERSE_PROXY_URL non défini, skip"
fi


