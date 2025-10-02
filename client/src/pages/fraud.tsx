import { useState } from "react";
import { useFraudAlerts } from "@/hooks/use-fraud-alerts";
import { useBlockUser } from "@/hooks/use-participants";
import { Header } from "@/components/layout/header";
import { AlertCard } from "@/components/fraud/alert-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Clock, TrendingUp, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Fraud() {
  const { data: alerts, isLoading } = useFraudAlerts();
  const blockUser = useBlockUser();
  const { toast } = useToast();

  const handleInvestigate = (alertId: string) => {
    console.log('Investigate alert:', alertId);
    toast({
      title: "Расследование начато",
      description: "Аномалия отправлена на детальное расследование",
    });
  };

  const handleDismiss = (alertId: string) => {
    console.log('Dismiss alert:', alertId);
    toast({
      title: "Уведомление отклонено",
      description: "Аномалия помечена как ложная тревога",
    });
  };

  const handleBlockUser = async (userId: number) => {
    try {
      await blockUser.mutateAsync(userId);
      toast({
        title: "Пользователь заблокирован",
        description: "Пользователь был заблокирован за подозрительную активность",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось заблокировать пользователя",
        variant: "destructive",
      });
    }
  };

  const highSeverityAlerts = alerts?.filter(alert => alert.severity === 'high') || [];
  const mediumSeverityAlerts = alerts?.filter(alert => alert.severity === 'medium') || [];
  const lowSeverityAlerts = alerts?.filter(alert => alert.severity === 'low') || [];

  const fraudStats = {
    totalAlerts: alerts?.length || 0,
    highSeverity: highSeverityAlerts.length,
    mediumSeverity: mediumSeverityAlerts.length,
    lowSeverity: lowSeverityAlerts.length,
    recentAlerts: alerts?.filter(alert => {
      const alertDate = new Date(alert.date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - alertDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length || 0
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Антифрод" />
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
      <Header 
        title="Антифрод" 
        subtitle="Мониторинг аномальной активности и нарушений"
      />

      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Fraud Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-total-alerts">
                    {fraudStats.totalAlerts}
                  </div>
                  <div className="text-sm text-muted-foreground">Всего аномалий</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-high-alerts">
                    {fraudStats.highSeverity}
                  </div>
                  <div className="text-sm text-muted-foreground">Высокий риск</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-medium-alerts">
                    {fraudStats.mediumSeverity}
                  </div>
                  <div className="text-sm text-muted-foreground">Средний риск</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-low-alerts">
                    {fraudStats.lowSeverity}
                  </div>
                  <div className="text-sm text-muted-foreground">Низкий риск</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-recent-alerts">
                    {fraudStats.recentAlerts}
                  </div>
                  <div className="text-sm text-muted-foreground">За неделю</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Активные аномалии</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Обнаруженные нарушения требующие внимания
              </p>
            </div>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Настройки антифрода
            </Button>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" data-testid="tab-all-alerts">
                Все {fraudStats.totalAlerts > 0 && <Badge className="ml-2">{fraudStats.totalAlerts}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="high" data-testid="tab-high-alerts">
                Высокий {fraudStats.highSeverity > 0 && <Badge className="ml-2 bg-destructive">{fraudStats.highSeverity}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="medium" data-testid="tab-medium-alerts">
                Средний {fraudStats.mediumSeverity > 0 && <Badge className="ml-2 bg-warning">{fraudStats.mediumSeverity}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="low" data-testid="tab-low-alerts">
                Низкий {fraudStats.lowSeverity > 0 && <Badge className="ml-2 bg-warning">{fraudStats.lowSeverity}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {alerts && alerts.length > 0 ? (
                alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onInvestigate={handleInvestigate}
                    onDismiss={handleDismiss}
                    onBlockUser={handleBlockUser}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">Аномалий не обнаружено</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="high" className="space-y-4">
              {highSeverityAlerts.length > 0 ? (
                highSeverityAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onInvestigate={handleInvestigate}
                    onDismiss={handleDismiss}
                    onBlockUser={handleBlockUser}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">Аномалий высокого риска не обнаружено</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="medium" className="space-y-4">
              {mediumSeverityAlerts.length > 0 ? (
                mediumSeverityAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onInvestigate={handleInvestigate}
                    onDismiss={handleDismiss}
                    onBlockUser={handleBlockUser}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">Аномалий среднего риска не обнаружено</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="low" className="space-y-4">
              {lowSeverityAlerts.length > 0 ? (
                lowSeverityAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onInvestigate={handleInvestigate}
                    onDismiss={handleDismiss}
                    onBlockUser={handleBlockUser}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">Аномалий низкого риска не обнаружено</div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Fraud Detection Settings */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Настройки детекции</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Превышение часов</h4>
                <p className="text-xs text-muted-foreground">
                  Текущий порог: <strong>16 часов/день</strong>
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Аномальные всплески</h4>
                <p className="text-xs text-muted-foreground">
                  Текущий множитель: <strong>4.7x от медианы</strong>
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Простои</h4>
                <p className="text-xs text-muted-foreground">
                  Текущий порог: <strong>7 дней подряд</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
