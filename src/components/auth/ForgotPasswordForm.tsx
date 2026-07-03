'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error('Reset password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-3xl">
            📬
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900">Email Terkirim!</h2>
            <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
              Cek email kamu dan ikuti instruksi untuk reset password.
            </p>
          </div>
        </div>
        <Link
          href="/auth/login"
          className="block w-full rounded-2xl bg-primary-600 px-4 py-3.5 text-sm font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition-all text-center"
        >
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-neutral-900">Lupa Password?</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Kami akan kirim link reset ke emailmu 📧</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-error-50 border border-error-200 px-4 py-3">
          <span className="text-lg flex-shrink-0">😕</span>
          <p className="text-sm text-error-700 leading-snug">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-primary-600 px-4 py-3.5 text-sm font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Mengirim...' : 'Kirim Link Reset 📨'}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        Ingat password?{' '}
        <Link href="/auth/login" className="font-bold text-primary-600 hover:text-primary-700">
          Kembali ke login
        </Link>
      </p>
    </div>
  );
};
