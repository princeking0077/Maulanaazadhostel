import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import { db, FacilityTransaction } from '../database/db';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import AdminBillingPrintDialog from '../components/AdminBillingPrintDialog';

const FACILITIES = ['Mess', 'Canteen', 'Xerox', 'Tenders', 'Faculty Loan'] as const;
const TXN_TYPES = ['Income', 'Expense'] as const;

const AdministrationBilling: React.FC = () => {
  const [transactions, setTransactions] = useState<FacilityTransaction[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<FacilityTransaction>>({
    date: new Date(),
    facility: 'Mess',
    txnType: 'Expense',
    partyName: '',
    faculty: '',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    description: '',
    amount: 0,
    receiptNo: '',
    billNo: '',
    paymentMethod: 'Cash',
    paymentRef: '',
  });
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [hostelName, setHostelName] = useState<string>('Maulana Azad Hostel');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FacilityTransaction | null>(null);

  const loadTransactions = async () => {
    const data = await db.facilityTransactions.orderBy('date').reverse().toArray();
    setTransactions(data);
  };

  const loadSettings = async () => {
    const uploadedLogo = localStorage.getItem('uploadedLogo');
    if (uploadedLogo) setLogoBase64(uploadedLogo);

    const savedName = await db.settings.get('hostelName');
    if (savedName?.value) setHostelName(savedName.value);
  };

  useEffect(() => {
    // eslint-disable-next-line
    loadTransactions();
    loadSettings();
  }, []);

  // generateReceiptNo function removed (local sequence handled in save)

  const generateBillNo = async () => {
    const count = await db.facilityTransactions.count();
    return `AB${String(count + 1).padStart(5, '0')}`;
  };

  const handleSave = async () => {
    if (!formData.partyName || !formData.amount) {
      alert('Please fill required fields');
      return;
    }

    const data: Omit<FacilityTransaction, 'id'> = {
      date: formData.date || new Date(),
      facility: formData.facility || 'Mess',
      txnType: formData.txnType || 'Expense',
      partyName: formData.partyName,
      faculty: formData.faculty || '',
      academicYear: formData.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      description: formData.description,
      amount: Number(formData.amount),
      receiptNo: formData.receiptNo,
      billNo: formData.billNo,
      paymentMethod: formData.paymentMethod,
      paymentRef: formData.paymentRef,
      items: formData.items || [],
      subtotal: Number(formData.amount),
      gstPercent: 0,
      gstAmount: 0,
      netAmount: Number(formData.amount),
      paidAmount: Number(formData.amount),
      balanceAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (editingId) {
      await db.facilityTransactions.update(editingId, data);
    } else {
      // Offline-only: generate local sequential receipt number and persist
      const counterSetting = await db.settings
        .where('key')
        .equals('adminReceiptCounter')
        .first();
      let currentCounter = 1;
      if (counterSetting) {
        currentCounter = parseInt(counterSetting.value, 10) || 1;
      } else {
        await db.settings.add({ key: 'adminReceiptCounter', value: '1', description: 'Sequential admin receipt number counter' });
      }
      data.receiptNo = `ADMIN-${currentCounter.toString().padStart(3, '0')}`;
      // Increment local counter
      const cs = await db.settings.where('key').equals('adminReceiptCounter').first();
      if (cs) {
        const val = parseInt(cs.value, 10) || 1;
        await db.settings.update(cs.id!, { value: (val + 1).toString() });
      }

      await db.facilityTransactions.add(data);
    }

    resetForm();
    loadTransactions();
  };

  const handleEdit = (transaction: FacilityTransaction) => {
    setEditingId(transaction.id || null);
    setFormData(transaction);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this transaction?')) {
      await db.facilityTransactions.delete(id);
      loadTransactions();
    }
  };

  const resetForm = async () => {
    setEditingId(null);
    // Clear receipt field until next save (will be populated from backend or fallback)
    const receiptNo = '';
    setFormData({
      date: new Date(),
      facility: 'Mess',
      txnType: 'Expense',
      partyName: '',
      faculty: '',
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      description: '',
      amount: 0,
      receiptNo: receiptNo,
      billNo: '',
      paymentMethod: 'Cash',
      paymentRef: '',
    });
  };

  const handleNewEntry = () => {
    setCreateModalOpen(true);
  };

  const handleCreateInvoice = async (invoiceData: {
    vendorName: string;
    vendorType: string;
    billingMonth: Date | null;
    roomRent: number;
    electricity: number;
    notes: string;
    totalAmount: number;
  }) => {
    const billNo = await generateBillNo();

    const data: Omit<FacilityTransaction, 'id'> = {
      date: invoiceData.billingMonth || new Date(),
      facility: 'Mess',
      txnType: 'Expense',
      partyName: invoiceData.vendorName,
      description: `${invoiceData.vendorType} - ${invoiceData.notes || ''}`,
      amount: invoiceData.totalAmount,
      receiptNo: '',
      billNo: billNo,
      paymentMethod: 'Cash',
      paymentRef: '',
      items: [
        ...(invoiceData.roomRent > 0 ? [{ description: 'Room/Space Rent', qty: 1, rate: invoiceData.roomRent, amount: invoiceData.roomRent }] : []),
        ...(invoiceData.electricity > 0 ? [{ description: 'Electricity Bill', qty: 1, rate: invoiceData.electricity, amount: invoiceData.electricity }] : []),
      ],
      subtotal: invoiceData.totalAmount,
      gstPercent: 0,
      gstAmount: 0,
      netAmount: invoiceData.totalAmount,
      paidAmount: 0,
      balanceAmount: invoiceData.totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.facilityTransactions.add(data);
    setCreateModalOpen(false);
    loadTransactions();
  };

  const handlePrintTransaction = (transaction: FacilityTransaction) => {
    setSelectedTransaction(transaction);
    setPrintDialogOpen(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 15, 10, 30, 30);
    }

    // Header
    doc.setFontSize(18);
    doc.text(hostelName, 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Administration Billing Register', 105, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' });

    // Table
    let y = 45;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Date', 15, y);
    doc.text('Bill No', 35, y);
    doc.text('Facility', 55, y);
    doc.text('Party', 72, y);
    doc.text('Faculty', 92, y);
    doc.text('Acad Yr', 108, y);
    doc.text('Desc', 128, y);
    doc.text('Type', 150, y);
    doc.text('Amount', 170, y);

    doc.setFont(undefined, 'normal');
    y += 7;

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((txn) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const dateStr = new Date(txn.date).toLocaleDateString();
      doc.text(dateStr.substring(0, 10), 15, y);
      doc.text((txn.billNo || txn.receiptNo || '').substring(0, 8), 35, y);
      doc.text(txn.facility.substring(0, 6), 55, y);
      doc.text(txn.partyName.substring(0, 10), 72, y);
      doc.text((txn.faculty || '-').substring(0, 8), 92, y);
      doc.text((txn.academicYear || '-').substring(0, 9), 108, y);
      doc.text((txn.description || '').substring(0, 10), 128, y);
      doc.text(txn.txnType, 150, y);
      doc.text(`₹${txn.amount.toFixed(2)}`, 170, y);

      if (txn.txnType === 'Income') totalIncome += txn.amount;
      else totalExpense += txn.amount;

      y += 6;
    });

    // Summary
    y += 5;
    doc.setFont(undefined, 'bold');
    doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 15, y);
    y += 5;
    doc.text(`Total Expense: ₹${totalExpense.toFixed(2)}`, 15, y);
    y += 5;
    doc.text(`Net: ₹${(totalIncome - totalExpense).toFixed(2)}`, 15, y);

    doc.save('Administration_Billing_Register.pdf');
  };

  const exportToExcel = () => {
    const data = transactions.map((txn) => ({
      Date: new Date(txn.date).toLocaleDateString(),
      'Bill No': txn.billNo || txn.receiptNo || '',
      Facility: txn.facility,
      'Party Name': txn.partyName,
      'Faculty': txn.faculty || '-',
      'Academic Year': txn.academicYear || '-',
      Description: txn.description || '',
      Type: txn.txnType,
      Amount: txn.amount,
      'Payment Method': txn.paymentMethod || '',
      'Payment Ref': txn.paymentRef || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admin Billing');
    XLSX.writeFile(wb, 'Administration_Billing_Register.xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Administration Billing</Typography>
        <Box display="flex" gap={1}>
          <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="outlined">
            Print
          </Button>
          <Button startIcon={<PictureAsPdfIcon />} onClick={exportToPDF} variant="outlined">
            PDF
          </Button>
          <Button startIcon={<TableViewIcon />} onClick={exportToExcel} variant="outlined">
            Excel
          </Button>
          <Button startIcon={<AddIcon />} onClick={handleNewEntry} variant="contained">
            New Entry
          </Button>
        </Box>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editingId ? 'Edit Transaction' : 'New Transaction'}
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
          <TextField
            label="Date"
            type="date"
            value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Receipt No"
            value={formData.receiptNo || ''}
            InputProps={{ readOnly: true }}
            helperText={formData.receiptNo ? 'Generated automatically' : 'Will be generated on save'}
          />
          <TextField
            label="Facility"
            select
            value={formData.facility}
            onChange={(e) => setFormData({ ...formData, facility: e.target.value as typeof FACILITIES[number] })}
          >
            {FACILITIES.map((fac) => (
              <MenuItem key={fac} value={fac}>
                {fac}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Transaction Type"
            select
            value={formData.txnType}
            onChange={(e) => setFormData({ ...formData, txnType: e.target.value as typeof TXN_TYPES[number] })}
          >
            {TXN_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Party Name"
            value={formData.partyName}
            onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
            required
          />
          <TextField
            label="Faculty/Department"
            value={formData.faculty || ''}
            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
            placeholder="Optional"
          />
          <TextField
            label="Academic Year"
            value={formData.academicYear || ''}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            placeholder="e.g., 2025-2026"
          />
          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ gridColumn: 'span 3' }}
            multiline
            rows={2}
          />

          <TextField
            label="Payment Method"
            select
            value={formData.paymentMethod}
            onChange={(e) =>
              setFormData({ ...formData, paymentMethod: e.target.value as 'Cash' | 'Online' | 'Cheque' })
            }
          >
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Online">Online</MenuItem>
            <MenuItem value="Cheque">Cheque</MenuItem>
          </TextField>
          <TextField
            label="Payment Ref/UTR"
            value={formData.paymentRef}
            onChange={(e) => setFormData({ ...formData, paymentRef: e.target.value })}
            sx={{ gridColumn: 'span 2' }}
          />
        </Box>

        <Box mt={2} display="flex" gap={2}>
          <Button variant="contained" onClick={handleSave}>
            {editingId ? 'Update' : 'Save'}
          </Button>
          {editingId && (
            <Button variant="outlined" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </Box>
      </Paper>

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Bill No</TableCell>
              <TableCell>Facility</TableCell>
              <TableCell>Party</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                <TableCell>{txn.billNo || txn.receiptNo || '-'}</TableCell>
                <TableCell>{txn.facility}</TableCell>
                <TableCell>{txn.partyName}</TableCell>
                <TableCell>{txn.faculty || '-'}</TableCell>
                <TableCell>{txn.academicYear || '-'}</TableCell>
                <TableCell>{txn.description}</TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      color: txn.txnType === 'Income' ? 'success.main' : 'error.main',
                      fontWeight: 600,
                    }}
                  >
                    {txn.txnType}
                  </Box>
                </TableCell>
                <TableCell align="right">₹{txn.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => handlePrintTransaction(txn)}>
                    <PrintIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(txn)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => txn.id && handleDelete(txn.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary">
            Income: ₹
            {transactions
              .filter((t) => t.txnType === 'Income')
              .reduce((sum, t) => sum + t.amount, 0)
              .toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Expense: ₹
            {transactions
              .filter((t) => t.txnType === 'Expense')
              .reduce((sum, t) => sum + t.amount, 0)
              .toFixed(2)}
          </Typography>
        </Box>
        <Typography variant="h6">
          Net: ₹
          {(
            transactions
              .filter((t) => t.txnType === 'Income')
              .reduce((sum, t) => sum + t.amount, 0) -
            transactions
              .filter((t) => t.txnType === 'Expense')
              .reduce((sum, t) => sum + t.amount, 0)
          ).toFixed(2)}
        </Typography>
      </Box>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateInvoice}
      />

      {/* Print Dialog */}
      {selectedTransaction && (
        <AdminBillingPrintDialog
          open={printDialogOpen}
          onClose={() => {
            setPrintDialogOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </Box>
  );
};

export default AdministrationBilling;
