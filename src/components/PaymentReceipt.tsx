import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { Print as PrintIcon, Upload as UploadIcon, Image as ImageIcon } from '@mui/icons-material';
import type { Payment, Student } from '../database/db';

interface PaymentReceiptProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  student: Student;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ open, onClose, payment, student }) => {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Convert payment data to receipt format
  const [receiptData, setReceiptData] = useState({
    receiptNo: payment.receiptNo || '',
    date: new Date(payment.date).toLocaleDateString('en-IN'),
    studentName: student.name || '',
    class: `${student.collegeName || ''} ${student.yearOfCollege || ''}`,
    term: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    registrationFee: payment.registrationFee?.toString() || '',
    roomRent: payment.rentFee?.toString() || '',
    roomRentNote: student.residencyStatus === 'Temporary' ? 'Temp-06-Month' : 'Annual',
    waterElectricity: payment.waterFee?.toString() || '',
    gym: payment.gymFee?.toString() || '',
    others: payment.otherFee?.toString() || '',
    utr: payment.utrNo || '',
    total: payment.totalAmount?.toString() || '',
    amountInWords: convertToWords(payment.totalAmount || 0),
  });

  function convertToWords(amount: number): string {
    if (amount === 0) return 'Zero Only';
    
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertHundreds(num: number): string {
      let result = '';
      
      if (num >= 100) {
        result += units[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += units[num] + ' ';
      }
      
      return result;
    }
    
    if (amount >= 10000000) { // Crores
      const crores = Math.floor(amount / 10000000);
      const remainder = amount % 10000000;
      return convertHundreds(crores) + 'Crore ' + (remainder > 0 ? convertToWords(remainder) : 'Only');
    } else if (amount >= 100000) { // Lakhs
      const lakhs = Math.floor(amount / 100000);
      const remainder = amount % 100000;
      return convertHundreds(lakhs) + 'Lakh ' + (remainder > 0 ? convertToWords(remainder) : 'Only');
    } else if (amount >= 1000) { // Thousands
      const thousands = Math.floor(amount / 1000);
      const remainder = amount % 1000;
      return convertHundreds(thousands) + 'Thousand ' + (remainder > 0 ? convertToWords(remainder) : 'Only');
    } else {
      return convertHundreds(amount) + 'Only';
    }
  }

  const handleChange = (field: string, value: string) => {
    setReceiptData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate total
    if (['registrationFee', 'roomRent', 'waterElectricity', 'gym', 'others'].includes(field)) {
      setTimeout(() => {
        const total = 
          Number(field === 'registrationFee' ? value : receiptData.registrationFee || 0) +
          Number(field === 'roomRent' ? value : receiptData.roomRent || 0) +
          Number(field === 'waterElectricity' ? value : receiptData.waterElectricity || 0) +
          Number(field === 'gym' ? value : receiptData.gym || 0) +
          Number(field === 'others' ? value : receiptData.others || 0);
        
        setReceiptData(prev => ({ 
          ...prev, 
          total: total.toString(),
          amountInWords: convertToWords(total)
        }));
      }, 0);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = printRef.current?.innerHTML || '';
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body { 
                margin: 0; 
                font-family: Arial, sans-serif; 
                background: white;
              }
              .receipt-container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                padding: 20px;
                page-break-after: always;
              }
              .copy-label {
                text-align: right;
                font-weight: bold;
                font-size: 18px;
                margin-bottom: 10px;
                color: #333;
              }
              .student-copy { color: #0066cc; }
              .office-copy { color: #cc0000; }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 10px 0;
              }
              th, td { 
                padding: 8px; 
                text-align: left; 
                border: 1px solid #000;
              }
              .header-border { border-bottom: 4px solid #000; }
              .logo-container { 
                width: 80px; 
                height: 80px; 
                border: 2px solid #333; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
              }
              .logo-img { 
                width: 70px; 
                height: 70px; 
                border-radius: 50%; 
                object-fit: cover;
              }
              .center-text { text-align: center; }
              .right-text { text-align: right; }
              .bold { font-weight: bold; }
              .non-refundable { 
                background: #333; 
                color: white; 
                text-align: center; 
                padding: 8px; 
                margin: 10px 0;
              }
              .total-row { background-color: #f5f5f5; }
              input { 
                border: none; 
                background: transparent; 
                width: 100%; 
                font-family: inherit;
              }
              @media print {
                .print-hidden { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="copy-label student-copy">STUDENT COPY</div>
              ${printContent}
            </div>
            <div class="receipt-container">
              <div class="copy-label office-copy">OFFICE COPY</div>
              ${printContent}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Payment Receipt</Typography>
          <Box>
            <IconButton onClick={() => setIsEditing(!isEditing)} color="primary">
              <ImageIcon />
            </IconButton>
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isEditing && (
          <Box mb={2} p={2} bgcolor="grey.100" borderRadius={1}>
            <Typography variant="subtitle2" gutterBottom>Upload Hostel Logo:</Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              size="small"
            >
              Choose Logo File
            </Button>
            {logoUrl && (
              <Box mt={1}>
                <img src={logoUrl} alt="Logo Preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
              </Box>
            )}
          </Box>
        )}

        <div ref={printRef} style={{ backgroundColor: 'white', minHeight: '800px' }}>
          {/* Header */}
          <Box className="header-border" p={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box className="logo-container">
                {logoUrl ? (
                  <img src={logoUrl} alt="Hostel Logo" className="logo-img" />
                ) : (
                  <Typography variant="caption" className="center-text bold">
                    LOGO
                  </Typography>
                )}
              </Box>
              <Box flex={1} className="center-text" px={2}>
                <Typography variant="h5" className="bold">Dr. Rafiq Zakaria Campus</Typography>
                <Typography variant="body2" color="textSecondary">Maulana Azad Educational Trust's</Typography>
                <Typography variant="h6" className="bold">Maulana Azad Complex of Hostel</Typography>
                <Typography variant="caption" color="textSecondary">
                  Dr. Rafiq Zakaria Marg, Rauza Bagh, Aurangabad - 431 001 (M.S.)
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Receipt Details */}
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography className="bold">Receipt No.</Typography>
                <TextField
                  value={receiptData.receiptNo}
                  onChange={(e) => handleChange('receiptNo', e.target.value)}
                  variant="standard"
                  size="small"
                  disabled={!isEditing}
                  InputProps={{ disableUnderline: !isEditing }}
                />
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography className="bold">Date</Typography>
                <TextField
                  value={receiptData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  variant="standard"
                  size="small"
                  disabled={!isEditing}
                  InputProps={{ disableUnderline: !isEditing }}
                />
              </Box>
            </Box>

            <Box className="non-refundable">
              <Typography variant="h6" className="bold">NON-REFUNDABLE</Typography>
            </Box>

            <Typography variant="body2" mb={2}>Received the following Charges form</Typography>

            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography className="bold">Shri.</Typography>
                <TextField
                  value={receiptData.studentName}
                  onChange={(e) => handleChange('studentName', e.target.value)}
                  variant="standard"
                  fullWidth
                  disabled={!isEditing}
                  InputProps={{ disableUnderline: !isEditing }}
                />
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography className="bold">Class</Typography>
                  <TextField
                    value={receiptData.class}
                    onChange={(e) => handleChange('class', e.target.value)}
                    variant="standard"
                    size="small"
                    disabled={!isEditing}
                    InputProps={{ disableUnderline: !isEditing }}
                  />
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography className="bold">For First / Second term</Typography>
                  <TextField
                    value={receiptData.term}
                    onChange={(e) => handleChange('term', e.target.value)}
                    variant="standard"
                    size="small"
                    disabled={!isEditing}
                    InputProps={{ disableUnderline: !isEditing }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Charges Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="bold">Description</TableCell>
                    <TableCell align="right" className="bold" style={{ width: 160 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Registration Fee</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={receiptData.registrationFee}
                        onChange={(e) => handleChange('registrationFee', e.target.value)}
                        variant="standard"
                        disabled={!isEditing}
                        InputProps={{ disableUnderline: !isEditing }}
                        style={{ textAlign: 'right' }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>Room Rent</span>
                        <TextField
                          value={receiptData.roomRentNote}
                          onChange={(e) => handleChange('roomRentNote', e.target.value)}
                          variant="standard"
                          size="small"
                          placeholder="Note"
                          disabled={!isEditing}
                          InputProps={{ disableUnderline: !isEditing }}
                          style={{ fontSize: '0.8em' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={receiptData.roomRent}
                        onChange={(e) => handleChange('roomRent', e.target.value)}
                        variant="standard"
                        disabled={!isEditing}
                        InputProps={{ disableUnderline: !isEditing }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Water & Electricity</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={receiptData.waterElectricity}
                        onChange={(e) => handleChange('waterElectricity', e.target.value)}
                        variant="standard"
                        disabled={!isEditing}
                        InputProps={{ disableUnderline: !isEditing }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GYM</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={receiptData.gym}
                        onChange={(e) => handleChange('gym', e.target.value)}
                        variant="standard"
                        disabled={!isEditing}
                        InputProps={{ disableUnderline: !isEditing }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Others</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={receiptData.others}
                        onChange={(e) => handleChange('others', e.target.value)}
                        variant="standard"
                        disabled={!isEditing}
                        InputProps={{ disableUnderline: !isEditing }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="bold">Online Payment</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography className="bold" color="primary">UTR</Typography>
                        <TextField
                          value={receiptData.utr}
                          onChange={(e) => handleChange('utr', e.target.value)}
                          variant="standard"
                          disabled={!isEditing}
                          InputProps={{ disableUnderline: !isEditing }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow className="total-row">
                    <TableCell className="bold">Total</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={receiptData.total}
                        onChange={(e) => handleChange('total', e.target.value)}
                        variant="standard"
                        disabled={!isEditing}
                        InputProps={{ disableUnderline: !isEditing }}
                        className="bold"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography className="bold">Rs. (in words)</Typography>
                        <TextField
                          value={receiptData.amountInWords}
                          onChange={(e) => handleChange('amountInWords', e.target.value)}
                          variant="standard"
                          fullWidth
                          disabled={!isEditing}
                          InputProps={{ disableUnderline: !isEditing }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box borderTop={1} borderColor="grey.400" pt={1} display="flex" justifyContent="space-between" alignItems="end" mt={2}>
              <Typography variant="body2" fontStyle="italic">to be paid in first term only</Typography>
              <Box textAlign="right">
                <Typography className="bold" variant="h6">Cashier</Typography>
              </Box>
            </Box>
          </Box>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={() => setIsEditing(!isEditing)} variant="outlined">
          {isEditing ? 'Finish Editing' : 'Edit Receipt'}
        </Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentReceipt;