// Local Storage Service - Strictly uses IndexedDB
import { db, Student, Payment, Room } from '../database/db';

console.log('Storage Service Initialized - Offline Mode (IndexedDB)');

// ==================== STUDENTS ====================

export const studentsStorage = {
  async getAll(): Promise<Student[]> {
    return await db.students.toArray();
  },

  async getById(id: number): Promise<Student | undefined> {
    return await db.students.get(id);
  },

  async add(student: Omit<Student, 'id'>): Promise<number> {
    return await db.students.add(student as Student);
  },

  async update(id: number, changes: Partial<Student>): Promise<void> {
    await db.students.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    await db.students.delete(id);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await db.students.bulkDelete(ids);
  },

  where(field: keyof Student, value: unknown) {
    const query = db.students.where(field as string).equals(value as string | number);
    return {
      async toArray() {
        return await query.toArray();
      },
      async count() {
        return await query.count();
      }
    };
  },

  async count(): Promise<number> {
    return await db.students.count();
  },
};

// ==================== PAYMENTS ====================

export const paymentsStorage = {
  async getAll(): Promise<Payment[]> {
    return await db.payments.toArray();
  },

  async getByStudentId(studentId: number): Promise<Payment[]> {
    return await db.payments.where('studentId').equals(studentId).toArray();
  },

  async add(payment: Omit<Payment, 'id'>): Promise<number> {
    return await db.payments.add(payment as Payment);
  },

  async update(id: number, changes: Partial<Payment>): Promise<void> {
    await db.payments.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    await db.payments.delete(id);
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return await db.payments
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async count(): Promise<number> {
    return await db.payments.count();
  },
};

// ==================== ROOMS ====================

export const roomsStorage = {
  async getAll(): Promise<Room[]> {
    return await db.rooms.toArray();
  },

  async getByWing(wing: 'A' | 'B' | 'C' | 'D'): Promise<Room[]> {
    return await db.rooms.where('wing').equals(wing).toArray();
  },

  async update(roomNumber: string, changes: Partial<Room>): Promise<void> {
    await db.rooms.where('roomNumber').equals(roomNumber).modify(changes);
  },

  async bulkAdd(rooms: Omit<Room, 'id'>[]): Promise<void> {
    await db.rooms.bulkAdd(rooms as Room[]);
  },

  async count(): Promise<number> {
    return await db.rooms.count();
  },
};

// ==================== SETTINGS ====================

export const settingsStorage = {
  async get(key: string): Promise<unknown> {
    const setting = await db.settings.get(key);
    if (!setting?.value) return undefined;
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    await db.settings.put({ key, value: JSON.stringify(value) });
  },

  async getAll(): Promise<Record<string, unknown>> {
    const settings = await db.settings.toArray();
    return settings.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, unknown>);
  },
};

// Export all as default
export default {
  students: studentsStorage,
  payments: paymentsStorage,
  rooms: roomsStorage,
  settings: settingsStorage,
};
