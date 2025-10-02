import { 
  users, seasons, roleAssignments, hoursRaw, aggregatesDaily, aggregatesSeason, 
  imports, waitlist, messagingPermissions, auditLogs, notifications, notificationPreferences,
  type User, type InsertUser, type Season, type InsertSeason, 
  type RoleAssignment, type InsertRoleAssignment, type HoursRaw, type InsertHoursRaw,
  type AggregateDaily, type AggregateSeason, type Import, type InsertImport,
  type Waitlist, type MessagingPermission, type AuditLog,
  type Notification, type InsertNotification, type NotificationPreference, type InsertNotificationPreference
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sum, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getUsers(): Promise<User[]>;

  // Seasons
  createSeason(season: InsertSeason): Promise<Season>;
  getActiveSeason(): Promise<Season | undefined>;
  getSeason(id: number): Promise<Season | undefined>;
  getSeasons(): Promise<Season[]>;
  updateSeason(id: number, updates: Partial<InsertSeason>): Promise<Season>;

  // Role Assignments
  createRoleAssignment(assignment: InsertRoleAssignment): Promise<RoleAssignment>;
  getRoleAssignmentsBySeasonId(seasonId: number): Promise<RoleAssignment[]>;
  getRoleAssignment(userId: number, seasonId: number): Promise<RoleAssignment | undefined>;
  updateRoleAssignment(id: number, updates: Partial<InsertRoleAssignment>): Promise<RoleAssignment>;
  
  // Hours Raw
  createHoursRaw(hours: InsertHoursRaw): Promise<HoursRaw>;
  upsertHoursRaw(hours: InsertHoursRaw): Promise<HoursRaw>;
  getHoursRawByDateRange(startDate: string, endDate: string): Promise<HoursRaw[]>;
  
  // Aggregates
  createAggregateDaily(aggregate: Omit<AggregateDaily, 'id'>): Promise<AggregateDaily>;
  createAggregateSeason(aggregate: Omit<AggregateSeason, 'id'>): Promise<AggregateSeason>;
  getAggregatesDailyBySeasonId(seasonId: number): Promise<AggregateDaily[]>;
  getAggregatesSeasonBySeasonId(seasonId: number): Promise<AggregateSeason[]>;
  updateAggregateSeason(id: number, updates: Partial<AggregateSeason>): Promise<AggregateSeason>;

  // Imports
  createImport(importData: InsertImport): Promise<Import>;
  getImports(): Promise<Import[]>;
  getImport(id: number): Promise<Import | undefined>;
  updateImport(id: number, updates: Partial<InsertImport>): Promise<Import>;

  // Waitlist
  addToWaitlist(waitlistEntry: Omit<Waitlist, 'id' | 'addedAt'>): Promise<Waitlist>;
  getWaitlist(): Promise<Waitlist[]>;

  // Dashboard Stats
  getDashboardStats(alertsCount?: number): Promise<{
    totalParticipants: number;
    dailyHours: number;
    goalPercentage: number;
    alerts: number;
  }>;
  
  getHierarchyStats(seasonId: number): Promise<{
    tsar: { current: number; max: number };
    centurions: { current: number; max: number };
    decurions: { current: number; max: number };
    drivers: { current: number; max: number };
  }>;
  
  getWaitlistCount(): Promise<number>;

  // Leaderboards
  getTopCenturions(seasonId: number, limit?: number): Promise<Array<AggregateSeason & { user: User }>>;
  getTopDrivers(seasonId: number, limit?: number): Promise<Array<AggregateSeason & { user: User }>>;

  // Audit
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(filters?: { userId?: number; type?: string; status?: string; limit?: number }): Promise<Notification[]>;
  updateNotificationStatus(id: number, status: string, sentAt?: Date): Promise<Notification>;
  
  // Notification Preferences
  createNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference>;
  getNotificationPreferences(userId: number): Promise<NotificationPreference[]>;
  updateNotificationPreference(id: number, updates: Partial<InsertNotificationPreference>): Promise<NotificationPreference>;
  upsertNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createSeason(season: InsertSeason): Promise<Season> {
    const [newSeason] = await db.insert(seasons).values(season).returning();
    return newSeason;
  }

  async getActiveSeason(): Promise<Season | undefined> {
    const [season] = await db.select().from(seasons).where(eq(seasons.status, 'active'));
    return season || undefined;
  }

  async getSeason(id: number): Promise<Season | undefined> {
    const [season] = await db.select().from(seasons).where(eq(seasons.id, id));
    return season || undefined;
  }

  async getSeasons(): Promise<Season[]> {
    return await db.select().from(seasons).orderBy(desc(seasons.startDate));
  }

  async updateSeason(id: number, updates: Partial<InsertSeason>): Promise<Season> {
    const [season] = await db.update(seasons).set(updates).where(eq(seasons.id, id)).returning();
    return season;
  }

  async createRoleAssignment(assignment: InsertRoleAssignment): Promise<RoleAssignment> {
    const [roleAssignment] = await db.insert(roleAssignments).values(assignment).returning();
    return roleAssignment;
  }

  async getRoleAssignmentsBySeasonId(seasonId: number): Promise<RoleAssignment[]> {
    return await db.select().from(roleAssignments).where(eq(roleAssignments.seasonId, seasonId));
  }

  async getRoleAssignment(userId: number, seasonId: number): Promise<RoleAssignment | undefined> {
    const [assignment] = await db.select().from(roleAssignments)
      .where(and(eq(roleAssignments.userId, userId), eq(roleAssignments.seasonId, seasonId)));
    return assignment || undefined;
  }

  async updateRoleAssignment(id: number, updates: Partial<InsertRoleAssignment>): Promise<RoleAssignment> {
    const [assignment] = await db.update(roleAssignments).set(updates).where(eq(roleAssignments.id, id)).returning();
    return assignment;
  }

  async createHoursRaw(hours: InsertHoursRaw): Promise<HoursRaw> {
    const [hoursRecord] = await db.insert(hoursRaw).values(hours).returning();
    return hoursRecord;
  }

  async upsertHoursRaw(hours: InsertHoursRaw): Promise<HoursRaw> {
    const [hoursRecord] = await db.insert(hoursRaw)
      .values(hours)
      .onConflictDoUpdate({
        target: [hoursRaw.userId, hoursRaw.workDate],
        set: { hours: hours.hours, importId: hours.importId }
      })
      .returning();
    return hoursRecord;
  }

  async getHoursRawByDateRange(startDate: string, endDate: string): Promise<HoursRaw[]> {
    return await db.select().from(hoursRaw)
      .where(and(gte(hoursRaw.workDate, startDate), lte(hoursRaw.workDate, endDate)));
  }

  async createAggregateDaily(aggregate: Omit<AggregateDaily, 'id'>): Promise<AggregateDaily> {
    const [aggregateRecord] = await db.insert(aggregatesDaily).values(aggregate).returning();
    return aggregateRecord;
  }

  async createAggregateSeason(aggregate: Omit<AggregateSeason, 'id'>): Promise<AggregateSeason> {
    const [aggregateRecord] = await db.insert(aggregatesSeason).values(aggregate).returning();
    return aggregateRecord;
  }

  async getAggregatesDailyBySeasonId(seasonId: number): Promise<AggregateDaily[]> {
    return await db.select().from(aggregatesDaily).where(eq(aggregatesDaily.seasonId, seasonId));
  }

  async getAggregatesSeasonBySeasonId(seasonId: number): Promise<AggregateSeason[]> {
    return await db.select().from(aggregatesSeason).where(eq(aggregatesSeason.seasonId, seasonId));
  }

  async updateAggregateSeason(id: number, updates: Partial<AggregateSeason>): Promise<AggregateSeason> {
    const [aggregate] = await db.update(aggregatesSeason).set(updates).where(eq(aggregatesSeason.id, id)).returning();
    return aggregate;
  }

  async createImport(importData: InsertImport): Promise<Import> {
    const [importRecord] = await db.insert(imports).values(importData).returning();
    return importRecord;
  }

  async getImports(): Promise<Import[]> {
    return await db.select().from(imports).orderBy(desc(imports.uploadedAt));
  }

  async getImport(id: number): Promise<Import | undefined> {
    const [importRecord] = await db.select().from(imports).where(eq(imports.id, id));
    return importRecord || undefined;
  }

  async updateImport(id: number, updates: Partial<InsertImport>): Promise<Import> {
    const [importRecord] = await db.update(imports).set(updates).where(eq(imports.id, id)).returning();
    return importRecord;
  }

  async addToWaitlist(waitlistEntry: Omit<Waitlist, 'id' | 'addedAt'>): Promise<Waitlist> {
    const [entry] = await db.insert(waitlist).values(waitlistEntry).returning();
    return entry;
  }

  async getWaitlist(): Promise<Waitlist[]> {
    return await db.select().from(waitlist).orderBy(desc(waitlist.addedAt));
  }

  async getDashboardStats(alertsCount?: number): Promise<{
    totalParticipants: number;
    dailyHours: number;
    goalPercentage: number;
    alerts: number;
  }> {
    const activeSeason = await this.getActiveSeason();
    if (!activeSeason) {
      return { totalParticipants: 0, dailyHours: 0, goalPercentage: 0, alerts: 0 };
    }

    const [participantsResult] = await db.select({ count: count() })
      .from(roleAssignments)
      .where(eq(roleAssignments.seasonId, activeSeason.id));

    const today = new Date().toISOString().split('T')[0];
    const [todayHoursResult] = await db.select({ total: sum(hoursRaw.hours) })
      .from(hoursRaw)
      .where(eq(hoursRaw.workDate, today));

    const [seasonProgress] = await db.select({ 
      totalHours: sum(aggregatesSeason.total),
      totalTarget: sum(aggregatesSeason.target)
    })
      .from(aggregatesSeason)
      .where(eq(aggregatesSeason.seasonId, activeSeason.id));

    const goalPercentage = seasonProgress?.totalTarget && Number(seasonProgress.totalTarget) > 0 
      ? Math.round((Number(seasonProgress.totalHours || 0) / Number(seasonProgress.totalTarget)) * 100)
      : 0;

    return {
      totalParticipants: participantsResult.count,
      dailyHours: Math.round(Number(todayHoursResult.total || 0)),
      goalPercentage,
      alerts: alertsCount ?? 0
    };
  }

  async getTopCenturions(seasonId: number, limit: number = 5): Promise<Array<AggregateSeason & { user: User }>> {
    const results = await db.select({
      id: aggregatesSeason.id,
      userId: aggregatesSeason.userId,
      seasonId: aggregatesSeason.seasonId,
      role: aggregatesSeason.role,
      personalTotal: aggregatesSeason.personalTotal,
      teamTotal: aggregatesSeason.teamTotal,
      total: aggregatesSeason.total,
      target: aggregatesSeason.target,
      targetPercent: aggregatesSeason.targetPercent,
      rankInGroup: aggregatesSeason.rankInGroup,
      sotnikRank: aggregatesSeason.sotnikRank,
      user: users
    })
      .from(aggregatesSeason)
      .innerJoin(users, eq(aggregatesSeason.userId, users.id))
      .where(and(
        eq(aggregatesSeason.seasonId, seasonId),
        eq(aggregatesSeason.role, 'sotnik')
      ))
      .orderBy(desc(aggregatesSeason.total))
      .limit(limit);

    return results;
  }

  async getTopDrivers(seasonId: number, limit: number = 5): Promise<Array<AggregateSeason & { user: User }>> {
    const results = await db.select({
      id: aggregatesSeason.id,
      userId: aggregatesSeason.userId,
      seasonId: aggregatesSeason.seasonId,
      role: aggregatesSeason.role,
      personalTotal: aggregatesSeason.personalTotal,
      teamTotal: aggregatesSeason.teamTotal,
      total: aggregatesSeason.total,
      target: aggregatesSeason.target,
      targetPercent: aggregatesSeason.targetPercent,
      rankInGroup: aggregatesSeason.rankInGroup,
      sotnikRank: aggregatesSeason.sotnikRank,
      user: users
    })
      .from(aggregatesSeason)
      .innerJoin(users, eq(aggregatesSeason.userId, users.id))
      .where(and(
        eq(aggregatesSeason.seasonId, seasonId),
        eq(aggregatesSeason.role, 'driver')
      ))
      .orderBy(desc(aggregatesSeason.personalTotal))
      .limit(limit);

    return results;
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const [auditRecord] = await db.insert(auditLogs).values(log).returning();
    return auditRecord;
  }

  async getHierarchyStats(seasonId: number): Promise<{
    tsar: { current: number; max: number };
    centurions: { current: number; max: number };
    decurions: { current: number; max: number };
    drivers: { current: number; max: number };
  }> {
    const [tsarCount] = await db.select({ count: count() })
      .from(roleAssignments)
      .where(and(
        eq(roleAssignments.seasonId, seasonId),
        eq(roleAssignments.role, 'tsar')
      ));

    const [centurionCount] = await db.select({ count: count() })
      .from(roleAssignments)
      .where(and(
        eq(roleAssignments.seasonId, seasonId),
        eq(roleAssignments.role, 'sotnik')
      ));

    const [decurionCount] = await db.select({ count: count() })
      .from(roleAssignments)
      .where(and(
        eq(roleAssignments.seasonId, seasonId),
        eq(roleAssignments.role, 'desyatnik')
      ));

    const [driverCount] = await db.select({ count: count() })
      .from(roleAssignments)
      .where(and(
        eq(roleAssignments.seasonId, seasonId),
        eq(roleAssignments.role, 'driver')
      ));

    return {
      tsar: { current: tsarCount.count, max: 1 },
      centurions: { current: centurionCount.count, max: 10 },
      decurions: { current: decurionCount.count, max: 100 },
      drivers: { current: driverCount.count, max: 1000 }
    };
  }

  async getWaitlistCount(): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(waitlist)
      .where(eq(waitlist.status, 'new'));
    return result.count;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getNotifications(filters?: { userId?: number; type?: string; status?: string; limit?: number }): Promise<Notification[]> {
    let query = db.select().from(notifications);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(notifications.userId, filters.userId));
    }
    if (filters?.type) {
      conditions.push(eq(notifications.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(notifications.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    let result = query.orderBy(desc(notifications.createdAt)) as any;
    
    if (filters?.limit) {
      result = result.limit(filters.limit);
    }

    return await result;
  }

  async updateNotificationStatus(id: number, status: string, sentAt?: Date): Promise<Notification> {
    const updates: any = { status };
    if (sentAt) {
      updates.sentAt = sentAt;
    }
    const [updated] = await db.update(notifications).set(updates).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async createNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference> {
    const [created] = await db.insert(notificationPreferences).values(preference).returning();
    return created;
  }

  async getNotificationPreferences(userId: number): Promise<NotificationPreference[]> {
    return await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
  }

  async updateNotificationPreference(id: number, updates: Partial<InsertNotificationPreference>): Promise<NotificationPreference> {
    const [updated] = await db.update(notificationPreferences).set(updates).where(eq(notificationPreferences.id, id)).returning();
    return updated;
  }

  async upsertNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference> {
    const [result] = await db
      .insert(notificationPreferences)
      .values(preference)
      .onConflictDoUpdate({
        target: [notificationPreferences.userId, notificationPreferences.eventType],
        set: {
          enabled: preference.enabled,
          telegramEnabled: preference.telegramEnabled,
          websocketEnabled: preference.websocketEnabled,
        },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
