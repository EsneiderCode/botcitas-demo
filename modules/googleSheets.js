const { google } = require('googleapis');
const config = require('../config');

class GoogleSheetsManager {
  constructor() {
    this.sheets = google.sheets({ version: 'v4' });
    this.auth = null;
  }

  // Método para autenticar con Google Sheets API (si se usan credenciales)
  async authenticate() {
    try {
      if (config.googleAPI.clientId && config.googleAPI.clientSecret) {
        const oauth2Client = new google.auth.OAuth2(
          config.googleAPI.clientId,
          config.googleAPI.clientSecret,
          'urn:ietf:wg:oauth:2.0:oob'
        );

        if (config.googleAPI.refreshToken) {
          oauth2Client.setCredentials({
            refresh_token: config.googleAPI.refreshToken
          });
        }

        this.auth = oauth2Client;
      }
    } catch (error) {
      console.error('Error al autenticar con Google Sheets:', error);
      throw error;
    }
  }

  // Método para leer datos de Google Sheets
  async readSheetData() {
    // Si no hay credenciales configuradas, usar directamente CSV público
    if (!config.googleAPI.clientId || !config.googleAPI.clientSecret) {
      console.log('No hay credenciales de API configuradas, usando método CSV público...');
      return this.readPublicSheet();
    }

    // Si hay credenciales, intentar usar la API
    try {
      console.log('Leyendo datos de Google Sheets con API...');
      
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId: config.googleSheets.id,
        range: config.googleSheets.range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No se encontraron datos en la hoja.');
        return [];
      }

      return this.processSheetData(rows);
    } catch (error) {
      console.error('Error al leer Google Sheets con API:', error);
      console.log('Intentando método CSV público como respaldo...');
      
      // Método alternativo usando CSV público si el sheet está compartido
      return this.readPublicSheet();
    }
  }

  // Método alternativo para leer sheets públicos como CSV
  async readPublicSheet() {
    try {
      console.log('📋 Leyendo hoja pública de Google Sheets...');
      
      // Obtener URLs CSV posibles
      const csvUrls = this.convertToCSVUrl(config.googleSheets.url);
      const fetch = require('node-fetch');
      
      // Probar cada URL hasta encontrar una que funcione
      for (let i = 0; i < csvUrls.length; i++) {
        const csvUrl = csvUrls[i];
        console.log(`🔗 Probando URL ${i + 1}/${csvUrls.length}: ${csvUrl}`);
        
        try {
          const response = await fetch(csvUrl);
          
          if (response.ok) {
            const csvData = await response.text();
            console.log(`📊 Datos CSV obtenidos: ${csvData.length} caracteres`);
            
            if (csvData && csvData.trim().length > 0) {
              console.log('✅ URL funcionó correctamente');
              return this.parseCSVData(csvData);
            }
          } else {
            console.log(`❌ Error HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (urlError) {
          console.log(`❌ Error con URL ${i + 1}: ${urlError.message}`);
        }
      }
      
      throw new Error('Ninguna URL CSV funcionó');
      
    } catch (error) {
      console.error('❌ Error al leer hoja pública:', error.message);
      console.log('💡 Verifica que la hoja esté compartida como "Cualquier persona con el enlace puede ver"');
      console.log('💡 URL de ejemplo: https://docs.google.com/spreadsheets/d/ID/edit?usp=sharing');
      
      // Devolver datos de ejemplo para testing
      console.log('📝 Usando datos de ejemplo para continuar...');
      return this.getMockData();
    }
  }

  // Convertir URL de Google Sheets a formato CSV
  convertToCSVUrl(url) {
    try {
      // Extraer ID del spreadsheet de diferentes formatos de URL
      let spreadsheetId = null;
      
      // Formato: https://docs.google.com/spreadsheets/d/ID/edit...
      let match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        spreadsheetId = match[1];
      }
      
      // Si no se encuentra el ID en la URL, usar el ID de configuración
      if (!spreadsheetId && config.googleSheets.id) {
        spreadsheetId = config.googleSheets.id;
        console.log('🔧 Usando ID de configuración:', spreadsheetId);
      }
      
      if (spreadsheetId) {
        // Probar diferentes formatos de URL CSV
        const csvUrls = [
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?output=csv`
        ];
        
        console.log('✅ URL CSV generada:', csvUrls[0]);
        return csvUrls;
      }
      
             console.warn('No se pudo extraer el ID del spreadsheet, usando URL original');
       return [url];
         } catch (error) {
       console.error('Error al convertir URL:', error.message);
       // Como último recurso, intentar usar la URL original
       return [url];
     }
  }

  // Parsear datos CSV
  parseCSVData(csvData) {
    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV vacío');
      }
      
      // Parsear headers de manera más robusta
      const headers = this.parseCSVLine(lines[0]);
      console.log('📋 Columnas encontradas:', headers);
      
      const data = [];
      
      // Parsear cada línea de datos
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = this.parseCSVLine(lines[i]);
          
          // Asegurar que tenemos el mismo número de valores que headers
          while (values.length < headers.length) {
            values.push('');
          }
          
          data.push(values);
        }
      }
      
      console.log(`📊 Procesadas ${data.length} filas de datos`);
      return this.processSheetData([headers, ...data]);
      
    } catch (error) {
      console.error('Error al parsear CSV:', error.message);
      throw error;
    }
  }

  // Método auxiliar para parsear líneas CSV con comillas
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Procesar datos de la hoja
  processSheetData(rows) {
    const headers = rows[0];
    const pendingClients = [];

    // Encontrar índice de la columna de estado - priorizar Status, luego ANSCHLUSSSTATUS
    let statusIndex = headers.findIndex(header => 
      header.toLowerCase() === 'status' ||
      header.toLowerCase().includes('status_appointment') || 
      header.toLowerCase().includes('estado')
    );
    
    // Si no se encuentra, usar la columna ANSCHLUSSSTATUS
    if (statusIndex === -1) {
      statusIndex = headers.findIndex(header => 
        header.toLowerCase().includes('anschlussstatus')
      );
    }

    // Encontrar índices de otras columnas importantes
    const nameIndex = headers.findIndex(header => 
      header.toLowerCase().includes('nombre') ||
      header.toLowerCase().includes('name') ||
      header.toLowerCase().includes('contact person') ||
      header.toLowerCase().includes('contact')
    );

    const phoneIndex = headers.findIndex(header => 
      header.toLowerCase().includes('telefono') ||
      header.toLowerCase().includes('phone') ||
      header.toLowerCase().includes('whatsapp') ||
      header.toLowerCase().includes('phone number')
    );

    console.log(`Columnas encontradas - Status: ${statusIndex}, Nombre: ${nameIndex}, Teléfono: ${phoneIndex}`);

    // Procesar cada fila
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const statusValue = statusIndex >= 0 ? row[statusIndex] : '';
      
      // Si el status indica que necesita cita, agregar cliente a pendientes
      const isPending = !statusValue || 
                       statusValue.trim() === '' || 
                       statusValue.toLowerCase().includes('hausanschluss') ||
                       statusValue.toLowerCase().includes('hausbegehung') ||
                       statusValue.toLowerCase().includes('tiefbau') ||
                       statusValue.toLowerCase().includes('einblasen') ||
                       statusValue.toLowerCase().includes('spleiße') ||
                       statusValue.toLowerCase().includes('pending') ||
                       statusValue.toLowerCase().includes('pendiente') ||
                       statusValue.toLowerCase().includes('nuevo') ||
                       statusValue.toLowerCase().includes('contactar');
      
      if (isPending) {
        const client = {
          rowIndex: i,
          name: nameIndex >= 0 ? row[nameIndex] : `Cliente ${i}`,
          phone: phoneIndex >= 0 ? row[phoneIndex] : '',
          status: statusValue,
          originalRow: row
        };

        // Solo agregar si tiene teléfono
        if (client.phone && client.phone.trim() !== '') {
          pendingClients.push(client);
        }
      }
    }

    console.log(`Encontrados ${pendingClients.length} clientes pendientes`);
    return pendingClients;
  }

  // Datos de ejemplo para testing
  getMockData() {
    return [
      {
        rowIndex: 2,
        name: 'Juan Pérez',
        phone: '1234567890',
        status: '',
        originalRow: ['Juan Pérez', '1234567890', '', 'juan@email.com']
      },
      {
        rowIndex: 3,
        name: 'María González',
        phone: '0987654321',
        status: '',
        originalRow: ['María González', '0987654321', '', 'maria@email.com']
      }
    ];
  }

  // Actualizar status en Google Sheets (si se tiene acceso de escritura)
  async updateClientStatus(rowIndex, newStatus) {
    try {
      if (!this.auth) {
        console.log('No se puede actualizar - sin autenticación');
        return false;
      }

      const range = `Sheet1!C${rowIndex + 1}`; // Asumiendo que status está en columna C
      
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: config.googleSheets.id,
        range: range,
        valueInputOption: 'RAW',
        resource: {
          values: [[newStatus]]
        }
      });

      console.log(`Status actualizado para fila ${rowIndex}: ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Error al actualizar status:', error);
      return false;
    }
  }
}

module.exports = GoogleSheetsManager; 