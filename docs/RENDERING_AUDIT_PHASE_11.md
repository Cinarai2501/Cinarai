# Audit Rendering Cinarai - Fase 11

Tanggal audit: 2026-08-28
Branch: `main`
Metode: inspeksi component tree, context value/consumer, prop identity, kalkulasi render, effect/fetch lifecycle, dan ukuran/karakter daftar. Tidak ada perubahan kode pada fase ini.

## 1. Ringkasan

Temuan utama:

1. **Dashboard guru menghitung dan membentuk data pada setiap render**: `topStudents` selalu melakukan spread + sort, sementara detail dan filter bergantung pada state/context yang sering berubah.
2. **Dashboard guru meneruskan callback inline ke child** (`onClick`, `onSearch`, `onSelect` dan callback action), yang membuat child menerima identity baru setiap render. Dampaknya lebih tinggi bila child tidak memoized secara efektif.
3. **`GuruReportClient` melakukan kalkulasi O(rows x activities/reflections)**: untuk setiap progress row, seluruh activity/reflection difilter dan di-sort ulang. Ini dapat menjadi bottleneck saat data guru bertambah.
4. **`LearningEngineContext` adalah context besar dengan value object yang berubah saat banyak state berubah**, sehingga semua consumer context berpotensi rerender. Sebagian perubahan memang diperlukan, tetapi fanout perlu profiling.
5. **Learning stage memiliki daftar kecil/terbatas**, sehingga virtualization belum diperlukan. Daftar komik saat ini hanya sekitar enam item.
6. **Beberapa fetch berada di effect yang benar secara lifecycle tetapi overlap dengan subscription/provider**, sehingga issue utamanya adalah duplicate data work, bukan fetch saat render.

Tidak ditemukan pemanggilan fetch langsung di body render. Fetch yang diperiksa berada di `useEffect` atau event handler.

## 2. Component Tree Utama

### Root

`src/app/layout.tsx` memasang `AuthProvider` dan `SnackbarProvider` untuk seluruh route. Perubahan auth/snackbar dapat memengaruhi subtree, terutama consumer context.

### Learning engine

`LearningEngine` membungkus:

- `ComicReadingProgressProvider`;
- `LearningEngineProvider`;
- `LearningEngineInner`;
- `LearningLayout` dan `StageRouter`.

`StageRouter` sekarang lazy-load per stage melalui `next/dynamic`, sehingga stage yang tidak aktif tidak harus dirender/dibawa dalam initial component chunk.

### Dashboard siswa

`StudentHome` mengonsumsi auth dan all-comic progress, menghitung unlock/progress/statistik, lalu merender header, continue card, motivation card, statistics grid, dan bottom nav.

### Dashboard guru

`GuruDashboardPage` mengonsumsi `useGuruDashboard`, filter rows, detail hook, insight hook, dan merender header/overview/directory/detail/AI panel berdasarkan tab/selected student.

## 3. Prop Identity dan Rerender

### P1 - Callback inline dashboard guru

File: `src/app/dashboard/guru/page.tsx`

Callback berikut dibuat sebagai function baru setiap render:

- `handleLogout`;
- `handleSelectStudent`;
- `handleBack`;
- `handleGenerateInsight`;
- `handleGeneratePdf`.

Callback tersebut diteruskan ke `GuruHeader`, `StudentDirectory`, dan lazy `StudentDetail`. Jika child memakai `React.memo`, identity baru membuat memoization tidak efektif. `StudentDetail` memang lazy component, tetapi lazy loading tidak mencegah rerender setelah mounted.

Rekomendasi:

- Gunakan `useCallback` hanya untuk callback yang diteruskan ke child memoized atau yang terbukti memicu subtree mahal.
- Stabilkan dependency dengan ref/action context bila diperlukan, bukan menambah callback pada semua handler.
- Ukur dengan React Profiler sebelum dan sesudah.

### P2 - Inline callback pada list/card

`LearningJourney` dan stage components membuat callback JSX pada item list. Untuk enam comic item, overhead kecil dan tidak membenarkan abstraction/virtualization. Bila jumlah item tumbuh besar, pindahkan handler ke memoized item dengan id primitive atau gunakan event delegation.

### P2 - Object/array baru pada render

Contoh yang terlihat:

- `StudentHome` membuat `statCards` array setiap render.
- `GuruDashboardPage` membuat `topStudents = [...rows].sort(...)` setiap render.
- Banyak component membentuk object style/props dan array class secara inline.

Tidak semua perlu memoization. `statCards` kecil; `topStudents` layak dipindahkan ke `useMemo` bila dashboard rows besar atau rerender sering.

## 4. Kalkulasi Berat

### P1 - Guru report nested filtering/sorting

File: `src/app/guru/report/GuruReportClient.tsx`

Saat membangun setiap `guruRow`, code melakukan:

- `activities.filter(activity.userId === student.uid).sort(...)`;
- `reflections.filter(userId/studentId).sort(...)`.

Jika jumlah rows, activities, dan reflections bertambah, kerja dapat mendekati O(R x A log A + R x F log F). Filter report berikutnya juga melakukan pass tambahan.

Rekomendasi:

- Pre-index activity/reflection sekali dengan `Map<userId, latestItem>` sebelum membuat rows.
- Sort collection sekali, bukan sort subset yang sama untuk setiap row.
- Pertahankan hasil yang sama dengan test report fixtures.

### P2 - Dashboard guru sort setiap render

`topStudents` selalu diurutkan meskipun hanya tab overview yang membutuhkan hasil tersebut. Gunakan `useMemo([rows])` atau hitung hanya saat overview aktif setelah profiling. Ini kalkulasi murah untuk kelas kecil, tetapi tidak linear-friendly untuk jumlah siswa besar.

### P2 - Filter dashboard comic

`LearningJourney.filteredComics` sudah memakai `useMemo`, dan `ComicCard` memakai `React.memo`. Ini cukup untuk daftar enam item. `getProgress` melakukan `states.find` untuk tiap comic; dengan enam item biaya kecil.

### P3 - Student home calculations

`StudentHome` sudah memakai `useMemo` untuk comics, unlock statuses, dan summary. Ini cukup. `getProgress` masih linear search, tetapi jumlah comic kecil.

## 5. Context dan State

### P1 - Learning context fanout

`LearningEngineProvider` value mencakup comic, module, progress, current stage, navigation state, save state, callbacks, dan stage actions. `useMemo` sudah dipakai untuk menjaga object value ketika dependency tidak berubah, tetapi perubahan `progress`, `stageIndex`, `isSaving`, `slideNav`, atau `stageAdvanceAction` tetap mererender semua consumer.

Ini bukan bug otomatis karena consumer perlu sebagian state. Optimasi yang dapat dipertimbangkan setelah profiling:

- Pisahkan read context besar dari action context.
- Buat selector-based context/store bila fanout terbukti mahal.
- Hindari memasukkan state yang tidak dipakai consumer tertentu ke context global.

Jangan menambah `useMemo` di setiap consumer tanpa bukti.

### P2 - Auth root context

`AuthProvider` berada di root dan membuat `value` baru saat render. Auth loading/error/user memang harus menyebar ke consumer terkait. Namun route publik juga berada di bawah provider dan tetap membayar context/provider initialization. Ini berkaitan dengan audit Firebase initial load.

### State update berantai

Learning stage save flow dapat melakukan beberapa update berurutan (`setIsSaving`, `setProgress`, `setStageIndex`, snackbar). React batching modern mengurangi sebagian render, tetapi profiler perlu digunakan pada transisi stage dan Firestore snapshot.

## 6. Fetch Lifecycle

Tidak ditemukan fetch/database request langsung pada body render. Fetch yang diperiksa:

- `LearningJourney`: `fetchAllComics()` dalam effect mount.
- `StudentHome`: motivation fetch dalam effect dengan cancellation boolean.
- `ApplicationStage`, `NavigationStage`, `IntrospectionStage`: progress hydration dalam effect.
- `GuruReportClient`: report fetch dalam effect.
- `useStudentDetail`: detail fetch dalam effect dengan active guard.
- `LearningEngineContext`/`useAllComicProgress`: realtime subscriptions dengan cleanup.

Risiko yang sudah dicatat pada fase database:

- stage hydration dapat overlap dengan Learning Engine progress subscription;
- guru report membaca collection besar;
- dashboard guru melakukan fetch progress per siswa;
- detail siswa menjalankan query reflection overlap.

Active guard mencegah stale `setState` pada beberapa component, tetapi tidak membatalkan request network yang sudah berjalan.

## 7. Daftar Besar dan Virtualization

### Daftar kecil, tidak perlu virtualization

- `COMICS`/LearningJourney: sekitar enam comic.
- Stage sidebar: sekitar delapan stage.
- Badge section: jumlah terbatas.
- Statistics grid: empat card.

Virtualization pada daftar ini akan menambah kompleksitas dan risiko layout tanpa manfaat signifikan.

### Daftar yang dapat tumbuh

- Guru student directory dan top students.
- Guru report rows.
- Student detail activities/reflections.
- Identification/application content jika content package diperluas.

Saat ini data diambil full/large dan dirender sebagai rows biasa. Untuk dataset besar:

- tambahkan server-side pagination/cursor terlebih dahulu;
- render hanya page yang diminta;
- gunakan virtualization hanya setelah jumlah row nyata melewati ambang dan row height stabil;
- pertahankan accessibility keyboard/focus dan export behavior.

Virtualization bukan pengganti query pagination; mengirim seluruh data lalu hanya merender sebagian tetap membebani network/memory.

## 8. Rekomendasi Prioritas

### P1

1. Optimasi query/report di fase database agar rows tidak membengkak.
2. Pre-index activities/reflections pada `GuruReportClient`.
3. Profil callback identity dan context fanout pada dashboard guru/learning engine.
4. Gunakan pagination server-side untuk student/report data sebelum virtualization.

### P2

1. Memoize `topStudents` bila profiler menunjukkan rerender mahal.
2. Stabilkan callback dashboard guru yang diteruskan ke child memoized.
3. Konsolidasikan progress hydration stage dengan provider subscription.
4. Tambahkan active/request generation guard pada fetch yang dapat overlap.

### P3

1. Virtualization untuk report/student list hanya jika dataset representative besar.
2. Event delegation atau item handler stabil jika list comic berkembang jauh di atas enam item.
3. Review object/style creation hanya pada component yang muncul di profiler hot path.

## 9. Validasi dan Batasan

- Static lint/error check belum menggantikan React Profiler.
- Build production baru belum tersedia karena `prebuild` native `canvas` gagal `Bus error`.
- Tidak ada benchmark jumlah render, frame time, heap, atau network waterfall pada fase ini.
- Tidak ada perubahan kode dilakukan pada fase audit ini.
- `git diff --check` repository masih melaporkan blank line lama di `src/lib/comic-image.ts`.
