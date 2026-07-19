import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  MessageSquare,
  Settings,
  CreditCard,
  Menu,
  X,
  LogOut,
  Search,
  ChevronDown,
  Sparkles,
  Briefcase,
  UserCheck,
  Landmark,
  KanbanSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { toast } from "sonner";
import { AlertsDropdown } from "./AlertsDropdown";
import { LocaleSwitcher } from "./LocaleSwitcher";

const navigationItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "clients", href: "/dashboard/clients", icon: Users },
  { key: "contracts", href: "/dashboard/contracts", icon: FileText },
  { key: "positions", href: "/dashboard/positions", icon: Briefcase },
  { key: "employees", href: "/dashboard/employees", icon: UserCheck },
  { key: "financial", href: "/dashboard/financial", icon: Wallet },
  { key: "crm", href: "/dashboard/crm", icon: KanbanSquare },
  { key: "conciliation", href: "/dashboard/conciliation", icon: Landmark },
  { key: "reports_ai", href: "/dashboard/reports", icon: Sparkles },
  { key: "support", href: "/dashboard/support", icon: MessageSquare },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
  { key: "plans", href: "/dashboard/plans", icon: CreditCard },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut, subscription } = useAuth();
  const { t } = useLocale();

  // Check for test mode query param
  const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("logout_success"));
    navigate("/login");
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.company_name) {
      return user.user_metadata.company_name;
    }
    return user?.email?.split("@")[0] || "Usuário";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <Logo size="sm" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary shadow-nexa-glow-sm"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                  {t(item.key)}
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-sidebar-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Subscription Badge */}
          {subscription.planName && (
            <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">{t("current_plan")}</p>
              <p className="text-sm font-medium text-primary">{subscription.planName}</p>
            </div>
          )}

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/30">
              <div className="h-10 w-10 rounded-full bg-nexa-gradient flex items-center justify-center text-sm font-bold text-primary-foreground">
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Left: Menu + Search */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-muted-foreground w-64">
                <Search className="h-4 w-4" />
                <input
                  type="text"
                  placeholder={t("search")}
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
                />
                <kbd className="text-xs bg-background px-1.5 py-0.5 rounded">⌘K</kbd>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <AlertsDropdown />

              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors">
                <div className="h-8 w-8 rounded-full bg-nexa-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {getUserInitials()}
                </div>
                <span className="text-sm font-medium">{getDisplayName()}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
