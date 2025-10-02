import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Car, BarChart3, Calendar, Upload, Users, TreePine, Trophy, Shield, FileText, Settings, MessageCircle, Bell } from "lucide-react";

const navigation = [
  { name: "Обзор", href: "/", icon: BarChart3 },
  { name: "Сезоны", href: "/seasons", icon: Calendar },
  { name: "Импорт данных", href: "/import", icon: Upload },
  { name: "Иерархия", href: "/hierarchy", icon: TreePine },
  { name: "Рейтинги", href: "/leaderboards", icon: Trophy },
  { name: "Участники", href: "/participants", icon: Users },
  { name: "Антифрод", href: "/fraud", icon: Shield, badge: 3 },
  { name: "Отчёты", href: "/reports", icon: FileText },
  { name: "Аналитика", href: "/analytics", icon: BarChart3 },
  { name: "Уведомления", href: "/notifications", icon: Bell },
];

const settings = [
  { name: "Конфигурация", href: "/settings", icon: Settings },
  { name: "Telegram бот", href: "/telegram", icon: MessageCircle },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Царь Такси</h1>
            <p className="text-xs text-muted-foreground">Админ Панель</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid={`nav-${item.href.slice(1) || 'dashboard'}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-destructive text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="px-3 mt-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Настройки
            </div>
            {settings.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid={`nav-${item.href.slice(1)}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              АД
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">Администратор</div>
              <div className="text-xs text-muted-foreground">Admin</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
