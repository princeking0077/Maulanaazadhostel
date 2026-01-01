export interface StudentFeeRecord {
  studentId: number;
  academicYear: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  lastPaymentDate?: string;
}

export interface PaymentReceipt {
  id?: number;
  studentId?: number;
  academicYear?: string;
  receiptNumber: string;
  installmentNumber: number;
  paymentAmount: number;
  totalFeeSnapshot: number;
  paidAmountToDate: number;
  pendingAmountAfter: number;
  paymentDate: string;
  paymentMode: string;
  isManual: boolean;
  manualReceiptProvided: boolean;
  notes?: string;
  createdBy?: string;
}

export interface PendingPayment {
  id?: number;
  tempReference: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMode: string;
  notes?: string;
  academicYear?: string;
  linkedStudentId?: number;
  isLinked?: number;
}
