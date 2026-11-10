/**
 * Exports table rows to a CSV file that the browser downloads.
 * Columns are described as { header, value } where value receives a row and returns the cell content.
 * The file starts with a UTF-8 BOM so Excel shows accents (á, ñ) correctly, and uses ';' as separator,
 * which is the one Excel expects with the Spanish (Peru) regional settings.
 */
export class CsvExporter {

    static SEPARATOR = ';';

    static toCsv(columns, rows) {
        const header = columns.map(column => CsvExporter.escape(column.header));
        const lines = rows.map(row => columns.map(column => CsvExporter.escape(column.value(row))));
        return [header, ...lines].map(cells => cells.join(CsvExporter.SEPARATOR)).join('\r\n');
    }

    static escape(value) {
        const text = value === null || value === undefined ? '' : String(value);
        return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }

    static download(fileName, columns, rows) {
        const blob = new Blob(['﻿', CsvExporter.toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
}
