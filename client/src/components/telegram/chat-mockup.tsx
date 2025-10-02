import { MessageCircle, MoreVertical, Send, Paperclip, BarChart3, Users, Trophy, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TelegramMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  time: string;
  isContact?: boolean;
  phone?: string;
}

interface TelegramChatMockupProps {
  messages?: TelegramMessage[];
  botCommands?: Array<{ command: string; description: string }>;
}

export function TelegramChatMockup({ 
  messages = [],
  botCommands = [
    { command: '/start', description: 'Начать работу с ботом' },
    { command: '/mystats', description: 'Моя статистика' },
    { command: '/team', description: 'Статистика команды' },
    { command: '/leaderboard', description: 'Общий рейтинг' },
    { command: '/goal', description: 'Прогресс к цели' },
    { command: '/help', description: 'Справка по командам' }
  ]
}: TelegramChatMockupProps) {
  const defaultMessages: TelegramMessage[] = [
    {
      id: '1',
      type: 'bot',
      content: 'Привет! 👋 Добро пожаловать в программу "Царь Такси"!\n\nДля начала работы, пожалуйста, поделитесь вашим номером телефона.',
      time: '09:00'
    },
    {
      id: '2',
      type: 'user',
      content: '+7 900 123-45-67',
      time: '09:01',
      isContact: true,
      phone: '+7 900 123-45-67'
    },
    {
      id: '3',
      type: 'bot',
      content: 'Отлично! Вы зарегистрированы ✅\n\n**Ваша роль:** Десятник\n**Сезон:** Январь 2025\n**Прогресс:** 124 ч из 207.7 ч (60%)',
      time: '09:01'
    },
    {
      id: '4',
      type: 'user',
      content: '/mystats',
      time: '09:05'
    },
    {
      id: '5',
      type: 'bot',
      content: '📊 **Ваша статистика**\n\n👤 Личные часы: 124 ч\n👥 Командные часы: 967 ч\n\n📈 Итого за сезон: 1,091 ч\n🎯 Цель сезона: 2,077 ч\n📊 Выполнение: 53%\n\n🏆 Ваше место среди Десятников: **12 из 87**',
      time: '09:05'
    }
  ];

  const chatMessages = messages.length > 0 ? messages : defaultMessages;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Telegram Chat Interface */}
      <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-2xl shadow-lg overflow-hidden border">
        {/* Telegram Header */}
        <div className="bg-primary px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold">Царь Такси Бот</div>
            <div className="text-white/80 text-xs flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              онлайн
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="p-4 space-y-3 h-96 overflow-y-auto bg-gradient-to-b from-blue-50 to-blue-100">
          {chatMessages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : ''}`}>
              {message.type === 'bot' && (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`flex-1 ${message.type === 'user' ? 'max-w-sm ml-auto' : 'max-w-sm'}`}>
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.type === 'bot' 
                    ? 'bg-white rounded-tl-none' 
                    : 'bg-primary/20 rounded-tr-none'
                }`}>
                  {message.isContact ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">📱</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{message.phone}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-foreground whitespace-pre-line">
                      {message.content}
                    </div>
                  )}
                </div>
                <div className={`text-xs text-muted-foreground mt-1 ${
                  message.type === 'user' ? 'text-right mr-2' : 'ml-2'
                }`}>
                  {message.time}
                </div>
              </div>
            </div>
          ))}

          {/* Quick Reply Buttons */}
          <div className="flex gap-2">
            <div className="w-8 h-8 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="bg-white rounded-2xl px-3 py-2 shadow-sm max-w-sm">
                <div className="text-xs text-muted-foreground mb-2">Доступные команды:</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-auto py-2 px-3 text-xs justify-start">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Мой рейтинг
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-2 px-3 text-xs justify-start">
                    <Users className="h-3 w-3 mr-1" />
                    Моя команда
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-2 px-3 text-xs justify-start">
                    <Trophy className="h-3 w-3 mr-1" />
                    Топ-10
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-2 px-3 text-xs justify-start">
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Справка
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-border p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input 
              placeholder="Введите команду..." 
              className="flex-1 bg-muted border-0 focus-visible:ring-1"
              disabled
            />
            <Button size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bot Commands Reference */}
      <div className="mt-6 bg-muted rounded-lg p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Доступные команды бота</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {botCommands.map((cmd) => (
            <div key={cmd.command} className="flex items-start gap-2">
              <code className="px-2 py-1 bg-background rounded text-xs font-mono text-primary">
                {cmd.command}
              </code>
              <span className="text-muted-foreground">{cmd.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
