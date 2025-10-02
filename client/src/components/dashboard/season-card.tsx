import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Edit, Settings, Download, Play } from "lucide-react";
import type { Season } from "@/lib/types";

interface SeasonCardProps {
  season: Season;
  progress: number;
  hierarchyStats: {
    tsar: { current: number; max: number };
    centurions: { current: number; max: number };
    decurions: { current: number; max: number };
    drivers: { current: number; max: number };
  };
  onEdit?: () => void;
  onSettings?: () => void;
  onExport?: () => void;
  onFinish?: () => void;
}

export function SeasonCard({ 
  season, 
  progress,
  hierarchyStats,
  onEdit,
  onSettings,
  onExport,
  onFinish
}: SeasonCardProps) {
  const currentDay = Math.ceil((new Date().getTime() - new Date(season.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = season.daysCount;
  
  return (
    <div className="bg-card rounded-lg border border-border elevated-card">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Текущий сезон</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {season.name} • День {Math.min(currentDay, totalDays)} из {totalDays}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onSettings && (
              <Button variant="ghost" size="sm" onClick={onSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Season Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Прогресс сезона</span>
            <span className="text-sm font-semibold text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{new Date(season.startDate).toLocaleDateString('ru-RU')}</span>
            <span>{currentDay} дней пройдено</span>
            <span>{new Date(season.endDate).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        {/* Goal Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Дневная цель</div>
            <div className="text-2xl font-bold text-foreground">{Number(season.dailyTargetHours)} ч</div>
            <div className="text-xs text-muted-foreground mt-1">На одного водителя</div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Цель сезона</div>
            <div className="text-2xl font-bold text-foreground">{Number(season.monthlyUnitTarget)} ч</div>
            <div className="text-xs text-muted-foreground mt-1">
              {Number(season.dailyTargetHours)} × {season.daysCount} дней
            </div>
          </div>
        </div>

        {/* Hierarchy Overview */}
        <div>
          <div className="text-sm font-semibold text-foreground mb-3">Распределение ролей</div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-warning rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">👑</span>
                </div>
                <span className="text-sm font-medium">Царь</span>
              </div>
              <div className="flex-1">
                <Progress value={(hierarchyStats.tsar.current / hierarchyStats.tsar.max) * 100} className="h-2" />
              </div>
              <span className="text-sm font-semibold text-foreground w-16 text-right">
                {hierarchyStats.tsar.current} / {hierarchyStats.tsar.max}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary text-xs">🛡️</span>
                </div>
                <span className="text-sm font-medium">Сотники</span>
              </div>
              <div className="flex-1">
                <Progress value={(hierarchyStats.centurions.current / hierarchyStats.centurions.max) * 100} className="h-2" />
              </div>
              <span className="text-sm font-semibold text-foreground w-16 text-right">
                {hierarchyStats.centurions.current} / {hierarchyStats.centurions.max}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <span className="text-accent text-xs">⚔️</span>
                </div>
                <span className="text-sm font-medium">Десятники</span>
              </div>
              <div className="flex-1">
                <Progress value={(hierarchyStats.decurions.current / hierarchyStats.decurions.max) * 100} className="h-2" />
              </div>
              <span className="text-sm font-semibold text-foreground w-16 text-right">
                {hierarchyStats.decurions.current} / {hierarchyStats.decurions.max}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32">
                <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">👤</span>
                </div>
                <span className="text-sm font-medium">Водители</span>
              </div>
              <div className="flex-1">
                <Progress value={(hierarchyStats.drivers.current / hierarchyStats.drivers.max) * 100} className="h-2" />
              </div>
              <span className="text-sm font-semibold text-foreground w-16 text-right">
                {hierarchyStats.drivers.current} / {hierarchyStats.drivers.max}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          {onExport && (
            <Button variant="outline" className="flex-1" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт отчёта
            </Button>
          )}
          {onFinish && (
            <Button className="flex-1" onClick={onFinish}>
              <Play className="h-4 w-4 mr-2" />
              Завершить сезон
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
