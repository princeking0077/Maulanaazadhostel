const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('Individual Register 2025-2026.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON without headers
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Find the header row and extract student data
let students = [];
let foundHeader = false;

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  
  // Look for the header row
  if (row[0] === 'Sr.No' || (row[0] && String(row[0]).includes('Sr.No'))) {
    foundHeader = true;
    continue;
  }
  
  // Skip until we find the header
  if (!foundHeader) continue;
  
  // Parse student data rows (rows with a number in first column)
  if (row[0] && typeof row[0] === 'number' && row[1]) {
    const student = {
      srNo: row[0],
      nameAndMobile: row[1] || '',
      wingRoom: row[2] || '',
      class: row[3] || '',
      dateOfJoining: row[4] || '',
      receiptNo: row[5] || '',
      receiptDate: row[6] || '',
      regFee: row[7] || 0,
      roomRent: row[8] || 0,
      waterElectricity: row[9] || 0,
      otherActivity: row[10] || 0,
      totalFees: row[11] || 0,
      approvedFees: row[12] || 0,
      outstandingFee: row[13] || 0,
      remark: row[14] || '',
      securityDeposit: row[15] || 0
    };
    
    students.push(student);
  }
}

console.log(JSON.stringify(students, null, 2));
console.log('\n\nTotal Students Found:', students.length);
