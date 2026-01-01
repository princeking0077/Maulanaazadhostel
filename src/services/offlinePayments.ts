import { db, InstallmentReceipt, StudentFeeAggregate, StudentRenewalHistory } from '../database/db';
import { settingsStorage } from './storage';

export interface CreateInstallmentOptions {
  studentId?: number; // optional when creating pending payment first
  academicYear?: string;
  paymentAmount: number;
  paymentDate: Date | string;
  paymentMode?: InstallmentReceipt['paymentMode'];
  notes?: string;
  manualReceiptNumber?: string;
  totalFee?: number; // required only for first installment
  tempReference?: string; // for pending payment
}

export interface InstallmentResult {
  success: boolean;
  receiptNumber?: string;
  installmentNumber?: number;
  feeStatus?: StudentFeeAggregate['status'];
  paidAmount?: number;
  pendingAmount?: number;
  pendingPaymentId?: number;
  message?: string;
  error?: string;
}

const receiptSequenceKey = (year: number) => `receipt_sequence_${year}`;

export async function getNextReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const key = receiptSequenceKey(year);
  const currentRaw = await settingsStorage.get(key);
  const current = typeof currentRaw === 'number' ? currentRaw : (typeof currentRaw === 'string' ? parseInt(currentRaw, 10) : 0);
  const next = current + 1;
  await settingsStorage.set(key, next);
  return `${year}-${String(next).padStart(4,'0')}`;
}

async function getFeeRow(studentId: number, academicYear: string): Promise<StudentFeeAggregate | undefined> {
  return await db.studentFees.where({ studentId, academicYear }).first();
}

async function upsertFeeRow(studentId: number, academicYear: string, totalFee: number, addPayment: number, paymentDate: Date): Promise<{ row: StudentFeeAggregate; installmentNumber: number; }> {
  let row = await getFeeRow(studentId, academicYear);
  let installmentNumber = 1;
  if (!row) {
    const paid = addPayment;
    const pending = Math.max(totalFee - paid, 0);
    const status: StudentFeeAggregate['status'] = pending <= 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
    const id = await db.studentFees.add({ studentId, academicYear, totalFee, paidAmount: paid, pendingAmount: pending, status, lastPaymentDate: paymentDate, createdAt: new Date(), updatedAt: new Date() });
    row = await db.studentFees.get(id)!;
  } else {
    const newPaid = row.paidAmount + addPayment;
    if (totalFee && totalFee !== row.totalFee) {
      row.totalFee = totalFee; // adjust if changed
    }
    const pending = Math.max(row.totalFee - newPaid, 0);
    const status: StudentFeeAggregate['status'] = pending <= 0 ? 'Paid' : (newPaid > 0 ? 'Partially Paid' : 'Unpaid');
    await db.studentFees.update(row.id!, { paidAmount: newPaid, pendingAmount: pending, status, lastPaymentDate: paymentDate, updatedAt: new Date(), totalFee: row.totalFee });
    row = await db.studentFees.get(row.id!)!;
    installmentNumber = await db.installmentReceipts.where({ studentId, academicYear }).count() + 1;
  }
  return { row: row!, installmentNumber };
}

export async function createInstallment(opts: CreateInstallmentOptions): Promise<InstallmentResult> {
  const {
    studentId,
    academicYear = deriveAcademicYear(),
    paymentAmount,
    paymentDate,
    paymentMode = 'Cash',
    notes = '',
    manualReceiptNumber,
    totalFee,
    tempReference
  } = opts;

  if (paymentAmount <= 0) return { success: false, error: 'paymentAmount must be > 0' };

  const paymentDateObj = typeof paymentDate === 'string' ? new Date(paymentDate) : paymentDate;

  // If manual receipt number is provided, ensure it's unique
  if (manualReceiptNumber) {
    console.log('[CreateInstallment] Checking uniqueness of manual receipt:', manualReceiptNumber);
    const exists = await db.installmentReceipts.where('receiptNumber').equals(manualReceiptNumber).first();
    if (exists) {
      console.error('[CreateInstallment] Receipt number already exists:', manualReceiptNumber);
      return { success: false, error: 'Receipt number already exists. Provide a unique manual receipt number.' };
    }
  }

  // Pending payment mode (no student yet)
  if (!studentId) {
    if (!tempReference) return { success: false, error: 'tempReference required without studentId' };
    const pendingId = await db.pendingPayments.add({ tempReference, paymentAmount, paymentDate: paymentDateObj, paymentMode, notes, academicYear, isLinked: false, createdAt: new Date(), updatedAt: new Date() });
    const receiptNumber = manualReceiptNumber || await getNextReceiptNumber();
    return { success: true, pendingPaymentId: pendingId, receiptNumber, message: 'Pending payment stored; link when student is registered.' };
  }

  // Student installment
  const receiptNumber = manualReceiptNumber || await getNextReceiptNumber();
  console.log('[CreateInstallment] Generated receipt number:', receiptNumber);
  
  const existingFee = await getFeeRow(studentId, academicYear);
  console.log('[CreateInstallment] Existing fee row:', existingFee);
  
  if (!existingFee && (totalFee === undefined || totalFee === null)) {
    console.error('[CreateInstallment] Missing totalFee for first installment');
    return { success: false, error: 'totalFee required for first installment' };
  }

  console.log('[CreateInstallment] Upserting fee row for student:', studentId);
  const { row, installmentNumber } = await upsertFeeRow(studentId, academicYear, totalFee ?? existingFee!.totalFee, paymentAmount, paymentDateObj);
  console.log('[CreateInstallment] Fee row updated. Installment number:', installmentNumber);

  const receiptData = {
    studentId,
    academicYear,
    receiptNumber,
    installmentNumber,
    paymentAmount,
    totalFeeSnapshot: row.totalFee,
    paidAmountToDate: row.paidAmount,
    pendingAmountAfter: row.pendingAmount,
    paymentDate: paymentDateObj,
    paymentMode,
    isManual: !!manualReceiptNumber,
    manualReceiptProvided: !!manualReceiptNumber,
    notes,
    createdBy: 'Offline',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log('[CreateInstallment] Adding installment receipt:', receiptData);
  await db.installmentReceipts.add(receiptData);
  console.log('[CreateInstallment] Installment receipt saved successfully');

  const finalResult = {
    success: true,
    receiptNumber,
    installmentNumber,
    feeStatus: row.status,
    paidAmount: row.paidAmount,
    pendingAmount: row.pendingAmount
  };
  console.log('[CreateInstallment] Returning result:', finalResult);
  return finalResult;
}

export async function linkPendingPayment(pendingPaymentId: number, studentId: number, options: { academicYear?: string; totalFee?: number } = {}): Promise<InstallmentResult> {
  const pending = await db.pendingPayments.get(pendingPaymentId);
  if (!pending) return { success: false, error: 'Pending payment not found' };
  if (pending.isLinked) return { success: false, error: 'Pending payment already linked' };

  await db.pendingPayments.update(pendingPaymentId, { linkedStudentId: studentId, isLinked: true, updatedAt: new Date() });

  return await createInstallment({
    studentId,
    academicYear: options.academicYear ?? pending.academicYear,
    paymentAmount: pending.paymentAmount,
    paymentDate: pending.paymentDate,
    paymentMode: pending.paymentMode,
    notes: `Linked pending payment: ${pending.tempReference}`,
    totalFee: options.totalFee
  });
}

export async function renewStudent(studentId: number, newAcademicYear: string, action: 'Renewed' | 'Promoted', newTotalFee: number, remarks?: string): Promise<{ success: boolean; error?: string; academicYear?: string; }> {
  const student = await db.students.get(studentId);
  if (!student) return { success: false, error: 'Student not found' };
  const existing = await db.studentFees.where({ studentId, academicYear: newAcademicYear }).first();
  if (existing) return { success: false, error: 'Fee record already exists for new academic year' };

  const history: Omit<StudentRenewalHistory,'id'> = {
    studentId,
    previousAcademicYear: '',
    newAcademicYear,
    renewalDate: new Date(),
    oldTotalFee: student.annualFee ?? 0,
    newTotalFee,
    action,
    remarks,
    createdAt: new Date()
  };
  await db.studentHistory.add(history);

  // Update student record (store academicYear & renewal marker in settings if needed)
  await db.students.update(studentId, { updatedAt: new Date() });

  await db.studentFees.add({ studentId, academicYear: newAcademicYear, totalFee: newTotalFee, paidAmount: 0, pendingAmount: newTotalFee, status: 'Unpaid', createdAt: new Date(), updatedAt: new Date() });

  return { success: true, academicYear: newAcademicYear };
}

export function deriveAcademicYear(date: Date = new Date()): string {
  const yr = date.getFullYear();
  const next = yr + 1;
  return `${yr}-${String(next).slice(2)}`;
}

export async function listInstallments(studentId: number, academicYear?: string) {
  let coll = db.installmentReceipts.where('studentId').equals(studentId);
  if (academicYear) {
    coll = db.installmentReceipts.where({ studentId, academicYear });
  }
  return await coll.sortBy('paymentDate');
}

export async function getFeeStatus(studentId: number, academicYear: string) {
  return await getFeeRow(studentId, academicYear);
}

export async function listPendingPayments() {
  const all = await db.pendingPayments.toArray();
  return all.filter(p => !p.isLinked);
}

// ===================== PLACEHOLDER STUDENT WORKFLOW =====================

interface PlaceholderStudentOptions {
  name?: string;
  mobile?: string;
  paymentAmount: number;
  totalFee?: number; // if known, else defaults to paymentAmount
  paymentDate?: Date | string;
  paymentMode?: InstallmentReceipt['paymentMode'];
  manualReceiptNumber?: string;
  notes?: string;
  academicYear?: string;
}

export async function createPlaceholderStudentQuickPayment(opts: PlaceholderStudentOptions): Promise<InstallmentResult & { studentId?: number; placeholderRef?: string; }> {
  console.log('[QuickPayment] Starting createPlaceholderStudentQuickPayment with options:', opts);
  const {
    name = 'Placeholder Student',
    mobile = '',
    paymentAmount,
    totalFee,
    paymentDate = new Date(),
    paymentMode = 'Cash',
    manualReceiptNumber,
    notes = '',
    academicYear = deriveAcademicYear(),
  } = opts;

  if (paymentAmount <= 0) {
    console.error('[QuickPayment] Invalid payment amount:', paymentAmount);
    return { success: false, error: 'paymentAmount must be > 0' };
  }

  // Create minimal placeholder student record
  const placeholderRef = `PLH-${Date.now()}`;
  console.log('[QuickPayment] Generated placeholderRef:', placeholderRef);
  
  // Build minimal placeholder student object typed as Partial of Student-like structure
  const placeholderStudent = {
    name,
    mobile,
    email: '',
    enrollmentNo: placeholderRef,
    faculty: '',
    collegeName: '',
    yearOfCollege: '',
    address: '',
    residencyStatus: 'Permanent',
    wing: 'A',
    roomNo: 'A000',
    studentType: 'Hosteller',
    joiningDate: new Date(),
    annualFee: totalFee ?? paymentAmount,
    isPlaceholder: true,
    placeholderRef,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Omit<import('../database/db').Student,'id'>;
  
  console.log('[QuickPayment] Creating placeholder student:', placeholderStudent);
  const studentId = await db.students.add(placeholderStudent);
  console.log('[QuickPayment] Placeholder student created with ID:', studentId);

  // Create first installment for placeholder
  console.log('[QuickPayment] Creating installment for student ID:', studentId);
  const result = await createInstallment({
    studentId,
    academicYear,
    paymentAmount,
    paymentDate,
    paymentMode,
    manualReceiptNumber,
    notes: notes ? `${notes} (Placeholder)` : '(Placeholder)',
    totalFee: totalFee ?? paymentAmount,
  });
  
  console.log('[QuickPayment] Installment created:', result);
  const finalResult = { ...result, studentId, placeholderRef };
  console.log('[QuickPayment] Final result:', finalResult);
  return finalResult;
}

interface ConvertPlaceholderOptions {
  studentId: number;
  newData: Partial<{ name: string; mobile: string; email: string; enrollmentNo: string; faculty: string; collegeName: string; yearOfCollege: string; address: string; wing: 'A'|'B'|'C'|'D'; roomNo: string; studentType: 'Day Scholar'|'Hosteller'|'PhD'|'Non-Hosteller'; joiningDate: Date; annualFee: number; }>;
  updatedTotalFee?: number; // If actual total fee differs from initial placeholder fee
}

export async function convertPlaceholderStudent(opts: ConvertPlaceholderOptions): Promise<{ success: boolean; error?: string; adjusted?: { oldTotalFee: number; newTotalFee: number; pendingDifference: number; }; }>{
  const { studentId, newData, updatedTotalFee } = opts;
  const student = await db.students.get(studentId);
  if (!student) return { success: false, error: 'Student not found' };
  if (!student.isPlaceholder) return { success: false, error: 'Student is not a placeholder' };

  // Update student fields and mark conversion
  await db.students.update(studentId, { ...newData, isPlaceholder: false, convertedAt: new Date(), updatedAt: new Date() });

  let adjustmentInfo: { oldTotalFee: number; newTotalFee: number; pendingDifference: number; } | undefined;
  if (updatedTotalFee && updatedTotalFee !== student.annualFee) {
    // Adjust fee aggregate if exists
    const academicYear = deriveAcademicYear();
    const feeRow = await getFeeRow(studentId, academicYear);
    if (feeRow) {
      const oldTotal = feeRow.totalFee;
      const newTotal = updatedTotalFee;
      const pendingBefore = feeRow.pendingAmount;
      const paid = feeRow.paidAmount;
      const newPending = Math.max(newTotal - paid, 0);
      const status: StudentFeeAggregate['status'] = newPending <= 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
      await db.studentFees.update(feeRow.id!, { totalFee: newTotal, pendingAmount: newPending, status, updatedAt: new Date() });
      adjustmentInfo = { oldTotalFee: oldTotal, newTotalFee: newTotal, pendingDifference: newPending - pendingBefore };
    }
  }

  return { success: true, adjusted: adjustmentInfo };
}
