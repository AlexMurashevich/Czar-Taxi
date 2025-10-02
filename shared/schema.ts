import { sql } from "drizzle-orm";
import { pgTable, bigserial, varchar, text, bigint, date, numeric, integer, timestamp, boolean, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  phone: varchar("phone", { length: 20 }).unique().notNull(),
  tgUserId: bigint("tg_user_id", { mode: "number" }),
  fullName: varchar("full_name", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, blocked, waiting
  consentGivenAt: timestamp("consent_given_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  daysCount: integer("days_count").notNull(),
  dailyTargetHours: numeric("daily_target_hours", { precision: 6, scale: 2 }).notNull(),
  monthlyUnitTarget: numeric("monthly_unit_target", { precision: 8, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("planned"), // planned, active, closed
});

export const roleAssignments = pgTable("role_assignments", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  seasonId: bigint("season_id", { mode: "number" }).notNull().references(() => seasons.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // tsar, sotnik, desyatnik, driver
  sotnikId: bigint("sotnik_id", { mode: "number" }).references(() => users.id),
  desyatnikId: bigint("desyatnik_id", { mode: "number" }).references(() => users.id),
  groupIndex: integer("group_index"),
}, (table) => ({
  uniqueSeasonUser: unique().on(table.seasonId, table.userId),
  roleIdx: index("idx_role_assignments_role").on(table.role),
}));

export const hoursRaw = pgTable("hours_raw", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  workDate: date("work_date").notNull(),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
  importId: bigint("import_id", { mode: "number" }),
}, (table) => ({
  uniqueUserDate: unique().on(table.userId, table.workDate),
  dateIdx: index("idx_hours_raw_date").on(table.workDate),
}));

export const aggregatesDaily = pgTable("aggregates_daily", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  seasonId: bigint("season_id", { mode: "number" }).notNull().references(() => seasons.id, { onDelete: "cascade" }),
  workDate: date("work_date").notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  personalHours: numeric("personal_hours", { precision: 8, scale: 2 }).notNull().default("0"),
  teamHours: numeric("team_hours", { precision: 10, scale: 2 }).notNull().default("0"),
  totalHours: numeric("total_hours", { precision: 10, scale: 2 }).notNull().default("0"),
}, (table) => ({
  uniqueUserSeasonDate: unique().on(table.userId, table.seasonId, table.workDate),
  userDateIdx: index("idx_agg_daily_user_date").on(table.userId, table.workDate),
}));

export const aggregatesSeason = pgTable("aggregates_season", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  seasonId: bigint("season_id", { mode: "number" }).notNull().references(() => seasons.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  personalTotal: numeric("personal_total", { precision: 10, scale: 2 }).notNull().default("0"),
  teamTotal: numeric("team_total", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  target: numeric("target", { precision: 12, scale: 2 }).notNull().default("0"),
  targetPercent: numeric("target_percent", { precision: 6, scale: 3 }).notNull().default("0"),
  rankInGroup: integer("rank_in_group"),
  sotnikRank: integer("sotnik_rank"),
}, (table) => ({
  uniqueUserSeason: unique().on(table.userId, table.seasonId),
  roleIdx: index("idx_agg_season_role").on(table.role),
}));

export const imports = pgTable("imports", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  uploadedBy: bigint("uploaded_by", { mode: "number" }).references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  rowsCount: integer("rows_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("processed"), // processed, failed
  errorsJson: text("errors_json"),
});

export const waitlist = pgTable("waitlist", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, approved, rejected
});

export const messagingPermissions = pgTable("messaging_permissions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  leaderId: bigint("leader_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  memberId: bigint("member_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  direction: varchar("direction", { length: 30 }).notNull(), // leader_to_member, member_to_leader
  allowed: boolean("allowed").notNull().default(true),
}, (table) => ({
  uniqueLeaderMemberDirection: unique().on(table.leaderId, table.memberId, table.direction),
}));

export const auditLogs = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: bigint("actor_id", { mode: "number" }).references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: bigint("entity_id", { mode: "number" }),
  payloadJson: text("payload_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  roleAssignments: many(roleAssignments),
  hoursRaw: many(hoursRaw),
  aggregatesDaily: many(aggregatesDaily),
  aggregatesSeason: many(aggregatesSeason),
  imports: many(imports),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  roleAssignments: many(roleAssignments),
  aggregatesDaily: many(aggregatesDaily),
  aggregatesSeason: many(aggregatesSeason),
}));

export const roleAssignmentsRelations = relations(roleAssignments, ({ one }) => ({
  user: one(users, { fields: [roleAssignments.userId], references: [users.id] }),
  season: one(seasons, { fields: [roleAssignments.seasonId], references: [seasons.id] }),
  sotnik: one(users, { fields: [roleAssignments.sotnikId], references: [users.id] }),
  desyatnik: one(users, { fields: [roleAssignments.desyatnikId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeasonSchema = createInsertSchema(seasons).omit({
  id: true,
});

export const insertRoleAssignmentSchema = createInsertSchema(roleAssignments).omit({
  id: true,
});

export const insertHoursRawSchema = createInsertSchema(hoursRaw).omit({
  id: true,
});

export const insertImportSchema = createInsertSchema(imports).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Season = typeof seasons.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type RoleAssignment = typeof roleAssignments.$inferSelect;
export type InsertRoleAssignment = z.infer<typeof insertRoleAssignmentSchema>;
export type HoursRaw = typeof hoursRaw.$inferSelect;
export type InsertHoursRaw = z.infer<typeof insertHoursRawSchema>;
export type AggregateDaily = typeof aggregatesDaily.$inferSelect;
export type AggregateSeason = typeof aggregatesSeason.$inferSelect;
export type Import = typeof imports.$inferSelect;
export type InsertImport = z.infer<typeof insertImportSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type MessagingPermission = typeof messagingPermissions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
