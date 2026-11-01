export interface AiRequestLock {
  current: boolean;
}

export function tryAcquireAiRequestLock(lock: AiRequestLock): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function releaseAiRequestLock(lock: AiRequestLock): void {
  lock.current = false;
}
