import React from 'react';
import { Box, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { InstallmentReceipt, Student } from '../../database/db';
import { formatDateDDMonthYYYY } from '../../utils/dateUtils';

interface Props {
  receipts: InstallmentReceipt[];
  studentsById: Record<number, Student>;
  from?: Date;
  to?: Date;
}

const BillingStatementPrint: React.FC<Props> = ({ receipts, studentsById, from, to }) => {
  const total = receipts.reduce((s,r)=> s + r.paymentAmount,0);
  const hosteller = receipts.filter(r => {
    const st = studentsById[r.studentId!];
    return st && st.studentType === 'Hosteller';
  });
  const nonHosteller = receipts.filter(r => {
    const st = studentsById[r.studentId!];
    return st && st.studentType === 'Non-Hosteller';
  });
  return (
    <Box sx={{ width:'900px', p:3, fontFamily:'Segoe UI', bgcolor:'#fff' }}>
      <Typography variant="h5" align="center" fontWeight={700}>Billing Statement</Typography>
      <Typography variant="body2" align="center">{from && to ? `${formatDateDDMonthYYYY(from)} - ${formatDateDDMonthYYYY(to)}` : 'All Dates'}</Typography>
      <Divider sx={{ my:2 }} />
      <Typography variant="subtitle2">Summary</Typography>
      <Typography variant="body2">Total Receipts: {receipts.length}</Typography>
      <Typography variant="body2">Total Amount: ₹{total.toLocaleString()}</Typography>
      <Typography variant="body2">Hosteller Receipts: {hosteller.length}</Typography>
      <Typography variant="body2">Non-Hosteller Receipts: {nonHosteller.length}</Typography>
      <Divider sx={{ my:2 }} />
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Receipt #</TableCell>
            <TableCell>Student</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Amount (₹)</TableCell>
            <TableCell align="right">Pending After (₹)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {receipts.map(r => {
            const st = studentsById[r.studentId!];
            return (
              <TableRow key={r.id}>
                <TableCell>{formatDateDDMonthYYYY(r.paymentDate)}</TableCell>
                <TableCell>{r.receiptNumber}</TableCell>
                <TableCell>{st ? st.name : '—'}</TableCell>
                <TableCell>{st ? st.studentType : '—'}</TableCell>
                <TableCell align="right">{r.paymentAmount.toFixed(2)}</TableCell>
                <TableCell align="right">{r.pendingAmountAfter.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Divider sx={{ my:3 }} />
      <Typography variant="caption">Generated on {formatDateDDMonthYYYY(new Date())}</Typography>
    </Box>
  );
};

export default BillingStatementPrint;
