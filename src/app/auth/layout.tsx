import { AppLogo } from '@/components/ui/AppLogo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_28%),linear-gradient(135deg,_#1F5FBF_0%,_#4FC3F7_100%)] px-3 py-3 sm:px-6"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center animate-fade-in-up">
        <section className="mb-5 flex w-full flex-shrink-0 flex-col items-center justify-center px-1 pt-0 sm:px-4">
          <div className="flex items-center justify-center">
            <div className="relative animate-hero-float">
              <AppLogo
                variant="login"
                priority
                className="select-none"
              />
            </div>
          </div>
        </section>

        <div className="relative w-full flex-1 rounded-[28px] border border-white/70 bg-[#FFFFFF]/95 p-4 shadow-[0_16px_38px_rgba(15,30,80,0.16)] backdrop-blur-xl sm:p-6 animate-card-enter">
          {children}
        </div>
      </div>
    </div>
  );
}
