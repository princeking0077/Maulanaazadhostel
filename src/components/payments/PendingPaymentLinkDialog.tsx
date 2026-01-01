import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItem, ListItemText, ListItemButton } from '@mui/material';
import { listPendingPayments, linkPendingPayment, InstallmentResult } from '../../services/offlinePayments';

interface PendingPayment {
  id: number;
  tempReference: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMode: string;
  notes?: string;
  academicYear?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: number;
  academicYear: string;
  onLinked?: () => void;
}

const PendingPaymentLinkDialog: React.FC<Props> = ({ open, onClose, studentId, academicYear, onLinked }) => {
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [totalFee, setTotalFee] = useState('');

  const loadPending = async () => {
    setLoading(true);
    const data = await listPendingPayments();
    setPending(data.map(p => ({
      id: p.id!,
      tempReference: p.tempReference,
      paymentAmount: p.paymentAmount,
      paymentDate: p.paymentDate.toISOString().substring(0,10),
      paymentMode: p.paymentMode,
      notes: p.notes,
      academicYear: p.academicYear
    })));
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    // Defer loading to next tick to avoid synchronous state updates warning
    const handle = setTimeout(() => { void loadPending(); }, 0);
    return () => clearTimeout(handle);
  }, [open]);

  const handleLink = async () => {
    if (!selectedId) return;
    const pp = pending.find(p => p.id === selectedId);
    if (!pp) return;
    const result: InstallmentResult = await linkPendingPayment(selectedId, studentId, { academicYear, totalFee: totalFee ? parseFloat(totalFee) : undefined });
    if (!result.success) { alert(result.error || 'Failed to convert pending payment'); return; }
    if (onLinked) onLinked();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Link Pending Payment</DialogTitle>
      <DialogContent>
        <TextField label="Total Fee (if first installment)" type="number" fullWidth margin="normal" value={totalFee} onChange={e => setTotalFee(e.target.value)} />
        {loading ? 'Loading...' : (
          <List>
            {pending.map(p => (
              <ListItemButton key={p.id} selected={selectedId === p.id} onClick={() => setSelectedId(p.id)}>
                <ListItemText primary={`₹${p.paymentAmount} on ${p.paymentDate}`} secondary={`${p.tempReference} | ${p.paymentMode}`} />
              </ListItemButton>
            ))}
            {pending.length === 0 && <ListItem><ListItemText primary="No pending payments" /></ListItem>}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={!selectedId} onClick={handleLink} variant="contained">Link & Convert</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PendingPaymentLinkDialog;
