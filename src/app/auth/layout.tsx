import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0F6DDB] via-[#2E8CF5] to-[#1976D2] px-4 py-6 sm:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-sky-200/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-cyan-100/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[420px] flex-col items-center justify-center animate-fade-in-up">
        <div className="relative mb-10 flex min-h-[300px] w-full items-center justify-center overflow-hidden px-4 py-8 sm:min-h-[320px] sm:px-6">
          <div className="flex items-center justify-center pt-8">
            <Image
              src="/images/logo/logo.png"
              alt="CINARAI"
              width={300}
              height={300}
              priority
              className="h-auto w-[230px] max-w-[72vw] object-contain select-none drop-shadow-[0_12px_32px_rgba(0,70,170,0.18)] sm:w-[260px] lg:w-[300px]"
            />
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
