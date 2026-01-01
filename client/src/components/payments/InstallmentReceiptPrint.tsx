import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { InstallmentReceipt, Student } from '../../database/db';
import defaultLogo from '../../assets/maulana-azad-logo.png';

interface InstallmentReceiptPrintProps {
  open: boolean;
  onClose: () => void;
  installment: InstallmentReceipt;
  student: Student;
}

const InstallmentReceiptPrint: React.FC<InstallmentReceiptPrintProps> = ({ open, onClose, installment, student }) => {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('installment-receipt-content');
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`Receipt_${installment.receiptNumber}_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const displayName = student.name || (student.placeholderRef ? `Placeholder (${student.placeholderRef})` : 'Unknown Student');
  const isPlaceholder = student.isPlaceholder || false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Payment Receipt - {installment.receiptNumber}</DialogTitle>
      <DialogContent>
        <Box id="installment-receipt-content" sx={{ p: 3, border: '2px solid black', '@media print': { border: 'none' } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <Box sx={{ width: 80, height: 80, flexShrink: 0 }}>
              <img src={defaultLogo} alt="Hostel Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold">Maulana Azad Hostel Complex</Typography>
              <Typography variant="body2">Jamia Millia Islamia University</Typography>
              <Typography variant="body2">New Delhi - 110025</Typography>
              <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.main' }}>PAYMENT RECEIPT</Typography>
            </Box>
          </Box>

          {/* Receipt Details */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2, border: '1px solid black', p: 2 }}>
            <Box>
              <Typography variant="body2"><strong>Receipt No:</strong> {installment.receiptNumber}</Typography>
              <Typography variant="body2"><strong>Installment:</strong> #{installment.installmentNumber}</Typography>
              <Typography variant="body2"><strong>Date:</strong> {formatDate(installment.paymentDate)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2"><strong>Academic Year:</strong> {installment.academicYear}</Typography>
              <Typography variant="body2"><strong>Payment Mode:</strong> {installment.paymentMode}</Typography>
              {installment.isManual && <Typography variant="body2" color="warning.main"><strong>Manual Receipt</strong></Typography>}
            </Box>
          </Box>

          {/* Student Details */}
          <Box sx={{ mb: 2, border: '1px solid black', p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Student Information
              {isPlaceholder && <Typography component="span" color="warning.main" sx={{ ml: 1, fontSize: '0.85rem' }}>(Placeholder)</Typography>}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
              <Typography variant="body2"><strong>Name:</strong> {displayName}</Typography>
              <Typography variant="body2"><strong>Mobile:</strong> {student.mobile || 'N/A'}</Typography>
              <Typography variant="body2"><strong>Enrollment No:</strong> {student.enrollmentNo || 'N/A'}</Typography>
              <Typography variant="body2"><strong>Wing-Room:</strong> {student.wing || 'N/A'}-{student.roomNo || 'N/A'}</Typography>
            </Box>
          </Box>

          {/* Payment Details */}
          <Box sx={{ mb: 2, border: '1px solid black', p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Payment Details</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2"><strong>Payment Amount:</strong></Typography>
              <Typography variant="body2">₹{installment.paymentAmount.toLocaleString()}</Typography>
              
              <Typography variant="body2"><strong>Total Fee:</strong></Typography>
              <Typography variant="body2">₹{installment.totalFeeSnapshot.toLocaleString()}</Typography>
              
              <Typography variant="body2"><strong>Total Paid to Date:</strong></Typography>
              <Typography variant="body2">₹{installment.paidAmountToDate.toLocaleString()}</Typography>
              
              <Typography variant="body2"><strong>Pending Amount:</strong></Typography>
              <Typography variant="body2" color={installment.pendingAmountAfter > 0 ? 'warning.main' : 'success.main'} fontWeight="bold">
                ₹{installment.pendingAmountAfter.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          {/* Amount in Words */}
          <Box sx={{ mb: 2, border: '1px solid black', p: 1.5 }}>
            <Typography variant="body2">
              <strong>Amount in Words:</strong> {numberToWords(Math.floor(installment.paymentAmount))} Rupees Only
            </Typography>
          </Box>

          {/* Notes */}
          {installment.notes && (
            <Box sx={{ mb: 2, border: '1px solid black', p: 1.5 }}>
              <Typography variant="body2"><strong>Notes:</strong> {installment.notes}</Typography>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid black' }}>
            <Box>
              <Typography variant="caption">Issued On: {new Date(installment.createdAt).toLocaleString()}</Typography>
              <br />
              <Typography variant="caption">Issued By: {installment.createdBy || 'System'}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight="bold">Authorized Signature</Typography>
              <Box sx={{ borderBottom: '1px solid black', width: 150, mt: 3 }} />
            </Box>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              This is a computer-generated receipt. No signature required.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadPDF}>
          Download PDF
        </Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstallmentReceiptPrint;
