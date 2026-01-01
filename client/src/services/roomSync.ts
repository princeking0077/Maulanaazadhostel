import { db } from '../database/db';

/**
 * Recalculate and update room occupancy based on active students
 * Call this after student status changes (cancelled, vacated, room change)
 */
export async function syncRoomOccupancy(roomNumber?: string, wing?: 'A' | 'B' | 'C' | 'D') {
  try {
    // Get all active students (not cancelled or vacated)
    const activeStudents = await db.students
      .where('admissionStatus')
      .notEqual('Cancelled')
      .and(s => s.status !== 'Vacated')
      .toArray();

    // Get rooms to update
    const rooms = roomNumber && wing
      ? await db.rooms.where({ roomNumber, wing }).toArray()
      : await db.rooms.toArray();

    for (const room of rooms) {
      const occupants = activeStudents.filter(
        s => s.roomNo === room.roomNumber && s.wing === room.wing
      );
      const newOccupancy = occupants.length;

      if (room.currentOccupancy !== newOccupancy) {
        await db.rooms.update(room.id!, { currentOccupancy: newOccupancy });
      }
    }

    return { success: true, updated: rooms.length };
  } catch (error) {
    console.error('Error syncing room occupancy:', error);
    return { success: false, error };
  }
}

/**
 * Mark student as vacated and sync room occupancy
 */
export async function vacateStudent(studentId: number, vacatedDate?: Date) {
  try {
    const student = await db.students.get(studentId);
    if (!student) throw new Error('Student not found');

    await db.students.update(studentId, {
      status: 'Vacated',
      vacatedDate: vacatedDate || new Date(),
      updatedAt: new Date()
    });

    // Sync room occupancy
    await syncRoomOccupancy(student.roomNo, student.wing);

    return { success: true };
  } catch (error) {
    console.error('Error vacating student:', error);
    return { success: false, error };
  }
}

/**
 * Cancel student admission and sync room occupancy
 */
export async function cancelAdmission(studentId: number) {
  try {
    const student = await db.students.get(studentId);
    if (!student) throw new Error('Student not found');

    await db.students.update(studentId, {
      admissionStatus: 'Cancelled',
      status: 'Inactive',
      updatedAt: new Date()
    });

    // Sync room occupancy
    await syncRoomOccupancy(student.roomNo, student.wing);

    return { success: true };
  } catch (error) {
    console.error('Error cancelling admission:', error);
    return { success: false, error };
  }
}

/**
 * Change student room and sync occupancy for both old and new rooms
 */
export async function changeStudentRoom(
  studentId: number,
  newWing: 'A' | 'B' | 'C' | 'D',
  newRoomNo: string
) {
  try {
    const student = await db.students.get(studentId);
    if (!student) throw new Error('Student not found');

    const oldWing = student.wing;
    const oldRoomNo = student.roomNo;

    await db.students.update(studentId, {
      wing: newWing,
      roomNo: newRoomNo,
      updatedAt: new Date()
    });

    // Sync both old and new rooms
    await syncRoomOccupancy(oldRoomNo, oldWing);
    await syncRoomOccupancy(newRoomNo, newWing);

    return { success: true };
  } catch (error: unknown) {
    console.error('Error changing room:', error);
    return { success: false, error };
  }
}
