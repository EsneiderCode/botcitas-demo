@echo off
REM Script para iniciar el servidor local para el bot de WhatsApp (Windows)

echo 🚀 Iniciando servidor para el bot de WhatsApp...
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado.
    echo 📥 Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si el archivo de configuración existe
if not exist "config-openai.js" (
    echo ❌ Archivo config-openai.js no encontrado.
    echo 📝 Asegúrate de estar en el directorio correcto del proyecto.
    pause
    exit /b 1
)

REM Verificar si la API Key está configurada
findstr /C:"TU_API_KEY_AQUI" config-openai.js >nul
if %errorlevel% equ 0 (
    echo ⚠️  ADVERTENCIA: API Key no configurada.
    echo 📝 Edita config-openai.js y reemplaza 'TU_API_KEY_AQUI' con tu API Key real.
    echo.
)

echo 🌐 Iniciando servidor en puerto 3000...
echo 📱 Abre tu navegador en: http://localhost:3000/public/conversations.html
echo 🛑 Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar el servidor
node server-simple.js
