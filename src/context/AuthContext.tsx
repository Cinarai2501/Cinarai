'use client';

import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  logout as firebaseLogout,
  resetPassword as firebaseResetPassword,
  subscribeToAuthChanges,
  updateUserProfile as firebaseUpdateUserProfile,
  getCurrentUser,
  getSignInMethods,
  deleteAuthUser,
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
import type { UserDocument, UserRole } from '@/types/firestore';

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

const mapFirebaseUserToUser = (
  firebaseUser: FirebaseUser,
  role: UserRole,
  userDocument?: UserDocument | null
): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email ?? userDocument?.email ?? null,
  displayName: firebaseUser.displayName ?? userDocument?.displayName ?? null,
  username: userDocument?.username,
  nickname: userDocument?.nickname,
  gender: userDocument?.gender,
  classLevel: userDocument?.classLevel,
  bio: userDocument?.bio,
  avatar: userDocument?.avatar,
  photoURL: firebaseUser.photoURL ?? userDocument?.photoURL ?? null,
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
  const authSyncVersion = useRef(0);

  const syncUserFromFirestore = useCallback(async (firebaseUser: FirebaseUser): Promise<UserRole | null> => {
    const syncVersion = ++authSyncVersion.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [userDocument, claimsResult] = await Promise.all([
        getFirestoreDocument('users', firebaseUser.uid),
        firebaseUser.getIdTokenResult(),
      ]);

      const resolvedRole = resolveUserRoleFromProfileAndClaims(
        userDocument?.role,
        claimsResult.claims.role
      );
      if (!resolvedRole) {
        if (syncVersion !== authSyncVersion.current) return null;
        const message = userDocument
          ? 'Role pada profil akun tidak valid. Akses diblokir; hubungi admin.'
          : 'Profil akun tidak ditemukan dan tidak ada role valid. Akses diblokir; hubungi admin.';
        setState({ user: null, loading: false, error: message });
        return null;
      }

      if (syncVersion !== authSyncVersion.current) return null;
      const user = mapFirebaseUserToUser(firebaseUser, resolvedRole, userDocument);

      if (typeof window !== 'undefined') {
        window.__cinaraiAuthDebug = {
          ...(window.__cinaraiAuthDebug ?? {}),
          uid: firebaseUser.uid,
          role: resolvedRole,
        };
      }

      // login resolved

      setState({ user, loading: false, error: null });
      initializeUserProgress(firebaseUser.uid).catch(() => {
        /* ignore progress init errors */
      });
      return resolvedRole;
    } catch (error) {
      if (syncVersion !== authSyncVersion.current) return null;
      console.error('Failed to read authenticated user profile:', error);
      const message = 'Profil akun gagal dibaca. Akses diblokir; periksa koneksi atau hubungi admin.';

      if (typeof window !== 'undefined') {
        window.__cinaraiAuthDebug = {
          ...(window.__cinaraiAuthDebug ?? {}),
          uid: firebaseUser.uid,
          role: undefined,
        };
      }

      setState({ user: null, loading: false, error: message });
      return null;
    }
  }, []);

  // Subscribe to auth changes on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        void syncUserFromFirestore(firebaseUser);
      } else {
        authSyncVersion.current += 1;
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
          queryUserDocumentsByEmail: async (normalizedEmail) => queryFirestoreCollection('users', {
            filters: [{ field: 'email', operator: '==', value: normalizedEmail }],
            limitCount: 1,
          }),
          firebaseSignUp,
          updateUserProfile: firebaseUpdateUserProfile,
          deleteFirebaseUser: deleteAuthUser,
          upsertUser,
        });

        const storedRole = await syncUserFromFirestore(firebaseUser);
        if (!storedRole) {
          throw new Error('Akun berhasil dibuat, tetapi profil belum dapat diverifikasi. Silakan coba masuk kembali.');
        }
        return storedRole;
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

  const authenticateWithGoogleForRegistration = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { user: firebaseUser } = await firebaseSignInWithGoogle();
      return firebaseUser;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign in with Google';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const completeGoogleRegistration = useCallback(
    async (firebaseUser: FirebaseUser, role: 'student' | 'teacher'): Promise<UserRole> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await upsertUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? firebaseUser.email ?? 'Pengguna Google',
          role,
          isActive: true,
          duplicate: false,
          ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
        });

        const storedRole = await syncUserFromFirestore(firebaseUser);
        if (!storedRole) {
          throw new Error('Profil Google gagal diverifikasi. Akses diblokir; silakan coba lagi atau hubungi admin.');
        }
        if (storedRole !== role) {
          throw new Error('Role pada profil Google tidak sesuai dengan pilihan. Akses diblokir; hubungi admin.');
        }
        return storedRole;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Profil Google gagal diverifikasi.';
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

  const updateUserProfile = useCallback(async (profile: {
    displayName: string;
    photoURL?: string;
    nickname?: string;
    gender?: UserDocument['gender'];
    classLevel?: UserDocument['classLevel'];
    bio?: string;
    avatar?: string;
  }) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('unauthenticated');
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await firebaseUpdateUserProfile(currentUser, profile.displayName, profile.photoURL);

      const role = state.user?.role ?? 'student';
      const email = currentUser.email ?? state.user?.email ?? '';
      const userPayload: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'> = {
        uid: currentUser.uid,
        email,
        displayName: profile.displayName,
        role,
        isActive: true,
        duplicate: false,
        ...(profile.photoURL !== undefined ? { photoURL: profile.photoURL } : {}),
        ...(profile.nickname !== undefined ? { nickname: profile.nickname } : {}),
        ...(profile.gender !== undefined ? { gender: profile.gender } : {}),
        ...(profile.classLevel !== undefined ? { classLevel: profile.classLevel } : {}),
        ...(profile.bio !== undefined ? { bio: profile.bio } : {}),
        ...(profile.avatar !== undefined ? { avatar: profile.avatar } : {}),
      };

      await upsertUser(userPayload);

      const updatedUser: User = {
        ...(state.user ?? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
          createdAt: currentUser.metadata.creationTime
            ? new Date(currentUser.metadata.creationTime)
            : new Date(),
          role,
        }),
        displayName: profile.displayName,
        photoURL: profile.photoURL ?? state.user?.photoURL ?? currentUser.photoURL,
        nickname: profile.nickname,
        gender: profile.gender,
        classLevel: profile.classLevel,
        bio: profile.bio,
        avatar: profile.avatar,
      } as User;

      setState({ user: updatedUser, loading: false, error: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update profile';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [state.user]);

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
    authenticateWithGoogleForRegistration,
    completeGoogleRegistration,
    logout,
    resetPassword,
    updateUserProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
