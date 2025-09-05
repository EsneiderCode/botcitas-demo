# 🚀 Inicio Rápido - Demo Chatbot Inteligente

## ⚡ Ejecutar Demo en 3 Pasos

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Iniciar Modo Demo
```bash
npm run demo
```

### 3. Abrir Panel Interactivo
Visita: **http://localhost:3000/demo**

---

## 🎯 Comandos Disponibles

### Modo Producción (Bot Original)
```bash
npm start
```
- Sistema completo de producción
- Procesamiento automático de clientes
- Integración con Google Sheets y Excel

### Modo Demo (Bot Mejorado)
```bash
npm run demo
```
- Sistema optimizado para demostraciones
- Simulación de agenda de técnicos
- Panel interactivo en tiempo real

### Desarrollo
```bash
npm run dev
```
- Modo desarrollo con auto-restart
- Logs detallados para debugging

---

## 📱 Acceso a Interfaces

| Interface | URL | Propósito |
|-----------|-----|-----------|
| **Demo Interactiva** | http://localhost:3000/demo | Presentación completa del sistema |
| **Panel Principal** | http://localhost:3000 | Gestión de citas estándar |
| **Conversaciones** | http://localhost:3000/conversations | Monitor de chat en tiempo real |

---

## 🔧 Configuración Rápida

### Variables de Entorno (Opcional)
Crea un archivo `.env` basado en `ejemplo.env`:

```bash
cp ejemplo.env .env
```

### WhatsApp Setup
1. Ejecuta el comando demo
2. Escanea el código QR con WhatsApp Web
3. El sistema se conecta automáticamente

---

## 🎭 Funcionalidades de la Demo

### ✅ Listo para Usar
- ✅ Sistema de técnicos simulado
- ✅ Algoritmo de optimización de horarios  
- ✅ Panel en tiempo real
- ✅ Mensajes conversacionales
- ✅ Métricas y KPIs

### 🎯 Ideal Para Mostrar
- **Consultas automáticas** a sistemas internos
- **Interacción natural** con clientes
- **Optimización inteligente** de recursos
- **Valor de negocio** tangible

---

## 🆘 Resolución de Problemas

### Error: Puerto 3000 en uso
```bash
# Cambiar puerto
PORT=3001 npm run demo
```

### WhatsApp no conecta
```bash
# Limpiar sesión y reintentar
rm -rf .wwebjs_auth
npm run demo
```

### Excel no guarda
```bash
# Cerrar Excel y ejecutar
npm run kill-excel
npm run demo
```

---

## 📞 Soporte

Para dudas o problemas técnicos durante la demo, revisa:
- 📋 **DEMO_README.md** - Documentación completa
- 🔧 **config.js** - Configuraciones del sistema
- 📊 **Panel web** - Métricas en tiempo real

---

**🎯 ¡En menos de 5 minutos tendrás una demo completa funcionando!** 