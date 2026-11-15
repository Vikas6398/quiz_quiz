import { useRef, useState } from 'react';
import { generateSet } from './api.js';
import Flashcards from './components/Flashcards.jsx';
import Quiz from './components/Quiz.jsx';

export default function App() {
  const [text, setText] = useState('');
  const [kind, setKind] = useState('cards');
  const [state, setState] = useState({ status: 'idle', data: null, error: '' });
  const latest = useRef(0);
  const controller = useRef(null);

  async function submit(e) {
    e.preventDefault();
    // cancel whatever is in flight and remember which request is the newest
    controller.current?.abort();
    controller.current = new AbortController();
    const id = ++latest.current;
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try {
      const data = await generateSet(text, kind, controller.current.signal);
      if (id !== latest.current) return; // a newer request exists, drop this one
      setState({ status: 'ready', data, error: '' });
    } catch (err) {
      if (id !== latest.current || err.name === 'AbortError') return;
      setState((s) => ({ status: 'error', data: s.data, error: err.message }));
    }
  }

  const { status, data, error } = state;
  const loading = status === 'loading';
  const tooShort = text.trim().length < 20;

  return (
    <main className="app">
      <h1>Study Deck</h1>
      <form onSubmit={submit} className="input">
        <label htmlFor="notes">Paste your notes or a topic</label>
        <textarea
          id="notes"
          rows={6}
          value={text}
          maxLength={8000}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. The causes of the French Revolution..."
        />
        <div className="row">
          <div className="seg" role="radiogroup" aria-label="Output type">
            {[['cards', 'Flashcards'], ['quiz', 'Quiz']].map(([value, label]) => (
              <button
                type="button"
                key={value}
                role="radio"
                aria-checked={kind === value}
                className={kind === value ? 'on' : ''}
                onClick={() => setKind(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="primary" disabled={tooShort || loading}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>

      {status === 'error' && (
        <div className="error" role="alert">
          <p>{error}</p>
          <button onClick={submit} disabled={tooShort}>Try again</button>
        </div>
      )}

      {loading && <p className="muted" aria-live="polite">Building your set. This can take a few seconds.</p>}

      {status === 'idle' && <p className="muted">Nothing here yet. Paste some notes above and generate a set.</p>}

      {data && !loading && (
        <section>
          <h2>{data.title}</h2>
          {data.dropped > 0 && (
            <p className="muted">{data.dropped} item(s) from the model were malformed and skipped.</p>
          )}
          {data.kind === 'quiz' ? (
            <Quiz key={data.title + data.items.length} questions={data.items} />
          ) : (
            <Flashcards key={data.title + data.items.length} cards={data.items} />
          )}
        </section>
      )}
    </main>
  );
}
