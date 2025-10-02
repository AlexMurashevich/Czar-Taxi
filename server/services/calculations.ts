import { storage } from '../storage';
import { eq, and, sum } from 'drizzle-orm';

interface HierarchyStats {
  userId: number;
  role: string;
  personalTotal: number;
  teamTotal: number;
  total: number;
  target: number;
  targetPercent: number;
}

class CalculationsService {
  async recalculateAggregates(seasonId: number) {
    console.log(`Starting aggregate recalculation for season ${seasonId}`);
    
    const season = await storage.getSeason(seasonId);
    if (!season) {
      throw new Error('Season not found');
    }

    // Get all role assignments for the season
    const assignments = await storage.getRoleAssignmentsBySeasonId(seasonId);
    
    // Recalculate daily aggregates first
    await this.recalculateDailyAggregates(seasonId, assignments);
    
    // Then recalculate season aggregates
    await this.recalculateSeasonAggregates(seasonId, assignments, season);
    
    // Update rankings
    await this.updateRankings(seasonId, assignments);
    
    console.log(`Completed aggregate recalculation for season ${seasonId}`);
  }

  private async recalculateDailyAggregates(seasonId: number, assignments: any[]) {
    const season = await storage.getSeason(seasonId);
    if (!season) return;

    // Get all hours data for the season date range
    const hoursData = await storage.getHoursRawByDateRange(season.startDate, season.endDate);
    
    // Group hours by date
    const hoursByDate = new Map<string, Map<number, number>>();
    
    for (const hours of hoursData) {
      const dateKey = hours.workDate;
      if (!hoursByDate.has(dateKey)) {
        hoursByDate.set(dateKey, new Map());
      }
      hoursByDate.get(dateKey)!.set(hours.userId, Number(hours.hours));
    }

    // Process each date
    for (const [workDate, dailyHours] of hoursByDate) {
      await this.calculateDailyAggregatesForDate(seasonId, workDate, dailyHours, assignments);
    }
  }

  private async calculateDailyAggregatesForDate(
    seasonId: number, 
    workDate: string, 
    dailyHours: Map<number, number>, 
    assignments: any[]
  ) {
    const assignmentMap = new Map(assignments.map(a => [a.userId, a]));

    // Calculate for each user
    for (const assignment of assignments) {
      const userId = assignment.userId;
      const role = assignment.role;
      
      let personalHours = dailyHours.get(userId) || 0;
      let teamHours = 0;

      // Calculate team hours based on role
      if (role === 'tsar') {
        // Tsar gets all centurions' totals
        teamHours = this.calculateTsarTeamHours(assignments, dailyHours, assignmentMap);
      } else if (role === 'sotnik') {
        // Centurion gets all their decurions' totals
        teamHours = this.calculateCenturionTeamHours(userId, assignments, dailyHours, assignmentMap);
      } else if (role === 'desyatnik') {
        // Decurion gets all their drivers' hours
        teamHours = this.calculateDecurionTeamHours(userId, assignments, dailyHours);
      }

      const totalHours = personalHours + teamHours;

      // Upsert daily aggregate
      await storage.createAggregateDaily({
        userId,
        seasonId,
        workDate,
        role,
        personalHours: personalHours.toString(),
        teamHours: teamHours.toString(),
        totalHours: totalHours.toString()
      });
    }
  }

  private calculateTsarTeamHours(
    assignments: any[], 
    dailyHours: Map<number, number>, 
    assignmentMap: Map<number, any>
  ): number {
    let teamTotal = 0;
    
    const centurions = assignments.filter(a => a.role === 'sotnik');
    for (const centurion of centurions) {
      const centurionPersonal = dailyHours.get(centurion.userId) || 0;
      const centurionTeam = this.calculateCenturionTeamHours(centurion.userId, assignments, dailyHours, assignmentMap);
      teamTotal += centurionPersonal + centurionTeam;
    }
    
    return teamTotal;
  }

  private calculateCenturionTeamHours(
    centurionId: number, 
    assignments: any[], 
    dailyHours: Map<number, number>, 
    assignmentMap: Map<number, any>
  ): number {
    let teamTotal = 0;
    
    const decurions = assignments.filter(a => a.role === 'desyatnik' && a.sotnikId === centurionId);
    for (const decurion of decurions) {
      const decurionPersonal = dailyHours.get(decurion.userId) || 0;
      const decurionTeam = this.calculateDecurionTeamHours(decurion.userId, assignments, dailyHours);
      teamTotal += decurionPersonal + decurionTeam;
    }
    
    return teamTotal;
  }

  private calculateDecurionTeamHours(
    decurionId: number, 
    assignments: any[], 
    dailyHours: Map<number, number>
  ): number {
    let teamTotal = 0;
    
    const drivers = assignments.filter(a => a.role === 'driver' && a.desyatnikId === decurionId);
    for (const driver of drivers) {
      teamTotal += dailyHours.get(driver.userId) || 0;
    }
    
    return teamTotal;
  }

  private async recalculateSeasonAggregates(seasonId: number, assignments: any[], season: any) {
    // Get all daily aggregates for the season
    const dailyAggregates = await storage.getAggregatesDailyBySeasonId(seasonId);
    
    // Group by user
    const aggregatesByUser = new Map<number, any[]>();
    for (const agg of dailyAggregates) {
      if (!aggregatesByUser.has(agg.userId)) {
        aggregatesByUser.set(agg.userId, []);
      }
      aggregatesByUser.get(agg.userId)!.push(agg);
    }

    // Calculate season totals for each user
    for (const assignment of assignments) {
      const userId = assignment.userId;
      const userAggregates = aggregatesByUser.get(userId) || [];
      
      const personalTotal = userAggregates.reduce((sum, agg) => sum + Number(agg.personalHours), 0);
      const teamTotal = userAggregates.reduce((sum, agg) => sum + Number(agg.teamHours), 0);
      const total = personalTotal + teamTotal;
      
      // Calculate target based on role and actual structure
      const target = await this.calculateUserTarget(assignment, assignments, season);
      const targetPercent = target > 0 ? (total / target) * 100 : 0;

      // Upsert season aggregate
      await storage.createAggregateSeason({
        userId,
        seasonId,
        role: assignment.role,
        personalTotal: personalTotal.toString(),
        teamTotal: teamTotal.toString(),
        total: total.toString(),
        target: target.toString(),
        targetPercent: targetPercent.toString(),
        rankInGroup: null,
        sotnikRank: null
      });
    }
  }

  private async calculateUserTarget(assignment: any, assignments: any[], season: any): Promise<number> {
    const dailyTarget = Number(season.dailyTargetHours);
    const daysCount = Number(season.daysCount);
    const unitTarget = dailyTarget * daysCount;

    switch (assignment.role) {
      case 'driver':
        return unitTarget;
        
      case 'desyatnik': {
        const driversCount = assignments.filter(a => 
          a.role === 'driver' && a.desyatnikId === assignment.userId
        ).length;
        return unitTarget * (1 + driversCount);
      }
      
      case 'sotnik': {
        let totalUnits = 1; // The centurion themselves
        
        const decurions = assignments.filter(a => 
          a.role === 'desyatnik' && a.sotnikId === assignment.userId
        );
        
        for (const decurion of decurions) {
          const driversCount = assignments.filter(a => 
            a.role === 'driver' && a.desyatnikId === decurion.userId
          ).length;
          totalUnits += 1 + driversCount; // Decurion + their drivers
        }
        
        return unitTarget * totalUnits;
      }
      
      case 'tsar': {
        let totalUnits = 1; // The tsar themselves
        
        const centurions = assignments.filter(a => a.role === 'sotnik');
        for (const centurion of centurions) {
          totalUnits += 1; // The centurion
          
          const decurions = assignments.filter(a => 
            a.role === 'desyatnik' && a.sotnikId === centurion.userId
          );
          
          for (const decurion of decurions) {
            const driversCount = assignments.filter(a => 
              a.role === 'driver' && a.desyatnikId === decurion.userId
            ).length;
            totalUnits += 1 + driversCount; // Decurion + their drivers
          }
        }
        
        return unitTarget * totalUnits;
      }
      
      default:
        return unitTarget;
    }
  }

  private async updateRankings(seasonId: number, assignments: any[]) {
    const seasonAggregates = await storage.getAggregatesSeasonBySeasonId(seasonId);
    const aggregateMap = new Map(seasonAggregates.map(agg => [agg.userId, agg]));

    // Update centurion rankings (global ranking among all centurions)
    const centurions = assignments.filter(a => a.role === 'sotnik');
    const centurionStats = centurions
      .map(c => aggregateMap.get(c.userId))
      .filter(Boolean)
      .sort((a, b) => Number(b!.total) - Number(a!.total));

    for (let i = 0; i < centurionStats.length; i++) {
      const stat = centurionStats[i];
      if (stat) {
        await storage.updateAggregateSeason(stat.id, { sotnikRank: i + 1 });
      }
    }

    // Update rankings within groups
    await this.updateDriverRankingsInDecurionGroups(seasonId, assignments, aggregateMap);
    await this.updateDecurionRankingsInCenturionGroups(seasonId, assignments, aggregateMap);
  }

  private async updateDriverRankingsInDecurionGroups(
    seasonId: number, 
    assignments: any[], 
    aggregateMap: Map<number, any>
  ) {
    const decurions = assignments.filter(a => a.role === 'desyatnik');
    
    for (const decurion of decurions) {
      const drivers = assignments.filter(a => 
        a.role === 'driver' && a.desyatnikId === decurion.userId
      );
      
      const driverStats = drivers
        .map(d => aggregateMap.get(d.userId))
        .filter(Boolean)
        .sort((a, b) => {
          // Sort by total hours, then by personal hours, then by target percentage reached earlier
          if (Number(b!.total) !== Number(a!.total)) {
            return Number(b!.total) - Number(a!.total);
          }
          if (Number(b!.personalTotal) !== Number(a!.personalTotal)) {
            return Number(b!.personalTotal) - Number(a!.personalTotal);
          }
          return Number(b!.targetPercent) - Number(a!.targetPercent);
        });

      for (let i = 0; i < driverStats.length; i++) {
        const stat = driverStats[i];
        if (stat) {
          await storage.updateAggregateSeason(stat.id, { rankInGroup: i + 1 });
        }
      }
    }
  }

  private async updateDecurionRankingsInCenturionGroups(
    seasonId: number, 
    assignments: any[], 
    aggregateMap: Map<number, any>
  ) {
    const centurions = assignments.filter(a => a.role === 'sotnik');
    
    for (const centurion of centurions) {
      const decurions = assignments.filter(a => 
        a.role === 'desyatnik' && a.sotnikId === centurion.userId
      );
      
      const decurionStats = decurions
        .map(d => aggregateMap.get(d.userId))
        .filter(Boolean)
        .sort((a, b) => {
          if (Number(b!.total) !== Number(a!.total)) {
            return Number(b!.total) - Number(a!.total);
          }
          if (Number(b!.personalTotal) !== Number(a!.personalTotal)) {
            return Number(b!.personalTotal) - Number(a!.personalTotal);
          }
          return Number(b!.targetPercent) - Number(a!.targetPercent);
        });

      for (let i = 0; i < decurionStats.length; i++) {
        const stat = decurionStats[i];
        if (stat) {
          await storage.updateAggregateSeason(stat.id, { rankInGroup: i + 1 });
        }
      }
    }
  }
}

export const calculations = new CalculationsService();
