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
  getSignInMethods,
} from '@/lib/firebase/auth';
import { initializeUserProgress } from '@/services/comicProgress';
import {
  getFirestoreDocument,
  queryFirestoreCollection,
  upsertUser,
} from '@/services/firestore';
import {
  resolveUserRoleFromProfileAndClaims,
} from '@/lib/auth/role';
import { signUpUser, signInUser } from '@/lib/auth/authService';
import type { User, AuthContextType, AuthState } from '@/types/auth';
import type { UserRole } from '@/types/firestore';

declare global {
  interface Window {
    __cinaraiAuthDebug?: {
      uid?: string;
      role?: string;
      route?: string;
    };
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const mapFirebaseUserToUser = (firebaseUser: FirebaseUser, role: UserRole): User => ({
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
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [userDocument, claimsResult] = await Promise.all([
        getFirestoreDocument('users', firebaseUser.uid),
        firebaseUser.getIdTokenResult(),
      ]);
      const resolvedRole = resolveUserRoleFromProfileAndClaims(userDocument?.role, claimsResult.claims.role);

      if (!resolvedRole) {
        const message = 'Akun belum memiliki role yang valid. Hubungi admin.';
        setState({ user: null, loading: false, error: message });
        return;
      }

      const user = mapFirebaseUserToUser(firebaseUser, resolvedRole);

      if (typeof window !== 'undefined') {
        window.__cinaraiAuthDebug = {
          ...(window.__cinaraiAuthDebug ?? {}),
          uid: firebaseUser.uid,
          role: resolvedRole,
        };
      }

      // login resolved

      setState({ user, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync user profile';

      if (typeof window !== 'undefined') {
        window.__cinaraiAuthDebug = {
          ...(window.__cinaraiAuthDebug ?? {}),
          uid: firebaseUser.uid,
          role: undefined,
        };
      }

      setState({ user: null, loading: false, error: message });
    }

    initializeUserProgress(firebaseUser.uid).catch(() => {
      /* ignore progress init errors */
    });
  }, []);

  // Subscribe to auth changes on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        void syncUserFromFirestore(firebaseUser);
      } else {
        if (typeof window !== 'undefined') {
          window.__cinaraiAuthDebug = {
            ...(window.__cinaraiAuthDebug ?? {}),
            uid: undefined,
            role: undefined,
          };
        }
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
        const firebaseUser = await signUpUser(email, password, displayName, role, {
          getSignInMethods,
          queryUserDocumentsByEmail: (normalizedEmail) =>
            queryFirestoreCollection('users', {
              filters: [{ field: 'email', operator: '==', value: normalizedEmail }],
            }),
          firebaseSignUp,
          updateUserProfile,
          getFirestoreDocument,
          upsertUser,
        });

        await firebaseUser.getIdTokenResult(true);
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
      const firebaseUser = await signInUser(email, password, {
        firebaseSignIn,
      });
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
