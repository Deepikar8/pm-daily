import { sqliteTable, text, integer, real, primaryKey, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  displayName: text("display_name").notNull(),
  company: text("company"),
  role: text("role"),
  timezone: text("timezone").notNull(),
  createdAt: integer("created_at").notNull(),
  lastActiveAt: integer("last_active_at").notNull(),
  termsAcceptedAt: integer("terms_accepted_at"),
  termsVersion: text("terms_version"),
  deletedAt: integer("deleted_at"),
});

export const dailySessions = sqliteTable("daily_sessions", {
  date: text("date").primaryKey(),                 // "2026-05-08"
  headline: text("headline").notNull(),
  themePillar: text("theme_pillar").notNull(),
  digestMd: text("digest_md").notNull(),
  takeawaysJson: text("takeaways_json").notNull(),
  sourceJson: text("source_json").notNull(),
  publishedAt: integer("published_at").notNull(),
});

export const dailyQuestions = sqliteTable(
  "daily_questions",
  {
    id: text("id").primaryKey(),                    // ULID
    date: text("date").notNull(),
    position: integer("position").notNull(),        // 1..5
    ideaId: text("idea_id").notNull(),
    archetype: text("archetype").notNull(),         // apply|diagnose|pick|spot|translate
    scenarioMd: text("scenario_md").notNull(),
    optionsJson: text("options_json").notNull(),
    correctKey: text("correct_key").notNull(),      // "A" | "B" | "C" | "D"
    explanationMd: text("explanation_md").notNull(),
    pmTakeaway: text("pm_takeaway").notNull(),
    citationJson: text("citation_json").notNull(),
  },
  (t) => ({
    uniqDatePos: unique("daily_questions_date_position_uniq").on(t.date, t.position),
  }),
);

export const quizAttempts = sqliteTable(
  "quiz_attempts",
  {
    id: text("id").primaryKey(),                    // ULID
    userId: text("user_id").notNull().references(() => users.id),
    date: text("date").notNull(),
    startedAt: integer("started_at").notNull(),
    submittedAt: integer("submitted_at"),
    totalCorrect: integer("total_correct"),
    totalSeconds: integer("total_seconds"),
    basePoints: integer("base_points"),
    speedBonus: integer("speed_bonus"),
    streakMultiplier: real("streak_multiplier"),
    totalPoints: integer("total_points"),
  },
  (t) => ({
    uniqUserDate: unique("quiz_attempts_user_date_uniq").on(t.userId, t.date),
  }),
);

export const quizAnswers = sqliteTable(
  "quiz_answers",
  {
    attemptId: text("attempt_id").notNull().references(() => quizAttempts.id),
    questionId: text("question_id").notNull().references(() => dailyQuestions.id),
    selectedKey: text("selected_key").notNull(),
    isCorrect: integer("is_correct").notNull(),     // 0/1
    answeredAt: integer("answered_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.attemptId, t.questionId] }),
  }),
);

export const userStats = sqliteTable("user_stats", {
  userId: text("user_id").primaryKey().references(() => users.id),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastAttemptDate: text("last_attempt_date"),
  totalPoints: integer("total_points").notNull().default(0),
  weeklyPoints: integer("weekly_points").notNull().default(0),
  weekKey: text("week_key").notNull(),              // "2026-W19"
  totalAttempts: integer("total_attempts").notNull().default(0),
});

export const weeklyArchive = sqliteTable(
  "weekly_archive",
  {
    userId: text("user_id").notNull().references(() => users.id),
    weekKey: text("week_key").notNull(),
    points: integer("points").notNull(),
    rank: integer("rank").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.weekKey] }),
  }),
);

// ---- Better Auth tables (the adapter requires these) ----
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  password: text("password"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at"),
  refreshTokenExpiresAt: integer("refresh_token_expires_at"),
  scope: text("scope"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});
