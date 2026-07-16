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
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { signUp, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Password tidak cocok. Coba lagi ya! 😊');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, displayName, role);
      router.push(getRoleBasedDashboardPath(role));
    } catch (err) {
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60 transition-colors';

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
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            className={inputClass}
          />
          <p className="text-xs text-neutral-400">Minimal 6 karakter</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700">
            Konfirmasi Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            className={inputClass}
          />
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
              Guru
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
