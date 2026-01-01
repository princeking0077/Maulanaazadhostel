import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Fab,
  Alert,
  Snackbar,
  Autocomplete,
  Divider,
  Paper,
  Chip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Stack,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountBalanceIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  WarningAmber as WarningAmberIcon,
  PendingActions as PendingActionsIcon,
  FileDownload as FileDownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { db } from '../database/db';
import type { Payment, Student, InstallmentReceipt } from '../database/db';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ReceiptPrintDialog from '../components/ReceiptPrintDialog';
import NextInstallmentForm from '../components/payments/NextInstallmentForm';
import InstallmentReceiptPrint from '../components/payments/InstallmentReceiptPrint';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<(Payment & { studentName?: string })[]>([]);
  const [installments, setInstallments] = useState<(InstallmentReceipt & { studentName?: string; isPlaceholder?: boolean })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [nextInstallmentOpen, setNextInstallmentOpen] = useState(false);
  const [selectedStudentForInstallment, setSelectedStudentForInstallment] = useState<{ id: number; academicYear: string; pendingAmount: number } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ anchorEl: HTMLElement | null; payment: Payment | null }>({ anchorEl: null, payment: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'payments' | 'installments'>('installments'); // Default to new installments view
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);
  const [installmentReceiptDialogOpen, setInstallmentReceiptDialogOpen] = useState(false);
  const [selectedInstallmentForReceipt, setSelectedInstallmentForReceipt] = useState<InstallmentReceipt | null>(null);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Payment>>({
    studentId: 0,
    receiptNo: '',
    date: new Date(),
    registrationFee: 0,
    rentFee: 0,
    waterFee: 0,
    gymFee: 0,
    otherFee: 0,
    securityDeposit: 0,
    electricityFee: 0,
    totalAmount: 0,
    balanceAmount: 0,
    paymentStatus: 'Paid',
    utrNo: '',
    paymentMethod: 'Cash',
    cashier: 'Admin',
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-calculate total amount
    const total = (formData.registrationFee || 0) +
      (formData.rentFee || 0) +
      (formData.waterFee || 0) +
      (formData.gymFee || 0) +
      (formData.otherFee || 0) +
      (formData.securityDeposit || 0) +
      (formData.electricityFee || 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.registrationFee, formData.rentFee, formData.waterFee, formData.gymFee, formData.otherFee, formData.securityDeposit, formData.electricityFee]);

  useEffect(() => {
    // Generate receipt number
    if (openDialog && !formData.receiptNo) {
      const generateReceiptNo = async () => {
        // Get current receipt counter from settings
        const counterSetting = await db.settings
          .where('key')
          .equals('receiptCounter')
          .first();

        let counter = 1;
        if (counterSetting) {
          counter = parseInt(counterSetting.value, 10) || 1;
        } else {
          // Initialize counter if not exists
          await db.settings.add({
            key: 'receiptCounter',
            value: '1',
            description: 'Sequential receipt number counter'
          });
        }

        // Format as RCP-001, RCP-002, etc.
        const receiptNo = `RCP-${counter.toString().padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, receiptNo }));
      };

      generateReceiptNo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDialog]);

  useEffect(() => {
    if (formData.paymentStatus === 'Paid' && (formData.balanceAmount ?? 0) !== 0) {
      setFormData(prev => ({ ...prev, balanceAmount: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.paymentStatus]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load students, payments, installments, and fee aggregates
      const [studentsData, paymentsData, installmentsData] = await Promise.all([
        db.students.toArray(),
        db.payments.orderBy('createdAt').reverse().toArray(),
        db.installmentReceipts.orderBy('createdAt').reverse().toArray(),
      ]);

      // Add student names to payments
      const paymentsWithNames = paymentsData.map(payment => {
        const student = studentsData.find(s => s.id === payment.studentId);
        return {
          ...payment,
          studentName: student?.name || 'Unknown Student'
        };
      });

      // Add student names and placeholder status to installments
      const installmentsWithNames = installmentsData.map(installment => {
        const student = studentsData.find(s => s.id === installment.studentId);
        return {
          ...installment,
          studentName: student?.name || (student?.placeholderRef ? `Placeholder (${student.placeholderRef})` : 'Unknown Student'),
          isPlaceholder: student?.isPlaceholder || false
        };
      });

      setStudents(studentsData);
      setPayments(paymentsWithNames);
      setInstallments(installmentsWithNames);
      console.log('[Payments] Loaded data:', { students: studentsData.length, payments: paymentsData.length, installments: installmentsData.length });
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const currentStatus = payment.paymentStatus ?? 'Paid';
    const matchesStatus = !statusFilter || currentStatus === statusFilter;
    const matchesSearch = !searchTerm ||
      payment.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.studentName ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCollected = payments.reduce((sum, payment) => sum + (payment.totalAmount ?? 0), 0);
  const totalOutstanding = payments.reduce((sum, payment) => sum + (payment.balanceAmount ?? 0), 0);
  const partialCount = payments.filter(payment => (payment.paymentStatus ?? 'Paid') === 'Partial').length;
  const pendingCount = payments.filter(payment => (payment.paymentStatus ?? 'Paid') === 'Pending').length;

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSavePayment = async () => {
    try {
      if (!formData.studentId || !formData.receiptNo) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      const paymentStatus = formData.paymentStatus ?? 'Paid';
      const totalAmount = formData.totalAmount ?? 0;
      const balanceAmount = formData.balanceAmount ?? 0;

      if ((paymentStatus === 'Paid' || paymentStatus === 'Partial') && totalAmount <= 0) {
        showSnackbar('Enter the amount received for paid or partial payments', 'error');
        return;
      }

      if ((paymentStatus === 'Partial' || paymentStatus === 'Pending') && balanceAmount <= 0) {
        showSnackbar('Enter the pending balance for partial or pending payments', 'error');
        return;
      }

      if (balanceAmount < 0) {
        showSnackbar('Balance amount cannot be negative', 'error');
        return;
      }

      const payload: Payment = {
        studentId: formData.studentId,
        receiptNo: formData.receiptNo,
        date: formData.date || new Date(),
        registrationFee: formData.registrationFee ?? 0,
        rentFee: formData.rentFee ?? 0,
        waterFee: formData.waterFee ?? 0,
        gymFee: formData.gymFee ?? 0,
        otherFee: formData.otherFee ?? 0,
        securityDeposit: formData.securityDeposit ?? 0,
        electricityFee: formData.electricityFee ?? 0,
        totalAmount,
        balanceAmount: paymentStatus === 'Paid' ? 0 : balanceAmount,
        paymentStatus,
        utrNo: formData.utrNo,
        paymentMethod: formData.paymentMethod ?? 'Cash',
        cashier: formData.cashier ?? 'Admin',
        createdAt: editingPayment?.createdAt || new Date(),
      };

      if (editingPayment) {
        await db.payments.update(editingPayment.id!, payload);
        showSnackbar('Payment updated successfully', 'success');
      } else {
        await db.payments.add(payload);

        // Increment receipt counter for next payment
        const counterSetting = await db.settings
          .where('key')
          .equals('receiptCounter')
          .first();

        if (counterSetting) {
          const currentCounter = parseInt(counterSetting.value, 10) || 1;
          await db.settings.update(counterSetting.id!, {
            value: (currentCounter + 1).toString()
          });
        }

        // Auto-save to Receipt Register
        const student = students.find(s => s.id === formData.studentId);
        if (student) {
          await db.receiptRegister.add({
            date: formData.date || new Date(),
            receiptNo: formData.receiptNo,
            studentId: formData.studentId,
            name: student.name,
            year: student.yearOfCollege || '',
            collegeName: student.collegeName || '',
            faculty: student.faculty || '',
            collegeYear: student.yearOfCollege || '',
            rent: formData.rentFee ?? 0,
            electricity: formData.electricityFee ?? 0,
            securityDeposit: formData.securityDeposit ?? 0,
            anyOther: formData.otherFee ?? 0,
            registrationFees: formData.registrationFee ?? 0,
            modeOfTransaction: formData.paymentMethod ?? 'Cash',
            totalAmount,
            createdAt: new Date(),
          });
        }

        showSnackbar('Payment recorded successfully', 'success');

        // Auto-open print dialog for new payments
        const newPayment = { ...payload, id: await db.payments.orderBy('createdAt').last().then(p => p?.id) };
        if (student) {
          setSelectedPaymentForReceipt(newPayment);
          setSelectedStudentForReceipt(student);
          setReceiptDialogOpen(true);
        }
      }

      setOpenDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving payment:', error);
      showSnackbar('Error saving payment', 'error');
    }
  };

  const resetForm = () => {
    setEditingPayment(null);
    setFormData({
      studentId: 0,
      receiptNo: '',
      date: new Date(),
      registrationFee: 0,
      rentFee: 0,
      waterFee: 0,
      gymFee: 0,
      otherFee: 0,
      securityDeposit: 0,
      electricityFee: 0,
      totalAmount: 0,
      balanceAmount: 0,
      paymentStatus: 'Paid',
      utrNo: '',
      paymentMethod: 'Cash',
      cashier: 'Admin',
    });
    setSelectedStudent(null);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    const student = students.find(s => s.id === payment.studentId);
    setSelectedStudent(student || null);
    setFormData({
      ...payment,
      date: new Date(payment.date),
    });
    setOpenDialog(true);
    setMenuAnchor({ anchorEl: null, payment: null });
  };

  const handleDelete = async (payment: Payment) => {
    if (window.confirm(`Are you sure you want to delete receipt ${payment.receiptNo}?`)) {
      try {
        await db.payments.delete(payment.id!);
        showSnackbar('Payment record deleted successfully', 'success');
        loadData();
      } catch (error) {
        console.error('Error deleting payment:', error);
        showSnackbar('Failed to delete payment record', 'error');
      }
    }
    setMenuAnchor({ anchorEl: null, payment: null });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    setMenuAnchor({ anchorEl: event.currentTarget, payment });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ anchorEl: null, payment: null });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleStudentChange = async (student: Student | null) => {
    setSelectedStudent(student);

    if (student) {
      // Fetch previous pending balance
      const previousPayments = await db.payments
        .where('studentId')
        .equals(student.id!)
        .toArray();

      const totalPreviousPending = previousPayments.reduce(
        (sum, payment) => sum + (payment.balanceAmount || 0),
        0
      );

      // Set default fees based on wing
      const defaultRegistrationFee = 3000;
      let defaultRentFee = 11000;
      const defaultWaterAndElectricity = 4000;

      if (student.wing === 'A') {
        defaultRentFee = 14000;
      }

      setFormData(prev => ({
        ...prev,
        studentId: student.id || 0,
        // Set default fees based on wing
        registrationFee: defaultRegistrationFee,
        rentFee: defaultRentFee,
        waterFee: defaultWaterAndElectricity, // Water and electricity combined
        electricityFee: 0, // Combined in waterFee
        gymFee: 0,
        otherFee: 0,
        paymentStatus: totalPreviousPending > 0 ? 'Partial' : 'Paid',
        balanceAmount: totalPreviousPending, // Auto-fetch previous pending balance
      }));

      if (totalPreviousPending > 0) {
        showSnackbar(`Previous pending balance: ₹${totalPreviousPending.toLocaleString('en-IN')}`, 'success');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        studentId: 0,
        registrationFee: 0,
        rentFee: 0,
        waterFee: 0,
        electricityFee: 0,
        gymFee: 0,
        otherFee: 0,
        paymentStatus: 'Pending',
        balanceAmount: 0,
      }));
    }
  };

  const handlePrintReceipt = (payment: Payment & { studentName?: string }) => {
    setSelectedPaymentForReceipt(payment);
    setReceiptDialogOpen(true);
  };

  const handlePrintInstallmentReceipt = (installment: InstallmentReceipt & { studentName?: string; isPlaceholder?: boolean }) => {
    console.log('[Payments] Print installment receipt:', installment);
    setSelectedInstallmentForReceipt(installment);
    setInstallmentReceiptDialogOpen(true);
  };

  // Legacy print function - kept for reference, now using ReceiptPrintDialog
  const handlePrintReceiptLegacy = (payment: Payment & { studentName?: string }) => {
    try {
      const student = students.find(s => s.id === payment.studentId);
      const hostelName = 'Maulana Azad Hostel Complex';
      const appName = 'Modern Hostel Management System';
      const paymentDate = new Date(payment.date).toLocaleDateString();
      const issuedOn = new Date(payment.createdAt ?? payment.date).toLocaleString();

      const formatCurrency = (value: number | undefined) => `₹${(value ?? 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      const feeBreakdown = [
        { label: 'Registration Fee', value: payment.registrationFee },
        { label: 'Hostel Rent', value: payment.rentFee },
        { label: 'Electricity Fee', value: payment.electricityFee },
        { label: 'Security Deposit', value: payment.securityDeposit },
        { label: 'Water Charges', value: payment.waterFee },
        { label: 'Gym Charges', value: payment.gymFee },
        { label: 'Other Charges', value: payment.otherFee },
      ];

      // Try window.open first (works in browsers)
      let printWindow: Window | null = null;
      try {
        printWindow = window.open('', 'PRINT', 'height=720,width=900,menubar=no,toolbar=no,scrollbars=yes');
      } catch {
        console.log('window.open blocked, using alternative method');
      }

      if (!printWindow) {
        // Fallback for Electron: create a temporary div and print the current window
        handleElectronPrint(payment, student, hostelName, appName, paymentDate, issuedOn, formatCurrency, feeBreakdown);
        return;
      }

      // Students details rendered in receipt
      /*const studentDetails = `
        <tr><td>Student Name</td><td>${student?.name ?? payment.studentName ?? 'N/A'}</td></tr>
        <tr><td>Enrollment No</td><td>${student?.enrollmentNo ?? 'N/A'}</td></tr>
        <tr><td>Mobile</td><td>${student?.mobile ?? 'N/A'}</td></tr>
        <tr><td>Wing / Room</td><td>${student ? `${student.wing}-${student.roomNo}` : 'N/A'}</td></tr>
        <tr><td>College</td><td>${student?.collegeName ?? 'N/A'}</td></tr>
        <tr><td>Year of College</td><td>${student?.yearOfCollege ?? 'N/A'}</td></tr>
        <tr><td>Residency Status</td><td>${student?.residencyStatus ?? 'Permanent'}</td></tr>
        <tr><td>Address</td><td>${student?.address ?? 'N/A'}</td></tr>
      `;*/

      /*const feeRows = feeBreakdown
        .filter(item => (item.value ?? 0) > 0)
        .map(item => `
          <tr>
            <td>${item.label}</td>
            <td>${formatCurrency(item.value)}</td>
          </tr>
        `)
        .join('') || '<tr><td colspan="2">No fee components recorded.</td></tr>';*/

      const receiptHtml = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Fee Receipt - ${payment.receiptNo}</title>
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: 'Segoe UI', 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                color: #2d3748;
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                line-height: 1.6;
              }
              .receipt-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                position: relative;
              }
              .header-bg {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 0;
                position: relative;
                overflow: hidden;
              }
              .header-bg::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20px;
                width: 200px;
                height: 200px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
              }
              .header-content {
                padding: 32px;
                color: white;
                position: relative;
                z-index: 2;
              }
              .brand-header h1 {
                margin: 0 0 8px 0;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -0.025em;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .brand-header h2 {
                margin: 0 0 4px 0;
                font-size: 18px;
                font-weight: 500;
                opacity: 0.95;
              }
              .brand-header p {
                margin: 0;
                font-size: 14px;
                opacity: 0.8;
              }
              .receipt-number {
                position: absolute;
                top: 24px;
                right: 32px;
                background: rgba(255, 255, 255, 0.2);
                padding: 8px 16px;
                border-radius: 8px;
                backdrop-filter: blur(10px);
              }
              .receipt-number strong {
                font-size: 16px;
                font-weight: 600;
              }
              .content-section {
                padding: 32px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 32px;
              }
              .info-card {
                background: #f8fafc;
                border-radius: 12px;
                padding: 20px;
                border-left: 4px solid #667eea;
              }
              .info-card h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #4a5568;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 4px 0;
                border-bottom: 1px solid #e2e8f0;
              }
              .info-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
              }
              .info-label {
                color: #718096;
                font-weight: 500;
                flex: 1;
              }
              .info-value {
                color: #2d3748;
                font-weight: 600;
                text-align: right;
                flex: 1;
              }
              .fees-table {
                width: 100%;
                border-collapse: collapse;
                margin: 24px 0;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              }
              .fees-table th {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                text-align: left;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .fees-table td {
                padding: 16px 20px;
                border-bottom: 1px solid #e2e8f0;
                background: white;
              }
              .fees-table tr:last-child td {
                border-bottom: none;
              }
              .fees-table tr:nth-child(even) td {
                background: #f8fafc;
              }
              .fee-amount {
                font-weight: 600;
                color: #2d3748;
                text-align: right;
              }
              .total-row {
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%) !important;
                color: white !important;
              }
              .total-row td {
                background: none !important;
                font-weight: 700;
                font-size: 16px;
                padding: 20px;
              }
              .balance-row {
                background: ${payment.balanceAmount > 0 ? 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'} !important;
                color: white !important;
              }
              .balance-row td {
                background: none !important;
                font-weight: 700;
                padding: 16px 20px;
              }
              .payment-status {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                ${payment.paymentStatus === 'Paid' ? 'background: #c6f6d5; color: #22543d;' :
          payment.paymentStatus === 'Partial' ? 'background: #fed7d7; color: #742a2a;' :
            'background: #feebc8; color: #7b341e;'}
              }
              .signature-section {
                margin-top: 40px;
                padding-top: 24px;
                border-top: 2px dashed #cbd5e0;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .signature-box {
                text-align: center;
                min-width: 200px;
              }
              .signature-line {
                border-top: 2px solid #4a5568;
                margin-top: 50px;
                padding-top: 8px;
                font-weight: 600;
                color: #4a5568;
              }
              .footer-info {
                background: #f7fafc;
                margin: 24px -32px -32px -32px;
                padding: 20px 32px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #718096;
              }
              .qr-placeholder {
                width: 60px;
                height: 60px;
                border: 2px dashed #cbd5e0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #a0aec0;
                text-align: center;
                line-height: 1.2;
              }
              @media print {
                body { background: white !important; padding: 0 !important; }
                .receipt-container { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
                .print-hide { display: none !important; }
                .info-grid { grid-template-columns: 1fr; gap: 16px; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="header-bg">
                <div class="receipt-number">
                  <strong>#${payment.receiptNo}</strong>
                </div>
                <div class="header-content">
                  <div class="brand-header">
                    <h1>${hostelName}</h1>
                    <h2>Official Fee Receipt</h2>
                    <p>Digitally processed payment acknowledgement</p>
                  </div>
                </div>
              </div>
              
              <div class="content-section">
                <div class="info-grid">
                  <div class="info-card">
                    <h3>Student Details</h3>
                    <div class="info-row">
                      <span class="info-label">Name:</span>
                      <span class="info-value">${student?.name ?? payment.studentName ?? 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Enrollment:</span>
                      <span class="info-value">${student?.enrollmentNo ?? 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Mobile:</span>
                      <span class="info-value">${student?.mobile ?? 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Room:</span>
                      <span class="info-value">${student ? `${student.wing}-${student.roomNo}` : 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">College:</span>
                      <span class="info-value">${student?.collegeName ?? 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Year:</span>
                      <span class="info-value">${student?.yearOfCollege ?? 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Status:</span>
                      <span class="info-value">${student?.residencyStatus ?? 'Permanent'}</span>
                    </div>
                  </div>
                  
                  <div class="info-card">
                    <h3>Payment Information</h3>
                    <div class="info-row">
                      <span class="info-label">Date:</span>
                      <span class="info-value">${paymentDate}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Method:</span>
                      <span class="info-value">${payment.paymentMethod}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Status:</span>
                      <span class="info-value"><span class="payment-status">${payment.paymentStatus || 'Paid'}</span></span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">UTR/Ref:</span>
                      <span class="info-value">${payment.utrNo || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Cashier:</span>
                      <span class="info-value">${payment.cashier}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Issued:</span>
                      <span class="info-value">${issuedOn}</span>
                    </div>
                  </div>
                </div>

                <table class="fees-table">
                  <thead>
                    <tr>
                      <th style="width: 60%;">Fee Description</th>
                      <th style="width: 40%;">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${feeBreakdown
          .filter(item => (item.value ?? 0) > 0)
          .map(item => `
                        <tr>
                          <td>${item.label}</td>
                          <td class="fee-amount">${formatCurrency(item.value)}</td>
                        </tr>
                      `).join('') || '<tr><td colspan="2" style="text-align: center; color: #718096; font-style: italic;">No fee components recorded</td></tr>'}
                    <tr class="total-row">
                      <td><strong>Total Amount Paid</strong></td>
                      <td class="fee-amount"><strong>${formatCurrency(payment.totalAmount)}</strong></td>
                    </tr>
                    <tr class="balance-row">
                      <td><strong>${payment.balanceAmount > 0 ? 'Outstanding Balance' : 'Balance (Paid in Full)'}</strong></td>
                      <td class="fee-amount"><strong>${formatCurrency(payment.balanceAmount)}</strong></td>
                    </tr>
                  </tbody>
                </table>

                <div class="signature-section">
                  <div class="signature-box">
                    <div class="signature-line">Student Signature</div>
                  </div>
                  <div class="qr-placeholder">
                    QR<br/>Code
                  </div>
                  <div class="signature-box">
                    <div class="signature-line">Authorized Signatory</div>
                  </div>
                </div>
              </div>

              <div class="footer-info">
                <div>
                  <strong>Note:</strong> This is a computer generated receipt and is valid without physical signature.<br/>
                  For queries, contact the hostel administration office.
                </div>
                <div style="text-align: right;">
                  <strong>${appName}</strong><br/>
                  Digital Receipt System
                </div>
              </div>
            </div>
          </body>
        </html>`;

      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      console.error('Error printing receipt:', error);
      showSnackbar('Unable to generate the receipt for printing.', 'error');
    }
  };
  // Keep legacy print function referenced to avoid TS unused error
  void handlePrintReceiptLegacy;

  const handleElectronPrint = (
    payment: Payment & { studentName?: string },
    student: Student | undefined,
    hostelName: string,
    appName: string,
    paymentDate: string,
    issuedOn: string,
    formatCurrency: (value: number | undefined) => string,
    feeBreakdown: { label: string; value: number | undefined }[]
  ) => {
    // Create a temporary container for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-receipt-container';
    printContainer.style.position = 'fixed';
    printContainer.style.top = '-9999px';
    printContainer.style.left = '-9999px';
    printContainer.style.width = '210mm';
    printContainer.style.minHeight = '297mm';
    printContainer.style.backgroundColor = 'white';
    printContainer.style.padding = '20mm';
    printContainer.style.fontFamily = "'Segoe UI', Tahoma, sans-serif";
    printContainer.style.fontSize = '12pt';
    printContainer.style.lineHeight = '1.4';
    printContainer.style.color = '#000';

    const studentDetails = `
      <tr><td><strong>Student Name:</strong></td><td>${student?.name ?? payment.studentName ?? 'N/A'}</td></tr>
      <tr><td><strong>Enrollment No:</strong></td><td>${student?.enrollmentNo ?? 'N/A'}</td></tr>
      <tr><td><strong>Mobile:</strong></td><td>${student?.mobile ?? 'N/A'}</td></tr>
      <tr><td><strong>Wing / Room:</strong></td><td>${student ? `${student.wing}-${student.roomNo}` : 'N/A'}</td></tr>
      <tr><td><strong>College:</strong></td><td>${student?.collegeName ?? 'N/A'}</td></tr>
      <tr><td><strong>Year:</strong></td><td>${student?.yearOfCollege ?? 'N/A'}</td></tr>
      <tr><td><strong>Residency:</strong></td><td>${student?.residencyStatus ?? 'Permanent'}</td></tr>
      <tr><td><strong>Address:</strong></td><td>${student?.address ?? 'N/A'}</td></tr>
    `;

    const feeRows = feeBreakdown
      .filter(item => (item.value ?? 0) > 0)
      .map(item => `
        <tr>
          <td><strong>${item.label}:</strong></td>
          <td>${formatCurrency(item.value)}</td>
        </tr>
      `)
      .join('') || '<tr><td colspan="2">No fee components recorded.</td></tr>';

    printContainer.innerHTML = `
      <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24pt; color: #111827; letter-spacing: 0.05em;">${hostelName}</h1>
        <h2 style="margin: 8px 0 0; font-size: 16pt; color: #2563eb; font-weight: 500;">${appName} • Fee Receipt</h2>
        <p style="margin: 8px 0 0; color: #666; font-size: 10pt;">Official payment acknowledgement</p>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11pt;">
        <div>
          <strong>Receipt No:</strong> ${payment.receiptNo}<br/>
          <strong>Payment Date:</strong> ${paymentDate}<br/>
          <strong>Issued On:</strong> ${issuedOn}
        </div>
        <div style="text-align: right;">
          <strong>Payment Method:</strong> ${payment.paymentMethod}<br/>
          <strong>Status:</strong> ${payment.paymentStatus || 'Paid'}<br/>
          <strong>UTR/Ref:</strong> ${payment.utrNo || 'N/A'}<br/>
          <strong>Cashier:</strong> ${payment.cashier}
        </div>
      </div>
      
      <h3 style="background: #f3f4f6; padding: 8px; margin: 20px 0 10px; font-size: 12pt;">Student Information</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
        <tbody>
          ${studentDetails.replace(/td>/g, 'td style="padding: 8px; border: 1px solid #ddd;">')}
        </tbody>
      </table>
      
      <h3 style="background: #f3f4f6; padding: 8px; margin: 20px 0 10px; font-size: 12pt;">Fee Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
        <tbody>
          ${feeRows.replace(/td>/g, 'td style="padding: 8px; border: 1px solid #ddd;">')}
          <tr style="background: #eff6ff; font-weight: bold;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount Paid:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(payment.totalAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Balance Pending:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(payment.balanceAmount)}</td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-top: 40px; text-align: right;">
        <div style="display: inline-block; margin-top: 30px; border-top: 1px solid #333; padding-top: 8px; font-size: 10pt;">
          Authorised Signatory
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px; padding-top: 16px; border-top: 1px dashed #ccc; font-size: 9pt; color: #666;">
        <span>This receipt is computer generated and valid without a physical signature.</span>
        <span>Generated via ${appName}</span>
      </div>
    `;

    // Add print styles
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-receipt-container, #print-receipt-container * { 
          visibility: visible; 
          position: static !important;
          top: auto !important;
          left: auto !important;
          width: auto !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        #print-receipt-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
        }
        @page {
          margin: 1cm;
          size: A4;
        }
      }
    `;

    document.head.appendChild(printStyles);
    document.body.appendChild(printContainer);

    // Print and cleanup
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.removeChild(printContainer);
        document.head.removeChild(printStyles);
        showSnackbar('Receipt sent to printer successfully!', 'success');
      }, 1000);
    }, 500);
  };

  const exportPaymentsToExcel = () => {
    try {
      const paymentsWithStudentInfo = payments.map((payment, index) => {
        const student = students.find(s => s.id === payment.studentId);
        return {
          'S.No': index + 1,
          'Receipt No': payment.receiptNo || 'N/A',
          'Student Name': student?.name || payment.studentName || 'N/A',
          'Enrollment No': student?.enrollmentNo || 'N/A',
          'Mobile': student?.mobile || 'N/A',
          'Faculty': student?.faculty || 'N/A',
          'College': student?.collegeName || 'N/A',
          'Wing-Room': student ? `${student.wing}-${student.roomNo}` : 'N/A',
          'Payment Date': new Date(payment.date).toLocaleDateString('en-IN'),
          'Registration Fee': payment.registrationFee ? `₹${payment.registrationFee.toLocaleString('en-IN')}` : '₹0',
          'Rent Fee': payment.rentFee ? `₹${payment.rentFee.toLocaleString('en-IN')}` : '₹0',
          'Water Fee': payment.waterFee ? `₹${payment.waterFee.toLocaleString('en-IN')}` : '₹0',
          'Gym Fee': payment.gymFee ? `₹${payment.gymFee.toLocaleString('en-IN')}` : '₹0',
          'Other Fee': payment.otherFee ? `₹${payment.otherFee.toLocaleString('en-IN')}` : '₹0',
          'Total Amount': payment.totalAmount ? `₹${payment.totalAmount.toLocaleString('en-IN')}` : '₹0',
          'Balance Amount': payment.balanceAmount ? `₹${payment.balanceAmount.toLocaleString('en-IN')}` : '₹0',
          'Payment Status': payment.paymentStatus || 'Paid',
          'Payment Method': payment.paymentMethod || 'Cash',
          'UTR/Reference': payment.utrNo || 'N/A',
          'Cashier': payment.cashier || 'Admin',
          'Created Date': payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN') : 'N/A',
        };
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Main payments sheet
      const paymentsSheet = XLSX.utils.json_to_sheet(paymentsWithStudentInfo);

      // Set column widths
      const columnWidths = [
        { wch: 6 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
      ];
      paymentsSheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payment Records');

      // Summary sheet
      const totalPayments = payments.length;
      const totalAmount = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const totalPending = payments.reduce((sum, p) => sum + (p.balanceAmount || 0), 0);
      const paidPayments = payments.filter(p => (p.paymentStatus || 'Paid') === 'Paid').length;
      const partialPayments = payments.filter(p => p.paymentStatus === 'Partial').length;
      const pendingPayments = payments.filter(p => p.paymentStatus === 'Pending').length;

      const summaryData = [
        { 'Metric': 'Total Payments', 'Value': totalPayments, 'Amount': `₹${totalAmount.toLocaleString('en-IN')}` },
        { 'Metric': 'Fully Paid', 'Value': paidPayments, 'Amount': `₹${payments.filter(p => (p.paymentStatus || 'Paid') === 'Paid').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN')}` },
        { 'Metric': 'Partial Payments', 'Value': partialPayments, 'Amount': `₹${payments.filter(p => p.paymentStatus === 'Partial').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN')}` },
        { 'Metric': 'Pending Payments', 'Value': pendingPayments, 'Amount': `₹${payments.filter(p => p.paymentStatus === 'Pending').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN')}` },
        { 'Metric': 'Total Outstanding', 'Value': '', 'Amount': `₹${totalPending.toLocaleString('en-IN')}` },
        { 'Metric': '', 'Value': '', 'Amount': '' },
        { 'Metric': 'Payment Methods', 'Value': '', 'Amount': '' },
        { 'Metric': 'Cash Payments', 'Value': payments.filter(p => p.paymentMethod === 'Cash').length, 'Amount': `₹${payments.filter(p => p.paymentMethod === 'Cash').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN')}` },
        { 'Metric': 'Online Payments', 'Value': payments.filter(p => p.paymentMethod === 'Online').length, 'Amount': `₹${payments.filter(p => p.paymentMethod === 'Online').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN')}` },
        { 'Metric': 'Cheque Payments', 'Value': payments.filter(p => p.paymentMethod === 'Cheque').length, 'Amount': `₹${payments.filter(p => p.paymentMethod === 'Cheque').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN')}` },
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Payment Summary');

      // Generate filename
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `Hostel_Payments_Report_${dateStr}_${timeStr}.xlsx`;

      // Save file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, filename);

      showSnackbar(`Payments report exported successfully! (${filename})`, 'success');
    } catch (error) {
      console.error('Error exporting payments to Excel:', error);
      showSnackbar('Error exporting payments to Excel. Please try again.', 'error');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'receiptNo',
      headerName: 'Receipt No',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon sx={{ color: 'primary.main', fontSize: 16 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'studentName',
      headerName: 'Student Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PersonIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
          <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {params.value}
            {params.row.studentId && params.row.studentId > 0 && params.row.isPlaceholder && (
              <Chip
                label={params.row.placeholderRef ? `PH` : 'Placeholder'}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ ml: 0.5, fontSize: '0.65rem', height: 20 }}
              />
            )}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'date',
      headerName: 'Payment Date',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ color: 'info.main', fontSize: 16 }} />
          {new Date(params.value).toLocaleDateString()}
        </Box>
      ),
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
          <PaymentIcon sx={{ color: 'success.main', fontSize: 16 }} />
          ₹{params.value?.toLocaleString()}
        </Box>
      ),
    },
    {
      field: 'balanceAmount',
      headerName: 'Balance',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceIcon sx={{ color: 'warning.main', fontSize: 16 }} />
          ₹{(params.value ?? 0).toLocaleString()}
        </Box>
      ),
    },
    {
      field: 'paymentStatus',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value || 'Paid'}
          color={params.value === 'Pending' ? 'error' : params.value === 'Partial' ? 'warning' : 'success'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'paymentMethod',
      headerName: 'Method',
      width: 100,
    },
    {
      field: 'utrNo',
      headerName: 'UTR/Ref No',
      width: 120,
    },
    {
      field: 'cashier',
      headerName: 'Cashier',
      width: 100,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon fontSize="small" />}
            onClick={() => handlePrintReceipt(params.row)}
          >
            Print
          </Button>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, params.row)}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Installment columns for new payment system
  const installmentColumns: GridColDef[] = [
    {
      field: 'receiptNumber',
      headerName: 'Receipt No',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon sx={{ color: 'primary.main', fontSize: 16 }} />
          <Typography variant="body2" fontWeight={500}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'installmentNumber',
      headerName: 'Inst. #',
      width: 80,
      renderCell: (params) => (
        <Chip label={`#${params.value}`} size="small" color="info" variant="outlined" />
      ),
    },
    {
      field: 'studentName',
      headerName: 'Student Name',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PersonIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
          <Typography variant="body2" fontWeight={500}>
            {params.value}
            {params.row.isPlaceholder && (
              <Chip
                label="PH"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ ml: 0.5, fontSize: '0.65rem', height: 18 }}
              />
            )}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'academicYear',
      headerName: 'Year',
      width: 90,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'paymentDate',
      headerName: 'Date',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ color: 'info.main', fontSize: 16 }} />
          {new Date(params.value).toLocaleDateString()}
        </Box>
      ),
    },
    {
      field: 'paymentAmount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'success.main' }}>
          <PaymentIcon sx={{ fontSize: 16 }} />
          ₹{params.value?.toLocaleString()}
        </Box>
      ),
    },
    {
      field: 'paidAmountToDate',
      headerName: 'Total Paid',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          ₹{params.value?.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'pendingAmountAfter',
      headerName: 'Pending',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: params.value > 0 ? 'warning.main' : 'success.main' }}>
          <AccountBalanceIcon sx={{ fontSize: 16 }} />
          ₹{params.value?.toLocaleString()}
        </Box>
      ),
    },
    {
      field: 'paymentMode',
      headerName: 'Mode',
      width: 100,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon fontSize="small" />}
            onClick={() => handlePrintInstallmentReceipt(params.row)}
          >
            Print
          </Button>
          {params.row.pendingAmountAfter > 0 && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={() => {
                setSelectedStudentForInstallment({
                  id: params.row.studentId,
                  academicYear: params.row.academicYear,
                  pendingAmount: params.row.pendingAmountAfter
                });
                setNextInstallmentOpen(true);
              }}
            >
              Next
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Payment Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={viewMode === 'installments' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('installments')}
            sx={{ borderRadius: 2 }}
          >
            Installments (New)
          </Button>
          <Button
            variant={viewMode === 'payments' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('payments')}
            sx={{ borderRadius: 2 }}
          >
            Payments (Old)
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportPaymentsToExcel}
            sx={{ borderRadius: 2 }}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ borderRadius: 2 }}
          >
            Record Payment
          </Button>

        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="600" color="primary.main">
              ₹{totalCollected.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Collected
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <ReceiptIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="600" color="success.main">
              {payments.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Receipts
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="600" color="warning.main">
              ₹{totalOutstanding.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Outstanding Balance
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <PendingActionsIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="600" color="info.main">
              {partialCount + pendingCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending / Partial Receipts
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Payments Table */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '2fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
            <Box>
              <TextField
                fullWidth
                placeholder="Search by receipt or student"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Payment Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Partial">Partial</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={2}>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={viewMode === 'installments' ? installments : filteredPayments}
            columns={viewMode === 'installments' ? installmentColumns : columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': {
                borderColor: 'rgba(224, 224, 224, 0.5)',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'grey.50',
                borderColor: 'rgba(224, 224, 224, 0.5)',
              },
            }}
          />
        </Box>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPayment ? 'Edit Payment Record' : 'Record New Payment'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Student Selection */}
            <Autocomplete
              options={students}
              getOptionLabel={(option) => `${option.name} (${option.enrollmentNo})`}
              value={selectedStudent}
              onChange={(_, value) => handleStudentChange(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Student *"
                  fullWidth
                  error={!selectedStudent}
                  helperText={!selectedStudent ? "Student selection is required" : ""}
                />
              )}
            />
            <TextField
              fullWidth
              label="Receipt Number *"
              value={formData.receiptNo}
              onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
              disabled
            />

            {/* Payment Date */}
            <DatePicker
              label="Payment Date"
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date: date || new Date() })}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'Cash' | 'Online' | 'Cheque' })}
                label="Payment Method"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Online">Online Transfer</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={formData.paymentStatus ?? 'Paid'}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'Paid' | 'Partial' | 'Pending' })}
                label="Payment Status"
              >
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Partial">Partial</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Fee Breakdown
              </Typography>
            </Divider>

            {/* Fee Components */}
            <TextField
              fullWidth
              label="Registration Fee"
              type="number"
              value={formData.registrationFee}
              onChange={(e) => setFormData({ ...formData, registrationFee: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Rent Fee"
              type="number"
              value={formData.rentFee}
              onChange={(e) => setFormData({ ...formData, rentFee: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Electricity Fee"
              type="number"
              value={formData.electricityFee}
              onChange={(e) => setFormData({ ...formData, electricityFee: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Security Deposit"
              type="number"
              value={formData.securityDeposit}
              onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Water Fee"
              type="number"
              value={formData.waterFee}
              onChange={(e) => setFormData({ ...formData, waterFee: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Gym Fee"
              type="number"
              value={formData.gymFee}
              onChange={(e) => setFormData({ ...formData, gymFee: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Other Fee"
              type="number"
              value={formData.otherFee}
              onChange={(e) => setFormData({ ...formData, otherFee: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />


            {/* Total Amount - Read Only */}
            <Paper elevation={1} sx={{ p: 2, backgroundColor: 'success.50' }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h5" fontWeight="600" color="success.main">
                ₹{formData.totalAmount?.toLocaleString()}
              </Typography>
            </Paper>
            <TextField
              fullWidth
              label="Balance Pending"
              type="number"
              value={formData.balanceAmount}
              onChange={(e) => setFormData({ ...formData, balanceAmount: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              disabled={formData.paymentStatus === 'Paid'}
              helperText={formData.paymentStatus === 'Paid' ? 'Fully cleared' : 'Enter the outstanding amount'}
            />

            {/* UTR Number and Cashier */}
            <TextField
              fullWidth
              label="UTR/Reference Number"
              value={formData.utrNo}
              onChange={(e) => setFormData({ ...formData, utrNo: e.target.value })}
            />
            <TextField
              fullWidth
              label="Cashier Name"
              value={formData.cashier}
              onChange={(e) => setFormData({ ...formData, cashier: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSavePayment}
            sx={{ borderRadius: 2 }}
          >
            {editingPayment ? 'Update Payment' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>



      {/* Next Installment Form */}
      {selectedStudentForInstallment && (
        <NextInstallmentForm
          open={nextInstallmentOpen}
          onClose={() => { setNextInstallmentOpen(false); setSelectedStudentForInstallment(null); }}
          studentId={selectedStudentForInstallment.id}
          academicYear={selectedStudentForInstallment.academicYear}
          pendingAmount={selectedStudentForInstallment.pendingAmount}
          onSuccess={() => { setNextInstallmentOpen(false); setSelectedStudentForInstallment(null); loadData(); }}
        />
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add payment"
        onClick={handleOpenAddDialog}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor.anchorEl}
        open={Boolean(menuAnchor.anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => menuAnchor.payment && handleEdit(menuAnchor.payment)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Payment</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => menuAnchor.payment && handleDelete(menuAnchor.payment)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Payment</ListItemText>
        </MenuItem>
      </Menu>

      {/* Receipt Print Dialog */}
      {selectedPaymentForReceipt && (
        <ReceiptPrintDialog
          open={receiptDialogOpen}
          onClose={() => {
            setReceiptDialogOpen(false);
            setSelectedPaymentForReceipt(null);
          }}
          payment={selectedPaymentForReceipt}
          student={selectedStudentForReceipt || students.find(s => s.id === selectedPaymentForReceipt.studentId) || {} as Student}
        />
      )}

      {/* Installment Receipt Print Dialog */}
      {selectedInstallmentForReceipt && (
        <InstallmentReceiptPrint
          open={installmentReceiptDialogOpen}
          onClose={() => {
            setInstallmentReceiptDialogOpen(false);
            setSelectedInstallmentForReceipt(null);
          }}
          installment={selectedInstallmentForReceipt}
          student={students.find(s => s.id === selectedInstallmentForReceipt.studentId) || {} as Student}
        />
      )}
    </Box>
  );
};

export default Payments;


