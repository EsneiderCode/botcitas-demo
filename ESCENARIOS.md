# 🎭 Escenarios de Demostración - Bot de Citas Deutsche Glasfaser

## 📋 Resumen

Este proyecto ahora incluye **cinco escenarios diferentes** que demuestran las capacidades completas del bot de WhatsApp para agendación de citas de instalación de fibra óptica. Cada escenario está en una página separada para mostrar la lógica dividida.

## 🚀 Acceso Rápido

### Iniciar el Sistema
```bash
node index.js --simulation
```

### URLs de Acceso
- **Índice de Escenarios**: http://localhost:3000/scenarios
- **Panel Principal**: http://localhost:3000
- **Simulación Original**: http://localhost:3000/simulation

---

## 🎯 Los 5 Escenarios

### 1. 📅 Agendamiento de Cita
**URL**: http://localhost:3000/conversations.html

**Descripción**: Flujo completo para agendar una nueva cita de instalación.

**Características**:
- ✅ Selección de idioma (Alemán, Inglés, Español)
- ✅ Elección de horarios disponibles
- ✅ Confirmación con datos del técnico
- ✅ Opción de recordatorio
- ✅ Código de confirmación

**Flujo de Conversación**:
1. Saludo multiidioma
2. Opciones de agendamiento
3. Horarios disponibles
4. Confirmación de cita
5. Recordatorios opcionales
6. Confirmación final con código

---

### 2. ❌ Cancelación de Cita
**URL**: http://localhost:3000/scenario-cancellation.html

**Descripción**: Proceso para cancelar una cita existente de manera eficiente.

**Características**:
- ✅ Verificación de datos del cliente
- ✅ Confirmación de cancelación
- ✅ Liberación automática del horario
- ✅ Motivo de cancelación
- ✅ Opciones de recontacto

**Flujo de Conversación**:
1. Identificación del motivo
2. Verificación de código de cita
3. Confirmación de datos
4. Razón de cancelación
5. Opciones futuras
6. Confirmación de cancelación exitosa

---

### 3. 🔄 Modificación de Horario
**URL**: http://localhost:3000/scenario-modification.html

**Descripción**: Cambio de horario de una cita existente por uno nuevo disponible.

**Características**:
- ✅ Consulta de cita actual
- ✅ Nuevos horarios disponibles
- ✅ Confirmación del cambio
- ✅ Actualización automática del sistema
- ✅ Reasignación de técnico si es necesario

**Flujo de Conversación**:
1. Verificación de cita actual
2. Búsqueda de nuevos horarios
3. Selección de nueva fecha/hora
4. Confirmación de cambios
5. Actualización de técnico
6. Confirmación final del cambio

---

### 4. 📆 Reprogramación de Cita
**URL**: http://localhost:3000/scenario-reschedule.html

**Descripción**: Reprogramación completa cuando el cliente no puede en la fecha original.

**Características**:
- ✅ Verificación de motivo del cambio
- ✅ Nuevas fechas disponibles
- ✅ Selección de nuevo horario
- ✅ Confirmación con nuevo técnico
- ✅ Manejo de casos especiales (viajes, emergencias)

**Flujo de Conversación**:
1. Identificación del motivo de reprogramación
2. Búsqueda en rangos de fechas amplios
3. Opciones flexibles según el motivo
4. Selección de nueva fecha
5. Asignación de nuevo técnico
6. Confirmación de reprogramación exitosa

---

### 5. 📋 Consulta de Estado
**URL**: http://localhost:3000/scenario-status.html

**Descripción**: Consulta del estado actual de la cita y detalles de instalación.

**Características**:
- ✅ Estado de la cita actual
- ✅ Información del técnico asignado
- ✅ Detalles de equipos a instalar
- ✅ Recordatorios y notificaciones
- ✅ Opciones de contacto directo

**Flujo de Conversación**:
1. Consulta de estado de cita
2. Información detallada del técnico
3. Equipos y servicios incluidos
4. Configuración de recordatorios
5. Información de contacto
6. Resumen completo del servicio

---

## 🎨 Características de Diseño

### Interfaz Consistente
- 📱 Simulación exacta de WhatsApp en iPhone
- 🎨 Diseño responsive y moderno
- ⚡ Animaciones suaves y profesionales
- 🔤 Tipografía optimizada para legibilidad

### Funcionalidades Técnicas
- 🤖 Bot simulado (sin necesidad de WhatsApp real)
- 📊 Indicadores de escritura realistas
- 🔘 Botones interactivos (máximo 3 por mensaje)
- ⏰ Timestamps reales
- 📱 Optimizado para WhatsApp Business API

### Experiencia de Usuario
- 🌐 Soporte multiidioma
- 🎯 Flujos de conversación naturales
- ⚡ Respuestas inmediatas
- 📋 Información clara y organizada

---

## 🔧 Configuración Técnica

### Archivos Principales
```
public/
├── index-scenarios.html      # Índice principal de escenarios
├── conversations.html        # Escenario 1: Agendamiento
├── scenario-cancellation.html # Escenario 2: Cancelación
├── scenario-modification.html # Escenario 3: Modificación
├── scenario-reschedule.html   # Escenario 4: Reprogramación
└── scenario-status.html      # Escenario 5: Consulta de Estado
```

### Rutas del Servidor
```javascript
GET /scenarios              # Índice de escenarios
GET /conversations          # Agendamiento de cita
GET /scenario-cancellation  # Cancelación de cita
GET /scenario-modification  # Modificación de horario
GET /scenario-reschedule    # Reprogramación de cita
GET /scenario-status        # Consulta de estado
```

---

## 🚀 Instrucciones de Uso

### 1. Iniciar el Sistema
```bash
# Instalar dependencias (solo la primera vez)
npm install

# Iniciar en modo simulación
node index.js --simulation
```

### 2. Acceder a los Escenarios
1. Abrir http://localhost:3000/scenarios
2. Seleccionar el escenario deseado
3. Seguir el flujo de conversación
4. Probar diferentes opciones y respuestas

### 3. Navegación
- Cada escenario se abre en una nueva pestaña
- Use el botón "atrás" para regresar
- El índice principal permite acceso rápido a todos los escenarios

---

## 📊 Ventajas de la Separación por Escenarios

### Para Desarrollo
- 🔧 **Lógica Modular**: Cada escenario es independiente
- 🐛 **Debugging Fácil**: Problemas específicos por escenario
- 🔄 **Mantenimiento**: Actualizaciones sin afectar otros flujos
- 📈 **Escalabilidad**: Fácil agregar nuevos escenarios

### Para Demostración
- 🎯 **Casos de Uso Específicos**: Cada escenario muestra una funcionalidad
- 📋 **Presentaciones Dirigidas**: Mostrar solo lo relevante
- ⏱️ **Demos Rápidas**: Acceso directo sin navegación compleja
- 🎭 **Diferentes Audiencias**: Escenarios específicos según la audiencia

### Para Testing
- ✅ **Pruebas Unitarias**: Testear flujos específicos
- 🔍 **Análisis de Comportamiento**: Métricas por escenario
- 📊 **A/B Testing**: Comparar diferentes versiones
- 🚀 **Validación de Funcionalidades**: Verificar cada caso de uso

---

## 🎯 Casos de Uso por Audiencia

### Clientes/Usuarios Finales
- **Escenario 1**: Experiencia de agendamiento inicial
- **Escenario 5**: Consulta de información de cita

### Equipo de Soporte
- **Escenario 2**: Manejo de cancelaciones
- **Escenario 3**: Cambios de horario rápidos

### Gerencia/Stakeholders
- **Escenario 4**: Casos complejos y flexibilidad del sistema
- **Índice General**: Vista completa de capacidades

### Desarrolladores
- **Todos los Escenarios**: Funcionamiento técnico y flujos
- **Código Fuente**: Implementación y personalización

---

## 📞 Soporte y Contacto

Para dudas sobre los escenarios o personalización:
- 📧 Revisar código fuente en cada archivo HTML
- 🔧 Modificar flujos en los arrays JavaScript de cada escenario
- 📊 Agregar nuevos escenarios siguiendo la estructura existente
- 🌐 Actualizar rutas en `modules/webServer.js`

---

**🎉 ¡Disfruta explorando los cinco escenarios del bot de Deutsche Glasfaser!**
