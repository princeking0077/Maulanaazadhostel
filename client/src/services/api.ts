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
      const student = await db.students.get(id);
      return student || null;
    } catch (error) {
      console.error('Failed to fetch student:', error);
      return null;
    }
  },

  async create(student: Omit<Student, 'id'>): Promise<number> {
    try {
      const id = await db.students.add(student as Student);
      return Number(id);
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
        .filter((student) => {
          return (
            student.name.toLowerCase().includes(lowerQuery) ||
            student.mobile.includes(lowerQuery) ||
            (student.enrollmentNo && student.enrollmentNo.toLowerCase().includes(lowerQuery)) ||
            (student.roomNo && student.roomNo.toLowerCase().includes(lowerQuery))
          );
        })
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
      const id = await db.payments.add(payment as Payment);
      return Number(id);
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
      // Find room by number first since our key is ID
      const room = await db.rooms.where('roomNumber').equals(roomNumber).first();
      if (!room || !room.id) return false;

      await db.rooms.update(room.id, updates);
      return true;
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
      if (!setting) return null;

      // Attempt to parse JSON if it looks like an object/array, otherwise return raw string
      try {
        return JSON.parse(setting.value);
      } catch {
        return setting.value;
      }
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<boolean> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      const existing = await db.settings.where('key').equals(key).first();
      if (existing && existing.id) {
        await db.settings.update(existing.id, { value: stringValue });
      } else {
        await db.settings.add({ key, value: stringValue });
      }
      return true;
    } catch {
      return false;
    }
  },

  async getAll(): Promise<Record<string, unknown>> {
    try {
      const allSettings = await db.settings.toArray();
      const result: Record<string, unknown> = {};

      allSettings.forEach(s => {
        try {
          result[s.key] = JSON.parse(s.value);
        } catch {
          result[s.key] = s.value;
        }
      });

      return result;
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
      const id = await db.facilityTransactions.add(transaction as FacilityTransaction);
      return Number(id);
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
      const dateObj = new Date(data.date);
      const year = dateObj.getFullYear();
      const count = await db.facilityTransactions.count();
      const receiptNo = `BILL/${year}/${(count + 1).toString().padStart(4, '0')}`;

      const transaction: FacilityTransaction = {
        facility: data.facility || 'Mess', // Default to Mess if undefined
        txnType: data.txnType || 'Income',
        date: dateObj,
        amount: data.amount,
        partyName: data.partyName,
        receiptNo,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      } as FacilityTransaction;

      const id = await db.facilityTransactions.add(transaction);
      return { id: Number(id), receiptNo };
    } catch (error) {
      console.error('Failed to create admin bill:', error);
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
         // Create a fake token for offline session management compatibility
        const token = btoa(`${user.username}:${Date.now()}`);
        localStorage.setItem('authToken', token);
        return {
          token,
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
    const token = localStorage.getItem('authToken');
    return !!token;
  },
};

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
