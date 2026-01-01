'use client';

import {
  useState,
  useEffect,
  createContext,
  ReactNode,
  useCallback,
} from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth as useFirebaseAuth } from '@/firebase';

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
  const auth = useFirebaseAuth();

  useEffect(() => {
    if (!auth) return;
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
  }, [auth]);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    Cookies.remove('firebaseIdToken');
    router.push('/');
  }, [router, auth]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
