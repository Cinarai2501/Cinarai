export type ComicStatus = "locked" | "available" | "in_progress" | "completed";

export type ComicStage = "comic" | "quiz" | "ar" | "reflection";

export interface ComicCharacter {
  name: string;
  description: string;
  avatar: string;
}

export interface Comic {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  kelas: string;
  lokasi: string;
  synopsis: string;
  characters: ComicCharacter[];
  learningTargets: string[];
  pdfPath: string | null;
  cover: string;
  thumbnail: string;
  stages: ComicStage[];
}

export interface ComicProgress {
  comicId: number;
  status: ComicStatus;
  currentStage: ComicStage;
  completedStages: ComicStage[];
  currentPage: number;
  totalPages: number;
  score: number;
}
