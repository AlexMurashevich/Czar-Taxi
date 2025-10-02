import { useState } from "react";
import { useParticipants, useWaitlist, useApproveWaitlistEntry, useRejectWaitlistEntry, useBlockUser } from "@/hooks/use-participants";
import { useActiveSeason } from "@/hooks/use-seasons";
import { Header } from "@/components/layout/header";
import { ParticipantCard } from "@/components/participants/participant-card";
import { WaitlistTable } from "@/components/participants/waitlist-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, UserPlus, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Participants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  
  const { data: participants, isLoading: loadingParticipants } = useParticipants();
  const { data: waitlist, isLoading: loadingWaitlist } = useWaitlist();
  const { data: activeSeason } = useActiveSeason();
  
  const approveEntry = useApproveWaitlistEntry();
  const rejectEntry = useRejectWaitlistEntry();
  const blockUser = useBlockUser();
  const { toast } = useToast();

  const handleApprove = async (entryId: number) => {
    try {
      await approveEntry.mutateAsync(entryId);
      toast({
        title: "Заявка одобрена",
        description: "Участник будет добавлен в следующем сезоне",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось одобрить заявку",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (entryId: number) => {
    try {
      await rejectEntry.mutateAsync(entryId);
      toast({
        title: "Заявка отклонена",
        description: "Заявка была отклонена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить заявку",
        variant: "destructive",
      });
    }
  };

  const handleBlock = async (userId: number) => {
    try {
      await blockUser.mutateAsync(userId);
      toast({
        title: "Пользователь заблокирован",
        description: "Пользователь был заблокирован",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось заблокировать пользователя",
        variant: "destructive",
      });
    }
  };

  const filteredParticipants = participants?.filter(participant => {
    const matchesSearch = !searchTerm || 
      participant.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.phone.includes(searchTerm);
    
    return matchesSearch;
  }) || [];

  const newWaitlistEntries = waitlist?.filter(entry => entry.status === 'new') || [];
  const totalParticipants = participants?.length || 0;
  const activeParticipants = participants?.filter(p => p.status === 'active').length || 0;
  const blockedParticipants = participants?.filter(p => p.status === 'blocked').length || 0;

  if (loadingParticipants || loadingWaitlist) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Участники" />
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
        title="Участники" 
        subtitle="Управление участниками и заявками"
        seasonName={activeSeason?.name}
        seasonStatus={activeSeason?.status}
      />

      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-total-participants">
                    {totalParticipants}
                  </div>
                  <div className="text-sm text-muted-foreground">Всего участников</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-active-participants">
                    {activeParticipants}
                  </div>
                  <div className="text-sm text-muted-foreground">Активных</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-waitlist-entries">
                    {newWaitlistEntries.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Новых заявок</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-blocked-participants">
                    {blockedParticipants}
                  </div>
                  <div className="text-sm text-muted-foreground">Заблокированных</div>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="participants" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="participants" data-testid="tab-participants">
                Участники {totalParticipants > 0 && <Badge className="ml-2">{totalParticipants}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="waitlist" data-testid="tab-waitlist">
                Лист ожидания {newWaitlistEntries.length > 0 && <Badge className="ml-2">{newWaitlistEntries.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participants" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени или телефону..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-participants"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Фильтры
                </Button>
              </div>

              {/* Participants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParticipants.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="text-muted-foreground">
                      {searchTerm ? 'Участники не найдены' : 'Участники отсутствуют'}
                    </div>
                  </div>
                ) : (
                  filteredParticipants.map((participant) => (
                    <ParticipantCard
                      key={participant.id}
                      user={participant}
                      onBlock={handleBlock}
                      onMessage={(userId) => console.log('Message user:', userId)}
                      onViewStats={(userId) => console.log('View stats:', userId)}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="waitlist" className="space-y-6">
              <div className="bg-card rounded-lg border border-border elevated-card">
                <div className="border-b border-border px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Заявки на участие</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Новые заявки будут рассмотрены для следующего сезона
                      </p>
                    </div>
                    {newWaitlistEntries.length > 0 && (
                      <Badge className="bg-warning/10 text-warning">
                        {newWaitlistEntries.length} новых
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <WaitlistTable
                    entries={waitlist || []}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isApproving={approveEntry.isPending}
                    isRejecting={rejectEntry.isPending}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
