import { storage } from '../storage';

interface RoleTransitionResult {
  promotions: Array<{ userId: number; fromRole: string; toRole: string }>;
  demotions: Array<{ userId: number; fromRole: string; toRole: string }>;
  maintained: Array<{ userId: number; role: string }>;
}

class RoleTransitionsService {
  async applySeasonEndTransitions(seasonId: number): Promise<RoleTransitionResult> {
    console.log(`Applying role transitions for season ${seasonId}`);
    
    const assignments = await storage.getRoleAssignmentsBySeasonId(seasonId);
    const seasonAggregates = await storage.getAggregatesSeasonBySeasonId(seasonId);
    
    if (assignments.length === 0) {
      throw new Error('No assignments found for season');
    }

    // Check if this is the first season (all participants are drivers)
    const isFirstSeason = assignments.every(a => a.role === 'driver');
    
    if (isFirstSeason) {
      return await this.applyFirstSeasonTransitions(seasonId, assignments, seasonAggregates);
    } else {
      return await this.applyRegularSeasonTransitions(seasonId, assignments, seasonAggregates);
    }
  }

  private async applyFirstSeasonTransitions(
    seasonId: number, 
    assignments: any[], 
    aggregates: any[]
  ): Promise<RoleTransitionResult> {
    const result: RoleTransitionResult = {
      promotions: [],
      demotions: [],
      maintained: []
    };

    // Sort all participants by their results
    const sortedAggregates = aggregates
      .sort((a, b) => this.compareResults(b, a)) // Descending order
      .slice(0, 1111); // Limit to maximum structure

    const totalParticipants = sortedAggregates.length;
    
    // Calculate ideal distribution
    const tsarCount = 1;
    const centurionCount = Math.min(10, Math.floor(totalParticipants / 100));
    const decurionCount = Math.min(100, Math.floor(totalParticipants / 10));
    
    let position = 0;

    // Assign Tsar (position 1)
    if (position < totalParticipants) {
      const tsarAggregate = sortedAggregates[position];
      const assignment = assignments.find(a => a.userId === tsarAggregate.userId);
      if (assignment) {
        await storage.updateRoleAssignment(assignment.id, { role: 'tsar' });
        result.promotions.push({ 
          userId: tsarAggregate.userId, 
          fromRole: 'driver', 
          toRole: 'tsar' 
        });
      }
      position++;
    }

    // Assign Centurions (positions 2 to 1+centurionCount)
    for (let i = 0; i < centurionCount && position < totalParticipants; i++) {
      const centurionAggregate = sortedAggregates[position];
      const assignment = assignments.find(a => a.userId === centurionAggregate.userId);
      if (assignment) {
        await storage.updateRoleAssignment(assignment.id, { role: 'sotnik' });
        result.promotions.push({ 
          userId: centurionAggregate.userId, 
          fromRole: 'driver', 
          toRole: 'sotnik' 
        });
      }
      position++;
    }

    // Assign Decurions
    for (let i = 0; i < decurionCount && position < totalParticipants; i++) {
      const decurionAggregate = sortedAggregates[position];
      const assignment = assignments.find(a => a.userId === decurionAggregate.userId);
      if (assignment) {
        await storage.updateRoleAssignment(assignment.id, { role: 'desyatnik' });
        result.promotions.push({ 
          userId: decurionAggregate.userId, 
          fromRole: 'driver', 
          toRole: 'desyatnik' 
        });
      }
      position++;
    }

    // Remaining participants stay as drivers
    while (position < totalParticipants) {
      const driverAggregate = sortedAggregates[position];
      result.maintained.push({ 
        userId: driverAggregate.userId, 
        role: 'driver' 
      });
      position++;
    }

    return result;
  }

  private async applyRegularSeasonTransitions(
    seasonId: number, 
    assignments: any[], 
    aggregates: any[]
  ): Promise<RoleTransitionResult> {
    const result: RoleTransitionResult = {
      promotions: [],
      demotions: [],
      maintained: []
    };

    const aggregateMap = new Map(aggregates.map(agg => [agg.userId, agg]));
    
    // Get current role holders
    const currentTsar = assignments.find(a => a.role === 'tsar');
    const currentCenturions = assignments.filter(a => a.role === 'sotnik');
    const currentDecurions = assignments.filter(a => a.role === 'desyatnik');
    const currentDrivers = assignments.filter(a => a.role === 'driver');

    // Sort centurions by their results
    const centurionResults = currentCenturions
      .map(c => ({ assignment: c, aggregate: aggregateMap.get(c.userId) }))
      .filter(c => c.aggregate)
      .sort((a, b) => this.compareResults(b.aggregate, a.aggregate));

    // 1. Best centurion becomes new Tsar
    let newTsar = null;
    if (centurionResults.length > 0) {
      newTsar = centurionResults[0].assignment;
      await storage.updateRoleAssignment(newTsar.id, { role: 'tsar' });
      result.promotions.push({
        userId: newTsar.userId,
        fromRole: 'sotnik',
        toRole: 'tsar'
      });
    }

    // 2. Current Tsar becomes centurion
    if (currentTsar) {
      await storage.updateRoleAssignment(currentTsar.id, { role: 'sotnik' });
      result.demotions.push({
        userId: currentTsar.userId,
        fromRole: 'tsar',
        toRole: 'sotnik'
      });
    }

    // 3. Handle centurion positions
    const remainingCenturions = centurionResults.slice(1); // Exclude the new tsar
    const targetCenturionCount = Math.min(10, currentCenturions.length);
    
    // Centurions in positions 2-5 maintain their role
    for (let i = 0; i < Math.min(4, remainingCenturions.length); i++) {
      result.maintained.push({
        userId: remainingCenturions[i].assignment.userId,
        role: 'sotnik'
      });
    }

    // Centurions in positions 6-10 are demoted to decurions
    for (let i = 4; i < remainingCenturions.length; i++) {
      const centurion = remainingCenturions[i].assignment;
      await storage.updateRoleAssignment(centurion.id, { role: 'desyatnik' });
      result.demotions.push({
        userId: centurion.userId,
        fromRole: 'sotnik',
        toRole: 'desyatnik'
      });
    }

    // 4. Promote top decurions to fill centurion positions
    const firstPlaceDecurions = await this.getFirstPlaceDecurions(assignments, aggregateMap);
    const promotableToCenturion = Math.min(5, firstPlaceDecurions.length);
    
    for (let i = 0; i < promotableToCenturion; i++) {
      const decurion = firstPlaceDecurions[i];
      await storage.updateRoleAssignment(decurion.assignment.id, { role: 'sotnik' });
      result.promotions.push({
        userId: decurion.assignment.userId,
        fromRole: 'desyatnik',
        toRole: 'sotnik'
      });
    }

    // 5. Handle decurion transitions
    await this.handleDecurionTransitions(assignments, aggregateMap, result);

    // 6. Handle driver promotions
    await this.handleDriverPromotions(assignments, aggregateMap, result);

    return result;
  }

  private async getFirstPlaceDecurions(assignments: any[], aggregateMap: Map<number, any>) {
    const centurions = assignments.filter(a => a.role === 'sotnik');
    const firstPlaceDecurions = [];

    for (const centurion of centurions) {
      const decurionsInGroup = assignments.filter(a => 
        a.role === 'desyatnik' && a.sotnikId === centurion.userId
      );
      
      if (decurionsInGroup.length > 0) {
        const sortedDecurions = decurionsInGroup
          .map(d => ({ assignment: d, aggregate: aggregateMap.get(d.userId) }))
          .filter(d => d.aggregate)
          .sort((a, b) => this.compareResults(b.aggregate, a.aggregate));
        
        if (sortedDecurions.length > 0) {
          firstPlaceDecurions.push(sortedDecurions[0]);
        }
      }
    }

    return firstPlaceDecurions.sort((a, b) => 
      this.compareResults(b.aggregate, a.aggregate)
    );
  }

  private async handleDecurionTransitions(
    assignments: any[], 
    aggregateMap: Map<number, any>, 
    result: RoleTransitionResult
  ) {
    const currentDecurions = assignments.filter(a => a.role === 'desyatnik');
    const firstPlaceDecurions = await this.getFirstPlaceDecurions(assignments, aggregateMap);
    
    // Decurions who are NOT first place in their group are demoted to drivers
    for (const decurion of currentDecurions) {
      const isFirstPlace = firstPlaceDecurions.some(fp => 
        fp.assignment.userId === decurion.userId
      );
      
      if (!isFirstPlace) {
        await storage.updateRoleAssignment(decurion.id, { role: 'driver' });
        result.demotions.push({
          userId: decurion.userId,
          fromRole: 'desyatnik',
          toRole: 'driver'
        });
      }
    }
  }

  private async handleDriverPromotions(
    assignments: any[], 
    aggregateMap: Map<number, any>, 
    result: RoleTransitionResult
  ) {
    const firstPlaceDrivers = await this.getFirstPlaceDrivers(assignments, aggregateMap);
    const promotableToDecurion = Math.min(90, firstPlaceDrivers.length);
    
    for (let i = 0; i < promotableToDecurion; i++) {
      const driver = firstPlaceDrivers[i];
      await storage.updateRoleAssignment(driver.assignment.id, { role: 'desyatnik' });
      result.promotions.push({
        userId: driver.assignment.userId,
        fromRole: 'driver',
        toRole: 'desyatnik'
      });
    }
  }

  private async getFirstPlaceDrivers(assignments: any[], aggregateMap: Map<number, any>) {
    const decurions = assignments.filter(a => a.role === 'desyatnik');
    const firstPlaceDrivers = [];

    for (const decurion of decurions) {
      const driversInGroup = assignments.filter(a => 
        a.role === 'driver' && a.desyatnikId === decurion.userId
      );
      
      if (driversInGroup.length > 0) {
        const sortedDrivers = driversInGroup
          .map(d => ({ assignment: d, aggregate: aggregateMap.get(d.userId) }))
          .filter(d => d.aggregate)
          .sort((a, b) => this.compareResults(b.aggregate, a.aggregate));
        
        if (sortedDrivers.length > 0) {
          firstPlaceDrivers.push(sortedDrivers[0]);
        }
      }
    }

    return firstPlaceDrivers.sort((a, b) => 
      this.compareResults(b.aggregate, a.aggregate)
    );
  }

  async redistributeGroups(seasonId: number) {
    console.log(`Redistributing groups for season ${seasonId}`);
    
    const assignments = await storage.getRoleAssignmentsBySeasonId(seasonId);
    
    const centurions = assignments.filter(a => a.role === 'sotnik');
    const decurions = assignments.filter(a => a.role === 'desyatnik');
    const drivers = assignments.filter(a => a.role === 'driver');

    // Shuffle and redistribute decurions among centurions
    const shuffledDecurions = this.shuffle([...decurions]);
    const decurionsPerCenturion = Math.floor(shuffledDecurions.length / centurions.length);
    const extraDecurions = shuffledDecurions.length % centurions.length;

    let decurionIndex = 0;
    for (let i = 0; i < centurions.length; i++) {
      const centurion = centurions[i];
      const decurionCount = decurionsPerCenturion + (i < extraDecurions ? 1 : 0);
      
      for (let j = 0; j < decurionCount && decurionIndex < shuffledDecurions.length; j++) {
        const decurion = shuffledDecurions[decurionIndex];
        await storage.updateRoleAssignment(decurion.id, { 
          sotnikId: centurion.userId,
          groupIndex: j
        });
        decurionIndex++;
      }
    }

    // Shuffle and redistribute drivers among decurions
    const shuffledDrivers = this.shuffle([...drivers]);
    const driversPerDecurion = Math.floor(shuffledDrivers.length / decurions.length);
    const extraDrivers = shuffledDrivers.length % decurions.length;

    let driverIndex = 0;
    for (let i = 0; i < decurions.length; i++) {
      const decurion = decurions[i];
      const driverCount = driversPerDecurion + (i < extraDrivers ? 1 : 0);
      
      for (let j = 0; j < driverCount && driverIndex < shuffledDrivers.length; j++) {
        const driver = shuffledDrivers[driverIndex];
        await storage.updateRoleAssignment(driver.id, { 
          desyatnikId: decurion.userId,
          groupIndex: j
        });
        driverIndex++;
      }
    }

    console.log(`Completed group redistribution for season ${seasonId}`);
  }

  private compareResults(a: any, b: any): number {
    // Compare by total hours first
    if (Number(a.total) !== Number(b.total)) {
      return Number(a.total) - Number(b.total);
    }
    
    // Then by personal hours
    if (Number(a.personalTotal) !== Number(b.personalTotal)) {
      return Number(a.personalTotal) - Number(b.personalTotal);
    }
    
    // Then by target percentage (who reached goal earlier)
    return Number(a.targetPercent) - Number(b.targetPercent);
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const roleTransitions = new RoleTransitionsService();
