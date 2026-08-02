# FitCheck AI

FitCheck AI is an AI fitness coaching agent built with Next.js, TypeScript,
Tailwind CSS, Recharts, and server-side OpenAI API routes. The app combines the
core ideas of a health tracker, weight-trend app, and workout log into one
coaching experience: users log weight, calories, protein, steps, workouts, and
exercise performance, then the agent turns those inputs into practical next
actions.

Recruiter demo: https://fitcheck-ai-psi.vercel.app/

## Portfolio Demo Safety

The public recruiter experience uses fictional data and isolated demo storage.

- Recruiters should use `https://fitcheck-ai-psi.vercel.app/`.
- Demo data is stored under separate `fitcheck-demo-*` localStorage keys.
- Personal data uses separate `fitcheck-personal-*` localStorage keys.
- The app includes a storage separation check so demo keys and personal keys
  cannot overlap silently.
- Other visitors cannot see the owner's local browser data.
- Public AI actions return protected demo responses by default.
- Recruiter demo AI actions never use live OpenAI calls or spend owner credits.
- The OpenAI API key is never exposed to the browser or committed to GitHub.

The public GitHub/portfolio link opens the recruiter demo. Personal recovery
data is not committed, pushed, or bundled into the public app.

The owner-only personal workspace is available at `/personal` when
`FITCHECK_PERSONAL_PASSWORD` is configured on Vercel. It is password-protected
and still stores personal logs only in the owner's browser localStorage. If the
password is not configured, `/personal` returns 404.

Both the recruiter demo and personal workspace use the same shared app
components, so feature updates apply to both. The difference is access and data:
the recruiter app is public/demo-only, while `/personal` is password-protected,
uses fresh personal storage, and can make live AI calls only after owner
authentication.

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
- Blank numeric inputs for optional metrics, while missing values stay
  analytics-safe as unknown rather than real zeros
- Partial-log handling so missing fields are treated as unknown, not failed
  adherence
- Autosaved daily log draft and edit-past-log flow
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
- Agent operating loop showing whether to build baseline, refresh data, follow
  the current plan, or rerun the agent
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
- Recruiter demo users cannot spend the owner's API credits.
- Password-protected `/personal` requests can use live AI after owner
  authentication.
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
FITCHECK_PERSONAL_PASSWORD=choose-a-private-password
```

Do not commit `.env.local`.

## Roadmap

Current web app status:

- Recruiter-facing demo is the public default route.
- Personal workspace is separated behind `/personal`.
- Public demo data is fictional and isolated from personal browser storage.
- OpenAI calls are server-side and protected from public demo visitors.
- Final web launch QA is documented in
  [`docs/day-66-web-launch-qa.md`](docs/day-66-web-launch-qa.md).

Next phase:

- React Native or Expo app
- Multi-screen mobile layout
- Local workout, nutrition, step, and weight tracking
- Mobile charts and progress views
- Rule-based coaching without bundling an API key
