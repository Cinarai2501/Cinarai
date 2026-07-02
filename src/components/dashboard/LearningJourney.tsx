type JourneyStatus = 'completed' | 'current' | 'locked';

interface JourneyItem {
  title: string;
  status: JourneyStatus;
  progress: number;
}

const journeyItems: JourneyItem[] = [
  { title: 'Komik 1', status: 'completed', progress: 100 },
  { title: 'Komik 2', status: 'current', progress: 20 },
  { title: 'Komik 3', status: 'locked', progress: 0 },
  { title: 'Komik 4', status: 'locked', progress: 0 },
  { title: 'Komik 5', status: 'locked', progress: 0 },
];

const statusLabel: Record<JourneyStatus, string> = {
  completed: 'Completed',
  current: 'Current',
  locked: 'Locked',
};

const statusStyles: Record<JourneyStatus, string> = {
  completed: 'border-accent-200 bg-accent-50 text-accent-700',
  current: 'border-primary-200 bg-primary-50 text-primary-700',
  locked: 'border-neutral-200 bg-neutral-50 text-neutral-400',
};

const markerStyles: Record<JourneyStatus, string> = {
  completed: 'border-accent-500 bg-accent-500 text-white',
  current: 'border-primary-600 bg-white text-primary-700',
  locked: 'border-neutral-300 bg-neutral-100 text-neutral-400',
};

export default function LearningJourney(): React.ReactNode {
  return (
    <section className="rounded-base border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold text-neutral-500">
          Learning Journey
        </p>
        <h2 className="mt-1 text-xl font-bold text-neutral-950">
          Timeline komik
        </h2>
      </div>

      <div className="space-y-0">
        {journeyItems.map((item, index) => {
          const isLastItem = index === journeyItems.length - 1;

          return (
            <article className="relative flex gap-4" key={item.title}>
              <div className="flex w-10 flex-col items-center">
                <div
                  className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${markerStyles[item.status]}`}
                >
                  {index + 1}
                </div>
                {!isLastItem ? (
                  <div className="flex min-h-12 flex-1 flex-col items-center justify-center py-2">
                    <div className="h-full w-px bg-neutral-200" />
                    <span className="text-sm font-bold text-neutral-300">
                      ↓
                    </span>
                  </div>
                ) : null}
              </div>

              <div
                className={`mb-4 flex-1 rounded-base border p-4 ${
                  statusStyles[item.status]
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm font-semibold">
                      {statusLabel[item.status]}
                    </p>
                  </div>
                  <span className="text-sm font-bold">{item.progress}%</span>
                </div>

                <div className="mt-4 h-2 rounded-full bg-white">
                  <div
                    className={`h-2 rounded-full ${
                      item.status === 'completed'
                        ? 'bg-accent-500'
                        : item.status === 'current'
                          ? 'bg-primary-600'
                          : 'bg-neutral-300'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
