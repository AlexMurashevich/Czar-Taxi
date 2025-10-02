import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  deliveryMethod: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=50");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500" data-testid={`status-sent`}><CheckCircle className="w-3 h-3 mr-1" />Отправлено</Badge>;
      case 'failed':
        return <Badge variant="destructive" data-testid={`status-failed`}><XCircle className="w-3 h-3 mr-1" />Ошибка</Badge>;
      case 'pending':
        return <Badge variant="secondary" data-testid={`status-pending`}><Clock className="w-3 h-3 mr-1" />Ожидание</Badge>;
      case 'skipped':
        return <Badge variant="outline" data-testid={`status-skipped`}>Пропущено</Badge>;
      default:
        return <Badge variant="outline" data-testid={`status-unknown`}>{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'role_change':
        return 'Изменение роли';
      case 'goal_achieved':
        return 'Цель достигнута';
      case 'ranking_update':
        return 'Обновление рейтинга';
      case 'daily_summary':
        return 'Дневная сводка';
      case 'manual':
        return 'Ручная отправка';
      case 'system':
        return 'Системное';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Уведомления</h1>
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-8 h-8" />
        <h1 className="text-3xl font-bold" data-testid="page-title">Уведомления</h1>
      </div>

      <div className="grid gap-4">
        {!notifications || notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center" data-testid="no-notifications">
                Нет уведомлений
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} data-testid={`notification-${notification.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg" data-testid={`notification-title-${notification.id}`}>
                        {notification.title}
                      </CardTitle>
                      {getStatusBadge(notification.status)}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span data-testid={`notification-type-${notification.id}`}>
                        {getTypeLabel(notification.type)}
                      </span>
                      <span className="text-xs" data-testid={`notification-date-${notification.id}`}>
                        {format(new Date(notification.createdAt), "dd.MM.yyyy HH:mm")}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap" data-testid={`notification-message-${notification.id}`}>
                  {notification.message}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span data-testid={`notification-delivery-${notification.id}`}>
                    Доставка: {notification.deliveryMethod === 'both' ? 'Telegram + Web' : 
                             notification.deliveryMethod === 'telegram' ? 'Telegram' : 'Web'}
                  </span>
                  {notification.sentAt && (
                    <span data-testid={`notification-sent-${notification.id}`}>
                      Отправлено: {format(new Date(notification.sentAt), "dd.MM.yyyy HH:mm")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
