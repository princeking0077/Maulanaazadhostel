/**
 * Sample Data Loader for 2025-26 Academic Year
 * Based on actual hostel register format
 * 
 * This file provides a function to load sample student and payment data
 * that matches the real hostel register Excel format
 */

import { db } from './db';
import type { Student, Payment } from './db';

export interface HostelRegisterRow {
  srNo: number;
  studentNameMobile: string;
  wingRoom: string;
  class: string;
  dateOfJoining: string;
  receiptNo: string;
  receiptDate: string;
  regFee: number;
  roomRent: number;
  waterElectricity: number;
  otherActivity: number;
  totalFeesCollection: number;
  approvedHostelFees: number;
  outstandingFee: number;
  remark: string;
  securityDeposit: number;
}

/**
 * Sample data for 2025-26 academic year
 * No sample data - use Excel import feature to load real data
 */
const sample2025_26Data: HostelRegisterRow[] = [];

/**
 * Parse student name and mobile from combined field
 */
function parseNameMobile(combined: string): { name: string; mobile: string } {
  const mobileMatch = combined.match(/\d{10}/);
  const mobile = mobileMatch ? mobileMatch[0] : '';
  const name = combined.replace(/\d{10}/, '').trim();
  return { name, mobile };
}

/**
 * Parse wing and room from combined field
 */
function parseWingRoom(combined: string): { wing: 'A' | 'B' | 'C' | 'D'; roomNo: string } {
  const match = combined.match(/([ABCD])-?(\d+)/i);
  if (match) {
    const wing = match[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    const roomNo = match[2];
    return { wing, roomNo };
  }
  return { wing: 'A', roomNo: '101' };
}

/**
 * Load sample data into the database
 */
export async function loadSample2025_26Data(): Promise<{ students: number; payments: number }> {
  let studentsCreated = 0;
  let paymentsCreated = 0;

  try {
    await db.transaction('rw', [db.students, db.payments], async () => {
      for (const row of sample2025_26Data) {
        const { name, mobile } = parseNameMobile(row.studentNameMobile);
        const { wing, roomNo } = parseWingRoom(row.wingRoom);

        // Check if student already exists
        const existing = await db.students
          .where('mobile')
          .equals(mobile)
          .or('enrollmentNo')
          .equals(row.srNo.toString())
          .first();

        let studentId: number;

        if (existing) {
          studentId = existing.id!;
        } else {
          // Create new student
          const student: Omit<Student, 'id'> = {
            name,
            mobile,
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@student.example.com`,
            enrollmentNo: row.srNo.toString(),
            faculty: '',
            collegeName: row.class,
            yearOfCollege: row.class.includes('1st') ? '1st Year' : 
                          row.class.includes('2nd') ? '2nd Year' :
                          row.class.includes('3rd') ? '3rd Year' : '1st Year',
            address: '',
            residencyStatus: 'Permanent',
            wing,
            roomNo,
            studentType: 'Hosteller',
            joiningDate: new Date(row.dateOfJoining),
            annualFee: row.approvedHostelFees,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          studentId = await db.students.add(student);
          studentsCreated++;
        }

        // Create payment record
        if (row.totalFeesCollection > 0) {
          const payment: Omit<Payment, 'id'> = {
            studentId,
            receiptNo: row.receiptNo,
            date: new Date(row.receiptDate),
            registrationFee: row.regFee,
            rentFee: row.roomRent,
            waterFee: row.waterElectricity,
            gymFee: 0,
            otherFee: row.otherActivity,
            totalAmount: row.totalFeesCollection,
            balanceAmount: row.outstandingFee,
            paymentStatus: row.outstandingFee > 0 ? 'Partial' : 'Paid',
            utrNo: '',
            paymentMethod: 'Cash',
            cashier: 'Admin',
            createdAt: new Date(),
          };

          await db.payments.add(payment);
          paymentsCreated++;
        }
      }
    });

    return { students: studentsCreated, payments: paymentsCreated };
  } catch (error) {
    console.error('Error loading sample data:', error);
    throw error;
  }
}

/**
 * Check if sample data is already loaded
 */
export async function isSampleDataLoaded(): Promise<boolean> {
  const count = await db.students.where('enrollmentNo').anyOf(['1', '2', '3']).count();
  return count > 0;
}

/**
 * Clear all sample data
 */
export async function clearSampleData(): Promise<void> {
  await db.transaction('rw', [db.students, db.payments], async () => {
    const sampleStudents = await db.students.where('enrollmentNo').anyOf(['1', '2', '3']).toArray();
    const studentIds = sampleStudents.map(s => s.id!);
    
    // Delete payments for sample students
    await db.payments.where('studentId').anyOf(studentIds).delete();
    
    // Delete sample students
    await db.students.bulkDelete(studentIds);
  });
}
