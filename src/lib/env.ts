/**
 * env.ts — Environment variable validation
 *
 * Run at module load time (server-side only).
 * - REQUIRED vars: logs a clear error and throws in development if missing.
 * - OPTIONAL vars: logs a warning if missing so developers notice.
 * - Never crashes in production — logs errors instead.
 *
 * Import this file once at the top of any server entry point or Firebase init file.
 * It is safe to import multiple times (validation runs only once).
 */

const REQUIRED: string[] = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const OPTIONAL: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: 'Required only if using Firebase Realtime Database.',
  FIREBASE_ADMIN_SDK_KEY: 'Required for server-side auth and admin Firestore. Value must be the service account JSON as a single-line string.',
  GEMINI_API_KEY: 'Required for Gemini AI provider.',
  GROQ_API_KEY: 'Required for Groq AI provider.',
  OPENROUTER_API_KEY: 'Required for OpenRouter AI provider.',
  OPENAI_API_KEY: 'Required for OpenAI provider.',
};

let validated = false;

export function validateEnv(): void {
  if (validated) return;
  validated = true;

  // Skip in browser — NEXT_PUBLIC_ vars are inlined at build time, no runtime check needed
  if (typeof window !== 'undefined') return;

  const missing: string[] = [];

  for (const key of REQUIRED) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

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

  for (const [key, hint] of Object.entries(OPTIONAL)) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      console.warn(`[env] Optional variable not set: ${key} — ${hint}`);
    }
  }
}
