import { useEffect, useState } from 'react';

export default function Flashcards({ cards }) {
  const [deck, setDeck] = useState(cards);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [missed, setMissed] = useState([]);

  const done = i >= deck.length;
  const card = deck[i];

  function go(step) {
    setFlipped(false);
    setI((n) => Math.max(0, n + step));
  }

  function mark(isMissed) {
    if (isMissed) setMissed((m) => [...m, card]);
    go(1);
  }

  function studyMissed() {
    setDeck(missed);
    setMissed([]);
    setI(0);
    setFlipped(false);
  }

  // keyboard: space flips, arrows move
  useEffect(() => {
    if (done) return;
    function onKey(e) {
      if (e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); }
      if (e.code === 'ArrowRight') go(1);
      if (e.code === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (done) {
    return (
      <div className="panel center">
        <p>Round finished. {missed.length === 0 ? 'You marked nothing as missed.' : `${missed.length} card(s) marked to review.`}</p>
        {missed.length > 0 && <button className="primary" onClick={studyMissed}>Study missed cards</button>}
        <button onClick={() => { setDeck(cards); setMissed([]); setI(0); }}>Restart full deck</button>
      </div>
    );
  }

  return (
    <div>
      <p className="muted">Card {i + 1} of {deck.length}</p>
      <button className={`card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label="Flip card">
        <span className="face">{flipped ? card.back : card.front}</span>
        <span className="hint">{flipped ? 'Answer' : 'Tap to flip'}</span>
      </button>
      <div className="row">
        <button onClick={() => go(-1)} disabled={i === 0}>Back</button>
        <button onClick={() => mark(true)}>Missed it</button>
        <button className="primary" onClick={() => mark(false)}>Got it</button>
      </div>
    </div>
  );
}
