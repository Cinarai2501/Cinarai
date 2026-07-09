# Resolution Stage - New Learning Flow

## 📊 Visual Comparison

### ❌ OLD FLOW (Auto-Advance)
```
Siswa Jawab
    ↓
AI Jelaskan + Typing
    ↓
[AUTO] Lanjut ke Soal Berikutnya ← Siswa tidak kontrol
```

### ✅ NEW FLOW (Student-Controlled)
```
┌─────────────────────────────────────────────────────────────┐
│                    RESOLUTION STAGE - NEW                   │
└─────────────────────────────────────────────────────────────┘

ALUR JAWABAN BENAR:
─────────────────────

Siswa Memilih Jawaban
       ↓
   [Kirim Jawaban]
       ↓
AI Guru Melakukan Analisis
       ↓
Typing Animation ⌨️
       ↓
AI Menjelaskan Langkah demi Langkah
• Identifikasi Bangun
• Rumus yang Dipakai
• Perhitungan Langkah
• Hubungan dengan Candi Jawi
       ↓
Badge Muncul ✅ JAWABAN BENAR
       ↓
Tombol Muncul 
"Saya Sudah Paham, Lanjut →"
(Tombol HANYA aktif setelah AI selesai)
       ↓
[Siswa Klik Tombol Lanjut] ← SISWA KONTROL
       ↓
Progress Update: 2/5 → 3/5
       ↓
Lanjut ke Soal Berikutnya


ALUR JAWABAN SALAH:
──────────────────

Siswa Memilih Jawaban (Salah)
       ↓
   [Kirim Jawaban]
       ↓
💡 Feedback: "Mari Coba Lagi"
AI Guru Memberikan Petunjuk
       ↓
ATTEMPT 1:
"Hmm, jawaban itu belum tepat...
Coba perhatikan langkah-langkahnya..."
(HINT, TIDAK LANGSUNG JAWABAN)
       ↓
Siswa Tetap di Soal Yang SAMA
Pilihan Jawaban TETAP AKTIF
       ↓
[Siswa Coba Lagi]
       ↓
ATTEMPT 2:
"Mari kita coba pendekatan lain...
Langkah 1, 2, 3, 4..."
(LEBIH DETAIL GUIDANCE)
       ↓
Siswa Tetap di Soal Yang SAMA
Pilihan Jawaban TETAP AKTIF
       ↓
[Siswa Coba Lagi]
       ↓
ATTEMPT 3+:
"Mari kita lihat penjelasan lengkapnya...
Rumus: ... Hasil: ..."
(PENJELASAN LENGKAP)
       ↓
(Jika masih salah, tinggal coba lagi
atau buka "Baca Lagi" di panel AI)


UI ELEMENTS - PANEL AI:
──────────────────────

┌─────────────────────────────────────┐
│ 🤖 AI TUTOR                         │
│ Guru Matematika Candi Jawi          │
├─────────────────────────────────────┤
│                                     │
│ [Penjelasan AI dengan typing        │
│  animation yang smooth]             │
│                                     │
│ ✨ Selamat! Jawabanmu benar!        │
│                                     │
│ Aku bangga dengan kamu...           │
│ [dll]                               │
│                                     │
├─────────────────────────────────────┤
│ [📖 Baca Lagi] [🔊 Dengarkan]      │
│                                     │
│ tombol HANYA aktif setelah          │
│ AI selesai mengetik                 │
└─────────────────────────────────────┘
       ↓
Siswa bisa scroll panel AI
Membaca ulang penjelasan
Atau dengarkan audio


BADGE & FEEDBACK:
─────────────────

JAWABAN BENAR:
┌─────────────────────────────────────┐
│ ✅ Jawaban Benar!                   │
│ Bagus sekali! Mari kita pelajari... │
└─────────────────────────────────────┘
     ↓ (Animated pulse)

JAWABAN SALAH:
┌─────────────────────────────────────┐
│ 💡 Mari Coba Lagi                   │
│ AI Guru sedang memberikan petunjuk..│
└─────────────────────────────────────┘


PROGRESS TRACKING:
──────────────────

SEBELUM klik tombol lanjut:
Progress: 2/5 → 2/5 (TIDAK BERUBAH)

SETELAH klik "Saya Sudah Paham, Lanjut":
Progress: 2/5 → 3/5 (BERUBAH)

Progress dot indicators:
● Completed   ● Current   ○ Not yet


TOMBOL LANJUT - CONDITIONAL:
─────────────────────────────

Soal 1-4 (Bukan Terakhir):
┌──────────────────────────────┐
│ → Saya Sudah Paham, Lanjut   │
└──────────────────────────────┘

Soal 5 (TERAKHIR):
┌──────────────────────────────┐
│ 🎉 Saya Sudah Menyelesaikan   │
│     Resolution               │
└──────────────────────────────┘

Tombol HANYA visible ketika:
✓ Jawaban Benar
✓ AI selesai mengetik
✓ tutorMessage !== null

Tombol memiliki animate-pulse
untuk menarik perhatian siswa
```

---

## 🎯 Key Learning Experience Changes

### 1. **Student Agency** 🎓
**Before**: System decides when to advance  
**After**: Student decides when to advance  
→ Builds autonomy and self-direction

### 2. **Mastery Through Retry** 🔄
**Before**: Wrong answer → system auto-advances  
**After**: Wrong answer → stay on same problem, try again  
→ Builds problem-solving skills and persistence

### 3. **Tiered Guidance** 📚
**Before**: Immediate full explanation  
**After**: 
- Attempt 1: Hint (guide to solution)
- Attempt 2: Detailed steps
- Attempt 3+: Full explanation  
→ Scaffolded learning supports independence

### 4. **AI as Teacher, Not Oracle** 🏫
**Before**: Simple "correct/incorrect" feedback  
**After**: 
- Always explains WHY
- Shows HOW to solve
- Connects to Candi Jawi context
- Uses encouraging tone  
→ Transforms AI from judge to mentor

### 5. **Progress Integrity** 📊
**Before**: Progress changes immediately  
**After**: Progress changes only when student confirms understanding  
→ Ensures authentic progress tracking

---

## 💡 AI Tutor Personality

### Friendly & Encouraging 🌟
```
✨ Selamat! Jawabanmu benar!
Aku bangga dengan kamu.
```

### Patient & Non-judgmental 💚
```
💡 Hmm, jawaban itu belum tepat.
Jangan khawatir!
Mari kita periksa bersama-sama...
Ingat: Kesalahan adalah guru terbaik.
```

### Motivational 🚀
```
Aku yakin kamu bisa!
Coba lagi dengan keyakinan penuh!
Kamu akan lebih mahir seiring waktu!
```

### Contextual & Connected 🏛️
```
Hubungan dengan Candi Jawi:
[Connects math to architecture]
```

---

## 📱 UX Improvements

### Removed ❌
- "Tunjukkan Pembahasan" button (redundant)
- Auto-advance behavior (now student-controlled)

### Added ✅
- "Baca Lagi" button (scroll to top of explanation)
- Badge animations (✅ for correct, 💡 for tips)
- Conditional button text (changes on last mission)
- Scrollable AI panel (review full conversation)
- Smooth transitions (220ms fade between missions)

### Maintained ✓
- Clean, minimal design
- CINARAI color scheme & typography
- Speech synthesis option
- All existing missions data

---

## 🔄 State Management

### ResolutionStage Component
```typescript
completedUpToIndex      // Track progress display (not immediate)
selected                // Current answer selection
isTransitioning         // Smooth animations
isFinished              // Last mission completed
```

### MissionCard Component
```typescript
attempts                // Track retry count (0, 1, 2, 3+)
isSolved                // Answer is correct
isTyping                // AI still typing
tutorMessage            // Full explanation text
answerFeedback          // 'correct' | 'incorrect' | null
aiPanelRef              // Scroll to top functionality
```

---

## 🧪 Testing Scenarios

### Scenario 1: Perfect Answer First Try
1. Select answer
2. Click "Kirim Jawaban"
3. See ✅ badge
4. See tombol lanjut
5. Click tombol → next mission
6. Progress updates

### Scenario 2: Wrong Answer, Then Correct
1. Select wrong answer → ❌ attempt
2. See 💡 "Mari Coba Lagi" with hint
3. Select different answer
4. Click "Kirim Jawaban"
5. See ✅ badge
6. Click tombol → next mission

### Scenario 3: Multiple Retries
1. Attempt 1 → Hint (don't give answer)
2. Attempt 2 → More detailed guidance
3. Attempt 3 → Full explanation
4. Attempt 4+ → Same explanation level

### Scenario 4: Scroll AI Panel
1. Get full explanation from AI
2. Click "Baca Lagi"
3. Panel scrolls to top
4. Can read entire conversation

### Scenario 5: Last Mission
1. Complete mission 5 correctly
2. See button: "🎉 Saya Sudah Menyelesaikan Resolution"
3. Click button
4. Goes to Application stage

---

## ✨ CINARAI Philosophy Alignment

| Aspect | Implementation |
|--------|----------------|
| **Student Agency** | Student controls advancement, not system |
| **Learning from Mistakes** | Retry without penalty, tiered guidance |
| **Cultural Context** | Every math problem connects to Candi Jawi |
| **Emotional Safety** | Friendly, patient, encouraging AI tone |
| **Scaffolded Learning** | Progressive hints, not immediate solutions |
| **Self-Reflection** | "Baca Lagi" button for consolidation |
| **Authentic Progress** | Progress updates only on student confirmation |

---

**Status**: ✅ Ready for User Testing

For questions or issues, refer to `RESOLUTION_REFACTOR_CHANGELOG.md`
