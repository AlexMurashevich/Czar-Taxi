import { useState } from "react";
import { useSeasons, useCreateSeason, useActivateSeason, useCloseSeason } from "@/hooks/use-seasons";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeasonForm } from "@/components/seasons/season-form";
import { Plus, Play, Square, Edit } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function Seasons() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: seasons, isLoading } = useSeasons();
  const createSeason = useCreateSeason();
  const activateSeason = useActivateSeason();
  const closeSeason = useCloseSeason();
  const { toast } = useToast();

  const handleCreateSeason = async (data: any) => {
    try {
      await createSeason.mutateAsync(data);
      setShowCreateForm(false);
      toast({
        title: "Сезон создан",
        description: "Новый сезон успешно создан",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать сезон",
        variant: "destructive",
      });
    }
  };

  const handleActivateSeason = async (seasonId: number) => {
    try {
      await activateSeason.mutateAsync(seasonId);
      toast({
        title: "Сезон активирован",
        description: "Сезон успешно активирован",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось активировать сезон",
        variant: "destructive",
      });
    }
  };

  const handleCloseSeason = async (seasonId: number) => {
    try {
      await closeSeason.mutateAsync(seasonId);
      toast({
        title: "Сезон завершён",
        description: "Сезон успешно завершён с применением переходов ролей",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось завершить сезон",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'planned': return 'bg-warning/10 text-warning';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'planned': return 'Запланирован';
      case 'closed': return 'Завершён';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Сезоны" />
        <main className="p-8">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Сезоны" />

      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Управление сезонами</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Создание, активация и завершение сезонов программы
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} data-testid="button-create-season">
            <Plus className="h-4 w-4 mr-2" />
            Создать сезон
          </Button>
        </div>

        <div className="space-y-4">
          {!seasons || seasons.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <div className="text-muted-foreground mb-4">Сезоны не созданы</div>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Создать первый сезон
              </Button>
            </div>
          ) : (
            seasons.map((season) => (
              <div key={season.id} className="bg-card rounded-lg border border-border p-6 elevated-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground" data-testid={`season-name-${season.id}`}>
                        {season.name}
                      </h3>
                      <Badge className={getStatusColor(season.status)} data-testid={`season-status-${season.id}`}>
                        {getStatusLabel(season.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Период:</span>
                        <div className="font-medium">
                          {format(new Date(season.startDate), 'dd MMM', { locale: ru })} — {format(new Date(season.endDate), 'dd MMM yyyy', { locale: ru })}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Дней:</span>
                        <div className="font-medium">{season.daysCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Дневная цель:</span>
                        <div className="font-medium">{Number(season.dailyTargetHours)} ч</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Цель сезона:</span>
                        <div className="font-medium">{Number(season.monthlyUnitTarget)} ч</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {season.status === 'planned' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleActivateSeason(season.id)}
                        disabled={activateSeason.isPending}
                        data-testid={`button-activate-${season.id}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Активировать
                      </Button>
                    )}
                    
                    {season.status === 'active' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleCloseSeason(season.id)}
                        disabled={closeSeason.isPending}
                        data-testid={`button-close-${season.id}`}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Завершить
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <SeasonForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSubmit={handleCreateSeason}
          isSubmitting={createSeason.isPending}
        />
      </main>
    </div>
  );
}
