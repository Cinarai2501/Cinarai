# HOME SPECIFICATION

Dokumen ini menjadi Single Source of Truth untuk implementasi Dashboard Siswa > Home.
Referensi visual utama: [docs/ui-blueprint/home-blueprint.png](home-blueprint.png) dan [docs/ui-blueprint/home-specification.png](home-specification.png).

> Semua nilai yang tidak tertulis secara eksplisit pada blueprint ditandai sebagai Estimated. Nilai tersebut harus diperlakukan sebagai acuan visual dan tidak boleh diubah secara bebas selama implementasi.

## 1. Informasi Umum

- Screen Width: 360px - 440px (Estimated), dengan container maksimal 440px
- Design Style: Mobile-first, rounded card, modern app UI, clean spacing
- Target Device: Smartphone / tablet portrait
- Layout Type: Single-page vertical scroll dengan hero section, card-section, dan bottom navigation
- Mobile First: Yes
- Framework: Next.js + React + Tailwind CSS

## 2. Layout Specification

| Section | Width | Height | Radius | Padding | Margin |
|---|---:|---:|---:|---:|---:|
| Header Hero | 100% | 320px (Estimated) | 36px | 20px | 0 |
| Level Card | 100% | 144px (Estimated) | 30px | 16px | -24px (Estimated) |
| Continue Learning | 100% | 180px (Estimated) | 28px | 16px | 12px |
| Statistics Grid | 100% | Auto | 24px | 12px | 12px |
| Progress Card | 100% | 160px (Estimated) | 28px | 16px | 12px |
| Badge Card | 100% | 220px (Estimated) | 28px | 16px | 12px |
| Bottom Navigation | 100% | 72px (Estimated) | 24px | 12px 20px | 0 |

## 3. Typography

| Element | Font | Weight | Size | Color |
|---|---|---:|---:|---|
| Halo, Siswa! | Inter / Sans-Serif (Estimated) | 800 | 28px | #FFFFFF |
| Semangat belajar hari ini | Inter / Sans-Serif (Estimated) | 400 | 14px | #FFFFFF / 90% |
| Level | Inter / Sans-Serif (Estimated) | 600 | 11px | #9CA3AF |
| XP | Inter / Sans-Serif (Estimated) | 600 | 11px | #9CA3AF |
| Continue Learning | Inter / Sans-Serif (Estimated) | 600 | 10px | #9CA3AF |
| Petualangan Bangun Ruang Candi Jawi | Inter / Sans-Serif (Estimated) | 900 | 18px | #111827 |
| Progress Belajar Hari Ini | Inter / Sans-Serif (Estimated) | 600 | 10px | #9CA3AF |
| Badge Terbaru | Inter / Sans-Serif (Estimated) | 600 | 10px | #9CA3AF |
| Bottom Navigation | Inter / Sans-Serif (Estimated) | 600 | 12px | #6B7280 |

## 4. Color Palette

| Name | Hex |
|---|---|
| Primary Blue | #1D93FF |
| Blue Light | #EEF7FF |
| Text Primary | #121827 |
| Text Secondary | #6B7280 |
| Background | #F5F8FD |
| Card | #FFFFFF |
| Border | #E5E7EB |
| Yellow | #F9C74F (Estimated) |
| Purple | #8B5CF6 (Estimated) |
| Orange | #F59E0B (Estimated) |
| Green | #10B981 (Estimated) |
| Red | #EF4444 (Estimated) |

## 5. Icon Specification

| Asset | Width | Height |
|---|---:|---:|
| Level Icon | 48px | 48px |
| Avatar | 72px | 72px |
| Cover Komik | 92px | 112px |
| Statistic Icon | 32px | 32px |
| Badge | 112px | 112px |
| Arrow Button | 44px | 44px |
| Bottom Navigation Icon | 24px | 24px |

## 6. Card Specification

### Header Card

- Background: Gradient dari Primary Blue ke Deep Blue (#1D93FF -> #0F5FB5)
- Border Radius: 36px
- Shadow: 0 28px 48px rgba(15, 23, 42, 0.18)
- Padding: 20px 20px 24px
- Gap: 16px

### Level Card

- Background: White
- Border Radius: 30px
- Shadow: 0 18px 36px rgba(15, 23, 42, 0.16)
- Padding: 16px
- Gap: 16px

### Continue Learning

- Background: #F6F9FE
- Border Radius: 28px
- Shadow: 0 10px 24px rgba(15, 23, 42, 0.05)
- Padding: 16px
- Gap: 12px

### Statistic Card

- Background: Soft pastel per card (Blue, Yellow, Pink, Green)
- Border Radius: 24px
- Shadow: 0 6px 16px rgba(15, 23, 42, 0.05)
- Padding: 12px
- Gap: 8px

### Progress Card

- Background: #F6F9FE
- Border Radius: 28px
- Shadow: 0 10px 24px rgba(15, 23, 42, 0.05)
- Padding: 16px
- Gap: 12px

### Badge Card

- Background: #F6F9FE
- Border Radius: 28px
- Shadow: 0 10px 24px rgba(15, 23, 42, 0.05)
- Padding: 16px
- Gap: 12px

## 7. Progress Bar Specification

- Height: 12px
- Radius: 999px
- Track Color: #EEF4FB
- Fill Color: #1D93FF
- Gradient: Linear dari #1D93FF ke #0F5FB5
- Spacing: 8px antara label dan bar (Estimated)

## 8. Bottom Navigation

- Height: 72px (Estimated)
- Padding: 12px 20px (Estimated)
- Item Width: 56px (Estimated)
- Icon Size: 24px
- Label Size: 12px
- Active State: Primary Blue, bold text, icon filled/active
- Inactive State: Text Secondary, medium weight
- Shadow: 0 -8px 20px rgba(15, 23, 42, 0.06) (Estimated)
- Radius: 24px (Estimated)

## 9. Asset Mapping

| Blueprint | Local Asset |
|---|---|
| Avatar | public/assets/dashboard/home/avatars/ |
| Level | public/assets/dashboard/home/levels/ |
| Cover | public/assets/dashboard/home/covers/ |
| Statistics | public/assets/dashboard/home/statistics/ |
| Badge | public/assets/dashboard/home/badges/ |

## 10. Implementation Rules

- Semua ukuran mengikuti file ini.
- Toleransi implementasi maksimum ±2 px.
- Tidak boleh menggunakan placeholder.
- Tidak boleh mengubah logic aplikasi.
- Tidak boleh mengubah Firestore.
- Tidak boleh mengubah backend.
- Tidak boleh mengubah routing.
- Asset wajib menggunakan folder public/assets/dashboard/home/.
- Jika implementasi berbeda dengan file ini maka dianggap bug visual.

## 11. QA Checklist

- [ ] Header
- [ ] Continue Learning
- [ ] Statistics
- [ ] Progress
- [ ] Badge
- [ ] Bottom Navigation
- [ ] Typography
- [ ] Color
- [ ] Radius
- [ ] Shadow
- [ ] Icon Size
- [ ] Asset
- [ ] Responsive
- [ ] Pixel Matching
