const { EventEmitter } = require('events');
const moment = require('moment');
const ConversationsManager = require('./conversationsManager');

// Configurar locales para moment
require('moment/locale/es');

class SimulatedChatBot extends EventEmitter {
  constructor() {
    super();
    this.pendingAppointments = new Map();
    this.conversationStates = new Map();
    this.userLanguages = new Map();
    this.conversationsManager = new ConversationsManager();
    this.simulatedClients = new Map(); // Para simular diferentes clientes
    this.isSimulating = false;
  }

  // Crear mensaje con máximo 3 botones
  createButtonMessage(text, buttons, header = '') {
    // Limitar a máximo 3 botones
    const limitedButtons = buttons.slice(0, 3);
    
    let message = '';
    
    if (header) {
      message += `*${header}*\n\n`;
    }
    
    message += `${text}\n\n`;
    
    // Crear botones numerados del 1 al 3
    limitedButtons.forEach((button, index) => {
      const number = index + 1;
      message += `${number}️⃣ ${button}\n`;
    });
    
    return {
      text: message,
      buttons: limitedButtons.map((button, index) => ({
        id: `btn_${index + 1}`,
        text: button,
        number: index + 1
      }))
    };
  }

  // Mensajes del bot (simplificados y más directos)
  getMessages() {
    return {
      welcome: {
        es: `🏠 ¡Hola! Soy el asistente virtual de Deutsche Glasfaser

📡 Tu servicio de Internet por fibra óptica está listo para ser instalado.

¿Qué te gustaría hacer?`,
        en: `🏠 Hello! I'm Deutsche Glasfaser's virtual assistant

📡 Your fiber optic Internet service is ready to be installed.

What would you like to do?`,
        de: `🏠 Hallo! Ich bin der virtuelle Assistent von Deutsche Glasfaser

📡 Ihr Glasfaser-Internetdienst ist bereit für die Installation.

Was möchten Sie tun?`
      },
      scheduleOptions: {
        es: `📅 Perfecto, vamos a agendar tu instalación.

¿Qué prefieres?`,
        en: `📅 Perfect, let's schedule your installation.

What do you prefer?`,
        de: `📅 Perfekt, lassen Sie uns Ihre Installation planen.

Was bevorzugen Sie?`
      },
      timeSlots: {
        es: `🗓️ Estos son los horarios disponibles:

Selecciona tu horario preferido:`,
        en: `🗓️ These are the available times:

Select your preferred time:`,
        de: `🗓️ Das sind die verfügbaren Zeiten:

Wählen Sie Ihre bevorzugte Zeit:`
      },
      confirmation: {
        es: `✅ Has seleccionado: {slot}

¿Confirmas esta cita?`,
        en: `✅ You have selected: {slot}

Do you confirm this appointment?`,
        de: `✅ Sie haben ausgewählt: {slot}

Bestätigen Sie diesen Termin?`
      },
      finalConfirmation: {
        es: `🎉 ¡Cita confirmada exitosamente!

📋 Código: {code}
📅 Fecha: {slot}
👨‍🔧 Técnico: {technician}

¡Perfecto! Tu instalación está programada.`,
        en: `🎉 Appointment confirmed successfully!

📋 Code: {code}
📅 Date: {slot}
👨‍🔧 Technician: {technician}

Perfect! Your installation is scheduled.`,
        de: `🎉 Termin erfolgreich bestätigt!

📋 Code: {code}
📅 Datum: {slot}
👨‍🔧 Techniker: {technician}

Perfekt! Ihre Installation ist geplant.`
      }
    };
  }

  // Obtener mensaje en idioma específico
  getMessage(chatId, messageKey, replacements = {}) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const messages = this.getMessages();
    let message = messages[messageKey][userLanguage];
    
    Object.keys(replacements).forEach(key => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
    });
    
    return message;
  }

  // Generar horarios disponibles
  generateTimeSlots(language = 'es') {
    const today = moment();
    const slots = [];
    
    // Mañana
    const tomorrow = today.clone().add(1, 'day');
    const tomorrowFormatted = this.formatDateByLanguage(tomorrow, language);
    slots.push({
      id: 1,
      date: tomorrowFormatted,
      time: '09:00 - 11:00',
      technician: 'Klaus Mueller',
      full: `${tomorrowFormatted}, 09:00 - 11:00`
    });

    // Pasado mañana - mañana
    const dayAfter = today.clone().add(2, 'days');
    const dayAfterFormatted = this.formatDateByLanguage(dayAfter, language);
    slots.push({
      id: 2,
      date: dayAfterFormatted,
      time: '14:00 - 16:00',
      technician: 'Maria Rodriguez',
      full: `${dayAfterFormatted}, 14:00 - 16:00`
    });

    // Día siguiente - tarde
    const thirdDay = today.clone().add(3, 'days');
    const thirdDayFormatted = this.formatDateByLanguage(thirdDay, language);
    slots.push({
      id: 3,
      date: thirdDayFormatted,
      time: '10:00 - 12:00',
      technician: 'Stefan Weber',
      full: `${thirdDayFormatted}, 10:00 - 12:00`
    });

    return slots;
  }

  // Formatear fecha según idioma
  formatDateByLanguage(momentDate, language = 'es') {
    const originalLocale = moment.locale();
    
    try {
      const localeMap = { 'es': 'es', 'en': 'en', 'de': 'de' };
      moment.locale(localeMap[language] || 'es');
      
      switch (language) {
        case 'es':
          return momentDate.format('dddd D [de] MMMM');
        case 'en':
          return momentDate.format('dddd, MMMM D');
        case 'de':
          return momentDate.format('dddd, D. MMMM');
        default:
          return momentDate.format('dddd D [de] MMMM');
      }
    } finally {
      moment.locale(originalLocale);
    }
  }

  // Iniciar conversación simulada
  async startSimulation(clientId = 'demo_client') {
    this.isSimulating = true;
    const chatId = `${clientId}@simulation`;
    
    // Establecer idioma por defecto
    this.userLanguages.set(chatId, 'es');
    
    // Enviar mensaje de bienvenida
    const welcomeMessage = this.getMessage(chatId, 'welcome');
    const welcomeButtons = this.createButtonMessage(welcomeMessage, [
      'Agendar instalación 📅',
      'Ver información ℹ️',
      'Hablar con humano 👨‍💼'
    ], 'Deutsche Glasfaser');

    await this.sendSimulatedMessage(chatId, welcomeButtons, 'bot');
    
    this.conversationStates.set(chatId, { 
      state: 'welcome',
      step: 'initial'
    });

    return chatId;
  }

  // Manejar respuesta del usuario
  async handleUserResponse(chatId, buttonNumber, responseText) {
    const currentState = this.conversationStates.get(chatId) || { state: 'welcome' };
    
    // Registrar respuesta del usuario
    await this.sendSimulatedMessage(chatId, {
      text: responseText,
      buttons: []
    }, 'user');

    switch (currentState.state) {
      case 'welcome':
        await this.handleWelcomeResponse(chatId, buttonNumber);
        break;
      case 'schedule_options':
        await this.handleScheduleResponse(chatId, buttonNumber);
        break;
      case 'time_selection':
        await this.handleTimeSelection(chatId, buttonNumber, currentState);
        break;
      case 'confirmation':
        await this.handleConfirmationResponse(chatId, buttonNumber, currentState);
        break;
      default:
        await this.startSimulation(chatId.replace('@simulation', ''));
    }
  }

  // Manejar respuesta de bienvenida
  async handleWelcomeResponse(chatId, buttonNumber) {
    if (buttonNumber === 1) {
      // Agendar instalación
      const scheduleMessage = this.getMessage(chatId, 'scheduleOptions');
      const scheduleButtons = this.createButtonMessage(scheduleMessage, [
        'Ver horarios disponibles 🗓️',
        'Reagendar más tarde ⏰',
        'Cancelar proceso ❌'
      ], 'Agendamiento');

      await this.sendSimulatedMessage(chatId, scheduleButtons, 'bot');
      
      this.conversationStates.set(chatId, { 
        state: 'schedule_options'
      });
    } else if (buttonNumber === 2) {
      // Ver información
      const infoMessage = {
        text: `📋 *Información del Servicio*

🌐 Fibra óptica de alta velocidad
⚡ Hasta 1000 Mbps
🏠 Instalación profesional incluida
📞 Soporte técnico 24/7

¿Qué más necesitas?`,
        buttons: [
          { id: 'btn_1', text: 'Agendar ahora 📅', number: 1 },
          { id: 'btn_2', text: 'Más información ℹ️', number: 2 },
          { id: 'btn_3', text: 'Volver al inicio 🏠', number: 3 }
        ]
      };

      await this.sendSimulatedMessage(chatId, infoMessage, 'bot');
    } else {
      // Hablar con humano
      const humanMessage = {
        text: `👨‍💼 *Contacto Humano*

Un representante te contactará pronto.

📞 También puedes llamar: +49 2861 8919-0
📧 Email: service@deutsche-glasfaser.de
🕒 Horario: Lunes a Viernes 8:00-18:00

¿Mientras tanto, quieres agendar tu instalación?`,
        buttons: [
          { id: 'btn_1', text: 'Sí, agendar ahora ✅', number: 1 },
          { id: 'btn_2', text: 'No, esperar llamada ⏳', number: 2 },
          { id: 'btn_3', text: 'Volver al inicio 🏠', number: 3 }
        ]
      };

      await this.sendSimulatedMessage(chatId, humanMessage, 'bot');
    }
  }

  // Manejar respuesta de agendamiento
  async handleScheduleResponse(chatId, buttonNumber) {
    if (buttonNumber === 1) {
      // Ver horarios disponibles
      const timeSlots = this.generateTimeSlots(this.userLanguages.get(chatId));
      const slotsMessage = this.getMessage(chatId, 'timeSlots');
      
      const slotButtons = timeSlots.map(slot => 
        `${slot.date} ${slot.time}`
      );

      const timeMessage = this.createButtonMessage(slotsMessage, slotButtons, 'Horarios Disponibles');

      await this.sendSimulatedMessage(chatId, timeMessage, 'bot');
      
      this.conversationStates.set(chatId, { 
        state: 'time_selection',
        timeSlots: timeSlots
      });
    } else if (buttonNumber === 2) {
      // Reagendar más tarde
      const laterMessage = {
        text: `⏰ *Reagendar Más Tarde*

Entendido. Puedes contactarnos cuando estés listo.

📱 Este chat estará disponible 24/7
🔄 El proceso de agendamiento se mantiene guardado

¿Hay algo más en lo que pueda ayudarte?`,
        buttons: [
          { id: 'btn_1', text: 'Ver información 📋', number: 1 },
          { id: 'btn_2', text: 'Hablar con humano 👨‍💼', number: 2 },
          { id: 'btn_3', text: 'Finalizar chat ✅', number: 3 }
        ]
      };

      await this.sendSimulatedMessage(chatId, laterMessage, 'bot');
    } else {
      // Cancelar proceso
      const cancelMessage = {
        text: `❌ *Proceso Cancelado*

Tu agendamiento ha sido cancelado.

Si cambias de opinión, simplemente escribe y podremos comenzar de nuevo.

¡Gracias por contactarnos!`,
        buttons: [
          { id: 'btn_1', text: 'Comenzar de nuevo 🔄', number: 1 },
          { id: 'btn_2', text: 'Hablar con humano 👨‍💼', number: 2 },
          { id: 'btn_3', text: 'Finalizar ✅', number: 3 }
        ]
      };

      await this.sendSimulatedMessage(chatId, cancelMessage, 'bot');
    }
  }

  // Manejar selección de horario
  async handleTimeSelection(chatId, buttonNumber, currentState) {
    if (buttonNumber >= 1 && buttonNumber <= 3 && currentState.timeSlots) {
      const selectedSlot = currentState.timeSlots[buttonNumber - 1];
      const confirmMessage = this.getMessage(chatId, 'confirmation', { slot: selectedSlot.full });
      
      const confirmButtons = this.createButtonMessage(confirmMessage, [
        'Sí, confirmar ✅',
        'Elegir otro horario 🔄',
        'Cancelar ❌'
      ], 'Confirmación');

      await this.sendSimulatedMessage(chatId, confirmButtons, 'bot');
      
      this.conversationStates.set(chatId, { 
        state: 'confirmation',
        selectedSlot: selectedSlot
      });
    }
  }

  // Manejar confirmación
  async handleConfirmationResponse(chatId, buttonNumber, currentState) {
    if (buttonNumber === 1) {
      // Confirmar cita
      const confirmationCode = this.generateConfirmationCode();
      const finalMessage = this.getMessage(chatId, 'finalConfirmation', {
        code: confirmationCode,
        slot: currentState.selectedSlot.full,
        technician: currentState.selectedSlot.technician
      });

      const finalButtons = this.createButtonMessage(finalMessage, [
        'Agendar otra cita 📅',
        'Ver detalles 📋',
        'Finalizar ✅'
      ], '¡Cita Confirmada!');

      await this.sendSimulatedMessage(chatId, finalButtons, 'bot');

      // Guardar cita confirmada
      this.pendingAppointments.set(chatId, {
        slot: currentState.selectedSlot,
        confirmed: true,
        confirmationCode: confirmationCode,
        timestamp: Date.now()
      });

      // Emitir evento
      this.emit('appointmentConfirmed', {
        chatId: chatId,
        slot: currentState.selectedSlot,
        confirmationCode: confirmationCode,
        timestamp: Date.now()
      });

      this.conversationStates.set(chatId, { 
        state: 'completed',
        appointment: currentState.selectedSlot
      });

    } else if (buttonNumber === 2) {
      // Elegir otro horario
      const timeSlots = this.generateTimeSlots(this.userLanguages.get(chatId));
      const slotsMessage = this.getMessage(chatId, 'timeSlots');
      
      const slotButtons = timeSlots.map(slot => 
        `${slot.date} ${slot.time}`
      );

      const timeMessage = this.createButtonMessage(slotsMessage, slotButtons, 'Horarios Disponibles');

      await this.sendSimulatedMessage(chatId, timeMessage, 'bot');
      
      this.conversationStates.set(chatId, { 
        state: 'time_selection',
        timeSlots: timeSlots
      });
    } else {
      // Cancelar
      await this.handleWelcomeResponse(chatId, 3);
    }
  }

  // Enviar mensaje simulado
  async sendSimulatedMessage(chatId, messageData, type = 'bot') {
    const messageInfo = {
      chatId: chatId,
      message: messageData.text,
      buttons: messageData.buttons || [],
      direction: type === 'bot' ? 'sent' : 'received',
      timestamp: Date.now(),
      type: type
    };

    // Guardar en el gestor de conversaciones
    this.conversationsManager.addMessage(chatId, messageData.text, type === 'bot' ? 'sent' : 'received');

    // Emitir evento para la interfaz web
    this.emit('newMessage', messageInfo);

    return messageInfo;
  }

  // Generar código de confirmación
  generateConfirmationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Métodos de compatibilidad con la interfaz original
  getConversations() {
    return this.conversationsManager.getAllConversations();
  }

  getConversation(chatId) {
    return this.conversationsManager.getConversation(chatId);
  }

  getConversationsStats() {
    return this.conversationsManager.getStatistics();
  }

  getStatus() {
    return {
      isReady: this.isSimulating,
      pendingAppointments: this.pendingAppointments.size,
      conversationStates: this.conversationStates.size,
      totalConversations: this.conversationsManager.conversations.size,
      simulationMode: true,
      uptime: process.uptime()
    };
  }

  // Método para inicializar (compatibilidad)
  async initialize() {
    console.log('🤖 Inicializando Bot Simulado...');
    this.isSimulating = true;
    console.log('✅ Bot Simulado inicializado');
    return true;
  }

  // Método para destruir (compatibilidad)
  async destroy() {
    this.isSimulating = false;
    console.log('🔌 Bot Simulado desconectado');
  }

  // Simulación de envío de solicitud (compatibilidad)
  async sendAppointmentRequest(client) {
    console.log(`📞 Simulando solicitud a ${client.name} (${client.phone})`);
    const chatId = await this.startSimulation(`client_${client.phone}`);
    return true;
  }
}

module.exports = SimulatedChatBot; 