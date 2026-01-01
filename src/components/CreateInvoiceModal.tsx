import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface InvoiceFormData {
  vendorName: string;
  vendorType: string;
  billingMonth: Date | null;
  roomRent: number;
  electricity: number;
  notes: string;
  totalAmount: number;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: InvoiceFormData) => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ open, onClose, onCreate }) => {
  const [form, setForm] = useState<InvoiceFormData>({
    vendorName: '',
    vendorType: 'Mess (Veg)',
    billingMonth: new Date(),
    roomRent: 0,
    electricity: 0,
    notes: '',
    totalAmount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate total using useMemo to avoid effect
  const totalAmount = useMemo(() => {
    return (form.roomRent || 0) + (form.electricity || 0);
  }, [form.roomRent, form.electricity]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.vendorName.trim()) err.vendorName = 'Vendor / Shop Name is required.';
    if (!form.billingMonth) err.billingMonth = 'Billing month is required.';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    const invoiceWithTotal = { ...form, totalAmount };
    onCreate(invoiceWithTotal);
    handleClose();
  };

  const handleClose = () => {
    setForm({
      vendorName: '',
      vendorType: 'Mess (Veg)',
      billingMonth: new Date(),
      roomRent: 0,
      electricity: 0,
      notes: '',
      totalAmount: 0,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AttachMoneyIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Create New Invoice
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mt: 0.5 }}>
          {/* Vendor Name */}
          <TextField
            fullWidth
            label="Vendor/Shop Name *"
            value={form.vendorName}
            onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
            error={!!errors.vendorName}
            helperText={errors.vendorName}
            placeholder="Enter vendor or shop name"
          />

          {/* Vendor Type */}
          <TextField
            fullWidth
            select
            label="Vendor Type *"
            value={form.vendorType}
            onChange={(e) => setForm({ ...form, vendorType: e.target.value })}
          >
            <MenuItem value="Mess (Veg)">Mess (Veg)</MenuItem>
            <MenuItem value="Mess (Non-Veg)">Mess (Non-Veg)</MenuItem>
            <MenuItem value="Shop">Shop</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>

          {/* Billing Month */}
          <DatePicker
            label="Billing Month *"
            value={form.billingMonth}
            onChange={(date) => setForm({ ...form, billingMonth: date })}
            views={['year', 'month']}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.billingMonth,
                helperText: errors.billingMonth,
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              },
            }}
          />

          {/* Room/Space Rent */}
          <TextField
            fullWidth
            type="number"
            label="Room/Space Rent"
            value={form.roomRent}
            onChange={(e) => setForm({ ...form, roomRent: parseFloat(e.target.value) || 0 })}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            inputProps={{ min: 0 }}
          />

          {/* Electricity Bill */}
          <TextField
            fullWidth
            type="number"
            label="Electricity Bill"
            value={form.electricity}
            onChange={(e) => setForm({ ...form, electricity: parseFloat(e.target.value) || 0 })}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            inputProps={{ min: 0 }}
          />

          {/* Total Amount - Read Only */}
          <Box
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'grey.50',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Amount
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              ₹{totalAmount.toLocaleString()}
            </Typography>
          </Box>

          {/* Notes */}
          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes (Optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional information..."
            />
          </Box>
        </Box>

        {/* Footer Info */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoneyIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Administration Billing System
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ px: 3 }}
        >
          Create Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceModal;
