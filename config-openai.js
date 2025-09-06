// Configuración de OpenAI para el bot de WhatsApp
// IMPORTANTE: Reemplaza estos valores con tus credenciales reales

const OPENAI_CONFIG = {
    // Tu API Key de OpenAI - Obténla en: https://platform.openai.com/api-keys
    // Puedes usar variables de entorno o configurar directamente aquí
    apiKey: process.env.OPENAI_API_KEY || 'TU_API_KEY_AQUI',
    
    // Modelo a usar (recomendado: gpt-4o-mini para mejor precio/rendimiento)
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    
    // Máximo de tokens por respuesta (ajusta según necesites)
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
    
    // Temperatura para creatividad (0.0 = muy determinístico, 1.0 = muy creativo)
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    
    // URL base de la API (no cambiar a menos que uses un proxy)
    baseURL: 'https://api.openai.com/v1'
};

// Función para validar la configuración
function validateOpenAIConfig() {
    if (!OPENAI_CONFIG.apiKey || OPENAI_CONFIG.apiKey === 'TU_API_KEY_AQUI') {
        console.error('❌ ERROR: Debes configurar tu API Key de OpenAI');
        console.log('📝 Pasos para configurar:');
        console.log('1. Ve a https://platform.openai.com/api-keys');
        console.log('2. Crea una nueva API Key');
        console.log('3. Reemplaza "TU_API_KEY_AQUI" con tu API Key real');
        console.log('4. Recarga la página');
        return false;
    }
    return true;
}

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OPENAI_CONFIG, validateOpenAIConfig };
} else {
    window.OPENAI_CONFIG = OPENAI_CONFIG;
    window.validateOpenAIConfig = validateOpenAIConfig;
}
