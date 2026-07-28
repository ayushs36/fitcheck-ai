# FitCheck AI

FitCheck AI is an AI fitness coaching agent built with Next.js, TypeScript,
Tailwind CSS, Recharts, and server-side OpenAI API routes. The app combines the
core ideas of a health tracker, weight-trend app, and workout log into one
coaching experience: users log weight, calories, protein, steps, workouts, and
exercise performance, then the agent turns those inputs into practical next
actions.

Live demo: https://fitcheck-ai-psi.vercel.app/?demo=1

## Portfolio Demo Safety

The public deployment is configured as a protected portfolio demo.

- First-time visitors see fictional demo data.
- The `?demo=1` link opens a clean fictional demo preview even if the browser
  has older local data.
- Demo preview mode does not overwrite saved personal logs, settings, drafts,
  or history.
- Personal data is stored only in each visitor's browser through localStorage.
- Other visitors cannot see the owner's local browser data.
- Public AI actions return protected demo responses by default.
- Live OpenAI calls are blocked unless explicitly enabled on the server.
- The OpenAI API key is never exposed to the browser or committed to GitHub.

If the owner opens the app in a browser that already has saved logs, that browser
can show the owner's local data. Recruiters and other public visitors do not
share that localStorage state.

## What Makes It An Agent

FitCheck AI is designed around a coaching loop, not just passive tracking.

1. The user logs daily fitness inputs.
2. The analytics layer calculates trend signals.
3. The rule-based decision engine chooses the current coaching action.
4. The agent dashboard explains the decision, guardrails, risks, and next step.
5. Agent memory compares the latest recommendation against previous checks.
6. Server-side AI routes can generate structured coaching reports without
   exposing API keys.

The core agent can decide whether to hold calories, reduce calories, increase
steps, improve protein, focus recovery, or adjust the goal timeline.

## Core Features

- Daily logging for weight, calories, protein, steps, workouts, and exercises
- Partial-log handling so missing fields are treated as unknown, not failed
  adherence
- Weight trend analytics with 7-day moving average
- Weight, calorie, and step charts
- Maintenance calorie estimator with confidence and guardrails
- Goal forecasting for 1, 1.5, and 2 lb/week scenarios
- Plateau risk detection
- Nutrition diagnosis and calorie/protein target guidance
- Training signal analysis across matching workouts and muscle groups
- Bodyweight exercise handling based on reps instead of load
- Form-focused training logic so one lighter week is not treated as strength
  loss
- Agent decision engine and decision audit trail
- Agent memory and saved agent history
- Protected public demo mode

## Agent Decision Engine

The decision engine evaluates:

- Moving-average weight trend
- Current pace versus required goal pace
- Calories, protein, and step averages
- Maintenance estimate confidence
- Goal feasibility and goal date pressure
- Plateau risk
- Training performance across 2-3 week windows
- Recovery/readiness risk
- Logging completeness and data freshness
- Previous agent recommendations and follow-through

The Day 59 decision audit trail makes the agent explainable by showing:

- Signals used
- Decision path
- Guardrails
- Actions the agent chose not to take
- Data needed to increase confidence

## Architecture

```text
User logs
  -> localStorage persistence
  -> analytics and trend calculations
  -> rule-based decision engine
  -> agent dashboard, memory, and history
  -> protected Next.js API routes
  -> optional server-side OpenAI responses
```

OpenAI calls are kept inside Next.js API routes:

- `app/api/fitcheck-ai/route.ts`
- `app/api/parse-log/route.ts`

Both routes use public-demo protection so visitors cannot spend the owner's API
credits.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- OpenAI API
- Vercel
- GitHub
- localStorage

## Privacy And API-Key Model

FitCheck AI currently uses localStorage instead of user accounts or a database.
That keeps the portfolio demo simple and avoids public storage of personal data.

Important safeguards:

- `OPENAI_API_KEY` is server-only.
- Public visitors receive protected demo AI responses.
- `FITCHECK_ALLOW_PUBLIC_AI` must be explicitly set to `true` before public live
  AI calls can run.
- A private `FITCHECK_AGENT_SECRET` path exists for future owner-only live AI
  access.

## Local Development

```bash
npm install
npm run dev
```

For live OpenAI calls in a private local environment, create `.env.local` and
set:

```bash
OPENAI_API_KEY=your_key_here
FITCHECK_ALLOW_PUBLIC_AI=true
```

Do not commit `.env.local`.

## Resume Bullets

- Built an AI fitness coaching agent in Next.js and TypeScript that analyzes
  weight trends, calories, protein, steps, workouts, goal feasibility, recovery,
  and strength progression to generate practical coaching decisions.
- Designed a rule-based decision engine with agent memory, explainable decision
  audits, confidence scoring, and protected server-side OpenAI routes.
- Implemented a privacy-safe public portfolio demo with fictional data,
  localStorage persistence, API-key protection, and Vercel deployment.

## Roadmap

Near-term web polish:

- Final recruiter demo QA
- README and LinkedIn/resume polish
- Mobile responsiveness review
- Public demo verification in a clean browser session

Mobile app phase:

- React Native or Expo app
- Multi-screen mobile layout
- Local workout, nutrition, step, and weight tracking
- Mobile charts and progress views
- Rule-based coaching without bundling an API key
- Future authenticated backend if live AI is added to mobile
