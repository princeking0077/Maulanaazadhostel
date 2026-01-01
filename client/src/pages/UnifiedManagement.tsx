import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Tabs, Tab, Paper, Typography, TextField, MenuItem, Button, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Dialog, Stack, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { db, Student, Payment } from '../database/db';
import { updateStudentFeeAggregate } from '../database/feeUtils';
import HostelReceipt from '../components/HostelReceipt';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Helper: get academic year string
function getCurrentAcademicYear() {
  const now = new Date();
  const y = now.getFullYear();
  return `${y}-${y + 1}`;
}

interface NewStudentForm {
  name: string;
  mobile: string;
  email: string;
  faculty: string;
  wing: 'A' | 'B' | 'C' | 'D' | '';
  roomNo: string;
  residencyStatus: 'Permanent' | 'Temporary' | '';
  studentType: Student['studentType'] | '';
  annualFee: string;
}

interface NewPaymentForm {
  studentId: number | '';
  receiptNo: string;
  paymentDate: string;
  paymentType: 'Full Payment' | 'Installment' | '';
  registrationFee: string;
  rentFee: string; // aligning with Payment interface field names used elsewhere
  waterFee: string;
  gymFee: string;
  otherFee: string;
  utrNo: string;
}

const UnifiedManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rooms, setRooms] = useState<import('../database/db').Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentForm, setStudentForm] = useState<NewStudentForm>({
    name: '', mobile: '', email: '', faculty: '', wing: '', roomNo: '', residencyStatus: '', studentType: 'Permanent', annualFee: ''
  });
  const [paymentForm, setPaymentForm] = useState<NewPaymentForm>({
    studentId: '', receiptNo: '', paymentDate: new Date().toISOString().substring(0,10), paymentType: 'Full Payment', registrationFee: '', rentFee: '', waterFee: '', gymFee: '', otherFee: '', utrNo: ''
  });
  // Payment filters state
  const [paymentFilters, setPaymentFilters] = useState({
    search: '',
    type: 'All',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    academicYear: 'All'
  });
  // Student filters state
  const [studentFilters, setStudentFilters] = useState({
    search: '',
    wing: 'All',
    type: 'All',
    residency: 'All'
  });
  // Editing state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingPlaceholder, setEditingPlaceholder] = useState<Student | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);
  const [selectedFeeAggregate, setSelectedFeeAggregate] = useState<import('../database/db').StudentFeeAggregate | null>(null);
  // Payment-first workflow (create temp student reference)
  const [tempStudentName, setTempStudentName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, r] = await Promise.all([
        db.students.orderBy('id').toArray(),
        db.payments.orderBy('id').reverse().toArray(),
        db.rooms.orderBy('roomNumber').toArray()
      ]);
      setStudents(s);
      setPayments(p);
      setRooms(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Student CRUD
  const handleAddStudent = async () => {
    if (editingPlaceholder) {
      const updatedStudent = {
        name: studentForm.name,
        mobile: studentForm.mobile,
        email: studentForm.email,
        faculty: studentForm.faculty,
        collegeName: studentForm.faculty,
        residencyStatus: studentForm.residencyStatus as 'Permanent' | 'Temporary',
        wing: (studentForm.wing || 'A') as Student['wing'],
        roomNo: studentForm.roomNo || 'NA',
        studentType: (studentForm.studentType || 'Permanent') as Student['studentType'],
        annualFee: parseFloat(studentForm.annualFee || '0'),
        isPlaceholder: false,
        updatedAt: new Date(),
      };
      await db.students.update(editingPlaceholder.id!, updatedStudent);
      await updateStudentFeeAggregate(editingPlaceholder.id!, getCurrentAcademicYear(), 0, updatedStudent.annualFee);
      setEditingPlaceholder(null);
      setStudentForm({ name: '', mobile: '', email: '', faculty: '', wing: '', roomNo: '', residencyStatus: '', studentType: 'Hosteller', annualFee: '' });
      await loadData();
      setTab(0);
      return;
    }

    if (
      !studentForm.name ||
      !studentForm.mobile ||
      !studentForm.faculty ||
      !studentForm.residencyStatus ||
      !studentForm.studentType ||
      (studentForm.studentType !== 'PhD' && studentForm.studentType !== 'Non-Hosteller' && (!studentForm.wing || !studentForm.roomNo)) ||
      !studentForm.annualFee
    ) {
      alert('Fill required student fields');
      return;
    }
    const now = new Date();
    const newStudent: Omit<Student, 'id'> = {
      name: studentForm.name,
      mobile: studentForm.mobile,
      email: studentForm.email,
      enrollmentNo: '',
      enrollmentNumber: '',
      faculty: studentForm.faculty,
      collegeName: studentForm.faculty,
      yearOfCollege: 'N/A',
      address: '',
      residencyStatus: studentForm.residencyStatus as 'Permanent' | 'Temporary',
      wing: (studentForm.wing || 'A') as Student['wing'],
      roomNo: studentForm.roomNo || 'NA',
      studentType: (studentForm.studentType || 'Permanent') as Student['studentType'],
      joiningDate: now,
      endDate: studentForm.studentType === 'Permanent' ? new Date(now.setMonth(now.getMonth() + 10)) : undefined,
      annualFee: parseFloat(studentForm.annualFee || '0'),
      status: 'Active',
      createdAt: now,
      updatedAt: now
    };
    const id = await db.students.add(newStudent);
    setStudentForm({ name: '', mobile: '', email: '', faculty: '', wing: '', roomNo: '', residencyStatus: '', studentType: 'Hosteller', annualFee: '' });
    await loadData();
    setTab(0);
    console.log('Student added id', id);
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Delete student? Related payments remain intact.')) return;
    await db.students.delete(id);
    await loadData();
  };

  // Get next receipt number
  const getNextReceiptNumber = async () => {
    const currentYear = new Date().getFullYear();
    const settingKey = `receipt_counter_${currentYear}`;
    const setting = await db.settings.where('key').equals(settingKey).first();
    const currentCounter = setting ? parseInt(setting.value) : 0;
    const nextCounter = currentCounter + 1;
    const receiptNo = `${currentYear}-${nextCounter.toString().padStart(4, '0')}`;
    // Update counter
    if (setting) {
      await db.settings.update(setting.id!, { value: nextCounter.toString() });
    } else {
      await db.settings.add({ key: settingKey, value: nextCounter.toString(), description: `Receipt counter for ${currentYear}` });
    }
    return receiptNo;
  };

  // Payment creation (with payment-first support)
  const handleAddPayment = async () => {
    // Auto-generate receipt number if not provided
    let receiptNo = paymentForm.receiptNo;
    if (!receiptNo) {
      receiptNo = await getNextReceiptNumber();
      setPaymentForm(f => ({ ...f, receiptNo }));
    }
    
    let finalStudentId = paymentForm.studentId as number;
    
    // Payment-first workflow: create placeholder student if needed
    if (!paymentForm.studentId && tempStudentName) {
      const placeholderStudent: Omit<Student, 'id'> = {
        name: tempStudentName,
        mobile: 'Pending',
        email: '',
        enrollmentNo: '',
        enrollmentNumber: '',
        faculty: 'To be updated',
        collegeName: 'To be updated',
        yearOfCollege: 'N/A',
        address: '',
        residencyStatus: 'Permanent',
        wing: 'A',
        roomNo: 'TBD',
        studentType: 'Hosteller',
        joiningDate: new Date(),
        annualFee: 0,
        status: 'Active',
        isPlaceholder: true,
        placeholderRef: `TEMP-${paymentForm.receiptNo}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      finalStudentId = await db.students.add(placeholderStudent) as number;
      await loadData();
    }
    
    if (!finalStudentId) {
      alert('Select student or enter temporary name');
      return;
    }
    
    const student = students.find(s => s.id === finalStudentId);
    if (!student) { alert('Invalid student'); return; }
    
    const totalAmount = (['registrationFee','rentFee','waterFee','gymFee','otherFee'] as const)
      .reduce((sum,key)=> sum + parseFloat(paymentForm[key] || '0'), 0);
    
    const newPayment: Omit<Payment,'id'> = {
      studentId: finalStudentId,
      receiptNo: paymentForm.receiptNo,
      date: new Date(paymentForm.paymentDate),
      registrationFee: parseFloat(paymentForm.registrationFee||'0'),
      rentFee: parseFloat(paymentForm.rentFee||'0'),
      waterFee: parseFloat(paymentForm.waterFee||'0'),
      gymFee: parseFloat(paymentForm.gymFee||'0'),
      otherFee: parseFloat(paymentForm.otherFee||'0'),
      totalAmount,
      balanceAmount: 0,
      paymentStatus: 'Paid',
      utrNo: paymentForm.utrNo || undefined,
      paymentMethod: paymentForm.utrNo ? 'Online' : 'Cash',
      cashier: 'System',
      academicYear: getCurrentAcademicYear(),
      paymentType: paymentForm.paymentType || 'Full Payment',
      installmentNo: paymentForm.paymentType === 'Installment' ? 1 : undefined,
      createdAt: new Date()
    };
    const paymentId = await db.payments.add(newPayment);

    // Update the student's fee aggregate
    await updateStudentFeeAggregate(finalStudentId, newPayment.academicYear!, totalAmount);

    // Create a new installment receipt
    const feeAggregate = await db.studentFees.where({ studentId: finalStudentId, academicYear: newPayment.academicYear }).first();
    const installmentCount = await db.installmentReceipts.where({ studentId: finalStudentId, academicYear: newPayment.academicYear }).count();
    await db.installmentReceipts.add({
      studentId: finalStudentId,
      academicYear: newPayment.academicYear,
      receiptNumber: newPayment.receiptNo,
      installmentNumber: installmentCount + 1,
      paymentAmount: totalAmount,
      totalFeeSnapshot: feeAggregate?.totalFee ?? 0,
      paidAmountToDate: feeAggregate?.paidAmount ?? 0,
      pendingAmountAfter: feeAggregate?.pendingAmount ?? 0,
      paymentDate: newPayment.date,
      paymentMode: newPayment.paymentMethod === 'Online' ? 'UPI' : newPayment.paymentMethod,
      isManual: false,
      manualReceiptProvided: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Auto-sync to Receipt Register
    const receiptEntry: Omit<import('../database/db').ReceiptRegisterEntry, 'id'> = {
      date: new Date(paymentForm.paymentDate),
      receiptNo: receiptNo,
      studentId: finalStudentId,
      name: student.name,
      year: student.yearOfCollege || 'N/A',
      collegeName: student.collegeName || student.faculty,
      faculty: student.faculty,
      collegeYear: student.yearOfCollege || 'N/A',
      rent: parseFloat(paymentForm.rentFee || '0'),
      electricity: parseFloat(paymentForm.waterFee || '0'),
      securityDeposit: 0,
      anyOther: parseFloat(paymentForm.otherFee || '0') + parseFloat(paymentForm.gymFee || '0'),
      registrationFees: parseFloat(paymentForm.registrationFee || '0'),
      modeOfTransaction: (paymentForm.utrNo ? 'Online' : 'Cash') as 'Cash' | 'Online' | 'Cheque',
      totalAmount: totalAmount,
      createdAt: new Date()
    };
    await db.receiptRegister.add(receiptEntry);
    
    setPaymentForm({ studentId: '', receiptNo: '', paymentDate: new Date().toISOString().substring(0,10), paymentType: 'Full Payment', registrationFee: '', rentFee: '', waterFee: '', gymFee: '', otherFee: '', utrNo: '' });
    setTempStudentName('');
    await loadData();
    
    // Open receipt for printing
    const addedPayment = await db.payments.get(paymentId);
    if (addedPayment) {
      setSelectedPayment(addedPayment);
      setSelectedStudentForReceipt(student);
      setTab(2);
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Delete payment?')) return;
    await db.payments.delete(id);
    await loadData();
  };

  const openReceipt = async (payment: Payment) => {
    const stu = students.find(s => s.id === payment.studentId) || null;
    if (stu) {
      const feeAggregate = await db.studentFees
        .where({ studentId: stu.id, academicYear: payment.academicYear })
        .first();
      setSelectedFeeAggregate(feeAggregate || null);
    }
    setSelectedPayment(payment);
    setSelectedStudentForReceipt(stu);
    // switch to receipt tab
    setTab(2);
  };

  // Derived filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const searchLower = studentFilters.search.toLowerCase();
      if (searchLower) {
        const inSearch = [s.name, s.mobile, s.faculty, s.wing, s.roomNo]
          .filter(Boolean)
          .some(val => (val as string).toLowerCase().includes(searchLower));
        if (!inSearch) return false;
      }
      if (studentFilters.wing !== 'All' && s.wing !== studentFilters.wing) return false;
      if (studentFilters.type !== 'All' && s.studentType !== studentFilters.type) return false;
      if (studentFilters.residency !== 'All' && s.residencyStatus !== studentFilters.residency) return false;
      return true;
    });
  }, [students, studentFilters]);

  // Derived filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const stu = students.find(s=>s.id===p.studentId);
      const searchLower = paymentFilters.search.toLowerCase();
      if (searchLower) {
        const inSearch = [p.receiptNo, stu?.name, stu?.faculty, p.utrNo]
          .filter(Boolean)
          .some(val => (val as string).toLowerCase().includes(searchLower));
        if (!inSearch) return false;
      }
      if (paymentFilters.type !== 'All' && p.paymentType !== paymentFilters.type) return false;
      if (paymentFilters.academicYear !== 'All' && p.academicYear !== paymentFilters.academicYear) return false;
      const dateVal = new Date(p.date).getTime();
      if (paymentFilters.dateFrom) {
        const from = new Date(paymentFilters.dateFrom).getTime();
        if (dateVal < from) return false;
      }
      if (paymentFilters.dateTo) {
        const to = new Date(paymentFilters.dateTo).getTime();
        if (dateVal > to) return false;
      }
      if (paymentFilters.minAmount) {
        if ((p.totalAmount||0) < parseFloat(paymentFilters.minAmount)) return false;
      }
      if (paymentFilters.maxAmount) {
        if ((p.totalAmount||0) > parseFloat(paymentFilters.maxAmount)) return false;
      }
      return true;
    });
  }, [payments, students, paymentFilters]);

  const exportPaymentsToExcel = () => {
    const rows = filteredPayments.map(p => {
      const stu = students.find(s=>s.id===p.studentId);
      return {
        ReceiptNo: p.receiptNo,
        Date: new Date(p.date).toLocaleDateString('en-IN'),
        Student: stu?.name || '',
        Faculty: stu?.faculty || '',
        Type: p.paymentType,
        Total: p.totalAmount,
        AcademicYear: p.academicYear,
        UTR: p.utrNo || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, 'Payments_Export.xlsx');
  };

  const exportPaymentsToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Payments Export', 14, 15);
    doc.setFontSize(9);
    let y = 25;
    doc.text('Receipt | Date | Student | Type | Total | AY | UTR', 14, y);
    y += 5;
    filteredPayments.forEach(p => {
      const stu = students.find(s=>s.id===p.studentId);
      const line = [
        p.receiptNo,
        new Date(p.date).toLocaleDateString('en-IN'),
        (stu?.name||'').slice(0,18),
        p.paymentType || '',
        String(p.totalAmount||0),
        p.academicYear || '',
        (p.utrNo||'').slice(0,12)
      ].join(' | ');
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 14, y);
      y += 5;
    });
    doc.save('Payments_Export.pdf');
  };

  // ------- UI Sections --------
  const StudentsSection = (
    <Box>
      <Paper sx={{ p:2, mb:3 }} elevation={3}>
        <Typography variant="h6" gutterBottom>Add Student</Typography>
        <Box sx={{ display:'grid', gap:2, gridTemplateColumns:{ xs:'1fr', sm:'repeat(2,1fr)', md:'repeat(3,1fr)'} }}>
          <TextField label="Name" value={studentForm.name} onChange={e=>setStudentForm(f=>({...f,name:e.target.value}))} required />
          <TextField label="Mobile" value={studentForm.mobile} onChange={e=>setStudentForm(f=>({...f,mobile:e.target.value}))} required />
          <TextField label="Email" value={studentForm.email} onChange={e=>setStudentForm(f=>({...f,email:e.target.value}))} />
          <TextField label="Faculty" value={studentForm.faculty} onChange={e=>setStudentForm(f=>({...f,faculty:e.target.value}))} required />
          <TextField select label="Wing" value={studentForm.wing} onChange={e=>setStudentForm(f=>({...f,wing:e.target.value as Student['wing'], roomNo:''}))}>
            <MenuItem value="">None</MenuItem>
            {['A','B','C','D'].map(w=> <MenuItem key={w} value={w}>{w}</MenuItem>)}
          </TextField>
          <TextField select label="Room No" value={studentForm.roomNo} onChange={e=>setStudentForm(f=>({...f,roomNo:e.target.value}))} disabled={!studentForm.wing}>
            <MenuItem value="">Select Room</MenuItem>
            {rooms.filter(r => r.wing === studentForm.wing).map(r=> <MenuItem key={r.id} value={r.roomNumber}>{r.roomNumber} ({r.currentOccupancy}/{r.capacity})</MenuItem>)}
          </TextField>
          <TextField select label="Residency" value={studentForm.residencyStatus} onChange={e=>setStudentForm(f=>({...f,residencyStatus:e.target.value as ('Permanent'|'Temporary')}))} required>
            <MenuItem value="Permanent">Permanent</MenuItem>
            <MenuItem value="Temporary">Temporary</MenuItem>
          </TextField>
          <TextField select label="Type" value={studentForm.studentType} onChange={e=>setStudentForm(f=>({...f,studentType:e.target.value as Student['studentType']}))} required>
            {['Permanent','Temporary','PhD','Non-Hosteller', 'Day Scholar', 'Hosteller'].map(t=> <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          {studentForm.studentType !== 'PhD' && studentForm.studentType !== 'Non-Hosteller' && (
            <>
              <TextField select label="Wing" value={studentForm.wing} onChange={e=>setStudentForm(f=>({...f,wing:e.target.value as Student['wing'], roomNo:''}))} required>
                <MenuItem value="">None</MenuItem>
                {['A','B','C','D'].map(w=> <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
              <TextField select label="Room No" value={studentForm.roomNo} onChange={e=>setStudentForm(f=>({...f,roomNo:e.target.value}))} disabled={!studentForm.wing} required>
                <MenuItem value="">Select Room</MenuItem>
                {rooms.filter(r => r.wing === studentForm.wing).map(r=> <MenuItem key={r.id} value={r.roomNumber}>{r.roomNumber} ({r.currentOccupancy}/{r.capacity})</MenuItem>)}
              </TextField>
            </>
          )}
          <TextField label="Annual Fee" type="number" value={studentForm.annualFee} onChange={e=>setStudentForm(f=>({...f,annualFee:e.target.value}))} required />
        </Box>
        <Box mt={2}>
          <Button variant="contained" onClick={handleAddStudent}>Add Student</Button>
        </Box>
      </Paper>
      <Paper elevation={3} sx={{ p:2 }}>
        <Typography variant="h6" gutterBottom>Students ({filteredStudents.length}/{students.length})</Typography>
        <Box sx={{ display:'grid', gap:1, mb:2, gridTemplateColumns:{ xs:'1fr', sm:'repeat(2,1fr)', md:'repeat(4,1fr)'} }}>
          <TextField label="Search" value={studentFilters.search} onChange={e=>setStudentFilters(f=>({...f,search:e.target.value}))} placeholder="Name / Mobile / Faculty / Wing / Room" size="small" />
          <TextField select label="Wing" value={studentFilters.wing} onChange={e=>setStudentFilters(f=>({...f,wing:e.target.value}))} size="small">
            {['All','A','B','C','D'].map(w=> <MenuItem key={w} value={w}>{w}</MenuItem>)}
          </TextField>
          <TextField select label="Type" value={studentFilters.type} onChange={e=>setStudentFilters(f=>({...f,type:e.target.value}))} size="small">
            {['All','Hosteller','Non-Hosteller','PhD','Day Scholar'].map(t=> <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField select label="Residency" value={studentFilters.residency} onChange={e=>setStudentFilters(f=>({...f,residency:e.target.value}))} size="small">
            {['All','Permanent','Temporary'].map(r=> <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
        </Box>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} mb={2}>
          <Button variant="outlined" size="small" onClick={()=>setStudentFilters({ search:'', wing:'All', type:'All', residency:'All' })}>Reset Filters</Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Wing/Room</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Residency</TableCell>
              <TableCell>Annual Fee</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map(s => (
              <TableRow key={s.id} sx={{ bgcolor: s.isPlaceholder ? '#fff3cd' : 'inherit' }}>
                <TableCell>
                  {s.name}
                  {s.isPlaceholder && <Typography variant="caption" color="warning.main" display="block">⚠ Placeholder</Typography>}
                  <Typography variant="caption" color="text.secondary">{s.mobile}</Typography>
                </TableCell>
                <TableCell>{s.studentType}</TableCell>
                <TableCell>{s.wing}-{s.roomNo}</TableCell>
                <TableCell>{s.faculty}</TableCell>
                <TableCell>{s.residencyStatus}</TableCell>
                <TableCell>₹{s.annualFee}</TableCell>
                <TableCell>
                  {s.isPlaceholder && (
                    <Button size="small" onClick={() => {
                      setEditingPlaceholder(s);
                      setStudentForm({
                        name: s.name,
                        mobile: '',
                        email: '',
                        faculty: '',
                        wing: '',
                        roomNo: '',
                        residencyStatus: '',
                        studentType: 'Hosteller',
                        annualFee: ''
                      });
                      setTab(0); // Switch to the students tab
                    }} sx={{ mr: 1 }}>Complete</Button>
                  )}
                  <IconButton size="small" onClick={()=>handleDeleteStudent(s.id!)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredStudents.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7}><Typography align="center" variant="body2">No students match filters</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );

  const PaymentsSection = (
    <Box>
      <Paper sx={{ p:2, mb:3 }} elevation={3}>
        <Typography variant="h6" gutterBottom>Add Payment</Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Select existing student OR enter temporary name for payment-first workflow
        </Typography>
        <Box sx={{ display:'grid', gap:2, gridTemplateColumns:{ xs:'1fr', sm:'repeat(2,1fr)', md:'repeat(3,1fr)'} }}>
          <TextField 
            select 
            label="Student (Optional if temp name given)" 
            value={paymentForm.studentId} 
            onChange={e=>setPaymentForm(f=>({...f,studentId: parseInt(e.target.value)}))}>
            <MenuItem value="">None - Use temp name</MenuItem>
            {students.map(s=> <MenuItem key={s.id} value={s.id!}>
              {s.name} - {s.faculty} {s.isPlaceholder ? '⚠ Placeholder' : ''}
            </MenuItem>)}
          </TextField>
          <TextField 
            label="OR Temporary Student Name" 
            value={tempStudentName} 
            onChange={e=>setTempStudentName(e.target.value)}
            helperText="Use this to add payment before full registration"
            disabled={!!paymentForm.studentId}
          />
          <TextField 
            label="Receipt No (Auto-generated if empty)" 
            value={paymentForm.receiptNo} 
            onChange={e=>setPaymentForm(f=>({...f,receiptNo:e.target.value}))} 
            placeholder="Auto: YYYY-####"
            helperText="Leave empty for auto-number"
          />
          <TextField type="date" label="Date" value={paymentForm.paymentDate} onChange={e=>setPaymentForm(f=>({...f,paymentDate:e.target.value}))} required />
          <TextField select label="Type" value={paymentForm.paymentType} onChange={e=>setPaymentForm(f=>({...f,paymentType:e.target.value as ('Full Payment'|'Installment')}))} required>
            <MenuItem value="Full Payment">Full Payment</MenuItem>
            <MenuItem value="Installment">Installment</MenuItem>
          </TextField>
          <TextField label="Registration Fee" type="number" value={paymentForm.registrationFee} onChange={e=>setPaymentForm(f=>({...f,registrationFee:e.target.value}))} />
          <TextField label="Room Rent" type="number" value={paymentForm.rentFee} onChange={e=>setPaymentForm(f=>({...f,rentFee:e.target.value}))} />
          <TextField label="Water & Electricity" type="number" value={paymentForm.waterFee} onChange={e=>setPaymentForm(f=>({...f,waterFee:e.target.value}))} />
          <TextField label="Gym" type="number" value={paymentForm.gymFee} onChange={e=>setPaymentForm(f=>({...f,gymFee:e.target.value}))} />
          <TextField label="Others" type="number" value={paymentForm.otherFee} onChange={e=>setPaymentForm(f=>({...f,otherFee:e.target.value}))} />
          <TextField label="UTR" value={paymentForm.utrNo} onChange={e=>setPaymentForm(f=>({...f,utrNo:e.target.value}))} />
        </Box>
        <Box mt={2}>
          <Button variant="contained" onClick={handleAddPayment}>Record Payment</Button>
        </Box>
      </Paper>
      <Paper elevation={3} sx={{ p:2 }}>
        <Typography variant="h6" gutterBottom>Payments ({filteredPayments.length}/{payments.length})</Typography>
        <Box sx={{ display:'grid', gap:1, mb:2, gridTemplateColumns:{ xs:'1fr', sm:'repeat(2,1fr)', md:'repeat(4,1fr)', lg:'repeat(6,1fr)'} }}>
          <TextField label="Search" value={paymentFilters.search} onChange={e=>setPaymentFilters(f=>({...f,search:e.target.value}))} placeholder="Receipt / Student / Faculty / UTR" />
          <TextField select label="Type" value={paymentFilters.type} onChange={e=>setPaymentFilters(f=>({...f,type:e.target.value}))}>
            {['All','Full Payment','Installment'].map(t=> <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="From" type="date" value={paymentFilters.dateFrom} onChange={e=>setPaymentFilters(f=>({...f,dateFrom:e.target.value}))} InputLabelProps={{ shrink:true }} />
          <TextField label="To" type="date" value={paymentFilters.dateTo} onChange={e=>setPaymentFilters(f=>({...f,dateTo:e.target.value}))} InputLabelProps={{ shrink:true }} />
          <TextField label="Min Amt" type="number" value={paymentFilters.minAmount} onChange={e=>setPaymentFilters(f=>({...f,minAmount:e.target.value}))} />
          <TextField label="Max Amt" type="number" value={paymentFilters.maxAmount} onChange={e=>setPaymentFilters(f=>({...f,maxAmount:e.target.value}))} />
          <TextField label="Academic Year" value={paymentFilters.academicYear} onChange={e=>setPaymentFilters(f=>({...f,academicYear:e.target.value}))} placeholder="YYYY-YYYY" />
        </Box>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} mb={2}>
          <Button variant="outlined" size="small" onClick={()=>setPaymentFilters({ search:'', type:'All', dateFrom:'', dateTo:'', minAmount:'', maxAmount:'', academicYear:'All' })}>Reset Filters</Button>
          <Button variant="contained" size="small" onClick={exportPaymentsToExcel}>Export Excel</Button>
          <Button variant="contained" size="small" color="secondary" onClick={exportPaymentsToPDF}>Export PDF</Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Receipt</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>AY</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.map(p => {
              const stu = students.find(s=>s.id===p.studentId);
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.receiptNo}</TableCell>
                  <TableCell>{stu?.name || 'Unknown'}<br/><Typography variant="caption" color="text.secondary">{stu?.faculty}</Typography></TableCell>
                  <TableCell>{new Date(p.date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>{p.paymentType || 'Fee'}</TableCell>
                  <TableCell>₹{p.totalAmount || 0}</TableCell>
                  <TableCell>{p.academicYear || ''}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={()=>openReceipt(p)}>View</Button>
                    <IconButton size="small" onClick={()=>handleDeletePayment(p.id!)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredPayments.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7}><Typography align="center" variant="body2">No payments match filters</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );

  const ReceiptSection = (
    <Box>
      {selectedPayment && selectedStudentForReceipt ? (
        <HostelReceipt
            open={true}
            onClose={()=>{ setSelectedPayment(null); setSelectedStudentForReceipt(null); setSelectedFeeAggregate(null); }}
            payment={selectedPayment}
            student={selectedStudentForReceipt}
            feeAggregate={selectedFeeAggregate}
        />
      ) : (
        <Paper sx={{ p:3 }}>
          <Typography variant="body2">Select a payment from Payments tab to view its receipt.</Typography>
        </Paper>
      )}
    </Box>
  );

  return (
    <Box sx={{ p:2 }}>
      <Paper sx={{ p:2, mb:2 }} elevation={4}>
        <Typography variant="h5" fontWeight={600}>Unified Hostel Management</Typography>
        <Typography variant="caption" color="text.secondary">Academic Year: {getCurrentAcademicYear()}</Typography>
      </Paper>
      <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb:2 }}>
        <Tab label="Students" />
        <Tab label="Payments" />
        <Tab label="Receipt" />
      </Tabs>
      {tab===0 && StudentsSection}
      {tab===1 && PaymentsSection}
      {tab===2 && ReceiptSection}
      <Dialog open={loading} onClose={()=>{}}><Box p={3}><Typography>Loading...</Typography></Box></Dialog>
      
      {/* Edit/Complete Student Dialog */}
      <Dialog open={!!editingStudent} onClose={()=>setEditingStudent(null)} maxWidth="md" fullWidth>
        <DialogTitle>{editingStudent?.isPlaceholder ? 'Complete Student Details' : 'Edit Student'}</DialogTitle>
        <DialogContent>
          {editingStudent && (
            <Box sx={{ display:'grid', gap:2, gridTemplateColumns:{ xs:'1fr', sm:'repeat(2,1fr)'}, mt:2 }}>
              <TextField label="Name" value={editingStudent.name} onChange={e=>setEditingStudent({...editingStudent, name:e.target.value})} required />
              <TextField label="Mobile" value={editingStudent.mobile} onChange={e=>setEditingStudent({...editingStudent, mobile:e.target.value})} required />
              <TextField label="Email" value={editingStudent.email} onChange={e=>setEditingStudent({...editingStudent, email:e.target.value})} />
              <TextField label="Faculty" value={editingStudent.faculty} onChange={e=>setEditingStudent({...editingStudent, faculty:e.target.value})} required />
              <TextField select label="Wing" value={editingStudent.wing} onChange={e=>setEditingStudent({...editingStudent, wing:e.target.value as Student['wing'], roomNo:''})} required>
                {['A','B','C','D'].map(w=> <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
              <TextField select label="Room No" value={editingStudent.roomNo} onChange={e=>setEditingStudent({...editingStudent, roomNo:e.target.value})} required disabled={!editingStudent.wing}>
                <MenuItem value="">Select Room</MenuItem>
                {rooms.filter(r => r.wing === editingStudent.wing).map(r=> <MenuItem key={r.id} value={r.roomNumber}>{r.roomNumber} ({r.currentOccupancy}/{r.capacity})</MenuItem>)}
              </TextField>
              <TextField select label="Residency" value={editingStudent.residencyStatus} onChange={e=>setEditingStudent({...editingStudent, residencyStatus:e.target.value as ('Permanent'|'Temporary')})} required>
                <MenuItem value="Permanent">Permanent</MenuItem>
                <MenuItem value="Temporary">Temporary</MenuItem>
              </TextField>
              <TextField select label="Type" value={editingStudent.studentType} onChange={e=>setEditingStudent({...editingStudent, studentType:e.target.value as Student['studentType']})} required>
                {['Hosteller','Non-Hosteller','PhD','Day Scholar'].map(t=> <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Annual Fee" type="number" value={editingStudent.annualFee} onChange={e=>setEditingStudent({...editingStudent, annualFee:parseFloat(e.target.value)||0})} required />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setEditingStudent(null)}>Cancel</Button>
          <Button variant="contained" onClick={async()=>{
            if(!editingStudent) return;
            const updated = {...editingStudent, isPlaceholder: false, updatedAt: new Date()};
            await db.students.update(editingStudent.id!, updated);
            setEditingStudent(null);
            loadData();
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnifiedManagement;
