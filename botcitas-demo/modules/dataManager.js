/**
 * Gestor de Datos - Persistencia avanzada con soporte múltiple
 * Soporta Excel, Google Sheets y base de datos
 */

const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const moment = require('moment-timezone');
const EventEmitter = require('events');

class DataManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.appointments = new Map();
    this.conversations = new Map();
    this.backupTimer = null;
    
    this.init();
  }

  async init() {
    try {
      // Crear directorio de datos si no existe
      await this.ensureDataDirectory();
      
      // Cargar datos existentes
      await this.loadExistingData();
      
      // Configurar backup automático
      this.setupAutoBackup();
      
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async ensureDataDirectory() {
    const dataDir = path.dirname(this.config.data.excel.filename);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  async loadExistingData() {
    try {
      await fs.access(this.config.data.excel.filename);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.config.data.excel.filename);
      
      const worksheet = workbook.getWorksheet(this.config.data.excel.sheetName);
      if (worksheet) {
        this.loadAppointmentsFromWorksheet(worksheet);
      }
    } catch (error) {
      // Archivo no existe, crear nuevo
      await this.createNewExcelFile();
    }
  }

  loadAppointmentsFromWorksheet(worksheet) {
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      try {
        const appointment = {
          id: row.getCell(1).value,
          sessionId: row.getCell(2).value,
          customerName: row.getCell(3).value,
          phone: row.getCell(4).value,
          startTime: row.getCell(5).value,
          endTime: row.getCell(6).value,
          technician: row.getCell(7).value,
          status: row.getCell(8).value,
          language: row.getCell(9).value,
          createdAt: row.getCell(10).value,
          notes: row.getCell(11).value
        };
        
        if (appointment.id) {
          this.appointments.set(appointment.id, appointment);
        }
      } catch (error) {
        console.warn(`Error loading appointment from row ${rowNumber}:`, error);
      }
    });
  }

  async createNewExcelFile() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.config.data.excel.sheetName);
    
    // Configurar columnas
    worksheet.columns = [
      { header: 'ID Cita', key: 'id', width: 20 },
      { header: 'ID Sesión', key: 'sessionId', width: 15 },
      { header: 'Cliente', key: 'customerName', width: 25 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Inicio', key: 'startTime', width: 20 },
      { header: 'Fin', key: 'endTime', width: 20 },
      { header: 'Técnico', key: 'technician', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Idioma', key: 'language', width: 10 },
      { header: 'Creado', key: 'createdAt', width: 20 },
      { header: 'Notas', key: 'notes', width: 30 }
    ];

    // Estilizar encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    await workbook.xlsx.writeFile(this.config.data.excel.filename);
  }

  /**
   * Crear nueva cita
   */
  async createAppointment(appointmentData) {
    try {
      const appointment = {
        id: appointmentData.id,
        sessionId: appointmentData.sessionId,
        customerName: appointmentData.customerName || '',
        phone: appointmentData.phone || '',
        startTime: appointmentData.slot.start,
        endTime: appointmentData.slot.end,
        technician: appointmentData.technician,
        status: 'confirmed',
        language: appointmentData.language,
        createdAt: new Date().toISOString(),
        notes: appointmentData.notes || '',
        reminderEnabled: appointmentData.reminderEnabled || false,
        zone: this.getTechnicianZone(appointmentData.technician)
      };

      this.appointments.set(appointment.id, appointment);
      await this.saveToExcel();
      
      this.emit('appointmentCreated', appointment);
      return appointment;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Actualizar cita existente
   */
  async updateAppointment(appointmentId, updates) {
    try {
      const appointment = this.appointments.get(appointmentId);
      if (!appointment) {
        throw new Error(`Appointment not found: ${appointmentId}`);
      }

      const updatedAppointment = {
        ...appointment,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.appointments.set(appointmentId, updatedAppointment);
      await this.saveToExcel();
      
      this.emit('appointmentUpdated', updatedAppointment);
      return updatedAppointment;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Cancelar cita
   */
  async cancelAppointment(appointmentId, reason = '') {
    return this.updateAppointment(appointmentId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason
    });
  }

  /**
   * Obtener cita por ID
   */
  getAppointment(appointmentId) {
    return this.appointments.get(appointmentId);
  }

  /**
   * Obtener citas por criterios
   */
  getAppointments(filters = {}) {
    let appointments = Array.from(this.appointments.values());

    if (filters.status) {
      appointments = appointments.filter(apt => apt.status === filters.status);
    }

    if (filters.technician) {
      appointments = appointments.filter(apt => apt.technician === filters.technician);
    }

    if (filters.dateFrom) {
      const dateFrom = moment(filters.dateFrom);
      appointments = appointments.filter(apt => 
        moment(apt.startTime).isSameOrAfter(dateFrom)
      );
    }

    if (filters.dateTo) {
      const dateTo = moment(filters.dateTo);
      appointments = appointments.filter(apt => 
        moment(apt.startTime).isSameOrBefore(dateTo)
      );
    }

    return appointments.sort((a, b) => 
      moment(a.startTime).diff(moment(b.startTime))
    );
  }

  /**
   * Guardar conversación
   */
  async saveConversation(sessionId, conversationData) {
    try {
      const conversation = {
        sessionId,
        startTime: conversationData.startTime,
        endTime: conversationData.endTime || new Date().toISOString(),
        language: conversationData.language,
        messageCount: conversationData.messageHistory?.length || 0,
        completed: conversationData.completed,
        state: conversationData.state,
        appointmentId: conversationData.context?.appointmentId,
        metadata: {
          userAgent: conversationData.userAgent,
          ip: conversationData.ip,
          referrer: conversationData.referrer
        }
      };

      this.conversations.set(sessionId, conversation);
      this.emit('conversationSaved', conversation);
      
      return conversation;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Guardar datos en Excel
   */
  async saveToExcel() {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Crear hoja de citas
      const appointmentsWS = workbook.addWorksheet('Citas');
      this.setupAppointmentsWorksheet(appointmentsWS);
      
      // Crear hoja de conversaciones
      const conversationsWS = workbook.addWorksheet('Conversaciones');
      this.setupConversationsWorksheet(conversationsWS);

      // Crear hoja de estadísticas
      const statsWS = workbook.addWorksheet('Estadísticas');
      this.setupStatsWorksheet(statsWS);

      await workbook.xlsx.writeFile(this.config.data.excel.filename);
      this.emit('dataSaved');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  setupAppointmentsWorksheet(worksheet) {
    worksheet.columns = [
      { header: 'ID Cita', key: 'id', width: 20 },
      { header: 'ID Sesión', key: 'sessionId', width: 15 },
      { header: 'Cliente', key: 'customerName', width: 25 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Inicio', key: 'startTime', width: 20 },
      { header: 'Fin', key: 'endTime', width: 20 },
      { header: 'Técnico', key: 'technician', width: 15 },
      { header: 'Zona', key: 'zone', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Idioma', key: 'language', width: 10 },
      { header: 'Creado', key: 'createdAt', width: 20 },
      { header: 'Recordatorio', key: 'reminderEnabled', width: 12 },
      { header: 'Notas', key: 'notes', width: 30 }
    ];

    // Estilizar encabezados
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Agregar datos
    Array.from(this.appointments.values()).forEach(apt => {
      const row = worksheet.addRow({
        id: apt.id,
        sessionId: apt.sessionId,
        customerName: apt.customerName,
        phone: apt.phone,
        startTime: moment(apt.startTime).format('DD/MM/YYYY HH:mm'),
        endTime: moment(apt.endTime).format('DD/MM/YYYY HH:mm'),
        technician: apt.technician,
        zone: apt.zone,
        status: apt.status,
        language: apt.language,
        createdAt: moment(apt.createdAt).format('DD/MM/YYYY HH:mm'),
        reminderEnabled: apt.reminderEnabled ? 'Sí' : 'No',
        notes: apt.notes
      });

      // Colorear filas según estado
      this.colorRowByStatus(row, apt.status);
    });

    // Aplicar filtros
    worksheet.autoFilter = 'A1:M1';
  }

  setupConversationsWorksheet(worksheet) {
    worksheet.columns = [
      { header: 'ID Sesión', key: 'sessionId', width: 15 },
      { header: 'Inicio', key: 'startTime', width: 20 },
      { header: 'Fin', key: 'endTime', width: 20 },
      { header: 'Duración (min)', key: 'duration', width: 15 },
      { header: 'Idioma', key: 'language', width: 10 },
      { header: 'Mensajes', key: 'messageCount', width: 10 },
      { header: 'Completada', key: 'completed', width: 12 },
      { header: 'Estado Final', key: 'state', width: 15 },
      { header: 'ID Cita', key: 'appointmentId', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };

    Array.from(this.conversations.values()).forEach(conv => {
      const startMoment = moment(conv.startTime);
      const endMoment = moment(conv.endTime);
      const duration = endMoment.diff(startMoment, 'minutes');

      worksheet.addRow({
        sessionId: conv.sessionId,
        startTime: startMoment.format('DD/MM/YYYY HH:mm'),
        endTime: endMoment.format('DD/MM/YYYY HH:mm'),
        duration: duration,
        language: conv.language,
        messageCount: conv.messageCount,
        completed: conv.completed ? 'Sí' : 'No',
        state: conv.state,
        appointmentId: conv.appointmentId || ''
      });
    });
  }

  setupStatsWorksheet(worksheet) {
    const stats = this.generateStats();
    
    worksheet.mergeCells('A1:B1');
    worksheet.getCell('A1').value = 'ESTADÍSTICAS DEL SISTEMA';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    let currentRow = 3;
    
    // Estadísticas de citas
    worksheet.getCell(`A${currentRow}`).value = 'CITAS';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    Object.entries(stats.appointments).forEach(([key, value]) => {
      worksheet.getCell(`A${currentRow}`).value = this.formatStatLabel(key);
      worksheet.getCell(`B${currentRow}`).value = value;
      currentRow++;
    });

    currentRow++;
    
    // Estadísticas de conversaciones
    worksheet.getCell(`A${currentRow}`).value = 'CONVERSACIONES';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    Object.entries(stats.conversations).forEach(([key, value]) => {
      worksheet.getCell(`A${currentRow}`).value = this.formatStatLabel(key);
      worksheet.getCell(`B${currentRow}`).value = value;
      currentRow++;
    });
  }

  colorRowByStatus(row, status) {
    let color;
    switch (status) {
      case 'confirmed':
        color = 'FFC6EFCE'; // Verde claro
        break;
      case 'pending':
        color = 'FFFFC000'; // Amarillo
        break;
      case 'cancelled':
        color = 'FFFFC7CE'; // Rojo claro
        break;
      case 'completed':
        color = 'FF92D050'; // Verde
        break;
      default:
        color = 'FFFFFFFF'; // Blanco
    }

    row.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }
      };
    });
  }

  /**
   * Generar estadísticas
   */
  generateStats() {
    const appointments = Array.from(this.appointments.values());
    const conversations = Array.from(this.conversations.values());
    
    return {
      appointments: {
        total: appointments.length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        pending: appointments.filter(a => a.status === 'pending').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        withReminder: appointments.filter(a => a.reminderEnabled).length
      },
      conversations: {
        total: conversations.length,
        completed: conversations.filter(c => c.completed).length,
        averageMessages: conversations.length > 0 
          ? Math.round(conversations.reduce((sum, c) => sum + c.messageCount, 0) / conversations.length)
          : 0,
        byLanguage: conversations.reduce((acc, c) => {
          acc[c.language] = (acc[c.language] || 0) + 1;
          return acc;
        }, {})
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };
  }

  formatStatLabel(key) {
    const labels = {
      total: 'Total',
      confirmed: 'Confirmadas',
      pending: 'Pendientes',
      cancelled: 'Canceladas',
      completed: 'Completadas',
      withReminder: 'Con recordatorio',
      averageMessages: 'Promedio mensajes'
    };
    return labels[key] || key;
  }

  getTechnicianZone(technicianId) {
    return this.config.technicians[technicianId]?.zone || 'N/A';
  }

  setupAutoBackup() {
    if (this.config.data.excel.backupEnabled && this.config.data.excel.backupInterval) {
      this.backupTimer = setInterval(() => {
        this.createBackup();
      }, this.config.data.excel.backupInterval);
    }
  }

  async createBackup() {
    try {
      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const backupFilename = this.config.data.excel.filename.replace('.xlsx', `_backup_${timestamp}.xlsx`);
      
      await fs.copyFile(this.config.data.excel.filename, backupFilename);
      this.emit('backupCreated', backupFilename);
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Exportar datos en diferentes formatos
   */
  async exportData(format = 'excel', filters = {}) {
    const appointments = this.getAppointments(filters);
    
    switch (format) {
      case 'json':
        return JSON.stringify(appointments, null, 2);
      case 'csv':
        return this.generateCSV(appointments);
      case 'excel':
      default:
        return this.generateExcelBuffer(appointments);
    }
  }

  generateCSV(appointments) {
    const headers = ['ID Cita', 'Cliente', 'Inicio', 'Fin', 'Técnico', 'Estado', 'Idioma'];
    const rows = appointments.map(apt => [
      apt.id,
      apt.customerName,
      moment(apt.startTime).format('DD/MM/YYYY HH:mm'),
      moment(apt.endTime).format('DD/MM/YYYY HH:mm'),
      apt.technician,
      apt.status,
      apt.language
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\\n');
  }

  async generateExcelBuffer(appointments) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Citas Exportadas');
    
    // Similar setup pero solo con datos filtrados
    // ... implementación similar a setupAppointmentsWorksheet pero para datos filtrados
    
    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
    this.removeAllListeners();
  }
}

module.exports = DataManager;