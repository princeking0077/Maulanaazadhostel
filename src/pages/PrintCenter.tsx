import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, MenuItem, Divider, Paper } from '@mui/material';
import { db, Student, InstallmentReceipt } from '../database/db';
import PaymentReceiptPrint from '../components/print/PaymentReceiptPrint';
import StudentRegistrationPrint from '../components/print/StudentRegistrationPrint';
import BillingStatementPrint from '../components/print/BillingStatementPrint';
import { openPrintWindow } from '../utils/printUtils';
import { exportElementToPDF } from '../utils/pdfExport';
import { formatDateDDMonthYYYY } from '../utils/dateUtils';

const PrintCenter: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [receipts, setReceipts] = useState<InstallmentReceipt[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | ''>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const receiptRef = useRef<HTMLDivElement>(null);
  const registrationRef = useRef<HTMLDivElement>(null);
  const billingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const s = await db.students.toArray();
      setStudents(s);
      const r = await db.installmentReceipts.orderBy('paymentDate').reverse().toArray();
      setReceipts(r);
    })();
  }, []);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedReceipt = receipts.find(r => r.id === selectedReceiptId);

  const studentsById: Record<number, Student> = Object.fromEntries(students.map(s => [s.id!, s]));
  const filteredRangeReceipts = receipts.filter(r => {
    if (from && new Date(r.paymentDate) < new Date(from)) return false;
    if (to && new Date(r.paymentDate) > new Date(to)) return false;
    return true;
  });

  const handlePrint = (which: 'receipt' | 'registration' | 'billing') => {
    let el: HTMLDivElement | null = null;
    if (which === 'receipt') el = receiptRef.current;
    if (which === 'registration') el = registrationRef.current;
    if (which === 'billing') el = billingRef.current;
    if (!el) return;
    openPrintWindow(el.innerHTML, 'Print');
  };

  const handlePdf = (which: 'receipt' | 'registration' | 'billing') => {
    let el: HTMLDivElement | null = null;
    if (which === 'receipt') el = receiptRef.current;
    if (which === 'registration') el = registrationRef.current;
    if (which === 'billing') el = billingRef.current;
    if (!el) return;
    exportElementToPDF(el, `${which}-print`);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>Print Center</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>Generate and print receipts, registration forms and billing statements offline.</Typography>
      <Divider sx={{ mb:3 }} />
      <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', lg:'1fr 1fr' }, gap:3 }}>
        {/* Receipt Printer */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>Payment Receipt</Typography>
            <TextField select label="Select Receipt" fullWidth margin="normal" value={selectedReceiptId} onChange={e => setSelectedReceiptId(e.target.value === '' ? '' : Number(e.target.value))}>
              <MenuItem value="">-- None --</MenuItem>
              {receipts.map(r => (
                <MenuItem key={r.id} value={r.id!}>{r.receiptNumber} • {formatDateDDMonthYYYY(r.paymentDate)} • ₹{r.paymentAmount}</MenuItem>
              ))}
            </TextField>
            <Box ref={receiptRef} sx={{ display: selectedReceipt ? 'block':'none' }}>
              {selectedReceipt && (
                <PaymentReceiptPrint receipt={selectedReceipt} student={studentsById[selectedReceipt.studentId!]} />
              )}
            </Box>
            <Box sx={{ display:'flex', gap:2, mt:1 }}>
              <Button disabled={!selectedReceipt} variant="contained" onClick={() => handlePrint('receipt')}>Print Receipt</Button>
              <Button disabled={!selectedReceipt} variant="outlined" onClick={() => handlePdf('receipt')}>PDF</Button>
            </Box>
          </CardContent>
        </Card>
        {/* Registration Printer */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>Student Registration</Typography>
            <TextField select label="Select Student" fullWidth margin="normal" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value === '' ? '' : Number(e.target.value))}>
              <MenuItem value="">-- None --</MenuItem>
              {students.map(s => (
                <MenuItem key={s.id} value={s.id!}>{s.name} • {s.enrollmentNo}</MenuItem>
              ))}
            </TextField>
            <Box ref={registrationRef} sx={{ display: selectedStudent ? 'block':'none' }}>
              {selectedStudent && (
                <StudentRegistrationPrint student={selectedStudent} />
              )}
            </Box>
            <Box sx={{ display:'flex', gap:2, mt:1 }}>
              <Button disabled={!selectedStudent} variant="contained" onClick={() => handlePrint('registration')}>Print Registration</Button>
              <Button disabled={!selectedStudent} variant="outlined" onClick={() => handlePdf('registration')}>PDF</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ mt:3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>Billing Statement</Typography>
            <Box sx={{ display:'flex', gap:2, mb:2 }}>
              <TextField label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} />
              <TextField label="To" type="date" value={to} onChange={e => setTo(e.target.value)} />
              <Button variant="outlined" onClick={() => { setFrom(''); setTo(''); }}>Clear</Button>
            </Box>
            <Paper ref={billingRef} elevation={0} sx={{ p:2 }}>
              <BillingStatementPrint receipts={filteredRangeReceipts} studentsById={studentsById} from={from? new Date(from): undefined} to={to? new Date(to): undefined} />
            </Paper>
            <Box sx={{ display:'flex', gap:2, mt:2 }}>
              <Button variant="contained" onClick={() => handlePrint('billing')}>Print Billing Statement</Button>
              <Button variant="outlined" onClick={() => handlePdf('billing')}>PDF</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default PrintCenter;
