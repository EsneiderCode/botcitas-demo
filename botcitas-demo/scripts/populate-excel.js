const ExcelJS = require('exceljs');
const path = require('path');
const config = require('../config');

// Datos hardcodeados para poblar el Excel
const hardcodedAppointments = [
    {
        id: 'APT-001',
        cliente: 'María González',
        telefono: '+57 300 123 4567',
        horaSeleccionada: '09:00 AM',
        fechaContacto: '2024-01-15',
        estado: 'confirmada',
        fechaCreacion: new Date().toISOString(),
        notas: 'Primera consulta'
    },
    {
        id: 'APT-002',
        cliente: 'Carlos Rodríguez',
        telefono: '+57 310 987 6543',
        horaSeleccionada: '10:30 AM',
        fechaContacto: '2024-01-15',
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString(),
        notas: 'Seguimiento post-tratamiento'
    },
    {
        id: 'APT-003',
        cliente: 'Ana Martínez',
        telefono: '+57 315 456 7890',
        horaSeleccionada: '02:00 PM',
        fechaContacto: '2024-01-15',
        estado: 'confirmada',
        fechaCreacion: new Date().toISOString(),
        notas: 'Examen de laboratorio'
    },
    {
        id: 'APT-004',
        cliente: 'Luis Fernández',
        telefono: '+57 320 111 2222',
        horaSeleccionada: '11:00 AM',
        fechaContacto: '2024-01-16',
        estado: 'reagendada',
        fechaCreacion: new Date().toISOString(),
        notas: 'Reagendada por solicitud del paciente'
    },
    {
        id: 'APT-005',
        cliente: 'Sofia Herrera',
        telefono: '+57 301 333 4444',
        horaSeleccionada: '03:30 PM',
        fechaContacto: '2024-01-16',
        estado: 'cancelada',
        fechaCreacion: new Date().toISOString(),
        notas: 'Cancelada por emergencia familiar'
    },
    {
        id: 'APT-006',
        cliente: 'Diego Morales',
        telefono: '+57 304 555 6666',
        horaSeleccionada: '08:30 AM',
        fechaContacto: '2024-01-17',
        estado: 'confirmada',
        fechaCreacion: new Date().toISOString(),
        notas: 'Vacuna anual'
    },
    {
        id: 'APT-007',
        cliente: 'Isabella Castro',
        telefono: '+57 312 777 8888',
        horaSeleccionada: '01:00 PM',
        fechaContacto: '2024-01-17',
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString(),
        notas: 'Consulta de rutina'
    },
    {
        id: 'APT-008',
        cliente: 'Roberto Silva',
        telefono: '+57 318 999 0000',
        horaSeleccionada: '04:00 PM',
        fechaContacto: '2024-01-18',
        estado: 'confirmada',
        fechaCreacion: new Date().toISOString(),
        notas: 'Control de presión arterial'
    },
    {
        id: 'APT-009',
        cliente: 'Carmen López',
        telefono: '+57 305 123 4567',
        horaSeleccionada: '09:30 AM',
        fechaContacto: '2024-01-18',
        estado: 'reagendada',
        fechaCreacion: new Date().toISOString(),
        notas: 'Reagendada por disponibilidad del médico'
    },
    {
        id: 'APT-010',
        cliente: 'Andrés Jiménez',
        telefono: '+57 311 987 6543',
        horaSeleccionada: '02:30 PM',
        fechaContacto: '2024-01-19',
        estado: 'confirmada',
        fechaCreacion: new Date().toISOString(),
        notas: 'Examen de vista'
    }
];

async function populateExcel() {
    try {
        console.log('🚀 Iniciando población del archivo Excel...');
        
        // Crear nuevo workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(config.excel.sheetName);
        
        // Configurar encabezados
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
        
        worksheet.addRow(headers);
        
        // Aplicar formato a los encabezados
        const headerRow = worksheet.getRow(1);
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
        worksheet.columns = [
            { width: 12 },  // ID
            { width: 25 },   // Cliente
            { width: 20 },   // Teléfono
            { width: 18 },   // Hora Seleccionada
            { width: 18 },   // Fecha de Contacto
            { width: 15 },   // Estado
            { width: 20 },   // Fecha de Creación
            { width: 30 },   // Notas
            { width: 25 }    // Servicio
        ];
        
        // Agregar datos hardcodeados
        hardcodedAppointments.forEach(appointment => {
            const row = worksheet.addRow([
                appointment.id,
                appointment.cliente,
                appointment.telefono,
                appointment.horaSeleccionada,
                appointment.fechaContacto,
                appointment.estado,
                appointment.fechaCreacion,
                appointment.notas,
                appointment.servicio
            ]);
            
            // Aplicar formato a las filas de datos
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle' };
                
                // Formato especial para la columna de estado
                if (colNumber === 6) { // Columna Estado
                    const estado = cell.value;
                    if (estado === 'confirmada') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'D4EDDA' }
                        };
                        cell.font = { color: { argb: '155724' } };
                    } else if (estado === 'pendiente') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF3CD' }
                        };
                        cell.font = { color: { argb: '856404' } };
                    } else if (estado === 'reagendada') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'DBEAFE' }
                        };
                        cell.font = { color: { argb: '1E40AF' } };
                    } else if (estado === 'cancelada') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FEF2F2' }
                        };
                        cell.font = { color: { argb: '991B1B' } };
                    }
                }
            });
        });
        
        // Guardar archivo
        const filePath = path.join(process.cwd(), config.excel.outputFile);
        await workbook.xlsx.writeFile(filePath);
        
        console.log(`✅ Archivo Excel poblado exitosamente: ${filePath}`);
        console.log(`📊 Se agregaron ${hardcodedAppointments.length} citas`);
        
        // Mostrar estadísticas
        const stats = {
            total: hardcodedAppointments.length,
            confirmadas: hardcodedAppointments.filter(apt => apt.estado === 'confirmada').length,
            pendientes: hardcodedAppointments.filter(apt => apt.estado === 'pendiente').length,
            reagendadas: hardcodedAppointments.filter(apt => apt.estado === 'reagendada').length,
            canceladas: hardcodedAppointments.filter(apt => apt.estado === 'cancelada').length
        };
        
        console.log('\n📈 Estadísticas:');
        console.log(`   Total: ${stats.total}`);
        console.log(`   Confirmadas: ${stats.confirmadas}`);
        console.log(`   Pendientes: ${stats.pendientes}`);
        console.log(`   Reagendadas: ${stats.reagendadas}`);
        console.log(`   Canceladas: ${stats.canceladas}`);
        
    } catch (error) {
        console.error('❌ Error al poblar el archivo Excel:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    populateExcel()
        .then(() => {
            console.log('\n🎉 Proceso completado exitosamente!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { populateExcel, hardcodedAppointments };
