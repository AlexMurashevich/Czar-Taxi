import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Shield, Ban, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ParticipantCardProps {
  user: User;
  role?: string;
  onBlock?: (userId: number) => void;
  onMessage?: (userId: number) => void;
  onViewStats?: (userId: number) => void;
}

export function ParticipantCard({ user, role, onBlock, onMessage, onViewStats }: ParticipantCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'blocked': return 'bg-destructive/10 text-destructive';
      case 'waiting': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'blocked': return 'Заблокирован';
      case 'waiting': return 'Ожидает';
      default: return status;
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'tsar': return 'bg-gradient-to-br from-secondary to-warning text-white';
      case 'sotnik': return 'bg-primary/10 text-primary';
      case 'desyatnik': return 'bg-accent/10 text-accent';
      case 'driver': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleName = (role?: string) => {
    switch (role) {
      case 'tsar': return 'Царь';
      case 'sotnik': return 'Сотник';
      case 'desyatnik': return 'Десятник';
      case 'driver': return 'Водитель';
      default: return 'Не назначена';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 elevated-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.phone.slice(-2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground" data-testid={`participant-name-${user.id}`}>
                {user.fullName || 'Участник'}
              </h3>
              <Badge className={getStatusColor(user.status)} data-testid={`participant-status-${user.id}`}>
                {getStatusLabel(user.status)}
              </Badge>
              {role && (
                <Badge className={getRoleColor(role)}>
                  {getRoleName(role)}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1" data-testid={`participant-phone-${user.id}`}>
              {user.phone}
            </div>
            <div className="text-xs text-muted-foreground">
              Регистрация: {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ru })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.tgUserId && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="h-3 w-3 text-white" />
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid={`participant-menu-${user.id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewStats && (
                <DropdownMenuItem onClick={() => onViewStats(user.id)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Статистика
                </DropdownMenuItem>
              )}
              {onMessage && user.tgUserId && (
                <DropdownMenuItem onClick={() => onMessage(user.id)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Отправить сообщение
                </DropdownMenuItem>
              )}
              {onBlock && user.status === 'active' && (
                <DropdownMenuItem 
                  onClick={() => onBlock(user.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Заблокировать
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
