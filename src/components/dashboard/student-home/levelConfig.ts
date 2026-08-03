export type LevelConfig = {
  level: number;
  name: string;
  badgeAsset: string;
  badgeTitle: string;
  nextXp: number;
  progress: number;
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000];
const LEVEL_NAMES = ['Pemula', 'Penjelajah', 'Petualang', 'Pahlawan', 'Legenda'];
const LEVEL_BADGE_ASSETS = [
  '/assets/dashboard/home/levels/icon-level-1-v2.png',
  '/assets/dashboard/home/levels/icon-level-2-v2.png',
  '/assets/dashboard/home/levels/icon-level-3-v2.png',
  '/assets/dashboard/home/levels/icon-level-4-v2.png',
  '/assets/dashboard/home/levels/icon-level-5-v2.png',
];
const LEVEL_BADGE_TITLES = ['Pembaca Pemula', 'Penjelajah Candi', 'Petualang Candi', 'Pahlawan Candi', 'Legenda Cinarai'];

export function getLevelConfig(xp: number): LevelConfig {
  let levelIndex = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      levelIndex = i;
      break;
    }
  }

  const level = levelIndex + 1;
  const currentThreshold = LEVEL_THRESHOLDS[levelIndex] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = nextThreshold > currentThreshold ? Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100) : 100;

  return {
    level,
    name: LEVEL_NAMES[levelIndex] ?? 'Legenda',
    badgeAsset: LEVEL_BADGE_ASSETS[levelIndex] ?? LEVEL_BADGE_ASSETS[0],
    badgeTitle: LEVEL_BADGE_TITLES[levelIndex] ?? LEVEL_BADGE_TITLES[0],
    nextXp: nextThreshold,
    progress,
  };
}
