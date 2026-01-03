// Hybrid Storage Service - Switches between IndexedDB and MySQL API
import { db, Student, Payment, Room, FacilityTransaction } from '../database/db';
import api from './api';

const storageMode = import.meta.env.VITE_STORAGE_MODE || 'api';
const isApiMode = storageMode === 'api';

console.log(`Storage Service Initialized - Mode: ${storageMode}, Is API Mode: ${isApiMode}`);
console.log(`API Base URL: ${import.meta.env.VITE_API_BASE_URL}`);

// ==================== STUDENTS ====================

// Helper to sanitize student data from API (convert nulls to empty strings)
function sanitizeStudent(student: Partial<Student>): Student {
  return {
    id: student.id,
    name: student.name || '',
    mobile: student.mobile || '',
    email: student.email || '',
    enrollmentNo: student.enrollmentNo || '',
    faculty: student.faculty || '',
    collegeName: student.collegeName || '',
    yearOfCollege: student.yearOfCollege || '',
    address: student.address || '',
    wing: student.wing || 'A',
    roomNo: student.roomNo || '',
    studentType: student.studentType || 'Hosteller',
    joiningDate: student.joiningDate || new Date(),
    annualFee: student.annualFee || 0,
    residencyStatus: student.residencyStatus || 'Permanent',
    remarks: student.remarks || '',
    createdAt: student.createdAt || new Date(),
    updatedAt: student.updatedAt || new Date(),
  } as Student;
}

export const studentsStorage = {
  async getAll(): Promise<Student[]> {
    if (isApiMode) {
      const students = await api.students.getAll();
      return students.map(sanitizeStudent);
    }
    return await db.students.toArray();
  },

  async getById(id: number): Promise<Student | undefined> {
    if (isApiMode) {
      const student = await api.students.getById(id);
      return student ? sanitizeStudent(student) : undefined;
    }
    return await db.students.get(id);
  },

  async add(student: Omit<Student, 'id'>): Promise<number> {
    if (isApiMode) {
      return await api.students.create(student);
    }
    return await db.students.add(student as Student);
  },

  async update(id: number, changes: Partial<Student>): Promise<void> {
    if (isApiMode) {
      await api.students.update(id, changes);
      return;
    }
    await db.students.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    if (isApiMode) {
      await api.students.delete(id);
      return;
    }
    await db.students.delete(id);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    if (isApiMode) {
      await api.students.bulkDelete(ids);
      return;
    }
    await db.students.bulkDelete(ids);
  },

  where(field: keyof Student, value: unknown) {
    if (isApiMode) {
      return {
        async toArray(): Promise<Student[]> {
          const all = await api.students.getAll();
          return all.filter(student => student[field] === value);
        },
        async count(): Promise<number> {
          const all = await api.students.getAll();
          return all.filter(student => student[field] === value).length;
        }
      };
    }

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
    if (isApiMode) {
      const all = await api.students.getAll();
      return all.length;
    }
    return await db.students.count();
  },
};

// ==================== PAYMENTS ====================

export const paymentsStorage = {
  async getAll(): Promise<Payment[]> {
    if (isApiMode) {
      return await api.payments.getAll();
    }
    return await db.payments.toArray();
  },

  async getByStudentId(studentId: number): Promise<Payment[]> {
    if (isApiMode) {
      return await api.payments.getByStudentId(studentId);
    }
    return await db.payments.where('studentId').equals(studentId).toArray();
  },

  async add(payment: Omit<Payment, 'id'>): Promise<number> {
    if (isApiMode) {
      return await api.payments.create(payment);
    }
    return await db.payments.add(payment as Payment);
  },

  async update(id: number, changes: Partial<Payment>): Promise<void> {
    if (isApiMode) {
      await api.payments.update(id, changes);
      return;
    }
    await db.payments.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    if (isApiMode) {
      await api.payments.delete(id);
      return;
    }
    await db.payments.delete(id);
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    if (isApiMode) {
      return await api.payments.getByDateRange(startDate, endDate);
    }
    return await db.payments
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async count(): Promise<number> {
    if (isApiMode) {
      const all = await api.payments.getAll();
      return all.length;
    }
    return await db.payments.count();
  },
};

// ==================== ROOMS ====================

export const roomsStorage = {
  async getAll(): Promise<Room[]> {
    if (isApiMode) {
      return await api.rooms.getAll();
    }
    return await db.rooms.toArray();
  },

  async getByWing(wing: 'A' | 'B' | 'C' | 'D'): Promise<Room[]> {
    if (isApiMode) {
      return await api.rooms.getByWing(wing);
    }
    return await db.rooms.where('wing').equals(wing).toArray();
  },

  async update(roomNumber: string, changes: Partial<Room>): Promise<void> {
    if (isApiMode) {
      await api.rooms.update(roomNumber, changes);
      return;
    }
    await db.rooms.where('roomNumber').equals(roomNumber).modify(changes);
  },

  async bulkAdd(rooms: Omit<Room, 'id'>[]): Promise<void> {
    if (isApiMode) {
      await api.rooms.bulkCreate(rooms);
      return;
    }
    await db.rooms.bulkAdd(rooms as Room[]);
  },

  async count(): Promise<number> {
    if (isApiMode) {
      const all = await api.rooms.getAll();
      return all.length;
    }
    return await db.rooms.count();
  },
};

// ==================== SETTINGS ====================

export const settingsStorage = {
  async get(key: string): Promise<unknown> {
    if (isApiMode) {
      return await api.settings.get(key);
    }
    const setting = await db.settings.get(key);
    if (!setting?.value) return undefined;
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    if (isApiMode) {
      await api.settings.set(key, value);
      return;
    }
    await db.settings.put({ key, value: JSON.stringify(value) });
  },

  async getAll(): Promise<Record<string, unknown>> {
    if (isApiMode) {
      return await api.settings.getAll();
    }
    const settings = await db.settings.toArray();
    return settings.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, unknown>);
  },
};

// ==================== FACILITY TRANSACTIONS ====================

export const facilityTransactionsStorage = {
  async getAll(): Promise<FacilityTransaction[]> {
    if (isApiMode) {
      return await api.facilityTransactions.getAll();
    }
    return await db.facilityTransactions.toArray();
  },

  async add(transaction: Omit<FacilityTransaction, 'id'>): Promise<number> {
    if (isApiMode) {
      return await api.facilityTransactions.create(transaction);
    }
    return await db.facilityTransactions.add(transaction as FacilityTransaction);
  },

  async getByFacility(facility: FacilityTransaction['facility']): Promise<FacilityTransaction[]> {
    if (isApiMode) {
      return await api.facilityTransactions.getByFacility(facility);
    }
    return await db.facilityTransactions
      .where('facility')
      .equals(facility)
      .toArray();
  },
};

// ==================== AUTHENTICATION ====================

export const authStorage = {
  async login(username: string, password: string): Promise<boolean> {
    if (isApiMode) {
      const result = await api.auth.login(username, password);
      return !!result;
    }

    // Offline mode - simple check
    const user = await db.users?.get({ username });
    if (user && user.password === password) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  },

  async logout(): Promise<void> {
    if (isApiMode) {
      await api.auth.logout();
    }
    localStorage.removeItem('currentUser');
  },

  async isAuthenticated(): Promise<boolean> {
    if (isApiMode) {
      return await api.auth.verify();
    }
    return !!localStorage.getItem('currentUser');
  },
};

// Export utility functions
export const getStorageMode = () => storageMode;
export const isOnlineMode = () => isApiMode;
export const isOfflineMode = () => !isApiMode;

// Export all as default
export default {
  students: studentsStorage,
  payments: paymentsStorage,
  rooms: roomsStorage,
  settings: settingsStorage,
  facilityTransactions: facilityTransactionsStorage,
  auth: authStorage,
  getStorageMode,
  isOnlineMode,
  isOfflineMode,
};
