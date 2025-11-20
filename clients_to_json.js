#!/usr/bin/env node
/**
 * Скрипт для конвертации clients_all.xlsx в JSON файл.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function clientsToJson(inputFile, outputFile = null) {
    // Проверяем существование входного файла
    if (!fs.existsSync(inputFile)) {
        console.error(`Ошибка: Файл ${inputFile} не найден.`);
        process.exit(1);
    }

    // Определяем выходной файл
    let outputPath;
    if (outputFile) {
        outputPath = outputFile;
    } else {
        const inputPath = path.parse(inputFile);
        outputPath = path.join(inputPath.dir, 'clients_all.json');
    }

    try {
        // Читаем Excel файл
        const workbook = XLSX.readFile(inputFile, { cellDates: true });

        let result;

        // Если в файле несколько листов, создаём структуру с листами
        if (workbook.SheetNames.length > 1) {
            result = {};
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                // Конвертируем лист в JSON (массив объектов)
                result[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false, // Конвертируем даты и числа в строки для JSON
                    defval: null // Значение по умолчанию для пустых ячеек
                });
            });
        } else {
            // Если один лист, читаем его напрямую
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            result = XLSX.utils.sheet_to_json(worksheet, {
                raw: false,
                defval: null
            });
        }

        // Сохраняем в JSON с красивым форматированием
        fs.writeFileSync(
            outputPath,
            JSON.stringify(result, null, 2),
            'utf8'
        );

        const recordCount = Array.isArray(result)
            ? result.length
            : Object.values(result).reduce((sum, arr) => sum + arr.length, 0);

        console.log(`✓ Успешно конвертировано: ${inputFile} → ${outputPath}`);
        console.log(`  Записей: ${recordCount}`);

    } catch (error) {
        console.error(`Ошибка при конвертации: ${error.message}`);
        process.exit(1);
    }
}

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const inputFile = args[0] || 'clients_all.xlsx';
const outputFile = args[1] || null;

clientsToJson(inputFile, outputFile);

