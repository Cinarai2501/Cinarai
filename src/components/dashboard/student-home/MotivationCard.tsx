'use client';

type MotivationCardProps = {
  motivation: string;
  isLoading?: boolean;
};

export default function MotivationCard({ motivation, isLoading = false }: MotivationCardProps) {
  return (
    <section className="soft-card relative overflow-hidden rounded-[24px] p-6 sm:p-7 animate-[fadeInUp_0.45s_ease-out_both] transition-all duration-200">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FCFF] via-[#FFFFFF] to-[#F0F8FF] pointer-events-none rounded-[24px]" />

      <div className="absolute top-4 right-4 flex flex-col items-end gap-1 text-[18px] text-slate-900/10 pointer-events-none">
        <span>✨</span>
        <span className="text-[14px]">⭐</span>
        <span className="text-[12px]">🌈</span>
      </div>

      <div className="relative z-10 flex items-start gap-4 sm:gap-5">
        <div className="card-accent-icon flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF5FF] text-3xl shadow-sm">
          <span>✨</span>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-[22px] font-semibold leading-tight text-slate-900">
            Motivasi Belajar Hari Ini
          </h2>

          <div key={isLoading ? 'loading' : motivation} className="mt-3 animate-motivation-fade">
            <p className="text-[16px] font-medium leading-7 text-slate-700 line-clamp-2">
              {isLoading ? 'Menyiapkan motivasi belajar untukmu...' : motivation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

