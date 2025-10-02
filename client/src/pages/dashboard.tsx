import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useActiveSeason } from "@/hooks/use-seasons";
import { useTopCenturions, useTopDrivers } from "@/hooks/use-leaderboards";
import { useFraudAlerts } from "@/hooks/use-fraud-alerts";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SeasonCard } from "@/components/dashboard/season-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FraudAlerts } from "@/components/dashboard/fraud-alerts";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { TelegramChatMockup } from "@/components/telegram/chat-mockup";
import { FileUpload } from "@/components/common/file-upload";
import { useUploadFile } from "@/hooks/use-imports";
import { Users, Clock, Target, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, refetch: refetchStats } = useDashboardStats();
  const { data: activeSeason } = useActiveSeason();
  const { data: topCenturions } = useTopCenturions(activeSeason?.id || 0, 5);
  const { data: topDrivers } = useTopDrivers(activeSeason?.id || 0, 5);
  const { data: fraudAlerts } = useFraudAlerts();
  const uploadFile = useUploadFile();

  const handleFileUpload = async (file: File) => {
    await uploadFile.mutateAsync(file);
    refetchStats();
  };

  const hierarchyStats = {
    tsar: { current: 1, max: 1 },
    centurions: { current: topCenturions?.length || 0, max: 10 },
    decurions: { current: 87, max: 100 }, // Mock data
    drivers: { current: stats?.totalParticipants ? stats.totalParticipants - 88 : 0, max: 1000 }
  };

  const currentDay = activeSeason ? 
    Math.ceil((new Date().getTime() - new Date(activeSeason.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const seasonProgress = activeSeason ? (currentDay / activeSeason.daysCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Обзор"
        seasonName={activeSeason?.name}
        seasonStatus={activeSeason?.status}
        onRefresh={refetchStats}
        onImport={() => setLocation('/import')}
      />

      <main className="p-8">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Всего"
            value={stats?.totalParticipants || 0}
            description="Участников"
            icon={Users}
            iconColor="bg-primary/10 text-primary"
            trend={{ value: "+23 в этом месяце", positive: true }}
          />
          <StatCard
            title="Сегодня"
            value={stats?.dailyHours || 0}
            description="Часов наработано"
            icon={Clock}
            iconColor="bg-accent/10 text-accent"
            trend={{ value: "103% от цели", positive: true }}
          />
          <StatCard
            title="Прогресс"
            value={`${stats?.goalPercentage || 0}%`}
            description="Выполнение цели"
            icon={Target}
            iconColor="bg-secondary/10 text-secondary"
          />
          <StatCard
            title="Статус"
            value={stats?.alerts || 0}
            description="Аномалий обнаружено"
            icon={AlertTriangle}
            iconColor="bg-destructive/10 text-destructive"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Current Season Info - Wider Column */}
          <div className="lg:col-span-2">
            {activeSeason ? (
              <SeasonCard
                season={activeSeason}
                progress={seasonProgress}
                hierarchyStats={hierarchyStats}
                onExport={() => console.log('Export season report')}
                onFinish={() => console.log('Finish season')}
              />
            ) : (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <div className="text-muted-foreground">Нет активного сезона</div>
              </div>
            )}
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            <QuickActions
              onImport={() => setLocation('/import')}
              onNewApplications={() => setLocation('/participants')}
              onRotateGroups={() => console.log('Rotate groups')}
              onNotifications={() => console.log('Send notifications')}
              newApplicationsCount={12}
            />

            <FraudAlerts
              alerts={fraudAlerts || []}
              onViewAll={() => setLocation('/fraud')}
            />
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <LeaderboardCard
            title="Топ Сотников"
            icon="🛡️"
            iconColor="bg-primary/20 text-primary"
            entries={topCenturions || []}
            onViewAll={() => setLocation('/leaderboards')}
          />
          <LeaderboardCard
            title="Топ Водителей"
            icon="🚗"
            iconColor="bg-muted-foreground/20 text-muted-foreground"
            entries={topDrivers || []}
            onViewAll={() => setLocation('/leaderboards')}
          />
        </div>

        {/* Data Import Section */}
        <div className="bg-card rounded-lg border border-border elevated-card mb-8" id="import">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Импорт данных</h3>
                <p className="text-sm text-muted-foreground mt-1">Загрузка часов работы из XLSX файла</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <FileUpload
              onFileUpload={handleFileUpload}
              uploading={uploadFile.isPending}
            />
          </div>
        </div>

        {/* Telegram Bot Interface Mockup */}
        <div className="bg-card rounded-lg border border-border elevated-card mb-8" id="telegram">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Telegram бот интерфейс</h3>
                <p className="text-sm text-muted-foreground mt-1">Пример взаимодействия пользователя с ботом</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                  <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
                  Бот активен
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <TelegramChatMockup />
          </div>
        </div>
      </main>
    </div>
  );
}
