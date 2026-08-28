# Audit Dependency Cinarai - Fase 7

Tanggal audit: 2026-08-28
Branch: `main`
Metode: inspeksi `package.json`, root `package-lock.json`, import statis/dynamic, script, config, npm tree, ukuran install, dan `npm explain`. Tidak ada dependency yang dihapus pada fase ini.

## 1. Ringkasan

Dependency utama secara umum memiliki reference nyata. Tidak ditemukan package production yang aman dihapus hanya karena tidak muncul pada import sederhana. Beberapa package dipakai hanya oleh tooling/script, tetapi tetap diperlukan oleh command yang terdaftar.

Kandidat paling lemah:

- `json-stable-stringify-without-jsonify`: tidak ditemukan import/reference langsung.
- `lodash.merge`: tidak ditemukan import/reference langsung.

Keduanya masih diklasifikasikan **kandidat unused**, bukan aman dihapus, sampai workflow eksternal/command manual dan konfigurasi tersembunyi dikonfirmasi.

Temuan besar:

- `firebase` sekitar 41 MB install dan `firebase-admin` sekitar 18 MB, tetapi keduanya dipakai oleh jalur runtime/API.
- `canvas` sekitar 24 MB, dipakai pipeline PDF/QR dan script asset; penting untuk build/tooling, tetapi menyebabkan `prebuild` `Bus error` pada environment audit.
- `next`/`@next` besar di `node_modules`, tetapi framework inti dan bukan kandidat cleanup.
- `playwright`/`playwright-core` hanya tooling E2E/audit, bukan browser runtime, tetapi dipakai script.
- `sharp` dipakai pipeline badge dan terkait image tooling; bukan kandidat hapus tanpa mengganti script.
- `@emnapi/runtime` muncul sebagai **extraneous** di `npm ls`, tetapi tidak tercantum di manifest. Ini kemungkinan artefak install/native optional dependency dan bukan bukti package perlu diedit.

## 2. Manifest dan Lockfile

`package.json` dan root package pada `package-lock.json` konsisten untuk dependency direct yang terlihat. Lockfile v3 digunakan.

Dependency runtime:

| Package | Reference nyata | Peran | Penilaian |
|---|---|---|---|
| `next` | route/config/client/server | framework | Wajib |
| `react`, `react-dom` | seluruh UI | framework UI | Wajib |
| `firebase` | Auth, Firestore, Storage, client components | backend client | Wajib |
| `firebase-admin` | API guru dan script admin | backend server/admin | Wajib |
| `react-pdf` | `PdfViewer`, `PdfPage`, `PdfCoverCanvas` | PDF browser | Wajib untuk fitur PDF |
| `canvas` | pipeline export/QR, extract cover | build/tooling server | Dipakai, perlu isolasi dari client |
| `jsqr` | QR scanner dan pipeline decode | QR | Dipakai |
| `qrcode` | `Universal3DViewer` | QR generation | Dipakai |
| `framer-motion` | popup/tutor/stage components | animation | Dipakai banyak komponen |

Dev dependency:

| Package | Reference nyata | Peran | Penilaian |
|---|---|---|---|
| `eslint`, `eslint-config-next` | npm lint/config | lint | Wajib untuk lint |
| `@eslint/eslintrc` | konfigurasi/plugin transitif atau config | ESLint support | Pertahankan sampai config audit selesai |
| `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` | ESLint TypeScript | lint | Dipakai |
| `eslint-plugin-import` | ESLint config/plugin | lint | Dipakai melalui config |
| `eslint-plugin-react`, `eslint-plugin-react-hooks` | ESLint config/plugin | lint | Dipakai melalui config |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/qrcode` | TypeScript | type declarations | Dipakai |
| `typescript` transitif/tooling | `typecheck` | compiler | Wajib |
| `tsx` | test dan script TypeScript | runner | Dipakai |
| `playwright` | E2E/audit scripts | browser test | Dipakai |
| `prettier` | format scripts | formatting | Dipakai |
| `tailwindcss` | `tailwind.config.ts`, CSS build | CSS build | Dipakai |
| `postcss` | `postcss.config.js`, Next/Tailwind | CSS build | Dipakai |
| `autoprefixer` | PostCSS config | CSS transform | Dipakai |
| `sharp` | badge optimize/trim scripts | image processing | Dipakai script |
| `dotenv` | env server/check script | env loading | Dipakai |
| `json-stable-stringify-without-jsonify` | tidak ditemukan | tidak terkonfirmasi | Kandidat unused |
| `lodash.merge` | tidak ditemukan | tidak terkonfirmasi | Kandidat unused |

## 3. Reference Nyata

### Static import

Reference langsung terkonfirmasi untuk:

- Firebase client/admin/Auth/Firestore/Storage.
- PDF: `react-pdf`, `pdfjs-dist` melalui react-pdf/pipeline.
- QR: `jsqr`, `qrcode`.
- Animation: `framer-motion`.
- Native image/PDF pipeline: `canvas`, `sharp`.
- Tooling: `dotenv`, Playwright, ESLint plugins, Tailwind/PostCSS, Prettier.

### Dynamic import

Pencarian `import(...)` dilakukan pada source/script. Tidak ditemukan penggunaan dynamic import yang menyamarkan `json-stable-stringify-without-jsonify` atau `lodash.merge`. Dynamic loading PDF berada pada batas client viewer dan bukan dependency unused.

### Scripts

Dependency yang tampak “hanya dipakai satu fungsi” tetap memiliki command aktif:

- `canvas`: `export-comic-observation-images.mjs`, `extract-covers.mjs`, `decode-qrs.mjs`, pipeline asset.
- `sharp`: `scripts/optimize-badges.ts`, `scripts/trim-badges.ts`.
- `playwright`: E2E/audit/replay scripts.
- `firebase-admin`: user cleanup/detection/listing/debug admin scripts dan API.
- `dotenv`: `scripts/check-env.js` dan env server.

Menghapus package tersebut tanpa menghapus/mengganti command akan merusak workflow yang masih terdaftar.

## 4. Dependency Berat

Ukuran berikut adalah ukuran direktori install lokal, bukan ukuran browser bundle:

1. `next` sekitar 156 MB.
2. `@next` sekitar 149 MB.
3. `firebase` sekitar 41 MB.
4. `pdfjs-dist` transitif sekitar 37 MB.
5. `canvas` sekitar 24 MB.
6. `firebase-admin` sekitar 18 MB.
7. `playwright-core` transitif sekitar 13 MB.
8. `prettier` sekitar 9.7 MB.
9. `@google-cloud` transitif sekitar 8.2 MB.
10. `tailwindcss` sekitar 7.2 MB.

Interpretasi:

- Ukuran `node_modules` tidak sama dengan initial JavaScript browser.
- Pengurangan paling berdampak ke browser berasal dari import graph/code splitting, bukan menghapus package server/tooling.
- Firebase client tetap perlu dipisahkan secara bundle boundary agar halaman publik tidak eager menginisialisasi semua service.
- `canvas`, `firebase-admin`, `sharp`, dan Playwright harus tetap server/tooling-only.

## 5. Duplicate dan Peer/Transitive Dependency

Tidak ditemukan duplicate version untuk package direct utama pada lokasi top-level-nya. Lockfile memiliki nested copies transitive yang normal:

- `next` membawa nested `postcss` versi berbeda dari root `postcss`.
- ESLint plugins membawa nested `semver`, `doctrine`, dan `debug`.
- `qrcode` membawa dependency CLI lama nested.
- Firebase Admin membawa beberapa package Firebase/GCP dengan versi dan scope tersendiri.

Nested duplicate tidak boleh dihapus manual dari lockfile. Penyelesaiannya hanya melalui upgrade/dedupe yang kompatibel dan validasi build.

`npm ls --depth=0 --omit=optional` menampilkan `@emnapi/runtime` sebagai extraneous. Package ini tidak tercantum di `package.json`; kemungkinan berasal dari optional/native dependency installation. Verifikasi dengan clean install diperlukan sebelum tindakan.

Tidak ada bukti peer dependency yang hilang pada hasil `npm ls` selain warning/error baseline aplikasi yang tidak terkait audit manifest.

## 6. API Native dan Library Kecil

- `json-stable-stringify-without-jsonify` dan `lodash.merge` akan lebih baik diganti API native bila memang ditemukan caller, tetapi saat audit tidak ada caller.
- `qrcode` dan `jsqr` tidak sebaiknya diganti dengan API native karena browser tidak menyediakan generator/decoder QR setara.
- `framer-motion` dapat diganti sebagian dengan CSS untuk animasi sederhana, tetapi dipakai di banyak komponen; ini refactor behavior, bukan cleanup dependency otomatis.
- `dotenv` dapat diganti loader native/env platform pada sebagian script, tetapi `.env.local` parsing dan workflow saat ini bergantung padanya.
- `canvas` tidak punya API native Node yang setara untuk rendering PDF/QR pada pipeline saat ini.

## 7. Legacy/Fitur Lama

Tidak ditemukan dependency dengan nama legacy/deprecated/old pada manifest. Kandidat yang perlu pemeriksaan workflow:

- `json-stable-stringify-without-jsonify` dan `lodash.merge` kemungkinan sisa implementasi lama karena tidak ada import.
- `canvas` pipeline lama/berat masih menjadi bagian `prebuild` dan menyebabkan crash native; package dipakai nyata, tetapi command/pipeline mungkin perlu dipindah atau diganti, bukan package langsung dihapus.
- `firebase-admin` memiliki beberapa script debug/manual; package tetap dipakai API production.

## 8. Validasi dan Risiko

Validasi yang dilakukan:

- Import/reference statis dan dynamic pada source, scripts, e2e, config.
- `npm ls --depth=0 --omit=optional`.
- `npm explain` untuk kandidat dan package native/berat.
- Pemeriksaan root `package-lock.json` dan nested package versions.
- Ukuran direktori package ter-install.

Batasan:

- Tidak dapat membuktikan workflow CI/CD eksternal yang memanggil package melalui command di luar repository.
- Build masih gagal pada `prebuild` native `canvas` dengan `Bus error`.
- Typecheck/test memiliki error baseline yang sudah tercatat di audit sebelumnya.
- `npm audit` bukan bukti dependency unused; vulnerability remediation harus dilakukan terpisah dan bertahap.

## 9. Rekomendasi

1. Verifikasi `json-stable-stringify-without-jsonify` dan `lodash.merge` dengan clean install serta pemeriksaan seluruh config/CI sebelum `npm uninstall`.
2. Pisahkan Firebase Auth dari Firestore/Storage bundle boundary seperti rekomendasi fase performance.
3. Isolasi `canvas`, `sharp`, dan `firebase-admin` dari client graph.
4. Perbaiki pipeline `prebuild` agar tidak crash, lalu ukur bundle dengan build yang berhasil.
5. Gunakan `npm dedupe --dry-run` atau upgrade terarah, bukan edit manual nested lock entries.
6. Tambahkan dependency usage check di CI untuk kandidat unused, tetapi jangan gagal hanya karena package hanya dipakai script.
7. Setelah setiap penghapusan dependency, jalankan lint, typecheck, test, build, dan semua script yang menggunakannya.
