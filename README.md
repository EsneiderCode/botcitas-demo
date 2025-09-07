# 🚀 Bot de Citas CLARITY - Sistema Avanzado

Sistema empresarial de gestión de citas para instalaciones de fibra óptica con interfaz conversacional multilingüe, dashboard administrativo en tiempo real y arquitectura escalable.

## 🌟 Características Principales

### 🤖 Bot Conversacional Avanzado
- **Multilingüe**: Soporte completo para Español, Alemán e Inglés
- **State Machine**: Gestión robusta del flujo conversacional
- **Validaciones**: Error handling y recuperación automática
- **Persistencia**: Almacenamiento completo de conversaciones

### 📅 Gestión Inteligente de Citas
- **Horarios dinámicos**: Configuración flexible por días de la semana
- **Asignación automática**: Técnicos asignados por zona geográfica
- **Recordatorios**: Sistema automatizado de notificaciones
- **Cancelaciones**: Política de cancelación configurable
- **Exportación**: Archivos .ICS para calendarios

### 🎛️ Panel Administrativo
- **Monitoreo en tiempo real**: WebSocket para actualizaciones live
- **Estadísticas completas**: KPIs de rendimiento y satisfacción
- **Gestión de sesiones**: Vista detallada de conversaciones activas
- **Exportación de datos**: Excel, JSON y CSV
- **Dashboard visual**: Gráficos interactivos con Chart.js

### 🗃️ Persistencia de Datos
- **Excel nativo**: Almacenamiento con formato y colores
- **Backup automático**: Copias de seguridad programadas
- **Google Sheets**: Integración opcional
- **Base de datos**: Preparado para PostgreSQL/MongoDB

### 🔧 Arquitectura Empresarial
- **Node.js + Express**: Backend escalable y robusto
- **Socket.IO**: Comunicación en tiempo real
- **Configuración modular**: Sistema de configuración flexible
- **Logging avanzado**: Winston para monitoreo de producción
- **Seguridad**: Helmet, CORS, rate limiting

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js >= 16.0.0
- npm >= 8.0.0

### Configuración

1. **Clonar el repositorio**
```bash
git clone https://github.com/EsneiderCode/botcitas-demo.git
cd botcitas-demo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar el sistema**
```bash
cp config/config.example.js config/config.js
```

4. **Personalizar configuración**
Editar `config/config.js` con tus parámetros:
- Datos de la empresa
- Horarios disponibles
- Técnicos y zonas
- Configuración de idiomas

5. **Iniciar el servidor**
```bash
npm start
# o para desarrollo
npm run dev
```

6. **Abrir en navegador**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
botcitas-demo/
├── 🔧 config/                    # Configuración del sistema
│   ├── config.example.js         # Plantilla de configuración
│   └── config.js                 # Configuración personalizada (crear)
├── 🗃️ data/                      # Datos y backups
│   └── appointments.xlsx          # Base de datos principal
├── 🧩 modules/                   # Módulos del sistema
│   ├── conversationsManager.js   # Gestión de conversaciones
│   └── dataManager.js            # Persistencia de datos
├── 🎨 css/                       # Estilos de la interfaz
│   └── styles.css                # Estilos principales
├── ⚡ js/                        # Scripts del cliente
│   ├── app.js                    # Motor conversacional
│   ├── flows.js                  # Flujos de conversación
│   └── i18n.js                   # Internacionalización
├── 📂 ics/                       # Archivos de calendario
├── 🌐 HTML Pages                 # Interfaces web
│   ├── index.html                # Página principal
│   ├── conversations.html        # Demo conversacional
│   ├── admin.html                # Panel administrativo
│   ├── dashboard.html            # Dashboard de KPIs
│   ├── manager.html              # Gestor de clientes
│   └── settings.html             # Configuración
├── 🚀 server.js                  # Servidor principal
├── 📦 package.json               # Dependencias y scripts
└── 📚 README.md                  # Esta documentación
```

## 🎯 Guía de Uso

### 1. Demo Conversacional
**URL**: `http://localhost:3000/conversations.html`

- Simula la experiencia completa del bot
- Soporte multilingüe en tiempo real
- Flujo completo de agendamiento
- Generación automática de archivos .ICS

### 2. Panel Administrativo
**URL**: `http://localhost:3000/admin.html`

- Monitoreo en tiempo real de conversaciones
- Estadísticas de rendimiento
- Gestión de sesiones activas
- Exportación de datos

### 3. Dashboard de KPIs
**URL**: `http://localhost:3000/dashboard.html`

- Métricas de cumplimiento
- Ocupación por técnico
- Satisfacción del cliente (NPS)
- Gráficos interactivos

### 4. Gestor de Clientes
**URL**: `http://localhost:3000/manager.html`

- Carga masiva de clientes vía CSV
- Filtros por proyecto, estado y ubicación
- Lanzamiento directo de conversaciones
- Gestión bulk de citas

## 🔌 API REST

### Endpoints Principales

#### 🔍 Sistema
```http
GET /api/health           # Estado del sistema
GET /api/config           # Configuración pública
GET /api/stats            # Estadísticas completas
```

#### 💬 Conversaciones
```http
POST /api/conversation    # Procesar mensaje
GET /api/conversation/:id # Obtener sesión
```

#### 📅 Citas
```http
GET /api/appointments           # Listar citas (con filtros)
GET /api/appointments/:id       # Obtener cita específica
PUT /api/appointments/:id       # Actualizar cita
DELETE /api/appointments/:id    # Cancelar cita
```

#### 📊 Datos
```http
POST /api/export               # Exportar datos
GET /api/technicians           # Técnicos disponibles
GET /api/slots                 # Horarios disponibles
```

### Ejemplo de Uso de API

```javascript
// Procesar mensaje conversacional
const response = await fetch('/api/conversation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'user_12345',
    message: 'Hola, quiero agendar una cita',
    metadata: { userAgent: navigator.userAgent }
  })
});

const result = await response.json();
console.log(result.bot); // Respuesta del bot
console.log(result.quick); // Opciones rápidas
```

## 🔧 Configuración Avanzada

### Personalización de Horarios
```javascript
// config/config.js
appointments: {
  availableSlots: {
    1: ['09:00', '11:00', '14:00', '16:00'], // Lunes
    2: ['09:00', '11:00', '14:00', '16:00'], // Martes
    // ... resto de la semana
  },
  slotDuration: 120, // 2 horas
  timezone: 'Europe/Berlin'
}
```

### Configuración de Técnicos
```javascript
technicians: {
  'CLARITY-01': { 
    name: 'Miguel García', 
    zone: 'PLZ 29xxx', 
    active: true 
  },
  'CLARITY-02': { 
    name: 'Anna Schmidt', 
    zone: 'PLZ 30xxx', 
    active: true 
  }
  // ... más técnicos
}
```

### Personalización de Mensajes
Los mensajes están centralizados en `modules/conversationsManager.js` en el método `getLocalizedMessage()`.

## 🌐 WebSocket Events

### Eventos del Cliente
```javascript
socket.emit('joinSession', sessionId);
socket.emit('chatMessage', { sessionId, message, metadata });
socket.emit('heartbeat');
```

### Eventos del Servidor
```javascript
socket.on('sessionCreated', session => { /* Nueva sesión */ });
socket.on('appointmentCreated', appointment => { /* Nueva cita */ });
socket.on('statsUpdate', stats => { /* Estadísticas actualizadas */ });
socket.on('conversationUpdate', data => { /* Actividad de conversación */ });
```

## 📊 Formatos de Datos

### Estructura de Cita
```javascript
{
  id: "C-2025-0916-1300-ABC",
  sessionId: "session_xyz",
  customerName: "María García",
  phone: "+34 600 000 000",
  startTime: "2025-09-16T13:00:00+02:00",
  endTime: "2025-09-16T15:00:00+02:00",
  technician: "CLARITY-07",
  status: "confirmed", // pending, cancelled, completed
  language: "es",
  createdAt: "2025-09-05T20:30:00.000Z",
  reminderEnabled: true,
  notes: "Cliente prefiere llamada 1h antes"
}
```

### Estructura de Sesión
```javascript
{
  id: "session_12345",
  state: "CONFIRMATION",
  language: "es",
  startTime: "2025-09-05T20:30:00.000Z",
  lastActivity: "2025-09-05T20:35:00.000Z",
  context: {
    selectedSlot: { /* slot data */ },
    appointmentId: "C-2025-0916-1300-ABC",
    confirmed: true
  },
  messageHistory: [
    {
      timestamp: "2025-09-05T20:30:00.000Z",
      type: "user",
      content: "Hola",
      metadata: { /* metadata */ }
    }
  ],
  completed: false
}
```

## 🔐 Seguridad

### Medidas Implementadas
- **Helmet.js**: Headers de seguridad HTTP
- **CORS**: Control de origen cruzado
- **Rate Limiting**: Limitación de requests por IP
- **Input Sanitization**: Prevención de XSS
- **Session Management**: Gestión segura de sesiones

### Variables de Entorno
```bash
# .env
NODE_ENV=production
PORT=3000
HOST=localhost
DATABASE_URL=postgresql://user:pass@localhost/db
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

## 📈 Monitoreo y Logging

### Logs del Sistema
Los logs se guardan en `./logs/app.log` con rotación automática:

```bash
tail -f logs/app.log  # Seguir logs en tiempo real
```

### Métricas de Rendimiento
- **Tiempo de respuesta**: Medición automática de latencia
- **Uso de memoria**: Monitoreo de recursos del sistema
- **Conexiones activas**: Tracking de usuarios simultáneos
- **Tasa de conversión**: Conversaciones → Citas confirmadas

## 🚀 Despliegue en Producción

### Docker (Recomendado)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 (Alternativo)
```bash
npm install -g pm2
pm2 start server.js --name "botcitas-clarity"
pm2 startup
pm2 save
```

### Variables de Producción
```bash
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export LOG_LEVEL=warn
```

## 🤝 Contribución

1. **Fork** el repositorio
2. **Crear** rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** tus cambios: `git commit -m 'Añadir nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. **Abrir** un Pull Request

## 📝 Changelog

### v2.0.0 (2025-09-05)
- ✨ **Nuevo**: Sistema de gestión de conversaciones con State Machine
- ✨ **Nuevo**: Panel administrativo en tiempo real
- ✨ **Nuevo**: Persistencia avanzada con Excel y backups
- ✨ **Nuevo**: API REST completa
- ✨ **Nuevo**: WebSocket para comunicación en tiempo real
- ✨ **Nuevo**: Dashboard de KPIs con gráficos interactivos
- 🔧 **Mejorado**: Arquitectura modular y escalable
- 🔧 **Mejorado**: Manejo de errores robusto
- 🔧 **Mejorado**: Diseño responsive mejorado
- 🔧 **Mejorado**: Navegación unificada entre páginas

### v1.0.0
- 🚀 **Inicial**: Demo básico de conversaciones
- 🚀 **Inicial**: Funcionalidad de agendamiento
- 🚀 **Inicial**: Soporte multilingüe básico

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Documentación**: Este README
- **Issues**: [GitHub Issues](https://github.com/EsneiderCode/botcitas-demo/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/EsneiderCode/botcitas-demo/discussions)

## 🙏 Agradecimientos

- **Deutsche Glasfaser**: Cliente objetivo del sistema
- **CLARITY Team**: Desarrollo e implementación
- **Comunidad Open Source**: Librerías y herramientas utilizadas

---

**💡 Tip**: Para obtener el máximo rendimiento, usa Node.js 18+ y asegúrate de configurar correctamente las variables de entorno para producción.

**🔗 Links Útiles**:
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Socket.IO Guide](https://socket.io/docs/)
- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [Moment.js Documentation](https://momentjs.com/docs/)

**📧 Contacto**: Para consultas empresariales o personalizaciones, contactar al equipo de desarrollo.