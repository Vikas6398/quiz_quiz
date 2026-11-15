import { normalize } from '../shared/validate.js';

const CLIENT_TIMEOUT = 45000;

// Throws an Error with a user-readable message. `signal` lets the caller cancel (stale request).
export async function generateSet(text, kind, signal) {
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT);
  const combined = AbortSignal.any([signal, timeout]);
  let res;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, kind }),
      signal: combined,
    });
  } catch (e) {
    if (signal.aborted) throw e; // cancelled on purpose, caller ignores it
    if (timeout.aborted) throw new Error('This is taking too long. Try again or use shorter notes.');
    throw new Error('Could not reach the server. Check your connection.');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message || `Something went wrong (${res.status}).`);
  // don't trust the server blindly either
  try {
    return normalize({ title: body.title, cards: body.items, questions: body.items }, kind);
  } catch {
    throw new Error('The server sent data in an unexpected format.');
  }
}
