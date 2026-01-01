import React, { useState, useEffect } from 'react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { formatDateDDMonthYYYY } from '../../utils/dateUtils';
import { ReceiptResponse } from './types';
import { createInstallment, InstallmentResult } from '../../services/offlinePayments';
import type { InstallmentReceipt } from '../../database/db';

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: number;
  academicYear: string;
  pendingAmount: number;
  onSuccess?: (data: ReceiptResponse) => void;
}

const NextInstallmentForm: React.FC<Props> = ({ open, onClose, studentId, academicYear, pendingAmount, onSuccess }) => {
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      console.log('[NextInstallmentForm] Opening with data:', { studentId, academicYear, pendingAmount });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(new Date().toISOString().substring(0, 10));
      setAmount('');
      setMode('Cash');
      setNotes('');
    }
  }, [open, studentId, academicYear, pendingAmount]);

  const handleSubmit = async () => {
    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) { alert('Amount must be > 0'); return; }
    if (paymentAmount > pendingAmount) { if (!confirm('Amount exceeds pending. Continue?')) return; }

    const data: InstallmentResult = await createInstallment({
      studentId,
      academicYear,
      paymentAmount,
      paymentDate: date,
      paymentMode: mode as InstallmentReceipt['paymentMode'],
      notes
    });
    if (!data.success) { alert(data.error || 'Installment failed'); return; }
    if (onSuccess) {
      const mapped: ReceiptResponse = {
        success: true,
        receiptNumber: data.receiptNumber!,
        installmentNumber: data.installmentNumber!,
        feeStatus: data.feeStatus!,
        paidAmount: data.paidAmount!,
        pendingAmount: data.pendingAmount!
      };
      onSuccess(mapped);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Generate Next Installment</DialogTitle>
      <DialogContent>
        <div style={{ fontSize: 14, marginBottom: 8 }}>Pending Amount: ₹{pendingAmount.toFixed(2)}</div>
        <TextField label="Payment Amount" type="number" fullWidth margin="normal" value={amount} onChange={e => setAmount(e.target.value)} />
        <TextField label="Payment Date" type="date" fullWidth margin="normal" value={date} onChange={e => setDate(e.target.value)} />
        <TextField label="Payment Mode" fullWidth margin="normal" value={mode} onChange={e => setMode(e.target.value)} />
        <TextField label="Notes" fullWidth margin="normal" multiline minRows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>Display Date: {formatDateDDMonthYYYY(date)}</div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NextInstallmentForm;
