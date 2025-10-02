import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FraudAlert } from "@/lib/types";

interface FraudAlertsProps {
  alerts: FraudAlert[];
  onViewAll?: () => void;
}

export function FraudAlerts({ alerts, onViewAll }: FraudAlertsProps) {
  const severityColors = {
    low: "bg-warning/10 border-warning/20 text-warning",
    medium: "bg-warning/10 border-warning/20 text-warning", 
    high: "bg-destructive/10 border-destructive/20 text-destructive"
  };

  return (
    <div className="bg-card rounded-lg border border-destructive/20 elevated-card">
      <div className="border-b border-border px-6 py-4 bg-destructive/5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-foreground">Антифрод</h3>
          {alerts.length > 0 && (
            <Badge className="ml-auto bg-destructive text-white">
              {alerts.length} новых
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-sm text-muted-foreground">Аномалий не обнаружено</div>
          </div>
        ) : (
          <>
            {alerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border ${severityColors[alert.severity]}`}
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground" data-testid={`fraud-alert-phone-${alert.id}`}>
                    {alert.phone}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5" data-testid={`fraud-alert-message-${alert.id}`}>
                    {alert.message}
                  </div>
                </div>
              </div>
            ))}

            {onViewAll && (
              <Button 
                variant="ghost" 
                className="w-full text-destructive hover:bg-destructive/10"
                onClick={onViewAll}
                data-testid="button-view-all-alerts"
              >
                Просмотреть все аномалии
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
