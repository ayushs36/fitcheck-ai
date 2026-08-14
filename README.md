# FitCheck AI

FitCheck AI is a fitness analytics web app built around an AI coaching agent. It
combines daily health logging, weight-trend analysis, nutrition tracking,
workout tracking, and agent-generated recommendations into one focused coaching
dashboard.

Live demo: https://fitcheck-ai-psi.vercel.app/

## What It Does

- Logs weight, calories, protein, steps, workouts, and exercise performance
- Handles partial logs safely, so blank fields are treated as unknown instead
  of zero
- Tracks weight trends with a 7-day moving average
- Visualizes weight, calories, and steps over time
- Estimates maintenance calories with confidence notes and guardrails
- Forecasts goal timelines for different weekly weight-change targets
- Detects plateau risk and goal feasibility issues
- Analyzes strength trends across workouts, muscle groups, bodyweight
  exercises, and form-focused training periods
- Saves agent recommendations and compares the latest recommendation against
  previous agent checks

## AI Coaching Agent

FitCheck AI is designed as a coaching loop rather than a passive tracker.

1. The user logs daily fitness data.
2. Analytics calculate trend signals from recent logs.
3. A rule-based decision engine evaluates progress, adherence, risk, and goal
   feasibility.
4. Server-side OpenAI routes generate practical coaching responses when live AI
   access is allowed.
5. The agent dashboard shows the current priority, plan, confidence, risks, and
   next action.
6. Agent history stores past decisions so recommendations can be compared over
   time.

The agent can recommend holding calories, reducing calories, increasing steps,
improving protein, focusing recovery, or adjusting the goal timeline.

## Demo Mode

The public demo uses fictional fitness data so visitors can explore the app
without accessing personal logs. OpenAI calls are handled through server-side
Next.js API routes, keeping API keys out of the browser and source code.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- OpenAI API
- Vercel
- localStorage

## Local Development

```bash
npm install
npm run dev
```

For private live AI calls, create `.env.local` and set:

```bash
OPENAI_API_KEY=your_key_here
FITCHECK_PERSONAL_PASSWORD=choose-a-private-password
```

Do not commit `.env.local`.
