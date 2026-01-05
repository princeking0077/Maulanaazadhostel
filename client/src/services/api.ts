// Service Layer - IndexedDB Implementation
import { db, Student, Payment, Room, FacilityTransaction } from '../database/db';

// ==================== STUDENTS ====================

export const studentsApi = {
  async getAll(): Promise<Student[]> {
    try {
      return await db.students.toArray();
    } catch (error) {
      console.error('Failed to fetch students:', error);
      return [];
    }
  },

  async getById(id: number): Promise<Student | null> {
    try {
      return await db.students.get(id) || null;
    } catch (error) {
      console.error('Failed to fetch student:', error);
      return null;
    }
  },

  async create(student: Omit<Student, 'id'>): Promise<number> {
    try {
      return await db.students.add(student as Student);
    } catch (error) {
      console.error('Failed to create student:', error);
      return 0;
    }
  },

  async update(id: number, student: Partial<Student>): Promise<boolean> {
    try {
      await db.students.update(id, student);
      return true;
    } catch (error) {
      console.error('Failed to update student:', error);
      return false;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      await db.students.delete(id);
      return true;
    } catch (error) {
      console.error('Failed to delete student:', error);
      return false;
    }
  },

  async bulkDelete(ids: number[]): Promise<boolean> {
    try {
      await db.students.bulkDelete(ids);
      return true;
    } catch (error) {
      console.error('Failed to bulk delete students:', error);
      return false;
    }
  },

  async search(query: string): Promise<Student[]> {
    try {
      const lowerQuery = query.toLowerCase();
      return await db.students
        .filter(student =>
          student.name.toLowerCase().includes(lowerQuery) ||
          student.enrollmentNo.toLowerCase().includes(lowerQuery) ||
          student.roomNo.toLowerCase().includes(lowerQuery)
        )
        .toArray();
    } catch (error) {
      console.error('Failed to search students:', error);
      return [];
    }
  },
};

// ==================== PAYMENTS ====================

export const paymentsApi = {
  async getAll(): Promise<Payment[]> {
    try {
      return await db.payments.toArray();
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return [];
    }
  },

  async getByStudentId(studentId: number): Promise<Payment[]> {
    try {
      return await db.payments.where('studentId').equals(studentId).toArray();
    } catch (error) {
      console.error('Failed to fetch student payments:', error);
      return [];
    }
  },

  async create(payment: Omit<Payment, 'id'>): Promise<number> {
    try {
      return await db.payments.add(payment as Payment);
    } catch (error) {
      console.error('Failed to create payment:', error);
      return 0;
    }
  },

  async update(id: number, payment: Partial<Payment>): Promise<boolean> {
    try {
      await db.payments.update(id, payment);
      return true;
    } catch {
      return false;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      await db.payments.delete(id);
      return true;
    } catch {
      return false;
    }
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    try {
      return await db.payments
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray();
    } catch {
      return [];
    }
  },
};

// ==================== ROOMS ====================

export const roomsApi = {
  async getAll(): Promise<Room[]> {
    try {
      return await db.rooms.toArray();
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      return [];
    }
  },

  async getByWing(wing: 'A' | 'B' | 'C' | 'D'): Promise<Room[]> {
    try {
      return await db.rooms.where('wing').equals(wing).toArray();
    } catch (error) {
      console.error('Failed to fetch rooms by wing:', error);
      return [];
    }
  },

  async update(roomNumber: string, updates: Partial<Room>): Promise<boolean> {
    try {
      // Find room by number since updates keyed by number in previous API
      const room = await db.rooms.where('roomNumber').equals(roomNumber).first();
      if (room && room.id) {
        await db.rooms.update(room.id, updates);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  async bulkCreate(rooms: Omit<Room, 'id'>[]): Promise<boolean> {
    try {
      await db.rooms.bulkAdd(rooms as Room[]);
      return true;
    } catch {
      return false;
    }
  },
};

// ==================== SETTINGS ====================

export const settingsApi = {
  async get(key: string): Promise<unknown> {
    try {
      const setting = await db.settings.where('key').equals(key).first();
      return setting ? setting.value : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<boolean> {
    try {
      // Check if exists
      const existing = await db.settings.where('key').equals(key).first();
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);

      if (existing && existing.id) {
        await db.settings.update(existing.id, { value: valStr });
      } else {
        await db.settings.add({ key, value: valStr });
      }
      return true;
    } catch {
      return false;
    }
  },

  async getAll(): Promise<Record<string, unknown>> {
    try {
      const allSettings = await db.settings.toArray();
      return allSettings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, unknown>);
    } catch {
      return {};
    }
  },
};

// ==================== FACILITY TRANSACTIONS ====================

export const facilityTransactionsApi = {
  async getAll(): Promise<FacilityTransaction[]> {
    try {
      return await db.facilityTransactions.toArray();
    } catch {
      return [];
    }
  },

  async create(transaction: Omit<FacilityTransaction, 'id'>): Promise<number> {
    try {
      return await db.facilityTransactions.add(transaction as FacilityTransaction);
    } catch {
      return 0;
    }
  },

  async getByFacility(facility: FacilityTransaction['facility']): Promise<FacilityTransaction[]> {
    try {
      return await db.facilityTransactions.where('facility').equals(facility).toArray();
    } catch {
      return [];
    }
  },
};

// ==================== ADMIN BILLING (Receipt Generation) ====================
export const adminBillingApi = {
  async create(data: Partial<FacilityTransaction> & { date: Date | string; partyName: string; amount: number }): Promise<{ id: number; receiptNo: string } | null> {
    try {
       // Generate receipt number
       const date = new Date(data.date);
       const year = date.getFullYear();
       const count = await db.facilityTransactions
         .where('date')
         .between(new Date(year, 0, 1), new Date(year, 11, 31), true, true)
         .count();

       const receiptNo = `BILL/${year}/${(count + 1).toString().padStart(4, '0')}`;

       const transaction: FacilityTransaction = {
         ...data as any, // Cast to avoid partial mismatches
         date: new Date(data.date),
         receiptNo,
         createdAt: new Date(),
         updatedAt: new Date()
       };

       const id = await db.facilityTransactions.add(transaction);
       return { id, receiptNo };
    } catch {
      return null;
    }
  },
};

// ==================== AUTHENTICATION ====================

export const authApi = {
  async login(username: string, password: string): Promise<{ token: string; user: { id: number; username: string; role: string; name: string } } | null> {
    try {
      const user = await db.users.where('username').equals(username).first();
      if (user && user.password === password) {
        // Return mock token and user data
        return {
          token: 'offline-token',
          user: {
            id: user.id!,
            username: user.username,
            role: user.role,
            name: user.name
          }
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
  },

  async verify(): Promise<boolean> {
    // In offline mode, if we have a user in context (handled by AuthContext), we are verified.
    // However, this method is usually called to check token validity.
    // Since we returned 'offline-token', we can just return true.
    return true;
  },
};

// Always offline mode
export const isOnlineMode = () => false;
export const isOfflineMode = () => true;

export default {
  students: studentsApi,
  payments: paymentsApi,
  rooms: roomsApi,
  settings: settingsApi,
  facilityTransactions: facilityTransactionsApi,
  auth: authApi,
  isOnlineMode,
  isOfflineMode,
};
