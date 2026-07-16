import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex flex-col items-center justify-center px-4 py-6"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -left-6 bottom-8 h-24 w-24 rounded-full bg-secondary-400/10" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Brand */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex justify-center pt-10 pb-8">
            <Image
              src="/images/logo/logo.png"
              alt="CINARAI"
              width={240}
              height={240}
              priority
              className="h-auto w-[240px] max-w-[70vw] object-contain select-none"
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white shadow-lg px-6 py-8">
          {children}
        </div>

        <p className="text-center text-xs text-primary-300 mt-4">
          Platform Pembelajaran Numerasi Berbasis Etnomatematika
        </p>
      </div>
    </div>
  );
}
