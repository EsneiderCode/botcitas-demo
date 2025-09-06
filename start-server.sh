#!/bin/bash

# Script para iniciar el servidor local para el bot de WhatsApp

echo "🚀 Iniciando servidor para el bot de WhatsApp..."
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado."
    echo "📥 Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

# Verificar si el archivo de configuración existe
if [ ! -f "config-openai.js" ]; then
    echo "❌ Archivo config-openai.js no encontrado."
    echo "📝 Asegúrate de estar en el directorio correcto del proyecto."
    exit 1
fi

# Verificar si la API Key está configurada
if grep -q "TU_API_KEY_AQUI" config-openai.js; then
    echo "⚠️  ADVERTENCIA: API Key no configurada."
    echo "📝 Edita config-openai.js y reemplaza 'TU_API_KEY_AQUI' con tu API Key real."
    echo ""
fi

echo "🌐 Iniciando servidor en puerto 3000..."
echo "📱 Abre tu navegador en: http://localhost:3000/public/conversations.html"
echo "🛑 Presiona Ctrl+C para detener el servidor"
echo ""

# Iniciar el servidor
node server-simple.js
