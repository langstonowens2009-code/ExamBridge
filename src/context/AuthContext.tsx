'use client';

import {
  useState,
  useEffect,
  createContext,
  ReactNode,
  useCallback,
} from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { auth } from '@/firebase/auth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        const token = await user.getIdToken();
        Cookies.set('firebaseIdToken', token, { expires: 1 });
      } else {
        Cookies.remove('firebaseIdToken');
      }
    });
    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    Cookies.remove('firebaseIdToken');
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
