export interface ReceiptResponse {
  success: boolean;
  receiptNumber: string;
  installmentNumber: number;
  feeStatus: string;
  paidAmount: number;
  pendingAmount: number;
  [key: string]: unknown;
}
