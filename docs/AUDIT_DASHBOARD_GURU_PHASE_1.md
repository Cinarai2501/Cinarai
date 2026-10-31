# Audit Dashboard Guru CINARAI — Tahap 1

**Tanggal audit:** 30 Oktober 2026
**Cakupan:** audit statis kode repository untuk dashboard guru, sumber data, statistik, alur AI, aturan Firestore, dan UI responsif.

> **Batas verifikasi:** audit ini tidak menghubungi Firestore atau URL production, tidak memeriksa file environment, dan tidak mengubah data atau kode aplikasi. Karena itu jumlah siswa/komik, duplikasi aktual, akun tanpa aktivitas, perilaku runtime, dan konfigurasi production belum dapat dipastikan. Tidak ada deploy maupun migrasi. `src/data/comics.ts` memuat enam komik berstatus `ACTIVE`, tetapi dashboard aktif membaca koleksi Firestore sehingga jumlah production belum terkonfirmasi.

## A. Peta arsitektur

1. `/dashboard` mengarahkan pengguna sesuai role. `/guru` dan `/guru/dashboard` mengarahkan ke `/dashboard/guru`.
2. `src/app/dashboard/guru/layout.tsx` membungkus route dengan `RoleProtectedRoute`. Komponen ini memeriksa sesi/role melalui `useAuth` di klien; otorisasi data tetap bergantung pada Firestore Rules.
3. Halaman aktif `src/app/dashboard/guru/page.tsx` menggunakan `useGuruDashboard`, `useStudentFilter`, `useStudentDetail`, dan `useStudentAiInsight`. State tab mengatur:
   - **Ringkasan:** `DashboardOverview`, statistik, aktivitas terbaru, dan siswa dengan rata-rata progress tertinggi.
   - **Siswa:** `StudentDirectory`, pencarian/sort, lalu detail siswa berdasarkan UID.
   - **AI:** `AiAssistantPanel`, analisis agregat kelas.
4. Detail siswa memuat progress, asesmen CINARAI, refleksi, aktivitas, aktivitas penerapan, jawaban identifikasi, insight AI, dan PDF. Komponen detail dan panel AI dimuat dinamis.
5. Tidak ditemukan server action atau context khusus dashboard guru. `useAuth` memakai `AuthContext` bersama aplikasi.
6. Ada jalur lama/terpisah: `/guru/[studentId]` memuat detail siswa sendiri; `/guru/report` membuat laporan sendiri; `src/app/api/dashboard/guru/route.ts` adalah endpoint Admin SDK. Endpoint dashboard tersebut tidak direferensikan oleh halaman dashboard aktif dalam source yang ditelusuri.

## B. Daftar file relevan

**Dashboard aktif**
- [`src/app/dashboard/guru/page.tsx`](../src/app/dashboard/guru/page.tsx), [`layout.tsx`](../src/app/dashboard/guru/layout.tsx)
- [`hooks/useGuruDashboard.ts`](../src/app/dashboard/guru/hooks/useGuruDashboard.ts), [`useStudentDetail.ts`](../src/app/dashboard/guru/hooks/useStudentDetail.ts), [`useStudentAiInsight.ts`](../src/app/dashboard/guru/hooks/useStudentAiInsight.ts), [`useStudentFilter.ts`](../src/app/dashboard/guru/hooks/useStudentFilter.ts)
- [`services/firestoreService.ts`](../src/app/dashboard/guru/services/firestoreService.ts), [`studentNormalization.ts`](../src/app/dashboard/guru/services/studentNormalization.ts), [`studentUtils.ts`](../src/app/dashboard/guru/services/studentUtils.ts), [`types/index.ts`](../src/app/dashboard/guru/types/index.ts)
- [`components/GuruHeader.tsx`](../src/app/dashboard/guru/components/GuruHeader.tsx), [`DashboardOverview.tsx`](../src/app/dashboard/guru/components/DashboardOverview.tsx), [`StudentDirectory.tsx`](../src/app/dashboard/guru/components/StudentDirectory.tsx), [`StudentDetail.tsx`](../src/app/dashboard/guru/components/StudentDetail.tsx), [`ui.tsx`](../src/app/dashboard/guru/components/ui.tsx), [`ai/AiAssistantPanel.tsx`](../src/app/dashboard/guru/ai/AiAssistantPanel.tsx), [`reports/studentReport.ts`](../src/app/dashboard/guru/reports/studentReport.ts)

**Auth, Firestore, progress, dan AI**
- [`firestore.rules`](../firestore.rules), [`src/components/auth/RoleProtectedRoute.tsx`](../src/components/auth/RoleProtectedRoute.tsx), [`src/context/AuthContext.tsx`](../src/context/AuthContext.tsx), [`src/hooks/useAuth.ts`](../src/hooks/useAuth.ts)
- [`src/lib/firebase/client.ts`](../src/lib/firebase/client.ts), [`src/lib/firebase/admin.ts`](../src/lib/firebase/admin.ts), [`src/types/firestore.ts`](../src/types/firestore.ts), [`src/types/progress.ts`](../src/types/progress.ts), [`src/lib/progressEngine.ts`](../src/lib/progressEngine.ts), [`src/lib/userAudit.ts`](../src/lib/userAudit.ts)
- [`src/services/comicProgress.ts`](../src/services/comicProgress.ts), [`src/features/learning-engine/services/learningEngineService.ts`](../src/features/learning-engine/services/learningEngineService.ts), stage writers di `src/features/learning-engine/components/stages/`, [`src/features/evaluasi-cinarai/TeacherEvaluationReview.tsx`](../src/features/evaluasi-cinarai/TeacherEvaluationReview.tsx), dan halaman kuis `src/features/quiz/komik-{3,5,6}/page.tsx`
- [`src/lib/ai/service.ts`](../src/lib/ai/service.ts), [`src/lib/ai/router.ts`](../src/lib/ai/router.ts), `src/lib/ai/{provider,gemini,openai,groq,openrouter}.ts`; route AI di `src/app/api/ai/*/route.ts`

**Jalur lama/alternatif**
- [`src/app/api/dashboard/guru/route.ts`](../src/app/api/dashboard/guru/route.ts)
- [`src/app/guru/[studentId]/page.tsx`](../src/app/guru/[studentId]/page.tsx), [`src/app/guru/report/GuruReportClient.tsx`](../src/app/guru/report/GuruReportClient.tsx), [`src/app/guru/report/reportData.ts`](../src/app/guru/report/reportData.ts), [`src/app/guru/dashboardData.ts`](../src/app/guru/dashboardData.ts), [`src/app/guru/studentDetail.utils.ts`](../src/app/guru/studentDetail.utils.ts)
- [`src/data/comics.ts`](../src/data/comics.ts), [`package.json`](../package.json)

## C. Alur data Firestore → UI

1. `AuthProvider` menerima perubahan Firebase Auth, membaca `users/{uid}` dan role claim, lalu menyediakan user melalui `useAuth`. `RoleProtectedRoute` mengarahkan user tanpa sesi/role yang sesuai.
2. `useGuruDashboard` memasang listener untuk:
   - `users` dengan `role == student` dan `orderBy(displayName)`;
   - `comics` dengan `orderBy(order)`;
   - empat query aktivitas terbaru (`activity`, `application_activity`, `reflection`, `identification_answers`), maksimal 20 dokumen per koleksi;
   - satu listener `users/{uid}/progress` untuk setiap siswa yang ditemukan.
3. `normalizeStudentDocuments` mengabaikan dokumen bertanda `duplicate`, menyatukan UID yang sama dan email yang sama setelah trim/lowercase, serta memilih dokumen dengan `updatedAt` paling baru. `normalizeComicProgressDocuments` mengecualikan `evaluation-cinarai`, menafsirkan ID komik dan tahap, lalu memilih progress terbaru per `comicId`.
4. `buildStudentRow` menghitung nilai per siswa dan `buildDashboardSummary` menghitung kartu statistik. Hasilnya masuk ke header/ringkasan/sortir; sumber data live, bukan endpoint `/api/dashboard/guru`.
5. Saat siswa dipilih, `useStudentDetail` menambah listener untuk profil, subkoleksi progress, refleksi (dua query: `userId` dan `studentId`), activity, application activity, dan identification answers. Dokumen progress `evaluation-cinarai` ditampilkan terpisah sebagai status/jumlah jawaban/skor; tahap komik berada di subkoleksi progress.
6. Progress komik dan `stageData` disimpan melalui `src/services/comicProgress.ts`. Jawaban kuis berada di `stageData.quiz`; asesmen guru berada di dokumen `evaluation-cinarai`; refleksi/aktivitas/penerapan/identifikasi juga disimpan dalam koleksi top-level masing-masing. Detail dashboard tidak merender jawaban kuis atau isi jawaban asesmen, hanya ringkasan evaluasi.
7. Insight individu membentuk prompt dari progress ringkas, refleksi, dan maksimal lima aktivitas yang diberikan ke service AI. Analisis kelas menghitung rata-rata dan nama siswa dengan progress di bawah 40%. Keduanya berjalan dari komponen klien melalui `AiRouter`, bukan endpoint server khusus dashboard.

## D. Temuan bug dan risiko keamanan

| ID | Prioritas | Temuan dan dampak | Keyakinan |
|---|---|---|---|
| D1 | P1 | **Cakupan akses guru tidak dibatasi sekolah/kelas.** `isTeacher()` memberi semua akun role `teacher` (dan `admin`) akses baca ke seluruh profil siswa, progress, refleksi, jawaban identifikasi, aktivitas, dan koleksi dashboard. Tidak tampak pemeriksaan relasi guru–siswa atau tenant pada rules. Ini berisiko menjadi akses lintas guru/sekolah jika isolasi tersebut diharapkan; jika seluruh guru memang satu ruang data, perlu konfirmasi kebijakan. | 9/10 |
| D2 | P1 | **Endpoint AI publik tanpa autentikasi dan pembatasan biaya.** Route `application`, `argumentation`, `chat`, dan `introspection` memanggil provider AI tanpa verifikasi Firebase ID token/role. Validasi batas ukuran input/rate limit juga tidak konsisten (misalnya `chat` membatasi riwayat, tetapi tidak membatasi `question` atau keseluruhan context). Pemanggil anonim dapat menghabiskan kuota/biaya dan mengirim payload arbitrer. | 9/10 |
| D3 | P1 | **Analisis dashboard memanggil provider dari klien.** `AiAssistantPanel` dan `useStudentAiInsight` mengimpor `AiRouter`/service provider langsung. Kunci provider semestinya hanya berada di server; pola klien ini tidak memiliki otorisasi server, rate limit, atau batas biaya khusus dashboard, dan berisiko gagal karena environment provider tidak tersedia di browser. Perlu dipindahkan ke server route terautentikasi; tidak ada bukti statis bahwa kunci saat ini bocor ke bundle. | 8/10 |
| D4 | P1 | **Pembacaan berbiaya linear dan tak terbatas pada jalur utama/lama.** Dashboard memasang satu listener progress per siswa. Detail siswa mengambil seluruh activity/application/identification siswa tanpa limit; endpoint lama menggunakan `collectionGroup('progress').get()` dan report lama membaca seluruh `users`, `reflection`, dan `activity`, lalu membaca progress per siswa (N+1). Biaya baca, latency, dan memori akan tumbuh seiring jumlah akun/aktivitas. | 9/10 |
| D5 | P1 | **Progress rata-rata memakai denominator yang berbeda.** Daftar siswa dan rata-rata dashboard merata-ratakan hanya dokumen progress yang ada; komik yang belum pernah dimulai tidak masuk denominator. Detail siswa justru membagi dengan seluruh metadata komik dan menganggap dokumen yang hilang bernilai nol. Siswa dengan satu komik berprogress tinggi dapat terlihat 100% di daftar tetapi jauh lebih rendah di detail; rata-rata kelas ikut bias ke atas. | 10/10 |
| D6 | P1 | **Cacat query profil dapat menghilangkan siswa.** Query siswa melakukan `orderBy('displayName')`, sementara `displayName` opsional dan UI memiliki fallback ke email. Di Firestore, dokumen tanpa field yang diurutkan tidak dikembalikan oleh query `orderBy`; akibatnya siswa tanpa `displayName` bisa tidak masuk total maupun daftar. | 9/10 |
| D7 | P2 | **Duplikasi dan konsistensi progress belum dijamin pada sumber.** UI menyaring `duplicate == true`, lalu mendeduplikasi UID/email (email dinormalisasi huruf kecil), tetapi tidak memperbaiki dokumen Firestore. Pemilihan “terbaru” bergantung `updatedAt`; UID kosong/berbeda dari document ID bisa membuat listener progress tidak terpasang atau row tidak punya UID yang valid. Normalisasi progress menerima percentage finite tanpa membatasi 0–100 dan membiarkan `status` tersimpan menang atas hitungan tahap; nilai/status/tahap dapat saling bertentangan. | 9/10 |
| D8 | P2 | **Hak tulis dokumen refleksi/jawaban belum mengunci identitas pada hasil update.** `reflection` mengizinkan update/delete berdasar owner pada `resource.data`, tetapi tidak membatasi perubahan `request.resource.data.userId/studentId`. `identification_answers` juga mengizinkan owner mengubah dokumen tanpa menjaga `userId`. Pengguna dapat memindahkan/menyamaratakan atribusi dokumen yang ia miliki ke UID lain; ini merusak integritas dan dapat membuat catatan tampil pada profil siswa lain. | 9/10 |
| D9 | P2 | **Kegagalan data dapat tampak sebagai statistik parsial.** Error listener progress menandai UID siap dengan daftar progress kosong, lalu summary tetap dihitung; error tetap terlihat, tetapi angka dapat terbaca sebagai nol/parsial. Perlu status kelengkapan data per sumber agar angka tidak dianggap lengkap. | 8/10 |
| D10 | P2 | **Analisis AI tidak memakai seluruh bukti yang dikumpulkan.** Detail mengirim application dan identification records ke hook, tetapi hook hanya mengambil `title`, `description`, `occurredAt`; `selectedAnswer`, `studentReason`, alasan identifikasi, jawaban kuis `stageData.quiz`, dan jawaban asesmen tidak masuk prompt insight. Model mengklaim rekomendasi berbasis data meski bukti jawaban yang paling relevan tidak disertakan. | 9/10 |
| D11 | P2 | **UI mobile belum divalidasi pada viewport nyata.** Struktur memakai grid responsif, teks truncation/wrapping, dan tab horizontal yang bisa digulir; tidak tampak indikasi pasti bahwa semua layar overflow. Namun root `overflow-x-hidden` dapat menyamarkan konten melebar, sedangkan deskripsi aktivitas/refleksi panjang tidak selalu memaksa pemenggalan kata. Belum ada hasil uji 320/375 px atau orientasi landscape. | 7/10 |
| D12 | P1 | **Potensi stored XSS saat membuat PDF siswa.** `studentReport.ts` menyisipkan nama, email, sekolah, judul komik, dan teks insight ke template HTML tanpa escaping lalu menulisnya ke jendela baru. Profil siswa dapat diubah pemiliknya sesuai Rules (selain UID/role), sehingga markup berbahaya dapat tersimpan dan dieksekusi saat guru membuka laporan. | 9/10 |
| D13 | P2 | **Ekspor CSV rentan formula injection.** `escapeCsvValue` hanya mengutip delimiter/quote/newline, bukan menetralkan nilai sel berawalan `=`, `+`, `-`, atau `@`. Nama/email/judul yang dikendalikan pengguna dapat menjadi formula saat CSV dibuka di spreadsheet. | 8/10 |

Tidak ditemukan bukti statis cukup untuk menyatakan adanya kebocoran antar-siswa melalui jalur baca Firestore biasa: rules siswa mengikat akses profil/progress ke UID dan aktivitas juga memeriksa pemilik. Temuan D8 menyangkut manipulasi atribusi catatan milik sendiri, bukan pembacaan langsung dokumen privat milik siswa lain.

## E. Statistik dan kemungkinan ketidaksesuaian

Rumus yang berjalan pada dashboard aktif:

- **Total Siswa:** jumlah row setelah filter role/duplicate dan deduplikasi UID/email; berpotensi kurang jika `displayName` hilang karena D6.
- **Progres Berjalan:** jumlah siswa berbeda dengan sedikitnya satu dokumen komik berstatus `in_progress`; bukan jumlah sesi aktif, dan bukan `UserDocument.isActive`.
- **Total Komik:** jumlah seluruh dokumen koleksi `comics`, tanpa filter `availability`. Enam komik pada data source lokal tidak membuktikan koleksi production berisi tepat enam.
- **Siswa Tuntas:** siswa dengan jumlah komik selesai (`status == completed` **atau** `percentage >= 100`) sekurangnya jumlah seluruh dokumen metadata komik.
- **Tingkat Penyelesaian:** jumlah komik selesai seluruh siswa / (`total siswa × total komik`) × 100, dibulatkan ke integer. Dokumen progress untuk ID komik yang tidak ada di katalog dapat menaikkan pembilang; hasil tidak dibatasi 100%.
- **Rata-rata Progress:** rata-rata per row; tiap row adalah rata-rata hanya atas dokumen komik yang tersedia, lalu dibagi rata atas semua siswa (termasuk row tanpa progress yang bernilai 0). Ini tidak sama dengan “progress atas semua komik” dan berbeda dari denominator detail siswa.

Kemungkinan penyebab selisih yang perlu diperiksa terhadap data live: siswa tanpa `displayName`; UID tidak sama dengan ID dokumen; email duplikat/capitalization; dokumen ber-ID komik di luar katalog; komik `COMING_SOON` tetap masuk denominator; dokumen progress yang belum ada dianggap nol di detail tetapi tidak di daftar; percentage/status/tahap tidak sinkron; dan kegagalan listener yang mengganti data dengan array kosong. Nama dengan kapitalisasi berbeda tidak menjadi kunci deduplikasi; email dibandingkan setelah lowercase, sedangkan nama tidak disatukan. Tidak ada pemeriksaan data production yang dijalankan, jadi jumlah kasus aktual tidak diketahui.

## F. Rekomendasi berdasarkan prioritas

### P0

- Tidak ada P0 yang dapat dibuktikan dari pemeriksaan statis ini.

### P1

1. **Tentukan cakupan data guru terlebih dahulu.** Jika data harus terpisah per sekolah/kelas, terapkan pemeriksaan relasi di Firestore Rules dan seluruh endpoint/server; jangan mengandalkan `RoleProtectedRoute`.
2. **Autentikasi dan batasi semua route AI yang memakai provider.** Verifikasi Firebase token/role di server, validasi skema dan ukuran payload, rate limit/kuota per user, timeout/abort yang benar, serta pencatatan biaya tanpa isi data siswa.
3. **Pindahkan insight kelas dan siswa dari bundle klien ke server route terautentikasi.** Kirim hanya ringkasan/bukti minimum yang diperlukan dan jangan menyertakan pengenal langsung yang tidak dibutuhkan.
4. **Samakan definisi denominator progress.** Pilih katalog komik resmi (mis. hanya komik yang dihitung/aktif), perlakukan komik yang belum dimulai secara konsisten, batasi/validasi percentage dan status, serta tampilkan status parsial saat sumber gagal.
5. **Perbaiki query siswa agar tidak menghilangkan profil tanpa `displayName`.** Ambil dengan query yang dapat mencakup dokumen tersebut dan lakukan sorting/fallback nama di klien/server.
6. **Kurangi pembacaan per siswa dan koleksi tak terbatas.** Tetapkan batas/halaman aktivitas, evaluasi agregasi server atau materialisasi yang aman, dan hentikan penggunaan jalur lama yang membaca seluruh koleksi bila memang tidak dipakai.
7. **Tutup stored XSS pada laporan siswa.** Escape seluruh nilai dinamis sebelum membangun HTML laporan dan uji payload markup; jangan jalankan konten dari profil/AI di jendela print.

### P2

1. Kunci `userId`/`studentId` pada create/update Rules ke UID pemilik, pertahankan identitas lama saat update, dan uji aturan dengan Rules Emulator.
2. Tambahkan metrik kualitas data untuk duplicate UID/email, UID kosong, progress di luar katalog, status/percentage/tahap tidak konsisten, dan akun tanpa aktivitas. Laporkan hasil dari export/query production yang disetujui; jangan menghapus atau menggabungkan data otomatis.
3. Lengkapi validasi skema respons AI dan ukur pemakaian provider/retry; masukkan bukti jawaban yang relevan hanya setelah kebijakan privasi dan batas datanya disepakati.
4. Netralisasi awalan formula pada ekspor CSV dan tambahkan tes nilai berbahaya sebelum mengutip delimiter.
5. Uji mobile pada viewport kecil dan panjang teks ekstrem; verifikasi apakah `overflow-x-hidden` memotong konten.
6. Konsolidasikan sumber statistik dan laporan setelah perilaku fitur lama dipastikan; tandai/hapus kode lama hanya setelah referensi serta pengguna route diverifikasi.

## G. Rencana implementasi bertahap (belum dilakukan)

1. **Tahap validasi aturan & baseline:** konfirmasi apakah guru memang boleh melihat lintas sekolah; jalankan audit read-only pada data production dengan akses yang disetujui untuk mengukur jumlah siswa/komik, duplicate keys, UID mismatch, missing activity, dan distribusi progress. Tidak ada perubahan skema.
2. **Tahap keamanan:** perbarui [`firestore.rules`](../firestore.rules); amankan route `src/app/api/ai/*/route.ts`; tambah helper autentikasi/rate limit server bila sesuai pola repo; sediakan endpoint server untuk analisis guru. Adaptasi [`AiAssistantPanel.tsx`](../src/app/dashboard/guru/ai/AiAssistantPanel.tsx) dan [`useStudentAiInsight.ts`](../src/app/dashboard/guru/hooks/useStudentAiInsight.ts) agar tidak memanggil provider langsung; escape nilai dinamis pada [`studentReport.ts`](../src/app/dashboard/guru/reports/studentReport.ts). Validasi dengan Rules Emulator/unit tests dan tes akses role.
3. **Tahap akurasi statistik:** perbarui [`firestoreService.ts`](../src/app/dashboard/guru/services/firestoreService.ts), [`studentNormalization.ts`](../src/app/dashboard/guru/services/studentNormalization.ts), [`studentUtils.ts`](../src/app/dashboard/guru/services/studentUtils.ts), [`useGuruDashboard.ts`](../src/app/dashboard/guru/hooks/useGuruDashboard.ts), [`StudentDetail.tsx`](../src/app/dashboard/guru/components/StudentDetail.tsx), dan label di [`GuruHeader.tsx`](../src/app/dashboard/guru/components/GuruHeader.tsx)/[`DashboardOverview.tsx`](../src/app/dashboard/guru/components/DashboardOverview.tsx). Tambahkan unit test kasus denominator, katalog, identitas, dan data tidak konsisten.
4. **Tahap output aman & performa:** netralisasi CSV pada [`reportData.ts`](../src/app/guru/report/reportData.ts), uji payload formula, lalu optimalkan listener dan query tanpa mengubah skema. Audit endpoint dashboard versus listener klien serta jalur laporan lama sebelum konsolidasi.
5. **Tahap UX & release readiness:** lakukan uji visual/interaksi pada 320, 375, tablet, desktop, termasuk empty/loading/error dan teks panjang; verifikasi lint/type-check/test; lakukan staging terlebih dahulu. Deploy production hanya dengan persetujuan terpisah.

## Pemeriksaan yang dijalankan

- `npm run lint` — **lulus** (exit code 0).
- `npm run typecheck` — **lulus** (exit code 0).
- Tidak menjalankan query Firestore production, browser/E2E mobile, deployment, atau migrasi.

## Pembaruan Implementasi Tahap 3

- Daftar siswa kini mencari nama/email/sekolah/kelas, memfilter status belajar, mengurutkan nama/progress/komik selesai, dan menampilkan 20 siswa per halaman. Identitas akun berbeda dipertahankan berdasarkan UID; email yang sama tidak lagi menggabungkan akun.
- Detail siswa membedakan modul tanpa dokumen progress dari progress tersimpan 0%. Completion berbasis status tersimpan atau seluruh tahap selesai; percentage 100% saja tidak cukup. Rata-rata tercatat mengecualikan siswa tanpa dokumen progress, sementara tingkat penyelesaian target tetap menggunakan seluruh siswa dan katalog komik.
- Cakupan guru dibatasi ke siswa dengan `schoolName` yang sama pada Firestore Rules, query dashboard/laporan, dan API dashboard. `schoolName` tidak dapat ditetapkan/diubah oleh klien; penugasan harus melalui jalur admin tepercaya. Nilai sekolah yang telah ada di production belum diverifikasi.
- Indeks Firestore untuk query ber-cakupan dan aktivitas terbaru ditambahkan ke `firestore.indexes.json`. Rules dan indeks belum dideploy; Rules Emulator tidak dijalankan karena Firebase CLI/emulator tooling tidak tersedia di lingkungan ini.
- Validasi implementasi terakhir: lint dan type-check lulus, 46 tes lulus, production build lulus dengan `--ignore-scripts`. Pengujian browser mobile dan data production tidak dilakukan.

## Pembaruan Implementasi Tahap 4

- Menu Modul menggunakan katalog Firestore untuk daftar/judul/deskripsi. Detail blueprint diambil dari modul spesifik `comicModules` (komik 1–6), bukan konten fallback generik.
- Daftar menghitung **Mulai** dari progress di luar dokumen Cover inisialisasi; **Sedang belajar** adalah yang memiliki bukti progress tetapi belum seluruh tahap tersimpan selesai; **Tuntas** mensyaratkan semua tahap `SINTAKS` tersimpan `COMPLETED`. Tingkat penyelesaian adalah jumlah siswa tuntas dibagi seluruh roster berwenang. Dokumen progress yang tidak ada tetap berbeda dari progress 0%; skor rata-rata hanya mencakup siswa yang memiliki nilai tersimpan.
- Detail modul memuat jumlah konten sesuai blueprint Contextualization, Identification, Navigation AR + AI, Argumentation, Resolution, Application, Introspection, dan Report. Tahap dengan konten spesifik kosong dan Report yang tidak memiliki status progress tersendiri ditandai sebagai data yang tidak tersedia, bukan 0 siswa tuntas.
- Detail membaca progress satu komik per siswa dan query terarah untuk jawaban identifikasi, aktivitas aplikasi, dan refleksi hanya saat modul dibuka. Server mengautentikasi token Firebase dan memberi guru akses baca ke seluruh profil dengan `role == student`; akses tidak dibatasi oleh `teacherUid`, sekolah, atau kelas. Jawaban dan confidence ditampilkan hanya ke akun guru/admin terverifikasi. Insight AI dipanggil eksplisit dan hanya menerima statistik agregat serta teks soal katalog, tanpa identitas/jawaban bebas siswa.
- `firestore.indexes.json` memerlukan indeks komposit `userId + comicId` untuk query asesmen/aktivitas/refleksi. Indeks belum dideploy; detail akan mengembalikan error jika environment Firestore belum memiliki indeks yang dibutuhkan. Tidak ada Rules/indeks yang dideploy pada tahap ini.
- Tes unit menguji rumus status/penyelesaian dan struktur blueprint seluruh enam modul; tes tersebut memakai katalog kode aktual, bukan data siswa production. Akses Firestore production, Rules Emulator, uji viewport 360/390/430 px, dan biaya/rate-limit provider AI tidak dapat diverifikasi dalam lingkungan ini.
- Validasi Tahap 4: `npm run lint`, `npm run typecheck`, `npm test` (51 tes), dan `npm run build --ignore-scripts` lulus. Tidak ada deployment atau migrasi.

## Akses Guru ke Seluruh Siswa

- Dashboard memang dirancang untuk memberi akun guru terverifikasi akses baca ke seluruh dokumen `users` dengan `role == student`, tanpa filter sekolah, kelas, atau assignment.
- `teacherUid`, `schoolId`, dan `schoolName` tetap dapat ditampilkan sebagai metadata profil, tetapi bukan syarat atau pembatas query dashboard maupun analisis.
- Firestore Rules memverifikasi role guru/admin sebelum membaca profil dan data pembelajaran. Hak baca guru bersifat read-only; aturan assignment yang hanya dapat dikelola admin tidak digunakan untuk membatasi roster.
- Tidak diperlukan backfill relasi guru-siswa agar siswa lama muncul. Tidak ada perubahan data produksi atau deployment Rules/indeks yang dilakukan.
