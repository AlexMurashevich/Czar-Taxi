import { storage } from '../storage';
import { telegramBot } from './telegram-bot';
import type { InsertNotification } from '@shared/schema';

export interface NotificationPayload {
  userId: number;
  type: string;
  title: string;
  message: string;
  deliveryMethod?: 'telegram' | 'websocket' | 'both';
}

class NotificationService {
  private wsClients: Set<any> = new Set();

  registerWebSocketClient(client: any) {
    this.wsClients.add(client);
  }

  unregisterWebSocketClient(client: any) {
    this.wsClients.delete(client);
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const deliveryMethod = payload.deliveryMethod || 'both';

    const notification: InsertNotification = {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      deliveryMethod,
      status: 'pending',
    };

    const created = await storage.createNotification(notification);

    const preferences = await storage.getNotificationPreferences(payload.userId);
    const eventPreference = preferences.find(p => p.eventType === payload.type);

    if (!eventPreference || !eventPreference.enabled) {
      await storage.updateNotificationStatus(created.id, 'skipped');
      return;
    }

    let telegramSent = false;
    let websocketSent = false;

    if ((deliveryMethod === 'telegram' || deliveryMethod === 'both') && eventPreference.telegramEnabled) {
      try {
        await telegramBot.sendNotification(payload.userId, `${payload.title}\n\n${payload.message}`);
        telegramSent = true;
      } catch (error) {
        console.error('Failed to send Telegram notification:', error);
      }
    }

    if ((deliveryMethod === 'websocket' || deliveryMethod === 'both') && eventPreference.websocketEnabled) {
      try {
        this.broadcastToWebSocket({
          type: 'notification',
          data: {
            id: created.id,
            userId: payload.userId,
            notificationType: payload.type,
            title: payload.title,
            message: payload.message,
            createdAt: created.createdAt,
          },
        });
        websocketSent = true;
      } catch (error) {
        console.error('Failed to send WebSocket notification:', error);
      }
    }

    const status = (telegramSent || websocketSent) ? 'sent' : 'failed';
    await storage.updateNotificationStatus(created.id, status, new Date());
  }

  async sendBulkNotifications(payloads: NotificationPayload[]): Promise<void> {
    await Promise.all(payloads.map(payload => this.sendNotification(payload)));
  }

  private broadcastToWebSocket(message: any) {
    const messageStr = JSON.stringify(message);
    this.wsClients.forEach(client => {
      try {
        if (client.readyState === 1) {
          client.send(messageStr);
        }
      } catch (error) {
        console.error('Error broadcasting to WebSocket client:', error);
      }
    });
  }

  async notifyRoleChange(userId: number, oldRole: string, newRole: string, seasonName: string): Promise<void> {
    const roleNames: Record<string, string> = {
      tsar: 'Царь',
      sotnik: 'Сотник',
      desyatnik: 'Десятник',
      driver: 'Водитель'
    };

    const title = '🎉 Изменение роли';
    let message = `Ваша роль изменена с "${roleNames[oldRole] || oldRole}" на "${roleNames[newRole] || newRole}" в сезоне "${seasonName}".`;

    if (newRole === 'tsar') {
      message += '\n\n👑 Поздравляем! Вы стали Царём!';
    } else if (newRole === 'sotnik' && oldRole === 'driver') {
      message += '\n\n🎖️ Отличная работа! Вы повышены до Сотника!';
    } else if (newRole === 'desyatnik' && oldRole === 'driver') {
      message += '\n\n⭐ Поздравляем! Вы теперь Десятник!';
    } else if (newRole === 'driver' && (oldRole === 'sotnik' || oldRole === 'desyatnik')) {
      message += '\n\n💪 Продолжайте работать, чтобы вернуться на предыдущий уровень!';
    }

    await this.sendNotification({
      userId,
      type: 'role_change',
      title,
      message,
      deliveryMethod: 'both',
    });
  }

  async notifyGoalAchieved(userId: number, targetPercent: number, total: number, target: number, seasonName: string): Promise<void> {
    const title = '🎯 Цель достигнута!';
    const message = `Поздравляем! Вы достигли ${Math.round(targetPercent)}% от вашей цели в сезоне "${seasonName}".\n\nВыполнено: ${total} часов из ${target} часов.`;

    await this.sendNotification({
      userId,
      type: 'goal_achieved',
      title,
      message,
      deliveryMethod: 'both',
    });
  }

  async notifyRankingMilestone(userId: number, rank: number, role: string, seasonName: string): Promise<void> {
    const roleNames: Record<string, string> = {
      tsar: 'Царь',
      sotnik: 'Сотник',
      desyatnik: 'Десятник',
      driver: 'Водитель'
    };

    let title = '🏆 Достижение в рейтинге';
    let message = '';

    if (rank === 1) {
      title = '🥇 Первое место!';
      message = `Вы заняли 1-е место среди ${roleNames[role] || role} в сезоне "${seasonName}"!`;
    } else if (rank === 2) {
      title = '🥈 Второе место!';
      message = `Вы заняли 2-е место среди ${roleNames[role] || role} в сезоне "${seasonName}"!`;
    } else if (rank === 3) {
      title = '🥉 Третье место!';
      message = `Вы заняли 3-е место среди ${roleNames[role] || role} в сезоне "${seasonName}"!`;
    } else if (rank <= 10) {
      title = '⭐ Топ-10!';
      message = `Вы вошли в топ-10 (место ${rank}) среди ${roleNames[role] || role} в сезоне "${seasonName}"!`;
    } else {
      message = `Ваш рейтинг: ${rank} место среди ${roleNames[role] || role} в сезоне "${seasonName}".`;
    }

    await this.sendNotification({
      userId,
      type: 'ranking_update',
      title,
      message,
      deliveryMethod: 'both',
    });
  }

  async notifyDailySummary(userId: number, dailyHours: number, totalHours: number, targetPercent: number): Promise<void> {
    const title = '📊 Дневная сводка';
    const message = `Сегодня отработано: ${dailyHours} часов\nВсего за сезон: ${totalHours} часов\nПрогресс к цели: ${Math.round(targetPercent)}%`;

    await this.sendNotification({
      userId,
      type: 'daily_summary',
      title,
      message,
      deliveryMethod: 'both',
    });
  }
}

export const notificationService = new NotificationService();
