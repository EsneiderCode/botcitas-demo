# 🎵 Configuración de ElevenLabs para Mensajes de Audio

## 📋 Instrucciones de Configuración

### 1. Obtener API Key de ElevenLabs

1. Ve a [https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
2. Inicia sesión en tu cuenta de ElevenLabs
3. Haz clic en "Create new API key"
4. Copia la API Key generada

### 2. Configurar la API Key

1. Abre el archivo `config-elevenlabs.js`
2. Reemplaza `'TU_ELEVENLABS_API_KEY_AQUI'` con tu API Key real:

```javascript
const ELEVENLABS_CONFIG = {
    apiKey: 'tu-api-key-real-aqui',
    // ... resto de configuración
};
```

### 3. Configuración de Voz

Puedes cambiar la voz modificando el `voiceId` en `config-elevenlabs.js`:

```javascript
// Voces recomendadas para el bot de atención al cliente
voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Masculino profesional
voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - Femenina profesional
voiceId: 'VR6AewLTigWG4xSOukaG', // Josh - Masculino joven
```

### 4. Usar el Bot con Audio

1. Configura tanto OpenAI como ElevenLabs
2. Inicia el servidor: `./start-server.sh`
3. Abre: `http://localhost:3000/public/conversations.html`
4. Activa "🤖 Modo AI"
5. ¡El bot responderá con audio para mensajes cortos!

## 🎯 Características del Sistema de Audio

### ✅ **Detección Automática**
El bot decide automáticamente cuándo usar audio:
- **Mensajes cortos** (< 100 caracteres)
- **Con emojis** (saludos, confirmaciones)
- **Sin información técnica** (horarios, códigos)

### ✅ **Interfaz Realista**
- Botón de play/pause como WhatsApp
- Waveform animado durante reproducción
- Duración del audio
- Indicador de carga

### ✅ **Control de Audio**
- Solo un audio se reproduce a la vez
- Pausa automática al cambiar de audio
- Controles intuitivos

## 🎨 Estilos Visuales

Los mensajes de audio se ven exactamente como WhatsApp:
- **Botón verde** con icono de play/pause
- **Waveform** con barras animadas
- **Duración** en el lado derecho
- **Colores** que cambian según el estado

## 🔧 Configuración Avanzada

### Ajustar Parámetros de Voz

```javascript
voiceSettings: {
    stability: 0.5,        // Estabilidad (0.0 - 1.0)
    similarity_boost: 0.5, // Similitud (0.0 - 1.0)
    style: 0.0,           // Estilo (0.0 - 1.0)
    use_speaker_boost: true // Mejora del altavoz
}
```

### Cambiar Criterios de Audio

Modifica la función `shouldUseAudio()` en `conversations.html`:

```javascript
shouldUseAudio(message) {
    const isShort = message.length < 100;  // Cambiar longitud
    const hasEmojis = /[📅🔄❌📋❓🎉📲👍⚠️🔧🌐⏰🔑💥🚀📝📡✅💬👋🏠📡🌐📋⚠️🔗]/.test(message);
    const hasTechnicalInfo = /(\d{2}:\d{2}|📅|📋|✅|❌|🔑|⚠️|🌐|⏰)/.test(message);
    
    return isShort && hasEmojis && !hasTechnicalInfo;
}
```

## 💰 Costos

- **Plan gratuito**: 10,000 caracteres/mes
- **Plan Starter**: $5/mes - 30,000 caracteres
- **Plan Creator**: $22/mes - 100,000 caracteres

Una conversación típica usa ~200-500 caracteres de audio.

## 🐛 Solución de Problemas

### Error: "Debes configurar tu API Key de ElevenLabs"
- Verifica que hayas reemplazado `'TU_ELEVENLABS_API_KEY_AQUI'` con tu API Key real
- Asegúrate de que la API Key sea válida y activa

### Error: "ElevenLabs API error: 401"
- Tu API Key es inválida o ha expirado
- Genera una nueva API Key

### Error: "ElevenLabs API error: 429"
- Has excedido el límite de caracteres
- Espera hasta el próximo mes o actualiza tu plan

### El audio no se reproduce
- Verifica tu conexión a internet
- Revisa la consola del navegador para errores
- Asegúrate de que tu cuenta tenga caracteres disponibles

### El audio se genera pero no se reproduce
- Verifica que el navegador soporte audio MP3
- Revisa la consola para errores de reproducción
- Prueba en otro navegador

## 🎵 Voces Disponibles

### Voces Masculinas Profesionales
- **Adam** (`pNInz6obpgDQGcFmaJgB`) - Recomendada para atención al cliente
- **Josh** (`VR6AewLTigWG4xSOukaG`) - Joven y amigable
- **Antoni** (`VR6AewLTigWG4xSOukaG`) - Profesional y claro
- **Arnold** (`yoZ06aMxZJJ28mfd3POQ`) - Maduro y confiable

### Voces Femeninas Profesionales
- **Bella** (`EXAVITQu4vr4xnSDxMaL`) - Recomendada para atención al cliente
- **Elli** (`MF3mGyEYCl7XYWbV9V6O`) - Profesional y clara
- **Sarah** (`N2lVS1w4EtoT3dr4eOWO`) - Amigable y profesional

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica tu API Key en el dashboard de ElevenLabs
3. Consulta la documentación: [https://docs.elevenlabs.io](https://docs.elevenlabs.io)
4. Verifica que tengas caracteres disponibles en tu cuenta

## 🚀 Ejemplo de Uso

```javascript
// Mensaje que se convertirá a audio
"👋 ¡Hola! ¿En qué puedo ayudarte?"

// Mensaje que permanecerá como texto
"📅 Tu cita está programada para el 15 de septiembre de 2024 a las 14:30"
```

¡El bot ahora será mucho más realista y atractivo con mensajes de audio!
