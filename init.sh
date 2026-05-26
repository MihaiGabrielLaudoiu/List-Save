#!/bin/bash
echo "=== List & Save — Verificando entorno ==="

# 1. Dependencias
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules no encontrado, instalando..."
  pnpm install --silent
fi

# 2. Chequeo básico de Node
pnpm run check
if [ $? -ne 0 ]; then
  echo "❌ Entorno Node roto. Revisar antes de continuar."
  exit 1
fi

# 3. Suite de tests (cuando existan)
if pnpm run test 2>&1 | grep -q "Missing script\|no test"; then
  echo "⚠️  No hay tests aún (feature #3 pendiente). Saltando."
else
  pnpm test
  if [ $? -ne 0 ]; then
    echo "❌ Tests fallando. Reparar proyecto antes de nuevas tareas."
    exit 1
  fi
fi

# 4. Verificar que el CSS compilado existe
if [ ! -f "scss/main.css" ]; then
  echo "⚠️  main.css no existe, compilando SCSS..."
  pnpm dlx sass scss/main.scss scss/main.css --no-source-map
fi

echo "✅ Todo en orden. Listo para programar."
exit 0
