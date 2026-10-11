import type { User, UserCredential } from 'firebase/auth';
import type { UserDocument, UserRole } from '@/types/firestore';
import { normalizeEmail } from '@/lib/userAudit';

export type AuthUser = User;

export interface AuthSignUpDependencies {
  getSignInMethods: (email: string) => Promise<string[]>;
  queryUserDocumentsByEmail?: (email: string) => Promise<UserDocument[]>;
  firebaseSignUp: (email: string, password: string) => Promise<UserCredential>;
  updateUserProfile: (user: User, displayName: string) => Promise<void>;
  deleteFirebaseUser: (user: User) => Promise<void>;
  upsertUser: (user: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export interface AuthSignInDependencies {
  firebaseSignIn: (email: string, password: string) => Promise<UserCredential>;
}

export async function signUpUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'student',
  deps: AuthSignUpDependencies
): Promise<User> {
  if (role !== 'student' && role !== 'teacher') {
    throw new Error('Role pendaftaran tidak valid. Pilih student atau teacher.');
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email tidak valid.');
  }

  const existingMethods = await deps.getSignInMethods(normalizedEmail);
  if (existingMethods.length > 0) {
    throw new Error('Email ini sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.');
  }

  if (deps.queryUserDocumentsByEmail) {
    try {
      const existingUserDocuments = await deps.queryUserDocumentsByEmail(normalizedEmail);
      if (existingUserDocuments.length > 0) {
        throw new Error('Email ini sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.');
      }
    } catch (error) {
      if ((error as { code?: string }).code !== 'permission-denied') throw error;
    }
  }

  const userCredential = await deps.firebaseSignUp(normalizedEmail, password);
  const firebaseUser = userCredential.user;

  try {
    await deps.updateUserProfile(firebaseUser, displayName);

    const userData: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? normalizedEmail,
      displayName: firebaseUser.displayName ?? displayName,
      username: normalizedEmail.split('@')[0],
      role,
      isActive: true,
      duplicate: false,
      ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
    };

    await deps.upsertUser(userData);
  } catch (profileError) {
    try {
      await deps.deleteFirebaseUser(firebaseUser);
    } catch (cleanupError) {
      const profileMessage = profileError instanceof Error ? profileError.message : String(profileError);
      const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      throw new Error(
        `Profil pengguna gagal disimpan (${profileMessage}) dan akun Authentication gagal dibersihkan (${cleanupMessage}).`
      );
    }
    throw profileError;
  }

  return firebaseUser;
}

export async function signInUser(
  email: string,
  password: string,
  deps: AuthSignInDependencies
): Promise<AuthUser> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email tidak valid.');
  }

  const userCredential = await deps.firebaseSignIn(normalizedEmail, password);
  return userCredential.user;
}
