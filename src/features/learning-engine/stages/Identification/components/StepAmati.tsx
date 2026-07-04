'use client';

import { useIdentificationContext } from '../context/IdentificationContext';

export default function StepAmati() {
  const { lokasi, state, setObserveNote, nextStep } = useIdentificationContext();
  const canProceed = state.observe.note.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Hero banner */}
      <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-6 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h2 className="text-xl font-black text-white leading-snug">
          Yuk, Amati Komiknya!
        </h2>
        <p className="mt-1.5 text-sm text-primary-100 leading-relaxed">
          Ingat-ingat cerita di <span className="font-bold text-white">{lokasi}</span>.
          Apa saja yang kamu lihat?
        </p>
      </div>

      {/* Petunjuk ringkas — maks 3 poin */}
      <div className="rounded-2xl bg-secondary-50 border border-secondary-100 px-4 py-4">
        <p className="text-xs font-black uppercase tracking-widest text-secondary-600 mb-3">
          Petunjuk
        </p>
        <ol className="flex flex-col gap-2.5">
          {[
            { emoji: '📖', text: 'Ingat kembali cerita komik yang sudah kamu baca.' },
            { emoji: '👀', text: 'Cari bentuk atau angka matematika di dalam cerita.' },
            { emoji: '✏️', text: 'Tulis apa yang kamu temukan di kotak di bawah ini.' },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary-200 text-xs font-black text-secondary-700 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-secondary-800 leading-relaxed">
                {step.emoji} {step.text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Kotak catatan */}
      <div className="rounded-2xl bg-white border-2 border-secondary-200 px-4 py-4 flex flex-col gap-3">
        <label htmlFor="amati-note" className="flex items-center gap-2">
          <span className="text-xl">📝</span>
          <span className="text-base font-black text-neutral-800">
            Apa yang Kamu Temukan?
          </span>
        </label>
        <textarea
          id="amati-note"
          value={state.observe.note}
          onChange={(e) => setObserveNote(e.target.value)}
          placeholder="Contoh: Saya melihat bentuk kubus pada bangunan candi…"
          rows={4}
          className="w-full resize-none rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-colors"
        />
        {!canProceed && (
          <p className="text-sm font-semibold text-warning-700 bg-warning-50 border border-warning-200 rounded-xl px-3 py-2.5">
            ✏️ Tulis dulu apa yang kamu temukan, baru bisa lanjut ya!
          </p>
        )}
      </div>

      {/* Tombol lanjut */}
      <button
        type="button"
        onClick={nextStep}
        disabled={!canProceed}
        className="flex w-full items-center justify-center gap-2 min-h-[56px] rounded-2xl bg-primary-600 px-5 py-4 text-base font-black text-white shadow-md hover:bg-primary-700 transition-all active:scale-[0.97] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
      >
        {canProceed ? (
          <>
            Lanjut ke Soal
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </>
        ) : (
          'Tulis catatan dulu ya! ✏️'
        )}
      </button>
    </div>
  );
}
