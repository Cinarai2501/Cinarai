import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex flex-col items-center justify-center px-4 py-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-10 bottom-10 h-48 w-48 rounded-full bg-secondary-400/20" />
      <div className="pointer-events-none absolute right-10 bottom-20 h-24 w-24 rounded-full bg-accent-400/20" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full bg-white/5" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-white/20 p-2 shadow-lg ring-2 ring-white/30">
            <Image
              src="/images/logo/logo.png"
              alt="CINARAI Logo"
              width={110}
              height={110}
              priority
              className="h-[90px] w-[90px] sm:h-[110px] sm:w-[110px]"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">CINARAI</h1>
          <p className="text-sm text-primary-200 mt-0.5">Critical Numeracy with AR &amp; AI</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white shadow-xl px-6 py-8">
          {children}
        </div>

        <p className="text-center text-xs text-primary-300 mt-4">
          Platform Pembelajaran Numerasi Berbasis Etnomatematika
        </p>
      </div>
    </div>
  );
}
