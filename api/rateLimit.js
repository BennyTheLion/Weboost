// In-memory per-IP rate limiter. Best-effort only — serverless platforms may
// run multiple instances under real traffic, so this won't be a perfectly
// shared counter. For a hard guarantee at scale, swap this for a shared
// store like Upstash Redis, keeping the same checkRateLimit(ip) interface.

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 30;

const requestLog = new Map(); // ip -> array of request timestamps within the window

function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    requestLog.set(ip, timestamps);
    return { allowed: false };
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return { allowed: true };
}

module.exports = { checkRateLimit };
