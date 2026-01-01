import * as XLSX from 'xlsx';
import { db, Student, Payment, ReceiptRegisterEntry } from '../database/db';

export interface ImportSummary {
  success: boolean;
  message: string;
  totalRows: number;
  importedStudents: number;
  importedReceipts: number;
  errors: string[];
}

export interface ImportOptions {
  onProgress?: (phase: string, current: number, total: number) => void;
  createReceipts?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

// Helper to parse dates from various formats (DD.MM.YYYY, etc.)
const parseDate = (value: string): Date => {
  const v = value.trim();
  if (!v) return new Date();

  // Try DD.MM.YYYY or DD/MM/YYYY
  const parts = v.split(/[./-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map(p => parseInt(p, 10));
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      // Handle 2-digit years (e.g. 25 -> 2025)
      const fullYear = y < 100 ? 2000 + y : y;
      return new Date(fullYear, m - 1, d);
    }
  }

  const asNum = Date.parse(v);
  return isNaN(asNum) ? new Date() : new Date(asNum);
};

// Parse "Name, Address, Mobile" string
const parseNameAddressMobile = (input: string): { name: string; address: string; mobile: string } => {
  const parts = input.split(',').map(p => p.trim()).filter(Boolean);

  // Heuristic: Last part is often mobile if it looks like a number
  let mobile = '';
  let name = '';
  let addressParts: string[] = [];

  // Find mobile number (10 digits)
  const mobileIndex = parts.findIndex(p => /^\d{10}$/.test(p) || /^\d{5}\s\d{5}$/.test(p));

  if (mobileIndex !== -1) {
    mobile = parts[mobileIndex].replace(/\s/g, '');
    // Assume everything before mobile is name + address parts
    // Usually first part is name
    if (mobileIndex > 0) {
      name = parts[0];
      addressParts = parts.slice(1, mobileIndex);
      // Add any parts after mobile to address too
      addressParts.push(...parts.slice(mobileIndex + 1));
    } else {
      // Mobile is first? Unlikely but possible
      name = parts[1] || 'Unknown';
      addressParts = parts.slice(2);
    }
  } else {
    // No mobile found, assume first is name, rest address
    name = parts[0] || '';
    addressParts = parts.slice(1);
  }

  return {
    name,
    address: addressParts.join(', '),
    mobile
  };
};

// Parse "Wing-Room" (e.g. "B-07")
const parseWingRoom = (input: string): { wing: Student['wing']; roomNo: string } => {
  const parts = input.split('-');
  const wing = (parts[0] || 'A').trim().toUpperCase() as Student['wing'];
  let roomNo = '';

  if (parts.length > 1) {
    const roomPart = parts[1].trim();
    // Ensure room number is formatted (e.g. B007)
    roomNo = `${wing}${roomPart.padStart(3, '0')}`;
  } else {
    roomNo = `${wing}001`; // Fallback
  }

  return { wing, roomNo };
};

// Parse "01.06.2025 to 01.05.2026"
const parseJoiningDates = (input: string): { joiningDate: Date; endDate?: Date } => {
  const parts = input.split(/ to /i).map(p => p.trim()).filter(Boolean);
  const start = parts[0] ? parseDate(parts[0]) : new Date();
  const end = parts[1] ? parseDate(parts[1]) : undefined;
  return { joiningDate: start, endDate: end };
};

export async function importStudentsFromExcel(file: File, options: ImportOptions = {}): Promise<ImportSummary> {
  const { onProgress, createReceipts = true, skipDuplicates = true, updateExisting = false } = options;
  const errors: string[] = [];
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  let totalRows = 0;
  let importedStudents = 0;
  let importedReceipts = 0;

  // Preload existing duplicates map
  const existingStudents = await db.students.toArray();
  const existingStudentMap = new Map<string, Student>(); // Key: mobile or name+mobile
  existingStudents.forEach(s => {
    if (s.mobile) existingStudentMap.set(s.mobile, s);
    existingStudentMap.set(`${s.name.toLowerCase()}|${s.mobile}`, s);
  });
  const duplicateSet = new Set(existingStudents.map(s => (s.name + '|' + s.mobile).toLowerCase()));

  for (let sheetIndex = 0; sheetIndex < workbook.SheetNames.length; sheetIndex++) {
    const sheetName = workbook.SheetNames[sheetIndex];
    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) continue;

    // Find header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const firstCell = (rows[i][0] || '').toString().toLowerCase();
      if (firstCell.includes('sr') && firstCell.includes('no')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      errors.push(`Sheet "${sheetName}": Header row not found`);
      continue;
    }

    const dataRows = rows.slice(headerRowIndex + 1);
    totalRows += dataRows.length;

    // Group rows by Sr. No.
    // Logic: A new Sr. No indicates a new student. Empty Sr. No rows belong to the previous student.
    const studentGroups: unknown[][][] = [];
    let currentGroup: unknown[][] = [];

    for (const row of dataRows) {
      const srNo = (row[0] || '').toString().trim();

      if (srNo && !isNaN(Number(srNo))) {
        // New student start
        if (currentGroup.length > 0) {
          studentGroups.push(currentGroup);
        }
        currentGroup = [row];
      } else {
        // Continuation of previous student (or empty row)
        // Only add if it has some data (e.g. receipt no)
        const hasData = row.some(cell => cell !== undefined && cell !== null && cell.toString().trim() !== '');
        if (hasData && currentGroup.length > 0) {
          currentGroup.push(row);
        }
      }
    }
    // Push last group
    if (currentGroup.length > 0) {
      studentGroups.push(currentGroup);
    }

    // Process groups
    for (let i = 0; i < studentGroups.length; i++) {
      const group = studentGroups[i];
      const mainRow = group[0] as (string | number | undefined)[];

      try {
        onProgress?.('parsing', i + 1, studentGroups.length);

        // Parse Student Details from Main Row
        const nameAndMobile = (mainRow[1] || '').toString();
        const wingRoomRaw = (mainRow[2] || '').toString();
        const classFaculty = (mainRow[3] || '').toString();
        const joiningDatesRaw = (mainRow[4] || '').toString();

        // These totals are usually on the last row or cumulative, but we'll calculate from payments
        // const totalFeesCollection = Number(mainRow[11] || 0); 
        const approvedAnnualFee = Number(mainRow[12] || 0);
        // const outstandingFee = Number(mainRow[13] || 0);
        const remarkRaw = (mainRow[14] || '').toString();
        const securityDeposit = Number(mainRow[15] || 0);

        const { name, address, mobile } = parseNameAddressMobile(nameAndMobile);
        const { wing, roomNo } = parseWingRoom(wingRoomRaw);
        const { joiningDate, endDate } = parseJoiningDates(joiningDatesRaw);

        // Detect Temporary Status
        const isTemporarySheet = sheetName.toLowerCase().includes('temporary');
        const isTemporaryRow = remarkRaw.toLowerCase().includes('temporary') ||
          classFaculty.toLowerCase().includes('temporary');

        const residencyStatus = (isTemporarySheet || isTemporaryRow) ? 'Temporary' : 'Permanent';

        // Check if student exists
        let studentId: number;
        const studentKey = (name + '|' + mobile).toLowerCase();
        const existingStudent = existingStudentMap.get(mobile) || existingStudentMap.get(studentKey);

        if (existingStudent && existingStudent.id) {
          studentId = existingStudent.id;
          if (updateExisting) {
            // Update existing student details
            await db.students.update(studentId, {
              faculty: classFaculty,
              yearOfCollege: classFaculty, // Store raw class info here
              address,
              wing,
              roomNo,
              // Do NOT overwrite residencyStatus if it was manually set, unless this is clearly a new year import
              // For now, let's update it if the sheet is explicitly "Temporary"
              ...(residencyStatus === 'Temporary' ? { residencyStatus } : {}),
              annualFee: approvedAnnualFee,
              status: 'Active',
              updatedAt: new Date()
            });
          } else {
            // Just skip profile update, but allow payment processing to continue
            // errors.push(`Skipped profile update: ${name}`); 
          }
        } else {
          // Create Student
          const student: Student = {
            name,
            mobile,
            email: '',
            enrollmentNo: `IMP-${Date.now()}-${i}`,
            faculty: classFaculty,
            collegeName: '',
            yearOfCollege: classFaculty,
            address,
            residencyStatus: residencyStatus,
            wing,
            roomNo,
            studentType: 'Hosteller',
            joiningDate,
            annualFee: approvedAnnualFee,
            admissionStatus: 'Active',
            securityDeposit,
            isOldStudent: remarkRaw.toLowerCase().includes('old'),
            status: 'Active',
            remarks: remarkRaw,
            stayEndDate: endDate,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          studentId = await db.students.add(student);
          importedStudents++;
          duplicateSet.add(studentKey);
        }

        // Process Payments (Receipts) for this student
        // Each row in the group might have payment info
        for (const row of group) {
          const r = row as (string | number | undefined)[];
          const receiptNo = (r[5] || '').toString().trim();

          if (receiptNo) {
            const receiptDateStr = (r[6] || '').toString().trim();
            const receiptDate = parseDate(receiptDateStr); // Use helper
            const regFee = Number(r[7] || 0);
            const rentFee = Number(r[8] || 0);
            const waterFee = Number(r[9] || 0);
            const otherFee = Number(r[10] || 0);

            // Calculate row total
            const rowTotal = regFee + rentFee + waterFee + otherFee;

            // Check if receipt already exists to avoid duplication even in update mode
            const existingReceipt = await db.payments.where('receiptNo').equals(receiptNo).first();

            if (createReceipts && !existingReceipt) {
              const payment: Payment = {
                studentId,
                receiptNo,
                date: receiptDate,
                registrationFee: regFee,
                rentFee: rentFee,
                waterFee: waterFee,
                gymFee: 0,
                otherFee: otherFee,
                totalAmount: rowTotal,
                balanceAmount: 0,
                paymentStatus: 'Paid',
                paymentMethod: 'Cash', // Default
                cashier: 'Import',
                createdAt: new Date()
              };
              await db.payments.add(payment);
              importedReceipts++;

              // ADD: Sync to Receipt Register
              // receiptRegister schema: id, date, receiptNo, name, year, rent, electricity, securityDeposit, 
              // anyOther, registrationFees, totalAmount, modeOfTransaction, collegeName, faculty
              try {
                // Ensure strict type compatibility with ReceiptRegisterEntry
                await db.receiptRegister.add({
                  date: receiptDate, // Must be Date object
                  receiptNo: receiptNo,
                  name: name,
                  studentId: studentId,
                  year: classFaculty,
                  collegeYear: classFaculty,
                  rent: rentFee,
                  electricity: waterFee,
                  securityDeposit: 0,
                  anyOther: otherFee,
                  registrationFees: regFee,
                  totalAmount: rowTotal,
                  modeOfTransaction: 'Cash', // Typed literal
                  collegeName: '',
                  faculty: classFaculty,
                  createdAt: new Date()
                });
              } catch (err) {
                console.warn('Failed to sync to receipt register', err);
              }
            }
          }
        }

        // Calculate Aggregates for Dashboard (StudentFees table)
        // 1. Get all payments for this student newly added and existing (if any)
        const allPayments = await db.payments.where('studentId').equals(studentId).toArray();
        const totalPaid = allPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const pendingAmount = Math.max(0, approvedAnnualFee - totalPaid);

        let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
        if (totalPaid >= approvedAnnualFee) status = 'Paid';
        else if (totalPaid > 0) status = 'Partially Paid';

        // Current Academic Year Label (e.g., 2025-26)
        // Current Academic Year Label (e.g., 2025-26)
        // FIX: Use the system's current year logic to ensure it matches Dashboard.
        // Dashboard uses: const yr = new Date().getFullYear(); return `${yr}-${String(yr + 1).slice(2)}`;
        const currentYearLabel = (() => {
          const dashYear = new Date().getFullYear();
          return `${dashYear}-${String(dashYear + 1).slice(2)}`;
        })();

        // Update or Add StudentFee record
        const existingFee = await db.studentFees.where('studentId').equals(studentId).and(f => f.academicYear === currentYearLabel).first();

        if (existingFee && existingFee.id) {
          await db.studentFees.update(existingFee.id, {
            totalFee: approvedAnnualFee,
            paidAmount: totalPaid,
            pendingAmount: pendingAmount,
            status: status,
            updatedAt: new Date()
          });
        } else {
          await db.studentFees.add({
            studentId,
            academicYear: currentYearLabel,
            totalFee: approvedAnnualFee,
            paidAmount: totalPaid,
            pendingAmount: pendingAmount,
            status: status,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error processing student at row ${i}: ${msg}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    message: `Imported ${importedStudents} students and ${importedReceipts} receipts.`,
    totalRows,
    importedStudents,
    importedReceipts,
    errors
  };
}

export function createExcelTemplate(): XLSX.WorkBook {
  // Keep existing template logic or update if needed
  const wsData = [
    ['Sr.No', 'Name of Student & Mobile', 'Wing & Room', 'Class', 'Date of Joining', 'Receipt No.', 'Receipt Date', 'Regi. Fee', 'Room Rent', 'Water & Electricity Charges', 'Other Activity', 'Total Fees Collection', 'Approved Hostel Fees', 'Outstanding Fee', 'Remark', 'Security Deposit'],
    ['1', 'John Doe, City, 9999999999', 'A-01', 'BSc I', '01.06.2025', 'R001', '01.06.2025', '5000', '10000', '0', '0', '15000', '50000', '35000', '', '2000'],
    ['', '', '', '', '', 'R002', '01.07.2025', '0', '5000', '0', '0', '5000', '', '', '', '']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  return wb;
}

export function downloadTemplate(filename = 'hostel-import-template.xlsx') {
  const wb = createExcelTemplate();
  XLSX.writeFile(wb, filename);
}
