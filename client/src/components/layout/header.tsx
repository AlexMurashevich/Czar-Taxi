import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Upload } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  seasonName?: string;
  seasonStatus?: "active" | "planned" | "closed";
  onRefresh?: () => void;
  onImport?: () => void;
}

export function Header({ 
  title, 
  subtitle, 
  seasonName, 
  seasonStatus = "active",
  onRefresh,
  onImport 
}: HeaderProps) {
  const statusColors = {
    active: "bg-success/10 text-success",
    planned: "bg-warning/10 text-warning", 
    closed: "bg-muted text-muted-foreground"
  };

  const statusLabels = {
    active: "Активен",
    planned: "Запланирован",
    closed: "Завершён"
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">{title}</h2>
          {(subtitle || seasonName) && (
            <div className="flex items-center gap-2 mt-1">
              {subtitle && (
                <span className="text-sm text-muted-foreground">{subtitle}</span>
              )}
              {seasonName && (
                <>
                  <span className="text-sm text-muted-foreground">Текущий сезон:</span>
                  <span className="text-sm font-semibold text-foreground" data-testid="current-season">
                    {seasonName}
                  </span>
                  <Badge className={statusColors[seasonStatus]} data-testid="season-status">
                    {statusLabels[seasonStatus]}
                  </Badge>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={onRefresh}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          )}
          {onImport && (
            <Button onClick={onImport} data-testid="button-import">
              <Upload className="h-4 w-4 mr-2" />
              Импорт XLSX
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
