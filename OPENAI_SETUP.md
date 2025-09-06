# 🤖 Configuración de OpenAI para el Bot de WhatsApp

## 📋 Instrucciones de Configuración

### 1. Obtener API Key de OpenAI

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Inicia sesión en tu cuenta de OpenAI
3. Haz clic en "Create new secret key"
4. Copia la API Key generada (empieza con `sk-`)

### 2. Configurar la API Key

1. Abre el archivo `config-openai.js`
2. Reemplaza `'TU_API_KEY_AQUI'` con tu API Key real:

```javascript
const OPENAI_CONFIG = {
    apiKey: 'sk-tu-api-key-real-aqui',
    // ... resto de configuración
};
```

### 3. Configuración Opcional

Puedes ajustar estos parámetros en `config-openai.js`:

- **model**: Modelo a usar (`gpt-4o-mini` recomendado para mejor precio/rendimiento)
- **maxTokens**: Máximo de tokens por respuesta (500 por defecto)
- **temperature**: Creatividad de las respuestas (0.7 por defecto)

### 4. Usar el Bot

**⚠️ IMPORTANTE: No abras el archivo directamente en el navegador**

Debes usar un servidor web local para evitar errores de CORS:

#### Opción 1: Servidor incluido (Recomendado)
```bash
# En macOS/Linux
./start-server.sh

# En Windows
start-server.bat
```

#### Opción 2: Python (si tienes Python instalado)
```bash
python -m http.server 8000
# Luego abre: http://localhost:8000/public/conversations.html
```

#### Opción 3: Node.js manual
```bash
node server-simple.js
# Luego abre: http://localhost:3000/public/conversations.html
```

### 5. Activar el Modo AI

1. Abre la URL del servidor en tu navegador
2. Haz clic en "🤖 Modo AI" para activar el chat con OpenAI
3. ¡Ya puedes chatear con el bot inteligente!

## 🎯 Características del Bot

### Prompt Optimizado
El bot está configurado con un prompt especializado que:

- ✅ Responde en el idioma del cliente (alemán, inglés, español)
- ✅ Mantiene contexto de conversación
- ✅ Es profesional pero amigable
- ✅ Usa formato WhatsApp con emojis
- ✅ Conoce información específica de CLARITY
- ✅ Puede ayudar con citas, modificaciones, cancelaciones
- ✅ Escala a soporte humano cuando es necesario

### Información del Cliente
El bot conoce estos datos:
- **Cliente**: Christian Weber
- **Teléfono**: +49 151 1947 0267
- **Dirección**: Musterstraße 15, 10115 Berlin
- **Contrato**: DG-2024-89756

## 🔧 Modos de Funcionamiento

### Modo Demo (Por defecto)
- Simulación predefinida del flujo de agendamiento
- No requiere API Key
- Perfecto para demostraciones

### Modo AI (Con OpenAI)
- Chat libre e inteligente
- Requiere API Key configurada
- Responde cualquier pregunta del cliente

## ⚠️ Consideraciones de Seguridad

- **NUNCA** subas tu API Key a repositorios públicos
- **NUNCA** compartas tu API Key con otros
- Considera usar variables de entorno en producción
- Monitorea el uso de tu API Key en el dashboard de OpenAI

## 💰 Costos

- **gpt-4o-mini**: ~$0.15 por 1M tokens de entrada, ~$0.60 por 1M tokens de salida
- Una conversación típica cuesta menos de $0.01
- Puedes establecer límites de uso en tu cuenta de OpenAI

## 🐛 Solución de Problemas

### Error: "Debes configurar tu API Key"
- Verifica que hayas reemplazado `'TU_API_KEY_AQUI'` con tu API Key real
- Asegúrate de que la API Key sea válida y activa

### Error: "OpenAI API error: 401"
- Tu API Key es inválida o ha expirado
- Genera una nueva API Key

### Error: "OpenAI API error: 429"
- Has excedido el límite de rate limit
- Espera unos minutos antes de intentar de nuevo

### Error de CORS o "Necesitas usar un servidor web local"
**Este es el error más común. Solución:**

1. **NO abras el archivo directamente** (`file://`)
2. **USA un servidor web local:**
   ```bash
   # Opción más fácil:
   ./start-server.sh
   
   # O con Python:
   python -m http.server 8000
   ```
3. **Abre la URL del servidor** (ej: `http://localhost:3000/public/conversations.html`)

### El bot no responde
- Verifica tu conexión a internet
- Revisa la consola del navegador para errores (F12)
- Asegúrate de que tu cuenta de OpenAI tenga créditos
- Verifica que estés usando un servidor web local

### El bot dice "intenta de nuevo o contacta soporte"
- Abre la consola del navegador (F12) para ver el error específico
- Verifica que tu API Key sea correcta
- Asegúrate de estar usando un servidor web local
- Revisa que tu cuenta de OpenAI tenga créditos disponibles

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica tu API Key en el dashboard de OpenAI
3. Consulta la documentación de OpenAI: [https://platform.openai.com/docs](https://platform.openai.com/docs)
