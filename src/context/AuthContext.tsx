'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  logout as firebaseLogout,
  resetPassword as firebaseResetPassword,
  subscribeToAuthChanges,
  updateUserProfile,
} from '@/lib/firebase/auth';
import { initializeUserProgress } from '@/services/comicProgress';
import { getFirestoreDocument, upsertUser } from '@/services/firestore';
import type { User, AuthContextType, AuthState } from '@/types/auth';
import type { UserRole } from '@/types/firestore';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const mapFirebaseUserToUser = (firebaseUser: FirebaseUser, role: UserRole | null = null): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  emailVerified: firebaseUser.emailVerified,
  createdAt: firebaseUser.metadata.creationTime
    ? new Date(firebaseUser.metadata.creationTime)
    : new Date(),
  role,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  const syncUserFromFirestore = useCallback(async (firebaseUser: FirebaseUser) => {
    const userDocument = await getFirestoreDocument('users', firebaseUser.uid);
    const role = userDocument?.role ?? null;
    const user = mapFirebaseUserToUser(firebaseUser, role);

    setState({ user, loading: false, error: null });

    initializeUserProgress(firebaseUser.uid).catch((err) =>
      console.warn('Progress init error:', err)
    );
  }, []);

  // Subscribe to auth changes on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        void syncUserFromFirestore(firebaseUser);
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, [syncUserFromFirestore]);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string, role: UserRole = 'student') => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { user: firebaseUser } = await firebaseSignUp(email, password);
        await updateUserProfile(firebaseUser, displayName);
        await upsertUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? displayName,
          photoURL: firebaseUser.photoURL ?? undefined,
          role,
          isActive: true,
          lastLoginAt: undefined,
          emailVerified: undefined,
        } as Parameters<typeof upsertUser>[0]);
        await syncUserFromFirestore(firebaseUser);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign up';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [syncUserFromFirestore]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { user: firebaseUser } = await firebaseSignIn(email, password);
      await syncUserFromFirestore(firebaseUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign in';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [syncUserFromFirestore]);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { user: firebaseUser } = await firebaseSignInWithGoogle();
      await syncUserFromFirestore(firebaseUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign in with Google';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [syncUserFromFirestore]);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await firebaseLogout();
      setState({
        user: null,
        loading: false,
        error: null,
      });
      router.push('/auth/login');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to logout';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await firebaseResetPassword(email);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reset password';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
