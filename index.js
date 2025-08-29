const GoogleSheetsManager = require('./modules/googleSheets');
const WhatsAppBot = require('./modules/whatsappBot');
const EnhancedWhatsAppBot = require('./modules/enhancedWhatsappBot'); // Bot mejorado
const SimulatedChatBot = require('./modules/simulatedChatBot'); // Bot simulado sin WhatsApp
const ExcelManager = require('./modules/excelManager');
const WebServer = require('./modules/webServer');
const config = require('./config');
const cron = require('node-cron');
const moment = require('moment');

class AppointmentSystem {
  constructor(useEnhancedBot = false, useSimulatedBot = false) {
    this.googleSheets = new GoogleSheetsManager();
    
    // Elegir entre bot original, mejorado o simulado
    this.useEnhancedBot = useEnhancedBot;
    this.useSimulatedBot = useSimulatedBot;
    
    if (useSimulatedBot) {
      this.whatsappBot = new SimulatedChatBot();
      console.log('🤖 Usando Bot Simulado (sin WhatsApp) para demostración de botones');
    } else if (useEnhancedBot) {
      this.whatsappBot = new EnhancedWhatsAppBot();
      console.log('🚀 Usando Enhanced WhatsApp Bot para la demo');
    } else {
      this.whatsappBot = new WhatsAppBot();
      console.log('📱 Usando WhatsApp Bot original');
    }
    
    this.excelManager = new ExcelManager();
    this.webServer = new WebServer(this.excelManager, this.whatsappBot);
    this.isRunning = false;
    this.stats = {
      clientsProcessed: 0,
      appointmentsScheduled: 0,
      appointmentsRejected: 0,
      startTime: null
    };
    
    this.setupEventHandlers();
  }

  // Configurar manejadores de eventos
  setupEventHandlers() {
    // Cuando se confirma una cita
    this.whatsappBot.on('appointmentConfirmed', async (appointmentData) => {
      try {
        await this.excelManager.addAppointment({
          chatId: appointmentData.chatId,
          fecha: appointmentData.slot.date,
          hora: appointmentData.slot.time,
          estado: 'confirmada',
          timestamp: appointmentData.timestamp,
          confirmationCode: appointmentData.confirmationCode || 'N/A'
        });
        this.stats.appointmentsScheduled++;
        
        // Log mejorado para demo
        if (appointmentData.confirmationCode) {
          console.log(`✅ Cita confirmada con código ${appointmentData.confirmationCode}: ${appointmentData.chatId} -> ${appointmentData.slot.date} ${appointmentData.slot.time}`);
        } else {
          console.log(`✅ Cita confirmada y guardada: ${appointmentData.chatId} -> ${appointmentData.slot.date} ${appointmentData.slot.time}`);
        }
        
        // Notificar al servidor web
        await this.webServer.notifyUpdate('appointmentConfirmed', appointmentData);
      } catch (error) {
        console.error('Error al guardar cita confirmada:', error);
      }
    });

    // Cuando se rechaza una cita
    this.whatsappBot.on('appointmentRejected', async (appointmentData) => {
      try {
        await this.excelManager.addAppointment(appointmentData);
        this.stats.appointmentsRejected++;
        console.log(`❌ Cita rechazada y registrada: ${appointmentData.cliente}`);
        
        // Notificar al servidor web
        await this.webServer.notifyUpdate('appointmentRejected', appointmentData);
      } catch (error) {
        console.error('Error al guardar cita rechazada:', error);
      }
    });

    // Cuando se reagenda una cita
    this.whatsappBot.on('appointmentRescheduled', async (appointmentData) => {
      try {
        await this.excelManager.addAppointment({
          chatId: appointmentData.chatId,
          fecha: appointmentData.newSlot.date,
          hora: appointmentData.newSlot.time,
          estado: 'reagendada',
          timestamp: appointmentData.timestamp
        });
        console.log(`🔄 Cita reagendada: ${appointmentData.chatId} -> ${appointmentData.newSlot.date} ${appointmentData.newSlot.time}`);
        
        // Notificar al servidor web
        await this.webServer.notifyUpdate('appointmentRescheduled', appointmentData);
      } catch (error) {
        console.error('Error al guardar cita reagendada:', error);
      }
    });

    // Cuando se cancela una cita
    this.whatsappBot.on('appointmentCanceled', async (appointmentData) => {
      try {
        await this.excelManager.addAppointment({
          chatId: appointmentData.chatId,
          fecha: 'N/A',
          hora: 'N/A',
          estado: 'cancelada',
          timestamp: appointmentData.timestamp
        });
              console.log(`❌ Cita cancelada: ${appointmentData.chatId}`);
      
      // Notificar al servidor web
      await this.webServer.notifyUpdate('appointmentCanceled', appointmentData);
    } catch (error) {
      console.error('Error al guardar cita cancelada:', error);
    }
  });

      // Cuando llega un nuevo mensaje
    this.whatsappBot.on('newMessage', async (messageData) => {
      try {
        const direction = messageData.direction === 'sent' ? '📤 BOT' : '📥 CLIENTE';
        console.log(`💬 ${direction}: ${messageData.chatId} -> ${messageData.message.substring(0, 50)}...`);
        
        // Notificar al servidor web sobre nuevo mensaje
        await this.webServer.notifyConversationUpdate('newMessage', messageData);
      } catch (error) {
        console.error('Error al notificar nuevo mensaje:', error);
      }
    });

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('Error no capturado:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Promesa rechazada no manejada:', reason);
    });

    // Cerrar aplicación correctamente
    process.on('SIGINT', async () => {
      console.log('\n🛑 Cerrando sistema...');
      await this.shutdown();
      process.exit(0);
    });
  }

  // Inicializar sistema completo
  async initialize() {
    try {
      const botType = this.useSimulatedBot ? 'Simulado' : (this.useEnhancedBot ? 'Enhanced' : 'Original');
      console.log(`🚀 Iniciando Sistema de Citas (${botType})...`);
      console.log('==================================================');
      
      this.stats.startTime = moment();

      // Inicializar componentes
      console.log('📊 Configurando Excel Manager...');
      await this.excelManager.setupWorksheet();

      console.log('🌐 Iniciando servidor web...');
      this.webServer.start();

      if (!this.useSimulatedBot) {
        console.log('📋 Configurando Google Sheets Manager...');
        await this.googleSheets.authenticate();
      }

      console.log(`📱 Inicializando ${botType} Bot...`);
      await this.whatsappBot.initialize();

      if (!this.useSimulatedBot) {
        // Esperar a que WhatsApp esté listo (solo para bots reales)
        await this.waitForWhatsAppReady();
      }

      console.log('✅ Sistema inicializado correctamente');
      console.log('==================================================');

      this.isRunning = true;

      // Programar tareas automáticas (solo para bots reales)
      if (!this.useSimulatedBot) {
        this.scheduleAutomaticTasks();
      }

      // Si no es el bot mejorado ni simulado, procesar clientes normalmente
      if (!this.useEnhancedBot && !this.useSimulatedBot) {
        // Esperar un poco más antes de procesar clientes
        console.log('⏳ Esperando 5 segundos adicionales antes de procesar clientes...');
        await this.delay(5000);

        // Ejecutar primera verificación con validación
        console.log('🔄 Iniciando procesamiento de clientes...');
        await this.processNewClientsWithValidation();
      } else if (this.useSimulatedBot) {
        console.log('🤖 Modo simulación activado - Sistema listo para demostrar botones sin WhatsApp');
        console.log('🌐 Interfaz de simulación disponible en: http://localhost:3000/simulation');
      } else {
        console.log('🎭 Modo demo activado - Sistema listo para demostraciones interactivas');
      }

    } catch (error) {
      console.error('❌ Error al inicializar sistema:', error);
      throw error;
    }
  }

  // Esperar a que WhatsApp esté listo
  async waitForWhatsAppReady() {
    console.log('⏳ Esperando que WhatsApp esté listo...');
    
    // Esperar hasta 30 segundos máximo, verificando cada 2 segundos
    const maxWait = 30000; // 30 segundos
    const interval = 2000; // 2 segundos
    const maxAttempts = maxWait / interval;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = this.whatsappBot.getStatus();
      console.log(`🔍 [${attempt}/${maxAttempts}] Estado WhatsApp: isReady=${status.isReady}`);
      
      if (status.isReady) {
        console.log('✅ WhatsApp está listo!');
        return true;
      }
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Esperando ${interval/1000}s más...`);
        await this.delay(interval);
      }
    }
    
    console.log('⚠️ WhatsApp no parece estar completamente listo, pero continuando...');
    return true;
  }

  // Programar tareas automáticas
  scheduleAutomaticTasks() {
    // Ejecutar cada 30 minutos para verificar nuevos clientes (solo bot original)
    if (!this.useEnhancedBot) {
      cron.schedule('*/30 * * * *', async () => {
        if (this.isRunning) {
          console.log('⏰ Verificación automática programada...');
          await this.processNewClients();
        }
      });
    }

    // Limpiar citas pendientes expiradas cada hora
    cron.schedule('0 * * * *', () => {
      if (this.isRunning) {
        console.log('🧹 Limpiando citas pendientes expiradas...');
        this.whatsappBot.cleanExpiredPendingAppointments && this.whatsappBot.cleanExpiredPendingAppointments();
      }
    });

    // Crear backup diario a las 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      if (this.isRunning) {
        console.log('🔄 Creando backup diario...');
        await this.excelManager.createBackup();
      }
    });

    console.log('⏰ Tareas automáticas programadas');
  }

  // Procesar nuevos clientes con validación (solo bot original)
  async processNewClientsWithValidation() {
    if (this.useEnhancedBot) return; // No procesar automáticamente en modo demo
    
    try {
      const status = this.whatsappBot.getStatus();
      console.log('🔍 Validando estado del bot antes de procesar clientes:', status);
      
      if (!status.isReady) {
        console.log('⚠️ WhatsApp no está listo, esperando 10 segundos más...');
        await this.delay(10000);
        
        const newStatus = this.whatsappBot.getStatus();
        if (!newStatus.isReady) {
          console.log('❌ WhatsApp sigue sin estar listo, saltando procesamiento');
          return;
        }
      }
      
      console.log('✅ WhatsApp validado como listo, procesando clientes...');
      await this.processNewClients();
    } catch (error) {
      console.error('❌ Error en validación de clientes:', error);
    }
  }

  // Procesar nuevos clientes (solo bot original)
  async processNewClients() {
    if (this.useEnhancedBot) return; // No procesar automáticamente en modo demo
    
    try {
      console.log('📋 Verificando nuevos clientes...');
      
      // Verificar estado del bot antes de procesar
      if (!this.whatsappBot.getStatus().isReady) {
        console.log('⚠️ WhatsApp no está listo, saltando procesamiento');
        return;
      }
      
      const pendingClients = await this.googleSheets.readSheetData();

      if (pendingClients.length === 0) {
        console.log('ℹ️ No hay nuevos clientes pendientes');
        return;
      }

      console.log(`📞 Procesando ${pendingClients.length} cliente(s) pendiente(s)...`);

      // Procesar cada cliente con un pequeño delay para evitar spam
      let successCount = 0;
      let errorCount = 0;

      for (const [index, client] of pendingClients.entries()) {
        try {
          console.log(`📨 [${index + 1}/${pendingClients.length}] Contactando a ${client.name} (${client.phone})...`);
          
          // Verificar que el bot siga listo antes de cada envío
          if (!this.whatsappBot.getStatus().isReady) {
            console.log('⚠️ WhatsApp se desconectó durante el procesamiento');
            break;
          }
          
          const success = await this.whatsappBot.sendAppointmentRequest(client);
          
          if (success) {
            this.stats.clientsProcessed++;
            successCount++;
            console.log(`✅ [${index + 1}/${pendingClients.length}] Mensaje enviado a ${client.name}`);
          } else {
            errorCount++;
            console.log(`❌ [${index + 1}/${pendingClients.length}] Error al enviar mensaje a ${client.name}`);
          }

          // Delay progresivo entre mensajes (2-5 segundos)
          const delayTime = Math.min(2000 + (index * 500), 5000);
          console.log(`⏱️ Esperando ${delayTime / 1000}s antes del siguiente mensaje...`);
          await this.delay(delayTime);

        } catch (error) {
          errorCount++;
          console.error(`❌ Error al procesar ${client.name}:`, error);
        }
      }

      console.log(`📊 Procesamiento completado:`);
      console.log(`   ✅ Exitosos: ${successCount}`);
      console.log(`   ❌ Errores: ${errorCount}`);
      console.log(`   📱 Total procesados: ${successCount + errorCount}`);

    } catch (error) {
      console.error('❌ Error al procesar nuevos clientes:', error);
    }
  }

  // Obtener estadísticas del sistema
  getSystemStats() {
    const uptime = this.stats.startTime ? moment().diff(this.stats.startTime, 'minutes') : 0;
    const whatsappStatus = this.whatsappBot.getStatus();
    const excelStats = this.excelManager.getStatistics();
    const conversationsStats = this.whatsappBot.getConversationsStats();

    let enhancedStats = {};
    if (this.useEnhancedBot && this.whatsappBot.getSystemData) {
      enhancedStats = this.whatsappBot.getSystemData();
    }

    return {
      system: {
        isRunning: this.isRunning,
        uptime: `${uptime} minutos`,
        startTime: this.stats.startTime ? this.stats.startTime.format('DD/MM/YYYY HH:mm:ss') : null,
        botType: this.useEnhancedBot ? 'Enhanced' : 'Original'
      },
      whatsapp: {
        isReady: whatsappStatus.isReady,
        pendingAppointments: whatsappStatus.pendingAppointments,
        totalConversations: whatsappStatus.totalConversations
      },
      processing: {
        clientsProcessed: this.stats.clientsProcessed,
        appointmentsScheduled: this.stats.appointmentsScheduled,
        appointmentsRejected: this.stats.appointmentsRejected
      },
      excel: excelStats,
      conversations: conversationsStats,
      enhanced: enhancedStats
    };
  }

  // Mostrar estadísticas
  showStats() {
    const stats = this.getSystemStats();
    
    console.log('\n📊 ESTADÍSTICAS DEL SISTEMA');
    console.log('==========================');
    console.log(`🤖 Tipo de bot: ${stats.system.botType}`);
    console.log(`🔧 Sistema activo: ${stats.system.isRunning ? 'Sí' : 'No'}`);
    console.log(`⏰ Tiempo activo: ${stats.system.uptime}`);
    console.log(`📱 WhatsApp listo: ${stats.whatsapp.isReady ? 'Sí' : 'No'}`);
    console.log(`⏳ Citas pendientes: ${stats.whatsapp.pendingAppointments}`);
    console.log(`💬 Conversaciones activas: ${stats.whatsapp.totalConversations}`);
    console.log(`👥 Clientes procesados: ${stats.processing.clientsProcessed}`);
    console.log(`✅ Citas agendadas: ${stats.processing.appointmentsScheduled}`);
    console.log(`❌ Citas rechazadas: ${stats.processing.appointmentsRejected}`);
    console.log(`📋 Total en Excel: ${stats.excel.total}`);
    console.log(`📨 Total mensajes: ${stats.conversations.totalMessages}`);
    
    if (this.useEnhancedBot && stats.enhanced.stats) {
      console.log(`🔧 Técnicos disponibles: ${stats.enhanced.stats.totalTechnicians}`);
      console.log(`📈 Disponibilidad sistema: ${stats.enhanced.stats.availabilityRate}%`);
    }
    
    console.log('==========================\n');
  }

  // Procesar comando manual
  async processCommand(command) {
    switch (command.toLowerCase()) {
      case 'stats':
      case 'estadisticas':
        this.showStats();
        break;
        
      case 'process':
      case 'procesar':
        if (!this.useEnhancedBot) {
          await this.processNewClients();
        } else {
          console.log('ℹ️ Modo demo activado - procesamiento automático deshabilitado');
        }
        break;
        
      case 'backup':
        await this.excelManager.createBackup();
        break;
        
      case 'conversations':
      case 'conversaciones':
        this.showConversations();
        break;

      case 'demo':
        if (this.useEnhancedBot) {
          console.log('🎭 Datos del sistema de demo:');
          console.log(JSON.stringify(this.whatsappBot.getSystemData(), null, 2));
        } else {
          console.log('ℹ️ Comando demo solo disponible con Enhanced Bot');
        }
        break;
        
      case 'help':
      case 'ayuda':
        this.showHelp();
        break;
        
      default:
        console.log('❓ Comando no reconocido. Usa "help" para ver comandos disponibles.');
    }
  }

  // Mostrar resumen de conversaciones
  showConversations() {
    const conversations = this.whatsappBot.getConversations ? this.whatsappBot.getConversations() : [];
    
    console.log('\n💬 CONVERSACIONES RECIENTES');
    console.log('============================');
    
    if (conversations.length === 0) {
      console.log('No hay conversaciones registradas');
    } else {
      conversations.slice(0, 10).forEach((conv, index) => {
        console.log(`${index + 1}. ${conv.phoneNumber}`);
        console.log(`   📨 ${conv.lastMessage.substring(0, 50)}...`);
        console.log(`   🕐 ${conv.lastMessageTime} (${conv.messageCount} mensajes)`);
        console.log(`   📊 Estado: ${conv.status}`);
        console.log('');
      });
      
      if (conversations.length > 10) {
        console.log(`... y ${conversations.length - 10} conversaciones más`);
      }
    }
    console.log('============================\n');
  }

  // Mostrar ayuda
  showHelp() {
    console.log('\n🆘 COMANDOS DISPONIBLES');
    console.log('======================');
    console.log('stats         - Mostrar estadísticas del sistema');
    console.log('process       - Procesar nuevos clientes manualmente');
    console.log('backup        - Crear backup del archivo Excel');
    console.log('conversations - Mostrar resumen de conversaciones');
    if (this.useEnhancedBot) {
      console.log('demo          - Mostrar datos del sistema de demo');
    }
    console.log('help          - Mostrar esta ayuda');
    console.log('======================\n');
  }

  // Función de delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cerrar sistema
  async shutdown() {
    try {
      this.isRunning = false;
      console.log('🌐 Cerrando servidor web...');
      this.webServer.stop();
      console.log('🔌 Cerrando WhatsApp Bot...');
      await this.whatsappBot.destroy();
      console.log('💾 Guardando datos finales...');
      await this.excelManager.saveWorkbook();
      console.log('✅ Sistema cerrado correctamente');
    } catch (error) {
      console.error('Error al cerrar sistema:', error);
    }
  }

  // Método auxiliar para delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Inicializar sistema
async function main() {
  try {
    // Verificar si se debe usar el bot mejorado o simulado
    const useEnhancedBot = process.argv.includes('--demo') || process.argv.includes('--enhanced');
    const useSimulatedBot = process.argv.includes('--simulation') || process.argv.includes('--buttons');
    
    if (useSimulatedBot) {
      console.log('🤖 Iniciando en modo SIMULACIÓN con Bot Simulado (sin WhatsApp)');
    } else if (useEnhancedBot) {
      console.log('🎭 Iniciando en modo DEMO con Enhanced Bot');
    }
    
    const system = new AppointmentSystem(useEnhancedBot, useSimulatedBot);
    await system.initialize();

    // Interfaz de comandos simple
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let botType = 'Producción';
    if (useSimulatedBot) {
      botType = 'Simulación/Botones';
    } else if (useEnhancedBot) {
      botType = 'Demo/Enhanced';
    }
    
    console.log(`\n✨ Sistema listo (Modo: ${botType})! Escriba "help" para ver comandos disponibles.`);
    
    if (useSimulatedBot) {
      console.log('🤖 Simulación de botones disponible en: http://localhost:3000/simulation');
      console.log('💡 Esta versión funciona sin WhatsApp y demuestra botones interactivos');
    } else if (useEnhancedBot) {
      console.log('🌐 Panel de demo disponible en: http://localhost:3000/demo');
    }
    
    console.log('Presione Ctrl+C para salir.\n');

    rl.on('line', async (input) => {
      const command = input.trim();
      if (command) {
        await system.processCommand(command);
      }
      rl.prompt();
    });

    rl.prompt();

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AppointmentSystem; 