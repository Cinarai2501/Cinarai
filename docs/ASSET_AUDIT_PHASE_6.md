# Audit Asset Cinarai - Fase 6

Tanggal audit: 2026-08-28
Branch: `main`
Metode: ukuran file dari git-tracked files, inventaris format, SHA-256 duplicate detection, dan pencarian referensi asset. Tidak ada asset yang dihapus atau dikompres pada fase ini.

## 1. Ringkasan Ukuran

| Format | Jumlah | Total ukuran |
|---|---:|---:|
| PNG | 230 | sekitar 394.7 MB |
| SVG | 48 | sekitar 52.9 MB |
| PDF | 6 | sekitar 105.6 MB |
| JPEG | 4 | sekitar 60 KB |
| WebP/AVIF/GIF | 0 | 0 |
| Font (`woff`, `woff2`, `ttf`, `otf`) | 0 | 0 |
| Video/audio | 0 | 0 |

Total asset media ter-track sekitar 553 MB. Angka ini tidak termasuk `node_modules` dan `.next`.

## 2. Asset Terbesar

### PDF

Urutan PDF lokal:

1. `public/comics/komik-5/comic.pdf` - sekitar 46.0 MB.
2. `public/comics/komik-6/comic.pdf` - sekitar 30.8 MB.
3. `public/comics/komik-2/comic.pdf` - sekitar 9.4 MB.
4. `public/comics/komik-1/comic.pdf` - sekitar 8.5 MB.
5. `public/comics/komik-3/comic.pdf` - sekitar 6.9 MB.
6. `public/comics/komik-4/comic.pdf` - sekitar 3.8 MB.

PDF komik 5 dan 6 adalah prioritas terbesar untuk optimasi storage/network. Jangan mengganti PDF dengan image per halaman sebelum fitur search/accessibility/reader dan kualitas visual diperiksa.

### PNG terbesar

Temuan terbesar berasal dari halaman komik 2:

- `public/comics/komik-2/pages-19.png` - sekitar 6.4 MB.
- `public/comics/komik-2/pages-10.png` - sekitar 5.4 MB.
- `public/comics/komik-2/pages-01.png` - sekitar 5.4 MB.
- `public/comics/komik-2/pages-14.png` - sekitar 4.9 MB.
- `public/comics/komik-2/pages-18.png` - sekitar 4.9 MB.
- `public/comics/komik-2/pages-15.png` - sekitar 4.5 MB.
- `public/comics/komik-2/pages-12.png` - sekitar 4.4 MB.
- `public/comics/komik-2/pages-13.png` - sekitar 4.4 MB.
- `public/comics/komik-2/pages-11.png` - sekitar 4.2 MB.
- `public/comics/komik-2/pages-17.png` - sekitar 4.0 MB.

Asset fitur komik 1 juga besar:

- `src/features/comics/comic-1/assets/application/Tangga.png` - sekitar 3.4 MB.
- `src/features/comics/comic-1/assets/application/Atap.png` - sekitar 3.3 MB.
- `src/features/comics/comic-1/assets/application/Ornament.png` - sekitar 3.1 MB.
- `src/features/comics/comic-1/assets/navigation/tanggacandi.png` - sekitar 3.1 MB.
- `src/features/comics/comic-1/assets/navigation/ornamentcandi.png` - sekitar 2.8 MB.
- `src/features/comics/comic-1/assets/navigation/atapcandi.png` - sekitar 2.7 MB.
- `src/features/comics/comic-1/assets/navigation/puncakcandi.png` - sekitar 2.7 MB.
- `src/features/comics/comic-1/assets/navigation/tubuhcandi.png` - sekitar 2.6 MB.

Cover/thumbnail PNG komik umumnya 3.2-3.9 MB walaupun rendered size cover dashboard jauh lebih kecil. Ini kandidat kuat untuk resized WebP/AVIF atau thumbnail derivative.

### SVG terbesar

Build artifact sebelumnya memperlihatkan SVG navigasi komik 3 sangat besar:

- `trapesium.svg` - sekitar 8.6 MB pada `.next/static/media`.
- `lingkaran-highlight.svg` - sekitar 7.9 MB.
- `trapesium-highlight.svg` - sekitar 7.5 MB.
- `persegi-panjang-highlight.svg` - sekitar 7.0 MB.
- `persegi-panjang.svg` - sekitar 5.8 MB.

Asset tersebut perlu disederhanakan dengan SVGO/path optimization setelah memastikan detail visual dan hit area tetap sama. SVG tidak boleh dikonversi ke JPEG bila membutuhkan transparansi/scalable path.

## 3. Format dan Kualitas

### PNG

Tidak semua PNG sebaiknya dikonversi:

- Badge, icon, shape overlay, dan ilustrasi dengan alpha/transparansi sebaiknya tetap PNG atau diuji WebP lossless/lossy dengan visual regression.
- Foto/scan halaman komik yang opaque lebih cocok diuji sebagai JPEG/WebP.
- Cover/thumbnail yang ditampilkan pada ukuran kecil sebaiknya memiliki derivative dimensi kecil, bukan memakai source 3-4 MB.
- Generated PNG yang 0 byte (`public/comics/generated/komik-{1,2,3}`) bukan kandidat optimasi; itu output rusak yang harus diregenerasi dan divalidasi signature PNG.

### JPEG/WebP/AVIF

Repository hanya memiliki empat JPEG kecil dan tidak memiliki WebP/AVIF. Tidak ada bukti bahwa pipeline menghasilkan modern format untuk asset statis karena `next.config.ts` menggunakan `images.unoptimized: true`.

Rekomendasi aman:

1. Pertahankan original berkualitas tinggi sebagai source/archive di luar initial route.
2. Generate derivative WebP/JPEG/AVIF berdasarkan rendered dimensions.
3. Bandingkan SSIM/visual inspection pada teks kecil, garis, dan alpha.
4. Gunakan derivative sesuai ukuran display dan `sizes` pada `next/image`.
5. Jangan mengubah semua PNG secara massal.

## 4. Duplicate Asset

SHA-256 menemukan duplicate byte-identik:

### Cover/thumbnail komik

- Komik 1: enam path cover/thumbnail identik, termasuk `public/comics/komik-1`, dashboard cover, dan `src/features/comics/comic-1/assets/cover`.
- Komik 4 dan 5 memiliki pola duplicate antara `public/comics`, dashboard/feature cover.
- Duplicate ini berpotensi menyebabkan update hanya pada satu copy sementara consumer lain tetap memakai copy lama.

### Badge/level icon

- Badge komik 1 memiliki copy pada `assets/raw-badges`, `assets/optimized-badges`, dan `public`.
- Icon level memiliki copy `raw`, `trimmed`, `optimized`, `public/badges`, dan dashboard, termasuk pasangan nama normal dan `-v2` yang kadang byte-identik.

### Generated

- `public/comics/generated/komik-1/page-1.png` dan `komik-3/page-1.png` terdeteksi sama-sama MD5 empty content karena keduanya berukuran 0 byte. Ini bukan duplicate visual yang valid, melainkan output gagal.

Duplicate tidak dihapus pada fase ini karena path-path tersebut bisa memiliki consumer berbeda, dan beberapa direktori (`raw`, `trimmed`, `optimized`) adalah tahapan pipeline.

## 5. Referensi dan Loading

- Cover dashboard/learning journey memakai `next/image`, tetapi `unoptimized: true` membuat file original tetap dikirim.
- Cover route memakai `priority`, tepat untuk satu hero tetapi perlu dihindari bila component digunakan sebagai list.
- Badge section memakai ukuran 84px tetapi asset badge berukuran 384px; derivative 128px atau WebP dapat mengurangi transfer tanpa perubahan visual.
- `PdfCoverCanvas` merender cover dari PDF dan membuat blob URL; ini menghindari pengiriman cover image terpisah pada consumer tertentu tetapi tetap membutuhkan PDF download.
- Tidak ditemukan media audio/video/font yang dapat menghabiskan transfer.

## 6. Prioritas Optimasi Berdasarkan Dampak

### P0 - Perbaiki output rusak

- Regenerasi tiga generated PNG 0-byte dengan pipeline `canvas` yang stabil.
- Validasi magic bytes PNG dan ukuran minimum sebelum replace.
- Jangan commit output kosong.

### P1 - PDF terbesar

- Kompres PDF komik 5/6 dengan preset yang menjaga teks/line art.
- Ukur kualitas visual pada halaman padat dan QR.
- Pertahankan versioning PDF setelah file berubah.

### P1 - SVG navigasi komik 3

- Jalankan SVGO dengan konfigurasi konservatif.
- Bandingkan screenshot before/after dan ukuran build artifact.
- Pastikan `viewBox`, transparency, stroke, dan shape hit area tidak berubah.

### P2 - Cover/thumbnail dan halaman PNG

- Buat derivative berdasarkan ukuran render aktual.
- Uji WebP/JPEG untuk asset opaque dan WebP/PNG untuk asset transparan.
- Arahkan semua consumer ke satu canonical path, lalu hapus duplicate hanya setelah reference scan.

### P2 - Lazy loading

- Gunakan lazy loading/default `next/image` untuk card di bawah fold.
- Pertahankan `priority` hanya untuk hero/asset yang terbukti above-the-fold.
- Set `sizes` sesuai grid agar browser tidak memilih source terlalu besar.

### P3 - Pipeline housekeeping

- Bedakan source raw, intermediate trimmed, optimized, dan published secara eksplisit.
- Jangan menyimpan output intermediate dalam deployment bila hanya dibutuhkan saat build.
- Tambahkan script laporan ukuran dan duplicate hash ke CI tanpa menghapus otomatis.

## 7. Asset yang Tidak Ditemukan

Tidak ada file ter-track dengan ekstensi:

- WebP, AVIF, GIF.
- WOFF/WOFF2/TTF/OTF.
- MP4, WebM, MP3, WAV, M4A.

Tidak ada target optimasi font/video/audio pada repository saat ini.

## 8. Batasan dan Validasi

- Dimensi/alpha detail tidak dapat diukur penuh karena tool image metadata tidak tersedia pada container; konversi format belum dilakukan.
- Build production belum bisa menghasilkan baseline baru karena `prebuild` gagal pada native `canvas` dengan `Bus error`.
- Test visual browser/Lighthouse belum dijalankan pada fase ini.
- Audit ini tidak menghapus, mengompres, memindahkan, atau mengganti asset.
