'use client';
import { createContext, useContext, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  auth: null,
  db: null,
});

type FirebaseProviderProps = {
  children: ReactNode;
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

export function FirebaseProvider({ children, app, auth, db }: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={{ app, auth, db }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = (): FirebaseApp | null => {
  return useContext(FirebaseContext)?.app ?? null;
};

export const useAuth = (): Auth | null => {
  return useContext(FirebaseContext)?.auth ?? null;
};

export const useFirestore = (): Firestore | null => {
  return useContext(FirebaseContext)?.db ?? null;
};
