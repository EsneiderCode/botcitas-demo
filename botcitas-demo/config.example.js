// ================================
// ARCHIVO DE CONFIGURACIÓN DE EJEMPLO
// ================================
// Copia este archivo como config.js y completa con tus datos reales

module.exports = {
  // Google Sheets Configuration
  googleSheets: {
    // URL completa de tu Google Sheets (debe estar compartida públicamente)
    url: 'https://docs.google.com/spreadsheets/d/TU_ID_AQUÍ/edit#gid=0',
    
    // ID de Google Sheets (extraído de la URL)
    id: 'TU_GOOGLE_SHEETS_ID_AQUÍ',
    
    // Rango de celdas a leer
    range: 'Sheet1!A:Z',
    
    // Nombre de la columna que indica el estado de la cita
    statusColumn: 'status_appointment'
  },

  // Google API Credentials (OPCIONAL - solo para acceso programático avanzado)
  googleAPI: {
    clientId: '', // Dejar vacío si usas hoja pública
    clientSecret: '', // Dejar vacío si usas hoja pública
    refreshToken: '' // Dejar vacío si usas hoja pública
  },

  // WhatsApp Configuration
  whatsapp: {
    sessionName: 'whatsapp-appointment-bot',
    qrCodeInTerminal: true // Mostrar código QR en terminal
  },

  // Excel Configuration
  excel: {
    outputFile: 'citas_agendadas.xlsx',
    sheetName: 'Citas'
  },

  // Bot Configuration
  bot: {
    name: 'AsistenteBot', // Cambia por el nombre de tu bot
    companyName: 'Tu Empresa' // Cambia por el nombre de tu empresa
  },

  // Horarios disponibles para ofrecer a los clientes
  availableHours: [
    { time: '08:00', label: '8:00 a.m. – 9:00 a.m.' },
    { time: '10:00', label: '10:00 a.m. – 11:00 a.m.' },
    { time: '11:00', label: '11:00 a.m. – 12:00 p.m.' },
    { time: '13:00', label: '1:00 p.m. – 2:00 p.m.' },
    { time: '14:00', label: '2:00 p.m. – 3:00 p.m.' },
    { time: '15:00', label: '3:00 p.m. – 4:00 p.m.' },
    { time: '16:00', label: '4:00 p.m. – 5:00 p.m.' }
  ],

  // Mensajes personalizables
  messages: {
    greeting: '¡Hola! Te contactamos para agendar tu cita. Por favor selecciona el horario que mejor te convenga:',
    confirmation: '¡Perfecto! Tu cita ha sido agendada para las {time}. Te enviaremos un recordatorio.',
    rejection: 'Entendido. Si cambias de opinión, no dudes en contactarnos.',
    error: 'Ha ocurrido un error. Por favor inténtalo de nuevo más tarde.',
    noAvailableHours: 'Lo sentimos, no hay horarios disponibles en este momento.'
  }
};

// ================================
// INSTRUCCIONES DE CONFIGURACIÓN
// ================================
/*
1. GOOGLE SHEETS:
   - Crea una hoja con columnas: nombre, telefono, status_appointment
   - Comparte la hoja públicamente (enlace de lectura)
   - Extrae el ID de la URL y colócalo en 'id'
   - Usa la URL completa en 'url'

2. PERSONALIZACIÓN:
   - Cambia bot.name por el nombre de tu asistente
   - Cambia bot.companyName por el nombre de tu empresa
   - Modifica los horarios en availableHours según tus necesidades
   - Personaliza los mensajes en messages

3. ESTRUCTURA DE GOOGLE SHEETS:
   | nombre      | telefono   | status_appointment | email          |
   |-------------|------------|-------------------|----------------|
   | Juan Pérez  | 1234567890 |                   | juan@email.com |
   | María López | 0987654321 | agendada          | maria@email.com|

4. NÚMEROS DE TELÉFONO:
   - Usa formato internacional (ej: 521234567890 para México)
   - Asegúrate de que sean números activos de WhatsApp

5. INICIO:
   - Ejecuta: npm start
   - Escanea el código QR con WhatsApp
   - El sistema comenzará automáticamente
*/ 