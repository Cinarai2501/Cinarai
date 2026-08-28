# Audit CSS Cinarai - Fase 10

Tanggal audit: 2026-08-28
Branch: `main`
Metode: inventaris file CSS/config, pencocokan selector custom terhadap source JSX/TSX, pemeriksaan keyframes/animation, dan pencarian properti yang berpotensi memicu repaint/reflow. Tidak ada perubahan desain atau penghapusan CSS pada fase ini.

## 1. Ringkasan

- Hanya ada satu stylesheet aplikasi: `src/app/globals.css`, sekitar 8.4 KB sebelum Tailwind build.
- Tailwind memakai content glob untuk `src/app`, `src/components`, dan `src/features`; plugin Tailwind kosong.
- PostCSS hanya memakai Tailwind dan Autoprefixer.
- Semua selector custom yang terinventarisasi memiliki pemakaian terdeteksi di source; tidak ada dead selector yang aman dihapus hanya berdasarkan scan ini.
- Tidak ada library CSS penuh tambahan selain Tailwind/PostCSS.
- Tidak ditemukan file SCSS/SASS/CSS tambahan, CSS framework kedua, atau import stylesheet yang duplikatif.
- Tidak ada perubahan kode pada fase audit ini.

## 2. Sumber CSS dan Build

### `src/app/globals.css`

Berisi:

- Tailwind base/components/utilities.
- Reset global `*`.
- style `html`/`body`.
- `.soft-card`, `.card-accent-icon`, scrollbar utility.
- keyframes dan utility animation.
- skeleton, focus ring, tap highlight.
- `.fixed-side-btn`.

Ukuran source sekitar 8.4 KB, sehingga file custom bukan bottleneck storage besar. Ukuran final Tailwind harus diukur dari build production setelah build pipeline pulih.

### `tailwind.config.ts`

- Content glob mencakup semua route/component utama.
- `plugins: []`; tidak ada plugin CSS yang membentuk output besar tambahan.
- Theme extend mendefinisikan color, typography, spacing, radius, shadow, transition duration, dan z-index tokens.
- Banyak token tidak otomatis berarti semua utility masuk bundle; Tailwind JIT hanya menghasilkan class yang ditemukan pada content.

### `postcss.config.js`

Hanya Tailwind CSS dan Autoprefixer. Tidak ada CSS minifier/cache plugin custom.

## 3. Selector Custom dan Status Usage

Selector custom yang ditemukan dan memiliki reference:

- `.soft-card`, `.card-accent-icon`.
- `.scrollbar-none`, `.fixed-side-btn`.
- `.skeleton`.
- `.animate-spin`, `.animate-fade-in-up`, `.animate-toast-in`.
- `.animate-hero-float`, `.animate-card-enter`, `.animate-fade-in`.
- `.animate-motivation-fade`, `.animate-stage-in`.
- `.animate-ai-float`, `.ai-float`, `.ai-thinking`, `.ai-typing-glow`, `.animate-ai-blink`.
- `.poc-overlay-enter`, `.poc-feedback-pop`.
- `.dash-enter`, `.dash-enter-1` sampai `.dash-enter-6`.
- `.press-scale`.
- `.stagger-children`.

Caveat: class yang dibentuk melalui concatenation atau data-driven string dapat luput dari grep sederhana. Karena itu selector tidak dihapus otomatis.

## 4. Duplicate dan CSS Lama

### Duplicate animation utility

`src/app/globals.css` mendefinisikan dua class dengan behavior identik:

- `.animate-ai-float { animation: aiFloat 2.8s ease-in-out infinite; }`
- `.ai-float { animation: aiFloat 2.8s ease-in-out infinite; }`

Keduanya memakai keyframe `aiFloat` yang sama. Ini duplicate API CSS, walaupun tidak banyak berdampak pada ukuran. Konsolidasi aman hanya setelah semua consumer dipindahkan ke satu nama dan grep dynamic class dilakukan.

### Duplicate semantic animation

Beberapa keyframe hanya berbeda nama/durasi tetapi sama-sama melakukan opacity/translateY:

- `fadeInUp`, `stageIn`, `dashEnter`, dan `cardEnter`.
- `fadeIn`, `pocOverlayIn`, dan `motivationContentFade` memiliki pola opacity-only.

Perbedaan timing/scale/delay bisa merupakan behavior desain. Jangan menggabungkannya tanpa visual regression.

### Style lama/legacy

Tidak ditemukan selector bernama `legacy`, `old`, atau `deprecated`. Komentar seperti `New utility classes following spec`, `PoC overlay`, dan `Dashboard section entrance` menunjukkan sejarah implementasi, tetapi class yang terkait masih memiliki consumer sehingga belum dapat dianggap legacy unused.

## 5. Animation dan Repaint

### Terverifikasi digunakan

- Infinite animations: spinner, shimmer, hero float, AI float/thinking/glow/blink.
- Entrance animations: fade, stage, dashboard, card, toast, overlay, feedback.
- Transform dan opacity umumnya compositor-friendly dan tidak memaksa layout bila elemen tidak memengaruhi flow.

### Risiko

- `.skeleton` menggunakan animated `background-position`, dapat memicu paint berulang pada banyak skeleton sekaligus.
- `.ai-typing-glow` mengubah `box-shadow` secara infinite; shadow animation lebih mahal daripada opacity/transform.
- `.soft-card:hover` mengubah `box-shadow` dan `transform`; shadow repaint terjadi saat hover, tetapi hanya pada interaksi.
- Banyak `backdrop-blur` di modal/header/card dapat menambah compositing cost, terutama mobile.
- Tailwind `transition-all` ditemukan pada beberapa komponen; ini memperluas properti yang dianimasikan dan dapat menyebabkan property transition tidak disengaja.
- Shadow besar dan blur pada overlay/modal memberi biaya paint, tetapi masih merupakan bagian visual desain.

Rekomendasi konservatif:

- Batasi transition ke properti yang memang berubah (`transform`, `opacity`, `background-color`, `box-shadow`) alih-alih `transition-all`.
- Pertimbangkan mengganti shadow animation glow dengan opacity pada pseudo-element jika profiling mobile menunjukkan repaint tinggi.
- Hormati `prefers-reduced-motion` untuk infinite animation dan entrance animation.
- Jangan menghapus animasi hanya berdasarkan jumlah keyframe; ukur frame time dan paint area terlebih dahulu.

## 6. Layout Thrashing / Reflow

Tidak ditemukan CSS yang secara langsung membaca layout lalu menulis layout; layout measurement berada di hook React (`getBoundingClientRect`, `ResizeObserver`) dan sudah dibahas di audit performance.

Properti yang perlu dipantau:

- `position: sticky`/`fixed` pada navigasi, modal, dan side button.
- `backdrop-filter`/blur pada elemen fixed.
- perubahan `width`/`height` inline pada PDF viewer saat ukuran container berubah.
- `box-shadow`/filter pada banyak card.
- perubahan layout saat skeleton berganti image/content.

Transform pada entrance/hover lebih aman daripada animasi `top`, `left`, `width`, atau `height`. CSS saat ini mayoritas menggunakan transform untuk motion.

## 7. CSS yang Tidak Digunakan

Berdasarkan pencocokan selector custom dengan source:

- Tidak ada selector custom yang dapat dinyatakan unused dengan confidence tinggi.
- `.ai-float` dan `.animate-ai-float` adalah duplicate behavior, bukan unused.
- Token Tailwind yang tidak ditemukan sebagai class tidak otomatis menjadi output CSS karena JIT content scanning.
- Selector pseudo-element/global (`*`, `html`, `body`, `:focus-visible`, `a, button`, scrollbar) tidak boleh dinilai melalui grep class biasa.

## 8. Dampak dan Prioritas

### P1 - Jika profiling menunjukkan paint tinggi

1. Kurangi/isolasi `backdrop-blur` pada elemen fixed mobile.
2. Ganti `transition-all` dengan daftar property eksplisit.
3. Kurangi atau ubah `box-shadow` infinite pada AI glow.
4. Tambahkan reduced-motion fallback.

### P2 - Cleanup duplicate

1. Pilih satu nama antara `.ai-float` dan `.animate-ai-float`.
2. Jalankan grep terhadap seluruh class string/dynamic usage.
3. Pindahkan consumer ke nama canonical.
4. Hapus alias hanya setelah lint, screenshot, dan smoke test visual.

### P3 - Konsolidasi keyframe

Gabungkan hanya keyframe yang benar-benar identik dalam transform, timing, fill mode, dan consumer behavior. Potensi penghematan file kecil; tujuan utamanya maintainability, bukan performa besar.

## 9. Tidak Ditemukan

- Tidak ada stylesheet besar terpisah.
- Tidak ada import Bootstrap/Material UI CSS/full component CSS.
- Tidak ada font-face CSS lokal.
- Tidak ada video/audio-specific CSS.
- Tidak ada CSS service worker/PWA.
- Tidak ada selector `legacy`/`deprecated` yang jelas.

## 10. Batasan Validasi

- Build production belum dapat diukur ulang karena `prebuild` native `canvas` masih gagal dengan `Bus error`.
- Coverage CSS runtime/Lighthouse/Chrome Performance paint profile belum dijalankan.
- Static grep tidak menangkap semua class yang dibentuk dinamis.
- Tidak ada perubahan visual dilakukan pada fase ini.
