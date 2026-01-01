import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { db, type Student, type Payment } from '../database/db';

interface ExcelImportProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedStudent {
  student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;
  payment: Omit<Payment, 'id' | 'studentId' | 'createdAt'>;
}

interface ImportResult {
  success: boolean;
  studentsImported: number;
  paymentsImported: number;
  errors: string[];
}

const ExcelImport: React.FC<ExcelImportProps> = ({ open, onClose, onImportComplete }) => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [clearExisting, setClearExisting] = useState(false);

  const parseExcelRow = (row: Record<string, unknown>, index: number): ParsedStudent | null => {
    try {
      // Extract name and mobile from combined field (e.g., "John Doe 9876543210")
      const nameAndMobile = String(row['Name'] || row['Student Name'] || '');
      const mobileMatch = nameAndMobile.match(/(\d{10})$/);
      const mobile = mobileMatch ? mobileMatch[1] : '';
      const name = nameAndMobile.replace(/\s*\d{10}$/, '').trim();

      if (!name) {
        throw new Error('Name is required');
      }

      // Extract wing and room from combined field (e.g., "A-12")
      const wingRoom = String(row['Wing-Room'] || row['Wing Room'] || '');
      const wingRoomMatch = wingRoom.match(/^([A-Z])-(\d+)$/);
      const wing = wingRoomMatch ? wingRoomMatch[1] : '';
      const roomNo = wingRoomMatch ? wingRoomMatch[2] : '';

      // Parse dates
      const joiningDate = row['Date of Joining'] ? new Date(row['Date of Joining'] as string | number) : new Date();
      const receiptDate = row['Receipt Date'] ? new Date(row['Receipt Date'] as string | number) : new Date();

      // Parse faculty/class
      const faculty = String(row['Class'] || row['Faculty'] || '');

      // Create student object
      const studentTypeVal = String(row['Student Type'] || row['Type'] || '').trim();
      const studentType = (studentTypeVal === 'PhD' || studentTypeVal === 'Non-Hosteller') ? (studentTypeVal as 'PhD' | 'Non-Hosteller') : 'Hosteller';

      const student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        mobile,
        email: '',
        enrollmentNo: '',
        faculty,
        collegeName: 'Dr. Rafiq Zakaria Campus',
        yearOfCollege: '',
        address: '',
        residencyStatus: 'Permanent' as const,
        wing: (wing || 'A') as 'A' | 'B' | 'C' | 'D',
        roomNo,
        studentType: studentType,
        joiningDate,
        annualFee: parseFloat(String(row['Approved Hostel Fees'] || '0')),
      };

      // Create payment object
      const payment: Omit<Payment, 'id' | 'studentId' | 'createdAt'> = {
        receiptNo: String(row['Receipt No.'] || ''),
        date: receiptDate,
        registrationFee: parseFloat(String(row['Reg. Fee'] || '0')),
        rentFee: parseFloat(String(row['Room Rent'] || '0')),
        waterFee: parseFloat(String(row['Water & Electricity'] || '0')),
        gymFee: 0,
        otherFee: parseFloat(String(row['Other Activity'] || '0')),
        totalAmount: parseFloat(String(row['Total Fees Collection'] || '0')),
        balanceAmount: parseFloat(String(row['Outstanding Fee'] || '0')),
        paymentStatus: parseFloat(String(row['Outstanding Fee'] || '0')) > 0 ? 'Partial' : 'Paid',
        utrNo: '',
        paymentMethod: 'Cash',
        cashier: 'Admin',
      };

      return { student, payment };
    } catch (error) {
      console.error(`Error parsing row ${index + 1}:`, error);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const errors: string[] = [];
      const parsedData: ParsedStudent[] = [];

      // Parse each row
      jsonData.forEach((row, index) => {
        const parsed = parseExcelRow(row as Record<string, unknown>, index);
        if (parsed) {
          parsedData.push(parsed);
        } else {
          errors.push(`Row ${index + 1}: Failed to parse`);
        }
      });

      if (parsedData.length === 0) {
        throw new Error('No valid data found in Excel file');
      }

      // Clear existing data if requested
      if (clearExisting) {
        await db.payments.clear();
        await db.students.clear();
      }

      // Import data to database
      let studentsImported = 0;
      let paymentsImported = 0;

      for (const { student, payment } of parsedData) {
        try {
          // Add student
          const studentId = await db.students.add({
            ...student,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Student);

          studentsImported++;

          // Add payment with student ID
          await db.payments.add({
            ...payment,
            studentId: studentId as number,
            createdAt: new Date(),
          } as Payment);

          paymentsImported++;
        } catch (error) {
          errors.push(`Failed to import: ${student.name} - ${(error as Error).message}`);
        }
      }

      setResult({
        success: true,
        studentsImported,
        paymentsImported,
        errors,
      });

      // Call onImportComplete after successful import
      if (studentsImported > 0) {
        setTimeout(() => {
          onImportComplete();
        }, 1500);
      }
    } catch (error) {
      setResult({
        success: false,
        studentsImported: 0,
        paymentsImported: 0,
        errors: [(error as Error).message],
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClose = () => {
    if (!importing) {
      setResult(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Students from Excel</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {!result && !importing && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                Upload an Excel file (.xlsx) with student data. The file should have columns:
                Name, Wing-Room, Class, Date of Joining, Receipt No., Receipt Date, Reg. Fee,
                Room Rent, Water & Electricity, Other Activity, Total Fees Collection,
                Approved Hostel Fees, Outstanding Fee.
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                  />
                }
                label="Clear existing data before import (Warning: This will delete all current students and payments)"
                sx={{ mb: 3 }}
              />

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="large"
                >
                  Choose Excel File
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </Button>
              </Box>
            </>
          )}

          {importing && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Importing data...
              </Typography>
              <LinearProgress sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Please wait while we process your Excel file
              </Typography>
            </Box>
          )}

          {result && (
            <Box>
              {result.success ? (
                <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 2 }}>
                  Import completed successfully!
                </Alert>
              ) : (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                  Import failed. Please check the errors below.
                </Alert>
              )}

              <Box sx={{ my: 2 }}>
                <Typography variant="body1">
                  <strong>Students imported:</strong> {result.studentsImported}
                </Typography>
                <Typography variant="body1">
                  <strong>Payments imported:</strong> {result.paymentsImported}
                </Typography>
              </Box>

              {result.errors.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="error" sx={{ mt: 2, mb: 1 }}>
                    Errors ({result.errors.length}):
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper' }}>
                    {result.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          {result ? 'Close' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcelImport;
