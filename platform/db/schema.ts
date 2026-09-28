import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const practiceAttempts = sqliteTable(
  "practice_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    problemId: text("problem_id").notNull(),
    at: text("at").notNull(),
    level: text("level").notNull(),
    caseId: text("case_id").notNull(),
    language: text("language").notNull(),
    score: integer("score").notNull(),
    passed: integer("passed").notNull(),
    total: integer("total").notNull(),
    assisted: integer("assisted", { mode: "boolean" }).notNull(),
    explanation: text("explanation").notNull(),
  },
  (t) => [
    index("idx_practice_attempts_user_problem_at").on(
      t.userId,
      t.problemId,
      t.at,
    ),
  ],
);

export const practiceUsage = sqliteTable(
  "practice_usage",
  {
    userId: text("user_id").notNull(),
    bucket: text("bucket").notNull(),
    used: integer("used").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bucket] })],
);
