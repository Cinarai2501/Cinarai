'use client';

type ActivityItem = {
  id: string;
  title: string;
  time: string;
  detail: string;
};

export function GuruRecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Aktivitas</p>
          <h2 className="mt-1 text-xl font-black text-neutral-900">Aktivitas Terbaru</h2>
        </div>
        <div className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-600">Hari ini</div>
      </div>

      <div className="mt-5 space-y-3">
        {activities.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
            Belum ada aktivitas terbaru siswa.
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 rounded-[20px] border border-neutral-100 bg-neutral-50 p-3">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500" />
              <div>
                <p className="font-semibold text-neutral-900">{activity.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{activity.detail}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">{activity.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
