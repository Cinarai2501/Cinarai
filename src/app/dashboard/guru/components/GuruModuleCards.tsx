'use client';

type ModuleItem = {
  title: string;
  description: string;
  completed: number;
  progress: number;
  badge: string;
  coverLabel: string;
};

export function GuruModuleCards({ modules }: { modules: ModuleItem[] }) {
  return (
    <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">Modul</p>
          <h2 className="mt-1 text-xl font-black text-neutral-900">Modul CINARAI</h2>
        </div>
        <div className="rounded-full bg-secondary-50 px-3 py-1 text-sm font-semibold text-secondary-700">Preview</div>
      </div>

      {modules.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          Belum ada modul untuk ditampilkan.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-[max-content] lg:grid lg:min-w-0 lg:grid-cols-2 lg:flex-none">
            {modules.map((module) => (
              <div key={module.title} className="min-w-[260px] flex-shrink-0 overflow-hidden rounded-[24px] border border-neutral-100 bg-neutral-50 shadow-sm lg:min-w-0 lg:w-auto">
                <div className="relative h-28 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 text-white">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.5),_transparent_35%)]" />
                  <div className="absolute inset-x-0 bottom-3 px-4">
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-white shadow-sm">
                      {module.coverLabel}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-black text-neutral-900">{module.title}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-primary-700 shadow-sm">
                      {module.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{module.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm text-neutral-500">
                    <span>{module.completed} siswa selesai</span>
                    <span className="font-semibold text-primary-700">{module.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${module.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
