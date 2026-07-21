import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminFirestore, adminInitializationError } from '@/lib/firebase/admin';
import type { UserDocument, UserRole } from '@/types/firestore';
import { isAllowedUserRole } from '@/lib/auth/role';
import debug from '@/lib/debug';

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!adminFirestore || !adminAuth) {
      const message = adminInitializationError || 'Firebase Admin not initialized';
      debug('[api/auth/signup] Admin not initialized', { message });
      return NextResponse.json(
        { error: message, code: 'ADMIN_UNAVAILABLE' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = body.password as string | undefined;
    const displayName = (body.displayName as string | undefined)?.trim();
    const role = body.role as unknown;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required and must be valid', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters', code: 'INVALID_PASSWORD' },
        { status: 400 }
      );
    }

    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required', code: 'INVALID_DISPLAY_NAME' },
        { status: 400 }
      );
    }

    let userRole: UserRole = 'student';
    if (isAllowedUserRole(role)) {
      userRole = role;
    }

    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        {
          error: 'Email sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.',
          code: 'EMAIL_EXISTS',
        },
        { status: 400 }
      );
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code !== 'auth/user-not-found') {
        debug('[api/auth/signup] Unexpected error checking auth user', { error: String(err) });
        throw err;
      }
    }

    const firestore = adminFirestore;
    const existingUsers = await firestore.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUsers.empty) {
      return NextResponse.json(
        {
          error: 'Email sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.',
          code: 'EMAIL_EXISTS_FIRESTORE',
        },
        { status: 400 }
      );
    }

    let uid: string;
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
      });
      uid = userRecord.uid;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      debug('[api/auth/signup] Firebase Auth error', { code: error.code, message: error.message });

      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json(
          {
            error: 'Email sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.',
            code: 'EMAIL_EXISTS_AUTH',
          },
          { status: 400 }
        );
      }

      throw err;
    }

    const userData: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      uid,
      email,
      displayName,
      photoURL: undefined,
      role: userRole,
      isActive: true,
      duplicate: false,
      lastLoginAt: undefined,
    };

    await firestore.collection('users').doc(uid).set(
      {
        ...userData,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    debug('[api/auth/signup] User created successfully', { uid, email, role: userRole });

    return NextResponse.json(
      { uid, email, displayName, role: userRole },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    debug('[api/auth/signup] Unhandled error', { error: message });
    return NextResponse.json(
      { error: 'Failed to create account. Please try again later.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
