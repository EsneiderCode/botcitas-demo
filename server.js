/**
 * Servidor Principal - Bot de Citas CLARITY
 * Sistema avanzado de gestión de citas con interfaz web y API REST
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Módulos personalizados
const ConversationsManager = require('./modules/conversationsManager');
const DataManager = require('./modules/dataManager');

// Configuración
let config;
try {
  config = require('./config/config.js');
} catch {
  console.warn('Config file not found, using example config');
  config = require('./config/config.example.js');
}

class BotCitasServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIO(this.server, {
      cors: {
        origin: config.security.cors.origin,
        methods: ['GET', 'POST']
      }
    });
    
    this.conversationsManager = new ConversationsManager(config);
    this.dataManager = new DataManager(config);
    this.connectedClients = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocketHandlers();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Seguridad
    this.app.use(helmet(config.security.helmet));
    this.app.use(cors(config.security.cors));
    
    // Compresión
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Archivos estáticos
    this.app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
    this.app.use('/css', express.static(path.join(__dirname, 'css')));
    this.app.use('/js', express.static(path.join(__dirname, 'js')));
    this.app.use('/ics', express.static(path.join(__dirname, 'ics')));
    this.app.use('/', express.static(path.join(__dirname, '.'), {
      extensions: ['html']
    }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // API Routes
    
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: config.bot.version
      });
    });

    // Configuración del sistema
    this.app.get('/api/config', (req, res) => {
      const publicConfig = {
        company: config.company,
        bot: {
          name: config.bot.name,
          version: config.bot.version,
          supportedLanguages: config.bot.supportedLanguages
        },
        appointments: {
          timezone: config.appointments.timezone,
          slotDuration: config.appointments.slotDuration
        }
      };
      res.json(publicConfig);
    });

    // Estadísticas del sistema
    this.app.get('/api/stats', (req, res) => {
      const conversationStats = this.conversationsManager.getStats();
      const dataStats = this.dataManager.generateStats();
      
      res.json({
        conversations: conversationStats,
        data: dataStats,
        server: {
          uptime: process.uptime(),
          connectedClients: this.connectedClients.size,
          memory: process.memoryUsage()
        }
      });
    });

    // Gestión de conversaciones
    this.app.post('/api/conversation', async (req, res) => {
      try {
        const { sessionId, message, metadata } = req.body;
        
        if (!sessionId || !message) {
          return res.status(400).json({ error: 'sessionId y message son requeridos' });
        }

        const response = await this.conversationsManager.processMessage(
          sessionId, 
          message, 
          { ...metadata, ip: req.ip, userAgent: req.get('User-Agent') }
        );
        
        // Emitir actualización en tiempo real
        this.io.emit('conversationUpdate', {
          sessionId,
          message,
          response,
          timestamp: new Date().toISOString()
        });

        res.json(response);
      } catch (error) {
        console.error('Error processing conversation:', error);
        res.status(500).json({ error: 'Error procesando conversación' });
      }
    });

    // Obtener sesión de conversación
    this.app.get('/api/conversation/:sessionId', (req, res) => {
      const session = this.conversationsManager.getSession(req.params.sessionId, false);
      if (!session) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }
      res.json(session);
    });

    // Gestión de citas
    this.app.get('/api/appointments', (req, res) => {
      const filters = {
        status: req.query.status,
        technician: req.query.technician,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };
      
      const appointments = this.dataManager.getAppointments(filters);
      res.json(appointments);
    });

    this.app.get('/api/appointments/:id', (req, res) => {
      const appointment = this.dataManager.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }
      res.json(appointment);
    });

    this.app.put('/api/appointments/:id', async (req, res) => {
      try {
        const updatedAppointment = await this.dataManager.updateAppointment(
          req.params.id,
          req.body
        );
        
        this.io.emit('appointmentUpdated', updatedAppointment);
        res.json(updatedAppointment);
      } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Error actualizando cita' });
      }
    });

    this.app.delete('/api/appointments/:id', async (req, res) => {
      try {
        const cancelledAppointment = await this.dataManager.cancelAppointment(
          req.params.id,
          req.body.reason
        );
        
        this.io.emit('appointmentCancelled', cancelledAppointment);
        res.json(cancelledAppointment);
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ error: 'Error cancelando cita' });
      }
    });

    // Exportar datos
    this.app.post('/api/export', async (req, res) => {
      try {
        const { format = 'excel', filters = {} } = req.body;
        const data = await this.dataManager.exportData(format, filters);
        
        const filename = `citas_export_${new Date().toISOString().split('T')[0]}.${format}`;
        
        if (format === 'json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(data);
        } else if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(data);
        } else {
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(data);
        }
      } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Error exportando datos' });
      }
    });

    // Técnicos disponibles
    this.app.get('/api/technicians', (req, res) => {
      const technicians = Object.entries(config.technicians)
        .filter(([_, tech]) => tech.active)
        .map(([id, tech]) => ({ id, ...tech }));
      res.json(technicians);
    });

    // Slots disponibles (dinámicos)
    this.app.get('/api/slots', (req, res) => {
      // Aquí se generarían los slots dinámicamente basado en disponibilidad
      // Por ahora, devolvemos slots estáticos del config
      const slots = this.generateAvailableSlots();
      res.json(slots);
    });

    // Páginas HTML principales
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Manejo de errores 404
    this.app.use((req, res) => {
      res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
      });
    });

    // Manejo de errores generales
    this.app.use((error, req, res, next) => {
      console.error('Unhandled error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  setupWebSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      this.connectedClients.set(socket.id, {
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // Enviar estadísticas iniciales
      socket.emit('stats', this.conversationsManager.getStats());

      // Unirse a salas por sesión de conversación
      socket.on('joinSession', (sessionId) => {
        socket.join(`session_${sessionId}`);
        console.log(`Client ${socket.id} joined session ${sessionId}`);
      });

      // Procesar mensaje de chat
      socket.on('chatMessage', async (data) => {
        try {
          const { sessionId, message, metadata } = data;
          const response = await this.conversationsManager.processMessage(
            sessionId, 
            message, 
            { ...metadata, socketId: socket.id }
          );
          
          // Responder al cliente específico
          socket.emit('chatResponse', response);
          
          // Notificar a otros clientes monitoreando esta sesión
          socket.to(`session_${sessionId}`).emit('conversationUpdate', {
            sessionId,
            message,
            response,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('WebSocket chat error:', error);
          socket.emit('error', { message: 'Error procesando mensaje' });
        }
      });

      // Solicitar estado de sesión
      socket.on('getSession', (sessionId) => {
        const session = this.conversationsManager.getSession(sessionId, false);
        socket.emit('sessionState', session);
      });

      // Heartbeat para mantener conexión activa
      socket.on('heartbeat', () => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.lastActivity = new Date();
        }
        socket.emit('heartbeat');
      });

      // Manejo de desconexión
      socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, reason);
        this.connectedClients.delete(socket.id);
      });
    });

    // Emitir estadísticas cada 30 segundos
    setInterval(() => {
      const stats = {
        conversations: this.conversationsManager.getStats(),
        server: {
          uptime: process.uptime(),
          connectedClients: this.connectedClients.size,
          memory: process.memoryUsage()
        }
      };
      this.io.emit('statsUpdate', stats);
    }, 30000);
  }

  setupEventHandlers() {
    // Eventos del gestor de conversaciones
    this.conversationsManager.on('sessionCreated', (session) => {
      console.log(`New session created: ${session.id}`);
      this.io.emit('sessionCreated', session);
    });

    this.conversationsManager.on('sessionCompleted', (session) => {
      console.log(`Session completed: ${session.id}`);
      this.dataManager.saveConversation(session.id, session);
      this.io.emit('sessionCompleted', session);
    });

    this.conversationsManager.on('appointmentCreated', async (appointmentData) => {
      try {
        const appointment = await this.dataManager.createAppointment(appointmentData);
        console.log(`Appointment created: ${appointment.id}`);
        this.io.emit('appointmentCreated', appointment);
      } catch (error) {
        console.error('Error creating appointment:', error);
      }
    });

    this.conversationsManager.on('reminderScheduled', (reminderData) => {
      console.log(`Reminder scheduled for appointment: ${reminderData.appointmentId}`);
      // Aquí se implementaría la lógica de recordatorios
      this.io.emit('reminderScheduled', reminderData);
    });

    // Eventos del gestor de datos
    this.dataManager.on('initialized', () => {
      console.log('Data manager initialized');
    });

    this.dataManager.on('dataSaved', () => {
      console.log('Data saved to Excel');
    });

    this.dataManager.on('backupCreated', (filename) => {
      console.log(`Backup created: ${filename}`);
    });

    this.dataManager.on('error', (error) => {
      console.error('Data manager error:', error);
    });

    // Limpiar sesiones expiradas cada 15 minutos
    setInterval(() => {
      this.conversationsManager.cleanupExpiredSessions();
    }, 15 * 60 * 1000);
  }

  generateAvailableSlots() {
    // Implementación simplificada - en producción sería más compleja
    const slots = [];
    const now = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const daySlots = config.appointments.availableSlots[date.getDay()];
      
      if (daySlots) {
        daySlots.forEach(timeStr => {
          const [hour, minute] = timeStr.split(':').map(Number);
          const startTime = new Date(date);
          startTime.setHours(hour, minute, 0, 0);
          
          const endTime = new Date(startTime.getTime() + config.appointments.slotDuration * 60 * 1000);
          
          slots.push({
            id: `slot_${startTime.getTime()}`,
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            available: true
          });
        });
      }
    }
    
    return slots.slice(0, 20); // Limitar a 20 slots
  }

  async start() {
    try {
      const port = config.server.port;
      const host = config.server.host;
      
      this.server.listen(port, host, () => {
        console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║                    🚀 BOT DE CITAS CLARITY INICIADO                   ║
╠════════════════════════════════════════════════════════════════════════╣
║  Servidor:     http://${host}:${port}                                    
║  Dashboard:    http://${host}:${port}/dashboard.html                     
║  Gestor:       http://${host}:${port}/manager.html                       
║  Demo:         http://${host}:${port}/conversations.html                 
║  API:          http://${host}:${port}/api                                
║  Entorno:      ${config.server.environment}                             
║  Versión:      ${config.bot.version}                                    
╚════════════════════════════════════════════════════════════════════════╝
        `);
      });

      // Manejo de señales de terminación
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());
      
    } catch (error) {
      console.error('Error starting server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    console.log('Shutting down server gracefully...');
    
    // Cerrar servidor HTTP
    this.server.close(() => {
      console.log('HTTP server closed');
    });

    // Limpiar recursos
    this.dataManager.destroy();
    this.conversationsManager.removeAllListeners();
    
    process.exit(0);
  }
}

// Inicializar servidor si es ejecutado directamente
if (require.main === module) {
  const server = new BotCitasServer();
  server.start().catch(console.error);
}

module.exports = BotCitasServer;