import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardCardProps {
  title: string;
  icon: string;
  iconColor: string;
  entries: LeaderboardEntry[];
  onViewAll?: () => void;
}

export function LeaderboardCard({ 
  title, 
  icon, 
  iconColor, 
  entries, 
  onViewAll 
}: LeaderboardCardProps) {
  const getPositionDisplay = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  const getPercentageColor = (percent: number) => {
    if (percent >= 100) return "text-success";
    if (percent >= 90) return "text-accent";
    return "text-warning";
  };

  return (
    <div className="bg-card rounded-lg border border-border elevated-card">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
              <span className="text-sm">{icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Полный рейтинг
            </Button>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-sm text-muted-foreground">Данные отсутствуют</div>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div
                key={entry.userId}
                className="flex items-center gap-4 p-3 hover:bg-muted rounded-lg transition-colors"
                data-testid={`leaderboard-entry-${entry.userId}`}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-secondary/20 rounded-full text-sm font-bold text-secondary">
                  {getPositionDisplay(index)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground" data-testid={`entry-name-${entry.userId}`}>
                    {entry.user.fullName || 'Участник'}
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`entry-phone-${entry.userId}`}>
                    {entry.user.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground" data-testid={`entry-hours-${entry.userId}`}>
                    {Math.round(Number(entry.role === 'driver' ? entry.personalTotal : entry.total))} ч
                  </div>
                  <div className={`text-xs ${getPercentageColor(Number(entry.targetPercent))}`}>
                    {Math.round(Number(entry.targetPercent))}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
