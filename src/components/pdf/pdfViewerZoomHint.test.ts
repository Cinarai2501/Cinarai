import test from "node:test";
import assert from "node:assert/strict";

import { hasSeenZoomHint, markZoomHintSeen, ZOOM_HINT_KEY } from "./pdfViewerZoomHint";

function createFakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  };
}

test("shows the hint until it is marked as seen", () => {
  const storage = createFakeStorage();
  (globalThis as typeof globalThis & { window: typeof window }).window = { localStorage: storage } as unknown as Window & typeof globalThis;

  assert.equal(hasSeenZoomHint(), false);
  markZoomHintSeen();
  assert.equal(storage.getItem(ZOOM_HINT_KEY), "true");
  assert.equal(hasSeenZoomHint(), true);
});