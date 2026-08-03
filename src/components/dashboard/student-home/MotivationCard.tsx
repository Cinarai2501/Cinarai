'use client';

type MotivationCardProps = {
  motivation: string;
  isLoading?: boolean;
};

export default function MotivationCard({ motivation, isLoading = false }: MotivationCardProps) {
  return (
    <section className="soft-card relative overflow-hidden rounded-[24px] p-3.5 animate-[fadeInUp_0.45s_ease-out_both] transition-all duration-200">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FCFF] via-[#FFFFFF] to-[#F0F8FF] pointer-events-none rounded-[24px]" />

      <div className="absolute top-2 right-3 text-xl opacity-20 pointer-events-none">✨</div>
      <div className="absolute top-6 right-7 text-base opacity-15 pointer-events-none">⭐</div>

      <div className="relative z-10 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-lg">
          <span>✨</span>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold leading-tight text-slate-900">
            Motivasi Belajar Hari Ini
          </h2>

          <div key={isLoading ? 'loading' : motivation} className="animate-motivation-fade">
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700 line-clamp-2">
              {isLoading ? 'Menyiapkan motivasi belajar untukmu...' : motivation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

