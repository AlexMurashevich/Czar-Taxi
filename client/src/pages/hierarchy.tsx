import { useActiveSeason } from "@/hooks/use-seasons";
import { useHierarchy } from "@/hooks/use-hierarchy";
import { Header } from "@/components/layout/header";
import { HierarchyTree } from "@/components/hierarchy/hierarchy-tree";
import { Button } from "@/components/ui/button";
import { Filter, ExpandIcon } from "lucide-react";

export default function Hierarchy() {
  const { data: activeSeason } = useActiveSeason();
  const { data: hierarchy, isLoading } = useHierarchy(activeSeason?.id || 0);

  const handleEdit = (userId: number) => {
    console.log('Edit user:', userId);
  };

  const handleMore = (userId: number) => {
    console.log('More actions for user:', userId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Иерархия участников" />
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
        title="Иерархия участников" 
        subtitle="Структура команд и подчинённость"
        seasonName={activeSeason?.name}
        seasonStatus={activeSeason?.status}
      />

      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Структура иерархии</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeSeason ? `Сезон: ${activeSeason.name}` : 'Нет активного сезона'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Фильтры
              </Button>
              <Button variant="outline">
                <ExpandIcon className="h-4 w-4 mr-2" />
                Развернуть все
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border elevated-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Дерево иерархии</h3>
            </div>
            
            <div className="p-6">
              {!activeSeason ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Нет активного сезона для отображения иерархии</div>
                </div>
              ) : (
                <HierarchyTree
                  hierarchy={hierarchy?.tsar || null}
                  onEdit={handleEdit}
                  onMore={handleMore}
                />
              )}
            </div>
          </div>

          {/* Role Statistics */}
          {activeSeason && hierarchy && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary to-warning rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">👑</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">1</div>
                    <div className="text-sm text-muted-foreground">Царь</div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-primary text-sm">🛡️</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {hierarchy.tsar.centurions?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Сотников</div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                    <span className="text-accent text-sm">⚔️</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {hierarchy.tsar.centurions?.reduce((sum, c) => sum + (c.subordinates || 0), 0) || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Десятников</div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">👤</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">---</div>
                    <div className="text-sm text-muted-foreground">Водителей</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
