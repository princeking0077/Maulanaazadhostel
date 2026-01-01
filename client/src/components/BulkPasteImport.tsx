import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { db, Student, Payment } from '../database/db';

interface BulkPasteImportProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (imported: number) => void;
  inline?: boolean;
  title?: string;
}

interface ParsedStudent {
  srNo: string;
  name: string;
  mobile: string;
  address: string;
  wing: Student['wing'];
  roomNo: string;
  class: string;
  yearOfCollege: string;
  joiningDate: Date;
  endDate?: Date;
  receiptNo?: string;
  receiptDate?: Date;
  registrationFee: number;
  roomRent: number;
  waterElectric: number;
  otherActivity: number;
  totalFees: number;
  approvedFees: number;
  outstandingFee: number;
  remark: string;
  securityDeposit: number;
}

const BulkPasteImport: React.FC<BulkPasteImportProps> = ({ open = false, onClose, onSuccess, inline = false, title = 'Bulk Paste Import' }) => {
  const [pastedData, setPastedData] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{ success: boolean; message: string; imported: number; receipts: number; errors: string[] } | null>(null);
  const [withReceipts, setWithReceipts] = useState(true);

  const parseDate = (value: string): Date => {
    const v = value.trim();
    const parts = v.split(/[./-]/);
    if (parts.length === 3) {
      const [d, m, y] = parts.map(p => parseInt(p, 10));
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y < 100 ? 2000 + y : y, m - 1, d);
      }
    }
    const asNum = Date.parse(v);
    return isNaN(asNum) ? new Date() : new Date(asNum);
  };

  const parseWingRoom = (input: string): { wing: Student['wing']; roomNo: string } => {
    const parts = input.split('-');
    const wing = (parts[0] || 'A').trim().toUpperCase() as Student['wing'];
    if (parts.length > 1) {
      const roomPart = parts[1].trim();
      return { wing, roomNo: `${wing}${roomPart.padStart(3, '0')}` };
    }
    return { wing, roomNo: wing + '001' };
  };

  const extractYearOfCollege = (facultyDept: string): string => {
    const v = facultyDept.toUpperCase();
    if (/III/.test(v)) return '3rd Year';
    if (/II/.test(v) && !/III/.test(v)) return '2nd Year';
    if (/I/.test(v) && !/II/.test(v)) return '1st Year';
    if (/XII/.test(v)) return '12th Standard';
    if (/XI/.test(v)) return '11th Standard';
    return '1st Year';
  };

  const parseRow = (cells: string[]): ParsedStudent | null => {
    if (cells.length < 10) return null;

    const srNo = cells[0]?.trim() || '';
    if (!srNo || isNaN(Number(srNo))) return null;

    // Parse name, address, mobile from column 2
    const nameField = cells[1] || '';
    const parts = nameField.split(',').map(p => p.trim()).filter(Boolean);
    const name = parts[0] || '';
    const mobileNumbers = parts.filter(p => /^\d{10}$/.test(p));
    const mobile = mobileNumbers[0] || '';
    const addressParts = parts.slice(1).filter(p => !/^\d{10}$/.test(p));
    const address = addressParts.join(', ');

    // Wing & Room
    const { wing, roomNo } = parseWingRoom(cells[2] || 'A-01');

    // Class
    const classField = cells[3] || '';
    const yearOfCollege = extractYearOfCollege(classField);

    // Joining dates
    const joiningField = cells[4] || '';
    const dateParts = joiningField.split(/ to /i).map(p => p.trim()).filter(Boolean);
    const joiningDate = dateParts[0] ? parseDate(dateParts[0]) : new Date();
    const endDate = dateParts[1] ? parseDate(dateParts[1]) : undefined;

    // Receipt fields
    const receiptNo = cells[5]?.trim() || undefined;
    const receiptDate = cells[6] ? parseDate(cells[6]) : undefined;
    const registrationFee = Number(cells[7] || 0);
    const roomRent = Number(cells[8] || 0);
    const waterElectric = Number(cells[9] || 0);
    const otherActivity = Number(cells[10] || 0);
    const totalFees = Number(cells[11] || 0);
    const approvedFees = Number(cells[12] || 0);
    const outstandingFee = Number(cells[13] || 0);
    const remark = cells[14] || '';
    const securityDeposit = Number(cells[15] || 0);

    return {
      srNo,
      name,
      mobile,
      address,
      wing,
      roomNo,
      class: classField,
      yearOfCollege,
      joiningDate,
      endDate,
      receiptNo,
      receiptDate,
      registrationFee,
      roomRent,
      waterElectric,
      otherActivity,
      totalFees,
      approvedFees,
      outstandingFee,
      remark,
      securityDeposit,
    };
  };

  const handleImport = async () => {
    if (!pastedData.trim()) {
      setSummary({ success: false, message: 'No data pasted', imported: 0, receipts: 0, errors: ['Please paste data first'] });
      return;
    }

    setImporting(true);
    setSummary(null);
    const errors: string[] = [];
    let imported = 0;
    let receipts = 0;

    try {
      // Split by newlines and filter empty
      const lines = pastedData.split(/\r?\n/).filter(line => line.trim());
      
      // Check for existing duplicates
      const existing = await db.students.toArray();
      const duplicateSet = new Set(existing.map(s => (s.name + '|' + s.mobile).toLowerCase()));

      for (let i = 0; i < lines.length; i++) {
        try {
          setProgress(((i + 1) / lines.length) * 100);

          // Split by tab or multiple spaces (common in Excel copy-paste)
          const cells = lines[i].split(/\t/).map(c => c.trim());
          
          const parsed = parseRow(cells);
          if (!parsed) {
            // Try splitting by multiple spaces if tab didn't work
            const spaceCells = lines[i].split(/\s{2,}/).map(c => c.trim());
            const parsedSpace = parseRow(spaceCells);
            if (!parsedSpace) {
              errors.push(`Line ${i + 1}: Could not parse row`);
              continue;
            }
            Object.assign(parsed, parsedSpace);
          }

          // Check room exists
          const roomExists = await db.rooms.where('roomNumber').equals(parsed!.roomNo).count();
          if (!roomExists) {
            errors.push(`Line ${i + 1}: Room ${parsed!.roomNo} not found`);
            continue;
          }

          // Check duplicates
          const dupKey = (parsed!.name + '|' + parsed!.mobile).toLowerCase();
          if (duplicateSet.has(dupKey)) {
            errors.push(`Line ${i + 1}: Duplicate skipped - ${parsed!.name}`);
            continue;
          }

          // Determine status and residency
          const vacatedDate = parsed!.remark.toLowerCase().includes('vacated') ? new Date() : undefined;
          const status: Student['status'] = vacatedDate ? 'Vacated' : 'Active';
          const isTemporary = /\d+\s*month/i.test(parsed!.remark);

          const student: Student = {
            name: parsed!.name,
            mobile: parsed!.mobile,
            email: '',
            enrollmentNo: '',
            enrollmentNumber: '',
            faculty: parsed!.class,
            collegeName: '',
            yearOfCollege: parsed!.yearOfCollege,
            address: parsed!.address,
            residencyStatus: isTemporary ? 'Temporary' : 'Permanent',
            wing: parsed!.wing,
            roomNo: parsed!.roomNo,
            studentType: 'Hosteller',
            joiningDate: parsed!.joiningDate,
            annualFee: parsed!.approvedFees || parsed!.totalFees,
            admissionStatus: 'Active',
            securityDeposit: parsed!.securityDeposit,
            isOldStudent: /old student/i.test(parsed!.remark),
            status,
            vacatedDate,
            remarks: parsed!.remark,
            stayEndDate: parsed!.endDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const studentId = await db.students.add(student);
          imported++;
          duplicateSet.add(dupKey);

          // Create payment if receipt data exists
          if (withReceipts && parsed!.receiptNo) {
            const totalAmount = parsed!.registrationFee + parsed!.roomRent + parsed!.waterElectric + parsed!.otherActivity;
            
            let paymentMethod: Payment['paymentMethod'] = 'Cash';
            const remark = parsed!.remark.toLowerCase();
            if (remark.includes('upi') || remark.includes('online')) paymentMethod = 'Online';
            else if (remark.includes('cheque')) paymentMethod = 'Cheque';

            const payment: Payment = {
              studentId,
              receiptNo: parsed!.receiptNo,
              date: parsed!.receiptDate || parsed!.joiningDate,
              registrationFee: parsed!.registrationFee,
              rentFee: parsed!.roomRent,
              waterFee: parsed!.waterElectric,
              gymFee: 0,
              otherFee: parsed!.otherActivity,
              messVegFee: 0,
              messNonVegFee: 0,
              canteenFee: 0,
              xeroxFee: 0,
              totalAmount: totalAmount || parsed!.totalFees,
              balanceAmount: parsed!.outstandingFee,
              paymentStatus: parsed!.outstandingFee > 0 ? 'Pending' : 'Paid',
              utrNo: '',
              paymentMethod,
              cashier: 'System',
              createdAt: new Date(),
            };
            await db.payments.add(payment);
            receipts++;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors.push(`Line ${i + 1}: ${message}`);
        }
      }

      setSummary({
        success: errors.length === 0,
        message: `Imported ${imported} students, ${receipts} receipts` + (errors.length ? ` with ${errors.length} errors` : ''),
        imported,
        receipts,
        errors,
      });

      if (imported > 0 && onSuccess) {
        onSuccess(imported);
      }
    } catch (err) {
      setSummary({
        success: false,
        message: err instanceof Error ? err.message : 'Import failed',
        imported: 0,
        receipts: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setPastedData('');
      setSummary(null);
      if (onClose) onClose();
    }
  };
  
  const Content = (
      <>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Copy data from Excel (select cells and Ctrl+C), then paste here. Supports tab-separated values.
          <br />
          <strong>Expected columns:</strong> Sr.No, Name, Wing-Room, Class, Joining Date, Receipt No, Receipt Date, 
          Reg Fee, Room Rent, Water/Electric, Other, Total, Approved Fee, Outstanding, Remark, Security Deposit
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={12}
          placeholder="Paste your Excel data here (Ctrl+V)&#10;Example:&#10;1    John Doe, Address, 9999999999    A-01    BSc I Year    01.06.2025    R001    01.06.2025    5000    8000    500    1000    14500    14500    0    Active    2000"
          value={pastedData}
          onChange={(e) => setPastedData(e.target.value)}
          disabled={importing}
          sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}
        />

        <FormControlLabel
          control={<Switch checked={withReceipts} onChange={(e) => setWithReceipts(e.target.checked)} disabled={importing} />}
          label="Import Payment Records"
        />

        {importing && (
          <Box mt={2}>
            <Typography variant="body2" gutterBottom>
              Importing... {progress.toFixed(0)}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {summary && (
          <Box mt={2}>
            <Alert severity={summary.success ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {summary.message}
            </Alert>
            {summary.errors.length > 0 && (
              <Box>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Errors ({summary.errors.length})
                </Typography>
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {summary.errors.slice(0, 20).map((err, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={err} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
                {summary.errors.length > 20 && (
                  <Typography variant="caption" color="text.secondary">
                    Showing first 20 of {summary.errors.length} errors
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </>
  );

  if (inline) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        {Content}
        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <Button onClick={handleClose} disabled={importing}>
            Clear
          </Button>
          <Button
            variant="contained"
            startIcon={<ContentPasteIcon />}
            onClick={handleImport}
            disabled={importing || !pastedData.trim()}
          >
            Import Data
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {Content}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<ContentPasteIcon />}
          onClick={handleImport}
          disabled={importing || !pastedData.trim()}
        >
          Import Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkPasteImport;
