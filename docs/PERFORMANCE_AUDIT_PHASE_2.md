# Audit Performance Cinarai - Fase 2

Tanggal audit: 2026-08-28
Branch: `main`
Metode: inspeksi import graph dan client boundaries, pembacaan lifecycle React/Firebase, pemeriksaan build artifact lokal, ukuran dependency/asset, serta pencarian pola timer/listener/request.

## 1. Ringkasan Eksekutif

Temuan berprioritas tertinggi:

1. **Firebase client terlalu eager**: `src/lib/firebase/client.ts` membuat Auth, Firestore, dan Storage sekaligus. Karena `AuthContext` adalah provider root dan `firebase/auth.ts` mengimpor client tersebut, halaman publik/login berpotensi membawa inisialisasi Firestore/Storage yang belum diperlukan.
2. **Semua modul komik diimpor eager**: `src/features/comics/index.ts` mengimpor `comic-1` sampai `comic-6` secara statis. `loadComicModule()` hanya membungkus lookup synchronous, jadi bukan code splitting.
3. **SVG asset sangat besar**: build artifact lokal menunjukkan SVG navigasi komik berukuran sekitar 5-8 MB per file, dengan total beberapa puluh MB hanya dari kelompok asset tersebut. Ini berpotensi membebani parsing, build, dan transfer route yang menggunakannya.
4. **Timer snackbar tidak lifecycle-safe**: setiap snackbar membuat dua `setTimeout` yang tidak disimpan dan tidak dibersihkan saat provider unmount. Ini dapat menyebabkan callback state terlambat dan menahan closure/message sementara.
5. **Prebuild PDF saat startup build menjalankan native `canvas`**: `prebuild` langsung memproses tiga PDF. Pada environment audit proses berakhir `Bus error` exit 135, sehingga build production tidak pernah mencapai compile Next.js.

Temuan berprioritas menengah:

- `AuthContext` menjalankan query Firestore dan `getIdTokenResult()` setiap auth callback, serta memanggil `initializeUserProgress()` setiap sinkronisasi user. Ini mungkin menghasilkan request berulang jika callback auth terpanggil lebih dari sekali.
- `LearningEngineContext` memiliki effect no-op yang tetap dijalankan setiap perubahan dependency.
- Context value Auth dibuat ulang setiap render dan dibagikan ke seluruh subtree root; perubahan loading/error/user menyebabkan rerender luas. Belum ada profiling untuk mengukur dampak aktual.
- `PdfViewer` sengaja merender halaman aktif dan halaman target sekaligus saat transisi. Ini meningkatkan CPU/RAM sesaat tetapi merupakan tradeoff fitur animasi, bukan bug.
- `ComicCover` memakai `priority` untuk cover route. Tepat untuk hero cover, tetapi jika banyak cover tampil dalam satu halaman, prioritas dapat meningkatkan request awal.

## 2. Baseline Terukur

- `public`: sekitar 304 MB.
- `.next`: sekitar 291 MB pada artifact lokal yang tersedia.
- `node_modules`: sekitar 735 MB, bukan ukuran transfer production.
- `src`: sekitar 176 MB.
- Public assets: 117 file, terdiri dari 104 PNG, 6 PDF, 4 JPEG, 1 MJS, dan 1 MD.
- PDF terbesar: komik 5 sekitar 46 MB dan komik 6 sekitar 31 MB.
- Build artifact terbesar yang terlihat: SVG `trapesium` sekitar 8.6 MB, `lingkaran-highlight` sekitar 7.9 MB, `trapesium-highlight` sekitar 7.5 MB, dan `persegi-panjang-highlight` sekitar 7.0 MB.
- Dependency directory terbesar: Next sekitar 156 MB, `@next` sekitar 149 MB, Firebase SDK sekitar 41 MB, `pdfjs-dist` sekitar 37 MB, dan `canvas` sekitar 24 MB. Angka ini adalah storage install, bukan bundle browser.

Catatan: build terakhir tidak berhasil melewati `prebuild`, sehingga `.next` bukan baseline build baru yang dapat dipercaya untuk perbandingan route. Pengukuran bundle final harus diulang setelah pipeline export diperbaiki.

## 3. JavaScript dan Import Graph

### P1 - Firebase Auth membawa Firestore dan Storage

Bukti:

- `src/app/layout.tsx` memasang `AuthProvider` untuk semua route.
- `src/context/AuthContext.tsx` mengimpor service auth, Firestore, dan progress.
- `src/lib/firebase/auth.ts` mengimpor `auth` dari `src/lib/firebase/client.ts`.
- `src/lib/firebase/client.ts` langsung menjalankan `getAuth(app)`, `getFirestore(app)`, dan `getStorage(app)` pada evaluasi module.

Dampak potensial:

- Inisialisasi dan code Firebase Firestore/Storage ikut masuk ke jalur login/public, walaupun route tersebut hanya membutuhkan Auth.
- Menambah parse/evaluation cost dan ukuran initial client graph.
- Bisa memicu masalah environment Storage lebih awal, karena seluruh client Firebase dievaluasi dari root provider.

Validasi murah:

- Bandingkan manifest/chunk route login sebelum/sesudah pemisahan `authClient` dari `firestoreClient`/`storageClient`.
- Ukur `performance.getEntriesByType('resource')` dan waktu `DOMContentLoaded` pada `/auth/login`.

Rekomendasi:

- Pisahkan inisialisasi Auth dari Firestore/Storage ke module terpisah.
- Biarkan service Firestore/Storage mengimpor instance masing-masing hanya pada route yang memerlukannya.
- Jangan mengubah kontrak public service sebelum smoke test login, signup, progress, dan upload selesai.

### P1 - Modul keenam komik tidak code-split

Bukti:

`src/features/comics/index.ts` memiliki import statis untuk `Comic1Module` sampai `Comic6Module` dan membentuk object `comicModules`. Setiap index komik mengimpor metadata, navigation, identification, argumentation, resolution, application, introspection, report, dan AI content secara statis.

`loadComicModule(comicId)` hanya memanggil `getComicModule(comicId)` secara synchronous. `useMemo(() => loadComicModule(comicId), [comicId])` menghindari pengulangan lookup dalam render yang sama, tetapi tidak mengurangi bundle karena semua import sudah dievaluasi.

Dampak potensial:

- Route learning satu komik dapat membawa konten/asset enam komik.
- Static asset SVG dan object data dapat masuk ke shared/client chunks.
- Memory awal bertambah walau siswa hanya membuka satu komik.

Validasi murah:

- Buat build yang berhasil, lalu bandingkan client chunk route `/comic/1/learn` dan `/comic/6/learn` serta cari string/nama konten komik lain pada chunk.
- Profilkan transfer dan parse script dengan DevTools Coverage.

Rekomendasi:

- Ubah loader menjadi dynamic import per comic ID, idealnya mengembalikan `Promise<ComicModuleLike>`.
- Update provider/consumer agar menangani state loading module.
- Pastikan metadata yang dibutuhkan untuk route awal tetap tersedia tanpa menunggu seluruh learning content.

### P2 - Library besar yang memang terpakai

- `react-pdf`/`pdfjs-dist`: dipakai viewer dan cover renderer; layak lazy-load dan sudah ada dynamic import untuk `PdfViewer`, tetapi `PdfCoverCanvas` tetap berada pada route yang memakainya.
- `framer-motion`: dipakai banyak komponen; belum terbukti bisa diganti tanpa perubahan UI. Audit lebih lanjut dapat mengukur apakah animasi sederhana dapat memakai CSS.
- `canvas`/`jsqr`: dipakai script/pipeline server. Harus dipastikan tidak masuk client graph; import di `src/services/comic-assets/comicAssetPipeline.ts` dan script berada pada jalur server/tooling.
- `firebase-admin`: dipakai API dan script admin; harus server-only.
- `sharp`: dipakai script badge; tidak perlu dipaksa masuk browser.

Tidak ditemukan dependency production yang aman dihapus berdasarkan audit ini. `json-stable-stringify-without-jsonify` dan `lodash.merge` tidak memiliki import langsung yang ditemukan dan tetap menjadi kandidat devDependency unused untuk verifikasi terpisah.

## 4. React State, Effect, dan Render

### P1 - Timer snackbar tanpa cleanup

File: `src/context/SnackbarContext.tsx`

`showSnackbar()` membuat timer 1.8 detik untuk menandai closing dan timer 2 detik untuk menghapus item. ID timer tidak disimpan. Saat provider unmount, callback masih dapat berjalan setelah lifecycle provider selesai.

Dampak:

- Callback state tertunda dan closure message tertahan sampai timer selesai.
- Potensi warning/perilaku tidak deterministik pada navigasi penuh atau test unmount.
- Burst snackbar membuat banyak timer dan update array terpisah.

Rekomendasi:

- Simpan timer per snackbar atau gunakan satu timeout lifecycle-safe.
- Bersihkan semua timeout pada cleanup provider.
- Pertahankan functional state update agar timer tidak memakai snapshot state basi.

### P2 - Effect no-op pada LearningEngineProvider

File: `src/features/learning-engine/context/LearningEngineContext.tsx`

Terdapat effect dengan dependency `[currentStage, stageIndex, isLoading]` yang langsung return jika `isLoading` dan tidak memiliki body setelah guard. Effect ini tidak menghasilkan side effect atau state update.

Dampak: overhead kecil namun selalu dievaluasi ketika dependency berubah dan membingungkan analisis lifecycle.

Rekomendasi: hapus setelah memastikan tidak ada tujuan debugging tersembunyi. Ini perubahan risiko rendah.

### P2 - Auth sync dapat melakukan request berulang

File: `src/context/AuthContext.tsx`

Callback auth memanggil `syncUserFromFirestore()`. Fungsi tersebut menjalankan `Promise.all([getFirestoreDocument(...), firebaseUser.getIdTokenResult()])`, kemudian memanggil `initializeUserProgress()` setiap selesai. Auth listener sudah di-unsubscribe saat unmount, tetapi promise aktif tidak dibatalkan dan tidak ada guard terhadap hasil stale.

Risiko:

- Callback auth berulang dapat memicu query user, token lookup, dan progress initialization berulang.
- Sign-in cepat lalu logout dapat membuat hasil user lama mencoba mengubah state setelah kondisi auth berubah.

Rekomendasi:

- Tambahkan generation/request guard atau abort-compatible boundary untuk mengabaikan hasil stale.
- Deduplicate progress initialization per UID/session.
- Ukur jumlah callback dan request Firebase pada login, refresh token, tab restore, dan logout.

### P2 - Context value root menyebabkan rerender subtree

`AuthProvider` membuat object `value` baru pada setiap render dan berada di root. `SnackbarProvider` juga berada di bawahnya. Hal ini normal secara fungsi, tetapi setiap state auth (loading/error/user) memicu consumer context rerender.

Belum ada bukti bahwa ini bottleneck dominan. Jangan menambahkan `useMemo` membabi buta; gunakan React Profiler untuk menemukan consumer mahal dahulu. Pemisahan context read-state dan action dapat dipertimbangkan hanya bila profiling menunjukkan dampak.

### P3 - Memoization yang sudah ada

- `ComicCover` memakai `useMemo` untuk pencarian satu item array kecil; manfaatnya kemungkinan sangat kecil dan tidak kritis.
- `LearningEngineProvider` memakai `useMemo` untuk comic module, completed stages, dan context value; sebagian relevan karena object/data diteruskan ke banyak consumer.
- `PdfViewer` memakai `useMemo` untuk page size dan `useCallback` untuk handler yang masuk child props; ini masuk akal karena ukuran dan callback memengaruhi render/child memoization.
- `PdfPage` memakai `memo`; ini relevan karena halaman PDF mahal dirender.

Tidak direkomendasikan menambah memoization sebelum profiling.

## 5. Listener, Observer, Timer, dan Subscription

### Sudah memiliki cleanup

- `AuthContext`: `subscribeToAuthChanges()` di-unsubscribe saat unmount.
- `ComicReadingProgressContext`: custom event listener dihapus saat unmount.
- `LearningEngineContext`: Firestore subscription dan timeout 10 detik dibersihkan pada effect cleanup.
- `usePdfSize`: `ResizeObserver`, `resize`, dan `orientationchange` dibersihkan.
- `PdfViewer`: timer transition dan hide-controls timer dibersihkan.
- `PdfCoverCanvas`: `ResizeObserver` dibersihkan.

### Perlu perhatian

- `SnackbarProvider`: dua timer per item tidak dibersihkan.
- Async PDF render/cover render belum memiliki cancellation guard saat komponen unmount. Resource PDF dihancurkan setelah selesai, tetapi hasil promise dapat mencoba `setCover` setelah unmount. Tambahkan mounted/request identity guard bila profiling atau test menunjukkan masalah.
- Firebase `onSnapshot` di service layer perlu diaudit per call site; subscription utama yang terlihat di Learning Engine memiliki cleanup, tetapi semua listener dashboard guru perlu smoke test mount/unmount berulang.

## 6. PDF, Image, dan Network Loading

- `PdfViewer` sudah dynamic import dengan `{ ssr: false }`, sebuah boundary yang baik.
- Viewer merender halaman aktif dan halaman target secara bersamaan saat transisi 240 ms. Ini menambah peak CPU/RAM dua canvas; tradeoff fitur. Ukur sebelum mengurangi kualitas transisi.
- `PdfCoverCanvas` menggunakan `loading="eager"`; tepat bila cover berada di atas fold, tetapi perlu dihindari untuk grid banyak cover.
- `ComicCover` memakai `priority` pada image; audit jumlah instance sebelum mempertahankan prioritas global.
- `next.config.ts` menetapkan `images.unoptimized: true`. Ini menghilangkan optimasi/resizing Next Image, sehingga browser menerima file asli. Dengan PNG cover multi-megabyte, network dan decode cost dapat besar.
- PDF lokal komik 5/6 sangat besar; browser harus mengambil file besar untuk viewer. Pertimbangkan kompresi PDF atau per-page image delivery hanya setelah memastikan kualitas dan interaksi.
- Header no-cache untuk PDF/generated image mencegah stale asset, tetapi meningkatkan revalidasi/request. Atur versi URL/ETag atau cache policy deployment yang sesuai setelah asset pipeline stabil.

## 7. Build dan Startup

`package.json` menjalankan `prebuild` sebelum `next build`. Script `scripts/export-comic-observation-images.mjs` memuat `canvas` dan memproses PDF saat build. Pada audit sebelumnya dan pengujian saat ini proses berakhir `Bus error` exit 135 sebelum Next compile.

Dampak:

- Startup build gagal deterministik pada environment ini.
- Tidak bisa mendapatkan bundle analyzer/build manifest baru yang valid.
- Generated output dapat tetap 0 byte bila dibuat oleh run lama; jangan dianggap cache valid.

Rekomendasi:

- Pindahkan export asset ke command CI/build image yang memiliki native canvas teruji, atau gunakan tool pipeline yang stabil.
- Validasi output dengan ukuran minimum dan signature PNG sebelum mengganti file final.
- Jangan menelan error dan jangan menjalankan export berat pada setiap local build jika output tidak berubah; gunakan content hash/input-output timestamp dengan hati-hati agar tidak menghasilkan stale asset.

## 8. Service Worker dan Cache

- Tidak ditemukan service worker aplikasi atau registrasi service worker.
- `public/pdf.worker.min.mjs` adalah PDF worker, bukan service worker.
- Tidak ditemukan IndexedDB/Cache Storage application cache pada pencarian statis.
- Local storage progress bukan bottleneck network besar, tetapi perlu tetap diuji pada tab ganda karena event reset/listener.

## 9. Prioritas Perbaikan Berbasis Dampak

### P0 - Pulihkan baseline

- Perbaiki/isolasi `canvas` prebuild agar production build bisa selesai.
- Regenerasi dan validasi tiga generated PNG 0-byte.
- Jalankan build dengan output bundle yang valid.

### P1 - Dampak initial load terbesar

- Pisahkan Firebase Auth dari Firestore/Storage initialization.
- Implementasikan dynamic import per comic module.
- Kompres/ubah format SVG navigasi multi-megabyte dan ukur perubahan route bundle/network.

### P2 - Lifecycle dan CPU/RAM

- Cleanup timer Snackbar.
- Tambahkan stale-result guard untuk auth sync dan PDF cover/render async.
- Hapus effect no-op Learning Engine.
- Profil rerender context/consumer sebelum menambah memoization.

### P3 - Optimasi asset lanjutan

- Audit `priority`/`loading` image berdasarkan posisi viewport.
- Kompres PDF besar atau siapkan delivery per halaman.
- Verifikasi cache policy deployment dan ETag/versioning.

## 10. Batasan Audit

- Profil runtime browser, React Profiler, Lighthouse, network waterfall, dan heap snapshot belum dapat dijalankan pada fase ini.
- Build gagal pada `prebuild`, sehingga ukuran bundle route baru belum dapat diukur secara sahih.
- Tidak ada perubahan kode dilakukan pada fase audit ini.
- Temuan dependency berdasarkan import langsung; dynamic import/tooling transitive perlu diperiksa sebelum penghapusan.
