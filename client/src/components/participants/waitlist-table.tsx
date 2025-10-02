import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User } from "lucide-react";
import type { Waitlist } from "@/lib/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface WaitlistTableProps {
  entries: Waitlist[];
  onApprove?: (entryId: number) => void;
  onReject?: (entryId: number) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function WaitlistTable({ entries, onApprove, onReject, isApproving, isRejecting }: WaitlistTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-warning/10 text-warning';
      case 'approved': return 'bg-success/10 text-success';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Новая';
      case 'approved': return 'Одобрена';
      case 'rejected': return 'Отклонена';
      default: return status;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <div className="text-muted-foreground">Заявки отсутствуют</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            {entry.fullName ? entry.fullName.charAt(0).toUpperCase() : entry.phone.slice(-2)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground" data-testid={`waitlist-name-${entry.id}`}>
                {entry.fullName || 'Участник'}
              </h3>
              <Badge className={getStatusColor(entry.status || 'new')} data-testid={`waitlist-status-${entry.id}`}>
                {getStatusLabel(entry.status || 'new')}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1" data-testid={`waitlist-phone-${entry.id}`}>
              {entry.phone}
            </div>
            <div className="text-xs text-muted-foreground">
              Подана: {format(new Date(entry.addedAt), 'dd MMM yyyy в HH:mm', { locale: ru })}
            </div>
          </div>

          {entry.status === 'new' && (
            <div className="flex items-center gap-2">
              {onApprove && (
                <Button
                  size="sm"
                  onClick={() => onApprove(entry.id)}
                  disabled={isApproving}
                  data-testid={`button-approve-${entry.id}`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Одобрить
                </Button>
              )}
              {onReject && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(entry.id)}
                  disabled={isRejecting}
                  data-testid={`button-reject-${entry.id}`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Отклонить
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
