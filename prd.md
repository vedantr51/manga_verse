🎯 PHASE GOAL

Transform MangaVerse from a single-device personal tool into a cross-device, intelligent companion that:

syncs user data

learns user taste over time

provides personalized recommendations

remains lightweight and respectful of user ownership

👤 TARGET USER

Manga / anime readers with multiple devices

People who track long-running series

Users who want smart suggestions, not generic lists

Privacy-aware users who dislike heavy social platforms

✅ IN SCOPE (THIS PHASE)
1️⃣ Authentication (Minimal, Purposeful)

Email or OAuth login

No social features

No public profiles

Identity exists only to sync data

2️⃣ Database Integration

Use PostgreSQL + Prisma.

Core tables:

User

Series

UserSeries (join table)

Store:

Title

Type

Status

Progress

Notes

Timestamps

User ownership

3️⃣ Sync Logic

On login → merge local data → DB

DB becomes source of truth

Offline-first mindset (graceful failures)

4️⃣ AI Personalization (REAL VALUE)

AI must use stored history, not prompts alone.

Model responsibilities (LOCKED):

Gemini 2.0 Flash (free)

Summaries

Mood-based recommendations

Lightweight insight generation

LLaMA 3.3 70B

Taste profiling

Cross-series reasoning

“Why you’ll like this”

Long-term preference analysis

AI must:

Reference reading patterns

Adapt recommendations over time

Avoid generic responses

5️⃣ UX Expectations

AI insights must feel earned

No flashy “AI” labels

Calm, confident tone

Clear explanations

❌ OUT OF SCOPE (STRICT)

Social feeds

Comments / likes

Content hosting

Piracy

Payments

Ads

Over-automation

🧱 DATA MODEL (DB)
User {
  id
  email
  createdAt
}

Series {
  id
  title
  type
}

UserSeries {
  id
  userId
  seriesId
  status
  progress
  notes
  createdAt
  updatedAt
}

🎯 SUCCESS METRICS

User logs in on 2 devices → sees same library

AI recommendations change as history grows

App remains fast and readable

No unnecessary complexity visible to user