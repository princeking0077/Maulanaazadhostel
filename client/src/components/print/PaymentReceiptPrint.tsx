import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { formatDateDDMonthYYYY } from '../../utils/dateUtils';
import { InstallmentReceipt, Student } from '../../database/db';

interface Props {
  receipt: InstallmentReceipt;
  student?: Student;
}

const PaymentReceiptPrint: React.FC<Props> = ({ receipt, student }) => {
  return (
    <Box sx={{ width: '700px', p: 3, fontFamily: 'Segoe UI', bgcolor: '#fff' }}>
      <Typography variant="h5" align="center" fontWeight={700}>Payment Receipt</Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2">Receipt Number: <strong>{receipt.receiptNumber}</strong></Typography>
      <Typography variant="body2">Date: {formatDateDDMonthYYYY(receipt.paymentDate)}</Typography>
      {student && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Student Information</Typography>
          <Typography variant="body2">Name: {student.name}</Typography>
          <Typography variant="body2">Enrollment: {student.enrollmentNo}</Typography>
          <Typography variant="body2">Category: {student.studentType}</Typography>
        </Box>
      )}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">Installment</Typography>
        <Typography variant="body2">Installment #: {receipt.installmentNumber}</Typography>
        <Typography variant="body2">Amount Paid: ₹{receipt.paymentAmount.toFixed(2)}</Typography>
        <Typography variant="body2">Total Fee: ₹{receipt.totalFeeSnapshot.toFixed(2)}</Typography>
        <Typography variant="body2">Paid To Date: ₹{receipt.paidAmountToDate.toFixed(2)}</Typography>
        <Typography variant="body2">Pending: ₹{receipt.pendingAmountAfter.toFixed(2)}</Typography>
        <Typography variant="body2">Mode: {receipt.paymentMode}</Typography>
      </Box>
      {receipt.notes && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Notes</Typography>
          <Typography variant="caption">{receipt.notes}</Typography>
        </Box>
      )}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display:'flex', justifyContent:'space-between', mt: 4 }}>
        <Typography variant="caption">Authorized Signature</Typography>
        <Typography variant="caption">System Generated</Typography>
      </Box>
    </Box>
  );
};

export default PaymentReceiptPrint;
