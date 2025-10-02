import { useState } from "react";
import { useActiveSeason } from "@/hooks/use-seasons";
import { Header } from "@/components/layout/header";
import { ReportCard } from "@/components/reports/report-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileSpreadsheet, 
  FileText, 
  BarChart3, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const { data: activeSeason } = useActiveSeason();
  const { toast } = useToast();

  const handleExportSeasonSummary = async () => {
    if (!activeSeason) {
      toast({
        title: "Ошибка",
        description: "Нет активного сезона",
        variant: "destructive",
      });
      return;
    }

    setGeneratingReports(prev => new Set([...prev, 'Итоги сезона']));
    
    try {
      const response = await fetch(`/api/export/season/${activeSeason.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `season_${activeSeason.name}_summary.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Отчёт скачан",
        description: "Итоги сезона успешно экспортированы",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать отчёт",
        variant: "destructive",
      });
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete('Итоги сезона');
        return newSet;
      });
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    if (reportType === 'Итоги сезона') {
      await handleExportSeasonSummary();
      return;
    }

    setGeneratingReports(prev => new Set([...prev, reportType]));
    
    try {
      // Simulate API call for other reports
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Отчёт создан",
        description: `${reportType} успешно сгенерирован`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать отчёт",
        variant: "destructive",
      });
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportType);
        return newSet;
      });
    }
  };

  const seasonReports = [
    {
      title: "Итоги сезона",
      description: "Полный отчёт по результатам текущего сезона с рейтингами и статистикой",
      icon: FileSpreadsheet,
      iconColor: "bg-success/10 text-success",
      type: "excel" as const,
      period: activeSeason ? `${activeSeason.name}` : "Нет активного сезона",
      lastGenerated: "15 янв 2025, 09:30"
    },
    {
      title: "Переходы ролей",
      description: "Детальный анализ переходов между ролями по итогам сезона",
      icon: TrendingUp,
      iconColor: "bg-primary/10 text-primary",
      type: "pdf" as const,
      period: activeSeason ? `${activeSeason.name}` : "Нет активного сезона",
      lastGenerated: "10 янв 2025, 14:22"
    },
    {
      title: "Выполнение целей",
      description: "Анализ выполнения дневных и месячных целей по всем участникам",
      icon: Trophy,
      iconColor: "bg-warning/10 text-warning",
      type: "excel" as const,
      period: activeSeason ? `${activeSeason.name}` : "Нет активного сезона",
      lastGenerated: "12 янв 2025, 11:15"
    }
  ];

  const participantReports = [
    {
      title: "Список участников",
      description: "Полный список участников с контактной информацией и статусами",
      icon: Users,
      iconColor: "bg-accent/10 text-accent",
      type: "csv" as const,
      lastGenerated: "14 янв 2025, 16:45"
    },
    {
      title: "Детальная статистика",
      description: "Подробная статистика по каждому участнику за выбранный период",
      icon: BarChart3,
      iconColor: "bg-primary/10 text-primary",
      type: "excel" as const,
      period: "За все время",
      lastGenerated: "13 янв 2025, 12:30"
    },
    {
      title: "Активность в Telegram",
      description: "Статистика использования бота и взаимодействия участников",
      icon: FileText,
      iconColor: "bg-secondary/10 text-secondary",
      type: "pdf" as const,
      lastGenerated: "11 янв 2025, 08:20"
    }
  ];

  const systemReports = [
    {
      title: "Аудит изменений",
      description: "Журнал всех административных действий и изменений в системе",
      icon: FileText,
      iconColor: "bg-muted-foreground/10 text-muted-foreground",
      type: "csv" as const,
      period: "За последние 30 дней",
      lastGenerated: "16 янв 2025, 07:00"
    },
    {
      title: "Импорты данных",
      description: "История импортов XLSX файлов с детализацией ошибок",
      icon: Clock,
      iconColor: "bg-accent/10 text-accent",
      type: "excel" as const,
      period: "За текущий месяц",
      lastGenerated: "15 янв 2025, 18:30"
    },
    {
      title: "Аномалии и нарушения",
      description: "Отчёт по выявленным аномалиям в данных и подозрительной активности",
      icon: FileSpreadsheet,
      iconColor: "bg-destructive/10 text-destructive",
      type: "pdf" as const,
      period: "За последние 7 дней",
      lastGenerated: "16 янв 2025, 10:15"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Отчёты" 
        subtitle="Генерация и загрузка аналитических отчётов"
        seasonName={activeSeason?.name}
        seasonStatus={activeSeason?.status}
      />

      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Доступные отчёты</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Создание и загрузка отчётов по различным аспектам системы
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить все
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Настроить расписание
              </Button>
            </div>
          </div>

          <Tabs defaultValue="season" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="season" data-testid="tab-season-reports">Сезоны</TabsTrigger>
              <TabsTrigger value="participants" data-testid="tab-participant-reports">Участники</TabsTrigger>
              <TabsTrigger value="system" data-testid="tab-system-reports">Система</TabsTrigger>
            </TabsList>

            <TabsContent value="season" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seasonReports.map((report) => (
                  <ReportCard
                    key={report.title}
                    title={report.title}
                    description={report.description}
                    icon={report.icon}
                    iconColor={report.iconColor}
                    type={report.type}
                    period={report.period}
                    lastGenerated={report.lastGenerated}
                    onGenerate={() => handleGenerateReport(report.title)}
                    onView={() => console.log('View report:', report.title)}
                    onDownload={() => console.log('Download report:', report.title)}
                    isGenerating={generatingReports.has(report.title)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="participants" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {participantReports.map((report) => (
                  <ReportCard
                    key={report.title}
                    title={report.title}
                    description={report.description}
                    icon={report.icon}
                    iconColor={report.iconColor}
                    type={report.type}
                    period={report.period}
                    lastGenerated={report.lastGenerated}
                    onGenerate={() => handleGenerateReport(report.title)}
                    onView={() => console.log('View report:', report.title)}
                    onDownload={() => console.log('Download report:', report.title)}
                    isGenerating={generatingReports.has(report.title)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {systemReports.map((report) => (
                  <ReportCard
                    key={report.title}
                    title={report.title}
                    description={report.description}
                    icon={report.icon}
                    iconColor={report.iconColor}
                    type={report.type}
                    period={report.period}
                    lastGenerated={report.lastGenerated}
                    onGenerate={() => handleGenerateReport(report.title)}
                    onView={() => console.log('View report:', report.title)}
                    onDownload={() => console.log('Download report:', report.title)}
                    isGenerating={generatingReports.has(report.title)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Report Automation */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Автоматизация отчётов</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Ежедневные отчёты</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Автоматическая генерация ключевых отчётов каждый день в 08:00
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Статистика дня</span>
                    <span className="text-success">Включено</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Импорты и ошибки</span>
                    <span className="text-success">Включено</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Недельные отчёты</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Еженедельная сводка по воскресеньям в 20:00
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Недельная сводка</span>
                    <span className="text-success">Включено</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Аномалии недели</span>
                    <span className="text-muted-foreground">Отключено</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
