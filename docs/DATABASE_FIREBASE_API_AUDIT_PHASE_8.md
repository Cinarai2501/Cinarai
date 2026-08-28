# Audit Database / Firebase / API Cinarai - Fase 8

Tanggal audit: 2026-08-28
Branch: `main`
Metode: penelusuran call site Firebase/API, pembacaan wrapper/service dan lifecycle React, serta inspeksi query/filter/limit/subscription. Tidak ada perubahan query pada fase audit ini.

## 1. Ringkasan Eksekutif

Temuan paling berdampak:

1. **Dashboard guru API mengambil progress seluruh database** melalui `collectionGroup('progress').get()`, lalu memfilter hanya UID siswa di memory.
2. **Dashboard/report guru client mengambil koleksi besar tanpa limit/filter**: seluruh `users`, seluruh `reflection`, seluruh `activity`, lalu progress setiap siswa secara terpisah.
3. **Dashboard guru realtime memasang listener untuk seluruh siswa dan seluruh comics**, kemudian melakukan fetch progress per UID setelah keduanya siap.
4. **Detail siswa menjalankan dua query reflection yang tumpang tindih** (`userId == studentId` dan `studentId == studentId`) lalu dedupe di client.
5. **Beberapa learning stage melakukan one-time `loadComicProgress` sementara Learning Engine sudah memiliki `onSnapshot` progress**, sehingga data progress dapat diambil dua kali dalam satu perjalanan belajar.
6. **Metadata comic diambil berulang dari jalur berbeda**: `LearningJourney` fetch all comics, asset repository dapat fetch comic lagi, dan route/halaman lain menggunakan repository fallback sendiri.

Listener yang terlihat pada hook utama memiliki unsubscribe cleanup. Masalah utama adalah scope query, jumlah request, dan duplikasi sumber data, bukan listener yang pasti bocor.

## 2. Peta Operasi Database/API

### Auth dan user profile

- `AuthContext` berlangganan `onAuthStateChanged` satu kali dan unsubscribe saat unmount.
- Setiap callback user menjalankan `getFirestoreDocument('users', uid)` dan `getIdTokenResult()` secara paralel.
- Setelah sync, `initializeUserProgress(uid)` dipanggil tanpa dedupe eksplisit.

### Student progress

- `LearningEngineContext` memakai `subscribeToLearningProgress(user.uid, comicId, ...)` untuk satu comic dan cleanup `unsub()`.
- `useAllComicProgress` memakai `subscribeToAllComicProgress(user.uid, ...)` untuk seluruh progress user dan cleanup `unsub()`.
- `NavigationStage`, `ApplicationStage`, `IntrospectionStage`, dan beberapa stage lain memanggil `loadComicProgress` one-time untuk comic yang sama.
- Identifikasi memakai query/load dan realtime subscription jawaban identifikasi.

### Comics

- `LearningJourney` memanggil `fetchAllComics()` sekali pada mount.
- `fetchAllComics()` melakukan query seluruh collection `comics`, tetapi sudah memakai `orderBy('order')`.
- `comicAssetRepository` memanggil `fetchComicById`/`fetchAllComics` lagi bila pipeline asset dipakai.
- `src/data/comics.ts` menyediakan fallback lokal dan `src/lib/comicRepository.ts` juga menjadi sumber data lokal; ini berpotensi duplicate fetch/metadata source tergantung route.

### Dashboard guru

- `useGuruDashboard` memasang `subscribeStudents()` ke semua siswa dengan filter role.
- `useGuruDashboard` memasang `subscribeComics()` ke seluruh comics.
- Setelah keduanya siap, `fetchAllStudentProgress(uids)` menjalankan `fetchStudentProgress(uid)` untuk setiap siswa secara paralel.
- `fetchStudentProgress(uid)` membaca seluruh subcollection `users/{uid}/progress` tanpa limit.
- Subscription student/comics di-cleanup saat hook unmount.

### Guru report

- `GuruReportClient` mengambil seluruh collection `users`, `reflection`, dan `activity` melalui `getDocs(collection(...))` tanpa filter/limit.
- Setelah itu mengambil subcollection progress untuk setiap siswa secara paralel.
- Filter report dilakukan setelah semua data berada di client.
- Tidak ada pagination dan tidak ada dedupe/cache antar navigasi report.

### Detail siswa

`src/app/guru/[studentId]/page.tsx` menjalankan `Promise.allSettled` atas:

- user document;
- seluruh progress subcollection siswa;
- reflection berdasarkan `userId`;
- reflection berdasarkan `studentId`;
- activity berdasarkan `userId`.

Dua query reflection memang didedupe berdasarkan id di client, tetapi tetap membayar dua query dan dua pembacaan.

### Dashboard guru API

`src/app/api/dashboard/guru/route.ts` memverifikasi token dan profile guru, lalu menjalankan query sequential:

- `users.where(role == student).get()` tanpa limit;
- `collectionGroup('progress').get()` tanpa filter/limit;
- `reflection.orderBy(createdAt desc).limit(200)`;
- `activity.orderBy(occurredAt desc).limit(20)`;
- `comics.get()` tanpa limit.

Progress seluruh collection group difilter setelah fetch berdasarkan UID siswa. Query sequential mengurangi burst koneksi tetapi meningkatkan total latency response.

## 3. Temuan Prioritas

### P0 - Collection group progress tidak terfilter

File: `src/app/api/dashboard/guru/route.ts`

`firestore.collectionGroup('progress').get()` mengambil semua progress semua user dan semua comic, baru difilter di memory. Ini berpotensi tumbuh linear terhadap jumlah user x comic dan menjadi beban read/latency terbesar endpoint.

Perbaikan yang sesuai:

- Query dengan filter yang dapat didukung index, misalnya status/user scope sesuai model data.
- Jika Admin SDK tidak dapat melakukan `where in` untuk seluruh UID karena batas 10/30, pecah UID menjadi batch bounded atau ubah endpoint menjadi pagination.
- Untuk dashboard ringkasan, simpan aggregate/summary yang memang diperlukan agar tidak membaca seluruh detail progress.
- Gunakan field projection (`select`) pada Admin SDK bila payload hanya membutuhkan subset.

Jangan mengganti dengan filter client; itu tidak mengurangi Firestore reads.

### P0 - Guru report membaca seluruh koleksi

File: `src/app/guru/report/GuruReportClient.tsx`

`getDocs(collection(firestore, 'users'))`, `reflection`, dan `activity` membaca seluruh dokumen. Filter report dilakukan setelah response diterima. Progress kemudian dibaca satu request per siswa.

Dampak:

- Read count dan payload bertumbuh dengan database.
- Parse/sort/filter terjadi di browser.
- Navigasi ulang report mengulang semua request.

Perbaikan:

- Pindahkan filter `studentId`, `comicId`, dan date range ke query Firestore.
- Tambahkan `limit` dan cursor pagination (`startAfter`) untuk reflection/activity.
- Ambil hanya field yang dibutuhkan melalui model dokumen ringkas/endpoint server.
- Untuk report agregat, gunakan API server dengan aggregate/precomputed summary.

### P1 - Dashboard guru fetch progress per siswa

File: `src/app/dashboard/guru/services/firestoreService.ts`

`fetchAllStudentProgress` menjalankan `fetchStudentProgress` untuk setiap UID secara paralel. Chunk array dibuat tetapi inner mapping tetap memanggil semua UID pada setiap chunk; chunk tersebut tidak membatasi concurrency karena seluruh `chunks.flatMap(...` dirangkai ke satu `Promise.all`.

Dampak:

- N request progress untuk N siswa.
- Burst request/RAM tinggi.
- Tidak ada pagination siswa atau progress.

Perbaikan:

- Batasi jumlah siswa per halaman dan fetch progress hanya halaman aktif.
- Gunakan collection group query dengan filter yang tepat atau aggregate summary.
- Bila tetap per-user, gunakan concurrency limit nyata, bukan hanya membagi array.
- Hindari realtime listener untuk data yang hanya dibutuhkan sebagai snapshot dashboard bila kebutuhan bisnis tidak realtime.

### P1 - Dua query reflection yang overlap

File: `src/app/guru/[studentId]/page.tsx`

Query `reflection` berdasarkan `userId` dan `studentId` mengembalikan kemungkinan overlap lalu didedupe client. Ini dapat dipertahankan sementara untuk kompatibilitas data legacy, tetapi sebaiknya migrasikan field ke satu canonical field atau gunakan endpoint/query server yang menggabungkan secara efisien.

### P1 - Realtime listener global dashboard

`useGuruDashboard` memasang listener seluruh student dan comics. Listener ini sah bila dashboard harus realtime, dan cleanup sudah ada. Namun setiap snapshot siswa/comics dapat memicu `tryFetchProgress`; `progressFetchedRef` mencegah fetch berulang dalam satu siklus, tetapi ketika snapshot siswa baru datang flag di-reset dan seluruh progress semua siswa di-fetch lagi.

Perbaikan:

- Gunakan listener hanya untuk subset/pagination yang terlihat.
- Pisahkan student list realtime dari progress aggregate.
- Refresh progress berdasarkan perubahan siswa yang relevan, bukan semua UID.
- Tambahkan debounce/coalescing bila snapshot burst sering terjadi.

### P2 - One-time progress fetch di learning stages

Learning Engine sudah memiliki subscription progress comic, tetapi `NavigationStage`, `ApplicationStage`, dan stage lain masih memanggil `loadComicProgress`. Ini dapat diperlukan untuk hydration stage-specific, namun harus diverifikasi apakah data sudah tersedia di `LearningEngineContext.progress`.

Perbaikan:

- Gunakan context progress sebagai source utama.
- Hanya query one-time bila stage membutuhkan dokumen legacy/field yang belum ada di context.
- Tambahkan request dedupe per `(uid, comicId)` jika one-time read masih dibutuhkan.
- Jangan menghapus fetch tanpa test resume/progress/offline.

### P2 - Auth sync dan progress initialization

`AuthContext` memiliki cleanup listener, tetapi promise `syncUserFromFirestore` tidak dibatalkan/diabaikan saat auth berubah cepat. `initializeUserProgress` dipanggil pada setiap sinkronisasi user.

Perbaikan:

- Tambahkan generation guard untuk hasil auth lama.
- Deduplicate initialization per UID/session.
- Hindari query user profile berulang jika token/auth callback tidak berubah.

## 4. Filtering, Pagination, Field Selection, dan Cache

### Filtering

Sudah ada filter pada:

- students berdasarkan `role` pada listener dashboard;
- reflection/activity berdasarkan user pada service detail;
- reflection/activity limit di API guru.

Masih kurang:

- report guru memfilter setelah `getDocs` seluruh collection;
- API progress memfilter setelah collection group fetch;
- progress per siswa membaca seluruh subcollection.

### Pagination

Tidak ditemukan pagination/cursor pada dashboard/report client. `limit(200)` reflection dan `limit(20)` activity hanya membatasi API dashboard guru, bukan report client/detail siswa.

### Field selection

Tidak ditemukan `select(...)` pada Admin SDK atau model projection pada client. Firestore client `getDocs` mengembalikan seluruh field dokumen. Pertimbangkan DTO summary untuk dashboard/report agar payload tidak membawa field essay/metadata besar yang tidak diperlukan.

### Cache/deduplication

Tidak ada React Query/SWR/query cache. Firebase SDK dapat melakukan internal behavior, tetapi repository tidak memiliki cache request app-level yang eksplisit.

Risiko:

- Navigasi mount/unmount dapat mengulang query yang sama.
- `fetchAllComics` dan local repository dapat mengambil metadata pada jalur terpisah.
- Progress provider dan stage-specific loader dapat membaca dokumen sama.

Rekomendasi:

- Tambahkan cache request in-flight sederhana pada service read yang memang aman, dengan TTL pendek dan invalidation setelah write.
- Jangan cache user-specific data lintas user.
- Untuk realtime source, jangan tambahkan one-time cache yang dapat mengalahkan snapshot terbaru.

## 5. Listener dan Unsubscribe

### Cleanup terverifikasi

- `AuthContext`: unsubscribe auth state.
- `LearningEngineContext`: unsubscribe progress dan clear timeout.
- `useAllComicProgress`: unsubscribe all-progress.
- `useGuruDashboard`: unsubscribe students dan comics.
- `useStudentDetail`: active guard mencegah setState stale setelah unmount, walau request network tidak dibatalkan.

### Perlu verifikasi tambahan

- `subscribeToIdentificationAnswers` call site harus diuji mount/unmount berulang.
- Module-level listener `identificationAnswerService` untuk `online` dan `visibilitychange` tidak memiliki unregister API.
- Promise Firestore one-time fetch tidak memakai AbortSignal; active guard hanya mencegah setState, bukan menghentikan read.

## 6. API Request dan Server Response

- API AI bersifat on-demand dan tidak terlihat dipanggil pada setiap render; perlu rate/timeout audit terpisah.
- API dashboard guru menjalankan collection query sequential dengan payload besar, tetapi memiliki `limit` untuk reflection/activity.
- Client report guru bypass API dashboard dan membaca Firestore langsung, sehingga ada dua arsitektur data untuk use case guru. Konsolidasi ke satu server API dapat mempermudah auth, projection, pagination, dan cache policy.
- Tidak ditemukan Next server cache (`unstable_cache`, `revalidateTag`) pada query data user. Ini tepat untuk private user data sampai invalidation/auth semantics dirancang.

## 7. Rekomendasi Urutan Perbaikan

1. Ukur read count/latency payload dashboard API dan report client pada jumlah data representative.
2. Hentikan `collectionGroup('progress').get()` tanpa scope; gunakan summary/query terfilter/pagination.
3. Tambahkan pagination dan server-side filtering untuk report guru.
4. Kurangi N+1 progress fetch dashboard dengan aggregate atau bounded page query.
5. Konsolidasikan one-time progress stage reads dengan progress context.
6. Putuskan apakah listener dashboard perlu realtime penuh; jika tidak, ubah menjadi snapshot/poll yang dibatasi.
7. Tambahkan request dedupe/cache pendek untuk comic metadata dan read yang aman.
8. Tambahkan projection/DTO agar dashboard tidak membawa field besar yang tidak ditampilkan.
9. Uji unsubscribe dan stale response dengan mount/unmount cepat, logout/login cepat, dan multi-tab.

## 8. Batasan Audit

- Firestore production read count, latency, document count, dan network waterfall belum tersedia dari repository.
- Index effectiveness dan batas query `in` perlu divalidasi terhadap schema/index production.
- Tidak ada perubahan database/query dilakukan karena perubahan tersebut dapat mengubah hasil report dan behavior realtime.
- Build/test baseline repository masih memiliki error yang sudah tercatat pada fase sebelumnya.
