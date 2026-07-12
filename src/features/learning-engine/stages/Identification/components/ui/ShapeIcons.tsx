'use client';

interface ShapeIconProps {
  className?: string;
}

// === KUBUS (Cube) - Blue ===
export function KubusIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front face */}
      <path d="M12 16L12 32L28 32L28 16Z" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Top face */}
      <path d="M12 16L20 8L36 8L28 16Z" fill="#60A5FA" stroke="#1E40AF" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right face */}
      <path d="M28 16L36 8L36 24L28 32Z" fill="#1E40AF" stroke="#1E40AF" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// === BALOK (Rectangular Prism) - Green ===
export function BalokIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front face */}
      <path d="M10 18L10 34L34 34L34 18Z" fill="#22C55E" stroke="#166534" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Top face */}
      <path d="M10 18L18 8L42 8L34 18Z" fill="#4ADE80" stroke="#166534" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right face */}
      <path d="M34 18L42 8L42 24L34 34Z" fill="#15803D" stroke="#166534" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// === LIMAS SEGI EMPAT (Square Pyramid) - Orange ===
export function LimasIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front triangular face */}
      <path d="M24 8L12 32L36 32Z" fill="#F97316" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Left side face */}
      <path d="M24 8L12 32L8 28Z" fill="#FB923C" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right side face */}
      <path d="M24 8L36 32L40 28Z" fill="#EA580C" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Base outline */}
      <path d="M12 32L36 32L40 28L8 28Z" fill="none" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// === LIMAS SEGITIGA (Triangular Pyramid) - Orange (lighter) ===
export function LimasSegitigaIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top vertex */}
      {/* Front face - triangle */}
      <path d="M24 8L14 32L34 32Z" fill="#FB923C" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Left face - triangle */}
      <path d="M24 8L14 32L10 28Z" fill="#F97316" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right face - triangle */}
      <path d="M24 8L34 32L38 28Z" fill="#EA580C" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Base */}
      <path d="M14 32L34 32L38 28L10 28Z" fill="none" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// === PRISMA SEGI EMPAT (Rectangular Prism/Box) - Teal ===
export function PrismaIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front rectangular face */}
      <path d="M12 16L12 32L28 32L28 16Z" fill="#14B8A6" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Top rectangular face */}
      <path d="M12 16L22 8L38 8L28 16Z" fill="#2DD4BF" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right rectangular face */}
      <path d="M28 16L38 8L38 24L28 32Z" fill="#0D9488" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// === PRISMA SEGITIGA (Triangular Prism) - Teal (darker) ===
export function PrismaSegitigaIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front triangular face */}
      <path d="M10 28L16 10L22 28Z" fill="#2DD4BF" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Top rectangular face */}
      <path d="M16 10L32 8L38 26L22 28Z" fill="#14B8A6" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right rectangular face */}
      <path d="M22 28L38 26L38 40L24 42Z" fill="#0F766E" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Back triangular face */}
      <path d="M10 28L24 42L32 32Z" fill="none" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// === PRISMA SEGI LIMA (Pentagonal Prism) - Teal (medium) ===
export function PrismaSegiLimaIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front pentagonal face */}
      <path d="M24 10L10 18L14 32L34 32L38 18Z" fill="#2DD4BF" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Top rectangular face */}
      <path d="M24 10L32 8L36 14L38 18Z" fill="#14B8A6" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right rectangular face */}
      <path d="M38 18L36 14L36 28L38 32Z" fill="#0F766E" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Left side outline */}
      <path d="M10 18L12 14L14 32" fill="none" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// === PRISMA SEGI ENAM (Hexagonal Prism) - Teal (light) ===
export function PrismaSegiEnamIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front hexagonal face */}
      <path d="M16 12L10 18L12 28L24 34L36 28L38 18L32 12Z" fill="#2DD4BF" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Top rectangular face */}
      <path d="M24 10L32 8L36 14L32 12Z" fill="#14B8A6" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right rectangular face */}
      <path d="M38 18L38 8L36 14L36 28Z" fill="#0F766E" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Left outline */}
      <path d="M16 12L12 10L12 28" fill="none" stroke="#0D9488" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// === KERUCUT (Cone) - Red ===
export function KerucutIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left side of cone */}
      <path d="M24 8L12 34L24 32Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Right side of cone */}
      <path d="M24 8L36 34L24 32Z" fill="#F87171" stroke="#991B1B" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Base circle */}
      <ellipse cx="24" cy="34" rx="12" ry="4" fill="none" stroke="#991B1B" strokeWidth="1.2" />
    </svg>
  );
}

// === TABUNG (Cylinder) - Purple ===
export function TabungIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top ellipse */}
      <ellipse cx="24" cy="12" rx="10" ry="4" fill="#A855F7" stroke="#6B21A8" strokeWidth="1.2" />
      {/* Cylinder sides */}
      <path d="M14 12L14 32L34 32L34 12Z" fill="#9333EA" stroke="#6B21A8" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Bottom ellipse */}
      <ellipse cx="24" cy="32" rx="10" ry="4" fill="#7E22CE" stroke="#6B21A8" strokeWidth="1.2" />
    </svg>
  );
}

// === PERSEGI (Square) - Blue ===
export function PersegiIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="12" width="24" height="24" rx="2" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
      <path d="M24 12V36" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 24H36" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// === PERSEGI PANJANG (Rectangle) - Green ===
export function PersegiPanjangIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="16" width="28" height="16" rx="2" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
      <path d="M10 24H38" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 16V32" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 16V32" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// === SEGITIGA SAMA SISI (Equilateral Triangle) - Amber ===
export function SegitigaSamaSisiIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 10L10 36H38Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 10V36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 28H32" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// === SEGITIGA SAMA KAKI (Isosceles Triangle) - Orange ===
export function SegitigaSamaKakiIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 10L12 36H36Z" fill="#FFEDD5" stroke="#EA580C" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 10V36" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// === LINGKARAN (Circle) - Rose ===
export function LingkaranIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="14" fill="#FCE7F3" stroke="#DB2777" strokeWidth="1.5" />
      <path d="M24 10V38" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 24H38" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// === BELAH KETUPAT (Rhombus) - Violet ===
export function BelahKetupatIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 10L36 24L24 38L12 24Z" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 10V38" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 24H36" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// === GARIS SIMETRI (Symmetry Line) - Indigo ===
export function GarisSimetriIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="32" height="24" rx="6" fill="#EEF2FF" stroke="#4338CA" strokeWidth="1.5" />
      <path d="M24 12V36" stroke="#4338CA" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 18L20 24L14 30" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 18L28 24L34 30" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// === CERMIN (Mirror) - Sky ===
export function CerminIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="10" width="24" height="28" rx="6" fill="#E0F2FE" stroke="#0369A1" strokeWidth="1.5" />
      <path d="M20 16H28" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 22H30" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 28H28" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 10V38" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// === BANGUNAN (Building) - Amber ===
export function BangunanIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="16" width="24" height="20" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
      <path d="M18 16V12H30V16" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 24H30" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 30H30" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 36H32" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// === KIRI-KANAN (Left/Right) - Emerald ===
export function KiriKananIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="14" width="32" height="20" rx="6" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
      <path d="M18 24H30" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 20L16 24L20 28" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 20L32 24L28 28" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// === SIMETRI (Symmetry) - Rose ===
export function SimetriIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 12C20 18 20 30 16 36" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M32 12C28 18 28 30 32 36" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 12V36" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="4" fill="#FBCFE8" stroke="#E11D48" strokeWidth="1.5" />
    </svg>
  );
}

// === BOLA (Sphere) - Pink ===
export function BolaIcon({ className = 'w-12 h-12' }: ShapeIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main sphere */}
      <circle cx="24" cy="24" r="14" fill="#EC4899" stroke="#BE185D" strokeWidth="1.2" />
      {/* Highlight stripe for 3D effect - vertical */}
      <path d="M24 10Q30 24 24 38" fill="none" stroke="#F472B6" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
      {/* Highlight circle on top */}
      <circle cx="22" cy="16" r="2.5" fill="#F472B6" opacity="0.8" />
    </svg>
  );
}

// === Get icon component based on shape name ===
// PENTING: Explicit mapping untuk 7 bangun ruang saja
// Kubus, Balok, Limas, Prisma, Kerucut, Tabung, Bola
export function getShapeIcon(shape: string) {
  const shapeNormalized = shape.toLowerCase().trim();

  // === Exact matches untuk setiap bangun ruang ===
  
  // KUBUS
  if (shapeNormalized === 'kubus') return KubusIcon;
  
  // BALOK
  if (shapeNormalized === 'balok') return BalokIcon;
  if (shapeNormalized === 'balok selasar') return BalokIcon;
  
  // LIMAS - sekarang hanya 'limas' saja
  if (shapeNormalized === 'limas') return LimasIcon;
  
  // PRISMA - sekarang hanya 'prisma' saja
  if (shapeNormalized === 'prisma') return PrismaIcon;
  
  // KERUCUT
  if (shapeNormalized === 'kerucut') return KerucutIcon;
  
  // TABUNG
  if (shapeNormalized === 'tabung') return TabungIcon;
  
  // BOLA
  if (shapeNormalized === 'bola') return BolaIcon;

  // === Comic 2 / symmetry shapes ===
  if (shapeNormalized === 'persegi' || shapeNormalized.includes('persegi')) return PersegiIcon;
  if (shapeNormalized === 'persegi panjang' || shapeNormalized.includes('persegi panjang')) return PersegiPanjangIcon;
  if (shapeNormalized.includes('segitiga sama sisi') || shapeNormalized.includes('segitiga sama sisi')) return SegitigaSamaSisiIcon;
  if (shapeNormalized.includes('segitiga sama kaki') || shapeNormalized.includes('segitiga sama kaki')) return SegitigaSamaKakiIcon;
  if (shapeNormalized.includes('lingkaran') || shapeNormalized.includes('lingkar')) return LingkaranIcon;
  if (shapeNormalized.includes('belah ketupat') || shapeNormalized.includes('belahketupat')) return BelahKetupatIcon;

  // === Symmetry / comic 2 activity icons ===
  if (shapeNormalized.includes('garis simetri') || shapeNormalized.includes('garis-simetri') || shapeNormalized.includes('garis tengah')) return GarisSimetriIcon;
  if (shapeNormalized.includes('pencerminan') || shapeNormalized.includes('cermin')) return CerminIcon;
  if (shapeNormalized.includes('bangunan simetris') || shapeNormalized.includes('bangunan tidak simetris')) return BangunanIcon;
  if (shapeNormalized.includes('sisi kiri') || shapeNormalized.includes('sisi kanan') || shapeNormalized.includes('titik tengah') || shapeNormalized.includes('kiri') || shapeNormalized.includes('kanan')) return KiriKananIcon;
  if (shapeNormalized.includes('relief') || shapeNormalized.includes('pintu candi') || shapeNormalized.includes('tangga')) return BangunanIcon;
  if (shapeNormalized.includes('simetri')) return SimetriIcon;

  // Default fallback
  return KubusIcon;
}
