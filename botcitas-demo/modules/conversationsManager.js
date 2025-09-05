const fs = require('fs');
const path = require('path');
const moment = require('moment');

class ConversationsManager {
  constructor() {
    this.conversations = new Map(); // chatId -> array de mensajes
    this.conversationsFile = path.join(process.cwd(), 'conversations.json');
    this.loadConversations();
  }

  // Cargar conversaciones del archivo
  loadConversations() {
    try {
      if (fs.existsSync(this.conversationsFile)) {
        const data = fs.readFileSync(this.conversationsFile, 'utf8');
        const conversationsData = JSON.parse(data);
        
        // Convertir el objeto a Map
        this.conversations = new Map(Object.entries(conversationsData));
        console.log(`📱 Cargadas ${this.conversations.size} conversaciones existentes`);
      }
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      this.conversations = new Map();
    }
  }

  // Guardar conversaciones al archivo
  saveConversations() {
    try {
      // Convertir Map a objeto para JSON
      const conversationsObj = Object.fromEntries(this.conversations);
      fs.writeFileSync(this.conversationsFile, JSON.stringify(conversationsObj, null, 2));
    } catch (error) {
      console.error('Error al guardar conversaciones:', error);
    }
  }

  // Agregar mensaje a la conversación
  addMessage(chatId, message, direction = 'received') {
    const phoneNumber = this.cleanPhoneNumber(chatId);
    
    if (!this.conversations.has(phoneNumber)) {
      this.conversations.set(phoneNumber, []);
    }

    // Asegurar que el body sea un string válido
    let messageBody = '';
    if (typeof message === 'string') {
      messageBody = message;
    } else if (message && typeof message.body === 'string') {
      messageBody = message.body;
    } else if (message && message.body) {
      messageBody = String(message.body);
    } else {
      messageBody = '[Mensaje sin contenido]';
    }

    const messageData = {
      id: Date.now() + Math.random(),
      chatId: phoneNumber,
      body: messageBody,
      direction: direction, // 'received', 'sent'
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      from: direction === 'received' ? phoneNumber : 'bot',
      to: direction === 'received' ? 'bot' : phoneNumber,
      messageType: message && message.type ? message.type : 'text',
      hasMedia: message && message.hasMedia ? message.hasMedia : false
    };

    this.conversations.get(phoneNumber).push(messageData);
    
    // Mantener solo los últimos 100 mensajes por conversación
    if (this.conversations.get(phoneNumber).length > 100) {
      this.conversations.get(phoneNumber).shift();
    }

    this.saveConversations();
    return messageData;
  }

  // Obtener conversación específica
  getConversation(chatId) {
    const phoneNumber = this.cleanPhoneNumber(chatId);
    return this.conversations.get(phoneNumber) || [];
  }

  // Obtener todas las conversaciones con resumen
  getAllConversations() {
    const result = [];
    
    for (const [phoneNumber, messages] of this.conversations.entries()) {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const firstMessage = messages[0];
        
        // Validar que el lastMessage tiene body válido
        const lastMessageBody = lastMessage && lastMessage.body ? 
          String(lastMessage.body).substring(0, 100) : '[Sin mensaje]';
        
        result.push({
          phoneNumber: phoneNumber,
          lastMessage: lastMessageBody,
          lastMessageTime: lastMessage.timestamp,
          lastMessageDirection: lastMessage.direction,
          messageCount: messages.length,
          firstContactTime: firstMessage.timestamp,
          status: this.getConversationStatus(messages)
        });
      }
    }

    // Ordenar por último mensaje
    return result.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  }

  // Obtener estado de la conversación
  getConversationStatus(messages) {
    const lastMessage = messages[messages.length - 1];
    
    // Buscar palabras clave en los últimos mensajes
    const lastFewMessages = messages.slice(-5)
      .filter(m => m && m.body && typeof m.body === 'string')
      .map(m => m.body.toLowerCase());
    
    if (lastFewMessages.some(msg => msg.includes('confirmada') || msg.includes('confirmed'))) {
      return 'confirmed';
    }
    if (lastFewMessages.some(msg => msg.includes('cancelada') || msg.includes('canceled'))) {
      return 'canceled';
    }
    if (lastFewMessages.some(msg => msg.includes('reagendada') || msg.includes('rescheduled'))) {
      return 'rescheduled';
    }
    
    // Si el último mensaje es del bot y no hay respuesta en 1 hora
    if (lastMessage.direction === 'sent') {
      const hourAgo = moment().subtract(1, 'hour');
      if (moment(lastMessage.timestamp).isBefore(hourAgo)) {
        return 'pending_response';
      }
    }
    
    return 'active';
  }

  // Buscar conversaciones
  searchConversations(query) {
    const results = [];
    const searchTerm = query.toLowerCase();
    
    for (const [phoneNumber, messages] of this.conversations.entries()) {
      // Buscar en número de teléfono
      if (phoneNumber.includes(searchTerm)) {
        results.push({
          phoneNumber,
          matchType: 'phone',
          messages: messages
        });
        continue;
      }
      
      // Buscar en mensajes
      const matchingMessages = messages.filter(msg => 
        msg && msg.body && typeof msg.body === 'string' && 
        msg.body.toLowerCase().includes(searchTerm)
      );
      
      if (matchingMessages.length > 0) {
        results.push({
          phoneNumber,
          matchType: 'message',
          messages: messages,
          matchingMessages: matchingMessages
        });
      }
    }
    
    return results;
  }

  // Obtener estadísticas de conversaciones
  getStatistics() {
    const stats = {
      totalConversations: this.conversations.size,
      totalMessages: 0,
      activeConversations: 0,
      confirmedAppointments: 0,
      pendingResponse: 0,
      averageMessagesPerConversation: 0
    };

    for (const [phoneNumber, messages] of this.conversations.entries()) {
      stats.totalMessages += messages.length;
      
      const status = this.getConversationStatus(messages);
      if (status === 'active') stats.activeConversations++;
      if (status === 'confirmed') stats.confirmedAppointments++;
      if (status === 'pending_response') stats.pendingResponse++;
    }

    if (stats.totalConversations > 0) {
      stats.averageMessagesPerConversation = Math.round(stats.totalMessages / stats.totalConversations);
    }

    return stats;
  }

  // Limpiar número de teléfono
  cleanPhoneNumber(chatId) {
    return chatId.replace('@c.us', '').replace('@g.us', '');
  }

  // Exportar conversaciones específicas
  exportConversation(chatId, format = 'json') {
    const phoneNumber = this.cleanPhoneNumber(chatId);
    const messages = this.getConversation(chatId);
    
    if (format === 'txt') {
      let txtContent = `Conversación con ${phoneNumber}\n`;
      txtContent += `Exportada el ${moment().format('DD/MM/YYYY HH:mm:ss')}\n`;
      txtContent += '='.repeat(50) + '\n\n';
      
      messages.forEach(msg => {
        const direction = msg.direction === 'sent' ? '[BOT]' : '[CLIENTE]';
        const messageBody = msg && msg.body ? String(msg.body) : '[Sin contenido]';
        txtContent += `${msg.timestamp} ${direction}: ${messageBody}\n\n`;
      });
      
      return txtContent;
    }
    
    return {
      phoneNumber,
      exportedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      messageCount: messages.length,
      messages
    };
  }

  // Limpiar conversaciones antiguas (más de 30 días)
  cleanOldConversations(daysOld = 30) {
    const cutoffDate = moment().subtract(daysOld, 'days');
    let cleanedCount = 0;
    
    for (const [phoneNumber, messages] of this.conversations.entries()) {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (moment(lastMessage.timestamp).isBefore(cutoffDate)) {
          this.conversations.delete(phoneNumber);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      this.saveConversations();
      console.log(`🧹 Limpiadas ${cleanedCount} conversaciones antiguas`);
    }
    
    return cleanedCount;
  }
}

module.exports = ConversationsManager; 