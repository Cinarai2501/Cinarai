'use client';

import {
  ref,
  uploadBytes,
  uploadString,
  downloadURL,
  deleteObject,
  listAll,
  getBytes,
  type StorageReference,
} from 'firebase/storage';
import { storage } from './client';

/**
 * Upload file to storage
 */
export const uploadFile = async (
  path: string,
  file: File,
  metadata?: any
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadUrl = await downloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload string to storage (e.g., JSON, text)
 */
export const uploadString = async (
  path: string,
  data: string,
  format: 'raw' | 'base64' | 'data_url' | 'base64url' = 'raw'
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, data, format);
    const downloadUrl = await downloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading string:', error);
    throw error;
  }
};

/**
 * Get download URL for a file
 */
export const getFileUrl = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    return await downloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

/**
 * Download file as bytes
 */
export const downloadFile = async (path: string): Promise<ArrayBuffer> => {
  try {
    const storageRef = ref(storage, path);
    return await getBytes(storageRef);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Delete file from storage
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * List files in a directory
 */
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    const urls = await Promise.all(
      result.items.map((itemRef) => downloadURL(itemRef))
    );
    return urls;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Check if file exists
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await getFileUrl(path);
    return true;
  } catch {
    return false;
  }
};
