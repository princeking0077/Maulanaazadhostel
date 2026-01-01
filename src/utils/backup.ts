import { db } from '../database/db';





export async function getCounts() {
  return {
    students: await db.students.count(),
    studentFees: await db.studentFees.count(),
    installments: await db.installmentReceipts.count(),
    pendingPayments: await db.pendingPayments.count(),
    history: await db.studentHistory.count(),
    yearRecords: await db.studentYearRecords.count(),
    rooms: await db.rooms.count(),
    facilityTxns: await db.facilityTransactions.count(),
    pettyCash: await db.pettyCash.count(),
    receiptRegister: await db.receiptRegister.count(),
    settings: await db.settings.count(),
    users: await db.users.count(),
    payments: await db.payments.count(),
  };
}