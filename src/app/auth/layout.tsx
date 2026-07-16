import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 px-4 py-6 sm:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[420px] flex-col items-center justify-center animate-fade-in-up">
        <div className="relative mb-10 flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-white/15 bg-white/10 px-4 py-8 shadow-[0_25px_70px_rgba(2,16,48,0.25)] backdrop-blur-xl sm:min-h-[320px] sm:px-6">
          <div className="flex items-center justify-center">
            <div className="rounded-[32px] border border-white/20 bg-white/10 p-5 shadow-[0_18px_50px_rgba(2,22,60,0.25)] backdrop-blur-md sm:p-6">
              <Image
                src="/images/logo/logo.png"
                alt="CINARAI"
                width={220}
                height={220}
                priority
                className="h-auto w-[220px] max-w-[70vw] object-contain select-none sm:w-[232px]"
              />
            </div>
          </div>
        </div>

        <div className="relative -mt-8 w-full rounded-[28px] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,30,80,0.18)]">
          {children}
        </div>

        <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100/90">
          Platform Pembelajaran Numerasi Berbasis Etnomatematika
        </p>
      </div>
    </div>
  );
}
