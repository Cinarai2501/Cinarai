'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getRoleBasedDashboardPath } from '@/lib/auth/redirects';

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
  const { signUp, error, clearError } = useAuth();
  const router = useRouter();

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

      <p className="text-center text-sm text-neutral-500">
        Sudah punya akun?{' '}
        <Link href="/auth/login" className="font-bold text-primary-600 hover:text-primary-700">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
};
