'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardPage from '@/components/dashboard/DashboardPage';
import SoftCard from '@/components/ui/SoftCard';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUser } from '@/lib/firebase/auth';

interface FirebaseAccountDetails {
  phoneNumber: string | null;
  providerIds: string[];
}

function isValidIndonesianPhone(value: string): boolean {
  const phone = value.trim().replace(/[\s().-]/g, '');
  return /^(?:08[1-9]\d{7,10}|\+628[1-9]\d{7,10})$/.test(phone);
}

function AccountIcon({ type }: { type: 'email' | 'phone' | 'password' }) {
  if (type === 'email') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (type === 'phone') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <path d="M11 18h2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function AccountSettingsPage() {
  const { user, loading } = useAuth();
  const [firebaseDetails, setFirebaseDetails] = useState<FirebaseAccountDetails | null>(null);
  const [isCheckingProvider, setIsCheckingProvider] = useState(true);
  const [isPhoneFormOpen, setIsPhoneFormOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneNotice, setPhoneNotice] = useState('');

  const userId = user?.uid;

  useEffect(() => {
    if (loading) return;

    const firebaseUser = getCurrentUser();
    if (!firebaseUser || firebaseUser.uid !== userId) {
      setFirebaseDetails(null);
      setIsCheckingProvider(false);
      return;
    }

    setFirebaseDetails({
      phoneNumber: firebaseUser.phoneNumber,
      providerIds: firebaseUser.providerData.map((provider) => provider.providerId),
    });
    setIsCheckingProvider(false);
  }, [loading, userId]);

  const hasPasswordProvider = firebaseDetails?.providerIds.includes('password') ?? false;
  const isGoogleOnly = Boolean(
    firebaseDetails?.providerIds.includes('google.com') &&
    !hasPasswordProvider &&
    firebaseDetails.providerIds.length === 1
  );

  const handlePhoneSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPhoneError('');
    setPhoneNotice('');

    if (!isValidIndonesianPhone(phoneInput)) {
      setPhoneError('Masukkan nomor Indonesia yang valid, seperti 081234567890 atau +6281234567890.');
      return;
    }

    setPhoneNotice('Verifikasi SMS belum tersedia. Nomor belum disimpan agar informasi akunmu tetap aman.');
  };

  const closePhoneForm = () => {
    setIsPhoneFormOpen(false);
    setPhoneError('');
    setPhoneNotice('');
    setPhoneInput('');
  };

  return (
    <DashboardPage
      title="Pengaturan Akun"
      subtitle="Kelola informasi akun CINARAI kamu."
      gradientFrom="#0F766E"
      gradientTo="#14B8A6"
      rightContent={(
        <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-[18px] bg-white/20 text-white">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H5v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V5h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </div>
      )}
      headerAction={(
        <Link
          href="/dashboard/siswa/profil"
          className="inline-flex min-h-9 items-center gap-2 rounded-full px-2 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span aria-hidden="true">←</span>
          Kembali
        </Link>
      )}
      contentClassName="pt-4 sm:pt-5"
    >
      <div className="space-y-4 pb-4">
        <SoftCard as="section" className="rounded-[24px] p-5" aria-labelledby="account-info-title">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <AccountIcon type="email" />
            </div>
            <div className="min-w-0">
              <h2 id="account-info-title" className="text-base font-extrabold text-[#1E293B]">Informasi Akun</h2>
              <p className="mt-0.5 text-xs text-[#64748B]">Email yang terhubung dengan akunmu</p>
            </div>
          </div>
          <div className="mt-4 rounded-[16px] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-[#64748B]">Email</p>
            <p className="mt-1 break-all text-sm font-bold text-[#1E293B]">
              {loading ? 'Memuat email...' : user?.email?.trim() || 'Email belum tersedia'}
            </p>
          </div>
        </SoftCard>

        <SoftCard as="section" className="rounded-[24px] p-5" aria-labelledby="phone-title">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#DCFCE7] text-[#16A34A]">
              <AccountIcon type="phone" />
            </div>
            <div className="min-w-0">
              <h2 id="phone-title" className="text-base font-extrabold text-[#1E293B]">Nomor Telepon</h2>
              <p className="mt-0.5 break-all text-sm font-semibold text-[#64748B]">
                {isCheckingProvider ? 'Memeriksa akun...' : firebaseDetails?.phoneNumber || 'Belum ditambahkan'}
              </p>
            </div>
          </div>
          {!firebaseDetails?.phoneNumber && !isCheckingProvider && (
            <button
              type="button"
              onClick={() => setIsPhoneFormOpen(true)}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-[#0F766E] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">＋</span>
              Tambahkan Nomor Telepon
            </button>
          )}
        </SoftCard>

        <SoftCard as="section" className="rounded-[24px] p-5" aria-labelledby="password-title">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#F3E8FF] text-[#9333EA]">
              <AccountIcon type="password" />
            </div>
            <div className="min-w-0">
              <h2 id="password-title" className="text-base font-extrabold text-[#1E293B]">Password</h2>
              {isCheckingProvider ? (
                <p className="mt-1 text-sm text-[#64748B]">Memeriksa metode masuk...</p>
              ) : hasPasswordProvider ? (
                <>
                  <p aria-label="Password disembunyikan" className="mt-1 text-base tracking-[0.2em] text-[#475569]">••••••••</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#64748B]">Password asli tidak pernah ditampilkan.</p>
                </>
              ) : isGoogleOnly ? (
                <p className="mt-1 text-sm leading-relaxed text-[#64748B]">Akun ini masuk dengan Google. Password dikelola oleh Google.</p>
              ) : (
                <p className="mt-1 text-sm leading-relaxed text-[#64748B]">Akun ini tidak menggunakan password CINARAI.</p>
              )}
            </div>
          </div>
          {!isCheckingProvider && hasPasswordProvider && (
            <Link
              href="/auth/forgot-password"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-[#C4B5FD] bg-[#FAF5FF] px-4 py-3 text-sm font-bold text-[#7E22CE] transition hover:bg-[#F3E8FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9333EA] focus-visible:ring-offset-2"
            >
              Ubah Password
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </SoftCard>
      </div>

      {isPhoneFormOpen && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/55 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePhoneForm();
          }}
        >
          <div className="flex min-h-full items-center justify-center">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="phone-dialog-title"
              className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="phone-dialog-title" className="text-lg font-black text-[#1E293B]">Tambahkan Nomor Telepon</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#64748B]">Masukkan nomor Indonesia yang ingin kamu hubungkan.</p>
                </div>
                <button
                  type="button"
                  onClick={closePhoneForm}
                  aria-label="Tutup form nomor telepon"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl text-[#64748B] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handlePhoneSubmit} className="mt-5 space-y-4">
                <label htmlFor="phone-number" className="block text-sm font-bold text-[#334155]">
                  Nomor Telepon
                  <input
                    id="phone-number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phoneInput}
                    onChange={(event) => {
                      setPhoneInput(event.target.value);
                      setPhoneError('');
                      setPhoneNotice('');
                    }}
                    placeholder="08xxxxxxxxxx atau +628xxxxxxxxxx"
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={phoneError ? 'phone-error' : 'phone-help'}
                    className="mt-2 min-h-12 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-base text-[#1E293B] outline-none transition placeholder:text-sm placeholder:text-slate-400 focus:border-[#0F766E] focus:bg-white focus:ring-4 focus:ring-[#0F766E]/10"
                  />
                </label>
                {phoneError ? (
                  <p id="phone-error" role="alert" className="rounded-[14px] bg-red-50 p-3 text-sm leading-relaxed text-red-700">{phoneError}</p>
                ) : (
                  <p id="phone-help" className="text-xs leading-relaxed text-[#64748B]">Nomor hanya bisa disimpan setelah verifikasi kode SMS.</p>
                )}
                {phoneNotice && (
                  <p role="status" className="rounded-[14px] border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">{phoneNotice}</p>
                )}
                <button
                  type="submit"
                  className="min-h-12 w-full rounded-[16px] bg-[#0F766E] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
                >
                  Simpan
                </button>
              </form>
            </section>
          </div>
        </div>
      )}
    </DashboardPage>
  );
}