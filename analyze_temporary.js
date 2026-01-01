
import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';

async function analyzeHere() {
    try {
        const buf = await readFile('c:\\Users\\shoai\\OneDrive\\Desktop\\hostel--feat-professional-enhancements-final\\Individual Register 2025-2026.xlsx');
        const wb = XLSX.read(buf, { type: 'buffer' });

        console.log('Sheet Names:', wb.SheetNames);

        for (const sheetName of wb.SheetNames) {
            const sheet = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            console.log(`--- Sheet: ${sheetName} ---`);

            // Scan specifically for "Temporary" keyword in first 20 columns of firs 50 rows
            let tempFound = false;
            rows.slice(0, 50).forEach((row, rowIndex) => {
                const rowStr = JSON.stringify(row).toLowerCase();
                if (rowStr.includes('temporary')) {
                    console.log(`Found "Temporary" at Row ${rowIndex}:`, row);
                    tempFound = true;
                }
            });

            if (!tempFound) console.log('No "Temporary" keyword found in first 50 rows.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

analyzeHere();
