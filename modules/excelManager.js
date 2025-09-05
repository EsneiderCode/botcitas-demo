const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const moment = require('moment');

class ExcelManager {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = null;
    this.filePath = path.join(process.cwd(), config.excel.outputFile);
    this.setupWorksheet();
  }

  // Configurar hoja de cálculo
  async setupWorksheet() {
    try {
      // Verificar si el archivo existe y no está vacío
      if (fs.existsSync(this.filePath)) {
        const stats = fs.statSync(this.filePath);
        
        if (stats.size > 0) {
          try {
            console.log('📊 Cargando archivo Excel existente...');
            await this.workbook.xlsx.readFile(this.filePath);
            this.worksheet = this.workbook.getWorksheet(config.excel.sheetName);
            
            if (!this.worksheet) {
              this.worksheet = this.workbook.addWorksheet(config.excel.sheetName);
              this.setupHeaders();
              await this.saveWorkbook();
            }
          } catch (readError) {
            console.log('⚠️ Archivo Excel corrupto, creando uno nuevo...');
            fs.unlinkSync(this.filePath);
            await this.createNewWorkbook();
          }
        } else {
          console.log('⚠️ Archivo Excel vacío, creando uno nuevo...');
          fs.unlinkSync(this.filePath);
          await this.createNewWorkbook();
        }
      } else {
        console.log('📊 Creando nuevo archivo Excel...');
        await this.createNewWorkbook();
      }

      console.log(`✅ Excel configurado: ${this.filePath}`);
    } catch (error) {
      console.error('Error al configurar Excel:', error);
      throw error;
    }
  }

  // Método auxiliar para crear un nuevo workbook
  async createNewWorkbook() {
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet(config.excel.sheetName);
    this.setupHeaders();
    await this.saveWorkbook();
  }

  // Configurar encabezados de la hoja
  setupHeaders() {
    const headers = [
      'ID',
      'Cliente',
      'Teléfono',
      'Hora Seleccionada',
      'Fecha de Contacto',
      'Estado',
      'Fecha de Creación',
      'Notas',
      'Servicio'
    ];

    // Agregar encabezados
    this.worksheet.addRow(headers);

    // Aplicar formato a los encabezados
    const headerRow = this.worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Ajustar ancho de columnas
    this.worksheet.columns = [
      { width: 8 },   // ID
      { width: 25 },  // Cliente
      { width: 15 },  // Teléfono
      { width: 20 },  // Hora Seleccionada
      { width: 18 },  // Fecha de Contacto
      { width: 12 },  // Estado
      { width: 18 },  // Fecha de Creación
      { width: 30 },  // Notas
      { width: 25 }   // Servicio
    ];
  }

  // Agregar nueva cita
  async addAppointment(appointmentData) {
    try {
      const nextId = this.getNextId();
      
      // Manejar tanto el formato antiguo como el nuevo
      let cliente, telefono, horaSeleccionada, fechaContacto, estado, notas, servicio;
      
      if (appointmentData.chatId) {
        // Nuevo formato
        cliente = appointmentData.chatId.replace('@c.us', '');
        telefono = appointmentData.chatId.replace('@c.us', '');
        horaSeleccionada = appointmentData.hora || 'N/A';
        fechaContacto = appointmentData.fecha || moment().format('DD/MM/YYYY');
        estado = appointmentData.estado || 'pendiente';
        notas = appointmentData.notas || '';
        servicio = appointmentData.servicio || 'Consulta General';
      } else {
        // Formato antiguo
        cliente = appointmentData.cliente;
        telefono = appointmentData.telefono;
        horaSeleccionada = appointmentData.hora_seleccionada;
        fechaContacto = appointmentData.fecha_contacto;
        estado = appointmentData.estado;
        notas = appointmentData.notas || '';
        servicio = appointmentData.servicio || 'Consulta General';
      }
      
      const rowData = [
        nextId,
        cliente,
        telefono,
        horaSeleccionada,
        fechaContacto,
        estado,
        moment().format('DD/MM/YYYY HH:mm:ss'),
        notas,
        servicio
      ];

      const newRow = this.worksheet.addRow(rowData);

      // Aplicar formato a la fila
      this.formatRow(newRow, estado);

      // Guardar archivo
      await this.saveWorkbook();

      console.log(`📝 Cita guardada en Excel: ${cliente} - ${estado}`);
      return nextId;

    } catch (error) {
      console.error('Error al agregar cita a Excel:', error);
      throw error;
    }
  }

  // Aplicar formato a una fila según el estado
  formatRow(row, estado) {
    let fillColor = 'FFFFFF'; // Blanco por defecto

    switch (estado.toLowerCase()) {
      case 'agendada':
        fillColor = 'C6EFCE'; // Verde claro
        break;
      case 'confirmada':
        fillColor = '92D050'; // Verde
        break;
      case 'reagendada':
        fillColor = 'BDD7EE'; // Azul claro
        break;
      case 'rechazada':
        fillColor = 'FFC7CE'; // Rojo claro
        break;
      case 'pendiente':
        fillColor = 'FFEB9C'; // Amarillo claro
        break;
      case 'completada':
        fillColor = '92D050'; // Verde
        break;
      case 'cancelada':
        fillColor = 'F2F2F2'; // Gris claro
        break;
    }

    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  // Obtener siguiente ID
  getNextId() {
    let maxId = 0;
    
    this.worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Saltar encabezados
        const id = parseInt(row.getCell(1).value) || 0;
        if (id > maxId) {
          maxId = id;
        }
      }
    });

    return maxId + 1;
  }

  // Actualizar estado de cita
  async updateAppointmentStatus(clientPhone, newStatus, notes = '') {
    try {
      let updated = false;

      this.worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Saltar encabezados
          const phone = row.getCell(3).value;
          if (phone === clientPhone) {
            row.getCell(5).value = newStatus; // Estado
            row.getCell(8).value = notes; // Notas
            this.formatRow(row, newStatus);
            updated = true;
          }
        }
      });

      if (updated) {
        await this.saveWorkbook();
        console.log(`📝 Estado actualizado para ${clientPhone}: ${newStatus}`);
      }

      return updated;
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      return false;
    }
  }

  // Buscar citas por criterios
  findAppointments(criteria = {}) {
    const results = [];

    this.worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Saltar encabezados
        const appointment = {
          id: row.getCell(1).value,
          cliente: row.getCell(2).value,
          telefono: row.getCell(3).value,
          hora_seleccionada: row.getCell(4).value,
          fecha_contacto: row.getCell(5).value,
          estado: row.getCell(6).value,
          fecha_creacion: row.getCell(7).value,
          notas: row.getCell(8).value
        };

        // Aplicar filtros
        let matches = true;

        if (criteria.estado && appointment.estado !== criteria.estado) {
          matches = false;
        }

        if (criteria.cliente && !appointment.cliente.toLowerCase().includes(criteria.cliente.toLowerCase())) {
          matches = false;
        }

        if (criteria.telefono && appointment.telefono !== criteria.telefono) {
          matches = false;
        }

        if (matches) {
          results.push(appointment);
        }
      }
    });

    return results;
  }

  // Obtener estadísticas
  getStatistics() {
    const stats = {
      total: 0,
      agendadas: 0,
      rechazadas: 0,
      pendientes: 0,
      completadas: 0,
      canceladas: 0,
      otros: 0
    };

    this.worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Saltar encabezados
        stats.total++;
        const estado = (row.getCell(6).value || '').toLowerCase();

        switch (estado) {
          case 'agendada':
            stats.agendadas++;
            break;
          case 'rechazada':
            stats.rechazadas++;
            break;
          case 'pendiente':
            stats.pendientes++;
            break;
          case 'completada':
            stats.completadas++;
            break;
          case 'cancelada':
            stats.canceladas++;
            break;
          default:
            stats.otros++;
        }
      }
    });

    return stats;
  }

  // Exportar datos a JSON
  exportToJSON() {
    const data = [];

    this.worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Saltar encabezados
        data.push({
          id: row.getCell(1).value,
          cliente: row.getCell(2).value,
          telefono: row.getCell(3).value,
          hora_seleccionada: row.getCell(4).value,
          fecha_contacto: row.getCell(5).value,
          estado: row.getCell(6).value,
          fecha_creacion: row.getCell(7).value,
          notas: row.getCell(8).value
        });
      }
    });

    return data;
  }

  // Guardar workbook con manejo de archivos bloqueados
  async saveWorkbook() {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        await this.workbook.xlsx.writeFile(this.filePath);
        console.log(`💾 Archivo Excel guardado: ${this.filePath}`);
        return;
      } catch (error) {
        retryCount++;
        
        if (error.code === 'EBUSY' || error.code === 'EACCES') {
          console.log(`⚠️ Archivo bloqueado (Excel abierto?). Intento ${retryCount}/${maxRetries}...`);
          
          if (retryCount < maxRetries) {
            // Esperar 2 segundos antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue; // Continuar con el siguiente intento
          } else {
            // Solo crear backup después de agotar todos los intentos
            console.log(`⚠️ No se pudo guardar en el archivo original después de ${maxRetries} intentos.`);
            console.log(`💾 Creando backup...`);
            
            const timestamp = moment().format('YYYYMMDD_HHmmss');
            const backupPath = this.filePath.replace('.xlsx', `_backup_${timestamp}.xlsx`);
            
            try {
              await this.workbook.xlsx.writeFile(backupPath);
              console.log(`💾 Guardado como backup: ${backupPath}`);
              console.log(`🔔 NOTA: Cierra Excel y ejecuta 'npm run fix-excel' para mover el backup`);
              return;
            } catch (backupError) {
              console.log(`❌ Error creando backup: ${backupError.message}`);
              console.log(`⚠️ El bot sigue funcionando, pero no se pudo guardar en Excel`);
              return;
            }
          }
        } else {
          console.error('Error al guardar Excel:', error);
          throw error;
        }
      }
    }
    
    console.error(`❌ No se pudo guardar después de ${maxRetries} intentos.`);
    console.error(`🔔 SOLUCIÓN: Cierra Excel y reinicia el bot`);
    
    // No hacer throw para no detener el bot, solo registrar el error
    console.log(`⚠️ El bot sigue funcionando, pero no se pudo guardar en Excel`);
  }

  // Crear backup del archivo
  async createBackup() {
    try {
      const timestamp = moment().format('YYYYMMDD_HHmmss');
      const backupPath = this.filePath.replace('.xlsx', `_backup_${timestamp}.xlsx`);
      
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, backupPath);
        console.log(`🔄 Backup creado: ${backupPath}`);
        return backupPath;
      }
    } catch (error) {
      console.error('Error al crear backup:', error);
    }
    return null;
  }

  // Limpiar datos antiguos (opcional)
  async cleanOldData(daysOld = 90) {
    try {
      const cutoffDate = moment().subtract(daysOld, 'days');
      let deletedCount = 0;

      // Crear nuevo worksheet sin los datos antiguos
      const newWorksheet = this.workbook.addWorksheet('TempSheet');
      this.setupHeaders.call({ worksheet: newWorksheet });

      this.worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // Mantener encabezados
          return;
        }

        const creationDate = moment(row.getCell(7).value, 'DD/MM/YYYY HH:mm:ss');
        
        if (creationDate.isAfter(cutoffDate)) {
          newWorksheet.addRow(row.values.slice(1)); // slice(1) para remover el primer elemento vacío
        } else {
          deletedCount++;
        }
      });

      // Reemplazar worksheet antigua
      this.workbook.removeWorksheet(this.worksheet.id);
      newWorksheet.name = config.excel.sheetName;
      this.worksheet = newWorksheet;

      await this.saveWorkbook();
      console.log(`🧹 Limpieza completada: ${deletedCount} registros antiguos eliminados`);

      return deletedCount;
    } catch (error) {
      console.error('Error al limpiar datos antiguos:', error);
      return 0;
    }
  }

  // Obtener ruta del archivo
  getFilePath() {
    return this.filePath;
  }
}

module.exports = ExcelManager; 