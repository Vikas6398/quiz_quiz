// Used by the server (to check what the model sent) and the client (to check what the server sent).
// The model's output is treated as untrusted input: nothing gets rendered until it passes through here.

export class OutputError extends Error {
  constructor(message) {
    super(message);
    this.code = 'bad_output';
    this.status = 502;
  }
}

const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

// Models love wrapping JSON in ```json fences or adding a sentence before it.
export function extractJson(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new OutputError('The model returned an empty response.');
  }
  const s = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) throw new OutputError('The response did not contain a JSON object.');
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    throw new OutputError('The response was not valid JSON.');
  }
}

function cleanCard(c) {
  const front = str(c?.front);
  const back = str(c?.back);
  return front && back ? { front, back } : null;
}

function cleanQuestion(q) {
  const question = str(q?.question);
  if (!question || !Array.isArray(q.options)) return null;
  const options = q.options.map(str);
  // need 2-6 real, distinct options
  if (options.length < 2 || options.length > 6 || options.some((o) => !o)) return null;
  if (new Set(options).size !== options.length) return null;
  const answerIndex = Number(q.answerIndex);
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) return null;
  return { question, options, answerIndex, explanation: str(q.explanation) || '' };
}

// Keeps the good items, drops the broken ones, throws only if nothing usable is left.
export function normalize(obj, kind) {
  const list = kind === 'quiz' ? obj?.questions : obj?.cards;
  if (!Array.isArray(list)) throw new OutputError(`Expected a "${kind === 'quiz' ? 'questions' : 'cards'}" array.`);
  const items = list
    .map(kind === 'quiz' ? cleanQuestion : cleanCard)
    .filter(Boolean)
    .map((item, i) => ({ id: i, ...item }));
  if (!items.length) throw new OutputError('None of the generated items were usable.');
  return { kind, title: str(obj.title) || 'Study set', items, dropped: list.length - items.length };
}
