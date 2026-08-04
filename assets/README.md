# Badge Asset Pipeline

Gunakan folder ini untuk memastikan seluruh badge PNG memiliki visual bounding box yang rapat dan konsisten.

## Workflow

1. Masukkan badge baru ke `assets/raw-badges`.
2. Jalankan:
   ```bash
   npm run prepare-badges
   ```
3. Badge otomatis:
   - di-trim (menghapus transparent padding)
   - dioptimasi (lossless)
   - dipublikasikan ke `public/badges`
4. Seluruh badge siap digunakan di aplikasi.

## Tujuan

- Jangan mengubah ukuran objek.
- Jangan melakukan resize.
- Jangan memperbesar atau memperkecil badge.
- Hanya transparent padding yang dihapus.
- Hasil akhir harus memiliki visual bounding box yang rapat agar semua badge terlihat konsisten ketika dirender dengan ukuran CSS yang sama.

## Folder

- `assets/raw-badges` – tempat semua PNG badge baru.
- `assets/trimmed-badges` – badge yang sudah dipangkas (trim).
- `assets/optimized-badges` – badge yang sudah dikompresi secara lossless.
- `public/badges` – badge final yang siap digunakan di aplikasi.
