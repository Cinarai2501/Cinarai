# Audit Kondisi Repository Cinarai - Fase 1

Tanggal audit: 2026-08-27
Branch: `main`
Metode: inventarisasi read-only, pencarian referensi/import, pemeriksaan route/config, ukuran file, dan hash SHA-256 asset.

## 1. Ringkasan

Repository adalah aplikasi Next.js App Router berbasis React dan TypeScript. Source utama berada di `src/app`, `src/components`, `src/context`, `src/hooks`, `src/services`, `src/lib`, dan `src/features`. Firebase dipakai sebagai backend utama; PDF.js/react-pdf dipakai untuk pembaca komik; `canvas` dan `jsqr` dipakai oleh pipeline/tool QR sisi server.

Tidak ada penghapusan file pada fase ini. Temuan diklasifikasikan sebagai:

- **Terverifikasi dipakai**: ada import, route, script, konfigurasi, atau referensi runtime yang jelas.
- **Kandidat cleanup**: nama/pola atau referensi tidak ditemukan, tetapi belum dihapus karena mungkin dipakai manual/deployment.
- **Perlu verifikasi lanjutan**: membutuhkan observasi runtime, keputusan deployment, atau perbaikan baseline test/build.

Baseline ukuran lokal saat audit: `public` sekitar 304 MB, `.next` sekitar 291 MB, `node_modules` sekitar 735 MB, dan `src` sekitar 176 MB. Ukuran `node_modules`/`.next` bukan asset repository dan diabaikan dari kandidat penghapusan karena sudah masuk ignore.

## 2. Struktur Folder

- `src/app`: route App Router, halaman, layout, loading/error, dan API route.
- `src/components`: komponen UI lintas fitur, dashboard, auth, comic, PDF, dan viewer.
- `src/context`: provider/state lintas aplikasi untuk auth, progress membaca komik, dan snackbar.
- `src/hooks`: `useAuth`, `useAllComicProgress`, dan `usePdfSize`.
- `src/services`: Firestore, progress, reflection, comic asset pipeline/repository.
- `src/lib`: Firebase client/admin/storage/auth, AI providers/router, asset/image helper, env, progress, audit, TTS, dan utility.
- `src/features/comics`: konten dan komponen spesifik komik 1-6.
- `src/features/learning-engine`: stage router, content package, stage components, dan Identification.
- `public`: PDF, PNG/JPEG, QR, cover, generated image, worker PDF, dan asset dashboard.
- `assets`: sumber badge (`raw-badges`, `trimmed-badges`, `optimized-badges`) dan README.
- `scripts`: seed, optimasi badge, ekstraksi cover/QR, audit/debug, cleanup user, dan replay/test Playwright.
- `e2e`: smoke/reset dan audit Playwright.
- `docs`: design system, blueprint, image prompt, security audit, dan dokumentasi proyek.

## 3. Entry Point dan Routing

Entry point global: `src/app/layout.tsx`, halaman root: `src/app/page.tsx`, loading global: `src/app/loading.tsx`, dan error global: `src/app/error.tsx`.

Route user utama:

- Auth: `/auth/login`, `/auth/signup`, `/auth/forgot-password`.
- Dashboard siswa: `/dashboard`, `/dashboard/siswa`, `/dashboard/siswa/home`, `/dashboard/siswa/komik`, `/dashboard/siswa/kuis`, `/dashboard/siswa/ai-tutor`, `/dashboard/siswa/profil`.
- Guru: `/guru`, `/guru/dashboard`, `/guru/[studentId]`, `/guru/report`, serta dashboard guru di `/dashboard/guru`.
- Comic: `/comic/{1..6}`, `/comic/{1..6}/cover`, `/comic/{1..6}/learn`.
- Learning/observation: `/observasi/[id]`, `/report`, `/student`, `/profile/edit`.
- AI/viewer: `/ai-tutor/[id]`, `/viewer/3d`, `/viewer/object/[id]`.

API route:

- `/api/ai/application`, `/api/ai/argumentation`, `/api/ai/chat`, `/api/ai/introspection`, `/api/ai/resolution`.
- `/api/auth/signup` dan `/api/dashboard/guru`.
- `/api/debug-ai` dan `/api/debug/env` adalah route debug nyata, bukan hanya file test.

`/debug-pdf` dan `/debug/firebase` juga merupakan route debug nyata dan perlu keputusan akses/deployment sebelum dianggap aman dihapus.

## 4. Komponen, State, Context, dan Hooks

Provider/context yang teridentifikasi:

- `AuthContext`: sesi, user, role, dan sinkronisasi Firebase auth/user.
- `ComicReadingProgressContext`: progress pembacaan komik.
- `SnackbarContext`: notifikasi UI.

Komponen utama:

- Auth: form login/signup/forgot password dan route guards.
- Dashboard: `DashboardPage`, home siswa, journey, badge, statistik, header, bottom navigation, popup motivasi.
- Comic/PDF: `ComicCover`, `ComicPageClient`, `PdfCoverCanvas`, `PdfReader`, `PdfViewer`, `PdfPage`, navigasi, toolbar, loading/error.
- Learning engine: stage router dan stage Contextualization, Navigation, Identification, Resolution, Application, Introspection, Finish.
- Viewer: `Universal3DViewer`, `ObjectDetailClient`.
- AI: robot mascot, AI tutor, argumentation components, provider/router/service.

Hook teridentifikasi: `useAuth`, `useAllComicProgress`, `usePdfSize`. Tidak ditemukan bukti yang cukup untuk menyatakan salah satu hook unused hanya dari pencarian statis.

## 5. Firebase, Backend, Storage, dan Environment

- Firebase client: `src/lib/firebase/client.ts`, `auth.ts`, `storage.ts`.
- Firebase Admin: `src/lib/firebase/admin.ts`, dipakai API guru dan beberapa script administrasi.
- Firestore helper/service: `src/services/firestore.ts`, `src/services/comicFirestoreService.ts`, `src/services/comicProgress.ts`, dan service dashboard guru.
- Storage client digunakan oleh `src/lib/firebase/storage.ts`; asset comic dapat berasal dari path lokal maupun URL Firestore.
- Environment parsing: `src/lib/env.ts`, `src/lib/env.client.ts`, `src/lib/env.server.ts`, dan `scripts/check-env.js`.
- `.env.local` di-ignore; `.env.example` tersedia.
- `.env.example.bak` ter-track dan ditandai kandidat backup. Jangan hapus sebelum dibandingkan dengan `.env.example` dan dipastikan tidak menjadi instruksi deployment.
- `firebase.json` hanya mendefinisikan Firestore rules/indexes. Tidak ada konfigurasi Firebase Hosting pada file tersebut.

## 6. Image, PDF, Cache, dan Generated Files

### Image

- Asset statis utama berada di `public/assets`, `public/images`, `public/badges`, `public/comics`, dan `public/qr`.
- Asset fitur komik juga berada di `src/features/comics/comic-{1..6}/assets`.
- `next.config.ts` mengaktifkan `images.unoptimized: true`, sehingga optimasi Next Image tidak digunakan. Ini mengurangi kebutuhan native image optimizer tetapi dapat meningkatkan transfer image.
- `dangerouslyAllowSVG: true` aktif; penggunaan SVG harus tetap dibatasi pada asset tepercaya.

### PDF

- Ada 6 PDF lokal: `public/comics/komik-{1..6}/comic.pdf`.
- Viewer memakai `react-pdf`, `pdfjs`, dan `public/pdf.worker.min.mjs`.
- `next.config.ts` menyalin worker saat webpack client build.
- `PdfViewer` hanya merender halaman aktif dan satu halaman target saat transisi; annotation/text layer dimatikan pada `PdfPage`.
- `PdfCoverCanvas` membuat cover dari halaman pertama PDF dan menyimpan blob URL module-level per `pdfPath`. Render in-flight dideduplikasi dan instance PDF dihancurkan setelah selesai.
- Pipeline `scripts/export-comic-observation-images.mjs` membuat generated PNG dari PDF untuk komik 1-3.

### Cache/stale asset

- Header `Cache-Control: no-cache, must-revalidate` ditambahkan untuk `/comics/:slug/comic.pdf` dan `/comics/generated/:slug/:page.png` di `next.config.ts`, sehingga browser dapat melakukan revalidasi saat asset diganti.
- Cache browser CDN/deployment di luar Next.js belum dapat diverifikasi karena `firebase.json` tidak memuat Hosting config.
- Generated files `public/comics/generated/komik-{1,2,3}/...` saat audit berukuran 0 byte. File masih direferensikan oleh source, jadi tidak dihapus. Pipeline export harus diperbaiki/di-run pada environment dengan native `canvas` yang berfungsi.

### Service worker/storage

- Tidak ditemukan service worker aplikasi (`sw.js`, `service-worker.js`, atau registration service worker).
- `public/pdf.worker.min.mjs` adalah worker PDF, bukan service worker.
- Tidak ditemukan cache storage IndexedDB/Cache Storage aplikasi pada inventaris statis. Local storage dipakai untuk progress melalui `src/lib/comicReadingProgressStorage.ts`.

## 7. Build, Test, dan Dependency

Script npm utama: `dev`, `prebuild`, `build`, `start`, `typecheck`, `lint`, `test`, formatting, badge preparation, seed, dan audit/cleanup helper.

Dependency yang terbukti dipakai langsung:

- `next`, `react`, `react-dom`, `react-pdf`, `firebase`, `firebase-admin`.
- `canvas`, `jsqr`: pipeline/script QR dan PDF sisi server.
- `framer-motion`: komponen animasi.
- `qrcode`: viewer 3D.
- `sharp`: script optimasi badge dan konfigurasi image terkait.
- `dotenv`: environment script/server.
- `playwright`: e2e/audit script.
- `tsx`: script/test TypeScript.

Dependency `@google-cloud/firestore` dan `@google-cloud/storage` sudah dihapus pada perubahan sebelumnya karena tidak ditemukan import langsung dan `npm ls --depth=0` mengonfirmasi keduanya tidak lagi terpasang sebagai dependency top-level.

`json-stable-stringify-without-jsonify` dan `lodash.merge` tercantum di devDependencies, tetapi pencarian import langsung tidak menemukan pemakaian. Keduanya ditandai kandidat dependency unused; verifikasi berikutnya perlu memeriksa apakah dipakai melalui dynamic import, tooling config, atau command manual sebelum dihapus.

Hasil validasi baseline yang perlu dicatat:

- Lint terarah untuk file optimasi berhasil.
- `typecheck` masih gagal pada error baseline di service Firestore, deklarasi `framer-motion`, dan Firebase Storage.
- `npm test` gagal pada import asset PNG/SVG oleh runner `tsx`, meskipun beberapa test lain lulus.
- `npm run build` gagal pada `prebuild` dengan `Bus error` dari native `canvas`.
- `npm audit --omit=dev` melaporkan 22 vulnerability runtime (15 moderate, 7 high pada metadata audit saat pemeriksaan). Tidak menjalankan `audit fix` otomatis karena berisiko mengubah dependency/behavior.

## 8. Legacy, Debug, Test, Backup, dan Experimental Candidates

### Backup/legacy naming

- `.env.example.bak`: **kandidat backup**, ter-track. Bandingkan isi dan cek dokumentasi/deployment sebelum dihapus.
- Tidak ditemukan file dengan suffix `.old`, `.backup`, `.tmp`, atau `.copy` lain pada file non-build yang terinventarisasi.
- Tidak ditemukan nama folder/file literal `legacy` atau `deprecated`.

### Debug routes/scripts

- `src/app/api/debug-ai/route.ts`
- `src/app/api/debug/env/route.ts`
- `src/app/debug-pdf/page.tsx`
- `src/app/debug/firebase/page.tsx`
- `src/app/debug/firebase/DebugFirebaseClient.tsx`
- `src/lib/ai/debug.ts`
- `src/lib/debug.ts`
- `scripts/debug-admin.ts`
- `scripts/debug-ident-render.ts`
- `scripts/debug-import-route.ts`

Sebagian route debug memiliki URL runtime dan karena itu tidak boleh dihapus hanya berdasarkan nama. Perlu audit keamanan dan keputusan apakah route tersebut boleh ada di production.

### Test/manual scripts

- `scripts/test-identification-automated.mjs`
- `scripts/test-identification-direct.mjs`
- `scripts/test-identification-navigation.mjs`
- `scripts/test-identification-runtime.mjs`
- `scripts/test-resolution-button.mjs`
- `e2e/check-explore.js`
- `e2e/reset.spec.ts`
- `e2e/run-reset.js`

File ini tampak sebagai tooling QA/manual dan belum boleh dihapus tanpa memastikan workflow CI/local yang menggunakannya.

### Generated/temporary

- `public/pdf.worker.min.mjs` dan `tsconfig.tsbuildinfo` tercantum sebagai generated/ignored pada `.gitignore`, tetapi keduanya saat audit terlihat pada working tree; status tracking perlu diperiksa sebelum cleanup.
- `public/comics/generated/komik-1/page-1.png`, `page-7` komik 2, dan `page-1` komik 3 adalah generated output yang direferensikan source. Saat ini 0 byte dan perlu regenerasi, bukan penghapusan.

## 9. Duplicate Files/Assets

Pemeriksaan hash menemukan duplicate byte-identik yang jelas:

- Komik 4: `public/comics/komik-4/cover.png`, `thumbnail.png`, `src/features/comics/comic-4/assets/cover/cover-komik-4.png`, `cover.png`, `thumbnail.png`.
- Komik 5: pola cover/thumbnail yang sama antara `public/comics/komik-5` dan `src/features/comics/comic-5/assets/cover`.
- Level icons: `assets/raw-badges/icon-level-{2,4,5}.png` identik dengan beberapa versi di `public/assets/dashboard/home/levels`, termasuk `-v2`.
- Beberapa file `navigation.ts` antar komik memiliki hash identik; ini bisa berupa fallback template yang sengaja dibagi, bukan otomatis duplicate yang aman dihapus.

Duplikasi basename sangat banyak karena struktur asset per komik. Basename sama bukan bukti file duplicate; gunakan hash dan referensi runtime sebelum konsolidasi.

## 10. Unused/Old Code Assessment

- Tidak ada komponen, hook, function, atau import yang dapat dinyatakan aman dihapus hanya dari nama file.
- `src/lib/comic-image.ts` sebelumnya memiliki helper render PDF yang tidak punya pemanggil aktif; helper tersebut sudah dihapus pada perubahan optimasi sebelumnya setelah pencarian seluruh repository.
- `json-stable-stringify-without-jsonify` dan `lodash.merge` adalah kandidat unused dependency berdasarkan tidak adanya import langsung.
- `src/services/comic-assets`, beberapa script extract/seed/publish, dan file `src/lib/userAudit.ts` mungkin dipakai secara operasional/manual; jangan hapus tanpa pemilik workflow.
- Sumber fallback lokal `src/data/comics.ts` dan data Firestore sama-sama berpotensi terlihat duplicate, tetapi fallback lokal masih merupakan jalur aplikasi dan tidak boleh dihapus tanpa menguji kegagalan/offline Firestore.

## 11. Rekomendasi Fase Berikutnya

1. Perbaiki environment/native `canvas` atau ganti pipeline export ke tool yang stabil, lalu regenerasi tiga PNG 0-byte secara atomik.
2. Audit akses production untuk semua debug route/API; tambahkan guard environment/auth atau keluarkan dari build bila memang hanya tooling lokal.
3. Bandingkan `.env.example.bak` dengan `.env.example`; hapus hanya bila benar-benar redundant dan tidak dibutuhkan dokumentasi.
4. Gunakan import graph/route smoke test untuk memverifikasi kandidat unused component/hook/function.
5. Verifikasi duplicate asset satu per satu melalui grep path/manifest, lalu konsolidasikan hanya jika semua consumer bisa diarahkan ke satu canonical path.
6. Pisahkan script QA/manual dari runtime package bila tidak dibutuhkan pada deployment, tanpa menghapus source sebelum workflow dipastikan.
7. Setelah baseline build/test diperbaiki, ukur bundle route, request count, cache hit/revalidation, dan memory PDF pada desktop/mobile.
