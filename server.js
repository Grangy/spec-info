#!/usr/bin/env node
/**
 * Простой HTTP сервер для разработки дашборда
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Убираем query string и нормализуем путь
    let filePath = '.' + req.url.split('?')[0];
    
    // Если запрос к корню, отдаём index.html
    if (filePath === './' || filePath === './index.html') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500, {
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // Добавляем заголовки для работы по локальной сети
            const headers = {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            
            // Для HTML файлов добавляем заголовки безопасности
            if (contentType === 'text/html') {
                headers['X-Content-Type-Options'] = 'nosniff';
                headers['X-Frame-Options'] = 'SAMEORIGIN';
            }
            
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

// Получаем локальный IP адрес
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Пропускаем внутренние и не-IPv4 адреса
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const LOCAL_IP = getLocalIP();

// Слушаем на всех интерфейсах (0.0.0.0) для доступа по локальной сети
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Сервер запущен!`);
    console.log(`📊 Локальный доступ: http://localhost:${PORT}`);
    console.log(`🌐 Сетевой доступ: http://${LOCAL_IP}:${PORT}`);
    console.log(`\n💡 Для доступа с других устройств используйте: http://${LOCAL_IP}:${PORT}`);
    console.log(`\nДля остановки нажмите Ctrl+C\n`);
});


