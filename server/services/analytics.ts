import { storage } from '../storage';
import { db } from '../db';
import { aggregatesDaily, aggregatesSeason, roleAssignments, users } from '@shared/schema';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';

interface DailyTrendData {
  date: string;
  personal: number;
  total: number;
}

interface TeamComparisonData {
  teamName: string;
  total: number;
  target: number;
}

interface GoalProgressData {
  date: string;
  cumulative: number;
  targetCumulative: number;
}

interface PerformanceDistributionData {
  range: string;
  count: number;
}

interface AnalyticsData {
  avgDailyGrowth: number;
  activeTodayCount: number;
  achievedGoalCount: number;
  daysRemaining: number;
  dailyTrend: DailyTrendData[];
  teamComparison: TeamComparisonData[];
  goalProgress: GoalProgressData[];
  performanceDistribution: PerformanceDistributionData[];
}

class AnalyticsService {
  async getAnalytics(seasonId: number): Promise<AnalyticsData> {
    const season = await storage.getSeason(seasonId);
    if (!season) {
      throw new Error('Season not found');
    }

    // Calculate days remaining
    const today = new Date();
    const endDate = new Date(season.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Get daily trend data
    const dailyAggregates = await db.select({
      workDate: aggregatesDaily.workDate,
      personalHours: sql<number>`SUM(${aggregatesDaily.personalHours})`,
      totalHours: sql<number>`SUM(${aggregatesDaily.totalHours})`,
    })
      .from(aggregatesDaily)
      .where(eq(aggregatesDaily.seasonId, seasonId))
      .groupBy(aggregatesDaily.workDate)
      .orderBy(aggregatesDaily.workDate);

    const dailyTrend: DailyTrendData[] = dailyAggregates.map(row => ({
      date: row.workDate,
      personal: Math.round(Number(row.personalHours) || 0),
      total: Math.round(Number(row.totalHours) || 0),
    }));

    // Calculate avg daily growth
    let avgDailyGrowth = 0;
    if (dailyTrend.length >= 2) {
      const recentDays = dailyTrend.slice(-7);
      const growthRates = recentDays.slice(1).map((day, i) => {
        const prevDay = recentDays[i];
        if (prevDay.total === 0) return 0;
        return ((day.total - prevDay.total) / prevDay.total) * 100;
      });
      avgDailyGrowth = Math.round(growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length);
    }

    // Get active today count
    const todayStr = today.toISOString().split('T')[0];
    const activeToday = await db.select({ count: sql<number>`COUNT(DISTINCT ${aggregatesDaily.userId})` })
      .from(aggregatesDaily)
      .where(and(
        eq(aggregatesDaily.seasonId, seasonId),
        eq(aggregatesDaily.workDate, todayStr)
      ));
    const activeTodayCount = Number(activeToday[0]?.count || 0);

    // Get achieved goal count
    const achievedGoal = await db.select({ count: sql<number>`COUNT(*)` })
      .from(aggregatesSeason)
      .where(and(
        eq(aggregatesSeason.seasonId, seasonId),
        sql`${aggregatesSeason.targetPercent} >= 100`
      ));
    const achievedGoalCount = Number(achievedGoal[0]?.count || 0);

    // Get team comparison (by sotnik)
    const teamData = await db.select({
      sotnikId: roleAssignments.sotnikId,
      sotnikName: users.fullName,
      total: sql<number>`SUM(${aggregatesSeason.total})`,
      target: sql<number>`SUM(${aggregatesSeason.target})`,
    })
      .from(aggregatesSeason)
      .innerJoin(roleAssignments, eq(aggregatesSeason.userId, roleAssignments.userId))
      .leftJoin(users, eq(roleAssignments.sotnikId, users.id))
      .where(and(
        eq(aggregatesSeason.seasonId, seasonId),
        eq(roleAssignments.seasonId, seasonId),
        eq(roleAssignments.role, 'driver'),
        sql`${roleAssignments.sotnikId} IS NOT NULL`
      ))
      .groupBy(roleAssignments.sotnikId, users.fullName)
      .orderBy(desc(sql`SUM(${aggregatesSeason.total})`))
      .limit(10);

    const teamComparison: TeamComparisonData[] = teamData.map((team, index) => ({
      teamName: team.sotnikName || `Команда ${index + 1}`,
      total: Math.round(Number(team.total) || 0),
      target: Math.round(Number(team.target) || 0),
    }));

    // Calculate goal progress (cumulative)
    const goalProgress: GoalProgressData[] = [];
    let cumulative = 0;
    let targetCumulative = 0;
    const dailyTarget = Number(season.dailyTargetHours);

    for (const day of dailyTrend) {
      cumulative += day.total;
      targetCumulative += dailyTarget;
      goalProgress.push({
        date: day.date,
        cumulative: Math.round(cumulative),
        targetCumulative: Math.round(targetCumulative),
      });
    }

    // Calculate performance distribution
    const participants = await db.select({
      targetPercent: aggregatesSeason.targetPercent,
    })
      .from(aggregatesSeason)
      .where(eq(aggregatesSeason.seasonId, seasonId));

    const distribution: { [key: string]: number } = {
      '0-25%': 0,
      '25-50%': 0,
      '50-75%': 0,
      '75-100%': 0,
      '100%+': 0,
    };

    for (const participant of participants) {
      const percent = Number(participant.targetPercent);
      if (percent < 25) distribution['0-25%']++;
      else if (percent < 50) distribution['25-50%']++;
      else if (percent < 75) distribution['50-75%']++;
      else if (percent < 100) distribution['75-100%']++;
      else distribution['100%+']++;
    }

    const performanceDistribution: PerformanceDistributionData[] = Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
    }));

    return {
      avgDailyGrowth,
      activeTodayCount,
      achievedGoalCount,
      daysRemaining,
      dailyTrend,
      teamComparison,
      goalProgress,
      performanceDistribution,
    };
  }
}

export const analyticsService = new AnalyticsService();
