# Product Gym PRD

## 1. Summary

Product Gym is a daily product judgment practice app for PMs, founders, and builders. Each day, it turns one operator conversation from Lenny's Podcast or newsletter into a short applied challenge. Users read a concise recap, answer five product decision questions, see their score, compare on a leaderboard, and share results with friends.

The product is free, open source, and designed as a learning companion rather than a content replacement. Every challenge links back to the original source.

## 2. Problem

Product managers consume excellent operator content, but passive learning does not reliably improve judgment. Podcasts and essays are useful, but the user rarely gets a chance to apply the lesson immediately.

Users need:

- A fast daily practice ritual.
- Realistic product decision scenarios.
- Feedback that explains why an answer is strong or weak.
- A lightweight competitive loop to make practice repeatable.
- A way to share progress and challenge peers.

## 3. Goals

- Help users sharpen product judgment through one short daily challenge.
- Convert operator lessons into applied product decisions.
- Make the first-use experience useful without login.
- Encourage repeat usage through streaks, leaderboard, and calendar reminders.
- Enable lightweight virality through score sharing and friend challenges.
- Keep the app free and open source.

## 4. Non-Goals

- Replace Lenny's Podcast or newsletter.
- Republish full source content.
- Become a general PM course platform.
- Monetize access.
- Support user-generated questions in the initial version.
- Build a complex social network.

## 5. Target Users

Primary:

- Product managers who want sharper product judgment.
- Aspiring PMs preparing for interviews or product sense practice.
- Founders/operators who want a daily decision-making warmup.

Secondary:

- Product coaches, communities, and teams using it as a daily discussion prompt.
- Newsletter/podcast fans who want to actively apply what they learn.

## 6. Core User Journey

1. User lands on Product Gym.
2. Landing page shows today's operator and first quiz decision.
3. User answers question 1 without login.
4. User continues into the full 5-question challenge.
5. User receives feedback after each decision.
6. At the end, user sees score, points, rank preview, and takeaways.
7. User signs in to save progress, join leaderboard, and track streaks.
8. User shares score via copy, LinkedIn, or WhatsApp.
9. Friend opens shared result and clicks "Beat this score."

## 7. Key Features

### 7.1 Landing Page

- Shows Product Gym brand and tagline.
- Shows operator of the day.
- Explains that the quiz applies lessons from the operator conversation.
- Lets anonymous users answer question 1.
- After Q1, sends users to continue at question 2.

### 7.2 Daily Challenge

- Five product judgment questions per day.
- Each question has four options.
- Immediate answer feedback.
- Explanation and PM takeaway after each question.
- Timer tracks completion speed.
- Users can complete the full set before login.

### 7.3 Scoring

- Score out of 5.
- Points based on correctness and speed.
- Streak multiplier for signed-in users.
- Late/practice attempts do not affect leaderboard where applicable.
- Score breakdown is visible to users.

### 7.4 Auth and Save

- Google OAuth and magic link sign-in.
- Anonymous users can complete the challenge first.
- After sign-in, pending attempt is saved automatically.
- Saved attempts count toward profile, streak, and leaderboard.

### 7.5 Leaderboard

- Weekly leaderboard, top 50.
- All-time leaderboard, top 50.
- Current user highlighted when present.
- Anonymous users see preview rank before signing in.
- Leaderboard has clear navigation from app tabs.

### 7.6 You Page

- Streak summary.
- Total points, weekly points, rank, sessions.
- 14-day heatmap.
- Recent sessions with visible Review CTA.
- Share latest result / challenge friends.
- Privacy controls: export data, delete account.

### 7.7 Sharing

- Share result page at `/share/:attemptId`.
- Copyable invite text.
- LinkedIn and WhatsApp share actions.
- Dynamic share card with score, points, date, and CTA.
- Public result page includes "Beat this score" CTA.

## 8. Success Metrics

Activation:

- Percentage of landing visitors who answer Q1.
- Percentage of Q1 users who continue to Q2.
- Percentage of users who complete all five questions.

Retention:

- Day 2 return rate.
- Weekly active users.
- Average sessions per user.
- Calendar reminder clicks/downloads.

Virality:

- Share button clicks.
- Shared result page visits.
- Conversion from shared result to starting challenge.
- Challenge completions from shared links.

Learning engagement:

- Completion rate per question.
- Replay/practice usage.
- Review session clicks.
- Takeaway section engagement.

## 9. Requirements

Functional:

- Users can complete today's full challenge anonymously.
- Users can sign in after completion to save score.
- Saved score appears on leaderboard.
- Users can revisit past saved sessions.
- Missed past quizzes can be completed as late challenges.
- Practice replay does not affect leaderboard.
- Share links render public result pages.
- LinkedIn/WhatsApp/copy share actions work.

Content:

- Each day has one source episode/post.
- Each day has recap, takeaways, and five questions.
- Every question has scenario, four options, correct key, explanation, PM takeaway, and source citation/link.
- Content must not include full podcast/newsletter republishing.

Privacy:

- Users can export their data.
- Users can delete/anonymize their account.
- Analytics disclosed in privacy/cookie notices.
- Email used only for sign-in.

## 10. UX Principles

- Product action first, auth second.
- Do not block learning behind login too early.
- Make scoring and save state clear.
- Make sharing feel like a challenge, not a generic post.
- Keep the mascot supportive, not decorative clutter.
- Make leaderboard and progress easy to find.
- Avoid internal/admin copy in user-facing UI.

## 11. Launch Readiness Checklist

- Daily content seeded for first 14 days.
- Google OAuth configured for production domain.
- Magic link works on production domain.
- PostHog tracking live.
- Privacy, Terms, Cookie policy updated.
- Leaderboard displays top 50.
- Share cards render.
- Landing-to-Q2 flow works.
- Anonymous score save after login works.
- Mobile layout checked for landing, quiz, results, leaderboard, You page.

## 12. Open Questions

- Should shared cards use SVG long term, or should we generate PNG for stronger LinkedIn compatibility?
- Should teams/communities have private leaderboards later?
- Should users be able to follow friends?
- Should there be daily email reminders in addition to calendar reminders?
- Should the source/content pipeline be automated end to end?
