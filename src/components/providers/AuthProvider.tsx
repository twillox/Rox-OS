'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextProps {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserData = async (firebaseUser: User) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let currentData: any = null;
      if (userDoc.exists()) {
        currentData = userDoc.data();
        setUserData(currentData);
      } else {
        // Create user document if it doesn't exist
        const newUserData = {
          email: firebaseUser.email,
          createdAt: new Date().toISOString(),
          role: 'CEO', // Default to CEO for Roxten OS setup
        };
        await setDoc(userDocRef, newUserData);
        setUserData(newUserData);
        currentData = newUserData;
      }

      // Set auth cookies so Server APIs can partition data securely
      const effectiveBusinessId = currentData?.businessId || 'biz_roxten_corp';
      document.cookie = `userId=${firebaseUser.uid}; path=/`;
      document.cookie = `businessId=${effectiveBusinessId}; path=/`;
      
      if (!currentData?.businessId) {
        currentData = { ...currentData, businessId: effectiveBusinessId };
        setUserData(currentData);
      }

      return currentData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      document.cookie = `userId=${firebaseUser.uid}; path=/`;
      document.cookie = `businessId=biz_roxten_corp; path=/`;
      setUserData({ role: 'CEO', businessId: 'biz_roxten_corp' });
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
        document.cookie = `userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `businessId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (user) {
       await fetchUserData(user);
    }
  };

  // Protected Routes Logic
  useEffect(() => {
    if (!loading) {
      const inDashboard = pathname.startsWith('/dashboard');
      const inOnboarding = pathname.startsWith('/onboarding');
      const inAuth = pathname === '/login' || pathname === '/';

      if (!user) {
        if (inDashboard || inOnboarding) {
          router.push('/login');
        }
      } else {
        // User is authenticated, navigate them to dashboard if at login/root
        if (inAuth) {
          router.push('/dashboard');
        }
      }
    }
  }, [user, userData, loading, pathname, router]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    document.cookie = `userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `businessId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut, refreshUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
