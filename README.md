# 🤖 Bot de WhatsApp para Agendación de Citas - Deutsche Glasfaser

Bot automatizado de WhatsApp Business para agendación de citas de instalación de fibra óptica, desarrollado para Deutsche Glasfaser con soporte multiidioma (Alemán, Inglés, Español).

## 🌟 Características Principales

- **📱 WhatsApp Business Integration**: Totalmente integrado con WhatsApp Business API
- **🌍 Multiidioma**: Soporte para Alemán (principal), Inglés y Español
- **📅 Agendación Inteligente**: Sistema completo de reserva de citas
- **🎯 Botones Interactivos**: Interfaz optimizada con botones de respuesta rápida
- **📊 Panel de Administración**: Gestión de conversaciones y citas
- **💻 Simulador Web**: Demo interactivo de la funcionalidad del bot
- **🔄 Estados de Conversación**: Manejo inteligente del flujo de chat
- **📋 Gestión de Datos**: Exportación a Excel y manejo de recordatorios

## 🚀 Demo en Vivo

🔗 **Demo Principal**: [https://esneidercode.github.io/botcitas-demo/](https://esneidercode.github.io/botcitas-demo/)

📱 **Simulador Directo**: [https://esneidercode.github.io/botcitas-demo/conversations.html](https://esneidercode.github.io/botcitas-demo/conversations.html)

💻 **Desarrollo Local**: `http://localhost:3000/conversations.html`

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Entorno de ejecución
- **whatsapp-web.js** - Librería para WhatsApp Web
- **Express.js** - Servidor web
- **Moment.js** - Manejo de fechas multiidioma
- **ExcelJS** - Generación de reportes
- **Socket.IO** - Comunicación en tiempo real
- **HTML/CSS/JS** - Interfaz del simulador

## ⚠️ IMPORTANTE - Configuración de API Keys

**🔐 SEGURIDAD CRÍTICA:** Este repositorio contiene placeholders para API Keys. **NUNCA** pongas tus API Keys reales en un repositorio público.

### Para usar el bot con funcionalidades completas:

1. **Configura OpenAI** (para chat inteligente):
   - Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Crea una API Key
   - Edita `config-openai.js` y reemplaza `'TU_API_KEY_AQUI'` con tu API Key real

2. **Configura ElevenLabs** (para mensajes de voz):
   - Ve a [https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
   - Crea una API Key
   - Edita `config-elevenlabs.js` y reemplaza `'TU_ELEVENLABS_API_KEY_AQUI'` con tu API Key real

3. **Ejecuta localmente** (no en GitHub Pages):
   ```bash
   python3 -m http.server 8000
   # O usa: ./start-server.sh
   ```

## 📦 Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/EsneiderCode/botcitas-demo.git
   cd botcitas-demo
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura el entorno:**
   ```bash
   cp config.example.js config.js
   # Edita config.js con tu configuración
   ```

4. **Inicia el bot:**
   ```bash
   npm start
   ```

5. **Escanea el código QR** que aparece en la consola con WhatsApp Web

## 🎯 Uso del Bot

### Flujo de Conversación:

1. **Selección de Idioma**: El usuario elige entre 🇩🇪 Alemán, 🇺🇸 Inglés o 🇪🇸 Español
2. **Confirmación de Agendamiento**: El bot ofrece agendar la instalación
3. **Horarios Disponibles**: Muestra 2 opciones + "Ver más horarios"
4. **Confirmación**: El usuario confirma o cambia el horario
5. **Recordatorio**: Opción de recibir recordatorio por WhatsApp
6. **Finalización**: Confirmación completa con todos los detalles

### Comandos Disponibles:

- `1` - Agendar nueva cita
- `Agendar` / `Schedule` / `Termin` - Iniciar proceso de agendamiento

## 📊 Panel de Administración

Accede al panel web en `http://localhost:3000` para:

- Ver todas las conversaciones en tiempo real
- Gestionar citas agendadas
- Exportar datos a Excel
- Monitorear estadísticas del bot

## 🌐 Simulador Web

El proyecto incluye un simulador completo del bot en `public/conversations.html` que replica:

- ✅ Interfaz exacta de WhatsApp en iPhone
- ✅ Botones interactivos reales
- ✅ Flujo completo de agendación
- ✅ Soporte multiidioma
- ✅ Optimización para WhatsApp Business API (máximo 3 botones)

## 📁 Estructura del Proyecto

```
botcitas-demo/
├── modules/
│   ├── whatsappBot.js          # Lógica principal del bot
│   ├── conversationsManager.js # Gestión de conversaciones
│   ├── excelManager.js         # Exportación a Excel
│   └── webServer.js            # Servidor web
├── public/
│   ├── index.html              # Panel principal
│   ├── conversations.html      # Simulador del bot
│   └── demo.html              # Demo página
├── config.example.js           # Configuración de ejemplo
├── index.js                   # Punto de entrada
└── package.json               # Dependencias
```

## ⚙️ Configuración

Edita `config.js` para personalizar:

```javascript
module.exports = {
  bot: {
    defaultCountryCode: '49', // Código de país (Alemania)
    sessionName: 'deutsche-glasfaser-bot'
  },
  server: {
    port: 3000
  },
  whatsapp: {
    qrCodeInTerminal: true
  }
};
```

## 🌍 Soporte Multiidioma

El bot detecta automáticamente y soporta:

- **🇩🇪 Alemán**: Idioma principal para clientes de Deutsche Glasfaser
- **🇺🇸 Inglés**: Para clientes internacionales
- **🇪🇸 Español**: Soporte adicional

## 📱 Optimización WhatsApp Business

- ✅ Máximo 3 botones por mensaje (límite de la API)
- ✅ Mensajes combinados para reducir costos
- ✅ Botones de respuesta rápida oficiales
- ✅ Estados de conversación persistentes

## 🔧 Desarrollo

Para contribuir al proyecto:

1. Haz fork del repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -m "Agregar nueva funcionalidad"`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Reporta bugs en Issues
2. Sugiere nuevas características
3. Mejora la documentación
4. Optimiza el código

## 📞 Soporte

Para soporte y preguntas:

- 📧 Email: [tu-email@ejemplo.com]
- 💬 WhatsApp: [+49-xxx-xxx-xxxx]
- 🐛 Issues: [GitHub Issues](https://github.com/EsneiderCode/botcitas-demo/issues)

---

⭐ **¡Si te gusta este proyecto, no olvides darle una estrella!** ⭐ 