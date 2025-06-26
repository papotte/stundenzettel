
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginAsMockUser?: (user: User | null) => void;
}

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsMockUser = (user: User | null) => {
    setUser(user);
    setLoading(false);
  };

  const signOut = async () => {
    if (useMocks) {
        loginAsMockUser(null);
    } else {
        await firebaseAuth.signOut();
    }
  };

  useEffect(() => {
    if (useMocks) {
      setLoading(false); // In mock mode, we wait for manual login
      return;
    }
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
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
