import { Upload, UserPlus, Shuffle, Bell, ChevronRight } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge?: number;
  onClick?: () => void;
}

interface QuickActionsProps {
  onImport?: () => void;
  onNewApplications?: () => void;
  onRotateGroups?: () => void;
  onNotifications?: () => void;
  newApplicationsCount?: number;
}

export function QuickActions({ 
  onImport,
  onNewApplications,
  onRotateGroups,
  onNotifications,
  newApplicationsCount = 0
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      title: "Импорт часов",
      description: "Загрузить XLSX",
      icon: Upload,
      iconColor: "bg-primary/10 text-primary",
      onClick: onImport
    },
    {
      title: "Новые заявки",
      description: `${newApplicationsCount} в очереди`,
      icon: UserPlus,
      iconColor: "bg-accent/10 text-accent",
      badge: newApplicationsCount,
      onClick: onNewApplications
    },
    {
      title: "Ротация групп",
      description: "Перемешать команды",
      icon: Shuffle,
      iconColor: "bg-secondary/10 text-secondary",
      onClick: onRotateGroups
    },
    {
      title: "Уведомления",
      description: "Отправить в Telegram",
      icon: Bell,
      iconColor: "bg-success/10 text-success",
      onClick: onNotifications
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border elevated-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Быстрые действия</h3>
      </div>
      <div className="p-4 space-y-2">
        {actions.map((action) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted rounded-lg transition-colors"
            data-testid={`quick-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.iconColor}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{action.title}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
            </div>
            {action.badge ? (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-accent text-white text-xs font-bold rounded-full">
                {action.badge}
              </span>
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
