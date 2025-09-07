/**
 * Configuración del sistema Bot de Citas CLARITY
 * Copia este archivo como config.js y personaliza los valores
 */

module.exports = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },

  // Configuración de la empresa
  company: {
    name: 'CLARITY',
    fullName: 'Deutsche Glasfaser CLARITY',
    logo: '/assets/clarity-logo.png',
    website: 'https://clarity.de',
    supportEmail: 'soporte@clarity.de',
    supportPhone: '+49 123 456 789'
  },

  // Configuración del bot
  bot: {
    name: 'AssistBot CLARITY',
    version: '2.0.0',
    welcomeMessage: {
      es: 'Hola 👋 Tu instalación de fibra está lista. Selecciona tu idioma:',
      de: 'Hallo 👋 Ihre Glasfaser-Installation ist bereit. Bitte wählen Sie Ihre Sprache:',
      en: 'Hello 👋 Your fiber installation is ready. Please select your language:'
    },
    supportedLanguages: ['es', 'de', 'en'],
    defaultLanguage: 'es',
    sessionTimeout: 1800000, // 30 minutos en milliseconds
    maxRetries: 3
  },

  // Configuración de horarios y citas
  appointments: {
    // Horarios disponibles por día de la semana (0 = domingo, 6 = sábado)
    availableSlots: {
      1: ['09:00', '11:00', '13:00', '15:00', '17:00'], // Lunes
      2: ['09:00', '11:00', '13:00', '15:00', '17:00'], // Martes  
      3: ['09:00', '11:00', '13:00', '15:00', '17:00'], // Miércoles
      4: ['09:00', '11:00', '13:00', '15:00', '17:00'], // Jueves
      5: ['09:00', '11:00', '13:00', '15:00'],         // Viernes
      6: ['09:00', '11:00', '13:00']                   // Sábado
    },
    slotDuration: 120, // Duración en minutos
    advanceBookingDays: 14, // Días de anticipación máxima
    minAdvanceHours: 24, // Horas mínimas de anticipación
    timezone: 'Europe/Berlin',
    reminderHours: [24, 2], // Recordatorios 24h y 2h antes
    
    // Política de cancelación
    cancellationPolicy: {
      es: 'Cancelación sin coste hasta 24 h antes.',
      de: 'Stornierung kostenfrei bis 24h vorher.',
      en: 'Free cancellation up to 24h before.'
    }
  },

  // Configuración de técnicos
  technicians: {
    'CLARITY-01': { name: 'Miguel García', zone: 'PLZ 29xxx', active: true },
    'CLARITY-02': { name: 'Anna Schmidt', zone: 'PLZ 30xxx', active: true },
    'CLARITY-03': { name: 'José Rodriguez', zone: 'PLZ 31xxx', active: true },
    'CLARITY-04': { name: 'Petra Müller', zone: 'PLZ 32xxx', active: true },
    'CLARITY-05': { name: 'Carlos López', zone: 'PLZ 33xxx', active: true },
    'CLARITY-06': { name: 'Hans Weber', zone: 'PLZ 34xxx', active: true },
    'CLARITY-07': { name: 'Sofia Fernández', zone: 'PLZ 29227', active: true }
  },

  // Configuración de datos y persistencia
  data: {
    // Configuración de Excel
    excel: {
      enabled: true,
      filename: './data/appointments.xlsx',
      sheetName: 'Citas',
      backupEnabled: true,
      backupInterval: 3600000 // 1 hora
    },
    
    // Configuración de Google Sheets (opcional)
    googleSheets: {
      enabled: false,
      sheetId: '',
      range: 'A:J',
      credentialsPath: './config/google-credentials.json'
    },

    // Configuración de base de datos (futuro)
    database: {
      enabled: false,
      type: 'postgresql',
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
    }
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filename: './logs/app.log',
    maxSize: '10m',
    maxFiles: 5,
    colorize: process.env.NODE_ENV !== 'production'
  },

  // Configuración de seguridad
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // límite de requests por IP
    },
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdn.socket.io"],
          scriptSrcAttr: ["'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }
  },

  // Configuración de demo y testing
  demo: {
    enabled: true,
    simulateDelay: true,
    delayRange: [500, 2000], // ms
    mockData: {
      appointments: 150,
      technicians: 7,
      satisfaction: 4.6,
      completion: 95
    }
  },

  // Configuración de notificaciones
  notifications: {
    email: {
      enabled: false,
      service: 'gmail',
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD
    },
    sms: {
      enabled: false,
      provider: 'twilio',
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN
    },
    webhook: {
      enabled: false,
      url: process.env.WEBHOOK_URL,
      secret: process.env.WEBHOOK_SECRET
    }
  }
};