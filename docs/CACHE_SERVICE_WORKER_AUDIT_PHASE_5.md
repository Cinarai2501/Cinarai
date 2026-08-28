# Audit Cache & Service Worker Cinarai - Fase 5

Tanggal audit: 2026-08-28
Branch: `main`
Metode: pencarian implementasi cache/PWA/service worker, pembacaan konfigurasi Firebase/Next, inspeksi localStorage lifecycle, dan pemeriksaan header/resource policy.

## 1. Kesimpulan

Repository ini **tidak memiliki service worker aplikasi, Workbox, PWA plugin, Cache Storage, IndexedDB, React Query/SWR/Apollo, atau konfigurasi offline persistence Firebase yang eksplisit**.

Dengan demikian, tidak ada cache aplikasi terpusat yang dapat mengembalikan asset lama. Risiko stale content terutama berasal dari:

- URL asset/PDF yang sebelumnya stabil tanpa versioning.
- Cache browser/CDN pada URL Firebase Storage yang sama.
- Metadata Firestore yang belum berubah setelah file Storage diganti.
- Duplicate asset pada beberapa path lokal.
- Cache module-level `PdfCoverCanvas` bila URL PDF tidak berubah.

Versioning gambar/PDF sudah ditambahkan pada fase sebelumnya. Fase ini berfokus pada klasifikasi cache dan temuan penyimpanan data user.

## 2. Inventaris Cache dan Persistence

### Service worker / PWA

Tidak ditemukan:

- `sw.js`, `service-worker.js`, atau file service worker aplikasi.
- `navigator.serviceWorker.register(...)`.
- Workbox atau `next-pwa` pada source/config/package.
- `manifest.webmanifest`/PWA manifest.
- Background sync/cache-first strategy.

`public/pdf.worker.min.mjs` bukan service worker. File tersebut adalah worker PDF.js yang dibutuhkan `react-pdf`.

### Cache Storage / IndexedDB

Tidak ditemukan pemakaian `caches.open`, `caches.match`, Cache Storage API, atau `indexedDB`. Tidak ada cache manual yang menyimpan image/PDF response.

### React/query cache

Tidak ditemukan React Query, SWR, Apollo, Redux store, Zustand store, atau `QueryClient`. Data Firestore diambil lewat `getDoc`/`getDocs`/`onSnapshot` langsung.

### Firebase cache

`src/lib/firebase/client.ts` menginisialisasi Firebase Auth, Firestore, dan Storage. Tidak ditemukan pemanggilan `enableIndexedDbPersistence`, `persistentLocalCache`, atau konfigurasi Firestore offline cache eksplisit.

Firestore SDK dapat memiliki perilaku internal tersendiri, tetapi repository tidak mengaktifkan cache persisten custom yang dapat diaudit/di-clear dari aplikasi.

### localStorage

Ditemukan tiga kelompok:

1. **Identification pending queue**: `cinarai:identification-pending` di `identificationAnswerService.ts`.
   - Tujuan: retry write ketika offline.
   - Queue dihapus dari storage sebelum flush dan item gagal dimasukkan kembali.
   - Tidak disimpan sebagai cache asset.
   - Risiko: listener `online` dan `visibilitychange` dipasang pada evaluasi module tanpa fungsi unregister. Pada satu page load hanya satu pasang listener, tetapi HMR/re-import/test dapat menambah listener.
   - Risiko tambahan: item yang terus gagal dapat menetap tanpa TTL atau batas jumlah/ukuran.

2. **Application activity**: key `cinarai.application.activity.{comicId}` di `ApplicationStage.tsx`.
   - Setiap activity di-append ke array localStorage.
   - Data yang sama juga dikirim ke Firestore `application_activity`.
   - Tidak ada limit count, TTL, compaction, atau clear setelah sinkronisasi.
   - Ini adalah duplikasi data user dan satu-satunya temuan cache/storage yang berpotensi tumbuh terus.
   - Perlu keputusan apakah local fallback masih dibutuhkan. Jangan menghapus sebelum offline/error UX diuji.

3. **Reading progress**: `comicReadingProgressStorage.ts`.
   - API clear masih tersedia, tetapi `getStoredComicReadingProgress()` selalu mengembalikan `{}` dan `saveStoredComicReadingProgress()` no-op.
   - Tidak menyimpan asset, PDF, atau data besar.
   - Cleanup key legacy tetap dilakukan oleh fungsi clear.

### sessionStorage

Tidak ditemukan pemakaian.

## 3. Kebijakan Cache Per Resource

| Resource | Sumber | Policy saat ini | Risiko | Policy yang disarankan |
|---|---|---|---|---|
| Static JS/CSS/fonts | Next build/static | Next default immutable/hash | Rendah | Pertahankan cache panjang untuk asset hashed |
| Local images | `public`, Next Image dengan `unoptimized: true` | URL static; beberapa memakai `?v=` | Stale jika asset diganti tanpa versi | Gunakan content hash/release version; cache panjang untuk URL immutable |
| Remote images | Firestore URL/Firebase Storage/CDN | Mengikuti remote headers | Stale jika URL dan metadata tetap | Simpan version/hash di metadata, tambahkan `?v=` hanya saat versi berubah |
| Local PDFs | `public/comics/.../comic.pdf` | Next header `no-cache, must-revalidate` spesifik PDF | Revalidasi setiap akses | Pertahankan sementara atau ganti URL versioned + cache immutable setelah deployment stabil |
| Remote PDFs | Firestore `pdfUrl`/Firebase Storage | Remote headers | CDN/browser dapat mengembalikan object lama | Tambahkan `pdfVersion` stabil dari `updatedAt`/hash |
| Generated images | `public/comics/generated/...` | Next header `no-cache, must-revalidate` spesifik generated PNG | Request revalidasi; file 0-byte lama masih mungkin tampil | Regenerasi valid, gunakan version/hash filename/query |
| API data | Next route/Firebase reads | Tidak ada query cache custom | Request berulang dapat mahal | Cache hanya endpoint publik yang aman; user data tetap private/no-store sesuai kebutuhan |
| User data | Auth/Firestore/localStorage | Firebase request + local retry | Duplikasi/unbounded local activity | Batasi queue/TTL dan clear data yang sudah tersinkron |
| PDF worker | `public/pdf.worker.min.mjs` | Static worker copied at build | Stale jika copy tidak sinkron | Worker disalin setiap build; cache filename bisa diganti dengan build hash bila perlu |

Tidak ada perubahan `no-cache` global. Header yang ada hanya dua pola resource spesifik pada `next.config.ts`.

## 4. Temuan Prioritas

### P1 - URL versioning harus ikut update metadata

Sebelum fase gambar/PDF, URL Firestore dan lokal stabil. Sekarang mapper menggunakan `updatedAt` sebagai versi dan fallback lokal memakai release version stabil. Ini memperbaiki invalidation selama updater mengubah metadata Firestore.

Kewajiban pipeline:

1. Upload object ke Firebase Storage.
2. Hitung content hash atau buat version release yang stabil.
3. Update `coverUrl`/`thumbnailUrl`/`pdfUrl` dan field version/`updatedAt` di Firestore.
4. Frontend membentuk URL resource dengan `?v=<version>`.

Mengganti file Storage tanpa update dokumen tetap dapat menyajikan URL lama.

### P1 - Application activity localStorage tidak dibatasi

`ApplicationStage` meng-append payload ke localStorage dan menulis payload yang sama ke Firestore. Ini bukan cache asset tetapi dapat membesarkan storage user, memperlambat parse/stringify, dan menyebabkan data stale/duplicate setelah reload.

Mitigasi yang disarankan:

- Tetapkan batas item/byte dan buang item tertua.
- Simpan hanya draft offline yang belum tersinkron, bukan salinan permanen semua activity.
- Hapus item setelah server write sukses, atau gunakan status/TTL.
- Uji offline, retry, reload, dan multi-tab sebelum mengubah behavior.

### P2 - Pending queue tanpa TTL dan cleanup listener

`identificationAnswerService.ts` memasang listener global pada module load. Queue normalnya berkurang setelah sukses, tetapi error permanen dapat membuat item bertahan lama.

Mitigasi yang disarankan:

- Tambahkan timestamp/envelope dan TTL untuk entry yang tidak dapat diretry selamanya.
- Batasi jumlah/ukuran queue dan tampilkan fallback error saat limit tercapai.
- Bungkus listener dalam `startSyncListeners()`/`stopSyncListeners()` atau pastikan idempotent dengan singleton guard.
- Jangan menghapus queue sebelum write benar-benar sukses.

### P2 - PDF/image generated policy masih revalidating

`next.config.ts` memakai `no-cache, must-revalidate` untuk local PDF dan generated PNG. Ini tidak global dan aman terhadap stale, tetapi setiap akses dapat memicu conditional request.

Setelah filename/query versioning dan deployment tervalidasi, policy yang lebih efisien:

- URL versioned: `Cache-Control: public, max-age=31536000, immutable`.
- Jangan memakai policy immutable pada URL yang dapat menunjuk content berbeda.
- Untuk remote Firebase, atur metadata `cacheControl` saat upload dan tetap ubah version URL ketika content berubah.

## 5. Apa yang Tidak Ditemukan

- Tidak ada cache berukuran besar yang dikelola aplikasi.
- Tidak ada cache asset lama dari service worker.
- Tidak ada Workbox cache yang perlu dihapus.
- Tidak ada IndexedDB database aplikasi.
- Tidak ada sessionStorage cache.
- Tidak ada query cache library yang invalidation-nya rusak.
- Tidak ada global `no-cache` policy.

## 6. Validasi yang Diselesaikan

- Pencarian service worker/PWA/Workbox/cache API tidak menemukan implementasi aktif.
- Pencarian persistence Firebase tidak menemukan offline persistence eksplisit.
- Header Next hanya ditemukan pada PDF lokal dan generated image, bukan seluruh aplikasi.
- Image/PDF versioning fase sebelumnya tetap menggunakan versi stabil, bukan timestamp render.
- File terkait versioning/PDF lulus lint, error-check, dan test terarah 6/6 pada fase sebelumnya.

## 7. Rekomendasi Fase Berikutnya

1. Perbaiki `prebuild` native `canvas` agar generated asset tidak 0-byte.
2. Tambahkan uploader/metadata transaction yang selalu memperbarui `updatedAt` atau content hash.
3. Batasi dan bersihkan local application activity setelah sinkronisasi sukses.
4. Jadikan pending sync listener idempotent dan tambahkan TTL queue.
5. Setelah URL versioning stabil, ukur apakah PDF/image lokal dapat memakai immutable cache.
6. Uji dua deployment berturut-turut: asset URL lama harus tetap valid/cache-hit, URL versi baru harus mengambil bytes baru.
7. Dokumentasikan cache policy production Firebase Storage/CDN di deployment configuration karena saat ini tidak ada pada `firebase.json`.
