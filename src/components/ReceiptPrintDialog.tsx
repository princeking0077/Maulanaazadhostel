import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  Print as PrintIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Payment, Student } from '../database/db';
import defaultLogo from '../assets/maulana-azad-logo.png';

interface ReceiptPrintDialogProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  student: Student;
}

// Reusable receipt copy component
interface ReceiptCopyProps {
  copyType: 'STUDENT COPY' | 'HOSTEL COPY';
  payment: Payment;
  student: Student;
  logoDataUrl: string;
  formatDate: (date: Date) => string;
  getCurrentAcademicYear: () => string;
  numberToWords: (num: number) => string;
}

const ReceiptCopy: React.FC<ReceiptCopyProps> = ({ 
  copyType, 
  payment, 
  student, 
  logoDataUrl,
  formatDate,
  getCurrentAcademicYear,
  numberToWords 
}) => (
  <Box sx={{ border: '2px solid black', p: 3, pageBreakInside: 'avoid' }}>
    <Box sx={{ textAlign: 'right', mb: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.875rem' }}>
        {copyType}
      </Typography>
    </Box>

    {/* Header */}
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Box sx={{ width: 96, height: 96, flexShrink: 0 }}>
        {logoDataUrl && (
          <img 
            src={logoDataUrl} 
            alt="Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" fontWeight="bold">Dr. Rafiq Zakaria Campus</Typography>
        <Typography variant="body1">Maulana Azad Educational Trust's</Typography>
        <Typography variant="h6" fontWeight="bold">Maulana Azad Complex of Hostel</Typography>
        <Typography variant="body2">Dr. Rafiq Zakaria Marg, Rauza Bagh, Aurangabad - 431 001 (M.S.)</Typography>
      </Box>
    </Box>

    {/* Receipt Number and Date */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid black', pt: 1, mb: 2 }}>
      <Box>
        <strong>Receipt No.</strong>
        <span style={{ marginLeft: 16, color: '#dc2626', fontWeight: 'bold', fontSize: '1.25rem' }}>
          {payment.receiptNo}
        </span>
      </Box>
      <Box>
        <strong>Date</strong>
        <span style={{ marginLeft: 16, borderBottom: '1px solid black', display: 'inline-block', width: 128 }}>
          {formatDate(payment.date)}
        </span>
      </Box>
    </Box>

    {/* Non-Refundable */}
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      <Typography variant="h6" fontWeight="bold">NON-REFUNDABLE</Typography>
      <Typography variant="body2">Received the following Charges from</Typography>
    </Box>

    {/* Student Name or Placeholder */}
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <strong>Shri.</strong>
        <span style={{ flex: 1, borderBottom: '1px solid black', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {student.name ? student.name : (student.placeholderRef || 'Placeholder')}
          {student.isPlaceholder && (
            <span style={{ marginLeft: 8 }}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 1, px: 1, py: 0.25, fontSize: '0.75rem', color: '#ad8b00' }}>
                Placeholder
              </Box>
            </span>
          )}
        </span>
      </Box>
      <Box sx={{ mt: 1 }}>
        <strong>Joining Date:</strong>
        <span style={{ marginLeft: 8 }}>{student.studentType === 'Hosteller' && student.joiningDate ? formatDate(new Date(student.joiningDate)) : 'N/A'}</span>
      </Box>
    </Box>

    {/* Class and Term */}
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Box sx={{ flex: 1, display: 'flex' }}>
        <strong>Class</strong>
        <span style={{ flex: 1, borderBottom: '1px solid black', marginLeft: 8 }}>
          {student.collegeName} - {student.yearOfCollege}
        </span>
      </Box>
      <Box>
        <strong>First / Second term {getCurrentAcademicYear()}</strong>
      </Box>
    </Box>

    {/* Fee Table */}
    <table style={{ width: '100%', border: '2px solid black', borderCollapse: 'collapse', marginBottom: 16 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid black' }}>
          <th style={{ borderRight: '2px solid black', padding: 8, textAlign: 'left' }}>Description</th>
          <th style={{ padding: 8, textAlign: 'left' }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ borderBottom: '1px solid black' }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}>Registration Fee</td>
          <td style={{ padding: 8 }}>{payment.registrationFee > 0 ? payment.registrationFee : ''}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid black' }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}>Room Rent</td>
          <td style={{ padding: 8 }}>{payment.rentFee > 0 ? payment.rentFee : ''}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid black' }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}>Electricity Fee</td>
          <td style={{ padding: 8 }}>{payment.electricityFee && payment.electricityFee > 0 ? payment.electricityFee : ''}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid black' }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}>Security Deposit</td>
          <td style={{ padding: 8 }}>{payment.securityDeposit && payment.securityDeposit > 0 ? payment.securityDeposit : ''}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid black' }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}>Water & Other Utilities</td>
          <td style={{ padding: 8 }}>{payment.waterFee > 0 ? payment.waterFee : ''}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid black' }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}>GYM</td>
          <td style={{ padding: 8 }}>{payment.gymFee > 0 ? payment.gymFee : ''}</td>
        </tr>
        <tr style={{ borderBottom: '1px solid black' }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}>Others</td>
          <td style={{ padding: 8 }}>{payment.otherFee > 0 ? payment.otherFee : ''}</td>
        </tr>
        {payment.messVegFee && payment.messVegFee > 0 && (
          <tr style={{ borderBottom: '1px solid black' }}>
            <td style={{ borderRight: '2px solid black', padding: 8 }}>Veg Mess</td>
            <td style={{ padding: 8 }}>{payment.messVegFee}</td>
          </tr>
        )}
        {payment.messNonVegFee && payment.messNonVegFee > 0 && (
          <tr style={{ borderBottom: '1px solid black' }}>
            <td style={{ borderRight: '2px solid black', padding: 8 }}>Non-Veg Mess</td>
            <td style={{ padding: 8 }}>{payment.messNonVegFee}</td>
          </tr>
        )}
        {payment.canteenFee && payment.canteenFee > 0 && (
          <tr style={{ borderBottom: '1px solid black' }}>
            <td style={{ borderRight: '2px solid black', padding: 8 }}>College Canteen</td>
            <td style={{ padding: 8 }}>{payment.canteenFee}</td>
          </tr>
        )}
        {payment.xeroxFee && payment.xeroxFee > 0 && (
          <tr style={{ borderBottom: '1px solid black' }}>
            <td style={{ borderRight: '2px solid black', padding: 8 }}>Campus Xerox</td>
            <td style={{ padding: 8 }}>{payment.xeroxFee}</td>
          </tr>
        )}
        <tr style={{ borderBottom: '1px solid black', height: 32 }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}></td>
          <td style={{ padding: 8 }}></td>
        </tr>
        <tr style={{ borderBottom: '1px solid black', height: 32 }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}></td>
          <td style={{ padding: 8 }}></td>
        </tr>
        <tr style={{ borderBottom: '1px solid black', height: 32 }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}></td>
          <td style={{ padding: 8 }}></td>
        </tr>
        <tr style={{ borderBottom: '2px solid black', fontWeight: 'bold' }}>
          <td style={{ borderRight: '2px solid black', padding: 8 }}>Total</td>
          <td style={{ padding: 8 }}>{payment.totalAmount}</td>
        </tr>
      </tbody>
    </table>

    {/* Amount in Words */}
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex' }}>
        <strong>Rs. (in words)</strong>
        <span style={{ flex: 1, borderBottom: '1px solid black', marginLeft: 8 }}>
          {numberToWords(payment.totalAmount)} Only
        </span>
      </Box>
    </Box>

    {/* Payment Mode */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ flex: 1, borderBottom: '1px solid black' }}>
        <strong>{payment.paymentMethod}</strong>
      </Box>
      <Box sx={{ display: 'flex', ml: 2 }}>
        <strong>Cheque D.D. No.</strong>
        <span style={{ borderBottom: '1px solid black', marginLeft: 8, display: 'inline-block', width: 128 }}>
          {payment.utrNo || ''}
        </span>
      </Box>
    </Box>

    {/* Footer */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
      <Typography variant="body2" fontStyle="italic">
        to be paid in first term only
      </Typography>
      <Typography fontWeight="bold">
        {payment.cashier}
      </Typography>
    </Box>
  </Box>
);

const ReceiptPrintDialog: React.FC<ReceiptPrintDialogProps> = ({
  open,
  onClose,
  payment,
  student,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | 'Letter'>('A4');
  const [showPreview, setShowPreview] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const receiptRef = useRef<HTMLDivElement>(null);

  // Convert logo to data URL for printing
  React.useEffect(() => {
    const convertLogoToDataUrl = async () => {
      const uploadedLogo = localStorage.getItem('uploadedLogo');
      if (uploadedLogo) {
        setLogoDataUrl(uploadedLogo);
      } else {
        // Fallback to bundled logo URL (works with html2canvas in same-origin)
        setLogoDataUrl(defaultLogo);
      }
    };
    if (open) {
      convertLogoToDataUrl();
    }
  }, [open]);

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
    return num.toString();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !receiptRef.current) return;

    const paperSizes = {
      A4: '@page { size: A4; margin: 10mm; }',
      A5: '@page { size: A5; margin: 8mm; }',
      Letter: '@page { size: Letter; margin: 10mm; }',
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${payment.receiptNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            ${paperSizes[paperSize]}
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${receiptRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for images and resources to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Don't close automatically to allow user to save as PDF
    };
  };

  const handleSavePDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      // Ensure background is white for better PDF appearance
      const originalBg = receiptRef.current.style.backgroundColor;
      receiptRef.current.style.backgroundColor = 'white';

      // Capture element as high-resolution canvas
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,              // increase pixel density for crispness
        useCORS: true,         // try to load cross-origin images
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: document.body.scrollWidth,
        windowHeight: document.body.scrollHeight,
      });

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // Create PDF based on paper size
      const pdfFormat = paperSize === 'Letter' ? 'letter' : paperSize.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = new jsPDF('p', 'mm', pdfFormat as any);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Compute image dimensions in mm to keep aspect ratio
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidthPx = imgProps.width;
      const imgHeightPx = imgProps.height;
      const pxToMm = pdfWidth / imgWidthPx;
      const imgHeightMm = imgHeightPx * pxToMm;

      if (imgHeightMm <= pdfHeight) {
        // Single page - fits on one page
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeightMm);
      } else {
        // Multi-page: slice by page height
        let remainingHeightPx = imgHeightPx;
        let positionPx = 0;
        const pageHeightPx = Math.floor(pdfHeight / pxToMm);

        while (remainingHeightPx > 0) {
          const canvasPage = document.createElement('canvas');
          canvasPage.width = imgWidthPx;
          canvasPage.height = Math.min(pageHeightPx, remainingHeightPx);

          const ctx = canvasPage.getContext('2d');
          if (ctx) {
            // Draw a portion of the big canvas onto this page canvas
            ctx.drawImage(
              canvas,
              0, positionPx,                 // source x, y
              imgWidthPx, canvasPage.height, // source w, h
              0, 0,                          // dest x, y
              imgWidthPx, canvasPage.height  // dest w, h
            );

            const pageData = canvasPage.toDataURL('image/jpeg', 1.0);
            const pageHeightMm = canvasPage.height * pxToMm;

            if (positionPx > 0) pdf.addPage();
            pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, pageHeightMm);

            positionPx += canvasPage.height;
            remainingHeightPx -= canvasPage.height;
          } else {
            break; // safety
          }
        }
      }

      // Save PDF file
      const filename = `Receipt_${payment.receiptNo || Date.now()}_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);

      // Restore original background
      receiptRef.current.style.backgroundColor = originalBg;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Error generating PDF. Please try using the Print button instead.');
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    if (month >= 5) {
      return `${year}-${(year + 1).toString().slice(2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(2)}`;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Print Receipt</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Paper Size</InputLabel>
            <Select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as typeof paperSize)}
              label="Paper Size"
            >
              <MenuItem value="A4">A4</MenuItem>
              <MenuItem value="A5">A5</MenuItem>
              <MenuItem value="Letter">Letter</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
          >
            Preview
          </Button>
        </Box>

        {/* Receipt Preview - Dual Copies */}
        {showPreview && (
          <Box
            ref={receiptRef}
            sx={{
              bgcolor: 'white',
              p: 2,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {/* Student Copy */}
            <ReceiptCopy 
              copyType="STUDENT COPY"
              payment={payment}
              student={student}
              logoDataUrl={logoDataUrl}
              formatDate={formatDate}
              getCurrentAcademicYear={getCurrentAcademicYear}
              numberToWords={numberToWords}
            />
            
            {/* Separator */}
            <Box sx={{ borderTop: '2px dashed #999', my: 3, mx: 2 }}>
              <Typography variant="caption" sx={{ bgcolor: 'white', px: 2, position: 'relative', top: -10, left: '50%', transform: 'translateX(-50%)', display: 'inline-block' }}>
                ✂ CUT HERE ✂
              </Typography>
            </Box>

            {/* Hostel Copy */}
            <ReceiptCopy 
              copyType="HOSTEL COPY"
              payment={payment}
              student={student}
              logoDataUrl={logoDataUrl}
              formatDate={formatDate}
              getCurrentAcademicYear={getCurrentAcademicYear}
              numberToWords={numberToWords}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="outlined"
          onClick={handleSavePDF}
          disabled={!showPreview}
        >
          Save as PDF
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={!showPreview}
        >
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptPrintDialog;
