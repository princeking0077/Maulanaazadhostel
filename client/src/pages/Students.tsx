
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
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
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  Payment as PaymentIcon,
  Domain as DomainIcon,
  CalendarMonth as CalendarMonthIcon,
  LocationOn as LocationOnIcon,
  HowToReg as HowToRegIcon,
  Loop as LoopIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';

import { db, generateAcademicYears, getAcademicYearFromDate, getAnnualFeesForAcademicYear } from '../database/db';
import type { Student, Payment } from '../database/db';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SimpleDataImportDialog from '../components/SimpleDataImportDialog';
import ReceiptPrintDialog from '../components/ReceiptPrintDialog';

const collegeYearOptions = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Postgraduate',
  'PhD',
];

const residencyOptions: Array<'Permanent' | 'Temporary'> = ['Permanent', 'Temporary'];

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [wingFilter, setWingFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [facultyFilter, setFacultyFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [residencyFilter, setResidencyFilter] = useState<string>('');
  const [collegeFilter, setCollegeFilter] = useState<string>('');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Conversion dialog state (top-level)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertStudent, setConvertStudent] = useState<Student | null>(null);
  const [convertForm, setConvertForm] = useState({ name: '', mobile: '', email: '', enrollmentNo: '', faculty: '', collegeName: '', yearOfCollege: '', address: '', wing: 'A', roomNo: '', studentType: 'Hosteller', joiningDate: '', annualFee: '', updatedTotalFee: '' });
  const [convertError, setConvertError] = useState<string | null>(null);

  const handleOpenConvertDialog = (student: Student) => {
    setConvertStudent(student);
    setConvertForm({
      name: '',
      mobile: '',
      email: '',
      enrollmentNo: '',
      faculty: '',
      collegeName: '',
      yearOfCollege: '',
      address: '',
      wing: student.wing || 'A',
      roomNo: '',
      studentType: 'Hosteller',
      joiningDate: '',
      annualFee: '',
      updatedTotalFee: '',
    });
    setConvertDialogOpen(true);
    setConvertError(null);
  };

  const handleConvertStudent = async () => {
    if (!convertStudent) return;
    setConvertError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newData: any = { ...convertForm };
    if (!newData.name || !newData.mobile || !newData.enrollmentNo) {
      setConvertError('Name, Mobile, and Enrollment No are required.');
      return;
    }
    try {
      const updatedTotalFee = convertForm.updatedTotalFee ? parseFloat(convertForm.updatedTotalFee) : undefined;
      const result = await import('../services/offlinePayments').then(mod => mod.convertPlaceholderStudent({ studentId: convertStudent.id!, newData, updatedTotalFee }));
      if (!result.success) {
        setConvertError(result.error || 'Conversion failed');
        return;
      }
      setConvertDialogOpen(false);
      setConvertStudent(null);
      setConvertForm({ name: '', mobile: '', email: '', enrollmentNo: '', faculty: '', collegeName: '', yearOfCollege: '', address: '', wing: 'A', roomNo: '', studentType: 'Hosteller', joiningDate: '', annualFee: '', updatedTotalFee: '' });
      showSnackbar('Placeholder converted successfully!', 'success');
      loadStudents();
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : 'Unexpected error');
    }
  };

  // Academic years for filtering
  const academicYears = useMemo(() => generateAcademicYears(5), []);

  const [wingFeeDefaults, setWingFeeDefaults] = useState<Record<'A' | 'B' | 'C' | 'D', number>>({ A: 50000, B: 55000, C: 45000, D: 48000 });

  useEffect(() => {
    const loadWingDefaults = async () => {
      try {
        const wings: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
        const fees: Record<'A' | 'B' | 'C' | 'D', number> = { A: 50000, B: 55000, C: 45000, D: 48000 };
        for (const w of wings) {
          const s = await db.settings.where('key').equals(`wing_${w}_fee`).first();
          if (s?.value) fees[w] = parseInt(s.value, 10) || fees[w];
        }
        setWingFeeDefaults(fees);
      } catch (e) {
        console.error('Failed to load wing fee defaults', e);
      }
    };
    loadWingDefaults();
  }, []);

  const getDefaultAnnualFee = async (wing: 'A' | 'B' | 'C' | 'D', date: Date) => {
    try {
      const yr = getAcademicYearFromDate(date);
      const academicFees = await getAnnualFeesForAcademicYear(yr.startYear);
      if (academicFees && typeof academicFees[wing] === 'number') {
        return academicFees[wing];
      }
    } catch (e) {
      console.warn('Annual fee lookup failed, using wing default', e);
    }
    return wingFeeDefaults[wing] ?? 50000;
  };

  interface StudentFormData extends Partial<Student> {
    customAmount?: number;
    initialPayment?: number;
    durationType?: 'Days' | 'Weeks' | 'Months' | 'Years';
    durationValue?: number;
  }

  // Form state
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    mobile: '',
    email: '',
    enrollmentNo: '',
    faculty: '',
    collegeName: '',
    yearOfCollege: '',
    address: '',
    residencyStatus: 'Permanent',
    wing: 'A',
    roomNo: '',
    studentType: 'Hosteller',
    joiningDate: new Date(),
    annualFee: 50000,
    stayDuration: '',
    stayEndDate: undefined,
    customAmount: 0,
    initialPayment: 0,
    durationType: 'Months',
    durationValue: 1,
  });

  // Receipt Dialog State
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);

  const facultyOptions = useMemo(() => {
    const values = students.map(student => student.faculty).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort();
  }, [students]);

  const yearOptions = useMemo(() => {
    const values = students.map(student => student.yearOfCollege).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort();
  }, [students]);

  const collegeOptions = useMemo(() => {
    const values = students.map(student => student.collegeName).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort();
  }, [students]);

  const loadStudents = React.useCallback(async () => {
    try {
      setLoading(true);
      const allStudents = await db.students.orderBy('createdAt').reverse().toArray();
      setStudents(allStudents);
    } catch (error: unknown) {
      console.error('Error loading students:', error);
      showSnackbar('Error loading students', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayments = React.useCallback(async () => {
    try {
      const allPayments = await db.payments.toArray();
      setPayments(allPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  }, []);

  useEffect(() => {
    loadStudents();
    loadPayments();
  }, [loadStudents, loadPayments]);

  // Handle data imported from SimpleDataImportDialog
  const handleImportData = async (
    records: Array<{
      student: {
        name?: string;
        enrollmentNo?: string;
        mobile?: string;
        wing?: string;
        roomNo?: string;
        collegeName?: string;
        dateOfJoining?: string;
        residencyStatus?: string;
        address?: string;
        yearOfCollege?: string;
        fatherName?: string;
        course?: string;
      };
      payment: {
        receiptNo?: string;
        date?: string;
        registrationFee?: number;
        rentFee?: number;
        waterFee?: number;
        gymFee?: number;
        otherFee?: number;
        customAmount?: number;
        initialPayment?: number;
        totalAmount?: number;
        amountPaid?: number;
        balanceAmount?: number;
        paymentMethod?: 'Cash' | 'Online' | 'Cheque' | string;
        paymentStatus?: 'Paid' | 'Partial' | 'Pending' | string;
        remarks?: string;
        securityDeposit?: number;
        utrNo?: string;
      };
    }>
  ) => {
    try {
      let createdCount = 0;
      let paymentCount = 0;

      await db.transaction('rw', db.students, db.payments, async () => {
        for (const rec of records) {
          const s = rec.student || {};
          const p = rec.payment || {};

          // Normalize and sanitize student fields
          const wingRaw = (s.wing || 'A').toString().trim().toUpperCase();
          const wing: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(wingRaw) ? (wingRaw as 'A' | 'B' | 'C' | 'D') : 'A';
          const joiningDate = s.dateOfJoining ? new Date(s.dateOfJoining) : new Date();

          // Try to find existing student by enrollmentNo, else by name+mobile
          let studentId: number | undefined;
          const enrollmentKey = (s.enrollmentNo || '').toString().trim();
          let existing = enrollmentKey
            ? await db.students.where('enrollmentNo').equals(enrollmentKey).first()
            : undefined;
          if (!existing && s.name && s.mobile) {
            existing = await db.students
              .where('name')
              .equals(s.name)
              .and(st => st.mobile === s.mobile)
              .first();
          }

          if (existing) {
            studentId = existing.id!;
            // Optionally update a few fields if blank
            await db.students.update(studentId, {
              wing: existing.wing || wing,
              roomNo: existing.roomNo || (s.roomNo || ''),
              collegeName: existing.collegeName || (s.collegeName || s.course || ''),
              yearOfCollege: existing.yearOfCollege || (s.yearOfCollege || ''),
              address: existing.address || (s.address || ''),
            });
          } else {
            const newStudent: Omit<Student, 'id'> = {
              name: (s.name || '').toString().trim() || 'Unnamed',
              mobile: (s.mobile || '').toString().trim(),
              email: '',
              enrollmentNo: enrollmentKey || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              faculty: '',
              collegeName: (s.collegeName || s.course || '').toString(),
              yearOfCollege: (s.yearOfCollege || '').toString(),
              address: (s.address || '').toString(),
              residencyStatus: (s.residencyStatus === 'Temporary' ? 'Temporary' : 'Permanent'),
              wing,
              roomNo: (s.roomNo || '').toString(),
              studentType: 'Hosteller',
              joiningDate,
              annualFee: 50000,
              stayDuration: undefined,
              stayEndDate: undefined,
              customAmount: undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            studentId = await db.students.add(newStudent);
            createdCount += 1;
          }

          // Create payment if present and has any meaningful amount or receipt
          const hasAnyAmount = (p.totalAmount ?? 0) > 0 || (p.registrationFee ?? 0) > 0 || (p.rentFee ?? 0) > 0 || (p.waterFee ?? 0) > 0 || (p.gymFee ?? 0) > 0 || (p.otherFee ?? 0) > 0;
          if (studentId && (hasAnyAmount || (p.receiptNo && p.receiptNo.trim()))) {
            await db.payments.add({
              studentId,
              receiptNo: (p.receiptNo || `IMP${Date.now().toString().slice(-6)}`) as string,
              date: p.date ? new Date(p.date) : new Date(),
              registrationFee: p.registrationFee ?? 0,
              rentFee: p.rentFee ?? 0,
              waterFee: p.waterFee ?? 0,
              gymFee: p.gymFee ?? 0,
              otherFee: p.otherFee ?? 0,
              totalAmount: p.totalAmount ?? ((p.registrationFee ?? 0) + (p.rentFee ?? 0) + (p.waterFee ?? 0) + (p.gymFee ?? 0) + (p.otherFee ?? 0)),
              balanceAmount: p.balanceAmount ?? 0,
              paymentStatus: (p.paymentStatus === 'Partial' || p.paymentStatus === 'Pending') ? (p.paymentStatus as 'Partial' | 'Pending') : 'Paid',
              utrNo: p.utrNo,
              paymentMethod: (p.paymentMethod === 'Online' || p.paymentMethod === 'Cheque') ? p.paymentMethod : 'Cash',
              cashier: 'Admin',
              createdAt: new Date(),
            });
            paymentCount += 1;
          }
        }
      });

      await Promise.all([loadStudents(), loadPayments()]);
      setImportDialogOpen(false);
      showSnackbar(`Imported ${createdCount} students, ${paymentCount} payments`, 'success');
    } catch (err) {
      console.error('Error importing data:', err);
      showSnackbar('Error importing data. Please check the file format.', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const exportToExcel = () => {
    try {
      // Use filtered students instead of all students
      const studentsToExport = filteredStudents;

      if (studentsToExport.length === 0) {
        showSnackbar('No students to export with current filters', 'error');
        return;
      }

      // Calculate payment summary for each student
      const studentsWithPayments = studentsToExport.map((student, index) => {
        const studentPayments = payments.filter(payment => payment.studentId === student.id);

        const totalPaid = studentPayments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
        const totalPending = studentPayments.reduce((sum, payment) => sum + (payment.balanceAmount || 0), 0);
        const lastPaymentDate = studentPayments.length > 0
          ? new Date(Math.max(...studentPayments.map(p => new Date(p.date).getTime()))).toLocaleDateString()
          : 'No payments';

        const paymentStatus = totalPending > 0 ? 'Pending' : totalPaid > 0 ? 'Paid' : 'No payments';
        const paymentCount = studentPayments.length;

        return {
          'S.No': index + 1,
          'Student Name': student.name || 'N/A',
          'Enrollment No': student.enrollmentNo || 'N/A',
          'Mobile': student.mobile || 'N/A',
          'Email': student.email || 'N/A',
          'Faculty': student.faculty || 'N/A',
          'College Name': student.collegeName || 'N/A',
          'Year of College': student.yearOfCollege || 'N/A',
          'Wing': student.wing || 'N/A',
          'Room No': student.roomNo || 'N/A',
          'Student Type': student.studentType || 'N/A',
          'Residency Status': student.residencyStatus || 'Permanent',
          'Stay Duration': student.residencyStatus === 'Temporary' ? (student.stayDuration || 'N/A') : '—',
          'Stay End Date': student.residencyStatus === 'Temporary' && student.stayEndDate
            ? new Date(student.stayEndDate).toLocaleDateString('en-GB') : (student.residencyStatus === 'Temporary' ? 'N/A' : '—'),
          'Custom Amount': student.residencyStatus === 'Temporary' && student.customAmount
            ? `₹${student.customAmount.toLocaleString('en-IN')}` : (student.residencyStatus === 'Temporary' ? '₹0' : '—'),
          'Address': student.address || 'N/A',
          'Joining Date': student.studentType === 'Hosteller' && student.joiningDate ? new Date(student.joiningDate).toLocaleDateString('en-GB') : 'N/A',
          'Academic Year': student.joiningDate ? getAcademicYearFromDate(new Date(student.joiningDate)).label : 'N/A',
          'Annual Fee': student.annualFee ? `₹${student.annualFee.toLocaleString('en-IN')}` : 'N/A',
          'Total Amount Paid': totalPaid ? `₹${totalPaid.toLocaleString('en-IN')}` : '₹0',
          'Pending Amount': totalPending ? `₹${totalPending.toLocaleString('en-IN')}` : '₹0',
          'Payment Status': paymentStatus,
          'Number of Payments': paymentCount,
          'Last Payment Date': lastPaymentDate,
          'Created Date': student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB') : 'N/A',
        };
      });

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Main student data sheet
      const studentSheet = XLSX.utils.json_to_sheet(studentsWithPayments);

      // Set column widths for better formatting
      const columnWidths = [
        { wch: 6 },   // S.No
        { wch: 20 },  // Student Name
        { wch: 15 },  // Enrollment No
        { wch: 12 },  // Mobile
        { wch: 25 },  // Email
        { wch: 15 },  // Faculty
        { wch: 25 },  // College Name
        { wch: 12 },  // Year of College
        { wch: 8 },   // Wing
        { wch: 10 },  // Room No
        { wch: 12 },  // Student Type
        { wch: 15 },  // Residency Status
        { wch: 15 },  // Stay Duration
        { wch: 12 },  // Stay End Date
        { wch: 15 },  // Custom Amount
        { wch: 30 },  // Address
        { wch: 12 },  // Joining Date
        { wch: 12 },  // Annual Fee
        { wch: 15 },  // Total Paid
        { wch: 12 },  // Pending
        { wch: 12 },  // Payment Status
        { wch: 12 },  // Payment Count
        { wch: 15 },  // Last Payment
        { wch: 12 },  // Created Date
      ];
      studentSheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, studentSheet, 'Students & Payments');

      // Summary sheet
      const summaryData = [
        { 'Metric': 'Total Students', 'Count': students.length, 'Percentage': '100%' },
        { 'Metric': 'Students with Payments', 'Count': studentsWithPayments.filter(s => s['Number of Payments'] > 0).length, 'Percentage': `${((studentsWithPayments.filter(s => s['Number of Payments'] > 0).length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': 'Students with Pending Dues', 'Count': studentsWithPayments.filter(s => s['Payment Status'] === 'Pending').length, 'Percentage': `${((studentsWithPayments.filter(s => s['Payment Status'] === 'Pending').length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': 'Fully Paid Students', 'Count': studentsWithPayments.filter(s => s['Payment Status'] === 'Paid').length, 'Percentage': `${((studentsWithPayments.filter(s => s['Payment Status'] === 'Paid').length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': '', 'Count': '', 'Percentage': '' },
        { 'Metric': 'Wing Distribution', 'Count': '', 'Percentage': '' },
        { 'Metric': 'Wing A', 'Count': students.filter(s => s.wing === 'A').length, 'Percentage': `${((students.filter(s => s.wing === 'A').length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': 'Wing B', 'Count': students.filter(s => s.wing === 'B').length, 'Percentage': `${((students.filter(s => s.wing === 'B').length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': 'Wing C', 'Count': students.filter(s => s.wing === 'C').length, 'Percentage': `${((students.filter(s => s.wing === 'C').length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': 'Wing D', 'Count': students.filter(s => s.wing === 'D').length, 'Percentage': `${((students.filter(s => s.wing === 'D').length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': '', 'Count': '', 'Percentage': '' },
        { 'Metric': 'Residency Type', 'Count': '', 'Percentage': '' },
        { 'Metric': 'Permanent Residents', 'Count': students.filter(s => s.residencyStatus === 'Permanent').length, 'Percentage': `${((students.filter(s => s.residencyStatus === 'Permanent').length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': 'Temporary Residents', 'Count': students.filter(s => s.residencyStatus === 'Temporary').length, 'Percentage': `${((students.filter(s => s.residencyStatus === 'Temporary').length / students.length) * 100).toFixed(1)}%` },
        { 'Metric': '', 'Count': '', 'Percentage': '' },
        { 'Metric': 'Temporary Student Analysis', 'Count': '', 'Percentage': '' },
        { 'Metric': 'With Custom Amounts', 'Count': students.filter(s => s.residencyStatus === 'Temporary' && s.customAmount && s.customAmount > 0).length, 'Percentage': students.filter(s => s.residencyStatus === 'Temporary').length > 0 ? `${((students.filter(s => s.residencyStatus === 'Temporary' && s.customAmount && s.customAmount > 0).length / students.filter(s => s.residencyStatus === 'Temporary').length) * 100).toFixed(1)}%` : '0%' },
        { 'Metric': 'Stay Duration Set', 'Count': students.filter(s => s.residencyStatus === 'Temporary' && s.stayDuration).length, 'Percentage': students.filter(s => s.residencyStatus === 'Temporary').length > 0 ? `${((students.filter(s => s.residencyStatus === 'Temporary' && s.stayDuration).length / students.filter(s => s.residencyStatus === 'Temporary').length) * 100).toFixed(1)}%` : '0%' },
        { 'Metric': 'Stay End Date Set', 'Count': students.filter(s => s.residencyStatus === 'Temporary' && s.stayEndDate).length, 'Percentage': students.filter(s => s.residencyStatus === 'Temporary').length > 0 ? `${((students.filter(s => s.residencyStatus === 'Temporary' && s.stayEndDate).length / students.filter(s => s.residencyStatus === 'Temporary').length) * 100).toFixed(1)}%` : '0%' },
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Report');

      // Payment details sheet
      const paymentDetails = payments.map((payment, index) => {
        const student = students.find(s => s.id === payment.studentId);
        return {
          'S.No': index + 1,
          'Receipt No': payment.receiptNo || 'N/A',
          'Student Name': student?.name || 'N/A',
          'Enrollment No': student?.enrollmentNo || 'N/A',
          'Wing-Room': student ? `${student.wing}-${student.roomNo}` : 'N/A',
          'Payment Date': new Date(payment.date).toLocaleDateString(),
          'Registration Fee': payment.registrationFee ? `₹${payment.registrationFee.toLocaleString('en-IN')}` : '₹0',
          'Rent Fee': payment.rentFee ? `₹${payment.rentFee.toLocaleString('en-IN')}` : '₹0',
          'Water Fee': payment.waterFee ? `₹${payment.waterFee.toLocaleString('en-IN')}` : '₹0',
          'Gym Fee': payment.gymFee ? `₹${payment.gymFee.toLocaleString('en-IN')}` : '₹0',
          'Other Fee': payment.otherFee ? `₹${payment.otherFee.toLocaleString('en-IN')}` : '₹0',
          'Total Amount': payment.totalAmount ? `₹${payment.totalAmount.toLocaleString('en-IN')}` : '₹0',
          'Balance Amount': payment.balanceAmount ? `₹${payment.balanceAmount.toLocaleString('en-IN')}` : '₹0',
          'Payment Status': payment.paymentStatus || 'Paid',
          'Payment Method': payment.paymentMethod || 'Cash',
          'UTR No': payment.utrNo || 'N/A',
          'Cashier': payment.cashier || 'Admin',
        };
      });

      const paymentSheet = XLSX.utils.json_to_sheet(paymentDetails);
      const paymentCols = [
        { wch: 6 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }
      ];
      paymentSheet['!cols'] = paymentCols;
      XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Payment Details');

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
      const filename = `Hostel_Students_Report_${dateStr}_${timeStr}.xlsx`;

      // Save file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, filename);

      showSnackbar(`Excel report exported successfully! (${filename})`, 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showSnackbar('Error exporting to Excel. Please try again.', 'error');
    }
  };



  const handleSaveStudent = async () => {
    try {
      if (!formData.name?.trim() || !formData.mobile?.trim() || !formData.enrollmentNo?.trim()) {
        showSnackbar('Please fill in all required fields (Name, Mobile, Enrollment No)', 'error');
        return;
      }

      // Validate mobile number
      if (!/^\d{10}$/.test(formData.mobile.trim())) {
        showSnackbar('Please enter a valid 10-digit mobile number', 'error');
        return;
      }

      // Validate email if provided
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        showSnackbar('Please enter a valid email address', 'error');
        return;
      }

      // Check for duplicate enrollment number
      const existingStudent = await db.students.where('enrollmentNo').equals(formData.enrollmentNo.trim()).first();
      if (existingStudent && (!editingStudent || existingStudent.id !== editingStudent.id)) {
        showSnackbar('A student with this enrollment number already exists', 'error');
        return;
      }

      // Calculate Stay End Date based on Residency Status
      let stayEndDate = formData.stayEndDate;
      if (formData.residencyStatus === 'Permanent') {
        // Permanent: Fixed 10 months
        const joining = formData.joiningDate ? new Date(formData.joiningDate) : new Date();
        stayEndDate = new Date(joining);
        stayEndDate.setMonth(stayEndDate.getMonth() + 10);
      } else if (formData.residencyStatus === 'Temporary' && formData.durationType && formData.durationValue) {
        // Temporary: Flexible
        const joining = formData.joiningDate ? new Date(formData.joiningDate) : new Date();
        stayEndDate = new Date(joining);
        const val = Number(formData.durationValue);
        if (formData.durationType === 'Days') stayEndDate.setDate(stayEndDate.getDate() + val);
        else if (formData.durationType === 'Weeks') stayEndDate.setDate(stayEndDate.getDate() + (val * 7));
        else if (formData.durationType === 'Months') stayEndDate.setMonth(stayEndDate.getMonth() + val);
        else if (formData.durationType === 'Years') stayEndDate.setFullYear(stayEndDate.getFullYear() + val);
      }

      const studentData: Student = {
        name: formData.name!,
        mobile: formData.mobile!,
        email: formData.email,
        enrollmentNo: formData.enrollmentNo,
        faculty: formData.faculty,
        collegeName: formData.collegeName,
        yearOfCollege: formData.yearOfCollege,
        address: formData.address,
        wing: formData.wing as 'A' | 'B' | 'C' | 'D',
        roomNo: formData.roomNo!,
        studentType: formData.studentType as 'Hosteller' | 'Day Scholar' | 'PhD' | 'Non-Hosteller',
        residencyStatus: formData.residencyStatus as 'Permanent' | 'Temporary',
        joiningDate: formData.joiningDate || new Date(),
        annualFee: formData.annualFee || 0,
        stayDuration: formData.stayDuration,
        stayEndDate: stayEndDate, // Use calculated end date
        createdAt: editingStudent?.createdAt || new Date(),
        updatedAt: new Date(),
        isPlaceholder: false,
      };

      if (editingStudent) {
        // Update existing student
        await db.students.update(editingStudent.id!, studentData);
        showSnackbar('Student updated successfully', 'success');
      } else {
        // Add new student
        const newStudentId = await db.students.add(studentData);
        showSnackbar('Student added successfully', 'success');

        // Create initial payment if specified
        if (formData.initialPayment && formData.initialPayment > 0) {
          const payment: Payment = {
            studentId: newStudentId,
            receiptNo: `REC-${Date.now()}`,
            date: new Date(),
            registrationFee: 0,
            rentFee: formData.initialPayment, // Assign to rent by default or split?
            waterFee: 0,
            gymFee: 0,
            otherFee: 0,
            securityDeposit: 0,
            electricityFee: 0,
            totalAmount: formData.initialPayment,
            balanceAmount: 0, // Calculated dynamically
            paymentStatus: 'Paid',
            paymentMethod: 'Cash',
            cashier: 'Admin',
            createdAt: new Date(),
            utrNo: '',
          };
          const paymentId = await db.payments.add(payment);

          // Trigger receipt print
          const savedPayment = { ...payment, id: paymentId };
          const savedStudent = { ...studentData, id: newStudentId } as Student;
          setSelectedPaymentForReceipt(savedPayment);
          setSelectedStudentForReceipt(savedStudent);
          setReceiptDialogOpen(true);
        }
      }

      setOpenDialog(false);
      setEditingStudent(null);
      resetForm();
      loadStudents();
      loadPayments();
    } catch (error) {
      console.error('Error saving student:', error);
      showSnackbar('Error saving student. Please try again.', 'error');
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setOpenDialog(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await db.students.delete(student.id!);
        showSnackbar('Student deleted successfully', 'success');
        loadStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        showSnackbar('Error deleting student', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.ids.size === 0) return;

    try {
      const idsArray = Array.from(selectedRows.ids);

      // Delete payments for all selected students
      for (const id of idsArray) {
        await db.payments.where('studentId').equals(id).delete();
      }

      // Delete all selected students
      await db.students.bulkDelete(idsArray.map(id => Number(id)));

      await loadStudents();
      await loadPayments();
      setSelectedRows({ type: 'include', ids: new Set() });
      setDeleteDialogOpen(false);
      showSnackbar(`Successfully deleted ${idsArray.length} student(s)`, 'success');
    } catch (error) {
      console.error('Error deleting students:', error);
      showSnackbar('Error deleting students', 'error');
    }
  };

  const handleDeleteAllData = async () => {
    try {
      // Delete all payments
      await db.payments.clear();

      // Delete all students
      await db.students.clear();

      await loadStudents();
      await loadPayments();
      setDeleteAllDialogOpen(false);
      showSnackbar('All data deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting all data:', error);
      showSnackbar('Error deleting all data', 'error');
    }
  };

  // ...existing code...

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      enrollmentNo: '',
      faculty: '',
      collegeName: '',
      yearOfCollege: '',
      address: '',
      residencyStatus: 'Permanent',
      wing: 'A',
      roomNo: '',
      studentType: 'Hosteller',
      joiningDate: new Date(),
      annualFee: 50000,
      stayDuration: '',
      stayEndDate: undefined,
      customAmount: 0,
      initialPayment: 0,
    });
  };

  const handleOpenAddDialog = async () => {
    resetForm();
    setEditingStudent(null);
    const fee = await getDefaultAnnualFee('A', new Date());
    setFormData(prev => ({ ...prev, annualFee: fee }));
    setOpenDialog(true);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mobile.includes(searchTerm) ||
      (student.collegeName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.yearOfCollege ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.address ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWing = !wingFilter || student.wing === wingFilter;
    const matchesType = !typeFilter || student.studentType === typeFilter;
    const matchesFaculty = !facultyFilter || student.faculty === facultyFilter;
    const matchesYear = !yearFilter || student.yearOfCollege === yearFilter;
    const matchesResidency = !residencyFilter || student.residencyStatus === residencyFilter;
    const matchesCollege = !collegeFilter || student.collegeName === collegeFilter;

    // Academic year filter - check if student's joining date falls in the selected academic year
    let matchesAcademicYear = true;
    if (academicYearFilter) {
      const selectedYear = academicYears.find(y => y.label === academicYearFilter);
      if (selectedYear && student.joiningDate) {
        const studentAcademicYear = getAcademicYearFromDate(new Date(student.joiningDate));
        matchesAcademicYear = studentAcademicYear.label === selectedYear.label;
      }
    }

    return matchesSearch && matchesWing && matchesType && matchesFaculty && matchesYear && matchesResidency && matchesCollege && matchesAcademicYear;
  });


  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" fontWeight="500" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {params.value}
            {params.row.isPlaceholder && (
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
      field: 'enrollmentNo',
      headerName: 'Enrollment No',
      width: 130,
    },
    {
      field: 'mobile',
      headerName: 'Mobile',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'faculty',
      headerName: 'Faculty',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon sx={{ color: 'info.main', fontSize: 16 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'collegeName',
      headerName: 'College',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DomainIcon sx={{ color: 'primary.main', fontSize: 16 }} />
          {params.value || '—'}
        </Box>
      ),
    },
    {
      field: 'yearOfCollege',
      headerName: 'Year',
      width: 110,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
          {params.value || '—'}
        </Box>
      ),
    },
    {
      field: 'residencyStatus',
      headerName: 'Residency',
      width: 120,
      renderCell: (params) => {
        const icon = params.value === 'Temporary'
          ? <LoopIcon sx={{ fontSize: 14 }} />
          : <HowToRegIcon sx={{ fontSize: 14 }} />;
        return (
          <Chip
            icon={icon}
            label={params.value || 'Permanent'}
            size="small"
            color={params.value === 'Temporary' ? 'warning' : 'success'}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'stayDuration',
      headerName: 'Duration',
      width: 120,
      renderCell: (params) => {
        if (params.row.residencyStatus !== 'Temporary') return '—';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon sx={{ color: 'warning.main', fontSize: 16 }} />
            <Typography variant="body2" noWrap>
              {params.value || '—'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'stayEndDate',
      headerName: 'End Date',
      width: 110,
      renderCell: (params) => {
        if (params.row.residencyStatus !== 'Temporary') return '—';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon sx={{ color: 'error.main', fontSize: 16 }} />
            <Typography variant="body2" noWrap>
              {params.value ? new Date(params.value).toLocaleDateString() : '—'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'customAmount',
      headerName: 'Custom Fee',
      width: 120,
      renderCell: (params) => {
        if (params.row.residencyStatus !== 'Temporary' || !params.value) return '—';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon sx={{ color: 'success.main', fontSize: 16 }} />
            <Typography variant="body2" fontWeight={500}>
              ₹{params.value?.toLocaleString()}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'wing',
      headerName: 'Wing',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'roomNo',
      headerName: 'Room',
      width: 90,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HomeIcon sx={{ color: 'success.main', fontSize: 16 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOnIcon sx={{ color: 'error.main', fontSize: 16 }} />
          <Typography variant="body2" noWrap title={params.value || ''}>
            {params.value || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'studentType',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'Hosteller' ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'annualFee',
      headerName: 'Annual Fee',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon sx={{ color: 'warning.main', fontSize: 16 }} />
          ₹{params.value?.toLocaleString()}
        </Box>
      ),
    },
    {
      field: 'paidAmount',
      headerName: 'Paid',
      width: 110,
      renderCell: (params) => {
        const studentPayments = payments.filter(p => p.studentId === params.row.id);
        const totalPaid = studentPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={500} color="success.main">
              ₹{totalPaid.toLocaleString()}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'pendingAmount',
      headerName: 'Pending',
      width: 110,
      renderCell: (params) => {
        const studentPayments = payments.filter(p => p.studentId === params.row.id);
        const totalPaid = studentPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const totalFee = params.row.annualFee || 0;
        const pending = Math.max(0, totalFee - totalPaid);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={500} color={pending > 0 ? 'error.main' : 'text.secondary'}>
              ₹{pending.toLocaleString()}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'installments',
      headerName: 'Installments',
      width: 100,
      renderCell: (params) => {
        const studentPayments = payments.filter(p => p.studentId === params.row.id);
        return (
          <Chip
            label={`${studentPayments.length}`}
            size="small"
            color="info"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 180,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditStudent(params.row)}
          key="edit"
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteStudent(params.row)}
          key="delete"
        />,
        params.row.isPlaceholder && (
          <GridActionsCellItem
            icon={<LoopIcon color="warning" />}
            label="Convert"
            onClick={() => handleOpenConvertDialog(params.row)}
            key="convert"
          />
        ),
      ].filter(Boolean),
    },
  ];

  return (
    <Box>
      {/* Convert Placeholder Dialog */}
      <Dialog open={convertDialogOpen} onClose={() => setConvertDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Convert Placeholder to Full Student</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mt: 1 }}>
            <TextField label="Name" required value={convertForm.name} onChange={e => setConvertForm(f => ({ ...f, name: e.target.value }))} fullWidth />
            <TextField label="Mobile" required value={convertForm.mobile} onChange={e => setConvertForm(f => ({ ...f, mobile: e.target.value }))} fullWidth />
            <TextField label="Enrollment No" required value={convertForm.enrollmentNo} onChange={e => setConvertForm(f => ({ ...f, enrollmentNo: e.target.value }))} fullWidth />
            <TextField label="Email" value={convertForm.email} onChange={e => setConvertForm(f => ({ ...f, email: e.target.value }))} fullWidth />
            <TextField label="Faculty" value={convertForm.faculty} onChange={e => setConvertForm(f => ({ ...f, faculty: e.target.value }))} fullWidth />
            <TextField label="College Name" value={convertForm.collegeName} onChange={e => setConvertForm(f => ({ ...f, collegeName: e.target.value }))} fullWidth />
            <TextField label="Year of College" value={convertForm.yearOfCollege} onChange={e => setConvertForm(f => ({ ...f, yearOfCollege: e.target.value }))} fullWidth />
            <TextField label="Address" value={convertForm.address} onChange={e => setConvertForm(f => ({ ...f, address: e.target.value }))} fullWidth />
            <TextField label="Wing" value={convertForm.wing} onChange={e => setConvertForm(f => ({ ...f, wing: e.target.value }))} fullWidth />
            <TextField label="Room No" value={convertForm.roomNo} onChange={e => setConvertForm(f => ({ ...f, roomNo: e.target.value }))} fullWidth />
            <TextField label="Student Type" value={convertForm.studentType} onChange={e => setConvertForm(f => ({ ...f, studentType: e.target.value }))} fullWidth />
            <TextField label="Joining Date" type="date" value={convertForm.joiningDate} onChange={e => setConvertForm(f => ({ ...f, joiningDate: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Annual Fee" type="number" value={convertForm.annualFee} onChange={e => setConvertForm(f => ({ ...f, annualFee: e.target.value }))} fullWidth />
            <TextField label="New Total Fee (if changed)" type="number" value={convertForm.updatedTotalFee} onChange={e => setConvertForm(f => ({ ...f, updatedTotalFee: e.target.value }))} fullWidth helperText="If actual total fee differs from placeholder" />
          </Box>
          {convertError && <Typography color="error" sx={{ mt: 2 }}>{convertError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConvertStudent}>Convert</Button>
        </DialogActions>
      </Dialog>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Student Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedRows.ids.size > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Delete Selected ({selectedRows.ids.size})
            </Button>
          )}
          <Button
            variant="outlined"
            color="warning"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteAllDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Clear All Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
            sx={{ borderRadius: 2 }}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ borderRadius: 2, ml: 1 }}
          >
            Import Data
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ borderRadius: 2, ml: 1 }}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '2fr repeat(6, 1fr)' }, gap: 2, alignItems: 'center' }}>
            <Box>
              <TextField
                fullWidth
                placeholder="Search by name, enrollment, or mobile..."
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
            {formData.studentType === 'Hosteller' ? (
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Wing</InputLabel>
                  <Select
                    value={wingFilter}
                    onChange={(e) => setWingFilter(e.target.value)}
                    label="Wing"
                  >
                    <MenuItem value="">All Wings</MenuItem>
                    <MenuItem value="A">Wing A</MenuItem>
                    <MenuItem value="B">Wing B</MenuItem>
                    <MenuItem value="C">Wing C</MenuItem>
                    <MenuItem value="D">Wing D</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            ) : (
              <Box>
                <TextField fullWidth label="Wing" value={'N/A'} disabled />
              </Box>
            )}
            <Box>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Permanent">Permanent</MenuItem>
                  <MenuItem value="Temporary">Temporary</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <FormControl fullWidth>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  label="Faculty"
                >
                  <MenuItem value="">All Faculties</MenuItem>
                  {facultyOptions.map(option => (
                    <MenuItem value={option} key={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  label="Year"
                >
                  <MenuItem value="">All Years</MenuItem>
                  {yearOptions.map(option => (
                    <MenuItem value={option} key={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Residency</InputLabel>
                <Select
                  value={residencyFilter}
                  onChange={(e) => setResidencyFilter(e.target.value)}
                  label="Residency"
                >
                  <MenuItem value="">All</MenuItem>
                  {residencyOptions.map(option => (
                    <MenuItem value={option} key={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>College</InputLabel>
                <Select
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  label="College"
                >
                  <MenuItem value="">All Colleges</MenuItem>
                  {collegeOptions.map(option => (
                    <MenuItem value={option} key={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={academicYearFilter}
                  onChange={(e) => setAcademicYearFilter(e.target.value)}
                  label="Academic Year"
                >
                  <MenuItem value="">All Years</MenuItem>
                  {academicYears.map(year => (
                    <MenuItem value={year.label} key={year.label}>{year.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card elevation={2}>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredStudents}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            checkboxSelection
            rowSelectionModel={selectedRows}
            onRowSelectionModelChange={(newSelection) => {
              setSelectedRows(newSelection);
            }}
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

      {/* Add/Edit Student Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

            {/* Personal Details Section */}
            <Box>
              <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1 }}>
                Personal Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Mobile Number *"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Residential Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  minRows={1}
                  sx={{ gridColumn: { md: 'span 3' } }}
                />
              </Box>
            </Box>

            {/* Academic Details Section */}
            <Box>
              <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1 }}>
                Academic Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <TextField
                  fullWidth
                  label="Enrollment Number *"
                  value={formData.enrollmentNo}
                  onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="College Name"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Faculty/Department"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                />
                <FormControl fullWidth>
                  <InputLabel>Year of College</InputLabel>
                  <Select
                    value={formData.yearOfCollege ?? ''}
                    onChange={(e) => setFormData({ ...formData, yearOfCollege: e.target.value })}
                    label="Year of College"
                  >
                    <MenuItem value="">Select Year</MenuItem>
                    {/* Support imported values */}
                    {formData.yearOfCollege && !collegeYearOptions.includes(formData.yearOfCollege) && (
                      <MenuItem value={formData.yearOfCollege} key={formData.yearOfCollege}>
                        {formData.yearOfCollege} (Imported)
                      </MenuItem>
                    )}
                    {collegeYearOptions.map(option => (
                      <MenuItem value={option} key={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Accommodation & Fees Section */}
            <Box>
              <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1 }}>
                Accommodation & Fees
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>


                <TextField
                  fullWidth
                  label="Annual Fee"
                  type="number"
                  value={formData.annualFee}
                  onChange={(e) => setFormData({ ...formData, annualFee: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />

                {!editingStudent && (
                  <TextField
                    fullWidth
                    label="Initial Payment"
                    type="number"
                    value={formData.initialPayment || ''}
                    onChange={(e) => setFormData({ ...formData, initialPayment: Number(e.target.value) })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText="Optional: Record first installment now"
                  />
                )}

                <FormControl fullWidth>
                  <InputLabel>Admission Status</InputLabel>
                  <Select
                    value={formData.admissionStatus ?? 'Active'}
                    onChange={(e) => setFormData({ ...formData, admissionStatus: e.target.value as 'Active' | 'Cancelled' })}
                    label="Admission Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>

                {formData.residencyStatus === 'Temporary' && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>Duration Type</InputLabel>
                      <Select
                        value={formData.durationType || 'Months'}
                        label="Duration Type"
                        onChange={(e) => setFormData({ ...formData, durationType: e.target.value as 'Days' | 'Weeks' | 'Months' | 'Years' })}
                      >
                        <MenuItem value="Days">Days</MenuItem>
                        <MenuItem value="Weeks">Weeks</MenuItem>
                        <MenuItem value="Months">Months</MenuItem>
                        <MenuItem value="Years">Years</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Duration Value"
                      type="number"
                      fullWidth
                      value={formData.durationValue || ''}
                      onChange={(e) => setFormData({ ...formData, durationValue: Number(e.target.value) })}
                    />
                  </>
                )}
              </Box>
            </Box>


          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveStudent}
            sx={{ borderRadius: 2 }}
          >
            {editingStudent ? 'Update' : 'Add'} Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add"
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

      <SimpleDataImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportData}
      />

      {/* Receipt Print Dialog */}
      {
        selectedPaymentForReceipt && selectedStudentForReceipt && (
          <ReceiptPrintDialog
            open={receiptDialogOpen}
            onClose={() => setReceiptDialogOpen(false)}
            payment={selectedPaymentForReceipt}
            student={selectedStudentForReceipt}
          />
        )
      }

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedRows.ids.size} selected student{selectedRows.ids.size !== 1 ? 's' : ''}?
            This will also delete all associated payment records. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleBulkDelete();
              setDeleteDialogOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Data Confirmation Dialog */}
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete All Data</DialogTitle>
        <DialogContent>
          <Typography color="error" fontWeight="bold" sx={{ mb: 2 }}>
            ⚠️ WARNING: This action is irreversible!
          </Typography>
          <Typography>
            This will permanently delete ALL students and payment records from the database.
            This action cannot be undone. Are you absolutely sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleDeleteAllData();
              setDeleteAllDialogOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Delete All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default Students;


