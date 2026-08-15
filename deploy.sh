#!/bin/bash
set -e

echo "=== RadarAI — Deploy ==="

cd /home/radar/repo

echo "1. Descargando cambios de GitHub..."
# El "npm install" del paso 3 reescribe package-lock.json en cada deploy
# (los .tgz de auth-client/database/intelligence-client cambian de hash al
# reempaquetarse), y esa reescritura nunca se commitea — así que el próximo
# "git pull" la encuentra como cambio local sin commitear y aborta. Se
# descarta antes de jalar, siempre: es un archivo generado (mismo fix que
# uniminuto/deploy.sh).
git checkout -- backend/package-lock.json 2>/dev/null || true
git pull origin main

echo "2. Actualizando ceo-core-modules (carpeta hermana)..."
# backend/ depende de @ceo-core/auth-client, @ceo-core/database y
# @ceo-core/intelligence-client vía "file:../../ceo-core-modules/packages/..."
# — asume que ceo-core-modules vive en /home/radar/ceo-core-modules
# (hermano de esta carpeta repo).
cd /home/radar
if [ -d ceo-core-modules/.git ]; then
    echo "   ceo-core-modules ya existe — actualizando..."
    cd ceo-core-modules
    git pull origin main
else
    echo "   ceo-core-modules no existe — clonando..."
    git clone "https://${GITHUB_TOKEN}@github.com/edgigarcia8908/ceo-core-modules.git" ceo-core-modules
    cd ceo-core-modules
fi
npm install --no-fund --no-audit --legacy-peer-deps

echo "2.1 Empaquetando @ceo-core/auth-client, @ceo-core/database y @ceo-core/intelligence-client como .tgz..."
# Se consumen como file:.../ceo-core-X-1.0.0.tgz, NO file: a la carpeta
# cruda — así npm instala sus dependencias normal, sin necesitar
# --preserve-symlinks. IMPORTANTE: compilar ANTES de empaquetar — sin esto,
# npm pack mete el .ts crudo (dist/ nunca existe en un clon limpio, está en
# .gitignore) y el backend no puede cargarlo al arrancar (mismo bug ya
# resuelto en ceo-auth-service/uniminuto — ver PLAN-servicios-independientes.md).
(cd packages/ceo-auth-client && npm run build && rm -f *.tgz && npm pack)
(cd packages/ceo-database && npm run build && rm -f *.tgz && npm pack)
(cd packages/ceo-intelligence-client && npm run build && rm -f *.tgz && npm pack)

cd /home/radar/repo/backend

echo "3. Instalando dependencias del backend..."
# Mismo motivo que uniminuto/ceo-auth-service: los .tgz se re-empaquetan
# arriba con el MISMO nombre de archivo cada vez — si el contenido cambió,
# el hash ya no coincide con el que package-lock.json tenía grabado, y npm
# aborta con EINTEGRITY. Se borra lockfile + caché + node_modules/@ceo-core
# para forzar una extracción real en cada deploy.
rm -f package-lock.json
rm -f ../package-lock.json
rm -rf node_modules/@ceo-core
rm -rf ../node_modules/@ceo-core
npm cache clean --force
npm install --no-fund --no-audit

echo "4. Variables de entorno del backend..."
if [ ! -f .env ]; then
    echo "   ⚠️ ADVERTENCIA: no existe backend/.env — créalo antes de que el backend arranque (ver backend/.env.example)."
fi
if ! grep -q "^STORAGE_SERVICE_KEY=" .env 2>/dev/null || [ -z "$(grep '^STORAGE_SERVICE_KEY=' .env | cut -d= -f2-)" ]; then
    echo "   ⚠️ ADVERTENCIA: falta STORAGE_SERVICE_KEY en backend/.env."
fi
if ! grep -q "^CEO_INTELLIGENCE_SERVICE_URL=" .env 2>/dev/null || grep -q "^CEO_INTELLIGENCE_SERVICE_URL=http://localhost" .env 2>/dev/null; then
    echo "   ⚠️ AVISO: CEO_INTELLIGENCE_SERVICE_URL sigue apuntando a localhost — mientras ceo-intelligence-service"
    echo "   no esté desplegado en intel.ceoclick.pro, las respuestas usan la plantilla sin IA (funciona igual, sin redacción de IA)."
fi

echo "5. Compilando backend..."
npm run build || true

echo "5.1 Configurando logs..."
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

echo "6. Compilando y publicando el frontend..."
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
echo "  (ver C:\apps\RadarAI\backend\.env local para copiar los valores reales)"
