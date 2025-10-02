import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { LoginModal } from "@/components/layout/login-modal";
import { useAutoLogin } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Seasons from "@/pages/seasons";
import Import from "@/pages/import";
import Hierarchy from "@/pages/hierarchy";
import Leaderboards from "@/pages/leaderboards";
import Participants from "@/pages/participants";
import Fraud from "@/pages/fraud";
import Reports from "@/pages/reports";
import Analytics from "@/pages/analytics";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAdmin, requiresAuth, loading, refetch } = useAutoLogin();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      </div>
    );
  }

  const showLoginModal = requiresAuth && !isAdmin;

  return (
    <>
      <LoginModal open={showLoginModal} onLoginSuccess={refetch} />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="ml-64 flex-1 sidebar-transition">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/seasons" component={Seasons} />
            <Route path="/import" component={Import} />
            <Route path="/hierarchy" component={Hierarchy} />
            <Route path="/leaderboards" component={Leaderboards} />
            <Route path="/participants" component={Participants} />
            <Route path="/fraud" component={Fraud} />
            <Route path="/reports" component={Reports} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/notifications" component={Notifications} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
