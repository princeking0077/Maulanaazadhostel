import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, MenuItem, Typography, Alert, Divider, Chip } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { createPlaceholderStudentQuickPayment, InstallmentResult } from '../../services/offlinePayments';
import { db, Student, InstallmentReceipt } from '../../database/db';
import InstallmentReceiptPrint from './InstallmentReceiptPrint';

interface QuickPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { installment: InstallmentResult; studentId?: number; placeholderRef?: string; }) => void;
}

const paymentModes = ['Cash','UPI','Card','Bank Transfer','Cheque','DD'] as const;

const QuickPaymentDialog: React.FC<QuickPaymentDialogProps> = ({ open, onClose, onSuccess }) => {
  // Form state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [totalFee, setTotalFee] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().substring(0,10));
  const [paymentMode, setPaymentMode] = useState<typeof paymentModes[number]>('Cash');
  const [manualReceiptNumber, setManualReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  // UX state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<null | { receiptNumber?: string; placeholderRef?: string; studentId?: number; installmentNumber?: number; paidAmount?: number; pendingAmount?: number; }>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<InstallmentReceipt | null>(null);
  const [studentToPrint, setStudentToPrint] = useState<Student | null>(null);

  const resetForm = () => {
    setName('');
    setMobile('');
    setPaymentAmount('');
    setTotalFee('');
    setPaymentDate(new Date().toISOString().substring(0,10));
    setPaymentMode('Cash');
    setManualReceiptNumber('');
    setNotes('');
    setError(null);
    setSuccessInfo(null);
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async () => {
    console.log('[QuickPaymentDialog] Submit button clicked');
    setError(null);
    setSubmitting(true);
    setSuccessInfo(null);
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.error('[QuickPaymentDialog] Invalid amount:', paymentAmount);
      setError('Enter a valid payment amount > 0');
      setSubmitting(false);
      return;
    }
    const totalFeeNum = totalFee ? parseFloat(totalFee) : undefined;
    const payload = {
      name: name.trim() || undefined,
      mobile: mobile.trim() || undefined,
      paymentAmount: amountNum,
      totalFee: totalFeeNum,
      paymentDate: paymentDate,
      paymentMode,
      manualReceiptNumber: manualReceiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    console.log('[QuickPaymentDialog] Submitting payload:', payload);
    try {
      const result = await createPlaceholderStudentQuickPayment(payload);
      console.log('[QuickPaymentDialog] Result received:', result);
      console.log('[QuickPaymentDialog] Result received:', result);
      if (!result.success) {
        console.error('[QuickPaymentDialog] Failed:', result.error);
        setError(result.error || 'Failed to create quick payment');
      } else {
        console.log('[QuickPaymentDialog] Success! Setting success info');
        setSuccessInfo({
          receiptNumber: result.receiptNumber,
          placeholderRef: result.placeholderRef,
          studentId: result.studentId,
          installmentNumber: result.installmentNumber,
          paidAmount: result.paidAmount,
          pendingAmount: result.pendingAmount
        });
        console.log('[QuickPaymentDialog] Calling onSuccess callback');
        if (onSuccess) onSuccess({ installment: result, studentId: result.studentId, placeholderRef: result.placeholderRef });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unexpected error';
      console.error('[QuickPaymentDialog] Exception caught:', e);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = paymentAmount.trim() !== '' && !submitting;

  const handlePrintReceipt = async () => {
    if (!successInfo?.receiptNumber || !successInfo?.studentId) return;
    
    try {
      // Load the receipt and student from database
      const receipt = await db.installmentReceipts
        .where('receiptNumber')
        .equals(successInfo.receiptNumber)
        .first();
      
      const student = await db.students.get(successInfo.studentId);
      
      if (receipt && student) {
        setReceiptToPrint(receipt);
        setStudentToPrint(student);
        setPrintDialogOpen(true);
      }
    } catch (e) {
      console.error('Failed to load receipt for printing:', e);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Quick Payment (Placeholder Student)</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Record a payment before full student registration. A placeholder student will be created and can be converted later.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successInfo && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">Quick Payment Recorded</Typography>
              <Typography variant="body2">Receipt: <strong>{successInfo.receiptNumber}</strong></Typography>
              <Typography variant="body2">Placeholder Ref: <strong>{successInfo.placeholderRef}</strong></Typography>
              <Typography variant="body2">Installment #: {successInfo.installmentNumber}</Typography>
              <Typography variant="body2">Paid: ₹{successInfo.paidAmount} | Pending: ₹{successInfo.pendingAmount}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label="Placeholder Created" color="primary" size="small" />
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<PrintIcon />}
                  onClick={handlePrintReceipt}
                >
                  Print Receipt
                </Button>
              </Stack>
            </Stack>
          </Alert>
        )}
        {!successInfo && (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Name (optional)" value={name} onChange={e => setName(e.target.value)} fullWidth />
              <TextField label="Mobile (optional)" value={mobile} onChange={e => setMobile(e.target.value)} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Payment Amount" required type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} fullWidth />
              <TextField label="Total Fee (optional)" type="number" value={totalFee} onChange={e => setTotalFee(e.target.value)} fullWidth helperText="If unknown, defaults to payment amount" />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Payment Date" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField select label="Mode" value={paymentMode} onChange={e => setPaymentMode(e.target.value as typeof paymentModes[number])} fullWidth>
                {paymentModes.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Stack>
            <TextField label="Manual Receipt Number (optional)" value={manualReceiptNumber} onChange={e => setManualReceiptNumber(e.target.value)} fullWidth helperText="Leave blank to auto-generate" />
            <TextField label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline minRows={2} />
            <Divider />
            <Alert severity="info">A placeholder student record will be created. Convert later from Students module.</Alert>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>Close</Button>
        {!successInfo && <Button onClick={handleSubmit} disabled={!canSubmit} variant="contained">{submitting ? 'Saving...' : 'Record Payment'}</Button>}
      </DialogActions>

      {/* Print Receipt Dialog */}
      {receiptToPrint && studentToPrint && (
        <InstallmentReceiptPrint
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          installment={receiptToPrint}
          student={studentToPrint}
        />
      )}
    </Dialog>
  );
};

export default QuickPaymentDialog;
