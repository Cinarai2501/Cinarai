# Audit PDF Cinarai - Fase 4

Tanggal audit: 2026-08-28
Branch: `main`

## Kesimpulan

Penyebab utama PDF lama tetap tampil adalah URL resource yang stabil ketika isi file diganti. Sebelum perubahan fase ini:

- Firestore `pdfUrl` dipakai langsung sebagai `Comic.pdfPath` dan `ComicAsset.sourcePdfPath`.
- Fallback lokal memakai `/comics/komik-{id}/comic.pdf` tanpa version query.
- `react-pdf` menerima URL yang sama, sehingga browser/PDF.js/CDN dapat menggunakan response lama.
- `Document` tidak memiliki `key` berbasis resource.
- `PdfCoverCanvas` memakai cache cover berdasarkan `pdfPath`, sehingga PDF yang diganti pada path sama dapat mempertahankan cover blob lama.

Tidak ditemukan `iframe`, `<embed>`, `<object>`, service worker, IndexedDB, Cache Storage, atau PDF URL yang disimpan di localStorage/sessionStorage. Jalur PDF aktif adalah `react-pdf`/PDF.js.

## Pemetaan Pipeline

### Sumber URL dan metadata

- Fallback lokal: `src/data/comics.ts`.
- Firestore mapping: `src/services/comicFirestoreService.ts`.
- Domain model: `src/types/comic.ts` (`pdfPath` dan sekarang `pdfVersion`).
- Asset model: `src/lib/comicAsset.ts` dan `src/services/comic-assets/comicAssetRepository.ts`.
- Viewer entry: `src/components/comic/PdfReader.tsx`.
- Viewer utama: `src/components/pdf/PdfViewer.tsx`.
- PDF page renderer: `src/components/pdf/PdfPage.tsx` memakai `react-pdf` `Page`.
- Worker: `/pdf.worker.min.mjs`, disalin dari `pdfjs-dist` saat client webpack build.

### Storage/upload

`src/lib/firebase/storage.ts` memakai Firebase Storage `uploadBytes`/`uploadString` lalu `getDownloadURL`. Caller menentukan path Storage. Tidak ada updater atomik yang menyimpan hash/version PDF ke dokumen comic.

Jika file PDF diganti pada object path yang sama, `getDownloadURL()` dapat tetap memiliki URL yang efektif sama. CDN/browser tidak harus mengunduh ulang content hanya karena byte object berubah.

### Cache headers

`next.config.ts` mengatur `Cache-Control: no-cache, must-revalidate` untuk PDF lokal `/comics/:slug/comic.pdf`. Ini membantu revalidasi pada hosting yang menghormati header Next, tetapi tidak mengendalikan Firebase Storage/CDN di luar Next. URL versioning tetap diperlukan untuk remote Storage.

### State/cache React

- `PdfReader` memilih path dari `asset.sourcePdfPath` atau prop `pdfPath`.
- `PdfViewer` menyimpan page/loading/error/dimensi di state dan reset saat `initialPage` atau `pdfPath` berubah.
- `PdfViewer` tidak membuat blob URL untuk PDF utama; PDF.js mengelola loading task/resource.
- `PdfCoverCanvas` membuat blob URL image cover dan menyimpan cache module-level. Cleanup kini memakai consumer count dan `URL.revokeObjectURL`, dengan revoke tertunda agar aman terhadap React Strict Mode.
- Preview upload profile dan CSV/report blob URL sudah direvoke pada consumer masing-masing.

## Perubahan yang Diimplementasikan

### 1. Versioning terpisah dari path kanonik

`Comic` sekarang memiliki optional `pdfVersion?: string | number`.

- `Comic.pdfPath` tetap raw/kanonik agar pipeline server/filesystem tidak mencoba membuka nama file yang mengandung `?v=`.
- Firestore mapper memakai `doc.updatedAt` untuk mengisi `pdfVersion`.
- Fallback lokal memakai `LOCAL_PDF_VERSION = '2026-08-28'`.
- `PdfReader` membentuk URL browser memakai `versionImageUrl(pdfPath, pdfVersion)`.

Contoh browser URL lokal:

`/comics/komik-1/comic.pdf?v=2026-08-28`

Contoh browser URL Firebase:

`https://storage.../comic.pdf?token=abc&v=1724803200000`

Versi stabil tidak dibuat ulang setiap render.

### 2. Force remount PDF document

`PdfViewer` sekarang memberi `key={pdfPath}` pada `Document`. Ketika PDF version berubah, URL berubah, component `Document` remount, dan state internal PDF.js tidak dipakai ulang untuk resource lama.

### 3. Cleanup object URL cover

`PdfCoverCanvas` sekarang melacak consumer per `pdfPath` dan mencabut cached object URL ketika tidak ada consumer. Revoke ditunda satu task agar effect replay React Strict Mode tidak mencabut URL yang langsung akan dipakai ulang.

## Validasi

- Keenam PDF lokal tetap menggunakan path filesystem kanonik tanpa query di domain model.
- Semua PDF lokal memiliki `pdfVersion` rilis stabil.
- `PdfReader` adalah satu-satunya boundary yang menambahkan query version ke URL browser.
- Tidak ada jalur iframe/embed/object/service worker/cache storage yang terlewat.
- Lint file terkait berhasil.
- Editor error check file terkait bersih.
- Test PDF/versioning lulus 6/6:
  - initial page PDF;
  - document load notification;
  - reset guard untuk document baru;
  - version URL dan Firestore-like timestamp.

## Kewajiban Pipeline Upload

Agar invalidasi benar-benar bekerja ketika PDF remote diperbarui:

1. Upload file ke Storage.
2. Dapatkan URL download terbaru.
3. Update dokumen Firestore comic pada operasi yang sama dengan `pdfUrl` dan `updatedAt` baru.
4. Bila object path tetap dan `updatedAt` tidak berubah, frontend tidak memiliki sinyal perubahan.
5. Idealnya simpan `pdfVersion` berbasis content hash; `updatedAt` adalah fallback yang cukup bila setiap perubahan asset selalu meng-update dokumen.

Jangan gunakan `Date.now()` di render JSX atau pada setiap pemanggilan getter URL, karena itu akan mematikan cache dan mengunduh ulang PDF terus-menerus.

## Risiko dan Batasan

- Firebase Storage/CDN cache policy production tidak dapat dipastikan dari repository ini karena `firebase.json` tidak berisi konfigurasi Hosting/headers Storage.
- Dokumen Firestore lama tanpa `updatedAt` valid akan menghasilkan URL PDF tanpa versi; migration/backfill metadata perlu dilakukan bila dokumen tersebut aktif.
- `PdfCoverCanvas` cache hanya hidup dalam satu page runtime. Cache lama antar-deployment ditangani oleh versi URL.
- PDF komik 5 dan 6 berukuran besar, sehingga versioning memperbaiki freshness tetapi tidak mengurangi transfer pertama. Kompresi/splitting PDF adalah optimasi terpisah.
- Build penuh masih terblokir pipeline native `canvas` pada `prebuild`, sehingga validasi browser waterfall production belum dapat dilakukan.

## Rekomendasi Berikutnya

1. Tambahkan `pdfVersion` eksplisit berbasis SHA-256 pada schema Firestore dan uploader.
2. Backfill `updatedAt`/`pdfVersion` untuk comic documents lama.
3. Tambahkan integration test yang mengganti URL/version dan memastikan `Document` remount.
4. Uji Firebase Storage response headers dan CDN cache setelah deployment.
5. Ukur download PDF komik 5/6 dan pertimbangkan kompresi atau delivery per halaman.
