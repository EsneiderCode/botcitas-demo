const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');
const moment = require('moment');
const { EventEmitter } = require('events');
const ConversationsManager = require('./conversationsManager');

// Configurar locales para moment
require('moment/locale/es');
require('moment/locale/de');

class WhatsAppBot extends EventEmitter {
  constructor() {
    super();
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: config.whatsapp.sessionName
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.pendingAppointments = new Map(); // Almacenar citas pendientes
    this.conversationStates = new Map(); // Estados de conversación
    this.appointmentReminders = new Map(); // Recordatorios de citas
    this.userLanguages = new Map(); // Idiomas seleccionados por usuario
    this.conversationsManager = new ConversationsManager(); // Gestor de conversaciones
    this.setupEventHandlers();
  }

  // Crear mensaje simple con opciones numeradas
  createOptionsMessage(text, options, header = '', footer = '') {
    let message = '';
    
    // Agregar header si existe
    if (header) {
      message += `*${header}*\n\n`;
    }
    
    // Agregar texto principal
    message += `${text}\n\n`;
    
    // Crear opciones numeradas con números simples para evitar problemas de encoding
    options.forEach((option, index) => {
      const number = index + 1;
      message += `${number}. ${option}\n`;
    });
    
    // Agregar footer si existe
    if (footer) {
      message += `\n\n👉 ${footer}`;
    }
    
    return message;
  }

  // Obtener emoji de número
  getNumberEmoji(number) {
    const numberEmojis = {
      1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣',
      6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣', 10: '🔟'
    };
    return numberEmojis[number] || `${number}️⃣`;
  }

  // Crear mensaje de confirmación con opciones numeradas
  createConfirmationMessage(text, options = {}) {
    const { 
      yesText = 'Sí, confirmo',
      noText = 'No, cambiar',
      cancelText = 'Cancelar',
      header = '',
      footer = ''
    } = options;

    const optionsList = [yesText, noText, cancelText];

    return this.createOptionsMessage(text, optionsList, header, footer);
  }



  // Mensajes multiidioma
  getMessages() {
    return {
      languageSelection: {
        es: `🌐 ¡Hola {name}! Selecciona tu idioma preferido:

1️⃣ Español 🇪🇸
2️⃣ English 🇺🇸  
3️⃣ Deutsch 🇩🇪

👉 Escribe solo el número (1, 2 o 3)`,
        en: `🌐 Hello {name}! Select your preferred language:

1️⃣ Español 🇪🇸
2️⃣ English 🇺🇸
3️⃣ Deutsch 🇩🇪

👉 Write only the number (1, 2 or 3)`,
        de: `🌐 Hallo {name}! Wählen Sie Ihre bevorzugte Sprache:

1️⃣ Español 🇪🇸
2️⃣ English 🇺🇸
3️⃣ Deutsch 🇩🇪

👉 Schreiben Sie nur die Nummer (1, 2 oder 3)`
      },
      initial: {
        es: `📡 ¡Hola!
Tu servicio de Internet por fibra óptica está listo para ser instalado.

🛠 Para agendar la visita del técnico:
👉 Escribe solo el número:
1️⃣ para AGENDAR tu cita
(Solo el número, sin texto)`,
        en: `📡 Hello!
Your fiber optic Internet service is ready to be installed.

🛠 To schedule the technician's visit:
👉 Write only the number:
1️⃣ to SCHEDULE your appointment
(Only the number, no text)`,
        de: `📡 Hallo!
Ihr Glasfaser-Internetdienst ist bereit für die Installation.

🛠 Um den Technikerbesuch zu planen:
👉 Schreiben Sie nur die Nummer:
1️⃣ um Ihren Termin zu VEREINBAREN
(Nur die Nummer, kein Text)`
      },
      scheduleOptions: {
        es: `2️⃣ ¿Deseas ver horarios disponibles?
📅 Vamos a programar tu cita.
👉 Responde SOLO con un número:
1️⃣ Ver horarios disponibles
2️⃣ Cancelar proceso
✳️ Ejemplo: escribe solo 1 (no pongas 'ver horarios')`,
        en: `2️⃣ Do you want to see available times?
📅 Let's schedule your appointment.
👉 Reply ONLY with a number:
1️⃣ See available times
2️⃣ Cancel process
✳️ Example: write only 1 (don't write 'see times')`,
        de: `2️⃣ Möchten Sie verfügbare Zeiten sehen?
📅 Lassen Sie uns Ihren Termin planen.
👉 Antworten Sie NUR mit einer Nummer:
1️⃣ Verfügbare Zeiten anzeigen
2️⃣ Vorgang abbrechen
✳️ Beispiel: schreiben Sie nur 1 (nicht 'Zeiten anzeigen')`
      },
      availableSlots: {
        es: `3️⃣ Horarios disponibles para la visita:
📅 Selecciona el horario que prefieras:

{slots}

👉 Escribe solo el número del horario que prefieras`,
        en: `3️⃣ Available times for the visit:
📅 Select your preferred time:

{slots}

👉 Write only the number of your preferred time`,
        de: `3️⃣ Verfügbare Zeiten für den Besuch:
📅 Wählen Sie Ihre bevorzugte Zeit:

{slots}

👉 Schreiben Sie nur die Nummer Ihrer bevorzugten Zeit`
      },
      confirmation: {
        es: `4️⃣ ¿Confirmas este horario?
📅 Has seleccionado: {slot}

👉 Responde con un número:
1️⃣ Sí, confirmo
2️⃣ No, quiero otro horario
3️⃣ Cancelar todo`,
        en: `4️⃣ Do you confirm this time?
📅 You have selected: {slot}

👉 Reply with a number:
1️⃣ Yes, I confirm
2️⃣ No, I want another time
3️⃣ Cancel everything`,
        de: `4️⃣ Bestätigen Sie diese Zeit?
📅 Sie haben ausgewählt: {slot}

👉 Antworten Sie mit einer Nummer:
1️⃣ Ja, ich bestätige
2️⃣ Nein, ich möchte eine andere Zeit
3️⃣ Alles abbrechen`
      },
      reminderQuestion: {
        es: `5️⃣ ¿Deseas recibir un recordatorio?
📅 Tu cita está confirmada para: {slot}

¿Quieres que te recordemos un día antes?
👉 Escribe solo un número:
1️⃣ Sí, recordarme
2️⃣ No, gracias`,
        en: `5️⃣ Do you want to receive a reminder?
📅 Your appointment is confirmed for: {slot}

Do you want us to remind you one day before?
👉 Write only a number:
1️⃣ Yes, remind me
2️⃣ No, thanks`,
        de: `5️⃣ Möchten Sie eine Erinnerung erhalten?
📅 Ihr Termin ist bestätigt für: {slot}

Möchten Sie, dass wir Sie einen Tag vorher erinnern?
👉 Schreiben Sie nur eine Nummer:
1️⃣ Ja, erinnern Sie mich
2️⃣ Nein, danke`
      },
      finalConfirmation: {
        es: `✅ ¡Perfecto! Tu cita está confirmada.

📅 Fecha y hora: {slot}
📍 El técnico llegará en el horario acordado
{reminder}

¡Gracias por elegir nuestros servicios!`,
        en: `✅ Perfect! Your appointment is confirmed.

📅 Date and time: {slot}
📍 The technician will arrive at the agreed time
{reminder}

Thank you for choosing our services!`,
        de: `✅ Perfekt! Ihr Termin ist bestätigt.

📅 Datum und Uhrzeit: {slot}
📍 Der Techniker wird zur vereinbarten Zeit ankommen
{reminder}

Vielen Dank, dass Sie unsere Dienstleistungen gewählt haben!`
      },
      reminderConfirmation: {
        es: `📲 Te enviaremos un recordatorio un día antes.`,
        en: `📲 We will send you a reminder one day before.`,
        de: `📲 Wir senden Ihnen einen Tag vorher eine Erinnerung.`
      },
      noReminder: {
        es: `👍 Entendido, no enviaremos recordatorio.`,
        en: `👍 Understood, we won't send a reminder.`,
        de: `👍 Verstanden, wir senden keine Erinnerung.`
      },
      cancelProcess: {
        es: `❌ Proceso cancelado.
Si cambias de opinión, escribe:
1️⃣ Agendar`,
        en: `❌ Process cancelled.
If you change your mind, write:
1️⃣ Schedule`,
        de: `❌ Vorgang abgebrochen.
Wenn Sie es sich anders überlegen, schreiben Sie:
1️⃣ Terminvereinbarung`
      }
    };
  }

  // Obtener mensaje en el idioma del usuario
  getMessage(chatId, messageKey, replacements = {}) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const messages = this.getMessages();
    let message = messages[messageKey][userLanguage];
    
    // Reemplazar variables en el mensaje
    Object.keys(replacements).forEach(key => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
    });
    
    return message;
  }



  // Formatear fecha según idioma
  formatDateByLanguage(momentDate, language = 'es') {
    // Configurar locale temporal para moment
    const originalLocale = moment.locale();
    
    try {
      // Establecer el idioma correspondiente
      const localeMap = {
        'es': 'es',
        'en': 'en', 
        'de': 'de'
      };
      
      moment.locale(localeMap[language] || 'es');
      
      // Formato según idioma usando moment locales
      switch (language) {
        case 'es':
          return momentDate.format('dddd D [de] MMMM');
        case 'en':
          return momentDate.format('dddd MMMM D');
        case 'de':
          return momentDate.format('dddd, D. MMMM');
        default:
          return momentDate.format('dddd D [de] MMMM');
      }
    } finally {
      // Restaurar locale original
      moment.locale(originalLocale);
    }
  }

  // Generar horarios disponibles dinámicamente según idioma
  generateAvailableSlots(language = 'es') {
    const today = moment();
    const slots = [];
    
    // Miércoles (día 1)
    const wednesday = today.clone().add(1, 'day').startOf('day');
    const wednesdayDate = this.formatDateByLanguage(wednesday, language);
    slots.push(
      { id: 1, date: wednesdayDate, time: '09:00 – 11:00', fullDate: wednesday.clone().hour(9) },
      { id: 2, date: wednesdayDate, time: '13:00 – 15:00', fullDate: wednesday.clone().hour(13) }
    );
    
    // Jueves (día 2)
    const thursday = today.clone().add(2, 'days').startOf('day');
    const thursdayDate = this.formatDateByLanguage(thursday, language);
    slots.push(
      { id: 3, date: thursdayDate, time: '10:00 – 12:00', fullDate: thursday.clone().hour(10) },
      { id: 4, date: thursdayDate, time: '14:00 – 16:00', fullDate: thursday.clone().hour(14) }
    );
    
    // Viernes (día 3) - para reagendar
    const friday = today.clone().add(3, 'days').startOf('day');
    const fridayDate = this.formatDateByLanguage(friday, language);
    slots.push(
      { id: 5, date: fridayDate, time: '08:00 – 10:00', fullDate: friday.clone().hour(8) },
      { id: 6, date: fridayDate, time: '12:00 – 14:00', fullDate: friday.clone().hour(12) }
    );
    
    return slots;
  }

  // Configurar manejadores de eventos
  setupEventHandlers() {
    // Evento cuando se genera el código QR
    this.client.on('qr', (qr) => {
      console.log('📱 Escanea el código QR con WhatsApp:');
      if (config.whatsapp.qrCodeInTerminal) {
        qrcode.generate(qr, { small: true });
      }
      console.log('QR Code:', qr);
    });

    // Evento cuando el cliente está listo
    this.client.on('ready', () => {
      console.log('✅ WhatsApp Bot está listo!');
    });

    // Evento cuando se recibe un mensaje
    this.client.on('message', async (message) => {
      // Guardar mensaje recibido
      this.conversationsManager.addMessage(message.from, message, 'received');
      
      // Emitir evento para notificar nuevos mensajes
      this.emit('newMessage', {
        chatId: message.from,
        message: message.body,
        direction: 'received',
        timestamp: Date.now()
      });
      
      await this.handleMessage(message);
    });

    // Evento de desconexión
    this.client.on('disconnected', (reason) => {
      console.log('❌ WhatsApp desconectado:', reason);
    });
  }

  // Inicializar el bot
  async initialize() {
    try {
      console.log('🚀 Inicializando WhatsApp Bot...');
      await this.client.initialize();
      console.log('✅ WhatsApp Bot inicializado, validando conexión...');
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar WhatsApp Bot:', error);
      throw error;
    }
  }

  // Manejar mensajes recibidos
  async handleMessage(message) {
    try {
      const chatId = message.from;
      const messageBody = message.body.toLowerCase().trim();

      // Ignorar mensajes del bot mismo
      if (message.fromMe) return;

      console.log(`📨 Mensaje recibido de ${chatId}: ${message.body}`);

      // Obtener estado actual de la conversación
      const currentState = this.conversationStates.get(chatId) || { state: 'language_selection' };

      // Manejar según el estado
      switch (currentState.state) {
        case 'language_selection':
          await this.handleLanguageSelection(message, chatId);
          break;
        case 'initial':
          await this.handleInitialMessage(message, chatId);
          break;
        case 'waiting_for_schedule_option':
          await this.handleScheduleOption(message, chatId);
          break;
        case 'waiting_for_time_selection':
          await this.handleTimeSelection(message, chatId);
          break;
        case 'waiting_for_reminder_option':
          await this.handleReminderOption(message, chatId);
          break;
        case 'waiting_for_reminder_response':
          await this.handleReminderResponse(message, chatId);
          break;
        case 'has_appointment':
          await this.handleExistingAppointment(message, chatId);
          break;
        case 'waiting_for_reschedule':
          await this.handleReschedule(message, chatId);
          break;
        default:
          await this.handleLanguageSelection(message, chatId);
      }

    } catch (error) {
      console.error('Error al manejar mensaje:', error);
    }
  }

  // Manejar selección de idioma
  async handleLanguageSelection(message, chatId) {
    const messageBody = message.body.trim();
    
    // Si el usuario ya tiene un idioma seleccionado, ir al flujo inicial
    if (this.userLanguages.has(chatId)) {
      await this.handleInitialMessage(message, chatId);
      return;
    }

    // Manejar selección de idioma
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
        // Idioma no válido, mostrar opciones de nuevo
        await this.sendLanguageSelection(chatId, '');
        return;
    }

    // Guardar idioma seleccionado
    this.userLanguages.set(chatId, selectedLanguage);
    
    // Proceder con el flujo inicial
    await this.sendInitialMessage(chatId);
  }

  // Manejar mensaje inicial
  async handleInitialMessage(message, chatId) {
    const messageBody = message.body.toLowerCase().trim();
    
    // Verificar si el cliente ya tiene una cita
    if (this.pendingAppointments.has(chatId)) {
      const existingAppointment = this.pendingAppointments.get(chatId);
      await this.showExistingAppointment(chatId, existingAppointment);
      return;
    }

    // Verificar si es comando para agendar
    if (messageBody === '1' || messageBody.includes('agendar') || messageBody.includes('schedule') || messageBody.includes('termin')) {
      await this.showScheduleOptions(chatId);
      return;
    }

    // Enviar mensaje inicial con HSM
    await this.sendInitialMessage(chatId);
  }

  // Enviar selección de idioma (solo para casos de error)
  async sendLanguageSelection(chatId, userName = '') {
    const options = [
      'Español 🇪🇸',
      'English 🇺🇸',
      'Deutsch 🇩🇪'
    ];

    const languageMessage = this.createOptionsMessage(
      '🌐 Bitte wählen Sie Ihre bevorzugte Sprache:\n\n(Por favor selecciona tu idioma / Please select your language)',
      options,
      '🔧 Deutsche Glasfaser',
      'Antworten Sie nur mit der Nummer'
    );
    
    await this.sendMessageAndSave(chatId, languageMessage);
    
    this.conversationStates.set(chatId, { state: 'language_selection' });
  }

  // Enviar mensaje inicial (HSM)
  async sendInitialMessage(chatId) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    
    const welcomeTexts = {
      es: '📡 Tu servicio de Internet por fibra óptica está listo para ser instalado.\n\n🛠 Para agendar la visita del técnico, selecciona una opción:',
      en: '📡 Your fiber optic Internet service is ready to be installed.\n\n🛠 To schedule the technician visit, select an option:',
      de: '📡 Ihr Glasfaser-Internetdienst ist bereit für die Installation.\n\n🛠 Um den Technikerbesuch zu planen, wählen Sie eine Option:'
    };

    const buttonTexts = {
      es: ['AGENDAR mi cita 📅'],
      en: ['SCHEDULE my appointment 📅'],
      de: ['TERMIN vereinbaren 📅']
    };

    const footerTexts = {
      es: 'Responde con el número',
      en: 'Reply with the number',
      de: 'Antworten Sie mit der Nummer'
    };

    const initialMessage = this.createOptionsMessage(
      welcomeTexts[userLanguage],
      buttonTexts[userLanguage],
      '🏠 Deutsche Glasfaser',
      footerTexts[userLanguage]
    );

    await this.sendMessageAndSave(chatId, initialMessage);
    
    this.conversationStates.set(chatId, { state: 'waiting_for_schedule_option' });
  }

  // Manejar opción de agendamiento
  async handleScheduleOption(message, chatId) {
    const messageBody = message.body.trim();
    
    if (messageBody === '1') {
      await this.showScheduleOptions(chatId);
    } else {
      await this.sendInitialMessage(chatId);
    }
  }

  // Mostrar opciones de agendamiento
  async showScheduleOptions(chatId) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    
    const headers = {
      es: '⚡ Programar Instalación',
      en: '⚡ Schedule Installation',
      de: '⚡ Installation planen'
    };

    const texts = {
      es: '📅 Vamos a programar tu cita de instalación.',
      en: '📅 Let\'s schedule your installation appointment.',
      de: '📅 Lassen Sie uns Ihren Installationstermin planen.'
    };

    const buttons = {
      es: [
        'Ver horarios disponibles 🗓️',
        'Cancelar proceso ❌'
      ],
      en: [
        'See available times 🗓️',
        'Cancel process ❌'
      ],
      de: [
        'Verfügbare Zeiten anzeigen 🗓️',
        'Vorgang abbrechen ❌'
      ]
    };

    const footers = {
      es: 'Responde con el número',
      en: 'Reply with the number',
      de: 'Antworten Sie mit der Nummer'
    };

    const optionsMessage = this.createOptionsMessage(
      texts[userLanguage],
      buttons[userLanguage],
      headers[userLanguage],
      footers[userLanguage]
    );

    await this.sendMessageAndSave(chatId, optionsMessage);
    
    this.conversationStates.set(chatId, { state: 'waiting_for_time_selection' });
  }

  // Manejar selección de horario
  async handleTimeSelection(message, chatId) {
    const messageBody = message.body.trim();
    
    if (messageBody === '1') {
      await this.showAvailableSlots(chatId);
    } else if (messageBody === '2') {
      await this.cancelProcess(chatId);
    } else {
      await this.showScheduleOptions(chatId);
    }
  }

  // Mostrar horarios disponibles
  async showAvailableSlots(chatId) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const availableSlots = this.generateAvailableSlots(userLanguage);
    
    const headerTexts = {
      es: '📅 Horarios Disponibles',
      en: '📅 Available Times',
      de: '📅 Verfügbare Zeiten'
    };

    const bodyTexts = {
      es: '⏰ Selecciona el horario que mejor te convenga para la instalación:',
      en: '⏰ Select the time that works best for your installation:',
      de: '⏰ Wählen Sie die Zeit, die für Ihre Installation am besten geeignet ist:'
    };

    const footerTexts = {
      es: 'El técnico llegará en el horario seleccionado',
      en: 'The technician will arrive at the selected time',
      de: 'Der Techniker wird zur gewählten Zeit ankommen'
    };

    // Crear lista simple de opciones
    const options = [];
    
    // Convertir slots a opciones simples
    availableSlots.slice(0, 4).forEach((slot) => {
      options.push(`📆 ${slot.date} - 🕐 ${slot.time}`);
    });

    const slotsMessage = this.createOptionsMessage(
      bodyTexts[userLanguage],
      options,
      headerTexts[userLanguage],
      footerTexts[userLanguage]
    );

    await this.sendMessageAndSave(chatId, slotsMessage);
    
    this.conversationStates.set(chatId, { 
      state: 'waiting_for_time_selection',
      availableSlots: availableSlots
    });
  }

  // Manejar selección de horario
  async handleTimeSelection(message, chatId) {
    const messageBody = message.body.trim();
    const slotNumber = parseInt(messageBody);
    const currentState = this.conversationStates.get(chatId);
    
    if (slotNumber >= 1 && slotNumber <= 4 && currentState.availableSlots) {
      const selectedSlot = currentState.availableSlots[slotNumber - 1];
      await this.confirmSelectedSlot(chatId, selectedSlot);
    } else {
      await this.showAvailableSlots(chatId);
    }
  }

  // Confirmar horario seleccionado
  async confirmSelectedSlot(chatId, selectedSlot) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const slotText = `${selectedSlot.date}, ${selectedSlot.time}`;
    
    const headers = {
      es: '🔧 Confirmar Instalación',
      en: '🔧 Confirm Installation',
      de: '🔧 Installation bestätigen'
    };

    const confirmTexts = {
      es: `✅ Has seleccionado:\n📅 *${slotText}*\n\n¿Confirmas esta cita de instalación?`,
      en: `✅ You have selected:\n📅 *${slotText}*\n\nDo you confirm this installation appointment?`,
      de: `✅ Sie haben ausgewählt:\n📅 *${slotText}*\n\nBestätigen Sie diesen Installationstermin?`
    };

    const buttonTexts = {
      es: [
        'Sí, confirmo ✅',
        'No, otro horario 🔄',
        'Cancelar todo ❌'
      ],
      en: [
        'Yes, I confirm ✅',
        'No, another time 🔄',
        'Cancel all ❌'
      ],
      de: [
        'Ja, ich bestätige ✅',
        'Nein, andere Zeit 🔄',
        'Alles abbrechen ❌'
      ]
    };

    const footerTexts = {
      es: 'Responde con el número',
      en: 'Reply with the number',
      de: 'Antworten Sie mit der Nummer'
    };

    const confirmMessage = this.createOptionsMessage(
      confirmTexts[userLanguage],
      buttonTexts[userLanguage],
      headers[userLanguage],
      footerTexts[userLanguage]
    );

    await this.sendMessageAndSave(chatId, confirmMessage);
    
    this.conversationStates.set(chatId, { 
      state: 'waiting_for_reminder_option', 
      selectedSlot: selectedSlot 
    });
  }

  // Manejar opción de recordatorio
  async handleReminderOption(message, chatId) {
    const messageBody = message.body.trim();
    const currentState = this.conversationStates.get(chatId);
    
    if (messageBody === '1') {
      // Confirmar cita
      await this.finalizeAppointment(chatId, currentState.selectedSlot);
    } else if (messageBody === '2') {
      // No, quiero otro horario
      await this.showAvailableSlots(chatId);
    } else if (messageBody === '3') {
      // Cancelar todo
      await this.cancelProcess(chatId);
    } else {
      await this.confirmSelectedSlot(chatId, currentState.selectedSlot);
    }
  }

  // Finalizar cita
  async finalizeAppointment(chatId, selectedSlot) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const slotText = `${selectedSlot.date}, ${selectedSlot.time}`;
    
    const headers = {
      es: '📲 Recordatorio',
      en: '📲 Reminder',
      de: '📲 Erinnerung'
    };

    const reminderTexts = {
      es: `🎉 ¡Excelente!\n\nTu cita está confirmada para:\n📅 *${slotText}*\n\n¿Deseas recibir un recordatorio un día antes?`,
      en: `🎉 Excellent!\n\nYour appointment is confirmed for:\n📅 *${slotText}*\n\nWould you like to receive a reminder one day before?`,
      de: `🎉 Ausgezeichnet!\n\nIhr Termin ist bestätigt für:\n📅 *${slotText}*\n\nMöchten Sie einen Tag vorher eine Erinnerung erhalten?`
    };

    const buttonTexts = {
      es: [
        'Sí, recordarme 🔔',
        'No, gracias 🚫'
      ],
      en: [
        'Yes, remind me 🔔',
        'No, thanks 🚫'
      ],
      de: [
        'Ja, erinnern Sie mich 🔔',
        'Nein, danke 🚫'
      ]
    };

    const footerTexts = {
      es: 'Responde con el número',
      en: 'Reply with the number',
      de: 'Antworten Sie mit der Nummer'
    };

    const finalMessage = this.createOptionsMessage(
      reminderTexts[userLanguage],
      buttonTexts[userLanguage],
      headers[userLanguage],
      footerTexts[userLanguage]
    );

    await this.sendMessageAndSave(chatId, finalMessage);
    
    // Guardar cita
    this.pendingAppointments.set(chatId, {
      slot: selectedSlot,
      confirmed: true,
      reminder: false,
      timestamp: Date.now()
    });
    
    this.conversationStates.set(chatId, { 
      state: 'waiting_for_reminder_response',
      appointment: selectedSlot
    });

    // Emitir evento de cita confirmada
    this.emit('appointmentConfirmed', {
      chatId: chatId,
      slot: selectedSlot,
      timestamp: Date.now()
    });
  }

  // Manejar respuesta de recordatorio
  async handleReminderResponse(message, chatId) {
    const messageBody = message.body.trim();
    const currentState = this.conversationStates.get(chatId);
    
    if (messageBody === '1') {
      // Sí, quiero recordatorio
      await this.setReminder(chatId, currentState.appointment, true);
    } else if (messageBody === '2') {
      // No, gracias
      await this.setReminder(chatId, currentState.appointment, false);
    } else {
              // Respuesta no válida, volver a preguntar
        const slotText = `${currentState.appointment.date}, ${currentState.appointment.time}`;
        const retryMessage = this.getMessage(chatId, 'reminderQuestion', { slot: slotText });
        await this.sendMessageAndSave(chatId, retryMessage);
    }
  }

  // Configurar recordatorio
  async setReminder(chatId, appointment, wantsReminder) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    
    // Actualizar estado de recordatorio
    const existingAppointment = this.pendingAppointments.get(chatId);
    if (existingAppointment) {
      existingAppointment.reminder = wantsReminder;
      this.pendingAppointments.set(chatId, existingAppointment);
    }
    
    const slotText = `${appointment.date}, ${appointment.time}`;
    
    const reminderTexts = {
      es: wantsReminder ? '📲 Te enviaremos un recordatorio un día antes por WhatsApp.' : '👍 Entendido, no enviaremos recordatorio.',
      en: wantsReminder ? '📲 We will send you a reminder one day before via WhatsApp.' : '👍 Understood, we won\'t send a reminder.',
      de: wantsReminder ? '📲 Wir senden Ihnen einen Tag vorher eine Erinnerung über WhatsApp.' : '👍 Verstanden, wir senden keine Erinnerung.'
    };

    const finalTexts = {
      es: `🎉 *¡Tu cita está confirmada!*

📅 *Fecha y hora:* ${slotText}
🏠 *Servicio:* Instalación de fibra óptica
🔧 *Empresa:* Deutsche Glasfaser

${reminderTexts[userLanguage]}

✅ El técnico llegará en el horario acordado para realizar la instalación completa.

¡Gracias por elegir nuestros servicios de fibra óptica! 🚀`,
      en: `🎉 *Your appointment is confirmed!*

📅 *Date and time:* ${slotText}
🏠 *Service:* Fiber optic installation
🔧 *Company:* Deutsche Glasfaser

${reminderTexts[userLanguage]}

✅ The technician will arrive at the agreed time to perform the complete installation.

Thank you for choosing our fiber optic services! 🚀`,
      de: `🎉 *Ihr Termin ist bestätigt!*

📅 *Datum und Uhrzeit:* ${slotText}
🏠 *Service:* Glasfaser-Installation
🔧 *Unternehmen:* Deutsche Glasfaser

${reminderTexts[userLanguage]}

✅ Der Techniker wird zur vereinbarten Zeit ankommen, um die komplette Installation durchzuführen.

Vielen Dank, dass Sie sich für unsere Glasfaserdienste entschieden haben! 🚀`
    };

    await this.sendMessageAndSave(chatId, finalTexts[userLanguage]);
    
    // Cambiar estado a cita confirmada
    this.conversationStates.set(chatId, { 
      state: 'has_appointment',
      appointment: appointment
    });
  }

  // Mostrar cita existente
  async showExistingAppointment(chatId, appointment) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const slotText = `${appointment.slot.date}, ${appointment.slot.time}`;
    
    const headers = {
      es: '📋 Cita Existente',
      en: '📋 Existing Appointment',
      de: '📋 Bestehender Termin'
    };

    const existingTexts = {
      es: `📌 Ya tienes una cita programada:\n\n📅 *${slotText}*\n\n¿Qué te gustaría hacer?`,
      en: `📌 You already have a scheduled appointment:\n\n📅 *${slotText}*\n\nWhat would you like to do?`,
      de: `📌 Sie haben bereits einen geplanten Termin:\n\n📅 *${slotText}*\n\nWas möchten Sie tun?`
    };

    const buttonTexts = {
      es: [
        'Cambiar fecha/hora 🔄',
        'Cancelar cita ❌',
        'Mantener así ✅'
      ],
      en: [
        'Change date/time 🔄',
        'Cancel appointment ❌',
        'Keep as is ✅'
      ],
      de: [
        'Datum/Zeit ändern 🔄',
        'Termin absagen ❌',
        'So beibehalten ✅'
      ]
    };

    const footerTexts = {
      es: 'Responde con el número',
      en: 'Reply with the number',
      de: 'Antworten Sie mit der Nummer'
    };

    const existingMessage = this.createOptionsMessage(
      existingTexts[userLanguage],
      buttonTexts[userLanguage],
      headers[userLanguage],
      footerTexts[userLanguage]
    );

    await this.sendMessageAndSave(chatId, existingMessage);
    
    this.conversationStates.set(chatId, { state: 'has_appointment' });
  }

  // Manejar cita existente
  async handleExistingAppointment(message, chatId) {
    const messageBody = message.body.trim();
    
    if (messageBody === '1') {
      await this.showRescheduleOptions(chatId);
    } else if (messageBody === '2') {
      await this.cancelAppointment(chatId);
    } else if (messageBody === '3') {
      await this.confirmKeepAppointment(chatId);
    } else {
      const appointment = this.pendingAppointments.get(chatId);
      await this.showExistingAppointment(chatId, appointment);
    }
  }

  // Mostrar opciones de reagendamiento
  async showRescheduleOptions(chatId) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const allSlots = this.generateAvailableSlots(userLanguage);
    
    // Obtener slots de viernes (slots 5 y 6)
    const fridaySlots = allSlots.slice(4, 6);
    
    const headerTexts = {
      es: '🔄 Reagendar Cita',
      en: '🔄 Reschedule Appointment',
      de: '🔄 Termin verschieben'
    };

    const bodyTexts = {
      es: '🔁 Selecciona un nuevo horario para tu instalación:',
      en: '🔁 Select a new time for your installation:',
      de: '🔁 Wählen Sie eine neue Zeit für Ihre Installation:'
    };

    const footerTexts = {
      es: 'Responde con el número',
      en: 'Reply with the number',
      de: 'Antworten Sie mit der Nummer'
    };

    const buttons = fridaySlots.map((slot) => `📅 ${slot.date} - 🕐 ${slot.time}`);

    const rescheduleMessage = this.createOptionsMessage(
      bodyTexts[userLanguage],
      buttons,
      headerTexts[userLanguage],
      footerTexts[userLanguage]
    );

    await this.sendMessageAndSave(chatId, rescheduleMessage);
    
    this.conversationStates.set(chatId, { 
      state: 'waiting_for_reschedule',
      rescheduleSlots: fridaySlots
    });
  }

  // Manejar reagendamiento
  async handleReschedule(message, chatId) {
    const messageBody = message.body.trim();
    const slotNumber = parseInt(messageBody);
    const currentState = this.conversationStates.get(chatId);
    
    if (slotNumber >= 1 && slotNumber <= 2 && currentState.rescheduleSlots) {
      const rescheduleSlot = currentState.rescheduleSlots[slotNumber - 1];
      await this.confirmReschedule(chatId, rescheduleSlot);
    } else {
      await this.showRescheduleOptions(chatId);
    }
  }

  // Confirmar reagendamiento
  async confirmReschedule(chatId, newSlot) {
    const userLanguage = this.userLanguages.get(chatId) || 'es';
    const slotText = `${newSlot.date}, ${newSlot.time}`;
    
    const confirmMessages = {
      es: `✅ ¡Tu cita ha sido reagendada!
📅 Nueva fecha y hora: ${slotText}`,
      en: `✅ Your appointment has been rescheduled!
📅 New date and time: ${slotText}`,
      de: `✅ Ihr Termin wurde verschoben!
📅 Neues Datum und Uhrzeit: ${slotText}`
    };

    const confirmMessage = confirmMessages[userLanguage] || confirmMessages.es;
    await this.sendMessageAndSave(chatId, confirmMessage);
    
    // Actualizar cita
    this.pendingAppointments.set(chatId, {
      slot: newSlot,
      confirmed: true,
      reminder: false,
      timestamp: Date.now()
    });
    
    this.conversationStates.set(chatId, { 
      state: 'has_appointment',
      appointment: newSlot
    });

    // Emitir evento de cita reagendada
    this.emit('appointmentRescheduled', {
      chatId: chatId,
      newSlot: newSlot,
      timestamp: Date.now()
    });
  }

  // Cancelar cita
  async cancelAppointment(chatId) {
    const cancelMessage = `8️⃣ Cancelación confirmada
❌ Tu cita fue cancelada.
Cuando quieras agendar de nuevo, solo escribe:
1️⃣ Agendar`;

    await this.sendMessageAndSave(chatId, cancelMessage);
    
    // Remover cita y estado
    this.pendingAppointments.delete(chatId);
    this.conversationStates.delete(chatId);

    // Emitir evento de cita cancelada
    this.emit('appointmentCanceled', {
      chatId: chatId,
      timestamp: Date.now()
    });
  }

  // Confirmar mantener cita
  async confirmKeepAppointment(chatId) {
    const keepMessage = `✅ Perfecto, tu cita se mantiene como está.
¡Nos vemos pronto!`;

    await this.sendMessageAndSave(chatId, keepMessage);
  }

  // Cancelar proceso
  async cancelProcess(chatId) {
    const cancelMessage = this.getMessage(chatId, 'cancelProcess');

    await this.sendMessageAndSave(chatId, cancelMessage);
    
    this.conversationStates.delete(chatId);
  }

  // Enviar solicitud de cita (método original adaptado)
  async sendAppointmentRequest(client) {
    try {
      const phoneNumber = this.formatPhoneNumber(client.phone);
      const chatId = `${phoneNumber}@c.us`;

      console.log(`📞 Enviando solicitud de cita a ${client.name} (${phoneNumber})`);

      // Enviar mensaje directamente sin validaciones complejas
      const success = await this.sendContextAndLanguageSelection(chatId, client.name);
      
      if (success) {
        console.log(`✅ Mensaje enviado exitosamente a ${client.name}`);
        return true;
      } else {
        console.error(`❌ Falló el envío del mensaje a ${client.name}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error al enviar solicitud a ${client.name}:`, error);
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

  // Método alternativo para formatear con código de país específico
  formatPhoneNumberWithCountry(phone, countryCode) {
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Si no empieza con el código de país, agregarlo
    if (!formattedPhone.startsWith(countryCode.toString())) {
      formattedPhone = countryCode + formattedPhone;
    }
    
    return formattedPhone;
  }

  // Método auxiliar para enviar mensaje y guardarlo
  async sendMessageAndSave(chatId, message) {
    try {
      // Verificar que el cliente esté listo con timeout corto
      if (!this.isClientReady()) {
        console.log('⏳ Cliente no está listo, esperando hasta 10 segundos...');
        
        // Esperar hasta 10 segundos máximo, verificando cada segundo
        for (let i = 0; i < 10; i++) {
          await this.delay(1000);
          if (this.isClientReady()) {
            console.log('✅ Cliente listo después de', i + 1, 'segundos');
            break;
          }
        }
        
        // Si después de 10 segundos no está listo, fallar
        if (!this.isClientReady()) {
          console.error('❌ Cliente no está listo después de 10 segundos');
          return false;
        }
      }

      // Validar formato del chatId
      if (!chatId || !chatId.includes('@')) {
        console.error('❌ ChatId inválido:', chatId);
        return false;
      }

      // Intentar enviar el mensaje con reintentos simples
      const maxRetries = 2; // Reducido a 2 intentos
      let lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await this.client.sendMessage(chatId, message);
          
          // Guardar mensaje solo si se envió exitosamente
          this.conversationsManager.addMessage(chatId, message, 'sent');
          
          console.log(`📤 Bot envió mensaje a ${chatId}: ${message.substring(0, 50)}...`);
          
          // Emitir evento para notificar mensajes enviados
          this.emit('newMessage', {
            chatId: chatId,
            message: message,
            direction: 'sent',
            timestamp: Date.now()
          });
          
          return true;

        } catch (error) {
          lastError = error;
          console.log(`⚠️ Intento ${attempt}/${maxRetries} falló:`, error.message);
          
          if (attempt < maxRetries) {
            console.log(`🔄 Reintentando en 2 segundos...`);
            await this.delay(2000); // Delay fijo de 2 segundos
          }
        }
      }

      console.error('❌ Error al enviar mensaje después de', maxRetries, 'intentos:', lastError.message);
      return false;

    } catch (error) {
      console.error('❌ Error crítico al enviar mensaje:', error);
      return false;
    }
  }

  // Verificar si el cliente está listo
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

  // Esperar hasta que el cliente esté listo
  async waitForClientReady(timeout = 30000) {
    const startTime = Date.now();
    let attempts = 0;
    
    while (!this.isClientReady() && (Date.now() - startTime) < timeout) {
      attempts++;
      console.log(`⏳ [${attempts}] Esperando que WhatsApp esté listo...`);
      
      // Log detallado para debugging
      if (this.client) {
        console.log(`   Cliente existe: ✅`);
        console.log(`   PupPage existe: ${this.client.pupPage ? '✅' : '❌'}`);
        console.log(`   Info existe: ${this.client.info ? '✅' : '❌'}`);
        if (this.client.info) {
          console.log(`   WID existe: ${this.client.info.wid ? '✅' : '❌'}`);
        }
      }
      
      await this.delay(2000);
    }
    
    if (!this.isClientReady()) {
      console.log('⚠️ Timeout alcanzado, pero continuando (puede funcionar)...');
      // No lanzar error, solo advertir
      return false;
    }
    
    console.log('✅ WhatsApp está listo para enviar mensajes');
    return true;
  }

  // Método auxiliar para delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obtener conversaciones
  getConversations() {
    return this.conversationsManager.getAllConversations();
  }

  // Obtener conversación específica
  getConversation(chatId) {
    return this.conversationsManager.getConversation(chatId);
  }

  // Obtener estadísticas de conversaciones
  getConversationsStats() {
    return this.conversationsManager.getStatistics();
  }

  // Obtener estado del bot
  getStatus() {
    return {
      isReady: this.isClientReady(),
      clientConnected: this.client && this.client.pupPage ? true : false,
      pendingAppointments: this.pendingAppointments.size,
      conversationStates: this.conversationStates.size,
      totalConversations: this.conversationsManager.conversations.size,
      uptime: process.uptime()
    };
  }

  // Limpiar citas pendientes expiradas (más de 1 hora)
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

  // Cerrar conexión
  async destroy() {
    try {
      await this.client.destroy();
      console.log('🔌 WhatsApp Bot desconectado');
    } catch (error) {
      console.error('Error al cerrar WhatsApp Bot:', error);
    }
  }
}

module.exports = WhatsAppBot; 