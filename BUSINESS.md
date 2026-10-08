# FeynLearn: Business Model

> **Status:** FeynLearn is currently free and has no payments or accounts. This document describes the planned business model and the assumptions behind it. All figures are estimates to be validated with real usage.

## 1. The market friction

Students are tested on recall, so they study for recall. They can recite a definition and still not know why it is true, and nothing in the usual tools shows them the difference.

- **Flashcard and quiz apps** (Anki, Quizlet) train recognition and recall. They do not test whether you can explain an idea.
- **General AI chatbots** give the answer. That helps in the moment but removes the effort that builds understanding.
- **Human tutors** do expose gaps, but they are expensive and not available at 11 pm before an exam.

The result is that gaps stay hidden until an exam or a real problem exposes them.

## 2. The solution

FeynLearn reverses the roles. The student teaches a simulated learner who knows nothing, and the app turns the conversation into evidence of what the student understands:

- **Explain:** a learner persona asks one question at a time and flags misconceptions.
- **Gap map:** concepts marked solid, shaky, or missing, using the student's own words.
- **Catch the mistake:** the student finds errors planted in an explanation.
- **Apply it:** a realistic scenario graded on a rubric.
- **Revisit:** spaced review that returns from a new angle.

## 3. Target customers

| Segment | Who | Why they pay | Priority |
|---|---|---|---|
| Self-directed students | High school and college students preparing for exams | Find gaps before the exam, study alone at any hour | Launch |
| Independent tutors | Tutors with 5-20 students | See which concepts each student struggles with, save prep time | Phase 2 |
| Schools and coaching centers | Teachers and institutions | Class-level view of misconceptions, no extra grading work | Phase 3 |

## 4. Competitive position

| | Teaches by | Shows hidden gaps | Student does the explaining |
|---|---|---|---|
| Flashcard apps | Repetition | No | No |
| General chatbots | Giving answers | No | No |
| AI tutor products | Guided help | Partly | Rarely |
| **FeynLearn** | **Making the student teach** | **Yes (Gap map)** | **Yes** |

## 5. Revenue model

Freemium subscription, with a per-seat plan for groups.

| Plan | Price (proposed) | Includes |
|---|---|---|
| **Free** | $0 | 3 sessions per week, Gap map, Catch the mistake, 1 saved note |
| **Student** | $4.99/month or $49/year | Unlimited sessions, all personas, unlimited notes, Apply it, Revisit, voice, data export and cross-device sync |
| **Tutor** | $14.99/month | Everything in Student, plus up to 20 learners and a group view of weak concepts |
| **School** | $2.50 per student per month, billed annually, 50-seat minimum | Class dashboards, admin controls, onboarding support |

**Why this structure**
- The free tier is the acquisition channel. It is limited by usage, not features, so students see the full value and hit the limit during real study time.
- The Student plan is priced below a single hour of tutoring.
- Tutor and School plans are the higher-value segment, because one buyer brings many users.

## 6. Unit economics (estimates)

**Assumptions** (verify against current provider pricing before relying on them):
- One Explain session is about 12 chat turns plus one analysis, using roughly 22,000 input tokens and 3,000 output tokens (with a notes excerpt, about 40,000 input).
- A fast, low-cost model priced at about $0.30 per million input tokens and $2.50 per million output tokens.
- Payment processing of about 2.9% + $0.30 per charge.

| Item | Estimate |
|---|---|
| AI cost per Explain session | about $0.015 (about $0.02 with notes) |
| AI cost per Catch the mistake round or Apply it challenge | about $0.005 to $0.006 |
| AI cost per free user per month (about 13 sessions) | about $0.26 |
| AI cost per heavy paying student per month | about $0.80 |
| Payment fee on a $4.99 charge | about $0.45 |
| **Gross profit per Student subscriber per month** | **about $3.74 (about 75% margin)** |

**Fixed costs once commercial** (hosting on a paid plan, database, domain): about $47 per month at launch. That is covered by roughly **13 paying students**.

## 7. Illustrative projections

These assume 40% of free users are active in a month. They are planning figures, not forecasts.

| | 1,000 users | 10,000 users |
|---|---|---|
| Paid share | 5% (50 paid) | 6% (600 paid) |
| Monthly revenue | about $250 | about $2,994 |
| AI cost, paid users | about $40 | about $480 |
| AI cost, free users | about $99 | about $978 |
| Payment fees | about $23 | about $270 |
| Fixed costs | about $47 | about $150 |
| **Monthly profit** | **about $42** | **about $1,116** |

Free users are the biggest cost driver. The weekly session limit, shorter context for free sessions, and caching keep it in check.

## 8. Go-to-market

1. **Student communities (months 0-3):** study groups, subject subreddits and Discord servers, and campus clubs. Pitch: "Find out what you don't know before the exam."
2. **Short-form content (ongoing):** screen recordings of the Gap map turning from red to green after a second attempt. It is a concrete, shareable result.
3. **Tutors (months 3-6):** offer the Tutor plan free to 20 tutors for feedback and testimonials.
4. **Schools (months 6-12):** use tutor and student results as case studies, then pilot with a class.
5. **Referrals:** a free week of the Student plan for each friend who completes a session.

## 9. Scalability

**Today**
- Serverless Next.js app on Vercel. No servers to run.
- Four stateless API routes (chat, analyze, reverse, challenge) that scale with traffic.
- User data lives in the browser (IndexedDB), so there is no database load and strong privacy by default.
- AI provider and model are isolated in one file, so they can be swapped without touching the rest of the app.
- Every AI response is validated with a schema and retried once, so bad output does not reach users.

**What changes at scale**

| Concern | Today | At scale |
|---|---|---|
| User data | Browser only | Accounts and a hosted database (for example Postgres) for cross-device sync |
| Rate limiting | In-memory per instance | Shared store (for example Redis) with per-user limits |
| AI cost | Free-tier model | Paid tier with caching of repeated analyses and prompts, and a cheaper model for simple turns |
| Slow jobs | Run inside the request | Queue long analyses and notify when finished |
| Billing | None | Stripe or Razorpay subscriptions with webhooks |
| Reliability | Fallback model | Multi-provider failover and monitoring |

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The AI gives a wrong correction | Ground sessions in the student's uploaded notes, show evidence quotes, and label limitations clearly |
| Free users drive cost | Weekly session cap, context limits, caching |
| AI provider price or availability changes | Provider isolated in one module, fallback model |
| Students are minors | Collect minimal data, keep data on-device by default, add parental-consent flows before accounts |
| Students prefer chatbots that give answers | Position around exam results: "know what you don't know" |
| Low willingness to pay | Keep a generous free tier, sell to tutors and schools where one buyer covers many students |

## 11. Roadmap

- **Now:** free, browser-based, full learning loop.
- **Next:** accounts, cloud sync, usage limits, Student plan with payments.
- **Later:** Tutor plan with a group view, more languages, scanned-PDF support.
- **Then:** School plan with class dashboards and admin tools.

## 12. Success metrics

- Share of new users who finish a first session
- Share who return for a second session within 7 days
- Gap map improvement between a topic's first and second attempt
- Free-to-paid conversion
- AI cost per active user and gross margin
