1. Objective

Move MangaVerse from working authentication + database to a fully synced, user-aware experience, and prepare the system for AI personalization without implementing AI yet.

2. Current State (Confirmed)

Users can sign up and log in

Same user can log in from multiple devices

Sessions are managed correctly

Prisma + Neon + Auth.js are stable

UserSeries data is stored per user

No piracy or content hosting

3. Phase 4A – Data Sync & User Isolation (IMMEDIATE)
3.1 Session-Based Access Control

Goal:
Ensure every API and DB query is scoped to the logged-in user.

Requirements:

Every server action must call auth()

Extract session.user.id

Use it as a mandatory filter in Prisma queries

Acceptance Criteria:

A user can never see or modify another user’s data

Unauthenticated requests fail gracefully

3.2 Local → Cloud Sync on Login

Goal:
Merge local (guest) progress into the cloud account.

Rules:

Local data exists before login

On login:

Compare local and cloud entries

If local is newer → overwrite cloud

If cloud is newer → keep cloud

Matching key: (userId + seriesId)

Conflict Resolution:

Use updatedAt or lastModified

Never delete data automatically

3.3 Cloud → Local Hydration

Goal:
After login, hydrate UI from the database.

Flow:

User logs in

Fetch all UserSeries for that user

Populate app state

UI reflects cloud truth

4. Phase 4A – UX Improvements
4.1 Auth UX States

Required UI States:

Loading (session resolving)

Logged out (local-only mode)

Logged in (cloud-sync enabled)

Copy Guidance:

Logged out: “Progress saved locally”

Logged in: “Progress synced across devices”

4.2 Error Handling

Rules:

No raw Prisma errors in UI

All errors mapped to human-readable messages

Auth errors never return HTML

5. Phase 4B – AI Readiness (NO AI CALLS YET)
5.1 AI Boundaries (Locked)

AI will:

Recommend manga/anime

Analyze user preferences

Suggest next reads

AI will NOT:

Fetch chapters

Provide illegal links

Scrape copyrighted content

5.2 Data Preparation for AI

Prepare these fields (no inference yet):

Reading status distribution

Genre frequency

Completion rate

Drop-off patterns

Store as derived data or compute on demand.

6. Non-Goals (Explicitly Out of Scope)

OAuth providers (Google, Discord)

Payment / subscriptions

AI inference

Social features

Public profiles

7. Success Criteria

Phase 4A is complete when:

Login sync works reliably

Same account works across devices

No data leakage between users

App works offline + online

Ready to plug in AI without refactor

8. Engineering Principles (Must Follow)

Local-first always

Cloud is optional enhancement

No silent failures

Explicit user ownership of data

Privacy > features