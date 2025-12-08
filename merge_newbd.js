#!/usr/bin/env node
/**
 * Скрипт для объединения всех xlsx файлов из папки newbd в одну БД
 * и добавления полей "время" и "сайт"
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const newbdPath = path.join(__dirname, 'newbd');
const outputJsonPath = path.join(__dirname, 'orders_new.json');
const outputXlsxPath = path.join(__dirname, 'orders_new.xlsx');

console.log('Начинаем объединение файлов...\n');

// Получаем все xlsx файлы и сортируем
const files = fs.readdirSync(newbdPath)
    .filter(f => f.endsWith('.xlsx'))
    .sort((a, b) => {
        // Сортируем по номеру месяца: 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12
        const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0');
        return numA - numB;
    });

console.log(`Найдено файлов: ${files.length}`);
files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
console.log('');

let allOrders = [];
let totalProcessed = 0;

// Обрабатываем каждый файл
files.forEach((file, index) => {
    const filePath = path.join(newbdPath, file);
    console.log(`[${index + 1}/${files.length}] Обработка: ${file}`);
    
    try {
        const workbook = XLSX.readFile(filePath, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Конвертируем в JSON
        const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: null
        });
        
        console.log(`  Загружено строк: ${data.length}`);
        
        // Обрабатываем каждую строку
        const processedData = data.map(row => {
            // Создаем новый объект с нужными полями
            const order = {
                'Номер': row['Номер'],
                'Дата': row['Дата'],
                'Дата_1': row['Дата_1'],
                'Сумма': row['Сумма'],
                'Клиент': row['Клиент'],
                'Текущее состояние': row['Текущее состояние'],
                'Менеджер': row['Менеджер'],
                'Комментарий': row['Комментарий'],
                'Бизнес регион': row['Бизнес регион'],
                'Ссылка': row['Ссылка'],
                'НомерЗаказаСайт (Список заказов клиентов)': row['НомерЗаказаСайт (Список заказов клиентов)'],
                // Добавляем новые поля
                'время': row['Дата_1'] || null,
                'сайт': !!(row['НомерЗаказаСайт (Список заказов клиентов)'] && 
                           row['НомерЗаказаСайт (Список заказов клиентов)'].toString().trim() !== '')
            };
            
            return order;
        });
        
        allOrders = allOrders.concat(processedData);
        totalProcessed += data.length;
        
        console.log(`  ✓ Обработано: ${data.length} строк\n`);
        
    } catch (error) {
        console.error(`  ✗ Ошибка при обработке файла ${file}: ${error.message}`);
    }
});

console.log(`\n=== Итоги ===`);
console.log(`Всего обработано файлов: ${files.length}`);
console.log(`Всего заказов: ${totalProcessed}`);
console.log(`Уникальных заказов: ${new Set(allOrders.map(o => o['Номер'])).size}`);

// Сохраняем в JSON
console.log(`\nСохранение в JSON: ${outputJsonPath}`);
fs.writeFileSync(
    outputJsonPath,
    JSON.stringify(allOrders, null, 2),
    'utf8'
);
console.log(`✓ JSON файл сохранен (${(fs.statSync(outputJsonPath).size / 1024 / 1024).toFixed(2)} MB)`);

// Сохраняем в XLSX
console.log(`\nСохранение в XLSX: ${outputXlsxPath}`);
const newWorkbook = XLSX.utils.book_new();
const newWorksheet = XLSX.utils.json_to_sheet(allOrders);
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Заказы');
XLSX.writeFile(newWorkbook, outputXlsxPath);
console.log(`✓ XLSX файл сохранен (${(fs.statSync(outputXlsxPath).size / 1024 / 1024).toFixed(2)} MB)`);

// Статистика по полю "сайт"
const siteOrders = allOrders.filter(o => o['сайт'] === true).length;
console.log(`\n=== Статистика ===`);
console.log(`Заказов с сайта: ${siteOrders} (${(siteOrders / totalProcessed * 100).toFixed(2)}%)`);
console.log(`Заказов без сайта: ${totalProcessed - siteOrders} (${((totalProcessed - siteOrders) / totalProcessed * 100).toFixed(2)}%)`);

console.log(`\n✓ Готово!`);

