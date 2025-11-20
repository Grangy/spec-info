#!/usr/bin/env node
/**
 * Простой HTTP сервер для разработки дашборда
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3032;

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

// Функция для парсинга cookies
function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            if (parts.length === 2) {
                cookies[parts[0]] = decodeURIComponent(parts[1]);
            }
        });
    }
    return cookies;
}

// Функция для проверки авторизации
function isAuthorized(cookies) {
    const sessionToken = cookies['dashboard_session'];
    return sessionToken === 'authenticated_2217';
}

const server = http.createServer((req, res) => {
    const method = req.method;
    const urlPath = req.url.split('?')[0];
    
    // Обработка POST запроса для авторизации
    if (method === 'POST' && urlPath === '/login') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const params = new URLSearchParams(body);
                const password = params.get('password');
                
                if (password === '2217') {
                    // Устанавливаем cookie с сессией (24 часа)
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Set-Cookie': 'dashboard_session=authenticated_2217; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({ success: true }), 'utf-8');
                } else {
                    res.writeHead(401, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({ success: false, error: 'Неверный пароль' }), 'utf-8');
                }
            } catch (error) {
                res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ success: false, error: 'Ошибка обработки запроса' }), 'utf-8');
            }
        });
        return;
    }
    
    // Убираем query string и нормализуем путь
    let filePath = '.' + urlPath;
    
    // Если запрос к корню, отдаём index.html
    if (filePath === './' || filePath === './index.html' || urlPath === '/') {
        filePath = './index.html';
    }
    
    // Если запрос к файлам из public, используем правильный путь
    if (urlPath.startsWith('/public/')) {
        filePath = '.' + urlPath;
    }
    
    // Для HTML файлов проверяем авторизацию (кроме public файлов)
    if (filePath === './index.html') {
        const cookies = parseCookies(req.headers.cookie);
        if (!isAuthorized(cookies)) {
            // Отдаем страницу с формой входа
            const loginPage = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8" />
    <title>Авторизация — Дашборд</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="/public/tailwindcss.js"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center">
    <div class="bg-slate-800 rounded-2xl p-8 border border-slate-700 max-w-md w-full mx-4">
        <div class="text-center mb-6">
            <div class="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center font-semibold text-slate-900 mx-auto mb-4">
                S
            </div>
            <h1 class="text-2xl font-semibold mb-2">Дашборд продаж</h1>
            <p class="text-sm text-slate-400">Введите пароль для доступа</p>
        </div>
        <form id="loginForm" class="space-y-4">
            <div>
                <label class="block text-sm text-slate-400 mb-2">Пароль</label>
                <input
                    type="password"
                    id="passwordInput"
                    maxlength="4"
                    pattern="[0-9]{4}"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••"
                    autocomplete="off"
                    autofocus
                />
            </div>
            <div id="errorMessage" class="text-red-400 text-sm text-center hidden"></div>
            <button
                type="submit"
                class="w-full bg-emerald-500 text-slate-900 font-semibold py-3 rounded-xl hover:bg-emerald-400 transition"
            >
                Войти
            </button>
        </form>
    </div>
    <script>
        const form = document.getElementById('loginForm');
        const passwordInput = document.getElementById('passwordInput');
        const errorMessage = document.getElementById('errorMessage');
        
        // Обработка ввода только цифр
        passwordInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = passwordInput.value;
            
            if (password.length !== 4) {
                showError('Пароль должен содержать 4 цифры');
                return;
            }
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'password=' + encodeURIComponent(password)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = '/';
                } else {
                    showError(data.error || 'Неверный пароль');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                showError('Ошибка подключения к серверу');
            }
        });
        
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            setTimeout(() => {
                errorMessage.classList.add('hidden');
            }, 3000);
        }
        
        passwordInput.focus();
    </script>
</body>
</html>`;
            
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(loginPage, 'utf-8');
            return;
        }
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


