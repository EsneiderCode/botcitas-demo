// Configuración de ElevenLabs para generar audio del bot
// IMPORTANTE: Reemplaza estos valores con tus credenciales reales

const ELEVENLABS_CONFIG = {
    // Tu API Key de ElevenLabs - Obténla en: https://elevenlabs.io/app/settings/api-keys
    apiKey: 'TU_ELEVENLABS_API_KEY_AQUI',
    
    // ID de la voz por defecto (se usará si no se detecta idioma)
    voiceId: 'zl7GSCFv2aKISCB2LjZz', // Voz alemana por defecto
    
    // Configuración de la voz
    voiceSettings: {
        stability: 0.5,        // Estabilidad de la voz (0.0 - 1.0)
        similarity_boost: 0.5, // Similitud con la voz original (0.0 - 1.0)
        style: 0.0,            // Estilo de la voz (0.0 - 1.0)
        use_speaker_boost: true // Mejora del altavoz
    },
    
    // URL base de la API
    baseURL: 'https://api.elevenlabs.io/v1'
};

const VOICES_LANGUAGE = {
    'es': 'VmejBeYhbrcTPwDniox7',
    'en': 'G17SuINrv2H9FC6nvetn',
    'de': 'zl7GSCFv2aKISCB2LjZz'
};

// Voces disponibles (para referencia)
const AVAILABLE_VOICES = {
    'VmejBeYhbrcTPwDniox7': 'Voz Española',
    'G17SuINrv2H9FC6nvetn': 'Voz Inglesa',
    'zl7GSCFv2aKISCB2LjZz': 'Voz Alemana'
};


// Función para validar la configuración
function validateElevenLabsConfig() {
    if (!ELEVENLABS_CONFIG.apiKey || ELEVENLABS_CONFIG.apiKey === 'TU_ELEVENLABS_API_KEY_AQUI') {
        console.error('❌ ERROR: Debes configurar tu API Key de ElevenLabs');
        console.log('📝 Pasos para configurar:');
        console.log('1. Ve a https://elevenlabs.io/app/settings/api-keys');
        console.log('2. Crea una nueva API Key');
        console.log('3. Reemplaza "TU_ELEVENLABS_API_KEY_AQUI" con tu API Key real');
        console.log('4. Recarga la página');
        return false;
    }
    return true;
}

// Función para obtener información de la voz actual
function getCurrentVoiceInfo() {
    const voiceId = ELEVENLABS_CONFIG.voiceId;
    return AVAILABLE_VOICES[voiceId] || 'Voz desconocida';
}

// Función para cambiar la voz
function setVoice(voiceId) {
    if (AVAILABLE_VOICES[voiceId]) {
        ELEVENLABS_CONFIG.voiceId = voiceId;
        console.log(`✅ Voz cambiada a: ${AVAILABLE_VOICES[voiceId]}`);
        return true;
    } else {
        console.error(`❌ Voz no válida: ${voiceId}`);
        return false;
    }
}

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ELEVENLABS_CONFIG, 
        VOICES_LANGUAGE,
        AVAILABLE_VOICES, 
        validateElevenLabsConfig, 
        getCurrentVoiceInfo, 
        setVoice 
    };
} else {
    window.ELEVENLABS_CONFIG = ELEVENLABS_CONFIG;
    window.VOICES_LANGUAGE = VOICES_LANGUAGE;
    window.AVAILABLE_VOICES = AVAILABLE_VOICES;
    window.validateElevenLabsConfig = validateElevenLabsConfig;
    window.getCurrentVoiceInfo = getCurrentVoiceInfo;
    window.setVoice = setVoice;
}
