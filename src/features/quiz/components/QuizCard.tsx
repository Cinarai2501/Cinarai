import type { QuizConfig } from '@/features/quiz/config/quizzes';
import QuizLauncher from './QuizLauncher';

type QuizCardProps = {
  quiz: QuizConfig;
};

const STATUS_CONTENT = {
  available: {
    label: 'Tersedia',
    button: 'Mulai Kuis',
    badgeClassName: 'bg-emerald-100 text-emerald-700',
  },
  not_configured: {
    label: 'Belum dikonfigurasi',
    button: 'Segera Hadir',
    badgeClassName: 'bg-amber-100 text-amber-700',
  },
  pending_audit: {
    label: 'Menunggu Audit',
    button: 'Menunggu Audit',
    badgeClassName: 'bg-orange-100 text-orange-700',
  },
} as const;

export default function QuizCard({ quiz }: QuizCardProps) {
  const status = STATUS_CONTENT[quiz.status];

  return (
    <article className="flex min-h-52 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E8] text-2xl" aria-hidden="true">
              📝
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Komik {quiz.comicId}</p>
              <h2 className="break-words text-lg font-extrabold leading-tight text-slate-900">{quiz.title}</h2>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${status.badgeClassName}`}>
            {status.label}
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-600">{quiz.description}</p>
          {quiz.questionCount > 0 && <p className="mt-2 text-xs font-medium text-slate-400">{quiz.questionCount} soal</p>}
        {quiz.platform && <p className="mt-2 text-xs font-medium text-slate-400">{quiz.platform === 'wayground' ? 'Wayground' : quiz.platform}</p>}
      </div>

      <div className="mt-5">
        <QuizLauncher
          type={quiz.type}
          href={quiz.type === 'internal' ? `/dashboard/siswa/kuis/${quiz.id}` : undefined}
          quizUrl={quiz.quizUrl}
          disabled={quiz.status !== 'available'}
        >
          {status.button}
        </QuizLauncher>
      </div>
    </article>
  );
}
