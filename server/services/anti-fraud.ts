import { storage } from '../storage';

interface FraudAlert {
  id: string;
  userId: number;
  phone: string;
  type: 'high_hours' | 'anomaly_spike' | 'zero_streak';
  message: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  data: any;
}

class AntiFraudService {
  private dailyHoursThreshold = 16;
  private anomalyMultiplier = 4.7; // 470% above median
  private zeroStreakThreshold = 7;

  async getActiveAlerts(): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];
    
    const activeSeason = await storage.getActiveSeason();
    if (!activeSeason) return alerts;

    // Check for high daily hours
    await this.checkHighDailyHours(alerts, activeSeason);
    
    // Check for anomaly spikes
    await this.checkAnomalySpikes(alerts, activeSeason);
    
    // Check for zero streaks
    await this.checkZeroStreaks(alerts, activeSeason);

    return alerts;
  }

  private async checkHighDailyHours(alerts: FraudAlert[], season: any) {
    const recentDays = 7; // Check last 7 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const hoursData = await storage.getHoursRawByDateRange(startDate, endDate);
    
    for (const hours of hoursData) {
      if (Number(hours.hours) > this.dailyHoursThreshold) {
        const user = await storage.getUser(hours.userId);
        if (user) {
          alerts.push({
            id: `high_hours_${hours.userId}_${hours.workDate}`,
            userId: hours.userId,
            phone: user.phone,
            type: 'high_hours',
            message: `${Number(hours.hours)} часов за ${hours.workDate} (превышение порога ${this.dailyHoursThreshold} ч)`,
            date: hours.workDate,
            severity: 'high',
            data: { hours: Number(hours.hours), date: hours.workDate }
          });
        }
      }
    }
  }

  private async checkAnomalySpikes(alerts: FraudAlert[], season: any) {
    const assignments = await storage.getRoleAssignmentsBySeasonId(season.id);
    const recentDays = 7;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const hoursData = await storage.getHoursRawByDateRange(startDate, endDate);
    
    // Group by decurion groups to calculate medians
    const decurionGroups = new Map<number, number[]>();
    
    for (const assignment of assignments) {
      if (assignment.role === 'driver' && assignment.desyatnikId) {
        if (!decurionGroups.has(assignment.desyatnikId)) {
          decurionGroups.set(assignment.desyatnikId, []);
        }
        decurionGroups.get(assignment.desyatnikId)!.push(assignment.userId);
      }
    }

    // Calculate medians and check for spikes
    for (const [decurionId, driverIds] of decurionGroups) {
      const groupHours = hoursData.filter(h => driverIds.includes(h.userId));
      
      if (groupHours.length === 0) continue;
      
      const hourValues = groupHours.map(h => Number(h.hours)).sort((a, b) => a - b);
      const median = hourValues[Math.floor(hourValues.length / 2)] || 0;
      
      if (median === 0) continue;
      
      for (const hours of groupHours) {
        const ratio = Number(hours.hours) / median;
        if (ratio > this.anomalyMultiplier) {
          const user = await storage.getUser(hours.userId);
          if (user) {
            alerts.push({
              id: `anomaly_${hours.userId}_${hours.workDate}`,
              userId: hours.userId,
              phone: user.phone,
              type: 'anomaly_spike',
              message: `Всплеск +${Math.round((ratio - 1) * 100)}% от медианы группы`,
              date: hours.workDate,
              severity: 'medium',
              data: { 
                hours: Number(hours.hours), 
                median, 
                ratio: Math.round(ratio * 100) 
              }
            });
          }
        }
      }
    }
  }

  private async checkZeroStreaks(alerts: FraudAlert[], season: any) {
    const assignments = await storage.getRoleAssignmentsBySeasonId(season.id);
    const checkDays = 14; // Check last 14 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - checkDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const hoursData = await storage.getHoursRawByDateRange(startDate, endDate);
    const hoursMap = new Map<string, number>();
    
    // Create a map of user-date to hours
    for (const hours of hoursData) {
      hoursMap.set(`${hours.userId}_${hours.workDate}`, Number(hours.hours));
    }

    // Check each user for zero streaks
    for (const assignment of assignments) {
      const userId = assignment.userId;
      let consecutiveZeros = 0;
      let maxConsecutiveZeros = 0;
      
      // Check each day in the period
      for (let i = 0; i < checkDays; i++) {
        const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        
        const dayHours = hoursMap.get(`${userId}_${checkDate}`) || 0;
        
        if (dayHours === 0) {
          consecutiveZeros++;
          maxConsecutiveZeros = Math.max(maxConsecutiveZeros, consecutiveZeros);
        } else {
          consecutiveZeros = 0;
        }
      }
      
      if (maxConsecutiveZeros >= this.zeroStreakThreshold) {
        const user = await storage.getUser(userId);
        if (user) {
          alerts.push({
            id: `zero_streak_${userId}_${endDate}`,
            userId,
            phone: user.phone,
            type: 'zero_streak',
            message: `Нулевые показатели ${maxConsecutiveZeros} дней подряд`,
            date: endDate,
            severity: 'low',
            data: { consecutiveDays: maxConsecutiveZeros }
          });
        }
      }
    }
  }

  async reportAnomaly(userId: number, type: string, data: any) {
    await storage.createAuditLog({
      actorId: null,
      action: 'FRAUD_ALERT',
      entityType: 'user',
      entityId: userId,
      payloadJson: JSON.stringify({ type, data })
    });
  }
}

export const antiFraud = new AntiFraudService();
