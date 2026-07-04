export const SINTAKS = [
  "Cover",
  "Contextualization",
  "Identification",
  "Navigation",
  "Argumentation",
  "Resolution",
  "Application",
  "Introspection",
] as const;

export type Sintaks = (typeof SINTAKS)[number];

export type SintaksStatus = "LOCKED" | "CURRENT" | "COMPLETED";

export interface SintaksProgress {
  sintaks: Sintaks;
  status: SintaksStatus;
}

export interface ComicProgressState {
  comicId: number;
  sintaksList: SintaksProgress[];
  completedCount: number;
  percentage: number;
  isCompleted: boolean;
}
