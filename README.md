# Academic English 8-Week Trainer

A mobile-responsive web application to help intermediate English learners reach academic readiness (IELTS 6.5–7.0 target) in 8 weeks.

## Features

- **Dashboard**
  - Daily study timer (2h30 recommended)
  - Progress tracking for Listening, Speaking, Reading, Writing
  - Weekly performance report and Seneca readiness score
  - Gamification: XP, streaks, levels, and badges

- **Listening Module**
  - Embedded daily university lecture video
  - Two-pass strategy (general idea, then key points)
  - Auto-generated comprehension questions based on learner notes

- **Speaking Module**
  - IELTS-style speaking prompts
  - Shadowing mode using native TTS playback
  - Voice recording and playback via Web Audio APIs
  - AI-style feedback: fluency, pronunciation, grammar suggestions

- **Reading Module**
  - IELTS-style reading passages
  - 15-minute timer
  - Multiple question styles and automatic scoring
  - Adaptive passage difficulty

- **Writing Module**
  - Task 1 and Task 2 templates
  - Essay analyzer with grammar/coherence/vocabulary feedback
  - Estimated IELTS band score (0–9 scale)

- **8-Week Plan**
  - Weeks 1–2 foundation
  - Weeks 3–5 IELTS integration
  - Weeks 6–8 full simulation and mock exams

## Run locally

Open `index.html` in your browser, or serve with:

```bash
python3 -m http.server 8000
```

Then go to `http://localhost:8000`.

## Notes

This implementation includes local, deterministic “AI-style” evaluators to simulate feedback flows. For production, replace scoring functions in `app.js` with real API calls (e.g., OpenAI API) and persist data in a backend database.
