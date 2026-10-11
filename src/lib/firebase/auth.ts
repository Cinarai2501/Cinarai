'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser as deleteFirebaseUser,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  type User,
  type UserCredential,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './client';

export const signUp = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const getSignInMethods = async (email: string): Promise<string[]> => {
  try {
    return await fetchSignInMethodsForEmail(auth, email);
  } catch (error) {
    console.error('Fetch sign-in methods error:', error);
    throw error;
  }
};

export const deleteAuthUser = async (user: User): Promise<void> => {
  try {
    await deleteFirebaseUser(user);
  } catch (error) {
    console.error('Delete newly-created auth user error:', error);
    throw error;
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  user: User,
  displayName: string,
  photoURL?: string
): Promise<void> => {
  try {
    await updateProfile(user, { displayName, photoURL });
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getUserToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (error) {
    console.error('Get user token error:', error);
    return null;
  }
};
