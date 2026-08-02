import type { UserRole } from '@/types/firestore';

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
  signUp: (email: string, password: string, displayName: string, role?: 'student' | 'teacher') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
