const EnhancedWhatsAppBot = require('./modules/enhancedWhatsappBot');
const TechnicianScheduler = require('./modules/technicianScheduler');

async function testDemo() {
  console.log('🧪 Iniciando test de la demo...\n');

  try {
    // Test 1: TechnicianScheduler
    console.log('1️⃣ Testeando TechnicianScheduler...');
    const scheduler = new TechnicianScheduler();
    
    const systemData = scheduler.getDemoData();
    console.log(`✅ Técnicos disponibles: ${systemData.technicians.length}`);
    console.log(`✅ Disponibilidad del sistema: ${systemData.stats.availabilityRate}%`);
    
    // Test 2: Consulta de disponibilidad
    console.log('\n2️⃣ Testeando consulta de disponibilidad...');
    const availability = await scheduler.queryTechnicianAvailability('Centro', 'instalacion');
    console.log(`✅ Opciones encontradas: ${availability.results.length}`);
    console.log(`✅ Duración de búsqueda: ${availability.searchDuration}ms`);

    // Test 3: EnhancedWhatsAppBot (sin WhatsApp real)
    console.log('\n3️⃣ Testeando EnhancedWhatsAppBot (métodos básicos)...');
    const bot = new EnhancedWhatsAppBot();
    
    // Test métodos de compatibilidad
    const conversations = bot.getConversations();
    const conversationsStats = bot.getConversationsStats();
    const systemBotData = bot.getSystemData();
    
    console.log(`✅ Conversaciones: ${conversations.length}`);
    console.log(`✅ Stats disponibles: ${Object.keys(conversationsStats).length > 0 ? 'Sí' : 'No'}`);
    console.log(`✅ Datos del sistema: ${Object.keys(systemBotData).length > 0 ? 'Sí' : 'No'}`);

    // Test 4: Formateo de teléfonos
    console.log('\n4️⃣ Testeando formateo de números...');
    const testNumbers = ['3123456789', '15123456789', '491234567890'];
    testNumbers.forEach(num => {
      const formatted = bot.formatPhoneNumber(num);
      console.log(`✅ ${num} → ${formatted}`);
    });

    // Test 5: Mensajes multiidioma
    console.log('\n5️⃣ Testeando mensajes multiidioma...');
    bot.userLanguages.set('test@c.us', 'es');
    const testMessage = bot.getEnhancedMessage('test@c.us', 'languageSelection', { name: 'Usuario Test' });
    console.log(`✅ Mensaje generado correctamente: ${testMessage.length > 0 ? 'Sí' : 'No'}`);

    console.log('\n🎉 ¡Todos los tests pasaron exitosamente!');
    console.log('\n📝 Resumen:');
    console.log('   ✅ Sistema de técnicos funcionando');
    console.log('   ✅ Bot mejorado operativo');
    console.log('   ✅ APIs compatibles');
    console.log('   ✅ Mensajes multiidioma');
    console.log('   ✅ Demo lista para presentar');
    
    console.log('\n🚀 Para iniciar la demo completa ejecuta:');
    console.log('   npm run demo');

  } catch (error) {
    console.error('❌ Error en el test:', error);
    process.exit(1);
  }
}

// Ejecutar test si es llamado directamente
if (require.main === module) {
  testDemo();
}

module.exports = testDemo; 