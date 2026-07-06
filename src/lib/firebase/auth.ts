'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
  type UserCredential,
  type Unsubscribe,
} from 'firebase/auth';
import { getFirebaseAuth } from './client';

const getAuthInstance = () => {
  return getFirebaseAuth();
};

/**
 * Sign up user with email and password
 */
export const signUp = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(getAuthInstance(), email, password);
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in user with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(getAuthInstance(), email, password);
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Sign out current user
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(getAuthInstance());
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
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

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(getAuthInstance(), email);
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(getAuthInstance(), provider);
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): Unsubscribe => {
  return onAuthStateChanged(getAuthInstance(), callback);
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return getAuthInstance().currentUser;
};

/**
 * Get current user ID token
 */
export const getUserToken = async (): Promise<string | null> => {
  try {
    const user = getAuthInstance().currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (error) {
    console.error('Get user token error:', error);
    return null;
  }
};
