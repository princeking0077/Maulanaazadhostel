import { createNextAcademicYearRecords } from '../database/db';

export async function rolloverToNextAcademicYear() {
  return await createNextAcademicYearRecords();
}
