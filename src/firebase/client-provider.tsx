'use client';
import { ReactNode, useMemo } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';

type Props = { children: ReactNode };

export function FirebaseClientProvider({ children }: Props) {
  const { app, auth, db } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider app={app} auth={auth} db={db}>
      {children}
    </FirebaseProvider>
  );
}
