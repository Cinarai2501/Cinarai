export interface FirebaseAdminCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export type FirebaseAdminConfigResult =
  | { ok: true; credentials: FirebaseAdminCredentials }
  | { ok: false; error: string };

type Environment = Record<string, string | undefined>;

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, '\n');
}

export function getFirebaseAdminConfig(env: Environment): FirebaseAdminConfigResult {
  const serializedAccount = nonEmptyString(env.FIREBASE_ADMIN_SDK_KEY);
  if (serializedAccount) {
    let account: unknown;
    try {
      account = JSON.parse(serializedAccount);
    } catch {
      return {
        ok: false,
        error: 'FIREBASE_ADMIN_SDK_KEY must contain valid service-account JSON.',
      };
    }

    if (!account || typeof account !== 'object' || Array.isArray(account)) {
      return {
        ok: false,
        error: 'FIREBASE_ADMIN_SDK_KEY must contain valid service-account JSON.',
      };
    }

    const data = account as Record<string, unknown>;
    const projectId = nonEmptyString(data.project_id);
    const clientEmail = nonEmptyString(data.client_email);
    const privateKey = nonEmptyString(data.private_key);
    if (!projectId || !clientEmail || !privateKey) {
      const missingFields = [
        !projectId && 'project_id',
        !clientEmail && 'client_email',
        !privateKey && 'private_key',
      ].filter((field): field is string => Boolean(field));
      return {
        ok: false,
        error: `FIREBASE_ADMIN_SDK_KEY is missing required service-account fields: ${missingFields.join(', ')}.`,
      };
    }

    return {
      ok: true,
      credentials: {
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
      },
    };
  }

  const projectId = nonEmptyString(env.FIREBASE_PROJECT_ID);
  const clientEmail = nonEmptyString(env.FIREBASE_CLIENT_EMAIL);
  const privateKey = nonEmptyString(env.FIREBASE_PRIVATE_KEY);
  if (!projectId || !clientEmail || !privateKey) {
    const missingVariables = [
      !projectId && 'FIREBASE_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY',
    ].filter((variable): variable is string => Boolean(variable));
    return {
      ok: false,
      error: `Firebase Admin initialization skipped. Missing required env vars: ${missingVariables.join(', ')}. Alternatively, set FIREBASE_ADMIN_SDK_KEY.`,
    };
  }

  return {
    ok: true,
    credentials: {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    },
  };
}
