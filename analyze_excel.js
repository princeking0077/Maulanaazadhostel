
import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';

async function analyze() {
    try {
        const buf = await readFile('c:\\Users\\shoai\\OneDrive\\Desktop\\hostel--feat-professional-enhancements-final\\Individual Register 2025-2026.xlsx');
        const wb = XLSX.read(buf, { type: 'buffer' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // header is usually row 4 (index 4) based on previous check
        const headerRowIndex = 4; // "Sr.No"
        const dataRows = rows.slice(headerRowIndex + 1);

        const classes = new Set();
        const missingData = [];
        let totalRows = 0;

        dataRows.forEach((row, i) => {
            const srNo = row[0];
            const nameMobile = row[1];
            const wingRoom = row[2];
            const className = row[3]; // "Class" column

            // Only count valid student rows (has SrNo and Name)
            if (srNo && nameMobile) {
                totalRows++;
                if (className) classes.add(className.toString().trim());

                // Check for missing items
                const missing = [];
                if (!className) missing.push('Class');
                if (!wingRoom) missing.push('Wing/Room');

                if (missing.length > 0) {
                    missingData.push({ row: i + headerRowIndex + 2, name: nameMobile, missing });
                }
            }
        });

        console.log('Total Student Rows:', totalRows);
        console.log('Unique Classes Found:', Array.from(classes));
        console.log('Rows with Missing Data:', JSON.stringify(missingData, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

analyze();
