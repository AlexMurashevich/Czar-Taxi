import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Calendar, FileText } from "lucide-react";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  type: 'excel' | 'pdf' | 'csv';
  period?: string;
  lastGenerated?: string;
  onGenerate?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  isGenerating?: boolean;
}

export function ReportCard({
  title,
  description,
  icon: Icon,
  iconColor,
  type,
  period,
  lastGenerated,
  onGenerate,
  onView,
  onDownload,
  isGenerating
}: ReportCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'excel': return 'bg-success/10 text-success';
      case 'pdf': return 'bg-destructive/10 text-destructive';
      case 'csv': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'excel': return 'XLSX';
      case 'pdf': return 'PDF';
      case 'csv': return 'CSV';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 elevated-card">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <Badge className={getTypeColor(type)}>
              {getTypeLabel(type)}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {description}
          </p>
          
          {period && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3 w-3" />
              <span>Период: {period}</span>
            </div>
          )}
          
          {lastGenerated && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <FileText className="h-3 w-3" />
              <span>Последнее обновление: {lastGenerated}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {onGenerate && (
              <Button
                size="sm"
                onClick={onGenerate}
                disabled={isGenerating}
                data-testid={`button-generate-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Создание...' : 'Создать отчёт'}
              </Button>
            )}
            
            {onView && lastGenerated && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                data-testid={`button-view-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Просмотреть
              </Button>
            )}
            
            {onDownload && lastGenerated && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                data-testid={`button-download-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Download className="h-4 w-4 mr-2" />
                Скачать
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
