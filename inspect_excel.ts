
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'c:\\Users\\shoai\\OneDrive\\Desktop\\hostel--feat-professional-enhancements-final\\Individual Register 2025-2026.xlsx';

try {
    const buf = fs.readFileSync(filePath);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('Sheet Name:', sheetName);
    console.log('First 5 rows:');
    console.log(JSON.stringify(rows.slice(0, 5), null, 2));
} catch (error) {
    console.error('Error reading file:', error);
}
