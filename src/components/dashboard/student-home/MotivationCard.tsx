'use client';

type MotivationCardProps = {
  motivation: string;
  isLoading?: boolean;
};

export default function MotivationCard({ motivation, isLoading = false }: MotivationCardProps) {
  return (
    <section className="soft-card rounded-[24px] p-4 sm:p-5 animate-[fadeInUp_0.45s_ease-out_both] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.8 4.7L19 9l-4.2 2.3L14 16l-2-3.7L8 16l.2-4.7L5 9l5.2-1.3L12 3z" />
            <path d="M5 19h14" />
          </svg>
        </div>

        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-slate-900">🌟 Motivasi Belajar Hari Ini</h2>
          <p className="mt-2 text-[14px] leading-6 text-slate-600">
            {isLoading ? 'Menyiapkan motivasi belajar untukmu...' : motivation}
          </p>
        </div>
      </div>
    </section>
  );
}
