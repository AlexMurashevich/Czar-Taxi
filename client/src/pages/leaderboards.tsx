import { useActiveSeason } from "@/hooks/use-seasons";
import { useTopCenturions, useTopDrivers } from "@/hooks/use-leaderboards";
import { Header } from "@/components/layout/header";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Leaderboards() {
  const { data: activeSeason } = useActiveSeason();
  const { data: topCenturions, isLoading: loadingCenturions } = useTopCenturions(activeSeason?.id || 0, 50);
  const { data: topDrivers, isLoading: loadingDrivers } = useTopDrivers(activeSeason?.id || 0, 50);

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Рейтинги" />
        <main className="p-8">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Нет активного сезона</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Рейтинги" 
        subtitle="Лидеры по результатам работы"
        seasonName={activeSeason.name}
        seasonStatus={activeSeason.status}
      />

      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="centurions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="centurions" data-testid="tab-centurions">Сотники</TabsTrigger>
              <TabsTrigger value="decurions" data-testid="tab-decurions">Десятники</TabsTrigger>
              <TabsTrigger value="drivers" data-testid="tab-drivers">Водители</TabsTrigger>
              <TabsTrigger value="overall" data-testid="tab-overall">Общий</TabsTrigger>
            </TabsList>

            <TabsContent value="centurions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LeaderboardCard
                  title="Рейтинг Сотников"
                  icon="🛡️"
                  iconColor="bg-primary/20 text-primary"
                  entries={topCenturions || []}
                />
                
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Статистика Сотников</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Всего Сотников:</span>
                      <span className="font-semibold">{topCenturions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Средний результат:</span>
                      <span className="font-semibold">
                        {topCenturions?.length ? 
                          Math.round(topCenturions.reduce((sum, c) => sum + Number(c.total), 0) / topCenturions.length) 
                          : 0} ч
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Выполняют цель:</span>
                      <span className="font-semibold text-success">
                        {topCenturions?.filter(c => Number(c.targetPercent) >= 100).length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {loadingCenturions && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Загрузка...</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="decurions" className="space-y-6">
              <div className="text-center py-8">
                <div className="text-muted-foreground">Рейтинг Десятников в разработке</div>
              </div>
            </TabsContent>

            <TabsContent value="drivers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LeaderboardCard
                  title="Рейтинг Водителей"
                  icon="🚗"
                  iconColor="bg-muted-foreground/20 text-muted-foreground"
                  entries={topDrivers || []}
                />
                
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Статистика Водителей</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Всего Водителей:</span>
                      <span className="font-semibold">{topDrivers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Средний результат:</span>
                      <span className="font-semibold">
                        {topDrivers?.length ? 
                          Math.round(topDrivers.reduce((sum, d) => sum + Number(d.personalTotal), 0) / topDrivers.length) 
                          : 0} ч
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Выполняют цель:</span>
                      <span className="font-semibold text-success">
                        {topDrivers?.filter(d => Number(d.targetPercent) >= 100).length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {loadingDrivers && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Загрузка...</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="overall" className="space-y-6">
              <div className="text-center py-8">
                <div className="text-muted-foreground">Общий рейтинг в разработке</div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
