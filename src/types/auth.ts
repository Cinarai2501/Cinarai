import type { UserRole } from '@/types/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  username?: string;
  nickname?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  classLevel?: 'Kelas I' | 'Kelas II' | 'Kelas III' | 'Kelas IV' | 'Kelas V' | 'Kelas VI';
  bio?: string;
  avatar?: string;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Date;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, displayName: string) => Promise<UserRole>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  authenticateWithGoogleForRegistration: () => Promise<FirebaseUser>;
  completeGoogleRegistration: (firebaseUser: FirebaseUser) => Promise<UserRole>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (profile: {
    displayName: string;
    photoURL?: string;
    nickname?: string;
    gender?: 'Laki-laki' | 'Perempuan';
    classLevel?: 'Kelas I' | 'Kelas II' | 'Kelas III' | 'Kelas IV' | 'Kelas V' | 'Kelas VI';
    bio?: string;
    avatar?: string;
  }) => Promise<void>;
  clearError: () => void;
}
