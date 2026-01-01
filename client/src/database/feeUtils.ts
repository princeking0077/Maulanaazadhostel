import { db } from './db';

export const updateStudentFeeAggregate = async (studentId: number, academicYear: string, paymentAmount: number, newAnnualFee?: number) => {
  const feeAggregate = await db.studentFees
    .where({ studentId, academicYear })
    .first();

  if (feeAggregate) {
    const totalFee = newAnnualFee ?? feeAggregate.totalFee;
    const newPaidAmount = feeAggregate.paidAmount + paymentAmount;
    const newPendingAmount = totalFee - newPaidAmount;
    const newStatus = newPendingAmount <= 0 ? 'Paid' : 'Partially Paid';

    await db.studentFees.update(feeAggregate.id!, {
      totalFee,
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      status: newStatus,
      lastPaymentDate: new Date(),
      updatedAt: new Date(),
    });
  } else {
    // If no aggregate exists, create a new one.
    // We'll need to get the total fee from the student record.
    const student = await db.students.get(studentId);
    if (student) {
      const totalFee = student.annualFee;
      const newPaidAmount = paymentAmount;
      const newPendingAmount = totalFee - newPaidAmount;
      const newStatus = newPendingAmount <= 0 ? 'Paid' : 'Partially Paid';

      await db.studentFees.add({
        studentId,
        academicYear,
        totalFee,
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newStatus,
        lastPaymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
};
