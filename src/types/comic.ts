export type ComicAvailability = "ACTIVE" | "COMING_SOON";

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
  estimatedMinutes: number;
  pdfPath: string | null;
  cover: string;
  thumbnail: string;
  stages: ComicStage[];
  availability: ComicAvailability;
}
