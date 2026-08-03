'use client';

type MotivationCardProps = {
  motivation: string;
  isLoading?: boolean;
};

export default function MotivationCard({ motivation, isLoading = false }: MotivationCardProps) {
  return (
    <section className="soft-card relative overflow-hidden rounded-[24px] p-5 sm:p-6 animate-[fadeInUp_0.45s_ease-out_both] transition-all duration-200">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FCFF] via-[#FFFFFF] to-[#F0F8FF] pointer-events-none rounded-[24px]" />

      {/* Decorative accent elements - low opacity */}
      <div className="absolute top-3 right-4 text-2xl opacity-20 pointer-events-none">✨</div>
      <div className="absolute top-8 right-8 text-xl opacity-15 pointer-events-none">⭐</div>

      {/* Main content */}
      <div className="relative z-10 flex items-start gap-4 sm:gap-5">
        {/* Icon circle - 56x56 */}
        <div className="card-accent-icon min-w-fit">
          <span className="text-2xl">✨</span>
        </div>

        {/* Text content */}
        <div className="min-w-0 flex-1 pt-1">
          <h2 className="text-[16px] sm:text-[17px] font-semibold text-slate-900 leading-tight">
            Motivasi Belajar Hari Ini
          </h2>
          
          {/* Motivation text with fade animation - key changes to trigger re-animation */}
          <div key={isLoading ? 'loading' : motivation} className="animate-motivation-fade">
            <p className="mt-3 text-[15px] sm:text-[15.5px] leading-relaxed text-slate-700 line-clamp-2">
              {isLoading ? 'Menyiapkan motivasi belajar untukmu...' : motivation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

