import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { Student } from '../../database/db';
import { formatDateDDMonthYYYY, calculateAcademicPeriodEnd } from '../../utils/dateUtils';

interface Props { student: Student; annualFee?: number; }

const StudentRegistrationPrint: React.FC<Props> = ({ student, annualFee }) => {
  const endDate = calculateAcademicPeriodEnd(student.joiningDate || new Date());
  return (
    <Box sx={{ width: '700px', p: 3, fontFamily: 'Segoe UI', bgcolor: '#fff' }}>
      <Typography variant="h5" align="center" fontWeight={700}>Student Registration Form</Typography>
      <Divider sx={{ my:2 }} />
      <Typography variant="subtitle2">Personal Details</Typography>
      <Typography variant="body2">Name: {student.name}</Typography>
      <Typography variant="body2">Enrollment: {student.enrollmentNo}</Typography>
      <Typography variant="body2">Mobile: {student.mobile}</Typography>
      <Typography variant="body2">Email: {student.email}</Typography>
      <Typography variant="body2">College: {student.collegeName}</Typography>
      <Typography variant="body2">Faculty: {student.faculty}</Typography>
      <Typography variant="body2">Year Of College: {student.yearOfCollege}</Typography>
      <Divider sx={{ my:2 }} />
      <Typography variant="subtitle2">Hostel Details</Typography>
      <Typography variant="body2">Wing: {student.wing}</Typography>
      <Typography variant="body2">Room No: {student.roomNo}</Typography>
      <Typography variant="body2">Joining Date: {formatDateDDMonthYYYY(student.joiningDate)}</Typography>
      <Typography variant="body2">Academic Period End: {formatDateDDMonthYYYY(endDate)}</Typography>
      <Divider sx={{ my:2 }} />
      <Typography variant="subtitle2">Fee Structure</Typography>
      <Typography variant="body2">Annual Fee: ₹{(annualFee ?? student.annualFee).toLocaleString()}</Typography>
      <Typography variant="body2">Security Deposit: ₹{(student.securityDeposit ?? 0).toLocaleString()}</Typography>
      {student.customAmount && <Typography variant="body2">Custom Amount: ₹{student.customAmount.toLocaleString()}</Typography>}
      <Divider sx={{ my:2 }} />
      <Typography variant="caption">Generated on {formatDateDDMonthYYYY(new Date())}</Typography>
      <Box sx={{ display:'flex', justifyContent:'space-between', mt:4 }}>
        <Typography variant="caption">Student Signature</Typography>
        <Typography variant="caption">Authorized Signature</Typography>
      </Box>
    </Box>
  );
};

export default StudentRegistrationPrint;
