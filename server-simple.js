// Servidor simple para evitar problemas de CORS con OpenAI
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types para diferentes archivos
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Configurar CORS para permitir llamadas a OpenAI
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Determinar la ruta del archivo
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './public/conversations.html';
    }

    // Determinar el tipo de contenido
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    // Leer y servir el archivo
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Archivo no encontrado
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 - No encontrado</title></head>
                        <body>
                            <h1>404 - Archivo no encontrado</h1>
                            <p>El archivo <code>${filePath}</code> no existe.</p>
                            <p><a href="/">Volver al inicio</a></p>
                        </body>
                    </html>
                `);
            } else {
                // Error del servidor
                res.writeHead(500);
                res.end(`Error del servidor: ${error.code}`);
            }
        } else {
            // Archivo encontrado
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📱 Abre: http://localhost:${PORT}/public/conversations.html`);
    console.log(`🛑 Presiona Ctrl+C para detener el servidor`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});
