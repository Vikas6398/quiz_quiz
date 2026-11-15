# Study Deck

Paste notes or a topic, pick flashcards or a quiz, and the model's JSON becomes an interactive study set. Flip cards, take the quiz, and re-test whatever you got wrong.

## Setup

```
npm install
cp .env.example .env     # add your LLM_API_KEY
npm start                # API on :3001, app on :5173
```

Any OpenAI-compatible provider works (default is Groq's free tier). Change `LLM_BASE_URL` and `LLM_MODEL` in `.env` to switch. Node 20+ is needed (`AbortSignal.any`).

## How it works

- `server/index.js` holds the API key and calls the model, so the key never reaches the browser.
- `shared/validate.js` is the trust boundary: strip code fences, parse JSON, check each card/question, drop broken items, throw only if nothing is usable.
- If the output is bad the server retries once, sending the model its own error message.
- The client checks the server's response again before rendering.

## Failure handling

| Case | What happens |
| --- | --- |
| Malformed JSON / fenced JSON | Cleaned if possible, otherwise one retry, then an error with "Try again" |
| Wrong shape / bad items | Bad items dropped and the user is told how many; all bad = retry then error |
| Empty response | Treated as bad output |
| Slow | 30s server timeout, 45s client timeout, both with clear messages |
| Provider down / 429 | Mapped to readable messages |
| Stale response | Each request gets an id and the previous one is aborted; only the newest can set state |

## AI usage note

I used an AI assistant to scaffold the project and draft the code. I reviewed it and ran it myself. **Edit this section to say what you actually did and what you changed.**

## Known limitations

- No streaming, no saved sessions, no follow-up refinement.
- Validation is hand-written, not schema-based (zod would be a good next step).
- Quiz answer order isn't shuffled, so the model's answer positions show through.
- No automated tests; I'd start with unit tests for `shared/validate.js`.
- Not deployed.

## Time spent

(fill in)
