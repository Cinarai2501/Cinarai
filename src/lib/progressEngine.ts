import { SINTAKS, type ComicProgressState, type Sintaks, type SintaksProgress, type SintaksStatus } from "@/types/progress";

const TOTAL = SINTAKS.length; // 8

/** Build initial progress state for a comic — first sintaks is CURRENT, rest LOCKED. */
export function createInitialProgressState(comicId: number): ComicProgressState {
  const sintaksList: SintaksProgress[] = SINTAKS.map((sintaks, i) => ({
    sintaks,
    status: (i === 0 ? "CURRENT" : "LOCKED") as SintaksStatus,
  }));

  return buildState(comicId, sintaksList);
}

/** Mark a sintaks as COMPLETED and unlock the next one. */
export function completeSintaks(
  state: ComicProgressState,
  sintaks: Sintaks
): ComicProgressState {
  const idx = SINTAKS.indexOf(sintaks);
  if (idx === -1) return state;

  const sintaksList: SintaksProgress[] = state.sintaksList.map((s, i) => {
    if (i === idx) return { ...s, status: "COMPLETED" };
    if (i === idx + 1) return { ...s, status: "CURRENT" };
    return s;
  });

  return buildState(state.comicId, sintaksList);
}

/** Get the current active sintaks. */
export function getCurrentSintaks(state: ComicProgressState): Sintaks | null {
  return state.sintaksList.find((s) => s.status === "CURRENT")?.sintaks ?? null;
}

/** Get status of a specific sintaks. */
export function getSintaksStatus(state: ComicProgressState, sintaks: Sintaks): SintaksStatus {
  return state.sintaksList.find((s) => s.sintaks === sintaks)?.status ?? "LOCKED";
}

/** Calculate percentage: completedCount / TOTAL * 100, rounded to 1 decimal. */
export function calculatePercentage(completedCount: number): number {
  return Math.round((completedCount / TOTAL) * 1000) / 10;
}

/** Restore a ComicProgressState from a plain sintaksList (e.g. from Firestore).
 *  Tolerant of schema changes: filters to only known SINTAKS, rebuilds missing entries.
 */
export function restoreProgressState(
  comicId: number,
  sintaksList: SintaksProgress[]
): ComicProgressState {
  const validSet = new Set<string>(SINTAKS);

  // Keep only entries whose sintaks is still in the current SINTAKS list
  const filtered = sintaksList.filter((s) => validSet.has(s.sintaks));

  // Build a map from stored data
  const storedMap = new Map(filtered.map((s) => [s.sintaks, s.status]));

  // Reconstruct full list in canonical SINTAKS order
  const restored: SintaksProgress[] = SINTAKS.map((sintaks) => ({
    sintaks,
    status: storedMap.get(sintaks) ?? 'LOCKED',
  }));

  // Ensure at least one stage is CURRENT if none is (e.g. all LOCKED after migration)
  const hasCurrent = restored.some((s) => s.status === 'CURRENT');
  const hasCompleted = restored.some((s) => s.status === 'COMPLETED');
  if (!hasCurrent && !buildState(comicId, restored).isCompleted) {
    // Find first non-COMPLETED stage and mark it CURRENT
    const firstLocked = restored.findIndex((s) => s.status === 'LOCKED');
    if (firstLocked !== -1) restored[firstLocked] = { ...restored[firstLocked], status: 'CURRENT' };
    else if (!hasCompleted) restored[0] = { ...restored[0], status: 'CURRENT' };
  }

  return buildState(comicId, restored);
}

// ─── Internal ────────────────────────────────────────────────────────────────

function buildState(comicId: number, sintaksList: SintaksProgress[]): ComicProgressState {
  const completedCount = sintaksList.filter((s) => s.status === "COMPLETED").length;
  return {
    comicId,
    sintaksList,
    completedCount,
    percentage: calculatePercentage(completedCount),
    isCompleted: completedCount === TOTAL,
  };
}
