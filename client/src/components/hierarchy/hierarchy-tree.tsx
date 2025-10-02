import { useState } from "react";
import { ChevronDown, ChevronRight, Edit, MoreVertical, Star, Shield, Sword, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HierarchyNode } from "@/lib/types";

interface HierarchyTreeProps {
  hierarchy: HierarchyNode | null;
  onEdit?: (userId: number) => void;
  onMore?: (userId: number) => void;
}

export function HierarchyTree({ hierarchy, onEdit, onMore }: HierarchyTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1])); // Expand tsar by default

  if (!hierarchy) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">Данные иерархии отсутствуют</div>
      </div>
    );
  }

  const toggleNode = (userId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'tsar': return <Star className="h-4 w-4" />;
      case 'sotnik': return <Shield className="h-4 w-4" />;
      case 'desyatnik': return <Sword className="h-4 w-4" />;
      case 'driver': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tsar': return 'bg-gradient-to-br from-secondary to-warning text-white';
      case 'sotnik': return 'bg-primary/20 text-primary';
      case 'desyatnik': return 'bg-accent/20 text-accent';
      case 'driver': return 'bg-muted-foreground/20 text-muted-foreground';
      default: return 'bg-muted-foreground/20 text-muted-foreground';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'tsar': return 'Царь';
      case 'sotnik': return 'Сотник';
      case 'desyatnik': return 'Десятник';
      case 'driver': return 'Водитель';
      default: return role;
    }
  };

  const formatHours = (hours: string | number) => {
    return Math.round(Number(hours)).toLocaleString();
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'text-success';
    if (percent >= 90) return 'text-accent';
    return 'text-warning';
  };

  const isExpanded = (userId: number) => expandedNodes.has(userId);

  return (
    <div className="space-y-2">
      {/* Tsar Level */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-secondary/10 to-warning/10 p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleNode(hierarchy.user.id)}
              className="p-1 h-auto hover:bg-white/50"
            >
              {isExpanded(hierarchy.user.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", getRoleColor(hierarchy.assignment.role))}>
              {getRoleIcon(hierarchy.assignment.role)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground" data-testid={`user-name-${hierarchy.user.id}`}>
                  {hierarchy.user.fullName || 'Участник'}
                </span>
                <Badge className="bg-secondary text-white">
                  {getRoleName(hierarchy.assignment.role)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1" data-testid={`user-phone-${hierarchy.user.id}`}>
                {hierarchy.user.phone}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground" data-testid={`user-hours-${hierarchy.user.id}`}>
                {hierarchy.stats ? formatHours(hierarchy.stats.total) : '0'} ч
              </div>
              {hierarchy.stats && (
                <div className={cn("text-sm", getProgressColor(Number(hierarchy.stats.targetPercent)))}>
                  {Math.round(Number(hierarchy.stats.targetPercent))}% цели
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(hierarchy.user.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onMore && (
                <Button variant="ghost" size="sm" onClick={() => onMore(hierarchy.user.id)}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Centurions under Tsar */}
        {isExpanded(hierarchy.user.id) && hierarchy.centurions && hierarchy.centurions.length > 0 && (
          <div className="pl-16 py-2 bg-muted/30">
            {hierarchy.centurions.slice(0, 10).map((centurion) => (
              <div key={centurion.user.id} className="border-l-2 border-primary/30 ml-6 mb-2">
                <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-r-lg transition-colors">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleNode(centurion.user.id)}
                    className="p-1 h-auto hover:bg-white/50"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getRoleColor(centurion.assignment.role))}>
                    {getRoleIcon(centurion.assignment.role)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground" data-testid={`centurion-name-${centurion.user.id}`}>
                        {centurion.user.fullName || 'Участник'}
                      </span>
                      <Badge className="bg-primary/10 text-primary text-xs">
                        {getRoleName(centurion.assignment.role)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {centurion.user.phone} • {centurion.subordinates || 0} Десятников
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground" data-testid={`centurion-hours-${centurion.user.id}`}>
                      {centurion.stats ? formatHours(centurion.stats.total) : '0'} ч
                    </div>
                    {centurion.stats && (
                      <div className={cn("text-xs", getProgressColor(Number(centurion.stats.targetPercent)))}>
                        {Math.round(Number(centurion.stats.targetPercent))}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {hierarchy.centurions.length > 10 && (
              <div className="text-center py-2">
                <Button variant="ghost" size="sm">
                  + Показать ещё {hierarchy.centurions.length - 10} сотников
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
