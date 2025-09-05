const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');
const moment = require('moment');
const { EventEmitter } = require('events');
const ConversationsManager = require('./conversationsManager');
const TechnicianScheduler = require('./technicianScheduler');

// Configurar locales para moment
require('moment/locale/es');
require('moment/locale/de');

class EnhancedWhatsAppBot extends EventEmitter {
  constructor() {
    super();
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: config.whatsapp.sessionName + '_enhanced'
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.pendingAppointments = new Map();
    this.conversationStates = new Map();
    this.appointmentReminders = new Map();
    this.userLanguages = new Map();
    this.conversationsManager = new ConversationsManager();
    this.technicianScheduler = new TechnicianScheduler(); // Nuevo sistema
    this.systemQueries = new Map(); // Guardar consultas para demo
    
    this.setupEventHandlers();
  }

  // Mensajes mejorados más naturales y conversacionales
  getEnhancedMessages() {
    return {
      languageSelection: {
        es: `🏠 ¡Hola {name}! Soy el asistente virtual de Deutsche Glasfaser 🤖

Me comunico contigo porque tienes pendiente la *instalación de tu servicio de fibra óptica* y quiero ayudarte a coordinar la visita del técnico.

🌐 Para brindarte la mejor atención, ¿podrías seleccionar tu idioma preferido?

1️⃣ Español 🇪🇸
2️⃣ English 🇺🇸  
3️⃣ Deutsch 🇩🇪

👉 Solo escribe el número (1, 2 ó 3)`,

        en: `🏠 Hello {name}! I'm Deutsche Glasfaser's virtual assistant 🤖

I'm contacting you because you have a pending *fiber optic service installation* and I want to help you coordinate the technician's visit.

🌐 To provide you with the best service, could you select your preferred language?

1️⃣ Español 🇪🇸
2️⃣ English 🇺🇸
3️⃣ Deutsch 🇩🇪

👉 Just write the number (1, 2 or 3)`,

        de: `🏠 Hallo {name}! Ich bin der virtuelle Assistent von Deutsche Glasfaser 🤖

Ich kontaktiere Sie, weil Sie eine ausstehende *Glasfaser-Service-Installation* haben und ich Ihnen helfen möchte, den Technikerbesuch zu koordinieren.

🌐 Um Ihnen den besten Service zu bieten, könnten Sie Ihre bevorzugte Sprache auswählen?

1️⃣ Español 🇪🇸
2️⃣ English 🇺🇸
3️⃣ Deutsch 🇩🇪

👉 Schreiben Sie einfach die Nummer (1, 2 oder 3)`
      },

      systemSearching: {
        es: `🔍 *Consultando sistema interno...*
⏳ Verificando disponibilidad de técnicos en tu zona
📊 Analizando cargas de trabajo y eficiencia`,

        en: `🔍 *Checking internal system...*
⏳ Verifying technician availability in your area  
📊 Analyzing workloads and efficiency`,

        de: `🔍 *Überprüfung des internen Systems...*
⏳ Verfügbarkeit von Technikern in Ihrer Region wird geprüft
📊 Arbeitsbelastung und Effizienz werden analysiert`
      },

      foundAvailability: {
        es: `✅ *¡Perfecto! He encontrado disponibilidad*

📊 Consulté nuestro sistema y tengo excelentes opciones para ti:
🔧 {totalTechnicians} técnicos especializados disponibles
📅 {optionsCount} horarios convenientes encontrados

¿Te gustaría que te muestre las mejores opciones?

1️⃣ Sí, muéstrame los horarios
2️⃣ Necesito reagendar más adelante`,

        en: `✅ *Perfect! I found availability*

📊 I checked our system and have excellent options for you:
🔧 {totalTechnicians} specialized technicians available
📅 {optionsCount} convenient schedules found

Would you like me to show you the best options?

1️⃣ Yes, show me the schedules
2️⃣ I need to reschedule for later`,

        de: `✅ *Perfekt! Ich habe Verfügbarkeiten gefunden*

📊 Ich habe unser System überprüft und habe ausgezeichnete Optionen für Sie:
🔧 {totalTechnicians} spezialisierte Techniker verfügbar
📅 {optionsCount} passende Termine gefunden

Möchten Sie, dass ich Ihnen die besten Optionen zeige?

1️⃣ Ja, zeigen Sie mir die Termine
2️⃣ Ich muss später umplanen`
      },

      displayOptions: {
        es: `📅 *Estos son los mejores horarios disponibles:*

{slots}

💡 *Recomendación del sistema:* Los horarios de mañana suelen tener mejor puntualidad

¿Cuál prefieres? Solo escribe el número 👆`,

        en: `📅 *These are the best available schedules:*

{slots}

💡 *System recommendation:* Morning schedules usually have better punctuality  

Which do you prefer? Just write the number 👆`,

        de: `📅 *Das sind die besten verfügbaren Termine:*

{slots}

💡 *Systemempfehlung:* Morgentermine haben normalerweise bessere Pünktlichkeit

Welchen bevorzugen Sie? Schreiben Sie einfach die Nummer 👆`
      },

      slotReservation: {
        es: `🔒 *Reservando tu horario...*
⏱️ He bloqueado temporalmente este slot para ti
📋 Generando confirmación del sistema`,

        en: `🔒 *Reserving your schedule...*
⏱️ I've temporarily blocked this slot for you
📋 Generating system confirmation`,

        de: `🔒 *Reservierung Ihres Termins...*
⏱️ Ich habe diesen Slot temporär für Sie blockiert
📋 Systembestätigung wird generiert`
      },

      confirmationRequest: {
        es: `✅ *¡Excelente elección!*

He reservado temporalmente:
🗓️ **{selectedSlot}**  
👨‍🔧 **Técnico:** {technicianName}
📍 **Zona:** {zone}
⚡ **Eficiencia:** {efficiency}%

⏰ Esta reserva expira en 10 minutos

¿Confirmas esta cita de instalación?

1️⃣ Sí, confirmo la cita
2️⃣ Quiero ver otras opciones  
3️⃣ Necesito reagendar`,

        en: `✅ *Excellent choice!*

I have temporarily reserved:
🗓️ **{selectedSlot}**
👨‍🔧 **Technician:** {technicianName}  
📍 **Zone:** {zone}
⚡ **Efficiency:** {efficiency}%

⏰ This reservation expires in 10 minutes

Do you confirm this installation appointment?

1️⃣ Yes, I confirm the appointment
2️⃣ I want to see other options
3️⃣ I need to reschedule`,

        de: `✅ *Ausgezeichnete Wahl!*

Ich habe temporär reserviert:
🗓️ **{selectedSlot}**
👨‍🔧 **Techniker:** {technicianName}
📍 **Zone:** {zone}  
⚡ **Effizienz:** {efficiency}%

⏰ Diese Reservierung läuft in 10 Minuten ab

Bestätigen Sie diesen Installationstermin?

1️⃣ Ja, ich bestätige den Termin
2️⃣ Ich möchte andere Optionen sehen
3️⃣ Ich muss umplanen`
      },

      finalConfirmation: {
        es: `🎉 *¡Cita confirmada exitosamente!*

📋 **CONFIRMACIÓN:** {confirmationCode}
🗓️ **Fecha y hora:** {finalSlot}
👨‍🔧 **Técnico asignado:** {technicianName}
📍 **Zona de servicio:** {zone}

📲 **Próximos pasos:**
• Te enviaré un recordatorio 24h antes
• El técnico llegará en el horario acordado
• La instalación completa toma aprox. 2-3 horas
• Asegúrate de estar disponible

✨ **¡Listo! Tu fibra óptica estará funcionando pronto**

¿Hay algo más en lo que pueda ayudarte?`,

        en: `🎉 *Appointment confirmed successfully!*

📋 **CONFIRMATION:** {confirmationCode}  
🗓️ **Date and time:** {finalSlot}
👨‍🔧 **Assigned technician:** {technicianName}
📍 **Service zone:** {zone}

📲 **Next steps:**
• I'll send you a reminder 24h before
• The technician will arrive at the agreed time  
• Complete installation takes approx. 2-3 hours
• Make sure you're available

✨ **Ready! Your fiber optic will be working soon**

Is there anything else I can help you with?`,

        de: `🎉 *Termin erfolgreich bestätigt!*

📋 **BESTÄTIGUNG:** {confirmationCode}
🗓️ **Datum und Uhrzeit:** {finalSlot}  
👨‍🔧 **Zugewiesener Techniker:** {technicianName}
📍 **Servicebereich:** {zone}

📲 **Nächste Schritte:**
• Ich sende Ihnen 24h vorher eine Erinnerung
• Der Techniker wird zur vereinbarten Zeit ankommen
• Die komplette Installation dauert ca. 2-3 Stunden  
• Stellen Sie sicher, dass Sie verfügbar sind

✨ **Fertig! Ihr Glasfaser wird bald funktionieren**

Kann ich Ihnen sonst noch bei etwas helfen?`
      },

      reminderConfirmation: {
        es: `🔔 *Sistema de recordatorios activado*
📱 Te escribiré por WhatsApp 24 horas antes de tu cita

🤖 Soy tu asistente virtual 24/7. Si necesitas reagendar o tienes dudas, simplemente escríbeme.

¡Que tengas un excelente día! 🌟`,

        en: `🔔 *Reminder system activated*  
📱 I'll write to you on WhatsApp 24 hours before your appointment

🤖 I'm your virtual assistant 24/7. If you need to reschedule or have questions, just write to me.

Have an excellent day! 🌟`,

        de: `🔔 *Erinnerungssystem aktiviert*
📱 Ich schreibe Ihnen 24 Stunden vor Ihrem Termin auf WhatsApp

🤖 Ich bin Ihr virtueller Assistent 24/7. Wenn Sie umplanen müssen oder Fragen haben, schreiben Sie mir einfach.

Haben Sie einen ausgezeichneten Tag! 🌟`
      }
    };
  }

  // Obtener mensaje en el idioma del usuario
  getEnhancedMessage(chatId, messageKey, replacements = {}) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const messages = this.getEnhancedMessages();
    let message = messages[messageKey][userLanguage];
    
    // Reemplazar variables en el mensaje
    Object.keys(replacements).forEach(key => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
    });
    
    return message;
  }

  // Configurar manejadores de eventos (similar al original)
  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('📱 Escanea el código QR con WhatsApp (Enhanced Bot):');
      if (config.whatsapp.qrCodeInTerminal) {
        qrcode.generate(qr, { small: true });
      }
    });

    this.client.on('ready', () => {
      console.log('✅ Enhanced WhatsApp Bot está listo!');
    });

    this.client.on('message', async (message) => {
      this.conversationsManager.addMessage(message.from, message, 'received');
      
      this.emit('newMessage', {
        chatId: message.from,
        message: message.body,
        direction: 'received',
        timestamp: Date.now()
      });
      
      await this.handleEnhancedMessage(message);
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ Enhanced WhatsApp desconectado:', reason);
    });
  }

  // Manejar mensajes con lógica mejorada
  async handleEnhancedMessage(message) {
    try {
      const chatId = message.from;
      const messageBody = message.body.toLowerCase().trim();

      if (message.fromMe) return;

      console.log(`📨 Enhanced mensaje recibido de ${chatId}: ${message.body}`);

      const currentState = this.conversationStates.get(chatId) || { state: 'language_selection' };

      switch (currentState.state) {
        case 'language_selection':
          await this.handleLanguageSelection(message, chatId);
          break;
        case 'initial_consultation':
          await this.handleInitialConsultation(message, chatId);
          break;
        case 'system_searching':
          // Estado de espera mientras busca
          break;
        case 'showing_options':
          await this.handleOptionSelection(message, chatId);
          break;
        case 'confirming_slot':
          await this.handleSlotConfirmation(message, chatId);
          break;
        case 'finalizing':
          await this.handleFinalSteps(message, chatId);
          break;
        default:
          await this.handleLanguageSelection(message, chatId);
      }

    } catch (error) {
      console.error('Error al manejar mensaje enhanced:', error);
    }
  }

  // Manejar selección de idioma mejorada
  async handleLanguageSelection(message, chatId) {
    const messageBody = message.body.trim();
    
    if (this.userLanguages.has(chatId)) {
      await this.handleInitialConsultation(message, chatId);
      return;
    }

    let selectedLanguage = null;
    switch (messageBody) {
      case '1':
        selectedLanguage = 'es';
        break;
      case '2':
        selectedLanguage = 'en';
        break;
      case '3':
        selectedLanguage = 'de';
        break;
      default:
        await this.sendLanguageSelection(chatId, '');
        return;
    }

    this.userLanguages.set(chatId, selectedLanguage);
    await this.startEnhancedFlow(chatId);
  }

  // Iniciar flujo mejorado
  async startEnhancedFlow(chatId) {
    // Simular que estamos consultando el sistema
    const searchingMessage = this.getEnhancedMessage(chatId, 'systemSearching');
    await this.sendMessageAndSave(chatId, searchingMessage);

    // Simular delay de consulta real
    await this.delay(2000);

    // Consultar disponibilidad real usando el nuevo sistema
    const availability = await this.technicianScheduler.queryTechnicianAvailability();
    
    // Guardar consulta para el demo
    this.systemQueries.set(chatId, availability);

    const foundMessage = this.getEnhancedMessage(chatId, 'foundAvailability', {
      totalTechnicians: availability.totalTechnicians,
      optionsCount: availability.results.length
    });

    await this.sendMessageAndSave(chatId, foundMessage);
    
    this.conversationStates.set(chatId, { 
      state: 'initial_consultation',
      availability: availability
    });
  }

  // Manejar consulta inicial
  async handleInitialConsultation(message, chatId) {
    const messageBody = message.body.trim();
    const currentState = this.conversationStates.get(chatId);

    if (messageBody === '1') {
      await this.showEnhancedOptions(chatId, currentState.availability);
    } else if (messageBody === '2') {
      await this.handleRescheduleRequest(chatId);
    } else {
      await this.startEnhancedFlow(chatId);
    }
  }

  // Mostrar opciones mejoradas
  async showEnhancedOptions(chatId, availability) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    
    // Formatear slots de manera más atractiva
    let slotsText = '';
    const topOptions = availability.results.slice(0, 4);
    
    topOptions.forEach((option, index) => {
      const number = index + 1;
      const efficiency = Math.round(option.efficiency * 100);
      
      slotsText += `${number}️⃣ **${option.dateFormatted}**\n`;
      slotsText += `   🕐 ${option.timeSlot}\n`;
      slotsText += `   👨‍🔧 ${option.technicianName} (${efficiency}% eficiencia)\n`;
      slotsText += `   📍 Zona ${option.zone}\n\n`;
    });

    const optionsMessage = this.getEnhancedMessage(chatId, 'displayOptions', {
      slots: slotsText.trim()
    });

    await this.sendMessageAndSave(chatId, optionsMessage);
    
    this.conversationStates.set(chatId, { 
      state: 'showing_options',
      availability: availability,
      topOptions: topOptions
    });
  }

  // Manejar selección de opción
  async handleOptionSelection(message, chatId) {
    const messageBody = message.body.trim();
    const slotNumber = parseInt(messageBody);
    const currentState = this.conversationStates.get(chatId);
    
    if (slotNumber >= 1 && slotNumber <= 4 && currentState.topOptions) {
      const selectedOption = currentState.topOptions[slotNumber - 1];
      await this.reserveAndConfirm(chatId, selectedOption);
    } else {
      await this.showEnhancedOptions(chatId, currentState.availability);
    }
  }

  // Reservar y confirmar slot
  async reserveAndConfirm(chatId, selectedOption) {
    // Mostrar mensaje de reserva
    const reservingMessage = this.getEnhancedMessage(chatId, 'slotReservation');
    await this.sendMessageAndSave(chatId, reservingMessage);

    // Simular proceso de reserva
    await this.delay(1500);

    // Reservar temporalmente en el sistema
    const holdResult = await this.technicianScheduler.holdSlot(
      selectedOption.technicianId,
      selectedOption.date,
      selectedOption.timeSlot
    );

    if (!holdResult.success) {
      await this.handleSlotUnavailable(chatId);
      return;
    }

    // Mostrar confirmación con todos los detalles
    const efficiency = Math.round(selectedOption.efficiency * 100);
    const confirmMessage = this.getEnhancedMessage(chatId, 'confirmationRequest', {
      selectedSlot: `${selectedOption.dateFormatted}, ${selectedOption.timeSlot}`,
      technicianName: selectedOption.technicianName,
      zone: selectedOption.zone,
      efficiency: efficiency
    });

    await this.sendMessageAndSave(chatId, confirmMessage);
    
    this.conversationStates.set(chatId, { 
      state: 'confirming_slot',
      selectedOption: selectedOption,
      holdKey: holdResult.holdKey
    });
  }

  // Manejar confirmación de slot
  async handleSlotConfirmation(message, chatId) {
    const messageBody = message.body.trim();
    const currentState = this.conversationStates.get(chatId);
    
    if (messageBody === '1') {
      await this.finalizeAppointmentEnhanced(chatId, currentState.selectedOption);
    } else if (messageBody === '2') {
      // Volver a mostrar opciones
      const availability = this.systemQueries.get(chatId);
      await this.showEnhancedOptions(chatId, availability);
    } else if (messageBody === '3') {
      await this.handleRescheduleRequest(chatId);
    } else {
      await this.reserveAndConfirm(chatId, currentState.selectedOption);
    }
  }

  // Finalizar cita mejorada
  async finalizeAppointmentEnhanced(chatId, selectedOption) {
    // Confirmar en el sistema
    const clientInfo = {
      name: 'Cliente Demo',
      phone: chatId.replace('@c.us', '')
    };

    const confirmation = await this.technicianScheduler.confirmAppointment(
      selectedOption.technicianId,
      selectedOption.date,
      selectedOption.timeSlot,
      clientInfo
    );

    if (!confirmation.success) {
      await this.handleConfirmationError(chatId);
      return;
    }

    // Guardar en el sistema local
    this.pendingAppointments.set(chatId, {
      slot: selectedOption,
      confirmed: true,
      confirmationCode: confirmation.confirmationCode,
      timestamp: Date.now()
    });

    // Enviar confirmación final
    const finalMessage = this.getEnhancedMessage(chatId, 'finalConfirmation', {
      confirmationCode: confirmation.confirmationCode,
      finalSlot: `${selectedOption.dateFormatted}, ${selectedOption.timeSlot}`,
      technicianName: confirmation.technician,
      zone: selectedOption.zone
    });

    await this.sendMessageAndSave(chatId, finalMessage);

    // Configurar recordatorio
    await this.delay(1000);
    const reminderMessage = this.getEnhancedMessage(chatId, 'reminderConfirmation');
    await this.sendMessageAndSave(chatId, reminderMessage);
    
    this.conversationStates.set(chatId, { 
      state: 'completed',
      appointment: selectedOption
    });

    // Emitir evento
    this.emit('appointmentConfirmed', {
      chatId: chatId,
      slot: selectedOption,
      confirmationCode: confirmation.confirmationCode,
      timestamp: Date.now()
    });
  }

  // Funciones de utilidad
  async handleSlotUnavailable(chatId) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const messages = {
      es: '😔 Lo siento, ese horario acaba de ser tomado por otro cliente. Permíteme buscar opciones similares...',
      en: '😔 Sorry, that schedule was just taken by another client. Let me find similar options...',
      de: '😔 Entschuldigung, dieser Termin wurde gerade von einem anderen Kunden genommen. Lassen Sie mich ähnliche Optionen finden...'
    };
    
    await this.sendMessageAndSave(chatId, messages[userLanguage]);
    await this.startEnhancedFlow(chatId);
  }

  async handleRescheduleRequest(chatId) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const messages = {
      es: '📅 Entiendo que necesitas reagendar. Por favor contáctanos nuevamente cuando estés listo para programar tu instalación. ¡Estaremos aquí para ayudarte! 😊',
      en: '📅 I understand you need to reschedule. Please contact us again when you\'re ready to schedule your installation. We\'ll be here to help! 😊',
      de: '📅 Ich verstehe, dass Sie umplanen müssen. Bitte kontaktieren Sie uns erneut, wenn Sie bereit sind, Ihre Installation zu planen. Wir sind hier, um zu helfen! 😊'
    };
    
    await this.sendMessageAndSave(chatId, messages[userLanguage]);
    this.conversationStates.delete(chatId);
  }

  // Métodos heredados y adaptados del bot original
  async sendLanguageSelection(chatId, userName = '') {
    const languageMessage = this.getEnhancedMessage(chatId, 'languageSelection', { 
      name: userName || ''
    });
    
    await this.sendMessageAndSave(chatId, languageMessage);
    this.conversationStates.set(chatId, { state: 'language_selection' });
  }

  // Métodos para compatibilidad con webServer original
  getConversations() {
    return this.conversationsManager.getAllConversations();
  }

  getConversation(chatId) {
    return this.conversationsManager.getConversation(chatId);
  }

  getConversationsStats() {
    return this.conversationsManager.getStatistics();
  }

  // Método para limpiar citas expiradas (compatibilidad)
  cleanExpiredPendingAppointments() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [chatId, data] of this.pendingAppointments.entries()) {
      if (now - data.timestamp > oneHour) {
        this.pendingAppointments.delete(chatId);
        this.conversationStates.delete(chatId);
        console.log(`🧹 Cita pendiente expirada removida: ${chatId}`);
      }
    }
  }

  // Método para envío de solicitud de cita (compatibilidad con sistema original)
  async sendAppointmentRequest(client) {
    try {
      const phoneNumber = this.formatPhoneNumber(client.phone);
      const chatId = `${phoneNumber}@c.us`;

      console.log(`📞 Enviando solicitud mejorada a ${client.name} (${phoneNumber})`);

      const success = await this.sendContextAndLanguageSelection(chatId, client.name);
      
      if (success) {
        console.log(`✅ Mensaje mejorado enviado exitosamente a ${client.name}`);
        return true;
      } else {
        console.error(`❌ Falló el envío del mensaje mejorado a ${client.name}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error al enviar solicitud mejorada a ${client.name}:`, error);
      return false;
    }
  }

  // Enviar mensaje combinado de contexto de Deutsche Glasfaser y selección de idioma
  async sendContextAndLanguageSelection(chatId, userName = '') {
    try {
      const greeting = userName && userName.trim() !== '' ? `${userName.trim()}` : '';
      
      // Mensaje completo en alemán con contexto + selección de idioma
      const completeMessage = greeting 
        ? `🏠 Hallo ${greeting}!\n\n📡 Deutsche Glasfaser kontaktiert Sie, weil Sie einen ausstehenden *Installations- und Aktivierungsprozess* für Ihren Glasfaser-Internetdienst haben.\n\n🔧 Um den Technikerbesuch zu koordinieren, benötigen wir einige Daten.\n\n🌐 Bitte wählen Sie Ihre bevorzugte Sprache:\n\n1. Español 🇪🇸\n2. English 🇺🇸\n3. Deutsch 🇩🇪\n\n👉 Antworten Sie nur mit der Nummer (1, 2 oder 3)`
        : `🏠 Hallo!\n\n📡 Deutsche Glasfaser kontaktiert Sie, weil Sie einen ausstehenden *Installations- und Aktivierungsprozess* für Ihren Glasfaser-Internetdienst haben.\n\n🔧 Um den Technikerbesuch zu koordinieren, benötigen wir einige Daten.\n\n🌐 Bitte wählen Sie Ihre bevorzugte Sprache:\n\n1. Español 🇪🇸\n2. English 🇺🇸\n3. Deutsch 🇩🇪\n\n👉 Antworten Sie nur mit der Nummer (1, 2 oder 3)`;
      
      await this.sendMessageAndSave(chatId, completeMessage);
      this.conversationStates.set(chatId, { state: 'language_selection' });
      return true;
    } catch (error) {
      console.error('❌ Error en sendContextAndLanguageSelection:', error);
      
      // Fallback al mensaje básico si falla
      try {
        const greeting = userName && userName.trim() !== '' ? `Hallo ${userName.trim()}! 👋` : 'Hallo! 👋';
        
        const fallbackMessage = `${greeting}

📡 Deutsche Glasfaser kontaktiert Sie, weil Sie einen ausstehenden Installations- und Aktivierungsprozess für Glasfaser haben.

🌐 Bitte wählen Sie Ihre Sprache:
1. Español 🇪🇸
2. English 🇺🇸  
3. Deutsch 🇩🇪

👉 Antworten Sie nur mit der Nummer (1, 2 oder 3)`;

        const success = await this.sendMessageAndSave(chatId, fallbackMessage);
        if (success) {
          this.conversationStates.set(chatId, { state: 'language_selection' });
        }
        return success;
      } catch (fallbackError) {
        console.error('❌ Error en mensaje fallback:', fallbackError);
        return false;
      }
    }
  }

  // Formatear número de teléfono (optimizado para Alemania y Colombia)
  formatPhoneNumber(phone) {
    // Remover caracteres no numéricos
    let formattedPhone = phone.replace(/\D/g, '');

    // Si ya empieza con código de país alemán o colombiano, devolverlo tal como está
    if (formattedPhone.startsWith('49') || formattedPhone.startsWith('57')) {
      return this.validateCountryNumber(formattedPhone);
    }

    // Si el número es muy largo, probablemente ya tenga código de país
    if (formattedPhone.length >= 13) {
      return formattedPhone;
    }

    // Detectar país específico según longitud del número local
    let localLength = formattedPhone.length;
    
    if (localLength === 10) {
      // Colombia: 10 dígitos locales (ej: 3123456789 → 573123456789)
      if (formattedPhone.startsWith('3') || formattedPhone.startsWith('1')) {
        formattedPhone = '57' + formattedPhone;
      } else {
        // Alemania: algunos números de 10 dígitos
        formattedPhone = '49' + formattedPhone;
      }
    } else if (localLength === 11) {
      // Alemania: 11 dígitos locales (ej: 15123456789 → 4915123456789)
      formattedPhone = '49' + formattedPhone;
    } else if (localLength === 9) {
      // Algunos números alemanes cortos
      formattedPhone = '49' + formattedPhone;
    } else {
      // Usar código de país por defecto (Alemania)
      formattedPhone = config.bot.defaultCountryCode + formattedPhone;
    }

    return this.validateCountryNumber(formattedPhone);
  }

  // Validar y corregir números según el país
  validateCountryNumber(phone) {
    if (phone.startsWith('49')) {
      // Números alemanes: pueden tener entre 12-14 dígitos totales
      if (phone.length >= 11 && phone.length <= 15) {
        return phone;
      }
    } else if (phone.startsWith('57')) {
      // Números colombianos: deben tener 12 dígitos totales (57 + 10 dígitos)
      if (phone.length === 12) {
        return phone;
      }
    }
    
    // Si no es válido, agregar log para debugging
    console.log(`⚠️ Número posiblemente inválido: ${phone}`);
    return phone;
  }

  async sendMessageAndSave(chatId, message) {
    try {
      if (!this.isClientReady()) {
        console.log('⏳ Enhanced cliente no está listo, esperando...');
        await this.waitForClientReady(10000);
      }

      await this.client.sendMessage(chatId, message);
      this.conversationsManager.addMessage(chatId, message, 'sent');
      
      console.log(`📤 Enhanced Bot envió: ${message.substring(0, 50)}...`);
      
      this.emit('newMessage', {
        chatId: chatId,
        message: message,
        direction: 'sent',
        timestamp: Date.now()
      });
      
      return true;

    } catch (error) {
      console.error('❌ Error al enviar mensaje enhanced:', error);
      return false;
    }
  }

  // Métodos de inicialización y estado
  async initialize() {
    try {
      console.log('🚀 Inicializando Enhanced WhatsApp Bot...');
      await this.client.initialize();
      console.log('✅ Enhanced WhatsApp Bot inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar Enhanced Bot:', error);
      throw error;
    }
  }

  isClientReady() {
    try {
      return this.client && 
             this.client.pupPage && 
             this.client.info && 
             typeof this.client.sendMessage === 'function';
    } catch (error) {
      return false;
    }
  }

  async waitForClientReady(timeout = 30000) {
    const startTime = Date.now();
    
    while (!this.isClientReady() && (Date.now() - startTime) < timeout) {
      console.log('⏳ Enhanced bot esperando...');
      await this.delay(2000);
    }
    
    return this.isClientReady();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos para obtener datos de demo
  getSystemData() {
    return this.technicianScheduler.getDemoData();
  }

  getSystemQueries() {
    return Array.from(this.systemQueries.values());
  }

  getStatus() {
    return {
      isReady: this.isClientReady(),
      pendingAppointments: this.pendingAppointments.size,
      conversationStates: this.conversationStates.size,
      totalConversations: this.conversationsManager.conversations.size,
      systemQueries: this.systemQueries.size,
      uptime: process.uptime()
    };
  }

  async destroy() {
    try {
      await this.client.destroy();
      console.log('🔌 Enhanced WhatsApp Bot desconectado');
    } catch (error) {
      console.error('Error al cerrar Enhanced Bot:', error);
    }
  }
}

module.exports = EnhancedWhatsAppBot; 