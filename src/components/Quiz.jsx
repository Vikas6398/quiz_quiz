import { useState } from 'react';

export default function Quiz({ questions }) {
  const [run, setRun] = useState(questions);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState([]);
  const [score, setScore] = useState(0);

  const q = run[i];

  function pick(idx) {
    if (picked !== null) return; // already answered
    setPicked(idx);
    if (idx === q.answerIndex) setScore((s) => s + 1);
    else setWrong((w) => [...w, q]);
  }

  function next() {
    setI(i + 1);
    setPicked(null);
  }

  function reset(list) {
    setRun(list);
    setWrong([]);
    setScore(0);
    setI(0);
    setPicked(null);
  }

  if (!q) {
    return (
      <div className="panel center">
        <p className="score">{score} / {run.length}</p>
        {wrong.length > 0 ? (
          <button className="primary" onClick={() => reset(wrong)}>Re-test {wrong.length} wrong answer(s)</button>
        ) : (
          <p>Perfect round.</p>
        )}
        <button onClick={() => reset(questions)}>Retake full quiz</button>
      </div>
    );
  }

  return (
    <div>
      <p className="muted">Question {i + 1} of {run.length}</p>
      <h3>{q.question}</h3>
      <ul className="options">
        {q.options.map((opt, idx) => {
          let cls = '';
          if (picked !== null) {
            if (idx === q.answerIndex) cls = 'right';
            else if (idx === picked) cls = 'wrong';
          }
          return (
            <li key={idx}>
              <button className={cls} onClick={() => pick(idx)} disabled={picked !== null}>{opt}</button>
            </li>
          );
        })}
      </ul>
      {picked !== null && (
        <div aria-live="polite">
          <p>{picked === q.answerIndex ? 'Correct.' : 'Not quite.'} {q.explanation}</p>
          <button className="primary" onClick={next}>{i + 1 === run.length ? 'See results' : 'Next'}</button>
        </div>
      )}
    </div>
  );
}
