import DashboardPage from '@/components/dashboard/DashboardPage';
import QuizMenu from '@/features/quiz/components/QuizMenu';
import { QUIZ_CONFIGS } from '@/features/quiz/config/quizzes';

export default function DashboardSiswaKuisPage() {
  return (
    <DashboardPage
      title="Kuis"
      subtitle="Pilih kuis komik yang ingin kamu kerjakan."
      gradientFrom="#FF6B00"
      gradientTo="#FF8800"
      rightContent={
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-white/20 p-0.5 shadow-md ring-2 ring-white/50 backdrop-blur-sm">
          <span className="text-[40px] leading-none drop-shadow-md" aria-hidden="true">🏆</span>
        </div>
      }
    >
      <section aria-labelledby="quiz-menu-title" className="space-y-5 pb-6">
        <div>
          <h1 id="quiz-menu-title" className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            Menu Kuis
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kerjakan kuis sesuai komik yang sedang kamu pelajari.
          </p>
        </div>

        <QuizMenu quizzes={QUIZ_CONFIGS} />
      </section>
    </DashboardPage>
  );
}
