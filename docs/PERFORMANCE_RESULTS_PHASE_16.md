# Pengukuran Hasil Optimasi - Fase 16

Tanggal: 2026-08-28
Baseline: `HEAD` (`5c23da7`) dibandingkan dengan worktree setelah Fase 12-15.

Perbandingan byte memakai ukuran file Git HEAD sebagai BEFORE dan ukuran file yang masih ada di worktree sebagai AFTER. File generated yang sebelumnya 0-byte dilaporkan terpisah agar tidak disalahartikan sebagai penghematan.

## 1. Masalah Utama

- URL gambar/PDF yang sama dapat menunjuk bytes baru, sehingga browser/CDN dapat menyajikan response lama.
- PDF dan generated image memakai `no-cache` sehingga valid terhadap stale content, tetapi memicu revalidasi setiap akses.
- Enam salinan cover komik 4/5 byte-identik berada di source feature tanpa consumer aktif.
- Pipeline export observation image gagal pada API input PDF dan menghasilkan output 0-byte.
- Asset terbesar tetap PDF komik 5 dan 6; optimasi kompresi belum dilakukan.

## 2. Penyebab Gambar Lama

Penyebabnya adalah URL stabil tanpa versi pada asset lokal dan URL Firebase Storage yang sama setelah object diganti. Tidak ditemukan service worker atau Cache Storage aplikasi. Sekarang URL menggunakan versi stabil dari release version lokal atau `updatedAt` Firestore; tidak ada timestamp render.

## 3. Penyebab PDF Lama

PDF memakai path/URL yang sama dan `PdfCoverCanvas` sebelumnya meng-cache hasil render berdasarkan path tersebut. Sekarang `PdfReader` membentuk URL berversi, dan cache cover mengikuti URL PDF berversi. URL legacy tetap revalidasi dengan `no-cache`.

## 4. File yang Dihapus

- `.env.example.bak`: backup konfigurasi lama tanpa reference repository.
- `src/features/comics/comic-4/assets/cover/cover-komik-4.png`
- `src/features/comics/comic-4/assets/cover/cover.png`
- `src/features/comics/comic-4/assets/cover/thumbnail.png`
- `src/features/comics/comic-5/assets/cover/cover-komik-5.png`
- `src/features/comics/comic-5/assets/cover/cover.png`
- `src/features/comics/comic-5/assets/cover/thumbnail.png`

Enam PNG tersebut byte-identik dengan asset canonical di `public/comics` dan tidak memiliki consumer aktif. Total pengurangan file duplicate: 20.821.272 byte (20,821 MB atau 19,857 MiB).

## 5. Dependency yang Dihapus

- `json-stable-stringify-without-jsonify`: tidak memiliki importer direct; tetap tersedia transitif melalui ESLint.
- `lodash.merge`: tidak memiliki importer direct; tetap tersedia transitif melalui ESLint.

Jumlah dependency direct turun dari 32 menjadi 30. Jumlah package terpasang tidak turun secara setara karena kedua package masih dibutuhkan transitif oleh ESLint; penghematan installed tree: tidak terukur.

## 6. Optimasi yang Dilakukan

- Cache immutable satu tahun hanya untuk PDF/generated PNG dengan query `v`.
- URL tanpa versi tetap `no-cache, must-revalidate` sebagai fallback aman.
- Versioning memakai nilai stabil, bukan `Date.now()` pada render.
- Cache `PdfCoverCanvas` mengikuti URL PDF versi.
- Exporter PDF memakai `Uint8Array`, `@napi-rs/canvas`, dan CanvasFactory yang kompatibel dengan PDF.js.
- Generated output ditulis atomik melalui file temporary lalu rename.
- Duplicate asset dan direct dependency yang terbukti tidak diperlukan dihapus.

## 7. Performance Before vs After

| Metrik | BEFORE | AFTER | SAVED / delta |
|---|---:|---:|---:|
| `public` tracked bytes | 316.330.868 B | 321.096.437 B | +4.765.569 B |
| `src/features/comics` bytes | 181.071.152 B | 160.249.880 B | -20.821.272 B |
| Dua scope di atas | 497.402.020 B | 481.346.317 B | -16.055.703 B |
| Duplicate cover asset | 20.821.272 B | 0 B | 20.821.272 B |
| Generated PNG 1-3 | 0 B | 4.765.569 B | +4.765.569 B valid output |
| Dependency direct | 32 | 30 | 2 deklarasi |
| Installed package tree | tidak terukur | 664 path | tidak terukur |
| CSS source `globals.css` | 8.371 B | 8.371 B | 0 B |
| CSS production output | tidak terukur | tidak terukur | tidak terukur |
| JS bundle BEFORE | tidak terukur | tidak terukur | tidak terukur |
| JS bundle AFTER | tidak terukur dari artifact tersimpan | Build report: shared 103 kB; route terbesar 270 kB First Load JS | delta tidak terukur |
| Build directory | sekitar 291 MB pada audit lama, bukan baseline build valid | tidak terukur setelah artifact dibersihkan environment | tidak terukur |
| Number of requests | tidak terukur | tidak terukur | tidak terukur |
| Initial load | tidak terukur | tidak terukur | tidak terukur |
| Initial-loaded components | tidak terukur | tidak terukur | tidak terukur |
| Runtime work | revalidasi PDF/image setiap akses | URL versi dapat immutable cache; render cover reuse per URL | pengurangan request/render tidak terukur |

### Largest assets AFTER

- `public/comics/komik-5/comic.pdf`: 44.964 KB.
- `public/comics/komik-6/comic.pdf`: 30.088 KB.
- `public/comics/komik-2/comic.pdf`: 9.228 KB.
- `public/comics/komik-1/comic.pdf`: 8.312 KB.
- `public/comics/komik-3/comic.pdf`: 6.824 KB.
- SVG navigasi komik 3 terbesar berada sekitar 5.692-8.412 KB.

Tidak ada kompresi PDF/SVG pada fase ini, sehingga bottleneck asset terbesar masih tersisa.

## 8. Risiko / Catatan

- Cache immutable aman hanya jika uploader selalu mengubah `updatedAt`/versi ketika bytes Firebase Storage berubah.
- E2E authentication, upload, Firestore, dan database tidak memiliki fixture integration terisolasi; tidak dapat dinyatakan lulus hanya dari build.
- Unit test masih memiliki 4 kegagalan akibat loader PNG/SVG dan fixture auth.
- `format:check` masih gagal pada banyak file baseline.
- npm melaporkan 29 vulnerability dan warning deprecation `glob`.
- Request count, Lighthouse, network waterfall, memory, dan component coverage belum dapat diukur tanpa browser profiling/HAR.

## 9. Validation

- `npm install --ignore-scripts`: berhasil.
- `npm run lint`: lulus.
- `npm run typecheck`: lulus.
- `npm test`: 11/15 lulus; 4 gagal seperti catatan di atas.
- `npm run prebuild`: lulus.
- `NEXT_TELEMETRY_DISABLED=1 npm run build`: berhasil pada percobaan lengkap; 51/51 halaman statis tergenerasi dan seluruh route masuk build report.
- `npm run format:check`: gagal pada baseline formatting.
- `node scripts/check-env.js`: seluruh Firebase client/admin variable tersedia.
- Smoke HTTP: route `/auth/login` dan `/comic/1` HTTP 200; PDF, gambar, dan generated PNG HTTP 200 dengan ukuran non-zero.
- Smoke cache: URL `?v=...` mendapat `public, max-age=31536000, immutable`, URL tanpa versi mendapat `no-cache, must-revalidate`.
- `git diff --check`: lulus.

Tidak ada perubahan struktur database, API contract, authentication flow, Firebase data, atau production asset yang masih direferensikan.
