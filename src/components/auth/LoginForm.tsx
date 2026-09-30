'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getRoleBasedDashboardPath } from '@/lib/auth/redirects';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading, signIn, signInWithGoogle, error, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(getRoleBasedDashboardPath(user.role));
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col justify-between gap-3">
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF6FF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1F5FBF]">
          <span className="h-2 w-2 rounded-full bg-[#4FC3F7]" />
          Akses ruang belajar
        </div>
        <div>
          <h2 className="text-[1.1rem] font-black text-[#1E293B]">Masuk ke CINARAI</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Lanjutkan perjalanan numerasi Anda dengan AI yang siap membantu.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-[16px] border border-[#f5c2c7] bg-[#fff5f6] px-3 py-2 shadow-sm">
          <span className="text-lg leading-none">⚠️</span>
          <p className="text-sm leading-snug text-[#b42318]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="space-y-1">
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <EmailIcon />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@contoh.com"
              required
              disabled={isLoading}
              className="h-[50px] w-full rounded-[16px] border border-slate-200 bg-[#F8FAFC] py-3 pl-10 pr-3 text-sm text-[#1E293B] shadow-sm placeholder:text-slate-400 focus:border-[#1F5FBF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4FC3F7]/20 disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <PasswordIcon />
            </span>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="h-[50px] w-full rounded-[16px] border border-slate-200 bg-[#F8FAFC] py-3 pl-10 pr-3 text-sm text-[#1E293B] shadow-sm placeholder:text-slate-400 focus:border-[#1F5FBF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4FC3F7]/20 disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-[#1F5FBF] transition-colors hover:text-[#163d7d]"
          >
            Lupa password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group flex h-[50px] w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#1F5FBF] to-[#4FC3F7] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(31,95,191,0.24)] transition-all hover:from-[#225fb9] hover:to-[#64d0f8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span>{isLoading ? 'Sedang masuk...' : 'Masuk'}</span>
          <span className="text-base transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          atau
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        Masuk dengan Google
      </button>

      <p className="text-center text-xs text-slate-500">
        Belum punya akun?{' '}
        <Link href="/auth/signup" className="font-bold text-[#1F5FBF] transition-colors hover:text-[#163d7d]">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 7 8-7" />
    </svg>
  );
}

function PasswordIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="10" width="16" height="10" rx="3" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" />
    </svg>
  );
}
