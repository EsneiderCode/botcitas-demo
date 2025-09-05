const moment = require('moment');

class TechnicianScheduler {
  constructor() {
    // Base de datos simulada de técnicos
    this.technicians = [
      {
        id: 'TEC001',
        name: 'Klaus Mueller',
        zone: 'Norte',
        specialties: ['fibra_optica', 'instalacion', 'reparacion'],
        efficiency: 0.92,
        currentWorkload: 0.7
      },
      {
        id: 'TEC002', 
        name: 'Maria Rodriguez',
        zone: 'Centro',
        specialties: ['fibra_optica', 'instalacion', 'configuracion'],
        efficiency: 0.95,
        currentWorkload: 0.8
      },
      {
        id: 'TEC003',
        name: 'Stefan Weber',
        zone: 'Sur',
        specialties: ['fibra_optica', 'instalacion', 'soporte'],
        efficiency: 0.88,
        currentWorkload: 0.6
      },
      {
        id: 'TEC004',
        name: 'Ana Garcia',
        zone: 'Este',
        specialties: ['fibra_optica', 'instalacion', 'mantenimiento'],
        efficiency: 0.90,
        currentWorkload: 0.5
      }
    ];

    // Agenda base de cada técnico (horarios disponibles por defecto)
    this.baseSchedule = {
      'lunes': ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'],
      'martes': ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'],
      'miercoles': ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'],
      'jueves': ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'],
      'viernes': ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00']
    };

    // Citas ya programadas (simulación)
    this.scheduledAppointments = new Map();
    
    // Inicializar agenda simulada
    this.initializeScheduledAppointments();
  }

  // Inicializar citas ya programadas para simular realismo
  initializeScheduledAppointments() {
    const today = moment();
    
    // Simular algunas citas ya programadas para los próximos días
    for (let day = 0; day < 7; day++) {
      const date = today.clone().add(day, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      
      this.technicians.forEach(tech => {
        // Simular carga de trabajo basada en currentWorkload
        const occupiedSlots = Math.floor(4 * tech.currentWorkload);
        
        for (let i = 0; i < occupiedSlots; i++) {
          const slot = this.getRandomTimeSlot();
          const appointmentKey = `${tech.id}-${dateStr}-${slot}`;
          
          this.scheduledAppointments.set(appointmentKey, {
            technicianId: tech.id,
            date: dateStr,
            time: slot,
            client: `Cliente ${Math.floor(Math.random() * 1000)}`,
            type: 'instalacion',
            status: 'confirmada'
          });
        }
      });
    }
  }

  // Obtener slot de tiempo aleatorio
  getRandomTimeSlot() {
    const slots = ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'];
    return slots[Math.floor(Math.random() * slots.length)];
  }

  // Simular consulta a sistema interno (con delay realista)
  async queryTechnicianAvailability(zone = 'Centro', serviceType = 'instalacion', preferredDate = null) {
    // Simular latencia de consulta a base de datos
    await this.simulateSystemDelay();
    
    const targetDate = preferredDate ? moment(preferredDate) : moment().add(1, 'day');
    const searchResults = [];

    // Buscar técnicos por zona y especialidad
    const availableTechnicians = this.technicians.filter(tech => 
      tech.zone === zone && 
      tech.specialties.includes(serviceType) &&
      tech.currentWorkload < 0.9 // No sobrecargados
    );

    if (availableTechnicians.length === 0) {
      // Expandir búsqueda a zonas cercanas
      const allTechnicians = this.technicians.filter(tech => 
        tech.specialties.includes(serviceType) &&
        tech.currentWorkload < 0.95
      );
      
      availableTechnicians.push(...allTechnicians);
    }

    // Buscar slots disponibles para los próximos 5 días
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const checkDate = targetDate.clone().add(dayOffset, 'days');
      const dateStr = checkDate.format('YYYY-MM-DD');
      const dayName = checkDate.locale('es').format('dddd').toLowerCase();

      // Solo días laborables
      if (checkDate.day() === 0 || checkDate.day() === 6) continue;

      availableTechnicians.forEach(tech => {
        const availableSlots = this.getAvailableSlots(tech.id, dateStr, dayName);
        
        availableSlots.forEach(slot => {
          searchResults.push({
            technicianId: tech.id,
            technicianName: tech.name,
            zone: tech.zone,
            date: dateStr,
            dateFormatted: checkDate.format('dddd D [de] MMMM'),
            timeSlot: slot,
            efficiency: tech.efficiency,
            workload: tech.currentWorkload,
            priority: this.calculatePriority(tech, dayOffset, slot)
          });
        });
      });
    }

    // Ordenar por prioridad
    searchResults.sort((a, b) => b.priority - a.priority);

    return {
      query: {
        zone,
        serviceType,
        searchDate: targetDate.format('YYYY-MM-DD'),
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      },
      results: searchResults.slice(0, 8), // Top 8 opciones
      totalTechnicians: availableTechnicians.length,
      searchDuration: this.getRandomBetween(250, 800) // ms
    };
  }

  // Obtener slots disponibles para un técnico en una fecha específica
  getAvailableSlots(technicianId, date, dayName) {
    const daySchedule = this.baseSchedule[dayName] || [];
    const availableSlots = [];

    daySchedule.forEach(slot => {
      const appointmentKey = `${technicianId}-${date}-${slot}`;
      if (!this.scheduledAppointments.has(appointmentKey)) {
        availableSlots.push(slot);
      }
    });

    return availableSlots;
  }

  // Calcular prioridad de un slot
  calculatePriority(technician, dayOffset, timeSlot) {
    let priority = 100;
    
    // Preferir técnicos con menor carga de trabajo
    priority += (1 - technician.currentWorkload) * 30;
    
    // Preferir técnicos más eficientes
    priority += technician.efficiency * 20;
    
    // Preferir fechas más cercanas
    priority -= dayOffset * 5;
    
    // Preferir horarios de mañana
    if (timeSlot.startsWith('08:00') || timeSlot.startsWith('10:00')) {
      priority += 10;
    }
    
    return priority;
  }

  // Reservar slot temporal (para simular reserva mientras cliente decide)
  async holdSlot(technicianId, date, timeSlot, holdDurationMinutes = 10) {
    const appointmentKey = `${technicianId}-${date}-${timeSlot}`;
    const holdKey = `HOLD-${appointmentKey}`;
    
    // Simular reserva temporal
    this.scheduledAppointments.set(holdKey, {
      technicianId,
      date,
      time: timeSlot,
      type: 'temporal_hold',
      status: 'on_hold',
      expiresAt: moment().add(holdDurationMinutes, 'minutes').toISOString()
    });

    console.log(`🔒 Slot reservado temporalmente: ${technicianId} - ${date} ${timeSlot}`);
    
    // Auto-liberar después del tiempo especificado
    setTimeout(() => {
      this.releaseHold(holdKey);
    }, holdDurationMinutes * 60 * 1000);

    return {
      success: true,
      holdKey,
      expiresAt: moment().add(holdDurationMinutes, 'minutes').format('HH:mm:ss'),
      message: `Slot reservado por ${holdDurationMinutes} minutos`
    };
  }

  // Liberar reserva temporal
  releaseHold(holdKey) {
    if (this.scheduledAppointments.has(holdKey)) {
      this.scheduledAppointments.delete(holdKey);
      console.log(`🔓 Reserva temporal liberada: ${holdKey}`);
    }
  }

  // Confirmar cita definitiva
  async confirmAppointment(technicianId, date, timeSlot, clientInfo) {
    const appointmentKey = `${technicianId}-${date}-${timeSlot}`;
    
    // Verificar que el slot sigue disponible
    if (this.scheduledAppointments.has(appointmentKey)) {
      return {
        success: false,
        error: 'Slot ya no disponible'
      };
    }

    // Confirmar la cita
    this.scheduledAppointments.set(appointmentKey, {
      technicianId,
      date,
      time: timeSlot,
      client: clientInfo.name || 'Cliente',
      phone: clientInfo.phone || '',
      type: 'instalacion',
      status: 'confirmada',
      confirmedAt: moment().toISOString()
    });

    // Actualizar carga de trabajo del técnico
    const technician = this.technicians.find(t => t.id === technicianId);
    if (technician) {
      technician.currentWorkload = Math.min(0.95, technician.currentWorkload + 0.05);
    }

    console.log(`✅ Cita confirmada: ${technicianId} - ${date} ${timeSlot}`);

    return {
      success: true,
      appointmentId: appointmentKey,
      technician: technician.name,
      confirmationCode: this.generateConfirmationCode()
    };
  }

  // Simular delay del sistema
  async simulateSystemDelay() {
    const delay = this.getRandomBetween(500, 1500); // 0.5 a 1.5 segundos
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Generar código de confirmación
  generateConfirmationCode() {
    return 'DG' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Obtener número aleatorio entre min y max
  getRandomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Obtener estadísticas del sistema
  getSystemStats() {
    const totalSlots = this.technicians.length * 5 * 4; // técnicos × días × slots por día
    const occupiedSlots = this.scheduledAppointments.size;
    
    return {
      totalTechnicians: this.technicians.length,
      totalSlots,
      occupiedSlots,
      availabilityRate: ((totalSlots - occupiedSlots) / totalSlots * 100).toFixed(1),
      averageWorkload: (this.technicians.reduce((sum, tech) => sum + tech.currentWorkload, 0) / this.technicians.length * 100).toFixed(1),
      lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
    };
  }

  // Obtener información detallada para demo
  getDemoData() {
    return {
      technicians: this.technicians.map(tech => ({
        ...tech,
        workload: Math.round(tech.currentWorkload * 100) + '%',
        efficiency: Math.round(tech.efficiency * 100) + '%'
      })),
      stats: this.getSystemStats(),
      recentAppointments: Array.from(this.scheduledAppointments.values())
        .filter(apt => apt.status === 'confirmada')
        .slice(-5)
    };
  }
}

module.exports = TechnicianScheduler; 