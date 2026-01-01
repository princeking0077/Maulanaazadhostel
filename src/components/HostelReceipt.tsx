import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Box, Typography, Grid, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Printer } from 'lucide-react';
import { db } from '../database/db';
import type { Student, Payment, StudentFeeAggregate, InstallmentReceipt } from '../database/db';

// Props definition for the component
interface HostelReceiptProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  payment: Payment | null;
  feeAggregate: StudentFeeAggregate | null;
}

// Helper function to convert number to words
const numberToWords = (num: number): string => {
  const a = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ];
  const b = [
    '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
  ];

  if (num === 0) return 'zero';

  const inWords = (n: number): string => {
    if (n < 20) {
      return a[n];
    }
    if (n < 100) {
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    }
    if (n < 1000) {
      return a[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    }
    if (n < 100000) {
        return inWords(Math.floor(n/1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    }
    if (n < 10000000) {
        return inWords(Math.floor(n/100000)) + ' lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    }
    return '';
  };

  const fullWords = inWords(num);
  return fullWords.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};


export default function HostelReceipt({ open, onClose, student, payment, feeAggregate }: HostelReceiptProps) {
  const [installmentHistory, setInstallmentHistory] = useState<InstallmentReceipt[]>([]);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const savedLogo = await db.settings.get('logo');
      if (savedLogo) {
        setLogo(savedLogo.value);
      }
    };
    fetchLogo();

    if (student && payment) {
      const fetchInstallmentHistory = async () => {
        const history = await db.installmentReceipts
          .where({ studentId: student.id, academicYear: payment.academicYear })
          .toArray();
        setInstallmentHistory(history);
      };
      fetchInstallmentHistory();
    }
  }, [student, payment]);

  if (!student || !payment) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const total = payment.totalAmount || 0;
  const amountInWords = numberToWords(total) + ' Only';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <Box id="printable-area" sx={{ p: 4, border: '4px solid #333' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Grid container alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 1 }}>
              <Grid item>
                {logo ? (
                  <img src={logo} alt="Hostel Logo" style={{ width: '64px', height: '64px' }} />
                ) : (
                  <Box sx={{ width: 64, height: 64, border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>LOGO</Typography>
                  </Box>
                )}
              </Grid>
              <Grid item>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Dr. Rafiq Zakaria Campus</Typography>
                <Typography variant="body2">Maulana Azad Educational Trust's</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Maulana Azad Complex of Hostel</Typography>
              </Grid>
            </Grid>
            <Typography variant="caption">Dr. Rafiq Zakaria Marg, Rauza Bagh, Aurangabad - 431 001 (M.S.)</Typography>
          </Box>

          {/* Receipt Number and Date */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography><strong>Receipt No.</strong> {payment.receiptNo}</Typography>
            <Typography><strong>Date:</strong> {new Date(payment.date).toLocaleDateString('en-GB')}</Typography>
          </Box>

          {/* Non-Refundable Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>NON-REFUNDABLE</Typography>
            <Typography variant="body2">Received the following Charges form</Typography>
          </Box>

          {/* Student Details */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1 }}><strong>Shri.</strong> {student.name}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography><strong>Class:</strong> {student.faculty}</Typography>
              <Typography><strong>For First / Second term 20:</strong> {payment.academicYear}</Typography>
            </Box>
          </Box>

          {/* Fee Table */}
          <Table sx={{ width: '100%', border: '2px solid #888', mb: 4 }}>
            <TableHead>
              <TableRow sx={{ borderBottom: '2px solid #888' }}>
                <TableCell sx={{ borderRight: '2px solid #888', p: 2, textAlign: 'left', fontWeight: 'semibold' }}>Description</TableCell>
                <TableCell sx={{ p: 2, textAlign: 'left', fontWeight: 'semibold', width: '12rem' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{ borderBottom: '1px solid #888' }}>
                <TableCell sx={{ borderRight: '2px solid #888', p: 2 }}>Registration Fee</TableCell>
                <TableCell sx={{ p: 2 }}>{payment.registrationFee || 0}</TableCell>
              </TableRow>
              <TableRow sx={{ borderBottom: '1px solid #888' }}>
                <TableCell sx={{ borderRight: '2px solid #888', p: 2 }}>Room Rent</TableCell>
                <TableCell sx={{ p: 2 }}>{payment.rentFee || 0}</TableCell>
              </TableRow>
              <TableRow sx={{ borderBottom: '1px solid #888' }}>
                <TableCell sx={{ borderRight: '2px solid #888', p: 2 }}>Water & Electricity</TableCell>
                <TableCell sx={{ p: 2 }}>{payment.waterFee || 0}</TableCell>
              </TableRow>
              <TableRow sx={{ borderBottom: '1px solid #888' }}>
                <TableCell sx={{ borderRight: '2px solid #888', p: 2 }}>GYM</TableCell>
                <TableCell sx={{ p: 2 }}>{payment.gymFee || 0}</TableCell>
              </TableRow>
              <TableRow sx={{ borderBottom: '1px solid #888' }}>
                <TableCell sx={{ borderRight: '2px solid #888', p: 2 }}>Others</TableCell>
                <TableCell sx={{ p: 2 }}>{payment.otherFee || 0}</TableCell>
              </TableRow>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i} sx={{ borderBottom: '1px solid #888' }}>
                  <TableCell sx={{ borderRight: '2px solid #888', p: 2, height: '3rem' }}></TableCell>
                  <TableCell sx={{ p: 2 }}></TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ borderRight: '2px solid #888', p: 2, fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ p: 2, fontWeight: 'bold' }}>Rs. {total.toFixed(2)}</TableCell>
              </TableRow>
              {feeAggregate && (
                <>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ borderRight: '2px solid #888', p: 2, fontWeight: 'bold' }}>Total Fee</TableCell>
                    <TableCell sx={{ p: 2, fontWeight: 'bold' }}>Rs. {feeAggregate.totalFee.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ borderRight: '2px solid #888', p: 2, fontWeight: 'bold' }}>Amount Paid</TableCell>
                    <TableCell sx={{ p: 2, fontWeight: 'bold' }}>Rs. {feeAggregate.paidAmount.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ borderRight: '2px solid #888', p: 2, fontWeight: 'bold' }}>Balance</TableCell>
                    <TableCell sx={{ p: 2, fontWeight: 'bold' }}>Rs. {feeAggregate.pendingAmount.toFixed(2)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>

          {/* Payment Details */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1 }}><strong>Rs. (in words):</strong> {amountInWords}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography><strong>Payment Mode:</strong> {payment.paymentMethod}</Typography>
              <Typography><strong>Cash Cheque D.D. No.:</strong> {payment.utrNo || 'N/A'}</Typography>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 4 }}>
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>to be paid in first term only</Typography>
            <Typography sx={{ fontWeight: 'semibold' }}>Cashier</Typography>
          </Box>

          {/* Installment History */}
          {installmentHistory.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Installment History</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Installment</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {installmentHistory.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell>{installment.installmentNumber}</TableCell>
                      <TableCell>{new Date(installment.paymentDate).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell align="right">Rs. {installment.paymentAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<Printer />} className="print-button">
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
}