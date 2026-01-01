import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

interface ImportData {
  srNo: string;
  studentName: string;
  mobile: string;
  wing: string;
  room: string;
  class: string;
  dateOfJoining: string;
  receiptNo: string;
  receiptDate: string;
  regFee: number;
  roomRent: number;
  waterElectricityCharges: number;
  otherActivity: number;
  totalFeesCollection: number;
  approvedHostelFees: number;
  outstandingFee: number;
  remark: string;
  securityDeposit: number;
}

interface DataImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: ImportedRecord[]) => void;
}

interface ImportedRecord {
  student: {
    name: string;
    enrollmentNo: string;
    mobile: string;
    wing: string;
    roomNo: string;
    collegeName: string;
    dateOfJoining: string;
    residencyStatus: string;
    address: string;
    yearOfCollege: string;
    fatherName: string;
    course: string;
  };
  payment: {
    receiptNo: string;
    date: string;
    registrationFee: number;
    rentFee: number;
    waterFee: number;
    gymFee: number;
    otherFee: number;
    totalAmount: number;
    amountPaid: number;
    balanceAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    remarks: string;
    securityDeposit: number;
  };
}

const SimpleDataImportDialog: React.FC<DataImportDialogProps> = ({
  open,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

          // Map Excel columns to ImportData format
          const processedData: ImportData[] = jsonData.map((row, index) => {
            // Helper to safely convert values
            const getStr = (key: string) => (row[key] || '').toString().trim();
            const getNum = (key: string) => {
              const val = row[key];
              if (typeof val === 'number') return val;
              const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
              return isNaN(parsed) ? 0 : parsed;
            };

            return {
              srNo: getStr('Sr.No') || getStr('Sr No') || getStr('S.No') || (index + 1).toString(),
              studentName: getStr('Student Name & Mobile') || getStr('Student Name') || getStr('Name'),
              mobile: getStr('Mobile') || getStr('Student Name & Mobile').match(/\d{10}/)?.[0] || '',
              wing: (getStr('Wing & Room') || getStr('Wing')).charAt(0).toUpperCase() || 'A',
              room: (getStr('Wing & Room') || getStr('Room')).replace(/[^0-9]/g, '') || getStr('Room No') || '',
              class: getStr('Class') || getStr('Course') || '',
              dateOfJoining: getStr('Date of Joining') || getStr('Joining Date') || new Date().toISOString().split('T')[0],
              receiptNo: getStr('Receipt No') || getStr('Receipt No.') || '',
              receiptDate: getStr('Receipt Date') || getStr('Date') || new Date().toISOString().split('T')[0],
              regFee: getNum('Reg.Fee') || getNum('Registration Fee') || 0,
              roomRent: getNum('Room Rent') || 0,
              waterElectricityCharges: getNum('Water & Electricity Charges') || getNum('Water Charges') || 0,
              otherActivity: getNum('Other Activity') || getNum('Other') || 0,
              totalFeesCollection: getNum('Total Fees Collection') || getNum('Total') || 0,
              approvedHostelFees: getNum('Approved Hostel Fees') || 0,
              outstandingFee: getNum('Outstanding Fee') || getNum('Outstanding') || 0,
              remark: getStr('Remark') || getStr('Remarks') || '',
              securityDeposit: getNum('Security Deposit') || 0,
            };
          });

          setImportData(processedData);
          setPreviewMode(true);
          setLoading(false);
        } catch (err) {
          setError('Error parsing file: ' + (err as Error).message);
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file');
        setLoading(false);
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      setError('Error processing file: ' + (err as Error).message);
      setLoading(false);
    }
  };

  const handleImport = () => {
    const transformedData: ImportedRecord[] = importData.map(item => ({
      student: {
        name: item.studentName,
        enrollmentNo: item.srNo,
        mobile: item.mobile,
        wing: item.wing,
        roomNo: item.room,
        collegeName: item.class,
        dateOfJoining: item.dateOfJoining,
        residencyStatus: 'Permanent',
        address: '',
        yearOfCollege: '',
        fatherName: '',
        course: item.class,
      },
      payment: {
        receiptNo: item.receiptNo,
        date: item.receiptDate || new Date().toISOString().split('T')[0],
        registrationFee: item.regFee,
        rentFee: item.roomRent,
        waterFee: item.waterElectricityCharges,
        gymFee: 0,
        otherFee: item.otherActivity,
        totalAmount: item.totalFeesCollection,
        amountPaid: item.totalFeesCollection - item.outstandingFee,
        balanceAmount: item.outstandingFee,
        paymentMethod: 'Cash',
        paymentStatus: item.outstandingFee > 0 ? 'Partial' : 'Paid',
        remarks: item.remark,
        securityDeposit: item.securityDeposit,
      }
    }));

    onImport(transformedData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setImportData([]);
    setPreviewMode(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Import Hostel Register Data
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {!previewMode ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Upload Excel/CSV file with hostel register data. Supported format: 
              Sr.No, Student Name & Mobile, Wing & Room, Class, Date of Joining, Receipt No, Receipt Date, 
              Reg.Fee, Room Rent, Water & Electricity Charges, Other Activity, Total Fees Collection, 
              Approved Hostel Fees, Outstanding Fee, Remark, Security Deposit
            </Alert>

            <Box sx={{ 
              border: '2px dashed #ccc', 
              borderRadius: 2, 
              p: 4, 
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' }
            }}>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drop your Excel/CSV file here or click to browse
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Supports .xlsx, .xls, .csv files
                </Typography>
              </label>
            </Box>

            {file && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Selected file: {file.name}
                </Typography>
              </Box>
            )}

            {loading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Processing file...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Import Preview ({importData.length} records found)
              </Typography>
              <Chip 
                icon={<SuccessIcon />} 
                label={`${importData.length} Records Ready`} 
                color="success" 
              />
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Sr.No</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Wing-Room</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Receipt No</TableCell>
                    <TableCell>Reg.Fee</TableCell>
                    <TableCell>Room Rent</TableCell>
                    <TableCell>Total Fees</TableCell>
                    <TableCell>Outstanding</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importData.slice(0, 50).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.srNo}</TableCell>
                      <TableCell>{row.studentName}</TableCell>
                      <TableCell>{row.mobile}</TableCell>
                      <TableCell>{row.wing}-{row.room}</TableCell>
                      <TableCell>{row.class}</TableCell>
                      <TableCell>{row.receiptNo}</TableCell>
                      <TableCell>₹{row.regFee.toLocaleString()}</TableCell>
                      <TableCell>₹{row.roomRent.toLocaleString()}</TableCell>
                      <TableCell>₹{row.totalFeesCollection.toLocaleString()}</TableCell>
                      <TableCell>₹{row.outstandingFee.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {importData.length > 50 && (
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Showing first 50 records. Total: {importData.length} records will be imported.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {previewMode && (
          <>
            <Button onClick={() => setPreviewMode(false)}>Back</Button>
            <Button 
              variant="contained" 
              onClick={handleImport}
              disabled={importData.length === 0}
            >
              Import {importData.length} Records
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SimpleDataImportDialog;