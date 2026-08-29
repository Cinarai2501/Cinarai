# Audit Identifikasi File yang Aman Dihapus - Fase 12

Tanggal audit: 2026-08-28
Branch: `main`
Status: audit read-only; tidak ada file yang dihapus.

## Ringkasan

Klasifikasi ini membedakan antara tidak adanya reference statis dan bukti bahwa
file tidak dibutuhkan oleh build/runtime. Route Next.js, dynamic import, registry,
path asset publik, serta script manual diperiksa sebelum kandidat ditetapkan.

Hasil konservatif:

- **SAFE TO DELETE**: 1 file backup.
- **NEEDS REVIEW**: kandidat source legacy, dependency yang tidak punya importer,
  script manual, serta aset publik legacy.
- **KEEP**: route, konfigurasi, source aktif, fallback data, dan aset yang dipakai
  melalui path dinamis atau konvensi framework.

Tidak ada kategori **NEEDS REVIEW** yang dihapus. Akses deployment eksternal,
bookmark URL publik, dan workflow manual tidak dapat dibuktikan hanya dari graph
import repository.

## SAFE TO DELETE

### `.env.example.bak`

Bukti:

- Tidak ditemukan reference di package, konfigurasi Next.js, script, source, atau
  dokumentasi operasional.
- Bukan file yang dibaca Next.js atau Firebase sebagai konfigurasi runtime.
- Isinya merupakan versi lama `.env.example`, tanpa `FIREBASE_ADMIN_SDK_KEY` dan
  `NEXT_PUBLIC_DEVELOPMENT_UNLOCK_ALL` yang sudah ada pada contoh aktif.
- Tidak dipakai sebagai input `prebuild`, test, lint, atau script package.

Prasyarat operasional: pastikan tidak ada pipeline/deployment eksternal yang
merujuk nama file backup ini. Berdasarkan repository saat ini, file aman dihapus.

## NEEDS REVIEW

### Source tanpa reference statis aktif

File berikut tidak memiliki importer yang ditemukan, tetapi bisa merupakan fitur
lama, eksperimen, atau consumer eksternal. Jangan hapus sebelum ada keputusan
produk/owner atau smoke test yang membuktikan tidak dibutuhkan:

- `src/components/auth/ProtectedRoute.tsx`
- `src/components/dashboard/HeroHeader.tsx`
- `src/components/dashboard/MotivationPopup.tsx`
- `src/components/comic/PdfCoverCanvas.tsx`
- `src/components/viewers/Universal3DViewer.tsx`
- `src/features/learning-engine/components/stages/FloatingAITutor.tsx`
- `src/features/learning-engine/stages/Identification/components/PocActivityItem.tsx`
- `src/features/learning-engine/stages/Identification/components/SaveButton.tsx`
- `src/data/comicQrData.ts`
- `src/app/guru/dashboardData.ts`

`Universal3DViewer.tsx` khususnya tidak aman disebut dead code karena route
`/viewer/3d` masih ada, walaupun implementasi route saat ini belum merender
viewer tersebut. `PdfCoverCanvas.tsx` juga berada di area PDF yang memiliki
dependency dan flow lain.

### Dependency tanpa importer yang ditemukan

- `json-stable-stringify-without-jsonify`
- `lodash.merge`

Keduanya tercantum di `devDependencies`, tetapi pencarian source, script, dan
konfigurasi tidak menemukan import atau dynamic import. Tetap `NEEDS REVIEW`
karena penghapusan dependency mengubah `package.json` dan lockfile; verifikasi
yang diperlukan adalah clean install, seluruh command package, serta pemeriksaan
CI/tooling eksternal.

### Script manual, debug, dan QA

Tidak tercantum sebagai npm script bukan berarti tidak dipakai secara manual:

- `scripts/debug-admin.ts`
- `scripts/debug-ident-render.ts`
- `scripts/debug-import-route.ts`
- `scripts/inspect-admin.cjs`
- `scripts/list-users-admin.cjs`
- `scripts/list-users-admin.mjs`
- `scripts/decode-qrs.mjs`
- `scripts/extract-covers.mjs`
- `scripts/extract-covers.py`
- `scripts/test-identification-automated.mjs`
- `scripts/test-identification-direct.mjs`
- `scripts/test-identification-navigation.mjs`
- `scripts/test-identification-runtime.mjs`
- `scripts/test-resolution-button.mjs`

Route debug berikut juga memiliki URL runtime dan perlu keputusan deployment,
bukan penghapusan otomatis:

- `src/app/api/debug-ai/route.ts`
- `src/app/api/debug/env/route.ts`
- `src/app/debug-pdf/page.tsx`
- `src/app/debug/firebase/page.tsx`

### Asset publik dan legacy

Asset yang tidak memiliki reference literal tetap bisa diakses langsung melalui
URL publik atau path yang dibentuk dinamis:

- `public/badges/**`
- `public/assets/dashboard/home/levels/icon-level-{1..5}.png` tanpa suffix `-v2`
- `public/comics/komik-2/pages-01.png` sampai `pages-27.png`
- `public/comics/komik-2/comic.txt`

Sebelum dihapus, periksa URL production, bookmark lama, deployment sebelumnya,
dan apakah asset tersebut merupakan input pipeline atau fallback.

## KEEP

### Konvensi Next.js

Semua `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, dan `route.ts` di
`src/app/**` tetap dipertahankan. File tersebut ditemukan berdasarkan lokasi
filesystem, bukan import dari file lain.

### Source yang terbukti aktif atau indirect

- `src/app/guru/report/reportData.ts`, diimpor oleh `GuruReportClient.tsx`.
- `src/app/guru/studentDetail.utils.ts`, diimpor oleh route student detail dan
  test terkait.
- Komponen yang dimuat dengan dynamic import, termasuk dashboard guru dan PDF
  viewer.
- `src/features/comics/**` untuk komik 1-6, yang diregistrasikan melalui loader
  komik.
- `src/features/learning-engine/**`, karena stage/content dipilih lewat router
  dan registry.
- `src/lib/**`, `src/services/**`, serta `src/data/comics.ts`, termasuk fallback
  lokal ketika Firestore tidak tersedia.

### Konfigurasi, pipeline, dan asset runtime

- `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`,
  `.eslintrc.json`, `next-env.d.ts`, `firebase.json`, `firestore.rules`, dan
  `firestore.indexes.json`.
- Script yang dipanggil oleh `package.json`, termasuk `prebuild`, pipeline badge,
  seed, duplicate-user check, dan export observation image.
- `public/comics/komik-{1..6}/comic.pdf`, cover, thumbnail, serta
  `public/pdf.worker.min.mjs`.
- `public/assets/dashboard/home/**` yang dirujuk lewat konfigurasi/path dinamis.
- `public/comics/generated/**`; beberapa output memang perlu diregenerasi,
  tetapi bukan bukti bahwa file boleh dihapus.

## Metode dan batasan

Pemeriksaan menggunakan daftar file tracked, pencarian reference repository,
`package.json`, konfigurasi Next.js/TypeScript, route filesystem, dynamic import,
registry, dan path asset. Tidak ada penghapusan dilakukan sebagai bagian audit.

Ketiadaan hasil pencarian tidak cukup untuk menyatakan aman pada:

- route convention Next.js;
- dynamic import atau registry;
- URL publik yang dipanggil browser/deployment lain;
- script manual;
- fallback offline dan pipeline asset.

Validasi lanjutan sebelum cleanup massal: clean install, `npm run typecheck`,
`npm test`, `npm run build`, route smoke test, dan pemeriksaan URL asset pada
deployment yang sedang digunakan. Baseline audit sebelumnya mencatat typecheck,
test, dan build memiliki kegagalan tersendiri; hasil tersebut perlu diperbaiki
atau dibedakan dari perubahan cleanup sebelum menjadi bukti penghapusan.