import test from 'node:test';
import assert from 'node:assert/strict';
import { signUpUser, signInUser } from './authService';
import type { UserDocument } from '@/types/firestore';

const makeMockEmailUser = (email: string, uid = 'user-123') => ({
  uid,
  email,
  displayName: 'Test User',
  photoURL: null,
  metadata: { creationTime: new Date().toISOString() },
  getIdTokenResult: async () => ({ token: 'token' }),
});

const createSignUpDeps = (overrides: Partial<Record<string, unknown>> = {}) => {
  return {
    getSignInMethods: overrides.getSignInMethods as ((email: string) => Promise<string[]>) ?? (async () => []),
    queryUserDocumentsByEmail: overrides.queryUserDocumentsByEmail as ((email: string) => Promise<UserDocument[]>) ?? (async () => []),
    firebaseSignUp: overrides.firebaseSignUp as ((email: string, password: string) => Promise<any>) ?? (async (email: string) => ({ user: makeMockEmailUser(email) })),
    updateUserProfile: overrides.updateUserProfile as ((user: any, displayName: string) => Promise<void>) ?? (async () => undefined),
    getFirestoreDocument: overrides.getFirestoreDocument as ((collection: 'users', docId: string) => Promise<UserDocument | null>) ?? (async () => null),
    upsertUser: overrides.upsertUser as ((user: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>) ?? (async () => undefined),
  } as const;
};

const createSignInDeps = (overrides: Partial<Record<string, unknown>> = {}) => {
  return {
    firebaseSignIn: overrides.firebaseSignIn as ((email: string, password: string) => Promise<any>) ?? (async (email: string) => ({ user: makeMockEmailUser(email) })),
  } as const;
};

test('signUpUser registers a new email and preserves profile update', async () => {
  let userProfileUpdated = false;
  let upsertedUser: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'> | null = null;

  const deps = createSignUpDeps({
    updateUserProfile: async (user: any, displayName: string) => {
      assert.equal(user.email, 'new@example.com');
      assert.equal(displayName, 'Nama Baru');
      userProfileUpdated = true;
    },
    upsertUser: async (user: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
      upsertedUser = user;
    },
  });

  const result = await signUpUser('new@example.com', 'password123', 'Nama Baru', 'student', deps);

  assert.equal(result.email, 'new@example.com');
  assert.equal(userProfileUpdated, true);
  assert.deepEqual(upsertedUser, {
    uid: 'user-123',
    email: 'new@example.com',
    displayName: 'Test User',
    photoURL: undefined,
    role: 'student',
    isActive: true,
    duplicate: false,
    lastLoginAt: undefined,
  });
});

test('signUpUser rejects when email already exists in auth methods', async () => {
  const deps = createSignUpDeps({
    getSignInMethods: async () => ['password'],
  });

  await assert.rejects(
    () => signUpUser('exists@example.com', 'password123', 'Nama', 'student', deps),
    /Email ini sudah terdaftar/,
  );
});

test('signUpUser rejects when duplicate user document exists', async () => {
  const deps = createSignUpDeps({
    queryUserDocumentsByEmail: async () => [
      {
        id: 'doc-1',
        uid: 'user-123',
        email: 'exists@example.com',
        displayName: 'Exists',
        role: 'student',
        isActive: true,
      } as UserDocument,
    ],
  });

  await assert.rejects(
    () => signUpUser('exists@example.com', 'password123', 'Nama', 'student', deps),
    /Email ini sudah terdaftar/,
  );
});

test('signInUser signs in an existing account', async () => {
  const deps = createSignInDeps({
    firebaseSignIn: async (email: string) => ({ user: makeMockEmailUser(email, 'existing-uid') }),
  });

  const result = await signInUser('existing@example.com', 'password123', deps);

  assert.equal(result.uid, 'existing-uid');
  assert.equal(result.email, 'existing@example.com');
});
