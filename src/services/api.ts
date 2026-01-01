// API Service Layer - Wrapper for backend PHP endpoints
import { Student, Payment, Room, FacilityTransaction } from '../database/db';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api';
const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE || 'indexeddb';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Helper to extract data from API response (handles both wrapped and direct responses)
function extractData<T>(response: T | ApiResponse<T>): T {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return (response as ApiResponse<T>).data as T;
  }
  return response as T;
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Offline guard: prevent accidental network calls in IndexedDB mode
    if (STORAGE_MODE === 'indexeddb') {
      throw new Error('Offline mode active: API request blocked');
    }
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`API error: ${endpoint}`, data);
      throw new Error(data.error || `API error: ${response.status}`);
    }

    // Handle both direct arrays and wrapped responses
    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// ==================== STUDENTS ====================

export const studentsApi = {
  async getAll(): Promise<Student[]> {
    try {
      const response = await apiRequest<Student[] | ApiResponse<Student[]>>('students.php');
      const data = extractData(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch students:', error);
      return [];
    }
  },

  async getById(id: number): Promise<Student | null> {
    try {
      const data = await apiRequest<Student>(`students.php?id=${id}`);
      return data || null;
    } catch (error) {
      console.error('Failed to fetch student:', error);
      return null;
    }
  },

  async create(student: Omit<Student, 'id'>): Promise<number> {
    try {
      const data = await apiRequest<{id: number}>('students.php', {
        method: 'POST',
        body: JSON.stringify(student),
      });
      return data?.id || 0;
    } catch (error) {
      console.error('Failed to create student:', error);
      return 0;
    }
  },

  async update(id: number, student: Partial<Student>): Promise<boolean> {
    try {
      await apiRequest(`students.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(student),
      });
      return true;
    } catch (error) {
      console.error('Failed to update student:', error);
      return false;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      await apiRequest(`students.php?id=${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete student:', error);
      return false;
    }
  },

  async bulkDelete(ids: number[]): Promise<boolean> {
    try {
      await apiRequest('students.php', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      });
      return true;
    } catch (error) {
      console.error('Failed to bulk delete students:', error);
      return false;
    }
  },

  async search(query: string): Promise<Student[]> {
    try {
      const data = await apiRequest<Student[]>(`students.php?search=${encodeURIComponent(query)}`);
      return Array.isArray(data) ? data : [];
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
      const data = await apiRequest<Payment[]>('payments.php');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return [];
    }
  },

  async getByStudentId(studentId: number): Promise<Payment[]> {
    try {
      const data = await apiRequest<Payment[]>(`payments.php?studentId=${studentId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch student payments:', error);
      return [];
    }
  },

  async create(payment: Omit<Payment, 'id'>): Promise<number> {
    try {
      const data = await apiRequest<{id: number}>('payments.php', {
        method: 'POST',
        body: JSON.stringify(payment),
      });
      return data?.id || 0;
    } catch (error) {
      console.error('Failed to create payment:', error);
      return 0;
    }
  },

  async update(id: number, payment: Partial<Payment>): Promise<boolean> {
    try {
      const response = await apiRequest<ApiResponse<boolean>>('payments.php?action=update', {
        method: 'PUT',
        body: JSON.stringify({ id, ...payment }),
      });
      return extractData(response) || false;
    } catch {
      return false;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      const response = await apiRequest<ApiResponse<boolean>>(`payments.php?action=delete&id=${id}`, {
        method: 'DELETE',
      });
      return extractData(response) || false;
    } catch {
      return false;
    }
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    try {
      const response = await apiRequest<Payment[] | ApiResponse<Payment[]>>(
        `payments.php?action=date-range&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      const data = extractData(response);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

// ==================== ROOMS ====================

export const roomsApi = {
  async getAll(): Promise<Room[]> {
    try {
      const response = await apiRequest<Room[] | ApiResponse<Room[]>>('rooms.php?action=list');
      const data = extractData(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      return [];
    }
  },

  async getByWing(wing: 'A' | 'B' | 'C' | 'D'): Promise<Room[]> {
    try {
      const response = await apiRequest<Room[] | ApiResponse<Room[]>>(`rooms.php?action=by-wing&wing=${wing}`);
      const data = extractData(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch rooms by wing:', error);
      return [];
    }
  },

  async update(roomNumber: string, updates: Partial<Room>): Promise<boolean> {
    try {
      const response = await apiRequest<ApiResponse<boolean>>('rooms.php?action=update', {
        method: 'PUT',
        body: JSON.stringify({ roomNumber, ...updates }),
      });
      return extractData(response) || false;
    } catch {
      return false;
    }
  },

  async bulkCreate(rooms: Omit<Room, 'id'>[]): Promise<boolean> {
    const response = await apiRequest('rooms.php?action=bulk-create', {
      method: 'POST',
      body: JSON.stringify({ rooms }),
    });
    return response.success;
  },
};

// ==================== SETTINGS ====================

export const settingsApi = {
  async get(key: string): Promise<unknown> {
    const response = await apiRequest<{ value: unknown }>(`settings.php?action=get&key=${encodeURIComponent(key)}`);
    return (response as { value: unknown }).value;
  },

  async set(key: string, value: unknown): Promise<boolean> {
    const response = await apiRequest('settings.php?action=set', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
    return response.success;
  },

  async getAll(): Promise<Record<string, unknown>> {
    const response = await apiRequest<Record<string, unknown>>('settings.php?action=all');
    return response.data || {};
  },
};

// ==================== FACILITY TRANSACTIONS ====================

export const facilityTransactionsApi = {
  async getAll(): Promise<FacilityTransaction[]> {
    try {
      const response = await apiRequest<FacilityTransaction[] | ApiResponse<FacilityTransaction[]>>('facility-transactions.php?action=list');
      const data = extractData(response);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async create(transaction: Omit<FacilityTransaction, 'id'>): Promise<number> {
    try {
      const response = await apiRequest<{ id: number } | ApiResponse<{ id: number }>>('facility-transactions.php?action=create', {
        method: 'POST',
        body: JSON.stringify(transaction),
      });
      const data = extractData(response);
      return data?.id || 0;
    } catch {
      return 0;
    }
  },

  async getByFacility(facility: FacilityTransaction['facility']): Promise<FacilityTransaction[]> {
    try {
      const response = await apiRequest<FacilityTransaction[] | ApiResponse<FacilityTransaction[]>>(
        `facility-transactions.php?action=by-facility&facility=${facility}`
      );
      const data = extractData(response);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

// ==================== ADMIN BILLING (Receipt Generation) ====================
export const adminBillingApi = {
  async create(data: Partial<FacilityTransaction> & { date: Date | string; partyName: string; amount: number }): Promise<{ id: number; receiptNo: string } | null> {
    try {
      const payload = {
        date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
        partyName: data.partyName,
        amount: data.amount,
        facility: data.facility || 'Mess',
        txnType: data.txnType || 'Expense',
        description: data.description || '',
        billNo: data.billNo || '',
        paymentMethod: data.paymentMethod || 'Cash',
        paymentRef: data.paymentRef || '',
        items: data.items || [],
        subtotal: data.subtotal || data.amount,
        gstPercent: data.gstPercent || 0,
        gstAmount: data.gstAmount || 0,
        netAmount: data.netAmount || data.amount,
        paidAmount: data.paidAmount || data.amount,
        balanceAmount: data.balanceAmount || 0,
      };
      const resp = await apiRequest<{ success: boolean; id: number; receiptNo: string }>('admin-billing.php', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (resp && resp.success && resp.receiptNo) {
        return { id: resp.id, receiptNo: resp.receiptNo };
      }
      return null;
    } catch (error) {
      console.error('Admin billing API create failed:', error);
      return null;
    }
  },
};

// ==================== AUTHENTICATION ====================

export const authApi = {
  async login(username: string, password: string): Promise<{ token: string; user: { id: number; username: string; role: string; name: string } } | null> {
    const response = await apiRequest<{ token: string; user: { id: number; username: string; role: string; name: string } }>('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.success && response.data) {
      // Store token for subsequent requests
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }
    return null;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
  },

  async verify(): Promise<boolean> {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    const response = await apiRequest('auth.php?action=verify', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.success;
  },
};

// Export storage mode check
export const isOnlineMode = () => STORAGE_MODE === 'api';
export const isOfflineMode = () => STORAGE_MODE === 'indexeddb';

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
