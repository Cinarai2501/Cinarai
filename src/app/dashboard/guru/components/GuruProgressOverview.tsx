'use client';

type ProgressItem = {
  label: string;
  value: number;
};

export function GuruProgressOverview({ items }: { items: ProgressItem[] }) {
  return (
    <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Progress</p>
          <h2 className="mt-1 text-xl font-black text-neutral-900">Progress Pembelajaran</h2>
        </div>
        <div className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">Kelas</div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-neutral-50 p-5 text-center text-sm text-neutral-500">
          Belum ada data progress kelas saat ini.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-neutral-700">{item.label}</span>
                <span className="font-black text-primary-700">{item.value}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
