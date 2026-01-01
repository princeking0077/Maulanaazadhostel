import Dexie, { Table } from 'dexie';

// Database Models
export interface Student {
  id?: number;
  name: string;
  mobile: string;
  email: string;
  enrollmentNo: string;
  enrollmentNumber?: string; // alias for import compatibility
  faculty: string;
  collegeName: string;
  yearOfCollege: string;
  address: string;
  residencyStatus: 'Permanent' | 'Temporary';
  wing: 'A' | 'B' | 'C' | 'D';
  roomNo: string;
  studentType: 'Permanent' | 'Temporary' | 'PhD' | 'Non-Hosteller' | 'Day Scholar' | 'Hosteller';
  joiningDate: Date;
  annualFee: number;
  admissionStatus?: 'Active' | 'Cancelled';
  securityDeposit?: number;
  isOldStudent?: boolean;
  status?: 'Active' | 'Vacated' | 'Inactive';
  vacatedDate?: Date;
  remarks?: string;
  // Placeholder student support (quick payment before full registration)
  isPlaceholder?: boolean; // true if created via Quick Payment workflow
  placeholderRef?: string; // human-friendly temporary reference
  convertedAt?: Date; // timestamp when placeholder was converted to full record
  // Temporary student specific fields
  stayDuration?: string; // e.g., "3 months", "6 months", "1 year"
  stayEndDate?: Date; // calculated or manually set end date
  customAmount?: number; // manual amount for temporary students
  customMonthlyAmount?: number; // alias for import compatibility
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id?: number;
  studentId: number;
  receiptNo: string;
  date: Date;
  registrationFee: number;
  rentFee: number;
  waterFee: number;
  gymFee: number;
  otherFee: number;
  securityDeposit?: number;
  electricityFee?: number;
  messVegFee?: number;
  messNonVegFee?: number;
  canteenFee?: number;
  xeroxFee?: number;
  totalAmount: number;
  balanceAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  utrNo?: string;
  paymentMethod: 'Cash' | 'Online' | 'Cheque';
  cashier: string;
  // Extended fields (added for unified management filtering/export)
  academicYear?: string; // e.g. '2025-2026'
  paymentType?: 'Full Payment' | 'Installment';
  installmentNo?: number; // if paymentType === 'Installment'
  createdAt: Date;
}

// Per-academic-year student snapshot (to retain multi-year course history)
export interface StudentYearRecord {
  id?: number;
  studentId: number;
  academicYearStart: number; // e.g. 2025
  academicYearEnd: number;   // e.g. 2026
  yearLabel: string;         // "2025-26"
  wing: 'A' | 'B' | 'C' | 'D';
  roomNo: string;
  annualFee: number;
  status: 'Active' | 'Vacated' | 'Cancelled' | 'Inactive';
  remarks?: string;
  createdAt: Date;
}

export interface Room {
  id?: number;
  roomNumber: string;
  wing: 'A' | 'B' | 'C' | 'D';
  capacity: number;
  currentOccupancy: number;
  isActive: boolean;
}

export interface User {
  id?: number;
  username: string;
  password: string;
  role: 'Admin' | 'Staff';
  name: string;
  email: string;
  createdAt: Date;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
  description?: string;
}

// Administration facility transactions (not per-student)
export interface BillingItem {
  description: string;
  qty: number;
  rate: number;
  gstPercent?: number;
  amount: number; // qty * rate (excluding GST)
}

export interface FacilityTransaction {
  id?: number;
  facility: 'Mess' | 'Canteen' | 'Xerox' | 'Tenders' | 'Faculty Loan';
  txnType: 'Income' | 'Expense';
  date: Date;
  amount: number; // historically total; keep as netAmount for aggregates
  partyName: string; // Vendor/tenant/supplier name
  faculty?: string; // Faculty/Department name for categorization
  academicYear?: string; // Academic year (e.g., '2025-2026')
  description?: string; // Notes, invoice details
  receiptNo?: string; // Generated if needed
  billNo?: string; // Optional separate bill number/series
  paymentMethod?: 'Cash' | 'Online' | 'Cheque';
  paymentRef?: string; // UTR/Cheque no/invoice no
  // Itemized billing support
  items?: BillingItem[];
  subtotal?: number;
  gstPercent?: number; // summary GST percent if uniform
  gstAmount?: number;  // total GST amount
  netAmount?: number;  // subtotal + gstAmount
  paidAmount?: number;
  balanceAmount?: number;
  // Category-specific metadata
  utilityType?: 'Rent' | 'Electricity' | 'Water';
  periodFrom?: Date;
  periodTo?: Date;
  meterUnits?: number; // electricity/water units
  workerRole?: string; // for worker payments
  createdAt: Date;
  updatedAt: Date;
}


// Petty Cash transactions
export interface PettyCashTransaction {
  id?: number;
  date: Date;
  receiptNo: string;
  description: string;
  category: string; // e.g., 'Office Supplies', 'Utilities', 'Maintenance'
  amount: number;
  academicYear?: string; // Academic year (e.g., '2025-2026')
  paymentMethod: 'Cash' | 'Online' | 'Cheque';
  paymentRef?: string; // UTR/Cheque no
  approvedBy?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Receipt Register entries (auto-saved from receipt creation)
export interface ReceiptRegisterEntry {
  id?: number;
  date: Date;
  receiptNo: string;
  studentId?: number;
  name: string;
  year: string;
  collegeName: string;
  faculty: string;
  collegeYear: string;
  rent: number;
  electricity: number;
  securityDeposit: number;
  anyOther: number;
  registrationFees: number;
  modeOfTransaction: 'Cash' | 'Online' | 'Cheque';
  totalAmount: number;
  createdAt: Date;
}

// New installment and fee tracking interfaces (v11)
export interface InstallmentReceipt {
  id?: number;
  studentId?: number;
  academicYear?: string;
  receiptNumber: string;
  installmentNumber: number;
  paymentAmount: number;
  totalFeeSnapshot: number;
  paidAmountToDate: number;
  pendingAmountAfter: number;
  paymentDate: Date;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque' | 'DD';
  isManual: boolean;
  manualReceiptProvided: boolean;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentFeeAggregate {
  id?: number;
  studentId: number;
  academicYear: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  lastPaymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingPaymentEntry {
  id?: number;
  tempReference: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque' | 'DD';
  notes?: string;
  academicYear?: string;
  linkedStudentId?: number;
  isLinked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentRenewalHistory {
  id?: number;
  studentId: number;
  previousAcademicYear: string;
  newAcademicYear: string;
  renewalDate: Date;
  oldTotalFee: number;
  newTotalFee: number;
  action: 'Renewed' | 'Promoted';
  remarks?: string;
  createdAt: Date;
}

// Helper methods for academic-year-specific defaults
export const ANNUAL_FEES_KEY = (startYear: number) => `annual_fees_${startYear}`;

export const setAnnualFeesForAcademicYear = async (startYear: number, fees: Record<'A' | 'B' | 'C' | 'D', number>) => {
  const key = ANNUAL_FEES_KEY(startYear);
  await db.settings.put({ key, value: JSON.stringify(fees), description: `Annual wing fees for ${startYear}-${(startYear + 1).toString().slice(2)}` });
};

export const getAnnualFeesForAcademicYear = async (startYear: number): Promise<Record<'A' | 'B' | 'C' | 'D', number> | null> => {
  const key = ANNUAL_FEES_KEY(startYear);
  const s = await db.settings.where('key').equals(key).first();
  if (!s || !s.value) return null;
  try {
    return JSON.parse(s.value) as Record<'A' | 'B' | 'C' | 'D', number>;
  } catch {
    return null;
  }
};

export const WING_CONFIGURATION: Record<'A' | 'B' | 'C' | 'D', { rooms: number; capacity: number }> = {
  A: { rooms: 33, capacity: 3 },
  B: { rooms: 7, capacity: 4 },
  C: { rooms: 35, capacity: 2 },
  D: { rooms: 9, capacity: 2 },
};

// Academic Year utilities for 10-month hostel year (typically August to May)
export interface AcademicYear {
  startYear: number;
  endYear: number;
  label: string; // e.g., "2024-25"
}

export const getAcademicYearFromDate = (date: Date): AcademicYear => {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  // If month is June (5), July (6) or later, academic year starts this year
  // Otherwise, it started last year
  const startYear = month >= 5 ? year : year - 1;
  const endYear = startYear + 1;

  return {
    startYear,
    endYear,
    label: `${startYear}-${endYear.toString().slice(2)}`,
  };
};

export const getCurrentAcademicYear = (): AcademicYear => {
  return getAcademicYearFromDate(new Date());
};

export const generateAcademicYears = (pastCount: number = 5, futureCount: number = 2): AcademicYear[] => {
  const current = getCurrentAcademicYear();
  const years: AcademicYear[] = [];

  // create past years
  for (let i = pastCount - 1; i >= 0; i--) {
    const startYear = current.startYear - i;
    years.push({ startYear, endYear: startYear + 1, label: `${startYear}-${(startYear + 1).toString().slice(2)}` });
  }

  // append future years
  for (let j = 1; j <= futureCount; j++) {
    const startYear = current.startYear + j;
    years.push({ startYear, endYear: startYear + 1, label: `${startYear}-${(startYear + 1).toString().slice(2)}` });
  }

  return years;
};

// Wing Annual Fees Configuration
export interface WingFees {
  wing: 'A' | 'B' | 'C' | 'D';
  annualFee: number;
}

export const DEFAULT_WING_FEES: WingFees[] = [
  { wing: 'A', annualFee: 50000 },
  { wing: 'B', annualFee: 55000 },
  { wing: 'C', annualFee: 45000 },
  { wing: 'D', annualFee: 48000 },
];

// Helper function to calculate stay end date based on duration
export const calculateStayEndDate = (startDate: Date, duration: string): Date => {
  const start = new Date(startDate);
  const durationLower = duration.toLowerCase().trim();

  // Parse common duration formats
  if (durationLower.includes('month')) {
    const months = parseInt(durationLower.match(/\d+/)?.[0] || '1', 10);
    start.setMonth(start.getMonth() + months);
  } else if (durationLower.includes('year')) {
    const years = parseInt(durationLower.match(/\d+/)?.[0] || '1', 10);
    start.setFullYear(start.getFullYear() + years);
  } else if (durationLower.includes('day')) {
    const days = parseInt(durationLower.match(/\d+/)?.[0] || '30', 10);
    start.setDate(start.getDate() + days);
  } else if (durationLower.includes('week')) {
    const weeks = parseInt(durationLower.match(/\d+/)?.[0] || '4', 10);
    start.setDate(start.getDate() + (weeks * 7));
  } else {
    // Default to months if no unit specified
    const value = parseInt(durationLower.match(/\d+/)?.[0] || '6', 10);
    start.setMonth(start.getMonth() + value);
  }

  return start;
};

// Common duration options for temporary students
export const STAY_DURATION_OPTIONS = [
  '1 month',
  '2 months',
  '3 months',
  '6 months',
  '1 year',
  '15 days',
  '30 days',
  '45 days',
  '2 weeks',
  '4 weeks',
  'Custom'
];

// Database class
export class HostelDatabase extends Dexie {
  students!: Table<Student>;
  payments!: Table<Payment>;
  rooms!: Table<Room>;
  users!: Table<User>;
  settings!: Table<Settings>;
  studentYearRecords!: Table<StudentYearRecord>;
  facilityTransactions!: Table<FacilityTransaction>;
  pettyCash!: Table<PettyCashTransaction>;
  receiptRegister!: Table<ReceiptRegisterEntry>;
  installmentReceipts!: Table<InstallmentReceipt>;
  studentFees!: Table<StudentFeeAggregate>;
  pendingPayments!: Table<PendingPaymentEntry>;
  studentHistory!: Table<StudentRenewalHistory>;

  constructor() {
    super('HostelManagementDB');

    this.version(1).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, createdAt',
      payments: '++id, studentId, receiptNo, date, totalAmount, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key'
    });

    this.version(2).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, createdAt',
      payments: '++id, studentId, receiptNo, date, totalAmount, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key'
    }).upgrade(async (tx) => {
      await tx.table('students').toCollection().modify((student: Student) => {
        student.collegeName = student.collegeName ?? '';
        student.yearOfCollege = student.yearOfCollege ?? '';
      });

      const roomsTable = tx.table('rooms');
      await roomsTable.toCollection().modify((room: Room) => {
        const config = WING_CONFIGURATION[room.wing as keyof typeof WING_CONFIGURATION];
        if (config) {
          room.capacity = config.capacity;
        }
      });

      for (const [wing, config] of Object.entries(WING_CONFIGURATION) as Array<[keyof typeof WING_CONFIGURATION, { rooms: number; capacity: number }]>) {
        const existingRooms = await roomsTable.where('wing').equals(wing).toArray();
        const existingNumbers = new Set(existingRooms.map(room => room.roomNumber));

        const roomsToAdd: Omit<Room, 'id'>[] = [];
        for (let i = 1; i <= config.rooms; i += 1) {
          const roomNumber = `${wing}${i.toString().padStart(3, '0')}`;
          if (!existingNumbers.has(roomNumber)) {
            roomsToAdd.push({
              roomNumber,
              wing,
              capacity: config.capacity,
              currentOccupancy: 0,
              isActive: true,
            });
          }
        }

        if (roomsToAdd.length > 0) {
          await roomsTable.bulkAdd(roomsToAdd);
        }
      }
    });

    this.version(3).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, createdAt',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key'
    }).upgrade(async (tx) => {
      await tx.table('students').toCollection().modify((student: Student) => {
        student.address = student.address ?? '';
        student.residencyStatus = student.residencyStatus ?? 'Permanent';
      });

      await tx.table('payments').toCollection().modify((payment: Payment) => {
        payment.balanceAmount = payment.balanceAmount ?? 0;
        payment.paymentStatus = payment.paymentStatus ?? (payment.totalAmount > 0 ? 'Paid' : 'Pending');
      });
    });

    this.version(4).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key'
    }).upgrade(async (tx) => {
      await tx.table('students').toCollection().modify((student: Student) => {
        // Initialize new temporary student fields
        if (student.residencyStatus === 'Temporary') {
          student.stayDuration = student.stayDuration ?? '';
          student.stayEndDate = student.stayEndDate ?? undefined;
          student.customAmount = student.customAmount ?? 0;
        } else {
          student.stayDuration = undefined;
          student.stayEndDate = undefined;
          student.customAmount = undefined;
        }
      });
    });

    // Version 5 - Add extra fee fields and admission status
    this.version(5).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key'
    }).upgrade(async (tx) => {
      const students = tx.table('students');
      await students.toCollection().modify((s: Partial<Student>) => {
        if (s.admissionStatus === undefined) {
          s.admissionStatus = 'Active';
        }
      });

      const payments = tx.table('payments');
      await payments.toCollection().modify((p: Partial<Payment>) => {
        p.messVegFee = p.messVegFee ?? 0;
        p.messNonVegFee = p.messNonVegFee ?? 0;
        p.canteenFee = p.canteenFee ?? 0;
        p.xeroxFee = p.xeroxFee ?? 0;
      });
    });

    // Version 6 - Extend student model with import-related fields
    this.version(6).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt, status',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key'
    }).upgrade(async (tx) => {
      const students = tx.table('students');
      await students.toCollection().modify((s: Partial<Student>) => {
        s.securityDeposit = s.securityDeposit ?? 0;
        s.isOldStudent = s.isOldStudent ?? false;
        s.status = s.status ?? 'Active';
        s.vacatedDate = s.vacatedDate ?? undefined;
        s.remarks = s.remarks ?? '';
        // alias mapping
        if (s.enrollmentNumber && !s.enrollmentNo) {
          s.enrollmentNo = s.enrollmentNumber;
        }
        if (!s.customMonthlyAmount && s.customAmount) {
          s.customMonthlyAmount = s.customAmount;
        }
      });
    });

    // Version 7 - Add studentYearRecords table for multi-year retention
    this.version(7).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt, status',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key',
      studentYearRecords: '++id, studentId, academicYearStart, yearLabel, wing, roomNo, status'
    }).upgrade(async (tx) => {
      // Create records for current academic year if none exist
      const current = getCurrentAcademicYear();
      const recordTable = tx.table('studentYearRecords');
      const existingCount = await recordTable.where('academicYearStart').equals(current.startYear).count();
      if (existingCount === 0) {
        const students = await tx.table('students').toArray();
        const toAdd: Omit<StudentYearRecord, 'id'>[] = students.map(s => ({
          studentId: s.id!,
          academicYearStart: current.startYear,
          academicYearEnd: current.endYear,
          yearLabel: current.label,
          wing: s.wing,
          roomNo: s.roomNo,
          annualFee: s.annualFee ?? 0,
          status: s.status ?? 'Active',
          remarks: s.remarks ?? '',
          createdAt: new Date()
        }));
        if (toAdd.length) {
          await recordTable.bulkAdd(toAdd);
        }
      }
    });

    // Version 8 - Add facilityTransactions for admin Mess/Canteen/Xerox billing
    this.version(8).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt, status',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key',
      studentYearRecords: '++id, studentId, academicYearStart, yearLabel, wing, roomNo, status',
      facilityTransactions: '++id, facility, txnType, date, amount'
    }).upgrade(async (tx) => {
      const table = tx.table('facilityTransactions');
      // ensure table exists; no backfill required
      await table.toCollection().modify((t: Partial<FacilityTransaction>) => {
        t.createdAt = t.createdAt ?? new Date();
        t.updatedAt = t.updatedAt ?? new Date();
      });
    });

    // Version 9 - Extend facilityTransactions with itemized billing and references
    this.version(9).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt, status',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key',
      studentYearRecords: '++id, studentId, academicYearStart, yearLabel, wing, roomNo, status',
      facilityTransactions: '++id, facility, txnType, date, amount, receiptNo, billNo'
    }).upgrade(async (tx) => {
      const table = tx.table('facilityTransactions');
      await table.toCollection().modify((t: Partial<FacilityTransaction>) => {
        // Initialize new fields if missing
        if (t.items === undefined) t.items = [];
        if (t.subtotal === undefined) t.subtotal = typeof t.amount === 'number' ? t.amount : 0;
        if (t.gstPercent === undefined) t.gstPercent = 0;
        if (t.gstAmount === undefined) t.gstAmount = 0;
        if (t.netAmount === undefined) t.netAmount = (t.subtotal ?? 0) + (t.gstAmount ?? 0);
        if (t.paidAmount === undefined) t.paidAmount = t.netAmount ?? t.amount ?? 0;
        if (t.balanceAmount === undefined) t.balanceAmount = Math.max(0, (t.netAmount ?? 0) - (t.paidAmount ?? 0));
      });
    });

    // Version 10 - Add Petty Cash and Receipt Register tables
    this.version(10).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt, status',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key',
      studentYearRecords: '++id, studentId, academicYearStart, yearLabel, wing, roomNo, status',
      facilityTransactions: '++id, facility, txnType, date, amount, receiptNo, billNo',
      pettyCash: '++id, date, receiptNo, category, amount, createdAt',
      receiptRegister: '++id, date, receiptNo, name, studentId, createdAt'
    });

    // Version 11 - Add installment & fee tracking tables for payment-first workflow
    this.version(11).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt, status',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key',
      studentYearRecords: '++id, studentId, academicYearStart, yearLabel, wing, roomNo, status',
      facilityTransactions: '++id, facility, txnType, date, amount, receiptNo, billNo',
      pettyCash: '++id, date, receiptNo, category, amount, createdAt',
      receiptRegister: '++id, date, receiptNo, name, studentId, createdAt',
      installmentReceipts: '++id, studentId, academicYear, receiptNumber, paymentDate, installmentNumber',
      studentFees: '++id, studentId, academicYear, status, pendingAmount',
      pendingPayments: '++id, tempReference, paymentDate, isLinked, linkedStudentId',
      studentHistory: '++id, studentId, newAcademicYear, action'
    }).upgrade(async (tx) => {
      const fees = tx.table('studentFees');
      await fees.toCollection().modify((f: Partial<StudentFeeAggregate>) => {
        f.paidAmount = f.paidAmount ?? 0;
        f.pendingAmount = f.pendingAmount ?? (f.totalFee ? f.totalFee - (f.paidAmount ?? 0) : 0);
        f.status = f.status ?? 'Unpaid';
        f.createdAt = f.createdAt ?? new Date();
        f.updatedAt = f.updatedAt ?? new Date();
      });
      const receipts = tx.table('installmentReceipts');
      await receipts.toCollection().modify((r: Partial<InstallmentReceipt>) => {
        r.createdAt = r.createdAt ?? new Date();
        r.updatedAt = r.updatedAt ?? new Date();
        r.isManual = r.isManual ?? false;
        r.manualReceiptProvided = r.manualReceiptProvided ?? false;
      });
      const pending = tx.table('pendingPayments');
      await pending.toCollection().modify((p: Partial<PendingPaymentEntry>) => {
        p.isLinked = p.isLinked ?? false;
        p.createdAt = p.createdAt ?? new Date();
        p.updatedAt = p.updatedAt ?? new Date();
      });
    });

    // Version 12 - Add placeholder fields to students for Quick Payment workflow
    this.version(12).stores({
      students: '++id, name, mobile, enrollmentNo, wing, roomNo, studentType, isPlaceholder, placeholderRef, collegeName, yearOfCollege, residencyStatus, stayDuration, stayEndDate, customAmount, createdAt, status',
      payments: '++id, studentId, receiptNo, date, totalAmount, paymentStatus, createdAt',
      rooms: '++id, roomNumber, wing, capacity, currentOccupancy',
      users: '++id, username, role, name',
      settings: '++id, key',
      studentYearRecords: '++id, studentId, academicYearStart, yearLabel, wing, roomNo, status',
      facilityTransactions: '++id, facility, txnType, date, amount, receiptNo, billNo',
      pettyCash: '++id, date, receiptNo, category, amount, createdAt',
      receiptRegister: '++id, date, receiptNo, name, studentId, createdAt',
      installmentReceipts: '++id, studentId, academicYear, receiptNumber, paymentDate, installmentNumber',
      studentFees: '++id, studentId, academicYear, status, pendingAmount',
      pendingPayments: '++id, tempReference, paymentDate, isLinked, linkedStudentId',
      studentHistory: '++id, studentId, newAcademicYear, action'
    }).upgrade(async (tx) => {
      const studentsTable = tx.table('students');
      await studentsTable.toCollection().modify((s: Partial<Student>) => {
        if (s.isPlaceholder === undefined) s.isPlaceholder = false;
        if (s.placeholderRef === undefined && s.isPlaceholder) {
          s.placeholderRef = `PLH-${s.id || ''}`;
        }
      });
    });

    // Hooks for automatic timestamp updates
    this.students.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.collegeName = obj.collegeName ?? '';
      obj.yearOfCollege = obj.yearOfCollege ?? '';
      obj.address = obj.address ?? '';
      obj.residencyStatus = obj.residencyStatus ?? 'Permanent';

      // Set temporary student fields based on residency status
      if (obj.residencyStatus === 'Temporary') {
        obj.stayDuration = obj.stayDuration ?? '';
        obj.customAmount = obj.customAmount ?? 0;
        // Calculate stay end date if duration is provided and no end date is set
        if (obj.stayDuration && !obj.stayEndDate) {
          obj.stayEndDate = calculateStayEndDate(obj.joiningDate, obj.stayDuration);
        }
      } else {
        obj.stayDuration = undefined;
        obj.stayEndDate = undefined;
        obj.customAmount = undefined;
      }
    });

    this.students.hook('updating', (modifications, _primKey, obj) => {
      const mods = modifications as Partial<Student>;
      const student = obj as Student;

      mods.updatedAt = new Date();
      if (mods.collegeName === undefined && student.collegeName === undefined) {
        mods.collegeName = '';
      }
      if (mods.yearOfCollege === undefined && student.yearOfCollege === undefined) {
        mods.yearOfCollege = '';
      }
      if (mods.address === undefined && student.address === undefined) {
        mods.address = '';
      }
      if (mods.residencyStatus === undefined && student.residencyStatus === undefined) {
        mods.residencyStatus = 'Permanent';
      }

      // Handle temporary student fields when residency status changes
      if (mods.residencyStatus === 'Temporary') {
        mods.stayDuration = mods.stayDuration ?? student.stayDuration ?? '';
        mods.customAmount = mods.customAmount ?? student.customAmount ?? 0;
        // Recalculate end date if duration changed
        if (mods.stayDuration && !mods.stayEndDate) {
          const joiningDate = mods.joiningDate ?? student.joiningDate;
          mods.stayEndDate = calculateStayEndDate(joiningDate, mods.stayDuration);
        }
      } else if (mods.residencyStatus === 'Permanent') {
        mods.stayDuration = undefined;
        mods.stayEndDate = undefined;
        mods.customAmount = undefined;
      }
    });

    this.payments.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date();
      obj.balanceAmount = obj.balanceAmount ?? 0;
      obj.paymentStatus = obj.paymentStatus ?? (obj.totalAmount > 0 ? 'Paid' : 'Pending');
    });

    this.facilityTransactions?.hook('creating', (_pk, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.facilityTransactions?.hook('updating', (mods) => {
      (mods as Partial<FacilityTransaction>).updatedAt = new Date();
    });

    this.pettyCash?.hook('creating', (_pk, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.pettyCash?.hook('updating', (mods) => {
      (mods as Partial<PettyCashTransaction>).updatedAt = new Date();
    });

    this.receiptRegister?.hook('creating', (_pk, obj) => {
      obj.createdAt = new Date();
    });
  }
}

// Create database instance
export const db = new HostelDatabase();

// Utility: create next academic year records for continuing students
export const createNextAcademicYearRecords = async () => {
  const current = getCurrentAcademicYear();
  const nextStart = current.startYear + 1;
  const nextEnd = nextStart + 1;
  const nextLabel = `${nextStart}-${nextEnd.toString().slice(2)}`;

  const existing = await db.studentYearRecords.where('academicYearStart').equals(nextStart).count();
  if (existing > 0) return { created: 0, message: 'Next academic year records already exist.' };

  const students = await db.students.where('status').notEqual('Vacated').toArray();
  const toAdd: Omit<StudentYearRecord, 'id'>[] = students.map(s => ({
    studentId: s.id!,
    academicYearStart: nextStart,
    academicYearEnd: nextEnd,
    yearLabel: nextLabel,
    wing: s.wing,
    roomNo: s.roomNo,
    annualFee: s.annualFee ?? 0,
    status: (s.admissionStatus === 'Cancelled') ? 'Cancelled' : (s.status ?? 'Active'),
    remarks: s.remarks ?? '',
    createdAt: new Date()
  }));
  if (toAdd.length) {
    await db.studentYearRecords.bulkAdd(toAdd);
  }
  return { created: toAdd.length, message: `Created ${toAdd.length} records for ${nextLabel}` };
};

// Initialize default data
export const initializeDatabase = async () => {
  try {
    // Open the database first to ensure it's ready
    await db.open();

    // Create default admin user if none exists
    const userCount = await db.users.count();

    if (userCount === 0) {
      await db.users.add({
        username: 'admin',
        password: 'admin123',
        role: 'Admin',
        name: 'System Administrator',
        email: 'admin@hostel.com',
        createdAt: new Date()
      });
    }

    // Initialize rooms and settings in background (don't await)
    Promise.resolve().then(async () => {
      try {
        const roomCount = await db.rooms.count();
        if (roomCount === 0) {
          const roomsToAdd: Omit<Room, 'id'>[] = [];
          (Object.entries(WING_CONFIGURATION) as Array<[keyof typeof WING_CONFIGURATION, { rooms: number; capacity: number }]>)
            .forEach(([wing, config]) => {
              for (let i = 1; i <= config.rooms; i += 1) {
                roomsToAdd.push({
                  roomNumber: `${wing}${i.toString().padStart(3, '0')}`,
                  wing,
                  capacity: config.capacity,
                  currentOccupancy: 0,
                  isActive: true,
                });
              }
            });
          await db.rooms.bulkAdd(roomsToAdd);
        }

        const settingsCount = await db.settings.count();
        if (settingsCount === 0) {
          await db.settings.bulkAdd([
            { key: 'hostel_name', value: 'Maulana Azad Hostel Management', description: 'Name of the hostel' },
            { key: 'default_registration_fee', value: '5000', description: 'Default registration fee' },
            { key: 'default_rent_fee', value: '8000', description: 'Default monthly rent' },
            { key: 'default_water_fee', value: '500', description: 'Default water charges' },
            { key: 'default_gym_fee', value: '1000', description: 'Default gym fee' },
            { key: 'currency_symbol', value: '₹', description: 'Currency symbol' }
          ]);
        }
      } catch (error) {
        console.error('Error initializing rooms/settings:', error);
      }
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};