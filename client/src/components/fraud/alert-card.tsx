import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Ban, Clock } from "lucide-react";
import type { FraudAlert } from "@/lib/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AlertCardProps {
  alert: FraudAlert;
  onInvestigate?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onBlockUser?: (userId: number) => void;
}

export function AlertCard({ alert, onInvestigate, onDismiss, onBlockUser }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/10 border-warning/20 text-warning';
      case 'low': return 'bg-warning/10 border-warning/20 text-warning';
      default: return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'low': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return severity;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'high_hours': return 'Превышение часов';
      case 'anomaly_spike': return 'Аномальный всплеск';
      case 'zero_streak': return 'Длительный простой';
      default: return type;
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start gap-3">
        {getSeverityIcon(alert.severity)}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-foreground" data-testid={`alert-phone-${alert.id}`}>
              {alert.phone}
            </h3>
            <Badge className={getSeverityColor(alert.severity)}>
              {getSeverityLabel(alert.severity)}
            </Badge>
            <Badge variant="outline">
              {getTypeLabel(alert.type)}
            </Badge>
          </div>
          
          <p className="text-sm text-foreground mb-2" data-testid={`alert-message-${alert.id}`}>
            {alert.message}
          </p>
          
          <div className="text-xs text-muted-foreground">
            Дата: {format(new Date(alert.date), 'dd MMM yyyy', { locale: ru })}
          </div>
          
          {alert.data && (
            <div className="mt-2 text-xs text-muted-foreground">
              <code className="bg-muted px-2 py-1 rounded">
                {JSON.stringify(alert.data, null, 2)}
              </code>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onInvestigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInvestigate(alert.id)}
              data-testid={`button-investigate-${alert.id}`}
            >
              <Eye className="h-4 w-4 mr-2" />
              Расследовать
            </Button>
          )}
          
          {alert.severity === 'high' && onBlockUser && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBlockUser(alert.userId)}
              data-testid={`button-block-user-${alert.id}`}
            >
              <Ban className="h-4 w-4 mr-2" />
              Заблокировать
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              data-testid={`button-dismiss-${alert.id}`}
            >
              Отклонить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
