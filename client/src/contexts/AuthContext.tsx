
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { db, initializeDatabase } from '../database/db';
import type { User } from '../database/db';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database initialization timeout')), 5000)
        );
        await Promise.race([initializeDatabase(), timeoutPromise]);
        // Require fresh login on each app start
        localStorage.removeItem('hostel_user');
        setUser(null);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
        const loader = document.getElementById('initial-loader');
        if (loader) {
          loader.remove();
        }
      }
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const trimmedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();
      await initializeDatabase();
      const user = await db.users
        .where('username')
        .equals(trimmedUsername)
        .first();
      if (user && user.password === trimmedPassword) {
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    // No need to remove from localStorage since we don't store there anymore
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};