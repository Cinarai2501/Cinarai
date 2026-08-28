# Audit Gambar Cinarai - Fase 3

Tanggal audit: 2026-08-28
Branch: `main`

## Kesimpulan

Penyebab paling kuat gambar lama tetap tampil adalah URL asset yang tetap sama ketika isi file berubah:

- Firestore hanya menyimpan `coverUrl` dan `thumbnailUrl`.
- Fallback lokal memakai path tetap seperti `/comics/komik-1/thumbnail.png`.
- Tidak ada hash/version asset pada URL maupun field metadata khusus.
- Upload helper mengembalikan `getDownloadURL()` untuk path yang sama, tetapi tidak memperbarui metadata comic secara terstruktur dengan versi asset.
- `next.config.ts` sebelumnya hanya menangani header asset lokal; tidak dapat mengontrol cache Firebase Storage/CDN.

Tidak ditemukan service worker atau Cache Storage aplikasi. Tidak ditemukan pembacaan cache gambar dari localStorage/sessionStorage. Karena itu stale image lebih mungkin berasal dari URL cache yang sama, CDN/browser cache, atau data Firestore lama daripada service worker.

## Pipeline Gambar

### Sumber URL

1. **Fallback lokal**: `src/data/comics.ts` mendefinisikan cover/thumbnail dari `/comics/...` dan `/assets/dashboard/home/covers/...`.
2. **Firestore**: `src/services/comicFirestoreService.ts` memetakan `ComicDocument.coverUrl` dan `thumbnailUrl` ke model `Comic`.
3. **Avatar**: URL avatar/photoURL berasal dari user document/Firebase Auth dan fallback asset lokal.
4. **Badge**: path badge dibentuk dari data dashboard/profile dan ditampilkan lewat `next/image`.
5. **Learning content**: sebagian image berasal langsung dari content package komik.

### Storage/upload

`src/lib/firebase/storage.ts` menyediakan `uploadFile`, `uploadStringData`, `getFileUrl`, `downloadFile`, `deleteFile`, dan `listFiles`. Upload menggunakan path yang diberikan caller dan mengembalikan Firebase `getDownloadURL`. Tidak ada fungsi yang menulis hash/version ke metadata comic setelah upload.

### Database metadata

`ComicDocument` memiliki `coverUrl`, `thumbnailUrl`, dan `updatedAt`, tetapi tidak memiliki `coverVersion`/`thumbnailVersion`. `updatedAt` dapat menjadi versi dokumen yang praktis, selama setiap perubahan image juga memperbarui dokumen comic.

## Temuan Cache dan Loading

### Terverifikasi

- URL lokal cover/thumbnail sebelumnya stabil tanpa query version.
- URL Firestore sebelumnya dipakai apa adanya.
- `next.config.ts` mengatur `images.unoptimized: true`; file asli dikirim browser tanpa optimasi/resizing Next Image.
- `ComicCover` memakai `priority`, sehingga cover di route cover dimuat eager. Ini wajar untuk hero cover, tetapi tidak ideal bila component dipakai dalam list banyak item.
- `LearningJourney` menampilkan banyak comic card dan setiap card menggunakan cover image; loading strategy perlu ditinjau untuk item di bawah fold.
- `PdfCoverCanvas` memakai cache module-level untuk hasil render PDF cover. Cache key berupa `pdfPath`; jika PDF diganti tetapi URL/path tidak berubah, hasil cover lama dapat tetap dipakai sampai page reload penuh.
- Tidak ditemukan service worker registration atau Cache Storage application code.
- LocalStorage reading progress saat ini tidak menyimpan page state; bukan sumber stale image.

### Duplicate source

Hash SHA-256 menemukan byte-identical asset yang tersebar di beberapa lokasi, antara lain cover/thumbnail komik 4 dan 5 serta beberapa level icon. Duplicate path meningkatkan risiko satu consumer diperbarui sementara consumer lain tetap menunjuk file lama. Duplikasi belum dihapus karena reference dan fungsi fallback belum dibuktikan setara.

## Perubahan yang Diimplementasikan

### Helper versioning stabil

File baru: `src/lib/imageUrl.ts`

- `versionImageUrl(url, version)` menambahkan `?v=` atau `&v=` tanpa menghapus query yang sudah ada.
- Tidak membuat timestamp baru pada setiap render.
- `getTimestampVersion(value)` mendukung `Date`, ISO/number, dan object Firestore-like (`toMillis`, `seconds`, `nanoseconds`).

### Firestore comic asset

`src/services/comicFirestoreService.ts` sekarang memakai `doc.updatedAt` sebagai versi cover dan thumbnail. Contoh hasil:

`https://storage.../cover.png?token=abc&v=1724803200000`

Dengan demikian URL berubah ketika dokumen comic di-update, tetapi tetap stabil selama metadata/version tidak berubah.

Catatan penting: proses upload/update wajib memperbarui `updatedAt` pada dokumen comic setelah file image berhasil diganti. Bila uploader hanya mengganti file Storage tanpa update dokumen, cache busting tidak dapat mengetahui perubahan tersebut.

### Fallback lokal

`src/data/comics.ts` memakai `LOCAL_IMAGE_VERSION = '2026-08-28'` untuk cover/thumbnail lokal. Versi ini harus dinaikkan hanya ketika asset lokal terkait benar-benar berubah, misalnya menjadi `2026-09-01` atau content hash release.

## Validasi

- Semua keenam thumbnail lokal yang dirujuk tersedia.
- Lint dan editor error check untuk helper/service/data berhasil.
- `src/lib/imageUrl.test.ts` lulus 2/2:
  - query parameter existing dipertahankan;
  - URL tanpa version tetap tidak berubah;
  - timestamp Firestore-like dan ISO didukung.

## Risiko yang Masih Terbuka

1. Firebase Storage/CDN cache policy deployment belum dapat diinspeksi dari repository karena `firebase.json` tidak berisi Hosting config.
2. Firestore document lama mungkin belum memiliki `updatedAt` valid; dalam kondisi itu URL tetap tanpa versi.
3. Avatar dan badge remote belum diberi version field terpisah. Untuk asset yang sering diganti, tambahkan `avatarVersion`/`iconVersion` atau update URL metadata saat upload.
4. Build pipeline gagal pada native `canvas`, sehingga generated image/PDF pipeline belum dapat divalidasi end-to-end.
5. URL versioning mempercepat invalidasi setelah metadata update, tetapi bukan pengganti ETag/CDN policy. Hindari menggunakan timestamp render atau `Date.now()` pada JSX.

## Rekomendasi Berikutnya

1. Ubah semua uploader image agar setelah upload berhasil melakukan satu update metadata atomik: URL + version/hash + `updatedAt`.
2. Gunakan SHA-256/content hash sebagai versi ideal pada pipeline upload; gunakan `updatedAt` sebagai fallback yang stabil.
3. Tambahkan version field untuk avatar/badge remote bila asset dapat diganti pada path sama.
4. Audit `priority` pada list dan set `loading="lazy"`/`sizes` untuk asset di bawah fold.
5. Kompres PNG besar dan SVG navigasi; gunakan ukuran sesuai rendered dimensions.
6. Setelah deployment, verifikasi Network waterfall dengan dua release asset: URL lama harus cache-hit, URL dengan versi baru harus mengambil file baru.
7. Konsolidasikan duplicate asset hanya setelah setiap consumer diarahkan ke canonical path dan smoke test visual selesai.
