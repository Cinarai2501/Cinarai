'use client';

import { useIdentificationContext } from '../context/IdentificationContext';

export default function StepAmati() {
  const { lokasi, state, setObserveNote } = useIdentificationContext();
  const canProceed = state.observe.note.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      <div className="rounded-[24px] border-2 border-neutral-100 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-black text-neutral-900 sm:text-xl">🔍 Yuk, Amati Komiknya!</h2>
        <p className="mt-1 text-base text-neutral-500">
          Ingat cerita di <span className="font-bold text-primary-600">{lokasi}</span>. Apa saja yang kamu lihat?
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="amati-note" className="text-base font-black text-neutral-700">
          📝 Apa yang kamu temukan?
        </label>
        <textarea
          id="amati-note"
          value={state.observe.note}
          onChange={(e) => setObserveNote(e.target.value)}
          placeholder="Contoh: Saya melihat bentuk kubus pada bangunan candi…"
          rows={5}
          className="w-full min-h-[160px] resize-none rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 text-base text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
        {!canProceed && (
          <p className="text-base font-bold text-warning-700">
            ✏️ Tulis dulu apa yang kamu temukan, baru bisa lanjut ya!
          </p>
        )}
      </div>

    </div>
  );
}
