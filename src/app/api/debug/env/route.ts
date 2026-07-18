import { NextResponse } from 'next/server';
import { getClientEnv } from '@/lib/env.client';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in non-development environments.' }, { status: 404 });
  }

  // Client-required NEXT_PUBLIC_ variables
  const client = getClientEnv();

  // Server-only required variables
  const serverRequired = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];

  const allKeys = Array.from(new Set([...Object.keys(client), ...serverRequired]));

  const result = allKeys.map((key) => {
    const present = typeof process.env[key] !== 'undefined' && process.env[key] !== '' && String(process.env[key]).trim().length > 0;
    return {
      name: key,
      status: present ? '✅ tersedia' : '❌ tidak tersedia',
    };
  });

  return NextResponse.json({ variables: result }, { status: 200 });
}
