import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  iconColor,
  trend,
  className 
}: StatCardProps) {
  return (
    <div className={cn("bg-card rounded-lg border border-border p-6 elevated-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold text-foreground" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{description}</div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            trend.positive ? "text-success" : "text-destructive"
          )}>
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
