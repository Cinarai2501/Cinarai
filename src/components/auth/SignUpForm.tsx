'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getRoleBasedDashboardPath } from '@/lib/auth/redirects';
import { getFirestoreDocument, upsertUser } from '@/services/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserRole } from '@/types/firestore';

export const SignUpForm: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [teacherUnavailableNotification, setTeacherUnavailableNotification] = useState(false);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleRole, setGoogleRole] = useState<'student' | 'teacher' | null>(null);
  const [googleError, setGoogleError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleCompleting, setIsGoogleCompleting] = useState(false);
  const googleCompletionRef = useRef(false);
  const { signUp, authenticateWithGoogleForRegistration, error, clearError } = useAuth();
  const router = useRouter();

  const getGoogleErrorMessage = (err: unknown) => {
    const code = (err as { code?: string })?.code;
    switch (code) {
      case 'auth/popup-closed-by-user':
        return 'Jendela Google ditutup. Silakan coba lagi jika ingin melanjutkan.';
      case 'auth/popup-blocked':
        return 'Browser memblokir jendela Google. Izinkan pop-up untuk melanjutkan.';
      case 'auth/account-exists-with-different-credential':
        return 'Email ini sudah terdaftar dengan metode masuk lain. Silakan masuk menggunakan metode tersebut.';
      case 'auth/cancelled-popup-request':
        return 'Permintaan Google sebelumnya masih diproses. Silakan tunggu sebentar lalu coba lagi.';
      default:
        return 'Pendaftaran dengan Google gagal. Silakan coba lagi.';
    }
  };

  const handleGoogleRegister = async () => {
    if (isGoogleLoading || isGoogleCompleting) return;
    clearError();
    setGoogleError('');
    setIsGoogleLoading(true);
    try {
      const firebaseUser = await authenticateWithGoogleForRegistration();
      const existingUser = await getFirestoreDocument('users', firebaseUser.uid);

      if (existingUser) {
        const existingRole = existingUser.role;
        if (existingRole === 'student' || existingRole === 'teacher' || existingRole === 'admin') {
          router.replace(getRoleBasedDashboardPath(existingRole));
          return;
        }
        setGoogleError('Profil Google ini memiliki role yang tidak valid. Hubungi admin.');
        return;
      }

      setGoogleUser(firebaseUser);
      setGoogleRole(null);
    } catch (err) {
      console.error('Google registration error:', err);
      setGoogleError(getGoogleErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCompleteGoogleRegistration = async () => {
    if (!googleUser || !googleRole || googleCompletionRef.current) return;
    googleCompletionRef.current = true;
    setIsGoogleCompleting(true);
    setGoogleError('');
    try {
      const existingUser = await getFirestoreDocument('users', googleUser.uid);
      if (existingUser) {
        const existingRole = existingUser.role;
        if (existingRole === 'student' || existingRole === 'teacher' || existingRole === 'admin') {
          router.replace(getRoleBasedDashboardPath(existingRole));
          return;
        }
        throw new Error('Profil Google ini memiliki role yang tidak valid.');
      }

      const role: UserRole = googleRole;
      await upsertUser({
        uid: googleUser.uid,
        email: googleUser.email ?? '',
        displayName: googleUser.displayName ?? googleUser.email ?? 'Pengguna Google',
        role,
        isActive: true,
        duplicate: false,
        ...(googleUser.photoURL ? { photoURL: googleUser.photoURL } : {}),
      });
      router.replace(getRoleBasedDashboardPath(role));
    } catch (err) {
      console.error('Google profile creation error:', err);
      setGoogleError('Akun Google berhasil masuk, tetapi profil belum dapat disimpan. Silakan coba lagi.');
      googleCompletionRef.current = false;
    } finally {
      setIsGoogleCompleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    setTeacherUnavailableNotification(false);

    const trimmedDisplayName = displayName.trim();
    const normalizedEmail = email.trim();

    if (!trimmedDisplayName) {
      setValidationError('Nama lengkap wajib diisi.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Password tidak cocok. Coba lagi ya! 😊');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password minimal 6 karakter.');
      return;
    }

    // Check role before Firebase Authentication
    if (role === 'teacher') {
      setTeacherUnavailableNotification(true);
      return;
    }

    setIsLoading(true);
    try {
      await signUp(normalizedEmail, password, trimmedDisplayName, role);
      router.push(getRoleBasedDashboardPath(role));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pendaftaran gagal. Silakan coba lagi.';
      const normalizedMessage = message.includes('Missing or insufficient permissions')
        ? 'Pendaftaran belum selesai. Data akun tidak bisa disimpan. Silakan coba lagi.'
        : message;
      console.error('Sign up error:', err);
      setValidationError(normalizedMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-12 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60 transition-colors';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-neutral-900">Daftar</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Bergabunglah sekarang! 🎉</p>
      </div>

      {(error || validationError) && (
        <div className="flex items-start gap-3 rounded-2xl bg-error-50 border border-error-200 px-4 py-3">
          <span className="text-lg flex-shrink-0">😕</span>
          <p className="text-sm text-error-700 leading-snug">{error || validationError}</p>
        </div>
      )}

      {teacherUnavailableNotification && (
        <div className="flex items-start gap-3 rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3">
          <span className="text-lg flex-shrink-0">👨‍🏫</span>
          <div className="text-sm text-blue-700 leading-snug">
            <p className="font-semibold">Fitur Guru sedang dalam perbaikan</p>
            <p className="mt-1">Pendaftaran akun Guru untuk sementara belum tersedia. Silakan gunakan pendaftaran Siswa terlebih dahulu.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="block text-sm font-semibold text-neutral-700">
            Nama Lengkap
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nama kamu"
            required
            disabled={isLoading}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-semibold text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kamu@contoh.com"
            required
            disabled={isLoading}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-semibold text-neutral-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className={inputClass}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
                  <path d="M9.88 5.5A10.7 10.7 0 0 1 12 5.25c4.66 0 8.44 3.25 10.5 6.75-.9 1.44-2.22 2.78-3.85 3.85" />
                  <path d="M6.71 6.71A16.2 16.2 0 0 0 1.5 12c2.06 3.5 5.84 6.75 10.5 6.75a11.8 11.8 0 0 0 4.04-.7" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-neutral-400">Minimal 6 karakter</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className={inputClass}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {showConfirmPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
                  <path d="M9.88 5.5A10.7 10.7 0 0 1 12 5.25c4.66 0 0 3.25 10.5 6.75-.9 1.44-2.22 2.78-3.85 3.85" />
                  <path d="M6.71 6.71A16.2 16.2 0 0 0 1.5 12c2.06 3.5 5.84 6.75 10.5 6.75a11.8 11.8 0 0 0 4.04-.7" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-neutral-700">Pilih Peran</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole('student')}
              disabled={isLoading}
              className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                role === 'student'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600'
              } disabled:opacity-60`}
            >
              Siswa
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              disabled={isLoading}
              className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                role === 'teacher'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600'
              } disabled:opacity-60`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>Guru</span>
                <span className="text-xs font-normal text-neutral-400">Sedang dalam perbaikan</span>
              </div>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-primary-600 px-4 py-3.5 text-sm font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Mendaftar...' : 'Daftar Sekarang 🚀'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">atau</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={isLoading || isGoogleLoading || isGoogleCompleting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {isGoogleLoading ? 'Menghubungkan ke Google...' : 'Daftar dengan Google'}
      </button>

      {googleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="google-role-title">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="google-role-title" className="text-xl font-black text-neutral-900">Pilih Peran Anda</h2>
              <button
                type="button"
                onClick={() => {
                  setGoogleUser(null);
                  setGoogleRole(null);
                  setGoogleError('');
                }}
                disabled={isGoogleCompleting}
                aria-label="Tutup pemilihan role"
                className="rounded-lg px-2 py-1 text-xl leading-none text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-500">Bagaimana Anda akan menggunakan CINARAI?</p>
            <div className="mt-5 space-y-3">
              <RoleOption selected={googleRole === 'student'} onClick={() => setGoogleRole('student')} title="Siswa" description="Belajar menggunakan komik, AR, dan aktivitas numerasi." />
              <RoleOption selected={googleRole === 'teacher'} onClick={() => setGoogleRole('teacher')} title="Guru" description="Mengelola pembelajaran dan memantau perkembangan siswa." />
            </div>
            {googleError && <p className="mt-4 text-sm text-error-700">{googleError}</p>}
            <button
              type="button"
              onClick={handleCompleteGoogleRegistration}
              disabled={!googleRole || isGoogleCompleting}
              className="mt-6 w-full rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {isGoogleCompleting ? 'Menyimpan profil...' : 'Lanjutkan'}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-neutral-500">
        Sudah punya akun?{' '}
        <Link href="/auth/login" className="font-bold text-primary-600 hover:text-primary-700">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
};

function RoleOption({ selected, onClick, title, description }: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${selected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}
      aria-pressed={selected}
    >
      <span className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-primary-600' : 'border-neutral-300'}`}>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />}
        </span>
        <span>
          <span className="block text-sm font-bold text-neutral-900">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-neutral-500">{description}</span>
        </span>
      </span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
