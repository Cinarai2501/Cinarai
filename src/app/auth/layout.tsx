import { AppLogo } from '@/components/ui/AppLogo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_32%),linear-gradient(135deg,_#0f4c81_0%,_#1976d2_50%,_#4fc3f7_100%)] px-4 py-8 sm:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 right-0 h-44 w-44 rounded-full bg-[#ff9800]/18 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-col items-center justify-center animate-fade-in-up">
        <section className="mb-8 flex w-full flex-col items-center justify-center px-2 pt-3 sm:px-4">
          <div className="relative mb-5 inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#7dc9ff]/40 blur-2xl" />
            <div className="relative animate-hero-float">
              <AppLogo
                variant="login"
                priority
                className="select-none drop-shadow-[0_22px_44px_rgba(8,40,90,0.28)]"
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-[2rem] font-black tracking-[0.28em] text-white sm:text-[2.2rem]">
              CINARAI
            </h1>
            <p className="mt-2 text-sm font-medium tracking-[0.2em] text-blue-100/95 sm:text-base">
              Critical Numeracy with AR & AI
            </p>
          </div>
        </section>

        <div className="relative w-full rounded-[32px] border border-white/70 bg-white/95 p-5 shadow-[0_25px_70px_rgba(15,30,80,0.28)] backdrop-blur-xl sm:p-8 animate-card-enter">
          {children}
        </div>

        <p className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-100/90">
          Platform Pembelajaran Numerasi Berbasis Etnomatematika
        </p>
      </div>
    </div>
  );
}
