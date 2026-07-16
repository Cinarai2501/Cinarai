import dotenv from 'dotenv';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const REQUIRED_SERVER = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] as const;

const OPTIONAL_SERVER: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: 'Required only if using Firebase Realtime Database.',
  GEMINI_API_KEY: 'Required for Gemini AI provider.',
  GROQ_API_KEY: 'Required for Groq AI provider.',
  OPENROUTER_API_KEY: 'Required for OpenRouter AI provider.',
  OPENAI_API_KEY: 'Required for OpenAI provider.',
};

let validated = false;

export function validateEnv(): void {
  if (validated) return;
  validated = true;

  if (typeof window !== 'undefined') return;

  const missing = REQUIRED_SERVER.filter((key) => {
    const value = process.env[key];
    return !value || value.trim() === '';
  });

  if (missing.length > 0) {
    const lines = [
      '',
      '╔══════════════════════════════════════════════════════════════╗',
      '║         CINARAI — Missing Required Environment Variables     ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      'The following required variables are not set in .env.local:',
      '',
      ...missing.map((k) => `  ✗  ${k}`),
      '',
      'Copy .env.example to .env.local and fill in the values:',
      '  cp .env.example .env.local',
      '',
    ].join('\n');

    if (process.env.NODE_ENV === 'development') {
      throw new Error(lines);
    } else {
      console.error(lines);
    }
  }

  for (const [key, hint] of Object.entries(OPTIONAL_SERVER)) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      console.warn(`[env.server] Optional variable not set: ${key} — ${hint}`);
    }
  }
}
