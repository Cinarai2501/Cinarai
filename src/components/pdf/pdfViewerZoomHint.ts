export const ZOOM_HINT_KEY = "cinarai_comic_zoom_hint_seen";

function getStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
}

export function hasSeenZoomHint(): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    return storage.getItem(ZOOM_HINT_KEY) === "true";
  } catch {
    return false;
  }
}

export function markZoomHintSeen(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(ZOOM_HINT_KEY, "true");
  } catch {
    // Ignore storage errors so the reader remains usable.
  }
}