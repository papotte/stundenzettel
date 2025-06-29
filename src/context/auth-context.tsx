'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';
import type { AuthenticatedUser } from '@/lib/types';

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginAsMockUser?: (user: AuthenticatedUser | null) => void;
}

const useMocks = process.env.NEXT_PUBLIC_ENVIRONMENT === 'test' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
const MOCK_USER_STORAGE_KEY = 'mockUser';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsMockUser = (user: AuthenticatedUser | null) => {
    if (user) {
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    }
    setUser(user);
    setLoading(false);
  };

  const signOut = async () => {
    if (useMocks) {
        loginAsMockUser(null);
    } else if (firebaseAuth && typeof firebaseAuth.onAuthStateChanged === 'function') {
        await firebaseSignOut(firebaseAuth);
    }
  };

  useEffect(() => {
    if (useMocks) {
      try {
        const storedUser = localStorage.getItem(MOCK_USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse mock user from localStorage", error);
        localStorage.removeItem(MOCK_USER_STORAGE_KEY);
      }
      setLoading(false);
      return;
    }
    
    // Guard against using a non-initialized auth object
    if (!firebaseAuth || typeof firebaseAuth.onAuthStateChanged !== 'function') {
        console.warn("Firebase Auth is not initialized. Skipping auth state listener.");
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const contextValue = {
    user,
    loading,
    signOut,
    ...(useMocks && { loginAsMockUser }),
  };

  return (
    <AuthContext.Provider value={contextValue}>
        {loading ? (
             <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center space-y-4">
                    <Clock className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground">Loading TimeWise Tracker...</p>
                </div>
            </div>
        ) : children}
    </AuthContext.Provider>
  );
};
