type AttemptData = {
  count: number;
  lastAttempt: number; // timestamp
};

const attemptMap = new Map<string, AttemptData>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000;

export function recordLoginAttempt(email: string, success: boolean): string | null {
  const now = Date.now();
  const data = attemptMap.get(email);

  if (success) {
    attemptMap.delete(email);
    return null;
  }

  if (!data) {
    attemptMap.set(email, { count: 1, lastAttempt: now });
    return null;
  }

  const { count, lastAttempt } = data;

  if (now - lastAttempt > LOCK_DURATION_MS) {
    attemptMap.set(email, { count: 1, lastAttempt: now });
    return null;
  }

  if (count + 1 >= MAX_ATTEMPTS) {
    attemptMap.set(email, { count: count + 1, lastAttempt: now });
    return `Please try again after 10 minutes.`;
  }

  attemptMap.set(email, { count: count + 1, lastAttempt: now });
  return null;
}

export function isLocked(email: string): boolean {
  const data = attemptMap.get(email);
  if (!data) return false;
  const { count, lastAttempt } = data;
  return count >= MAX_ATTEMPTS && Date.now() - lastAttempt < LOCK_DURATION_MS;
}

