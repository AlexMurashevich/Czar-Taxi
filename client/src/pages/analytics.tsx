import { useActiveSeason } from "@/hooks/use-seasons";
import { useAnalyticsData } from "@/hooks/use-analytics";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Target, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { data: activeSeason } = useActiveSeason();
  const { data: analyticsData, isLoading } = useAnalyticsData(activeSeason?.id);

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Аналитика" subtitle="Статистика и тренды" />
        <main className="p-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Нет активного сезона для отображения аналитики</p>
          </Card>
        </main>
      </div>
    );
  }

  const chartConfig = {
    personal: { label: "Личные часы", color: "hsl(var(--primary))" },
    team: { label: "Командные часы", color: "hsl(var(--secondary))" },
    total: { label: "Всего", color: "hsl(var(--accent))" },
    target: { label: "Цель", color: "hsl(var(--muted-foreground))" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Аналитика" 
        subtitle="Статистика и тренды"
        seasonName={activeSeason.name}
        seasonStatus={activeSeason.status}
      />

      <main className="p-8 space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Средний рост</p>
                <p className="text-2xl font-bold" data-testid="stat-avg-growth">
                  {analyticsData?.avgDailyGrowth ? `${analyticsData.avgDailyGrowth}%` : '-'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Активных сегодня</p>
                <p className="text-2xl font-bold" data-testid="stat-active-today">
                  {analyticsData?.activeTodayCount || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Выполнили цель</p>
                <p className="text-2xl font-bold" data-testid="stat-achieved-goal">
                  {analyticsData?.achievedGoalCount || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дней осталось</p>
                <p className="text-2xl font-bold" data-testid="stat-days-left">
                  {analyticsData?.daysRemaining || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="trends" data-testid="tab-trends">Тренды</TabsTrigger>
            <TabsTrigger value="teams" data-testid="tab-teams">Команды</TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">Цели</TabsTrigger>
            <TabsTrigger value="distribution" data-testid="tab-distribution">Распределение</TabsTrigger>
          </TabsList>

          {/* Daily Trends Chart */}
          <TabsContent value="trends" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Динамика часов по дням</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Отслеживание ежедневных наработанных часов
              </p>
              
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Загрузка данных...</p>
                </div>
              ) : analyticsData?.dailyTrend && analyticsData.dailyTrend.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <LineChart data={analyticsData.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="personal" 
                      stroke="var(--color-personal)" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="var(--color-total)" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Нет данных для отображения</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Team Performance Chart */}
          <TabsContent value="teams" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Сравнение команд</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Производительность по группам сотников
              </p>
              
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Загрузка данных...</p>
                </div>
              ) : analyticsData?.teamComparison && analyticsData.teamComparison.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <BarChart data={analyticsData.teamComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="teamName" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="target" fill="var(--color-target)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Нет данных для отображения</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Goal Achievement Chart */}
          <TabsContent value="goals" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Прогресс достижения целей</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Накопительный прогресс выполнения месячной цели
              </p>
              
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Загрузка данных...</p>
                </div>
              ) : analyticsData?.goalProgress && analyticsData.goalProgress.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <AreaChart data={analyticsData.goalProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="var(--color-total)" 
                      fill="var(--color-total)"
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="targetCumulative" 
                      stroke="var(--color-target)" 
                      fill="var(--color-target)"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Нет данных для отображения</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Performance Distribution Chart */}
          <TabsContent value="distribution" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Распределение производительности</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Количество участников по диапазонам выполнения цели
              </p>
              
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Загрузка данных...</p>
                </div>
              ) : analyticsData?.performanceDistribution && analyticsData.performanceDistribution.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <BarChart data={analyticsData.performanceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Нет данных для отображения</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
