'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword, signIn, signInWithGoogle } from '@/lib/firebase/auth';

type AuthAction = 'email' | 'google' | 'reset' | null;

const firebaseErrorMessages: Record<string, string> = {
  'auth/invalid-email': 'Format email belum valid.',
  'auth/user-disabled': 'Akun ini sedang dinonaktifkan.',
  'auth/user-not-found': 'Email belum terdaftar.',
  'auth/wrong-password': 'Password yang dimasukkan belum sesuai.',
  'auth/invalid-credential': 'Email atau password belum sesuai.',
  'auth/popup-closed-by-user': 'Login Google dibatalkan.',
  'auth/network-request-failed': 'Koneksi bermasalah. Coba lagi sebentar.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
};

const getAuthErrorMessage = (error: unknown): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return firebaseErrorMessages[error.code] ?? 'Login gagal. Coba lagi.';
  }

  return 'Login gagal. Coba lagi.';
};

export default function LoginPage(): React.ReactNode {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeAction, setActiveAction] = useState<AuthAction>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isLoading = activeAction !== null;
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !isLoading,
    [email, password, isLoading]
  );

  const goToDashboard = (): void => {
    router.push('/dashboard');
  };

  const handleEmailLogin = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setError('');
    setNotice('');
    setActiveAction('email');

    try {
      await signIn(email.trim(), password);
      goToDashboard();
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
    } finally {
      setActiveAction(null);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    setError('');
    setNotice('');
    setActiveAction('google');

    try {
      await signInWithGoogle();
      goToDashboard();
    } catch (googleError) {
      setError(getAuthErrorMessage(googleError));
    } finally {
      setActiveAction(null);
    }
  };

  const handleForgotPassword = async (): Promise<void> => {
    setError('');
    setNotice('');

    if (!email.trim()) {
      setError('Masukkan email dulu untuk reset password.');
      return;
    }

    setActiveAction('reset');

    try {
      await resetPassword(email.trim());
      setNotice('Link reset password sudah dikirim ke email.');
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError));
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-primary-50 px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
        <div className="hidden md:block">
          <div className="max-w-md">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-base bg-primary-600 text-2xl font-bold text-white shadow-md">
              C
            </div>
            <h1 className="text-4xl font-bold leading-tight text-primary-900">
              CINARAI
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Critical Numeracy with AR & AI untuk pengalaman belajar yang
              fokus, aman, dan mudah diakses.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-base border border-primary-100 bg-white p-5 shadow-lg sm:p-7">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-base bg-primary-600 text-xl font-bold text-white shadow-sm md:hidden">
              C
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary-600">
              CINARAI
            </p>
            <h2 className="mt-2 text-2xl font-bold text-neutral-950">
              Masuk ke akun
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleEmailLogin}>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-neutral-700"
                htmlFor="email"
              >
                Email
              </label>
              <input
                autoComplete="email"
                className="w-full rounded-base border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                disabled={isLoading}
                id="email"
                inputMode="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-neutral-700"
                htmlFor="password"
              >
                Password
              </label>
              <input
                autoComplete="current-password"
                className="w-full rounded-base border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                disabled={isLoading}
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                required
                type="password"
                value={password}
              />
            </div>

            <div className="flex justify-end">
              <button
                className="text-sm font-semibold text-primary-700 hover:text-primary-800 disabled:cursor-not-allowed disabled:text-neutral-400"
                disabled={isLoading}
                onClick={handleForgotPassword}
                type="button"
              >
                {activeAction === 'reset' ? 'Mengirim...' : 'Forgot Password'}
              </button>
            </div>

            {error ? (
              <p
                className="rounded-base border border-error-200 bg-error-50 px-4 py-3 text-sm font-medium text-error-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {notice ? (
              <p className="rounded-base border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700">
                {notice}
              </p>
            ) : null}

            <button
              className="flex w-full items-center justify-center rounded-base bg-primary-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              disabled={!canSubmit}
              type="submit"
            >
              {activeAction === 'email' ? 'Loading...' : 'Login'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs font-medium uppercase text-neutral-400">
              atau
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <button
            className="flex w-full items-center justify-center gap-3 rounded-base border border-neutral-300 bg-white px-4 py-3 text-base font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            type="button"
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-primary-600"
            >
              G
            </span>
            {activeAction === 'google' ? 'Loading...' : 'Google Login'}
          </button>
        </div>
      </section>
    </main>
  );
}
