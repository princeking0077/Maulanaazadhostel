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
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Print as PrintIcon,
  Visibility as PreviewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { FacilityTransaction } from '../database/db';
import defaultLogo from '../assets/maulana-azad-logo.png';

interface AdminBillingPrintDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: FacilityTransaction;
}

const AdminBillingPrintDialog: React.FC<AdminBillingPrintDialogProps> = ({
  open,
  onClose,
  transaction,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | 'Letter'>('A4');
  const [showPreview, setShowPreview] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const receiptRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const convertLogoToDataUrl = async () => {
      const uploadedLogo = localStorage.getItem('uploadedLogo');
      if (uploadedLogo) {
        setLogoDataUrl(uploadedLogo);
      } else {
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
          <title>Invoice ${transaction.billNo || transaction.receiptNo}</title>
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
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handleSavePDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const originalBg = receiptRef.current.style.backgroundColor;
      receiptRef.current.style.backgroundColor = 'white';

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfFormat = paperSize === 'Letter' ? 'letter' : paperSize.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = new jsPDF('p', 'mm', pdfFormat as any);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidthPx = imgProps.width;
      const imgHeightPx = imgProps.height;
      const pxToMm = pdfWidth / imgWidthPx;
      const imgHeightMm = imgHeightPx * pxToMm;

      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeightMm);
      } else {
        let remainingHeightPx = imgHeightPx;
        let positionPx = 0;
        const pageHeightPx = Math.floor(pdfHeight / pxToMm);

        while (remainingHeightPx > 0) {
          const canvasPage = document.createElement('canvas');
          canvasPage.width = imgWidthPx;
          canvasPage.height = Math.min(pageHeightPx, remainingHeightPx);

          const ctx = canvasPage.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, positionPx,
              imgWidthPx, canvasPage.height,
              0, 0,
              imgWidthPx, canvasPage.height
            );

            const pageData = canvasPage.toDataURL('image/jpeg', 1.0);
            const pageHeightMm = canvasPage.height * pxToMm;

            if (positionPx > 0) pdf.addPage();
            pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, pageHeightMm);

            positionPx += canvasPage.height;
            remainingHeightPx -= canvasPage.height;
          } else {
            break;
          }
        }
      }

      const filename = `Invoice_${transaction.billNo || transaction.receiptNo || Date.now()}_${transaction.partyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Print Invoice</DialogTitle>
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

        {/* Receipt Preview */}
        {showPreview && (
          <Box
            ref={receiptRef}
            sx={{
              bgcolor: 'white',
              p: 4,
              border: '1px solid #ccc',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <Box sx={{ border: '2px solid black', p: 3 }}>
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

              {/* Receipt/Bill Number and Date */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid black', pt: 1, mb: 2 }}>
                <Box>
                  <div>
                    <strong>Receipt No.</strong>
                    <span style={{ marginLeft: 12, color: '#dc2626', fontWeight: 'bold', fontSize: '1.15rem' }}>
                      {transaction.receiptNo || '-'}
                    </span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <strong>Bill No.</strong>
                    <span style={{ marginLeft: 12, fontWeight: 'bold', fontSize: '1rem' }}>
                      {transaction.billNo || '-'}
                    </span>
                  </div>
                </Box>
                <Box>
                  <strong>Date</strong>
                  <span style={{ marginLeft: 16, borderBottom: '1px solid black', display: 'inline-block', width: 128 }}>
                    {formatDate(transaction.date)}
                  </span>
                </Box>
              </Box>

              {/* Transaction Type */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  PAYMENT RECEIPT
                </Typography>
                <Typography variant="body2">
                  {transaction.txnType === 'Income' ? 'Received payment from' : 'Payment to'}
                </Typography>
              </Box>

              {/* Vendor/Party Name */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  Name: <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: 300, paddingLeft: 8 }}>
                    {transaction.partyName}
                  </span>
                </Typography>
              </Box>

              {/* Facility */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Facility:</strong> {transaction.facility}
                </Typography>
              </Box>

              {/* Charges Table */}
              <Table sx={{ border: '1px solid black', mb: 2 }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ border: '1px solid black', fontWeight: 'bold', bgcolor: 'grey.100' }}>
                      Particulars
                    </TableCell>
                    <TableCell sx={{ border: '1px solid black', fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'right' }}>
                      Amount (₹)
                    </TableCell>
                  </TableRow>

                  {transaction.items && transaction.items.length > 0 ? (
                    transaction.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ border: '1px solid black' }}>
                          {item.description}
                          {item.qty && item.rate && ` (${item.qty} × ₹${item.rate})`}
                        </TableCell>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'right' }}>
                          {item.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell sx={{ border: '1px solid black' }}>
                        {transaction.description || `${transaction.facility} Charges`}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid black', textAlign: 'right' }}>
                        {transaction.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}

                  {transaction.gstPercent && transaction.gstPercent > 0 && (
                    <>
                      <TableRow>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'right' }}>
                          <strong>Subtotal:</strong>
                        </TableCell>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'right' }}>
                          {(transaction.subtotal || transaction.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'right' }}>
                          <strong>GST ({transaction.gstPercent}%):</strong>
                        </TableCell>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'right' }}>
                          {(transaction.gstAmount || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  <TableRow>
                    <TableCell sx={{ border: '1px solid black', fontWeight: 'bold', bgcolor: 'grey.100' }}>
                      <strong>Total Amount:</strong>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid black', fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'right', fontSize: '1.1rem' }}>
                      ₹{(transaction.netAmount || transaction.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Amount in Words */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Amount in Words:</strong>{' '}
                  <span style={{ borderBottom: '1px solid black', display: 'inline-block', minWidth: 400, paddingLeft: 8 }}>
                    {numberToWords(Math.floor(transaction.netAmount || transaction.amount))} Rupees Only
                  </span>
                </Typography>
              </Box>

              {/* Payment Details */}
              {transaction.paymentMethod && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Payment Method:</strong> {transaction.paymentMethod}
                    {transaction.paymentRef && ` | Reference: ${transaction.paymentRef}`}
                  </Typography>
                </Box>
              )}

              {/* Notes */}
              {transaction.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Notes:</strong> {transaction.description}
                  </Typography>
                </Box>
              )}

              {/* Signature */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2 }}>
                <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                  <Box sx={{ borderTop: '1px solid black', pt: 1, mt: 8 }}>
                    <Typography variant="body2">Received By</Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                  <Box sx={{ borderTop: '1px solid black', pt: 1, mt: 8 }}>
                    <Typography variant="body2">Authorized Signatory</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Footer */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #666', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  This is a computer-generated document. No signature required.
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={handleSavePDF}
          disabled={!showPreview}
        >
          Save PDF
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={!showPreview}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminBillingPrintDialog;
