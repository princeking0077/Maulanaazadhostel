// API Service Layer - Re-routed to Storage Service for Offline Mode
// This file is kept to maintain compatibility with existing components that import 'api'
import storage from './storage';
import { db } from '../database/db';

// ==================== STUDENTS ====================
export const studentsApi = {
  ...storage.students,
  async update(id: number, student: any): Promise<boolean> {
    try {
      await storage.students.update(id, student);
      return true;
    } catch {
      return false;
    }
  },
  async delete(id: number): Promise<boolean> {
    try {
      await storage.students.delete(id);
      return true;
    } catch {
      return false;
    }
  },
  async bulkDelete(ids: number[]): Promise<boolean> {
    try {
      await storage.students.bulkDelete(ids);
      return true;
    } catch {
      return false;
    }
  },
  async create(student: any): Promise<number> {
      try {
          return await storage.students.add(student);
      } catch (e) {
          console.error(e);
          return 0;
      }
  },
  async search(query: string): Promise<any[]> {
    try {
        const all = await storage.students.getAll();
        const lowerQuery = query.toLowerCase();
        return all.filter(s =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.mobile.includes(query) ||
            s.enrollmentNo.toLowerCase().includes(lowerQuery)
        );
    } catch {
        return [];
    }
  }
};

// ==================== PAYMENTS ====================
export const paymentsApi = {
    ...storage.payments,
    async create(payment: any): Promise<number> {
        try {
            return await storage.payments.add(payment);
        } catch {
            return 0;
        }
    },
    async update(id: number, payment: any): Promise<boolean> {
        try {
            await storage.payments.update(id, payment);
            return true;
        } catch {
            return false;
        }
    },
    async delete(id: number): Promise<boolean> {
        try {
            await storage.payments.delete(id);
            return true;
        } catch {
            return false;
        }
    }
};

// ==================== ROOMS ====================
export const roomsApi = {
    ...storage.rooms,
    async update(roomNumber: string, updates: any): Promise<boolean> {
        try {
            await storage.rooms.update(roomNumber, updates);
            return true;
        } catch {
            return false;
        }
    },
    async bulkCreate(rooms: any[]): Promise<boolean> {
        try {
            await storage.rooms.bulkAdd(rooms);
            return true;
        } catch {
            return false;
        }
    }
};

// ==================== SETTINGS ====================
export const settingsApi = {
    ...storage.settings,
    async set(key: string, value: unknown): Promise<boolean> {
        try {
            await storage.settings.set(key, value);
            return true;
        } catch {
            return false;
        }
    }
};

// ==================== FACILITY TRANSACTIONS ====================
export const facilityTransactionsApi = {
    ...storage.facilityTransactions,
    async create(transaction: any): Promise<number> {
        try {
            return await storage.facilityTransactions.add(transaction);
        } catch {
            return 0;
        }
    }
};

// ==================== AUTHENTICATION ====================
export const authApi = {
    async login(username: string, password: string): Promise<{ token: string; user: { id: number; username: string; role: string; name: string } } | null> {
        try {
            // Check direct DB access via storage logic or reimplement here
            // Reimplementing to get the user object easily
            const user = await db.users.where('username').equals(username).first();
            if (user && user.password === password) {
                const userData = {
                    id: user.id!,
                    username: user.username,
                    role: user.role,
                    name: user.name
                };
                localStorage.setItem('authToken', 'offline-token'); // Mock token for compatibility
                localStorage.setItem('currentUser', JSON.stringify(userData));
                return {
                    token: 'offline-token',
                    user: userData
                };
            }
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async logout(): Promise<void> {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    },

    async verify(): Promise<boolean> {
        return !!localStorage.getItem('authToken') || !!localStorage.getItem('currentUser');
    }
};

export const isOnlineMode = storage.isOnlineMode;
export const isOfflineMode = storage.isOfflineMode;

// Admin Billing Stub
export const adminBillingApi = {
  async create(data: any): Promise<{ id: number; receiptNo: string } | null> {
    try {
        const id = await storage.facilityTransactions.add({
            ...data,
            txnType: 'Income',
            facility: 'Mess',
            amount: data.amount,
            date: new Date(data.date),
            partyName: data.partyName
        });
        return { id, receiptNo: 'OFFLINE-' + id };
    } catch (e) {
        console.error(e);
        return null;
    }
  },
};

export default {
  students: studentsApi,
  payments: paymentsApi,
  rooms: roomsApi,
  settings: settingsApi,
  facilityTransactions: facilityTransactionsApi,
  auth: authApi,
  adminBilling: adminBillingApi,
  isOnlineMode,
  isOfflineMode,
};
