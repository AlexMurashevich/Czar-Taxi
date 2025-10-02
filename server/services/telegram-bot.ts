import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';

class TelegramBotService {
  private bot: TelegramBot | null = null;
  private enabled: boolean = false;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN not configured - Telegram bot will be disabled');
      return;
    }
    
    this.bot = new TelegramBot(token);
    this.enabled = true;
  }

  async handleUpdate(update: any) {
    if (!this.enabled || !this.bot) return;
    if (update.message) {
      await this.handleMessage(update.message);
    }
  }

  private async handleMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
      await this.handleStartCommand(chatId, message.from);
    } else if (text === '/mystats') {
      await this.handleMyStatsCommand(chatId, message.from);
    } else if (text === '/team') {
      await this.handleTeamCommand(chatId, message.from);
    } else if (text === '/leaderboard') {
      await this.handleLeaderboardCommand(chatId, message.from);
    } else if (text === '/goal') {
      await this.handleGoalCommand(chatId, message.from);
    } else if (text === '/help') {
      await this.handleHelpCommand(chatId);
    } else if (message.contact) {
      await this.handleContactShared(chatId, message.from, message.contact);
    }
  }

  private async handleStartCommand(chatId: number, from: any) {
    if (!this.bot) return;
    
    const welcomeText = `
🚕 Добро пожаловать в программу "Царь Такси"!

Для участия в программе мне нужен ваш номер телефона. 
Пожалуйста, нажмите кнопку ниже, чтобы поделиться контактом.
    `;

    const keyboard = {
      reply_markup: {
        keyboard: [[{
          text: '📱 Поделиться номером телефона',
          request_contact: true
        }]],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    };

    await this.bot.sendMessage(chatId, welcomeText, keyboard);
  }

  private async handleContactShared(chatId: number, from: any, contact: any) {
    if (!this.bot) return;
    
    try {
      const phone = this.normalizePhone(contact.phone_number);
      let user = await storage.getUserByPhone(phone);

      if (!user) {
        // Check if user is in waitlist
        const waitlist = await storage.getWaitlist();
        const waitlistEntry = waitlist.find(w => w.phone === phone);

        if (!waitlistEntry) {
          await storage.addToWaitlist({
            phone,
            fullName: `${from.first_name || ''} ${from.last_name || ''}`.trim(),
            status: 'new'
          });

          await this.bot.sendMessage(chatId, `
✅ Ваша заявка принята!

Номер: ${phone}
Имя: ${from.first_name || ''} ${from.last_name || ''}

Вы будете добавлены в программу со следующего сезона.
          `);
          return;
        }

        await this.bot.sendMessage(chatId, `
⏳ Ваша заявка уже в обработке.

Вы будете уведомлены о принятии в программу.
        `);
        return;
      }

      // Update Telegram user ID
      await storage.updateUser(user.id, { tgUserId: from.id });

      // Get current role and stats
      const activeSeason = await storage.getActiveSeason();
      if (!activeSeason) {
        await this.bot.sendMessage(chatId, '⚠️ В данный момент нет активного сезона.');
        return;
      }

      const roleAssignment = await storage.getRoleAssignment(user.id, activeSeason.id);
      if (!roleAssignment) {
        await this.bot.sendMessage(chatId, '⚠️ Вы не участвуете в текущем сезоне.');
        return;
      }

      const aggregates = await storage.getAggregatesSeasonBySeasonId(activeSeason.id);
      const userStats = aggregates.find(a => a.userId === user.id);

      const roleNames: Record<string, string> = {
        tsar: 'Царь',
        sotnik: 'Сотник',
        desyatnik: 'Десятник',
        driver: 'Водитель'
      };

      const statsText = userStats ? `
📊 Прогресс: ${userStats.total} ч из ${userStats.target} ч (${Math.round(Number(userStats.targetPercent))}%)
      ` : '';

      await this.bot.sendMessage(chatId, `
✅ Добро пожаловать!

👤 ${user.fullName || 'Участник'}
📱 ${phone}
👑 Роль: ${roleNames[roleAssignment.role] || roleAssignment.role}
📅 Сезон: ${activeSeason.name}${statsText}

Используйте команды для получения информации:
/mystats - моя статистика
/team - моя команда
/leaderboard - общий рейтинг
/goal - прогресс к цели
/help - справка
      `, {
        reply_markup: {
          keyboard: [
            [{ text: '📊 Моя статистика' }, { text: '👥 Моя команда' }],
            [{ text: '🏆 Рейтинг' }, { text: '🎯 Цель' }],
            [{ text: '❓ Помощь' }]
          ],
          resize_keyboard: true
        }
      });

    } catch (error) {
      console.error('Error handling contact:', error);
      await this.bot.sendMessage(chatId, '❌ Произошла ошибка при регистрации. Попробуйте позже.');
    }
  }

  private async handleMyStatsCommand(chatId: number, from: any) {
    if (!this.bot) return;
    
    try {
      const user = await this.getUserByTelegramId(from.id);
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ Пользователь не найден. Используйте /start для регистрации.');
        return;
      }

      const activeSeason = await storage.getActiveSeason();
      if (!activeSeason) {
        await this.bot.sendMessage(chatId, '⚠️ Нет активного сезона.');
        return;
      }

      const roleAssignment = await storage.getRoleAssignment(user.id, activeSeason.id);
      const aggregates = await storage.getAggregatesSeasonBySeasonId(activeSeason.id);
      const userStats = aggregates.find(a => a.userId === user.id);

      if (!userStats) {
        await this.bot.sendMessage(chatId, '⚠️ Статистика не найдена.');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const dailyAggregates = await storage.getAggregatesDailyBySeasonId(activeSeason.id);
      const todayStats = dailyAggregates.find(a => a.userId === user.id && a.workDate === today);

      let statsText = `
📊 Ваша статистика

🗓️ Сегодня: ${todayStats ? Number(todayStats.personalHours) : 0} ч
`;

      if (roleAssignment?.role !== 'driver') {
        statsText += `
👤 Личные часы: ${Number(userStats.personalTotal)} ч
👥 Командные часы: ${Number(userStats.teamTotal)} ч
`;
      }

      statsText += `
📈 Итого за сезон: ${Number(userStats.total)} ч
🎯 Цель сезона: ${Number(userStats.target)} ч
📊 Выполнение: ${Math.round(Number(userStats.targetPercent))}%
`;

      if (userStats.rankInGroup) {
        statsText += `\n🏆 Место в группе: ${userStats.rankInGroup}`;
      }

      await this.bot.sendMessage(chatId, statsText);

    } catch (error) {
      console.error('Error handling mystats:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка получения статистики.');
    }
  }

  private async handleTeamCommand(chatId: number, from: any) {
    if (!this.bot) return;
    await this.bot.sendMessage(chatId, '👥 Команда: функция в разработке');
  }

  private async handleLeaderboardCommand(chatId: number, from: any) {
    if (!this.bot) return;
    
    try {
      const activeSeason = await storage.getActiveSeason();
      if (!activeSeason) {
        await this.bot.sendMessage(chatId, '⚠️ Нет активного сезона.');
        return;
      }

      const topCenturions = await storage.getTopCenturions(activeSeason.id, 5);
      const topDrivers = await storage.getTopDrivers(activeSeason.id, 5);

      let leaderboardText = '🏆 Топ рейтинги\n\n';
      
      leaderboardText += '👑 Топ Сотников:\n';
      topCenturions.forEach((centurion, index) => {
        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        leaderboardText += `${emoji} ${centurion.user.fullName || centurion.user.phone} - ${Number(centurion.total)} ч (${Math.round(Number(centurion.targetPercent))}%)\n`;
      });

      leaderboardText += '\n🚗 Топ Водителей:\n';
      topDrivers.forEach((driver, index) => {
        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        leaderboardText += `${emoji} ${driver.user.fullName || driver.user.phone} - ${Number(driver.personalTotal)} ч (${Math.round(Number(driver.targetPercent))}%)\n`;
      });

      await this.bot.sendMessage(chatId, leaderboardText);

    } catch (error) {
      console.error('Error handling leaderboard:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка получения рейтинга.');
    }
  }

  private async handleGoalCommand(chatId: number, from: any) {
    if (!this.bot) return;
    
    try {
      const user = await this.getUserByTelegramId(from.id);
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ Пользователь не найден.');
        return;
      }

      const activeSeason = await storage.getActiveSeason();
      if (!activeSeason) {
        await this.bot.sendMessage(chatId, '⚠️ Нет активного сезона.');
        return;
      }

      const aggregates = await storage.getAggregatesSeasonBySeasonId(activeSeason.id);
      const userStats = aggregates.find(a => a.userId === user.id);

      if (!userStats) {
        await this.bot.sendMessage(chatId, '⚠️ Статистика не найдена.');
        return;
      }

      const progress = Number(userStats.targetPercent);
      const remaining = Number(userStats.target) - Number(userStats.total);
      const daysLeft = Math.max(0, Math.ceil((new Date(activeSeason.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

      const goalText = `
🎯 Прогресс к цели

📊 Выполнено: ${Number(userStats.total)} из ${Number(userStats.target)} ч
📈 Прогресс: ${Math.round(progress)}%
⏰ Осталось: ${Math.max(0, remaining)} ч
📅 Дней до конца: ${daysLeft}

${progress >= 100 ? '🎉 Цель достигнута!' : `💪 Нужно в среднем ${daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0} ч/день`}
      `;

      await this.bot.sendMessage(chatId, goalText);

    } catch (error) {
      console.error('Error handling goal:', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка получения целей.');
    }
  }

  private async handleHelpCommand(chatId: number) {
    if (!this.bot) return;
    
    const helpText = `
❓ Справка по командам

/start - начать работу
/mystats - моя статистика
/team - статистика команды
/leaderboard - общий рейтинг
/goal - прогресс к цели
/help - эта справка

📱 Контакт: для регистрации поделитесь номером телефона

ℹ️ "Царь Такси" - ежемесячная мотивационная программа с иерархией ролей и командными достижениями.
    `;

    await this.bot.sendMessage(chatId, helpText);
  }

  private async getUserByTelegramId(telegramId: number) {
    const users = await storage.getUsers();
    return users.find(u => u.tgUserId === telegramId);
  }

  private normalizePhone(phone: string): string {
    // Remove all non-digits and add +7 prefix for Russian numbers
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('8') && digits.length === 11) {
      return '+7' + digits.slice(1);
    }
    if (digits.startsWith('7') && digits.length === 11) {
      return '+' + digits;
    }
    return '+' + digits;
  }

  async sendNotification(userId: number, message: string) {
    if (!this.bot) return;
    
    try {
      const user = await storage.getUser(userId);
      if (user?.tgUserId) {
        await this.bot.sendMessage(user.tgUserId, message);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

export const telegramBot = new TelegramBotService();
