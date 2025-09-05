const express = require('express');
const cors = require('cors');
const ExcelManager = require('./modules/excelManager');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar ExcelManager
const excelManager = new ExcelManager();

// Función para obtener todas las citas
async function getAllAppointments() {
    try {
        if (!excelManager.worksheet) {
            return [];
        }

        const appointments = [];
        const worksheet = excelManager.worksheet;
        
        // Iterar sobre todas las filas (saltando la primera que son los headers)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Saltar headers
            
            const appointment = {
                id: row.getCell(1).value,
                cliente: row.getCell(2).value,
                telefono: row.getCell(3).value,
                horaSeleccionada: row.getCell(4).value,
                fechaContacto: row.getCell(5).value,
                estado: row.getCell(6).value,
                fechaCreacion: row.getCell(7).value,
                notas: row.getCell(8).value,
                servicio: row.getCell(9).value || 'Consulta General'
            };
            
            appointments.push(appointment);
        });

        return appointments.reverse(); // Mostrar las más recientes primero
    } catch (error) {
        console.error('Error al obtener citas:', error);
        return [];
    }
}

// Función para obtener estadísticas
async function getStatistics() {
    try {
        const appointments = await getAllAppointments();
        
        const stats = {
            total: appointments.length,
            confirmadas: appointments.filter(apt => apt.estado === 'confirmada').length,
            pendientes: appointments.filter(apt => apt.estado === 'pendiente').length,
            reagendadas: appointments.filter(apt => apt.estado === 'reagendada').length,
            canceladas: appointments.filter(apt => apt.estado === 'cancelada').length,
            rechazadas: appointments.filter(apt => apt.estado === 'rechazada').length,
            hoy: appointments.filter(apt => {
                const today = new Date().toISOString().split('T')[0];
                return apt.fechaContacto === today;
            }).length
        };

        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return {};
    }
}

// Rutas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await getAllAppointments();
        res.json({
            success: true,
            data: appointments,
            count: appointments.length
        });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener citas'
        });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getStatistics();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor de prueba iniciado en http://localhost:${port}`);
    console.log(`📊 Panel de citas disponible en http://localhost:${port}`);
    console.log(`🔗 API de citas: http://localhost:${port}/api/appointments`);
    console.log(`📈 API de estadísticas: http://localhost:${port}/api/stats`);
});
