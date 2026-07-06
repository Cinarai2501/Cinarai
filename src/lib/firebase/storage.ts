'use client';

import {
  ref,
  uploadBytes,
  uploadString as fbUploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  getBytes,
} from 'firebase/storage';
import { getFirebaseStorage } from './client';

const getStorageInstance = () => getFirebaseStorage();

export const uploadFile = async (
  path: string,
  file: File,
  metadata?: Parameters<typeof uploadBytes>[2]
): Promise<string> => {
  try {
    const storageRef = ref(getStorageInstance(), path);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const uploadStringData = async (
  path: string,
  data: string,
  format: 'raw' | 'base64' | 'data_url' | 'base64url' = 'raw'
): Promise<string> => {
  try {
    const storageRef = ref(getStorageInstance(), path);
    const snapshot = await fbUploadString(storageRef, data, format);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading string:', error);
    throw error;
  }
};

export const getFileUrl = async (path: string): Promise<string> => {
  try {
    return await getDownloadURL(ref(getStorageInstance(), path));
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

export const downloadFile = async (path: string): Promise<ArrayBuffer> => {
  try {
    return await getBytes(ref(getStorageInstance(), path));
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const deleteFile = async (path: string): Promise<void> => {
  try {
    await deleteObject(ref(getStorageInstance(), path));
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const result = await listAll(ref(getStorageInstance(), path));
    return await Promise.all(result.items.map((itemRef) => getDownloadURL(itemRef)));
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await getFileUrl(path);
    return true;
  } catch {
    return false;
  }
};
