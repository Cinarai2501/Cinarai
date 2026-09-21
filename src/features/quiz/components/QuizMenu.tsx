import type { QuizConfig } from '@/features/quiz/config/quizzes';
import QuizCard from './QuizCard';

type QuizMenuProps = {
  quizzes: readonly QuizConfig[];
  isLoading?: boolean;
  error?: string | null;
};

export default function QuizMenu({ quizzes, isLoading = false, error = null }: QuizMenuProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-label="Memuat kuis" aria-busy="true">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-52 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {quizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} />)}
    </div>
  );
}
