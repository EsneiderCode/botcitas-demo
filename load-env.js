// Cargador de variables de entorno para el navegador
// Este archivo carga las variables de entorno desde el archivo .env

// Función para cargar variables de entorno desde un archivo .env
async function loadEnvVariables() {
    try {
        // Intentar cargar el archivo .env
        const response = await fetch('.env');
        if (!response.ok) {
            console.log('📝 Archivo .env no encontrado, usando configuración por defecto');
            return;
        }
        
        const envText = await response.text();
        const envLines = envText.split('\n');
        
        // Parsear las variables de entorno
        envLines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split('=');
                if (key && value) {
                    // Configurar las variables globalmente
                    window[`ENV_${key}`] = value;
                    
                    // También configurar en process.env si está disponible
                    if (typeof process !== 'undefined' && process.env) {
                        process.env[key] = value;
                    }
                }
            }
        });
        
        console.log('✅ Variables de entorno cargadas desde .env');
        
    } catch (error) {
        console.log('📝 No se pudo cargar .env, usando configuración por defecto:', error.message);
    }
}

// Función para obtener una variable de entorno
function getEnvVar(key, defaultValue = null) {
    // Primero intentar desde window
    if (window[`ENV_${key}`]) {
        return window[`ENV_${key}`];
    }
    
    // Luego intentar desde process.env
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    
    // Finalmente usar el valor por defecto
    return defaultValue;
}

// Exportar funciones para uso global
window.loadEnvVariables = loadEnvVariables;
window.getEnvVar = getEnvVar;

// Auto-cargar cuando se ejecute el script
if (typeof window !== 'undefined') {
    loadEnvVariables();
}
