# CINARAI

**Critical Numeracy with AR & AI**

Platform pembelajaran numerasi berbasis etnomatematika untuk siswa Sekolah Dasar Indonesia.

## 📋 Deskripsi

CINARAI mengintegrasikan Komik Digital, Artificial Intelligence (AI), Augmented Reality (AR), Gamifikasi, dan Learning Journey untuk meningkatkan kemampuan berpikir kritis siswa.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm atau yarn
- Firebase Account

### Installation

```bash
npm install
```

### Environment Configuration

Buat file `.env.local` di root project:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Realtime Database URL
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

### Development

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 📁 Struktur Folder

```
src/
  app/          # Next.js App Router pages
  components/   # Reusable React components
  features/     # Feature modules
  hooks/        # Custom React hooks
  lib/
    firebase/   # Firebase configuration & services
      client.ts     # Client-side Firebase init
      admin.ts      # Admin SDK init
      auth.ts       # Authentication services
      firestore.ts  # Firestore database services
      storage.ts    # Cloud Storage services
  services/     # API dan external service calls
  styles/       # Global styles
  types/        # TypeScript type definitions
  utils/        # Utility functions

public/
  comics/       # Comic files (PDFs)
  markers/      # AR markers
  models/       # 3D models untuk AR
  icons/        # SVG icons
  assets/       # Images dan assets lainnya
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint
- **Formatting**: Prettier
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI**: Gemini, OpenAI, Groq, OpenRouter
- **AR**: MindAR, Three.js, React Three Fiber

## 📚 Dokumentasi

- [CINARAI Blueprint](./CINARAI_BLUEPRINT.md) - Detail blueprint dan arsitektur
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Panduan development
- [Project Structure](./PROJECT_STRUCTURE.md) - Penjelasan struktur folder
- [Copilot Rules](./COPILOT_RULES.md) - Aturan untuk AI Copilot

## 📝 Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm start             # Start production server
npm run lint          # Lint code
npm run lint:fix      # Fix linting errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
```

## 🎯 Learning Journey

Aplikasi mengikuti 5 komik pembelajaran bertahap:

1. Petualangan Bangun Ruang Candi Jawi (Kelas VI)
2. Petualangan Simetri Candi Penataran (Kelas V)
3. Petualangan di Rumah Gajah Mungkur (Kelas II)
4. Petualangan di Jembatan Merah (Kelas IV)
5. Serunya Belajar Bangun Datar di Keraton Sumenep (Kelas II)

## 🔐 Firebase Integration

Project menggunakan Firebase untuk:

- **Authentication**: User management dan authentication
- **Firestore**: Real-time database untuk data aplikasi
- **Cloud Storage**: Menyimpan assets (comics, images, models)

Semua konfigurasi membaca dari environment variables. Jangan commit `.env.local`.

## 📄 License

Proprietary

## 👥 Contributors

- Tim CINARAI