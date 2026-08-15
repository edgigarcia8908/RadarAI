#!/bin/bash
set -e

echo "=== RadarAI — Deploy ==="

cd /home/radar/repo

echo "1. Descargando cambios de GitHub..."
git checkout -- backend/package-lock.json package-lock.json 2>/dev/null || true
git pull origin main

echo "2. Instalando dependencias..."
npm install --no-fund --no-audit

echo "3. Variables de entorno del backend..."
if [ ! -f backend/.env ]; then
    echo "   ⚠️ ADVERTENCIA: no existe backend/.env — créalo antes de que el backend arranque (ver backend/.env.example)."
fi
if ! grep -q "^ANTHROPIC_API_KEY=..*\|^OPENAI_API_KEY=..*" backend/.env 2>/dev/null; then
    echo "   ℹ️  AVISO: sin ANTHROPIC_API_KEY/OPENAI_API_KEY — funciona igual, con plantillas en vez de redacción de IA."
fi
mkdir -p backend/uploads

echo "4. Compilando backend..."
(cd backend && npm run build) || true

echo "4.1 Configurando logs..."
mkdir -p /home/radar/logs

if pm2 describe radaraibackend > /dev/null 2>&1
then
    echo "   Reiniciando instancia PM2 existente..."
    pm2 restart radaraibackend --update-env
else
    echo "   Creando nueva instancia PM2..."
    pm2 start dist/main.js \
      --name radaraibackend \
      --cwd /home/radar/repo/backend \
      --output /home/radar/logs/backend-out.log \
      --error /home/radar/logs/backend-error.log \
      --time
fi
pm2 save

echo "5. Compilando y publicando el frontend..."
cd /home/radar/repo/frontend
npm install --no-fund --no-audit
npm run build

mkdir -p /home/radar/public_html
rm -rf /home/radar/public_html/*
cp -r dist/* /home/radar/public_html/

echo "=== Deploy completado correctamente ==="
echo ""
echo "Recordatorio único (no lo hace este script): en Virtualmin, dominio"
echo "radar.ceoclick.pro, agregá el proxy que ya usás para tus otros backends:"
echo "  /api  -> http://127.0.0.1:4500/api"
echo "El resto del dominio sigue sirviendo public_html como estático, normal."
echo ""
echo "Si es la PRIMERA vez que desplegás esta app, antes de correr este script:"
echo "  mkdir -p /home/radar && cd /home/radar"
echo "  git clone https://github.com/edgigarcia8908/RadarAI.git repo"
echo "  cd repo/backend && cp .env.example .env   # y completar con los valores reales"
