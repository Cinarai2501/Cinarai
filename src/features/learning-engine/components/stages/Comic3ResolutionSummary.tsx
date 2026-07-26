'use client';
import { packageContent as comic3Package } from '@/features/comics/comic-3/content/packageContent';

export default function Comic3ResolutionSummary({ comic, onContinue }: { comic: { lokasi?: string; id?: number }; onContinue: () => void }) {
  const shapes = comic3Package.learningObjects ?? [];

  const eduSummary = (comic3Package.metadata?.learningTargets ?? []).slice(0, 3).join(' ');

  return (
    <div className="overflow-hidden rounded-[24px] bg-white px-5 py-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-neutral-900">Ringkasan Pembelajaran</h2>
        <div className="rounded-full bg-green-50 px-3 py-1 text-sm font-black text-green-700">Materi Selesai</div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-700">Berikut ringkasan semua bangun datar yang telah kamu pelajari di {comic.lokasi ?? 'komik ini'}.</p>

      <ul className="mt-4 space-y-3">
        {shapes.map((s) => {
          const chars = Array.isArray((s as any).characteristics) ? (s as any).characteristics as string[] : [];
          const summary = chars.length === 0 ? s.description ?? '' : chars.slice(0, 2).join(' dan ');
          return (
            <li key={s.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
              <p className="font-black text-sm text-neutral-900">{s.title}</p>
              <p className="mt-1 text-sm text-neutral-700">{summary}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 rounded-[12px] border border-primary-100 bg-primary-50 px-4 py-4">
        <p className="font-black text-sm text-primary-700">Hari ini kamu berhasil:</p>
        <ul className="mt-2 list-inside list-disc text-sm text-neutral-800">
          <li> Mengamati objek</li>
          <li> Mengenali bentuk</li>
          <li> Memberikan alasan</li>
          <li> Berdiskusi dengan AI Tutor</li>
        </ul>
      </div>

      <div className="mt-4 rounded-[12px] border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-800">
        <p className="font-semibold">Ringkasan edukatif</p>
        <p className="mt-2 text-sm leading-relaxed">{eduSummary || comic3Package.report?.summary || 'Kamu telah memahami ciri-ciri bangun datar dasar.'}</p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700"
      >
        Lanjut ke Application
      </button>
    </div>
  );
}
