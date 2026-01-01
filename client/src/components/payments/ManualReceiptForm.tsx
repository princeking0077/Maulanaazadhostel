import React, { useState } from 'react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox } from '@mui/material';
import { formatDateDDMonthYYYY } from '../../utils/dateUtils';
import { createInstallment, InstallmentResult } from '../../services/offlinePayments';
import type { InstallmentReceipt } from '../../database/db';

interface ReceiptResponse {
  success: boolean;
  receiptNumber: string;
  installmentNumber: number;
  feeStatus: string;
  paidAmount: number;
  pendingAmount: number;
  [key: string]: unknown;
}

interface ReceiptCreatePayload {
  studentId?: number;
  academicYear?: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMode: string;
  notes?: string;
  manualReceiptNumber?: string;
  totalFee?: number;
}

interface Props {
  studentId?: number;
  academicYear?: string;
  onSuccess?: (data: ReceiptResponse) => void;
}

const ManualReceiptForm: React.FC<Props> = ({ studentId, academicYear, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0,10));
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [manualReceiptNumber, setManualReceiptNumber] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [totalFee, setTotalFee] = useState(''); // only for first installment
  const [notes, setNotes] = useState('');
  
  const handleSubmit = async () => {
    const payload: ReceiptCreatePayload = {
      studentId,
      academicYear,
      paymentAmount: parseFloat(amount),
      paymentDate: date,
      paymentMode,
      notes,
    };
    if (isManual && manualReceiptNumber) payload.manualReceiptNumber = manualReceiptNumber;
    if (totalFee) payload.totalFee = parseFloat(totalFee);

    const data: InstallmentResult = await createInstallment({
      studentId,
      academicYear,
      paymentAmount: payload.paymentAmount,
      paymentDate: payload.paymentDate,
      paymentMode: payload.paymentMode as InstallmentReceipt['paymentMode'],
      notes: payload.notes,
      manualReceiptNumber: payload.manualReceiptNumber,
      totalFee: payload.totalFee
    });
    if (!data.success) {
      alert(data.error || 'Failed to create receipt');
      return;
    }
    if (onSuccess) {
      const mapped: ReceiptResponse = {
        success: data.success,
        receiptNumber: data.receiptNumber!,
        installmentNumber: data.installmentNumber!,
        feeStatus: data.feeStatus!,
        paidAmount: data.paidAmount!,
        pendingAmount: data.pendingAmount!,
      };
      onSuccess(mapped);
    }
    setOpen(false);
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>Add Installment / Receipt</Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Payment Receipt</DialogTitle>
        <DialogContent>
          <TextField label="Payment Amount" type="number" fullWidth margin="normal" value={amount} onChange={e => setAmount(e.target.value)} />
          <TextField label="Payment Date" type="date" fullWidth margin="normal" value={date} onChange={e => setDate(e.target.value)} />
          <TextField label="Payment Mode" fullWidth margin="normal" value={paymentMode} onChange={e => setPaymentMode(e.target.value)} />
          <FormControlLabel control={<Checkbox checked={isManual} onChange={e => setIsManual(e.target.checked)} />} label="Manual Receipt Number" />
          {isManual && (
            <TextField label="Manual Receipt Number" fullWidth margin="normal" value={manualReceiptNumber} onChange={e => setManualReceiptNumber(e.target.value)} />
          )}
          <TextField label="Total Fee (first installment only)" type="number" fullWidth margin="normal" value={totalFee} onChange={e => setTotalFee(e.target.value)} />
          <TextField label="Notes" fullWidth margin="normal" multiline minRows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>Display Date: {formatDateDDMonthYYYY(date)}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save Receipt</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManualReceiptForm;
