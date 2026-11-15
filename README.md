# Study Assistant

A small React + Express web app that turns pasted study notes or a topic into interactive flashcards or a multiple-choice quiz. Instead of a chat interface, the backend asks an OpenAI-compatible LLM for structured JSON, validates and cleans the response, and renders it as a study UI.

## Screen Recording

[https://drive.google.com/file/d/1WhRFCFB2IFYV-AT8v8qLjIYm8Z8du_00/view?usp=sharing](./demo.mp4)

*(Note: Replace `./demo.mp4` with your uploaded video link or drag-and-drop your recording into the GitHub issue/PR editor and paste the generated URL here.)*

## Running It Locally

You'll need Node.js (v18.18+ recommended since the backend uses native `fetch` and `AbortSignal.timeout`) and an API key from any OpenAI-compatible provider. By default, it's set up for Groq's free tier.

1. Clone the repo and copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API key:
   ```ini
   LLM_API_KEY=gsk_your_api_key_here
   LLM_BASE_URL=https://api.groq.com/openai/v1
   LLM_MODEL=llama-3.3-70b-versatile
   PORT=3001
   ```

3. Install dependencies and start both the Express server (`:3001`) and Vite dev server (`:5173`):
   ```bash
   npm install && npm start
   ```

4. Open `http://localhost:5173` in your browser. Vite proxies `/api` requests to Express so the API key stays on the server.

## Usage & Features

- **Input**: Paste 20 to 8,000 characters of notes (or a topic prompt) and toggle between **Flashcards** and **Quiz**.
- **Flashcards**:
  - Click the card or press `Space` to flip between front and back.
  - Use the `←` and `→` arrow keys (or the buttons) to move between cards.
  - Mark cards as **Got it** or **Missed it**. Once you have missed cards, you can click **Study missed cards** to drill only the ones you got wrong.
- **Quiz**:
  - Pick an option to get immediate right/wrong feedback along with the explanation.
  - At the end of the quiz, you get your final score and a **Re-test wrong answers** button to replay only the questions you missed.
- **UI details**: Supports system dark mode (`prefers-color-scheme`), mobile screens, and visible `:focus-visible` outlines for keyboard navigation.

## How It Works & Handling Bad AI Output

The main focus of the codebase is making sure broken or weird LLM output doesn't crash the React UI:

1. **Prompt & Injection Guard (`server/index.js`)**: User input is wrapped inside `<study_material>` tags, and the system prompt explicitly tells the model to treat everything inside those tags as raw study data, not instructions.
2. **Shared Validation (`shared/validate.js`)**: Both the backend and frontend import the same validation module:
   - `extractJson(raw)` strips out ` ```json ` markdown fences or extra conversational text, grabs the outermost `{...}` block, parses it, and throws a custom `OutputError` if it's empty or invalid JSON.
   - `normalize(obj, kind)` checks each flashcard (non-empty `front` and `back` strings) or quiz question (non-empty `question`, 2–6 unique string `options`, valid integer `answerIndex` within bounds, optional `explanation`). If a few items are malformed, it drops them and keeps track of `droppedCount`. It only throws an `OutputError` if zero usable items are left.
3. **1x Auto-Retry on the Server**: If `extractJson` or `normalize` throws an `OutputError` on the first try, the server automatically makes one retry call where it sends the model's bad output back along with the exact validation error message so it can fix its own JSON.
4. **Client Race-Condition & Timeout Guards (`src/api.js`, `src/App.jsx`)**: The client uses an `AbortController` and an incrementing `requestId` ref so that if a user clicks Generate multiple times or switches modes mid-flight, older responses are aborted and ignored. The client also runs `normalize()` one more time on the server payload before rendering.

### Failure-Handling Summary

| Failure scenario | Where it's caught | What the app does | What the user sees |
| :--- | :--- | :--- | :--- |
| Input under 20 or over 8,000 chars | Client form & Server `400` check | Disables submit button; rejects bad POST requests | Character counter turns red |
| Model wraps JSON in ` ```json ` or prose | `extractJson()` in `shared/validate.js` | Strips fences and slices from first `{` to last `}` | Works normally |
| Truncated JSON or completely wrong schema | `extractJson()` / `normalize()` throws `OutputError` | Server retries once with the invalid reply + error message | Recovers automatically, or shows a `422` error with **Try again** if both attempts fail |
| 1–2 bad cards/questions in an otherwise good list | `normalize()` in `shared/validate.js` | Drops the bad items and increments `droppedCount` | Renders the valid items and shows a small note about how many were filtered out |
| Rate limit (`429`), bad key (`401`), or upstream `5xx` | `server/index.js` HTTP status check | Maps the status code to a readable message | Error banner with the reason and a **Try again** button |
| LLM hangs (`>30s` server / `>45s` client) | `AbortSignal.timeout(30000)` & client `AbortController` | Aborts the request cleanly | Timeout message with **Try again** |
| User clicks Generate repeatedly | `requestIdRef` + `AbortController` in `App.jsx` | Cancels the previous in-flight request; ignores stale replies | Only the latest request updates the screen |

## AI-Usage Note

I used an AI assistant during development mainly for:
- Drafting the initial CSS custom variables for light/dark mode in `src/styles.css`.
- Brainstorming edge cases for `shared/validate.js` (like checking for duplicate quiz options case-insensitively and making `normalize()` work on both raw LLM responses and already-normalized payloads).
- Formatting the failure-handling table in this README.

I wrote and manually tested the retry loop in `server/index.js`, the `AbortController` + request ID tracking in `src/App.jsx` and `src/api.js`, and the state logic for replaying missed flashcards and wrong quiz questions.

## Known Limitations

- **In-memory state only**: There is no database or `localStorage` persistence yet, so refreshing the page clears your current deck or quiz progress.
- **Single retry**: If a smaller model fails to produce valid JSON on both the initial request and the retry, the user has to click **Try again** manually.
- **Plain text rendering**: Code snippets or LaTeX math formulas inside flashcards/questions are rendered as plain text rather than syntax-highlighted blocks.

## Time Spent

- `shared/validate.js` (JSON extraction + normalization rules): ~45 mins
- `server/index.js` (Express proxy, timeouts, error mapping, 1x retry flow): ~45 mins
- `src/components/Flashcards.jsx` & `Quiz.jsx` (keyboard shortcuts + missed-item replay): ~50 mins
- `src/api.js`, `src/App.jsx` & `src/styles.css` (abort logic, stale request guard, dark mode CSS): ~40 mins
- Manual testing & writing the README: ~20 mins
- **Total**: ~3 hours 20 minutes