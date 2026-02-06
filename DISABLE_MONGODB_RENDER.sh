#!/bin/bash

# Script para desabilitar MongoDB em Render (usar MockDB)
# Executa via: heroku config:set ... ou render control panel

echo "🔧 DESABILITAR MONGODB NO RENDER"
echo ""
echo "Passo 1: Vá para https://dashboard.render.com"
echo "Passo 2: Clique no seu serviço (grupogel)"
echo "Passo 3: Vá em 'Environment'"
echo "Passo 4: Procure por MONGODB_URI"
echo "Passo 5: DELETE a variável ou deixe VAZIA"
echo "Passo 6: Clique em 'Save' (fará auto-deploy)"
echo ""
echo "Aguarde 2-3 minutos pelo deploy"
echo "Teste em: https://grupogel.onrender.com"
echo ""
echo "✅ Isso vai usar MockDB com fallback automático!"
