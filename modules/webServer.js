const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

class WebServer {
  constructor(excelManager, whatsappBot = null) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.excelManager = excelManager;
    this.whatsappBot = whatsappBot;
    this.port = process.env.PORT || 3000;
    this.connectedClients = new Set();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
    // Servir archivos de la carpeta images
    this.app.use('/images', express.static(path.join(__dirname, '../images')));
  }

  setupRoutes() {
    // Ruta principal - servir la página HTML
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // Ruta para conversaciones
    this.app.get('/conversations', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/conversations.html'));
    });

    // NUEVA: Ruta para la demo interactiva
    this.app.get('/demo', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/demo.html'));
    });

    // NUEVA: Ruta para la simulación de botones
    this.app.get('/simulation', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/simulation.html'));
    });

    // NUEVA: Ruta para el índice de escenarios
    this.app.get('/scenarios', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index-scenarios.html'));
    });

    // NUEVAS: Rutas para escenarios específicos
    this.app.get('/scenario-cancellation', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/scenario-cancellation.html'));
    });

    this.app.get('/scenario-modification', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/scenario-modification.html'));
    });

    this.app.get('/scenario-reschedule', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/scenario-reschedule.html'));
    });

    this.app.get('/scenario-status', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/scenario-status.html'));
    });

    // API para obtener todas las citas
    this.app.get('/api/appointments', async (req, res) => {
      try {
        const appointments = await this.getAllAppointments();
        res.json({
          success: true,
          data: appointments,
          count: appointments.length
        });
      } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener las citas'
        });
      }
    });

    // API para obtener estadísticas
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.getStatistics();
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener estadísticas'
        });
      }
    });

    // API para filtrar citas por estado
    this.app.get('/api/appointments/status/:status', async (req, res) => {
      try {
        const { status } = req.params;
        const appointments = await this.getAppointmentsByStatus(status);
        res.json({
          success: true,
          data: appointments,
          count: appointments.length
        });
      } catch (error) {
        console.error('Error al filtrar citas:', error);
        res.status(500).json({
          success: false,
          error: 'Error al filtrar las citas'
        });
      }
    });

    // API para obtener citas de hoy
    this.app.get('/api/appointments/today', async (req, res) => {
      try {
        const appointments = await this.getTodayAppointments();
        res.json({
          success: true,
          data: appointments,
          count: appointments.length
        });
      } catch (error) {
        console.error('Error al obtener citas de hoy:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener las citas de hoy'
        });
      }
    });

    // API para obtener todas las conversaciones
    this.app.get('/api/conversations', async (req, res) => {
      try {
        if (!this.whatsappBot) {
          return res.status(503).json({
            success: false,
            error: 'WhatsApp Bot no disponible'
          });
        }

        const conversations = this.whatsappBot && typeof this.whatsappBot.getConversations === 'function'
          ? this.whatsappBot.getConversations() : [];
          
        res.json({
          success: true,
          data: conversations,
          count: conversations.length
        });
      } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener las conversaciones'
        });
      }
    });

    // API para obtener conversación específica
    this.app.get('/api/conversations/:phoneNumber', async (req, res) => {
      try {
        if (!this.whatsappBot) {
          return res.status(503).json({
            success: false,
            error: 'WhatsApp Bot no disponible'
          });
        }

        const { phoneNumber } = req.params;
        const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
        
        const messages = this.whatsappBot && typeof this.whatsappBot.getConversation === 'function'
          ? this.whatsappBot.getConversation(chatId) : [];
        
        res.json({
          success: true,
          data: {
            phoneNumber,
            messages,
            messageCount: messages.length
          }
        });
      } catch (error) {
        console.error('Error al obtener conversación:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener la conversación'
        });
      }
    });

    // API para buscar conversaciones
    this.app.get('/api/conversations/search/:query', async (req, res) => {
      try {
        if (!this.whatsappBot) {
          return res.status(503).json({
            success: false,
            error: 'WhatsApp Bot no disponible'
          });
        }

        const { query } = req.params;
        
        const results = this.whatsappBot && 
                       this.whatsappBot.conversationsManager && 
                       typeof this.whatsappBot.conversationsManager.searchConversations === 'function'
          ? this.whatsappBot.conversationsManager.searchConversations(query) : [];
        
        res.json({
          success: true,
          data: results,
          count: results.length
        });
      } catch (error) {
        console.error('Error al buscar conversaciones:', error);
        res.status(500).json({
          success: false,
          error: 'Error al buscar conversaciones'
        });
      }
    });

    // API para obtener estadísticas de conversaciones
    this.app.get('/api/conversations/stats', async (req, res) => {
      try {
        if (!this.whatsappBot) {
          return res.status(503).json({
            success: false,
            error: 'WhatsApp Bot no disponible'
          });
        }

        const stats = this.whatsappBot && typeof this.whatsappBot.getConversationsStats === 'function'
          ? this.whatsappBot.getConversationsStats() : {};
          
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error al obtener estadísticas de conversaciones:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener las estadísticas'
        });
      }
    });

    // NUEVAS APIs para el sistema de técnicos (Enhanced Bot)
    this.app.get('/api/technicians', async (req, res) => {
      try {
        if (!this.whatsappBot || !this.whatsappBot.getSystemData) {
          return res.status(503).json({
            success: false,
            error: 'Sistema de técnicos no disponible'
          });
        }

        const systemData = this.whatsappBot.getSystemData();
        res.json({
          success: true,
          data: systemData.technicians,
          stats: systemData.stats
        });
      } catch (error) {
        console.error('Error al obtener técnicos:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener los técnicos'
        });
      }
    });

    // API para consultar disponibilidad
    this.app.get('/api/availability', async (req, res) => {
      try {
        if (!this.whatsappBot || !this.whatsappBot.technicianScheduler) {
          return res.status(503).json({
            success: false,
            error: 'Sistema de agendamiento no disponible'
          });
        }

        const { zone, serviceType, date } = req.query;
        const availability = await this.whatsappBot.technicianScheduler.queryTechnicianAvailability(
          zone || 'Centro',
          serviceType || 'instalacion',
          date || null
        );

        res.json({
          success: true,
          data: availability
        });
      } catch (error) {
        console.error('Error al consultar disponibilidad:', error);
        res.status(500).json({
          success: false,
          error: 'Error al consultar disponibilidad'
        });
      }
    });

    // API para obtener consultas del sistema (para demo)
    this.app.get('/api/system-queries', async (req, res) => {
      try {
        if (!this.whatsappBot || !this.whatsappBot.getSystemQueries) {
          return res.status(503).json({
            success: false,
            error: 'Consultas del sistema no disponibles'
          });
        }

        const queries = this.whatsappBot.getSystemQueries();
        res.json({
          success: true,
          data: queries
        });
      } catch (error) {
        console.error('Error al obtener consultas del sistema:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener las consultas'
        });
      }
    });

    // API para obtener estadísticas completas del sistema
    this.app.get('/api/system-stats', async (req, res) => {
      try {
        if (!this.whatsappBot || !this.whatsappBot.getSystemData) {
          return res.status(503).json({
            success: false,
            error: 'Estadísticas del sistema no disponibles'
          });
        }

        const systemData = this.whatsappBot.getSystemData();
        const appointments = await this.getAllAppointments();
        const conversationsStats = this.whatsappBot && typeof this.whatsappBot.getConversationsStats === 'function'
          ? this.whatsappBot.getConversationsStats() : {};

        res.json({
          success: true,
          data: {
            system: systemData,
            appointments: {
              total: appointments.length,
              recent: appointments.slice(0, 5)
            },
            conversations: conversationsStats,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error al obtener estadísticas del sistema:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener las estadísticas del sistema'
        });
      }
    });

    // NUEVAS APIs para simulación de botones
    this.app.post('/api/simulation/start', async (req, res) => {
      try {
        const { clientId } = req.body;
        
        if (!this.whatsappBot || !this.whatsappBot.startSimulation) {
          // Crear una respuesta simulada si no hay bot simulado disponible
          const simulatedChatId = `simulated_${clientId || 'demo'}_${Date.now()}`;
          
          res.json({
            success: true,
            chatId: simulatedChatId,
            message: 'Simulación iniciada en modo local'
          });
          
          // Emitir mensaje inicial simulado
          setTimeout(() => {
            this.io.emit('simulatedMessage', {
              chatId: simulatedChatId,
              text: `🏠 ¡Hola! Soy el asistente virtual de Deutsche Glasfaser

📡 Tu servicio de Internet por fibra óptica está listo para ser instalado.

¿Qué te gustaría hacer?`,
              buttons: [
                { id: 'btn_1', text: 'Agendar instalación 📅', number: 1 },
                { id: 'btn_2', text: 'Ver información ℹ️', number: 2 },
                { id: 'btn_3', text: 'Hablar con humano 👨‍💼', number: 3 }
              ],
              type: 'bot',
              timestamp: Date.now()
            });
          }, 1000);
          
          return;
        }

        const chatId = await this.whatsappBot.startSimulation(clientId || 'demo');
        res.json({
          success: true,
          chatId: chatId,
          message: 'Simulación iniciada exitosamente'
        });
      } catch (error) {
        console.error('Error al iniciar simulación:', error);
        res.status(500).json({
          success: false,
          error: 'Error al iniciar la simulación'
        });
      }
    });

    this.app.post('/api/simulation/respond', async (req, res) => {
      try {
        const { chatId, buttonNumber, responseText } = req.body;
        
        if (!this.whatsappBot || !this.whatsappBot.handleUserResponse) {
          // Crear respuesta simulada si no hay bot simulado disponible
          res.json({
            success: true,
            message: 'Respuesta procesada en modo local'
          });
          
          // Emitir respuesta simulada
          setTimeout(() => {
            let responseMessage = {
              chatId: chatId,
              type: 'bot',
              timestamp: Date.now()
            };

            // Respuestas simuladas básicas
            if (responseText.includes('Agendar')) {
              responseMessage.text = `📅 Perfecto, vamos a agendar tu instalación.

¿Qué prefieres?`;
              responseMessage.buttons = [
                { id: 'btn_1', text: 'Ver horarios disponibles 🗓️', number: 1 },
                { id: 'btn_2', text: 'Reagendar más tarde ⏰', number: 2 },
                { id: 'btn_3', text: 'Cancelar proceso ❌', number: 3 }
              ];
            } else if (responseText.includes('información')) {
              responseMessage.text = `📋 *Información del Servicio*

🌐 Fibra óptica de alta velocidad
⚡ Hasta 1000 Mbps
🏠 Instalación profesional incluida
📞 Soporte técnico 24/7

¿Qué más necesitas?`;
              responseMessage.buttons = [
                { id: 'btn_1', text: 'Agendar ahora 📅', number: 1 },
                { id: 'btn_2', text: 'Más información ℹ️', number: 2 },
                { id: 'btn_3', text: 'Volver al inicio 🏠', number: 3 }
              ];
            } else if (responseText.includes('horarios')) {
              responseMessage.text = `🗓️ Estos son los horarios disponibles:

Selecciona tu horario preferido:`;
              responseMessage.buttons = [
                { id: 'btn_1', text: 'Mañana 09:00 - 11:00', number: 1 },
                { id: 'btn_2', text: 'Tarde 14:00 - 16:00', number: 2 },
                { id: 'btn_3', text: 'Pasado mañana 10:00 - 12:00', number: 3 }
              ];
            } else if (responseText.includes('humano')) {
              responseMessage.text = `👨‍💼 *Contacto Humano*

Un representante te contactará pronto.

📞 También puedes llamar: +49 2861 8919-0
📧 Email: service@deutsche-glasfaser.de
🕒 Horario: Lunes a Viernes 8:00-18:00

¿Mientras tanto, quieres agendar tu instalación?`;
              responseMessage.buttons = [
                { id: 'btn_1', text: 'Sí, agendar ahora ✅', number: 1 },
                { id: 'btn_2', text: 'No, esperar llamada ⏳', number: 2 },
                { id: 'btn_3', text: 'Volver al inicio 🏠', number: 3 }
              ];
            } else if (responseText.includes('Mañana') || responseText.includes('Tarde') || responseText.includes('Pasado')) {
              responseMessage.text = `✅ Has seleccionado: ${responseText}

¿Confirmas esta cita?`;
              responseMessage.buttons = [
                { id: 'btn_1', text: 'Sí, confirmar ✅', number: 1 },
                { id: 'btn_2', text: 'Elegir otro horario 🔄', number: 2 },
                { id: 'btn_3', text: 'Cancelar ❌', number: 3 }
              ];
            } else if (responseText.includes('confirmar')) {
              responseMessage.text = `🎉 ¡Cita confirmada exitosamente!

📋 Código: DG${Math.random().toString(36).substr(2, 6).toUpperCase()}
📅 Fecha: ${responseText.replace('Sí, confirmar ✅', 'Horario seleccionado')}
👨‍🔧 Técnico: Klaus Mueller

¡Perfecto! Tu instalación está programada.`;
              responseMessage.buttons = [
                { id: 'btn_1', text: 'Agendar otra cita 📅', number: 1 },
                { id: 'btn_2', text: 'Ver detalles 📋', number: 2 },
                { id: 'btn_3', text: 'Finalizar ✅', number: 3 }
              ];
            } else {
              responseMessage.text = `Gracias por tu respuesta: "${responseText}"

Esta es una simulación de botones. En un sistema real, el bot procesaría tu respuesta y proporcionaría la siguiente interacción apropiada.`;
              responseMessage.buttons = [
                { id: 'btn_1', text: 'Continuar simulación 🔄', number: 1 },
                { id: 'btn_2', text: 'Reiniciar chat 🆕', number: 2 },
                { id: 'btn_3', text: 'Finalizar ✅', number: 3 }
              ];
            }

            this.io.emit('simulatedMessage', responseMessage);
          }, 2000);
          
          return;
        }

        await this.whatsappBot.handleUserResponse(chatId, buttonNumber, responseText);
        res.json({
          success: true,
          message: 'Respuesta procesada exitosamente'
        });
      } catch (error) {
        console.error('Error al procesar respuesta:', error);
        res.status(500).json({
          success: false,
          error: 'Error al procesar la respuesta'
        });
      }
    });

    this.app.get('/api/simulation/status', async (req, res) => {
      try {
        const status = this.whatsappBot && this.whatsappBot.getStatus 
          ? this.whatsappBot.getStatus() 
          : {
              isReady: true,
              simulationMode: true,
              pendingAppointments: 0,
              totalConversations: 0
            };

        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        console.error('Error al obtener estado de simulación:', error);
        res.status(500).json({
          success: false,
          error: 'Error al obtener el estado'
        });
      }
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('🔗 Cliente conectado al WebSocket:', socket.id);
      this.connectedClients.add(socket.id);

      // Enviar datos iniciales al cliente
      this.sendInitialData(socket);

      socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
        this.connectedClients.delete(socket.id);
      });

      // Escuchar solicitudes de actualización
      socket.on('requestUpdate', () => {
        console.log('📡 Cliente solicitó actualización manual');
        this.sendInitialData(socket);
      });
    });
  }

  async sendInitialData(socket) {
    try {
      const appointments = await this.getAllAppointments();
      const stats = await this.getStatistics();
      
      // Verificar si los métodos existen antes de llamarlos
      const conversations = this.whatsappBot && typeof this.whatsappBot.getConversations === 'function' 
        ? this.whatsappBot.getConversations() : [];
      const conversationsStats = this.whatsappBot && typeof this.whatsappBot.getConversationsStats === 'function'
        ? this.whatsappBot.getConversationsStats() : {};
      
      socket.emit('appointmentsUpdate', {
        appointments,
        stats,
        conversations,
        conversationsStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al enviar datos iniciales:', error);
    }
  }

  // Método para notificar actualizaciones a todos los clientes conectados
  async notifyUpdate(updateType, data) {
    try {
      const appointments = await this.getAllAppointments();
      const stats = await this.getStatistics();
      
      // Verificar si los métodos existen antes de llamarlos
      const conversations = this.whatsappBot && typeof this.whatsappBot.getConversations === 'function'
        ? this.whatsappBot.getConversations() : [];
      const conversationsStats = this.whatsappBot && typeof this.whatsappBot.getConversationsStats === 'function'
        ? this.whatsappBot.getConversationsStats() : {};
      
      this.io.emit('appointmentsUpdate', {
        appointments,
        stats,
        conversations,
        conversationsStats,
        updateType,
        data,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Actualización enviada a ${this.connectedClients.size} clientes: ${updateType}`);
    } catch (error) {
      console.error('Error al notificar actualización:', error);
    }
  }

  // Método específico para actualizaciones de conversaciones
  async notifyConversationUpdate(updateType, data) {
    try {
      // Verificar si los métodos existen antes de llamarlos
      const conversations = this.whatsappBot && typeof this.whatsappBot.getConversations === 'function'
        ? this.whatsappBot.getConversations() : [];
      const conversationsStats = this.whatsappBot && typeof this.whatsappBot.getConversationsStats === 'function'
        ? this.whatsappBot.getConversationsStats() : {};
      
      // Emitir evento específico para conversaciones
      this.io.emit('conversationUpdate', {
        conversations,
        conversationsStats,
        updateType,
        data,
        timestamp: new Date().toISOString()
      });
      
      // También emitir el evento general para mantener sincronización
      this.io.emit('appointmentsUpdate', {
        appointments: await this.getAllAppointments(),
        stats: await this.getStatistics(),
        conversations,
        conversationsStats,
        updateType,
        data,
        timestamp: new Date().toISOString()
      });
      
      console.log(`💬 Actualización de conversación enviada a ${this.connectedClients.size} clientes: ${updateType}`);
    } catch (error) {
      console.error('Error al notificar actualización de conversación:', error);
    }
  }

  // Obtener todas las citas del Excel
  async getAllAppointments() {
    try {
      if (!this.excelManager.worksheet) {
        return [];
      }

      const appointments = [];
      const worksheet = this.excelManager.worksheet;
      
      // Iterar sobre todas las filas (saltando la primera que son los headers)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar headers
        
        const appointment = {
          id: row.getCell(1).value,
          cliente: row.getCell(2).value,
          telefono: row.getCell(3).value,
          horaSeleccionada: row.getCell(4).value,
          fechaContacto: row.getCell(5).value,
          estado: row.getCell(6).value,
          fechaCreacion: row.getCell(7).value,
          notas: row.getCell(8).value
        };
        
        appointments.push(appointment);
      });

      return appointments.reverse(); // Mostrar las más recientes primero
    } catch (error) {
      console.error('Error al obtener citas:', error);
      return [];
    }
  }

  // Obtener estadísticas
  async getStatistics() {
    try {
      const appointments = await this.getAllAppointments();
      
      const stats = {
        total: appointments.length,
        confirmadas: appointments.filter(apt => apt.estado === 'confirmada').length,
        pendientes: appointments.filter(apt => apt.estado === 'pendiente').length,
        reagendadas: appointments.filter(apt => apt.estado === 'reagendada').length,
        canceladas: appointments.filter(apt => apt.estado === 'cancelada').length,
        rechazadas: appointments.filter(apt => apt.estado === 'rechazada').length,
        hoy: appointments.filter(apt => this.isToday(apt.fechaContacto)).length
      };

      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        total: 0,
        confirmadas: 0,
        pendientes: 0,
        reagendadas: 0,
        canceladas: 0,
        rechazadas: 0,
        hoy: 0
      };
    }
  }

  // Obtener citas por estado
  async getAppointmentsByStatus(status) {
    try {
      const appointments = await this.getAllAppointments();
      return appointments.filter(apt => apt.estado.toLowerCase() === status.toLowerCase());
    } catch (error) {
      console.error('Error al filtrar citas por estado:', error);
      return [];
    }
  }

  // Obtener citas de hoy
  async getTodayAppointments() {
    try {
      const appointments = await this.getAllAppointments();
      return appointments.filter(apt => this.isToday(apt.fechaContacto));
    } catch (error) {
      console.error('Error al obtener citas de hoy:', error);
      return [];
    }
  }

  // Verificar si una fecha es hoy
  isToday(dateString) {
    if (!dateString) return false;
    
    const today = new Date();
    const compareDate = new Date(dateString);
    
    return today.toDateString() === compareDate.toDateString();
  }

  // Iniciar el servidor
  start() {
    this.server.listen(this.port, () => {
      console.log(`🌐 Servidor web iniciado en http://localhost:${this.port}`);
      console.log(`📊 Panel de citas disponible en http://localhost:${this.port}`);
    });
  }

  // Detener el servidor
  stop() {
    this.server.close(() => {
      console.log('🛑 Servidor web detenido');
    });
  }
}

module.exports = WebServer; 