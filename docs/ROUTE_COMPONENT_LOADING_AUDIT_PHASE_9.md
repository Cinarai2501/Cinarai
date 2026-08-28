# Audit Route & Component Loading Cinarai - Fase 9

Tanggal audit: 2026-08-28
Branch: `main`

## 1. Ringkasan

Target fase ini adalah memastikan halaman awal hanya memuat kode yang diperlukan untuk first paint. Temuan paling penting adalah `StageRouter` mengimpor seluruh stage learning secara statis, dan dashboard guru mengimpor panel AI/detail siswa walaupun keduanya hanya dipakai setelah interaksi.

Perubahan yang diterapkan:

- Semua stage learning di `StageRouter` sekarang memakai `next/dynamic`.
- `StudentDetail` dan `AiAssistantPanel` pada dashboard guru sekarang lazy-loaded.
- Fallback loading untuk split stage dibuat ringan (`null`) agar tidak menambah UI/blocking work.

PDF viewer sebelumnya sudah memakai dynamic import dengan `ssr: false` melalui `PdfReader` dan `ContextualizationStage`.

## 2. Entry Point dan Route Loading

### Root/public

- `src/app/layout.tsx` adalah root layout dan memasang `AuthProvider` serta `SnackbarProvider` untuk seluruh route.
- `src/app/page.tsx` hanya redirect ke `/auth/login`.
- Root layout tidak mengimpor PDF viewer, admin panel, viewer 3D, atau report component langsung.
- Auth Firebase tetap masuk jalur root melalui `AuthProvider`; pemisahan Firebase Auth/Firestore/Storage dibahas pada audit performance, bukan diubah pada fase ini.

### Auth

- `/auth/login`, `/auth/signup`, dan `/auth/forgot-password` menggunakan form/auth route masing-masing.
- Tidak ditemukan import PDF/3D/admin dari auth pages.
- Beban Firebase client masih berpotensi eager karena `firebase/auth.ts` mengimpor `firebase/client.ts` yang membuat Auth, Firestore, dan Storage sekaligus.

### Learning/comic

- `/comic/{id}/learn` memuat learning engine.
- `StageRouter` memilih stage berdasarkan state, tetapi sebelumnya semua component stage sudah masuk static graph.
- Setiap stage dapat menarik content package komik dan library terkait.
- PDF viewer sudah menjadi dynamic boundary; `react-pdf` tidak perlu dimuat untuk stage non-PDF sebelum pengguna masuk Contextualization.

### Dashboard guru

- `/dashboard/guru` menggunakan `GuruDashboardPage`.
- Overview, student directory, detail siswa, AI panel, report printer, dan hooks sebelumnya berada dalam satu page graph.
- Detail siswa hanya muncul setelah `selectedUid` dipilih.
- AI panel hanya muncul ketika tab AI dipilih.

### Rare/heavy routes

- `/viewer/3d` saat ini hanya menampilkan fallback text dan tidak mengimpor `Universal3DViewer`.
- `/viewer/object/[id]` server page mengimpor `ObjectDetailClient`, `Comic2ObjectDetailClient`, dan `Comic3ObjectDetailClient` statis sebelum memilih berdasarkan `comicId`. Route ini jarang dibuka tetapi masih kandidat lazy boundary.
- `/ai-tutor/[id]` mengimpor `AiTutorClient`; AI request hanya on-demand, tetapi client module tetap masuk route bundle.
- `/debug-pdf` sudah memakai dynamic `PdfViewer`.
- `/debug/firebase` adalah route debug dan tidak ikut root first paint.

## 3. Perubahan Implementasi

### Stage-level code splitting

File: `src/features/learning-engine/components/StageRouter.tsx`

Sebelumnya seluruh stage diimpor statis:

- Cover
- Contextualization/PDF
- Identification
- Navigation dan Comic 2 Navigation
- Argumentation
- Resolution
- Application
- Introspection
- Finish

Sekarang setiap stage menggunakan `dynamic(() => import(...))`. Konsekuensinya:

- Initial stage tidak perlu mengunduh seluruh stage code.
- PDF/react-pdf tetap hanya diminta saat Contextualization dirender.
- Identification/AI/QR/application/report code dapat masuk chunk terpisah.
- Behavior switch stage tetap sama.

### Guru detail dan AI

File: `src/app/dashboard/guru/page.tsx`

- `StudentDetail` sekarang dimuat saat `selectedUid` ditampilkan.
- `AiAssistantPanel` sekarang dimuat saat tab AI ditampilkan.
- Overview dashboard tidak perlu parse component kompleks tersebut pada first render.

## 4. Temuan Komponen Berat

### PDF

- `react-pdf`/PDF.js adalah library besar dan sudah lazy-loaded melalui `PdfReader`.
- `PdfViewer` merender halaman aktif dan halaman target selama transisi; ini peak CPU/RAM saat navigasi, bukan initial route issue.
- Worker PDF lokal hanya dipakai setelah viewer masuk.

### AI/animation

- `framer-motion` dipakai banyak stage dan popup. Stage-level split mengurangi initial loading pada route/stage non-AI, tetapi chunk stage AI tetap berat ketika dibuka.
- `AiAssistantPanel` guru kini lazy-loaded.
- AI network call hanya dijalankan setelah aksi pengguna pada panel.

### QR/3D

- `qrcode` digunakan di `Universal3DViewer`, route 3D utama saat ini hanya fallback.
- QR modal/scanner masih berada di stage/component masing-masing; stage splitting menunda sebagian besar sampai stage terkait aktif.
- `ObjectDetailClient` masih mengimpor `ObjectAITutor` dan `QrModal` statis. Keduanya kandidat lazy-load lanjutan untuk route rare.

### Analytics/report/admin

- Dashboard guru dan report melakukan query berat, tetapi fase ini hanya menangani loading component. Query optimization tercatat pada audit database fase 8.
- `StudentDetail` kini lazy; `GuruReportClient` tetap route-specific.
- Printer/report helper tidak dimuat pada root/public route, tetapi masih statis pada guru dashboard page karena action export berasal dari page.

## 5. Verifikasi Initial Load

Build baru belum dapat menghasilkan perbandingan chunk final karena `prebuild` gagal pada native `canvas` dengan `Bus error` exit 135. Artifact lama menunjukkan route server guru sekitar 56 KB dan object detail sekitar 55 KB, tetapi angka itu bukan baseline bersih untuk perubahan ini.

Validasi yang berhasil:

- Lint `StageRouter` berhasil.
- Lint dashboard guru berhasil setelah dynamic imports.
- TypeScript tidak menambahkan error baru pada kedua file; `tsc` tetap menampilkan error baseline Firebase/Firestore/framer-motion yang sudah ada.

## 6. Hal yang Tidak Diubah

- Tidak menambahkan `useMemo`/`useCallback` baru hanya untuk mengejar optimasi nominal.
- Tidak lazy-load `AuthProvider` karena provider root memang dibutuhkan untuk route protected dan pemisahannya menyentuh arsitektur Firebase.
- Tidak mengubah `/viewer/object/[id]` menjadi dynamic wrapper karena membutuhkan boundary client/server baru dan route tidak masuk initial public page.
- Tidak menunda `CoverStage` atau teks/layout first stage yang memang dibutuhkan untuk first paint learning.
- Tidak menambah loading skeleton kompleks yang akan menambah JavaScript/chunk.

## 7. Rekomendasi Prioritas Berikutnya

1. Perbaiki `prebuild` native canvas agar ukuran chunk route dapat diukur ulang.
2. Pisahkan Firebase Auth client dari Firestore/Storage initialization.
3. Ubah loader content komik menjadi dynamic per comic ID, bukan import keenam modul sekaligus.
4. Lazy-load tiga object detail client berdasarkan `comicId` melalui client wrapper bila route viewer terbukti sering digunakan.
5. Lazy-load `ObjectAITutor`, QR scanner/modal, dan library animation/QR hanya saat tombol/fitur dibuka.
6. Gunakan React Profiler dan browser Coverage untuk mengukur apakah context root memicu rerender mahal.
7. Tambahkan route smoke test untuk memastikan dynamic chunk error memiliki fallback dan retry yang layak.
