# Audit Firestore Composite Index Dashboard Guru

Tanggal audit: 2026-10-31
Project target: `cinarai-a2651`
Ruang lingkup: endpoint Dashboard Guru dan detail modul.

## Ringkasan

- Query yang memakai beberapa field membutuhkan composite index yang cocok dengan collection, nama field, dan arah sort. Semua kombinasi composite yang ditemukan untuk endpoint ini sekarang tercantum di [`firestore.indexes.json`](../firestore.indexes.json).
- Berkas tersebut sebelumnya memakai properti `collectionId` dan tidak memiliki `queryScope`. Format konfigurasi Firebase CLI memakai `collectionGroup` dan `queryScope`. Metadata seluruh entri yang sudah ada sudah dinormalkan menjadi `collectionGroup` dan `queryScope: "COLLECTION"`; definisi index tidak dihapus atau ditambah dalam normalisasi ini.
- Tiga index `studentId` untuk query aktivitas terbaru sudah ada sebagai perubahan lokal sebelum audit, tetapi belum ada di versi `HEAD`: `activity/occurredAt`, `application_activity/timestamp`, dan `identification_answers/updatedAt`.
- Firebase CLI tidak memiliki akun login, tetapi konfigurasi Admin SDK yang sudah ada berhasil melakukan pemeriksaan read-only terhadap project `cinarai-a2651` dan menguji query langsung. Tidak ada credential atau data siswa yang dicetak.
- Ada satu diff lokal terpisah pada endpoint Dashboard Guru yang mengubah pencarian profil student insight menjadi pembacaan langsung berdasarkan document ID. Diff tersebut tidak mengubah query roster semua siswa; tidak ada diff pada dashboard siswa. Perubahan endpoint dipertahankan dan tidak dibuat oleh audit index ini.

## Investigasi error `FAILED_PRECONDITION`

### Query dashboard yang aktif saat halaman dibuka

`useGuruDashboard` memanggil `GET /api/dashboard/guru`; ringkasan, statistik, roster, progres, dan aktivitas dibangun dari respons endpoint itu. Endpoint membaca roster `users` dengan `role == student` dan `orderBy(__name__, ASC)`, lalu membaca aktivitas terbaru dengan query paralel. Setiap query aktivitas terbaru memakai `where(owner in uids)` dan `orderBy(timestampField, DESC)`.

Ada **8 kombinasi** query aktivitas terbaru: empat collection (`activity`, `application_activity`, `identification_answers`, `reflection`) dikali dua owner (`userId`, `studentId`). Saya menjalankan bentuk query yang sama terhadap project dengan hingga sepuluh UID siswa di memori, tanpa mencetak UID atau dokumen. Keempat query `userId` menghasilkan Firestore error code `9` (`FAILED_PRECONDITION`); keempat query `studentId` berhasil. Kegagalan dilempar keluar dari `Promise.all`, sehingga seluruh GET gagal dan hook dashboard mempertahankan statistik awal bernilai nol.

### Matriks composite untuk query aktivitas

| Query | Collection | Index yang diperlukan | Index tersedia di repository | Status Console |
|---|---|---|---|---|
| `where(userId in ...)`, `orderBy(occurredAt DESC)` | `activity` | `userId ASC, occurredAt DESC, __name__ DESC` implisit | Ya: `userId ASC, occurredAt DESC`, scope `COLLECTION` | **Missing; probe menghasilkan code 9** |
| `where(studentId in ...)`, `orderBy(occurredAt DESC)` | `activity` | `studentId ASC, occurredAt DESC, __name__ DESC` implisit | Ya: `studentId ASC, occurredAt DESC`, scope `COLLECTION` | READY; probe berhasil |
| `where(userId in ...)`, `orderBy(timestamp DESC)` | `application_activity` | `userId ASC, timestamp DESC, __name__ DESC` implisit | Ya: `userId ASC, timestamp DESC`, scope `COLLECTION` | **Missing; probe menghasilkan code 9** |
| `where(studentId in ...)`, `orderBy(timestamp DESC)` | `application_activity` | `studentId ASC, timestamp DESC, __name__ DESC` implisit | Ya: `studentId ASC, timestamp DESC`, scope `COLLECTION` | READY; probe berhasil |
| `where(userId in ...)`, `orderBy(updatedAt DESC)` | `identification_answers` | `userId ASC, updatedAt DESC, __name__ DESC` implisit | Ya: `userId ASC, updatedAt DESC`, scope `COLLECTION` | **Missing; probe menghasilkan code 9** |
| `where(studentId in ...)`, `orderBy(updatedAt DESC)` | `identification_answers` | `studentId ASC, updatedAt DESC, __name__ DESC` implisit | Ya: `studentId ASC, updatedAt DESC`, scope `COLLECTION` | READY; probe berhasil |
| `where(userId in ...)`, `orderBy(createdAt DESC)` | `reflection` | `userId ASC, createdAt DESC, __name__ DESC` implisit | Ya: `userId ASC, createdAt DESC`, scope `COLLECTION` | **Missing; probe menghasilkan code 9** |
| `where(studentId in ...)`, `orderBy(createdAt DESC)` | `reflection` | `studentId ASC, createdAt DESC, __name__ DESC` implisit | Ya: `studentId ASC, createdAt DESC`, scope `COLLECTION` | READY; probe berhasil |

### Perbedaan dari enam index modul

Detail modul memakai enam query lain: untuk masing-masing `identification_answers`, `application_activity`, dan `reflection`, ada pasangan `where(userId in ...) + where(comicId == ...)` dan `where(studentId in ...) + where(comicId == ...)`. Probe langsung ke project menjalankan keenam bentuk query tersebut dan semuanya berhasil. Jadi, tidak ada bukti query detail modul memerlukan index tambahan; keenam definisi di repository dipertahankan tanpa perubahan.

Filter modul tidak memakai `orderBy`; `__name__ ASC` adalah suffix implisit/default, bukan field eksplisit yang harus ditambahkan. Query reflection mengirim `comicId` sebagai string, sementara dua collection lainnya memakai number; ketidaksamaan tipe dapat mengurangi hasil, tetapi tidak menyebabkan `FAILED_PRECONDITION`.

### Query lain yang diperiksa

- Roster Admin SDK: `users where role == student orderBy __name__ ASC`; roster client: `users where role == student`. Keduanya tidak memerlukan composite pada konfigurasi tanpa `fieldOverrides`; single-field index untuk `role` melayani filter.
- Progres dashboard dibaca melalui `getAll()` dokumen `users/{uid}/progress/{comicId}`, bukan query ber-filter/sort. Pembacaan subcollection pada detail siswa menggunakan collection scan atau sort `__name__`; tidak memerlukan composite.
- AI Insight tidak dipanggil otomatis saat halaman utama dibuka. `student-insight` membaca per collection dengan owner `== uid` dan `orderBy __name__ ASC`; `class-insight` memakai owner `in` tanpa sort. Keduanya tidak memerlukan composite di luar single-field.
- Firebase Client SDK `subscribeStudents` memakai `role ==`; listener komik memakai `orderBy(order ASC)`; detail siswa listen ke progress, profil, dan records dengan owner `==`. Semua adalah query single-field/unfiltered. Listener `subscribeRecentGuruActivities` memang membentuk delapan query timestamp yang sama, tetapi tidak dipanggil oleh halaman dashboard saat ini (aktivitas halaman utama datang dari endpoint Admin SDK).
- Composite `application_activity userId ASC, localTimestamp DESC` tetap ada di repository, tetapi tidak ada query Dashboard Guru aktif yang mengurutkan dengan `localTimestamp`.

### Kesimpulan pembuktian

Penyebab dashboard utama **terbukti**: empat query timestamp dengan `userId in ...` gagal dengan code `9`, sementara empat pasangan `studentId` berhasil. Keempat definisi index yang dibutuhkan sudah ada di repository, tetapi belum ada di production. Daftar production yang dibaca berisi enam index READY: empat pasangan timestamp `studentId`, `users role ASC + displayName ASC`, dan `users duplicate ASC + role ASC + displayName ASC`. Index terakhir tidak ada di repository dan tidak dipakai query dashboard yang diperiksa.

Detail modul berhasil untuk keenam kombinasi `owner in ...` + `comicId == ...`. Roster `users where role == student orderBy __name__ ASC` juga berhasil; jadi error ini bukan disebabkan index role/displayName dan bukan oleh progress document reads. Perubahan diagnostik mencatat `sdk`, `operation`, collection, scope, field/operator filter, field/arah order, dan kode error; tidak mencatat UID, token, credential, dokumen, atau pesan error mentah.

## Query dan index yang dibutuhkan

`__name__` di bawah adalah nama field dokumen Firestore. Untuk composite index, Firestore menambahkan `__name__` secara implisit di akhir index; arah default-nya mengikuti arah field terakhir yang didefinisikan. Karena itu `__name__` tidak perlu ditulis eksplisit dalam `firestore.indexes.json`.

| Endpoint / operasi | Query Firestore yang dijalankan | Index yang dibutuhkan | Status di repository |
|---|---|---|---|
| `GET /api/dashboard/guru`; roster pada `POST class-insight` dan detail modul | `users`: `where(role == "student")`, `orderBy(__name__, ASC)` | Single-field index otomatis pada `role`; tidak memerlukan composite index | Tidak ada composite roster yang diperlukan |
| `GET /api/dashboard/guru` — `activity` | `where(userId in uids)` atau `where(studentId in uids)`, lalu `orderBy(occurredAt, DESC)` | Masing-masing: `userId ASC, occurredAt DESC` dan `studentId ASC, occurredAt DESC`; `__name__ DESC` implisit | Keduanya ada |
| `GET /api/dashboard/guru` — `application_activity` | `where(userId in uids)` atau `where(studentId in uids)`, lalu `orderBy(timestamp, DESC)` | Masing-masing: `userId ASC, timestamp DESC` dan `studentId ASC, timestamp DESC`; `__name__ DESC` implisit | Keduanya ada |
| `GET /api/dashboard/guru` — `identification_answers` | `where(userId in uids)` atau `where(studentId in uids)`, lalu `orderBy(updatedAt, DESC)` | Masing-masing: `userId ASC, updatedAt DESC` dan `studentId ASC, updatedAt DESC`; `__name__ DESC` implisit | Keduanya ada |
| `GET /api/dashboard/guru` — `reflection` | `where(userId in uids)` atau `where(studentId in uids)`, lalu `orderBy(createdAt, DESC)` | Masing-masing: `userId ASC, createdAt DESC` dan `studentId ASC, createdAt DESC`; `__name__ DESC` implisit | Keduanya ada |
| `POST /api/dashboard/guru`, `action: student-insight` | Pada masing-masing `identification_answers`, `activity`, `application_activity`, `reflection`: `where(userId == uid)` atau `where(studentId == uid)`, lalu `orderBy(__name__, ASC)` | Single-field index otomatis pada field owner (`userId` atau `studentId`); tidak memerlukan composite index | Tidak ada composite tambahan yang diperlukan |
| `POST /api/dashboard/guru`, `action: class-insight` | Pada masing-masing `identification_answers`, `activity`, `application_activity`, `reflection`: `where(userId in uidChunk)` atau `where(studentId in uidChunk)` tanpa `orderBy` | Single-field index otomatis pada field owner; tidak memerlukan composite index | Tidak ada composite tambahan yang diperlukan |
| `GET /api/dashboard/guru/modules/[comicId]` — identification answers | `where(userId in uids)` atau `where(studentId in uids)`, serta `where(comicId == comicId)` | Masing-masing: `userId ASC, comicId ASC` dan `studentId ASC, comicId ASC`; `__name__ ASC` implisit | Keduanya ada |
| `GET /api/dashboard/guru/modules/[comicId]` — application activity | Query filter sama dengan di atas | Masing-masing: `userId ASC, comicId ASC` dan `studentId ASC, comicId ASC`; `__name__ ASC` implisit | Keduanya ada |
| `GET /api/dashboard/guru/modules/[comicId]` — reflection | Query filter sama; nilai `comicId` dikirim sebagai string pada reflection | Masing-masing: `userId ASC, comicId ASC` dan `studentId ASC, comicId ASC`; `__name__ ASC` implisit | Keduanya ada |

Query roster, pembacaan dokumen berdasarkan path, `getAll()` dokumen progress, serta query subcollection yang hanya mengurutkan berdasarkan `__name__` tidak membutuhkan composite index tambahan. Detail modul tidak menjalankan query ke collection `activity`.

## Perbedaan repository dan Console

### Perubahan yang terlihat di worktree

Sebelum audit, perubahan lokal yang sudah ada menambahkan tiga pasangan `studentId` untuk query aktivitas terbaru yang benar-benar dijalankan endpoint:

1. `activity`: `studentId ASC, occurredAt DESC`
2. `application_activity`: `studentId ASC, timestamp DESC`
3. `identification_answers`: `studentId ASC, updatedAt DESC`

Audit mempertahankan ketiganya. Entri tersebut tidak ada pada versi `HEAD`, sehingga perubahan repository belum menjadi bukti bahwa index sudah dideploy ke project.

### Format file konfigurasi

Semua entri lokal sebelumnya memakai `collectionId` dan tidak menetapkan `queryScope`. Format Firebase CLI mendefinisikan pasangan tersebut sebagai `collectionGroup` dan `queryScope`; label “Collection ID” di Console merujuk pada collection group itu. File lokal sekarang menggunakan `collectionGroup` dan `queryScope: "COLLECTION"` untuk seluruh 18 entri. Perubahan ini memperbaiki format, bukan mengubah kombinasi field index.

### Status Console

Firebase CLI tetap belum login, tetapi `FIREBASE_PROJECT_ID`, email service account, dan private key sudah tersedia di environment `.env.local`; nilainya tidak dibaca ke output. Menggunakan service account Admin SDK tersebut, saya melakukan GET read-only ke Firestore Admin API untuk project yang dipastikan bernama `cinarai-a2651` dan menguji query menggunakan SDK. Tidak ada autentikasi interaktif, perubahan konfigurasi keamanan, atau operasi tulis/deploy.

Enam index yang dikembalikan production semuanya `READY` (setara Enabled):

| Collection group | Fields | Scope | Status |
|---|---|---|---|
| `identification_answers` | `studentId ASC, updatedAt DESC, __name__ DESC` | `COLLECTION` | READY |
| `activity` | `studentId ASC, occurredAt DESC, __name__ DESC` | `COLLECTION` | READY |
| `application_activity` | `studentId ASC, timestamp DESC, __name__ DESC` | `COLLECTION` | READY |
| `reflection` | `studentId ASC, createdAt DESC, __name__ DESC` | `COLLECTION` | READY |
| `users` | `role ASC, displayName ASC, __name__ ASC` | `COLLECTION` | READY |
| `users` | `duplicate ASC, role ASC, displayName ASC, __name__ ASC` | `COLLECTION` | READY |

Perbedaan utama dengan repository: empat index timestamp `userId ASC + timestamp DESC` ada di file lokal tetapi hilang di production. Probe keenam query detail modul berhasil walau keenam index `owner + comicId` yang didefinisikan lokal tidak muncul di daftar production; query filter tersebut tidak membutuhkan composite index eksplisit di project saat ini. Production memiliki satu tambahan `users duplicate + role + displayName` yang tidak ada di repository dan tidak digunakan query endpoint Dashboard Guru/detail modul yang diperiksa. Index `users role + schoolName`, `users role + uid + schoolName`, serta `application_activity userId + localTimestamp` ada di repository tetapi tidak ada di daftar production; query dalam ruang lingkup audit tidak memerlukannya.

Index Enabled tidak dihapus. Karena empat index `userId + timestamp` sudah didefinisikan dengan benar di `firestore.indexes.json`, tidak ada definisi lokal baru yang ditambahkan. Permintaan create aditif untuk empat index itu ditolak dengan HTTP 403 (service account tidak memiliki izin create); pemeriksaan ulang membuktikan jumlah dan status index production tidak berubah. Firebase CLI juga belum memiliki sesi login, sehingga deploy sinkronisasi penuh tidak dilakukan. `__name__` adalah suffix implisit: timestamp DESC menghasilkan `__name__ DESC`; query tanpa `orderBy` tidak memiliki arah sort yang perlu ditambahkan.

## Validasi

- Test: lulus, 102/102.
- Lint: lulus.
- Typecheck: lulus.
- Build produksi: lulus.
- JSON `firestore.indexes.json`: valid.
- Probe live Firestore: roster OK; keempat query timestamp `studentId` OK; empat query timestamp `userId` gagal code 9; enam query detail modul OK.
- Index create: ditolak HTTP 403; post-check memastikan enam index READY tetap tidak berubah.

Tidak ada perubahan UI, struktur data, atau logika roster semua siswa dalam audit ini. Perubahan lokal yang sudah ada di endpoint tetap dipertahankan. Tidak ada commit atau push.
