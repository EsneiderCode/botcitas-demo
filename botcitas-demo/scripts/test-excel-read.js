const ExcelManager = require('../modules/excelManager');

async function testExcelRead() {
    try {
        console.log('🧪 Probando lectura del archivo Excel...');
        
        const excelManager = new ExcelManager();
        
        // Esperar un poco para que se inicialice
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📊 ExcelManager inicializado');
        console.log('📁 Archivo:', excelManager.filePath);
        console.log('📋 Worksheet:', excelManager.worksheet ? 'Encontrado' : 'No encontrado');
        
        if (excelManager.worksheet) {
            console.log('📏 Filas en el worksheet:', excelManager.worksheet.rowCount);
            
            // Leer todas las filas
            const appointments = [];
            excelManager.worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Saltar headers
                
                const appointment = {
                    id: row.getCell(1).value,
                    cliente: row.getCell(2).value,
                    telefono: row.getCell(3).value,
                    horaSeleccionada: row.getCell(4).value,
                    fechaContacto: row.getCell(5).value,
                    estado: row.getCell(6).value,
                    fechaCreacion: row.getCell(7).value,
                    notas: row.getCell(8).value
                };
                
                appointments.push(appointment);
            });
            
            console.log(`📊 Citas encontradas: ${appointments.length}`);
            
            if (appointments.length > 0) {
                console.log('\n📋 Primera cita:');
                console.log(JSON.stringify(appointments[0], null, 2));
            }
        } else {
            console.log('❌ No se pudo encontrar el worksheet');
        }
        
    } catch (error) {
        console.error('❌ Error al probar Excel:', error);
    }
}

testExcelRead();
