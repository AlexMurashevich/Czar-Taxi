import * as XLSX from 'xlsx';
import { storage } from '../storage';

class ExportService {
  async exportSeasonSummary(seasonId: number): Promise<Buffer> {
    const season = await storage.getSeason(seasonId);
    if (!season) {
      throw new Error('Season not found');
    }

    const aggregates = await storage.getAggregatesSeasonBySeasonId(seasonId);
    const roleAssignments = await storage.getRoleAssignmentsBySeasonId(seasonId);

    const data = await Promise.all(aggregates.map(async (agg) => {
      const user = await storage.getUser(agg.userId);
      const roleAssignment = roleAssignments.find(ra => ra.userId === agg.userId);
      
      const roleNames: Record<string, string> = {
        tsar: 'Царь',
        sotnik: 'Сотник',
        desyatnik: 'Десятник',
        driver: 'Водитель'
      };

      return {
        'ФИО': user?.fullName || user?.phone || '',
        'Телефон': user?.phone || '',
        'Роль': roleNames[agg.role] || agg.role,
        'Личные часы': Number(agg.personalTotal),
        'Командные часы': Number(agg.teamTotal),
        'Всего часов': Number(agg.total),
        'Целевые часы': Number(agg.target),
        'Процент выполнения': Number(agg.targetPercent).toFixed(2) + '%',
        'Место в группе': agg.rankInGroup || '-',
      };
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Итоги сезона');

    worksheet['!cols'] = [
      { wch: 25 }, // ФИО
      { wch: 15 }, // Телефон
      { wch: 12 }, // Роль
      { wch: 14 }, // Личные часы
      { wch: 16 }, // Командные часы
      { wch: 14 }, // Всего часов
      { wch: 14 }, // Целевые часы
      { wch: 18 }, // Процент выполнения
      { wch: 14 }, // Место в группе
    ];

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportLeaderboard(seasonId: number, role: string): Promise<Buffer> {
    const season = await storage.getSeason(seasonId);
    if (!season) {
      throw new Error('Season not found');
    }

    let leaderboardData;
    let sheetName;

    if (role === 'sotnik') {
      leaderboardData = await storage.getTopCenturions(seasonId, 100);
      sheetName = 'Рейтинг Сотников';
    } else {
      leaderboardData = await storage.getTopDrivers(seasonId, 100);
      sheetName = 'Рейтинг Водителей';
    }

    const data = leaderboardData.map((item, index) => {
      return {
        'Место': index + 1,
        'ФИО': item.user.fullName || item.user.phone,
        'Телефон': item.user.phone,
        'Личные часы': Number(item.personalTotal),
        'Командные часы': Number(item.teamTotal),
        'Всего часов': Number(item.total),
        'Цель': Number(item.target),
        'Процент': Number(item.targetPercent).toFixed(2) + '%',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    worksheet['!cols'] = [
      { wch: 8 },  // Место
      { wch: 25 }, // ФИО
      { wch: 15 }, // Телефон
      { wch: 14 }, // Личные часы
      { wch: 16 }, // Командные часы
      { wch: 14 }, // Всего часов
      { wch: 10 }, // Цель
      { wch: 12 }, // Процент
    ];

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportDailyReport(seasonId: number, date: string): Promise<Buffer> {
    const season = await storage.getSeason(seasonId);
    if (!season) {
      throw new Error('Season not found');
    }

    const dailyAggregates = await storage.getAggregatesDailyBySeasonId(seasonId);
    const dateAggregates = dailyAggregates.filter(agg => agg.workDate === date);

    const data = await Promise.all(dateAggregates.map(async (agg) => {
      const user = await storage.getUser(agg.userId);
      
      const roleNames: Record<string, string> = {
        tsar: 'Царь',
        sotnik: 'Сотник',
        desyatnik: 'Десятник',
        driver: 'Водитель'
      };

      return {
        'ФИО': user?.fullName || user?.phone || '',
        'Телефон': user?.phone || '',
        'Роль': roleNames[agg.role] || agg.role,
        'Личные часы': Number(agg.personalHours),
        'Командные часы': Number(agg.teamHours),
        'Всего часов': Number(agg.totalHours),
      };
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Отчет ${date}`);

    worksheet['!cols'] = [
      { wch: 25 }, // ФИО
      { wch: 15 }, // Телефон
      { wch: 12 }, // Роль
      { wch: 14 }, // Личные часы
      { wch: 16 }, // Командные часы
      { wch: 14 }, // Всего часов
    ];

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportFraudAlerts(): Promise<Buffer> {
    const { antiFraud } = await import('./anti-fraud');
    const alerts = await antiFraud.getActiveAlerts();

    const data = await Promise.all(alerts.map(async (alert) => {
      const user = await storage.getUser(alert.userId);
      
      const severityNames: Record<string, string> = {
        low: 'Низкая',
        medium: 'Средняя',
        high: 'Высокая'
      };

      const typeNames: Record<string, string> = {
        high_hours: 'Высокие часы',
        anomaly_spike: 'Аномальный скачок',
        zero_streak: 'Серия нулей'
      };

      return {
        'ID Алерта': alert.id,
        'ФИО': user?.fullName || user?.phone || '',
        'Телефон': alert.phone,
        'Тип': typeNames[alert.type] || alert.type,
        'Сообщение': alert.message,
        'Критичность': severityNames[alert.severity] || alert.severity,
        'Дата': alert.date,
        'Данные': JSON.stringify(alert.data || {}),
      };
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Алерты мошенничества');

    worksheet['!cols'] = [
      { wch: 25 }, // ID Алерта
      { wch: 25 }, // ФИО
      { wch: 15 }, // Телефон
      { wch: 20 }, // Тип
      { wch: 40 }, // Описание
      { wch: 10 }, // Значение
      { wch: 10 }, // Порог
      { wch: 12 }, // Критичность
      { wch: 12 }, // Дата
    ];

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportUserPerformance(userId: number, seasonId: number): Promise<Buffer> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const season = await storage.getSeason(seasonId);
    if (!season) {
      throw new Error('Season not found');
    }

    const dailyAggregates = await storage.getAggregatesDailyBySeasonId(seasonId);
    const userDaily = dailyAggregates.filter(agg => agg.userId === userId);

    const seasonAggregates = await storage.getAggregatesSeasonBySeasonId(seasonId);
    const userSeason = seasonAggregates.find(agg => agg.userId === userId);

    const dailyData = userDaily.map((agg) => {
      return {
        'Дата': agg.workDate,
        'Личные часы': Number(agg.personalHours),
        'Командные часы': Number(agg.teamHours),
        'Всего часов': Number(agg.totalHours),
      };
    });

    const workbook = XLSX.utils.book_new();
    
    const dailyWorksheet = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(workbook, dailyWorksheet, 'Ежедневные данные');

    dailyWorksheet['!cols'] = [
      { wch: 12 }, // Дата
      { wch: 14 }, // Личные часы
      { wch: 16 }, // Командные часы
      { wch: 14 }, // Всего часов
    ];

    if (userSeason) {
      const summaryData = [{
        'ФИО': user.fullName || user.phone,
        'Телефон': user.phone,
        'Сезон': season.name,
        'Личные часы': Number(userSeason.personalTotal),
        'Командные часы': Number(userSeason.teamTotal),
        'Всего часов': Number(userSeason.total),
        'Целевые часы': Number(userSeason.target),
        'Процент выполнения': Number(userSeason.targetPercent).toFixed(2) + '%',
        'Место в группе': userSeason.rankInGroup || '-',
      }];

      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Итоги сезона');

      summaryWorksheet['!cols'] = [
        { wch: 25 }, // ФИО
        { wch: 15 }, // Телефон
        { wch: 20 }, // Сезон
        { wch: 14 }, // Личные часы
        { wch: 16 }, // Командные часы
        { wch: 14 }, // Всего часов
        { wch: 14 }, // Целевые часы
        { wch: 18 }, // Процент выполнения
        { wch: 14 }, // Место в группе
      ];
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  generateCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

export const exportService = new ExportService();
