/**
 * Gestor de Conversaciones - Manejo avanzado del estado de las conversaciones
 * Basado en el patrón State Machine para robustez empresarial
 */

const EventEmitter = require('events');
const moment = require('moment-timezone');

class ConversationsManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.sessions = new Map(); // sesiones activas
    this.conversationHistory = new Map(); // historial persistente
    this.stateHandlers = new Map();
    this.setupStateHandlers();
  }

  /**
   * Configurar manejadores de estado para el flujo de conversación
   */
  setupStateHandlers() {
    this.stateHandlers.set('INIT', this.handleInit.bind(this));
    this.stateHandlers.set('LANGUAGE_SELECTION', this.handleLanguageSelection.bind(this));
    this.stateHandlers.set('CONSENT', this.handleConsent.bind(this));
    this.stateHandlers.set('SLOT_SELECTION', this.handleSlotSelection.bind(this));
    this.stateHandlers.set('CONFIRMATION', this.handleConfirmation.bind(this));
    this.stateHandlers.set('REMINDER_SETUP', this.handleReminderSetup.bind(this));
    this.stateHandlers.set('MANAGEMENT', this.handleManagement.bind(this));
    this.stateHandlers.set('COMPLETED', this.handleCompleted.bind(this));
    this.stateHandlers.set('ERROR', this.handleError.bind(this));
  }

  /**
   * Obtener o crear sesión de conversación
   */
  getSession(sessionId, createIfNotExists = true) {
    if (!this.sessions.has(sessionId) && createIfNotExists) {
      const session = {
        id: sessionId,
        state: 'INIT',
        language: this.config.bot.defaultLanguage,
        startTime: new Date(),
        lastActivity: new Date(),
        context: {},
        messageHistory: [],
        retryCount: 0,
        completed: false
      };
      this.sessions.set(sessionId, session);
      this.emit('sessionCreated', session);
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Procesar mensaje entrante
   */
  async processMessage(sessionId, message, metadata = {}) {
    try {
      const session = this.getSession(sessionId);
      session.lastActivity = new Date();
      
      // Manejar comando especial /start
      if (message === '/start' || session.state === 'INIT') {
        const response = await this.handleInit(session, message, metadata);
        
        // Registrar respuesta en historial
        if (response) {
          session.messageHistory.push({
            timestamp: new Date(),
            type: 'bot',
            content: response.message || response.bot,
            metadata: { state: session.state, ...response.metadata }
          });
        }
        
        this.emit('messageProcessed', session, message, response);
        return response;
      }
      
      // Registrar mensaje en historial
      session.messageHistory.push({
        timestamp: new Date(),
        type: 'user',
        content: message,
        metadata
      });

      // Validar timeout de sesión
      if (this.isSessionExpired(session)) {
        return this.handleSessionTimeout(session);
      }

      // Obtener manejador de estado actual
      const stateHandler = this.stateHandlers.get(session.state);
      if (!stateHandler) {
        throw new Error(`No handler found for state: ${session.state}`);
      }

      // Procesar mensaje según estado actual
      const response = await stateHandler(session, message, metadata);
      
      // Registrar respuesta en historial
      if (response) {
        session.messageHistory.push({
          timestamp: new Date(),
          type: 'bot',
          content: response.message || response.bot,
          metadata: { state: session.state, ...response.metadata }
        });
      }

      this.emit('messageProcessed', session, message, response);
      return response;

    } catch (error) {
      this.emit('error', error, sessionId);
      return this.handleError(this.getSession(sessionId), error);
    }
  }

  /**
   * Manejadores de estado específicos
   */

  async handleInit(session, message, metadata) {
    session.state = 'LANGUAGE_SELECTION';
    
    return {
      bot: this.getLocalizedMessage('welcome', session.language),
      quick: ['Español', 'Deutsch', 'English'],
      state: 'LANGUAGE_SELECTION'
    };
  }

  async handleLanguageSelection(session, message, metadata) {
    const languageMap = {
      'Español': 'es',
      'Deutsch': 'de', 
      'English': 'en'
    };

    if (languageMap[message]) {
      session.language = languageMap[message];
      session.state = 'CONSENT';
      
      return {
        bot: this.getLocalizedMessage('consent', session.language),
        quick: this.getLocalizedQuickReplies('consent', session.language),
        state: 'CONSENT'
      };
    }

    return {
      bot: this.getLocalizedMessage('language_error', session.language),
      quick: ['Español', 'Deutsch', 'English'],
      state: 'LANGUAGE_SELECTION'
    };
  }

  async handleConsent(session, message, metadata) {
    if (message.includes('ACEPTO') || message.includes('JA') || message.includes('YES')) {
      session.state = 'SLOT_SELECTION';
      session.context.consented = true;
      
      const availableSlots = this.generateAvailableSlots();
      session.context.availableSlots = availableSlots;
      
      return {
        bot: this.getLocalizedMessage('choose_slot', session.language),
        quick: availableSlots.map(slot => this.formatSlotForDisplay(slot, session.language)),
        state: 'SLOT_SELECTION'
      };
    }

    if (message.startsWith('/borrar') || message.startsWith('/daten_loeschen') || message.startsWith('/delete')) {
      return this.handleDataDeletion(session);
    }

    return {
      bot: this.getLocalizedMessage('consent_required', session.language),
      quick: this.getLocalizedQuickReplies('consent', session.language),
      state: 'CONSENT'
    };
  }

  async handleSlotSelection(session, message, metadata) {
    const selectedSlot = this.findSlotByDisplay(message, session.context.availableSlots, session.language);
    
    if (selectedSlot) {
      session.context.selectedSlot = selectedSlot;
      session.state = 'CONFIRMATION';
      
      return {
        bot: this.formatConfirmationMessage(selectedSlot, session.language),
        quick: this.getLocalizedQuickReplies('confirmation', session.language),
        state: 'CONFIRMATION'
      };
    }

    return {
      bot: this.getLocalizedMessage('invalid_slot', session.language),
      quick: session.context.availableSlots.map(slot => this.formatSlotForDisplay(slot, session.language)),
      state: 'SLOT_SELECTION'
    };
  }

  async handleConfirmation(session, message, metadata) {
    if (this.isPositiveResponse(message, session.language)) {
      session.context.confirmed = true;
      session.state = 'REMINDER_SETUP';
      
      // Generar ID de cita y asignar técnico
      const appointmentId = this.generateAppointmentId();
      const assignedTechnician = this.assignTechnician(session.context.selectedSlot);
      
      session.context.appointmentId = appointmentId;
      session.context.technician = assignedTechnician;
      
      // Emitir evento para persistencia
      this.emit('appointmentCreated', {
        id: appointmentId,
        sessionId: session.id,
        slot: session.context.selectedSlot,
        technician: assignedTechnician,
        language: session.language,
        timestamp: new Date()
      });
      
      return {
        bot: this.formatAppointmentConfirmation(session),
        quick: this.getLocalizedQuickReplies('reminder', session.language),
        state: 'REMINDER_SETUP'
      };
    }

    if (this.isNegativeResponse(message, session.language)) {
      session.state = 'SLOT_SELECTION';
      
      return {
        bot: this.getLocalizedMessage('select_different_slot', session.language),
        quick: session.context.availableSlots.map(slot => this.formatSlotForDisplay(slot, session.language)),
        state: 'SLOT_SELECTION'
      };
    }

    return {
      bot: this.getLocalizedMessage('confirmation_required', session.language),
      quick: this.getLocalizedQuickReplies('confirmation', session.language),
      state: 'CONFIRMATION'
    };
  }

  async handleReminderSetup(session, message, metadata) {
    const wantsReminder = this.isPositiveResponse(message, session.language);
    session.context.reminderEnabled = wantsReminder;
    session.state = 'MANAGEMENT';

    if (wantsReminder) {
      this.emit('reminderScheduled', {
        appointmentId: session.context.appointmentId,
        sessionId: session.id,
        slot: session.context.selectedSlot,
        language: session.language
      });
    }

    return {
      bot: this.getLocalizedMessage(wantsReminder ? 'reminder_set' : 'no_reminder', session.language) +
           '\\n\\n' + this.getLocalizedMessage('management_options', session.language),
      quick: this.getLocalizedQuickReplies('management', session.language),
      state: 'MANAGEMENT'
    };
  }

  async handleManagement(session, message, metadata) {
    const action = this.parseManagementAction(message, session.language);
    
    switch (action) {
      case 'reschedule':
        return this.handleReschedule(session);
      case 'cancel':
        return this.handleCancellation(session);
      case 'status':
        return this.handleStatusInquiry(session);
      case 'complete':
        session.state = 'COMPLETED';
        session.completed = true;
        return this.handleCompleted(session, message, metadata);
      default:
        return {
          bot: this.getLocalizedMessage('management_help', session.language),
          quick: this.getLocalizedQuickReplies('management', session.language),
          state: 'MANAGEMENT'
        };
    }
  }

  async handleCompleted(session, message, metadata) {
    this.emit('sessionCompleted', session);
    return {
      bot: this.getLocalizedMessage('session_complete', session.language),
      state: 'COMPLETED'
    };
  }

  async handleError(session, error) {
    session.retryCount = (session.retryCount || 0) + 1;
    
    if (session.retryCount >= this.config.bot.maxRetries) {
      session.state = 'ERROR';
      this.emit('sessionFailed', session, error);
      
      return {
        bot: this.getLocalizedMessage('max_retries_exceeded', session.language),
        state: 'ERROR'
      };
    }

    return {
      bot: this.getLocalizedMessage('error_occurred', session.language),
      quick: this.getLocalizedQuickReplies('error_recovery', session.language),
      state: session.state // Mantener estado actual para reintentar
    };
  }

  /**
   * Métodos auxiliares
   */

  generateAvailableSlots() {
    const slots = [];
    const now = moment().tz(this.config.appointments.timezone);
    const maxDate = now.clone().add(this.config.appointments.advanceBookingDays, 'days');
    
    let current = now.clone().add(this.config.appointments.minAdvanceHours, 'hours');
    
    while (current.isBefore(maxDate)) {
      const dayOfWeek = current.day();
      const availableTimes = this.config.appointments.availableSlots[dayOfWeek];
      
      if (availableTimes) {
        availableTimes.forEach(timeStr => {
          const [hour, minute] = timeStr.split(':').map(Number);
          const slotTime = current.clone().hour(hour).minute(minute).second(0);
          
          if (slotTime.isAfter(now.clone().add(this.config.appointments.minAdvanceHours, 'hours'))) {
            slots.push({
              id: this.generateSlotId(),
              start: slotTime.toISOString(),
              end: slotTime.clone().add(this.config.appointments.slotDuration, 'minutes').toISOString(),
              available: true
            });
          }
        });
      }
      
      current.add(1, 'day');
    }
    
    return slots.slice(0, 10); // Limitar a 10 opciones
  }

  generateSlotId() {
    return Math.random().toString(36).substr(2, 9);
  }

  generateAppointmentId() {
    const now = moment().tz(this.config.appointments.timezone);
    return `C-${now.format('YYYY-MMDD-HHmm')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  

  assignTechnician(slot) {
    const technicians = Object.keys(this.config.technicians).filter(
      id => this.config.technicians[id].active
    );
    return technicians[Math.floor(Math.random() * technicians.length)];
  }

  formatSlotForDisplay(slot, language) {
    const startMoment = moment(slot.start).tz(this.config.appointments.timezone);
    const endMoment = moment(slot.end).tz(this.config.appointments.timezone);
    
    if (language === 'de') {
      return startMoment.format('ddd DD.MM HH:mm') + '-' + endMoment.format('HH:mm');
    } else {
      return startMoment.format('ddd DD/MM HH:mm') + '-' + endMoment.format('HH:mm');
    }
  }

  isSessionExpired(session) {
    const now = new Date();
    const lastActivity = new Date(session.lastActivity);
    return (now - lastActivity) > this.config.bot.sessionTimeout;
  }

  getLocalizedMessage(key, language) {
    const messages = {
      welcome: {
        es: 'Hola 👋 Tu instalación de fibra está lista. Selecciona tu idioma:',
        de: 'Hallo 👋 Ihre Glasfaser-Installation ist bereit. Bitte wählen Sie Ihre Sprache:',
        en: 'Hello 👋 Your fiber installation is ready. Please select your language:'
      },
      consent: {
        es: 'Con tu confirmación aceptas nuestro aviso de privacidad (DSGVO). Responde **ACEPTO** o escribe **/borrar_datos**.',
        de: 'Mit Ihrer Bestätigung stimmen Sie unseren DSGVO-Hinweisen zu. Antworten Sie **JA** oder senden Sie **/daten_loeschen**.',
        en: 'By confirming you accept our privacy policy (GDPR). Reply **YES** or write **/delete_data**.'
      }
      // ... más mensajes localizados
    };
    
    return messages[key]?.[language] || messages[key]?.['es'] || `Missing translation: ${key}`;
  }

  getLocalizedQuickReplies(context, language) {
    const quickReplies = {
      consent: {
        es: ['ACEPTO', '/borrar_datos'],
        de: ['JA', '/daten_loeschen'],
        en: ['YES', '/delete_data']
      },
      confirmation: {
        es: ['Sí', 'Otra hora', 'Cancelar'],
        de: ['Ja', 'Andere Zeit', 'Abbrechen'],
        en: ['Yes', 'Other time', 'Cancel']
      },
      reminder: {
        es: ['Sí 🔔', 'No'],
        de: ['Ja 🔔', 'Nein'],
        en: ['Yes 🔔', 'No']
      },
      management: {
        es: ['Cambiar fecha', 'Cambiar hora', 'Cancelar', 'Ver estado'],
        de: ['Datum ändern', 'Uhrzeit ändern', 'Stornieren', 'Status prüfen'],
        en: ['Change date', 'Change time', 'Cancel', 'Check status']
      }
    };
    
    return quickReplies[context]?.[language] || quickReplies[context]?.['es'] || [];
  }

  // Métodos auxiliares adicionales

  handleDataDeletion(session) {
    session.context = {};
    session.messageHistory = [];
    return {
      bot: this.getLocalizedMessage('data_deleted', session.language),
      state: 'COMPLETED'
    };
  }

  findSlotByDisplay(displayText, availableSlots, language) {
    return availableSlots.find(slot => {
      const display = this.formatSlotForDisplay(slot, language);
      return displayText.includes(display) || display.includes(displayText);
    });
  }

  formatConfirmationMessage(slot, language) {
    const slotDisplay = this.formatSlotForDisplay(slot, language);
    return this.getLocalizedMessage('chosen', language) + ': ' + slotDisplay + '\\n' + 
           this.getLocalizedMessage('confirmQ', language);
  }

  formatAppointmentConfirmation(session) {
    const slot = session.context.selectedSlot;
    const lang = session.language;
    const slotDisplay = this.formatSlotForDisplay(slot, lang);
    
    let message = this.getLocalizedMessage('confirmed', lang) + '\\n';
    message += '🗓 ' + slotDisplay + '\\n';
    message += '👨‍🔧 ' + (lang === 'de' ? 'Techniker' : 'Técnico') + ': ' + session.context.technician + '\\n';
    message += '🆔 ID: ' + session.context.appointmentId;
    
    return message;
  }

  isPositiveResponse(message, language) {
    const positiveWords = {
      es: ['sí', 'si', 'yes', 'acepto', 'confirmo'],
      de: ['ja', 'yes', 'bestätigen'],
      en: ['yes', 'confirm', 'accept']
    };
    
    const words = positiveWords[language] || positiveWords.es;
    return words.some(word => message.toLowerCase().includes(word.toLowerCase()));
  }

  isNegativeResponse(message, language) {
    const negativeWords = {
      es: ['no', 'cancelar', 'rechazar'],
      de: ['nein', 'abbrechen'],
      en: ['no', 'cancel', 'reject']
    };
    
    const words = negativeWords[language] || negativeWords.es;
    return words.some(word => message.toLowerCase().includes(word.toLowerCase()));
  }

  parseManagementAction(message, language) {
    const actions = {
      es: {
        reschedule: ['cambiar', 'reprogramar', 'fecha', 'hora'],
        cancel: ['cancelar', 'eliminar'],
        status: ['estado', 'ver', 'consultar'],
        complete: ['completar', 'finalizar', 'terminar']
      },
      de: {
        reschedule: ['ändern', 'datum', 'uhrzeit'],
        cancel: ['stornieren', 'abbrechen'],
        status: ['status', 'prüfen'],
        complete: ['beenden', 'fertig']
      },
      en: {
        reschedule: ['change', 'reschedule', 'date', 'time'],
        cancel: ['cancel', 'delete'],
        status: ['status', 'check'],
        complete: ['complete', 'finish']
      }
    };

    const langActions = actions[language] || actions.es;
    const msgLower = message.toLowerCase();
    
    for (const [action, keywords] of Object.entries(langActions)) {
      if (keywords.some(keyword => msgLower.includes(keyword))) {
        return action;
      }
    }
    
    return null;
  }

  handleReschedule(session) {
    return {
      bot: this.getLocalizedMessage('reschedule_options', session.language),
      quick: this.getLocalizedQuickReplies('reschedule', session.language),
      state: 'MANAGEMENT'
    };
  }

  handleCancellation(session) {
    return {
      bot: this.getLocalizedMessage('cancel_confirm', session.language),
      quick: this.getLocalizedQuickReplies('cancel_confirm', session.language),
      state: 'MANAGEMENT'
    };
  }

  handleStatusInquiry(session) {
    const appointment = session.context.appointmentId;
    return {
      bot: this.getLocalizedMessage('status_info', session.language) + '\\n' +
           '📋 ID: ' + appointment + '\\n' +
           '✅ ' + this.getLocalizedMessage('confirmed', session.language),
      state: 'MANAGEMENT'
    };
  }

  handleSessionTimeout(session) {
    return {
      bot: this.getLocalizedMessage('session_timeout', session.language),
      state: 'COMPLETED'
    };
  }

  /**
   * Limpiar sesiones expiradas
   */
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions) {
      if (this.isSessionExpired(session)) {
        this.emit('sessionExpired', session);
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Obtener estadísticas de sesiones
   */
  getStats() {
    const activeSessions = Array.from(this.sessions.values());
    return {
      active: activeSessions.length,
      completed: activeSessions.filter(s => s.completed).length,
      byState: activeSessions.reduce((acc, s) => {
        acc[s.state] = (acc[s.state] || 0) + 1;
        return acc;
      }, {}),
      byLanguage: activeSessions.reduce((acc, s) => {
        acc[s.language] = (acc[s.language] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = ConversationsManager;
