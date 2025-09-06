# 🔐 Configuración de Variables de Entorno (.env)

## 📋 Instrucciones de Configuración

### 1. Crear el archivo .env

Copia el archivo de plantilla y renómbralo:

```bash
cp env.example .env
```

### 2. Configurar tus API Keys

Edita el archivo `.env` y reemplaza los placeholders:

```bash
# .env
OPENAI_API_KEY=sk-proj-tu-api-key-real-aqui
ELEVENLABS_API_KEY=sk_tu-api-key-real-aqui
```

### 3. Obtener las API Keys

#### OpenAI API Key:
1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Inicia sesión en tu cuenta
3. Haz clic en "Create new secret key"
4. Copia la API Key generada
5. Pégala en tu archivo `.env`

#### ElevenLabs API Key:
1. Ve a [https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
2. Inicia sesión en tu cuenta
3. Haz clic en "Create new API key"
4. Copia la API Key generada
5. Pégala en tu archivo `.env`

### 4. Configuración Opcional

Puedes ajustar otros parámetros en el `.env`:

```bash
# OpenAI
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# ElevenLabs
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY_BOOST=0.5
ELEVENLABS_STYLE=0.0
ELEVENLABS_USE_SPEAKER_BOOST=true
```

## 🚀 Uso

### Opción 1: Servidor Local con Node.js
```bash
npm install
npm start
```

### Opción 2: Servidor HTTP Simple
```bash
python3 -m http.server 8000
# O usa: ./start-server.sh
```

### Opción 3: Cargar en el Navegador
Incluye el script `load-env.js` en tu HTML:

```html
<script src="load-env.js"></script>
<script src="config-openai.js"></script>
<script src="config-elevenlabs.js"></script>
```

## ⚠️ Seguridad

- **NUNCA** subas el archivo `.env` a GitHub
- **NUNCA** compartas tus API Keys
- **SIEMPRE** usa el archivo `.env` para credenciales
- El archivo `.env` está en `.gitignore` por seguridad

## 🔧 Troubleshooting

### Error: "API Key no configurada"
- Verifica que el archivo `.env` existe
- Verifica que las API Keys están correctamente configuradas
- Verifica que no hay espacios extra en las API Keys

### Error: "CORS" en el navegador
- Usa un servidor local (no abras el archivo directamente)
- Ejecuta `python3 -m http.server 8000`
- Abre `http://localhost:8000/public/conversations.html`

### Error: "ElevenLabs API error"
- Verifica que tu API Key de ElevenLabs es válida
- Verifica que tienes caracteres disponibles en tu cuenta
- Verifica que la voz ID existe

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica tu archivo `.env`
3. Consulta la documentación de las APIs
4. Verifica que tienes créditos disponibles
