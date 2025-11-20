#!/bin/bash
# Скрипт для запуска ngrok туннеля

echo "🚀 Запуск ngrok туннеля для порта 3000..."
echo ""

# Проверяем, запущен ли уже ngrok
if pgrep -f "ngrok http 3000" > /dev/null; then
    echo "⚠️  ngrok уже запущен!"
    echo "🌐 Публичный URL можно посмотреть на: http://localhost:4040"
    exit 1
fi

# Запускаем ngrok
ngrok http 3000 --log=stdout &
NGROK_PID=$!

echo "⏳ Ожидание запуска ngrok..."
sleep 3

# Получаем публичный URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data = json.load(sys.stdin); tunnels = data.get('tunnels', []); print([t.get('public_url') for t in tunnels if t.get('proto') == 'https'][0] if tunnels else '')" 2>/dev/null)

if [ -n "$PUBLIC_URL" ]; then
    echo ""
    echo "✅ ngrok запущен успешно!"
    echo "🌐 Публичный URL: $PUBLIC_URL"
    echo "📊 Веб-интерфейс ngrok: http://localhost:4040"
    echo ""
    echo "💡 Откройте в браузере: $PUBLIC_URL"
    echo ""
    echo "Для остановки нажмите Ctrl+C или выполните: kill $NGROK_PID"
else
    echo "❌ Не удалось получить публичный URL"
    echo "Проверьте логи ngrok"
fi

