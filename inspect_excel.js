
import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';

async function inspect() {
    try {
        const buf = await readFile('c:\\Users\\shoai\\OneDrive\\Desktop\\hostel--feat-professional-enhancements-final\\Individual Register 2025-2026.xlsx');
        const wb = XLSX.read(buf, { type: 'buffer' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log('Sheet Name:', sheetName);
        console.log('First 20 rows:');
        rows.slice(0, 20).forEach((row, i) => {
            console.log(`Row ${i}:`, JSON.stringify(row));
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

inspect();
