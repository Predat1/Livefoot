import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAdminRealtime } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
  Cpu,
  CreditCard,
  ScrollText,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";

const ADMIN_EMAIL = "Mobifranck310@gmail.com";

const navigation = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Utilisateurs", path: "/admin/users", icon: Users },
  { name: "Contenu", path: "/admin/content", icon: FileText },
  { name: "IA & Prédictions", path: "/admin/ai", icon: Cpu },
  { name: "Monetisation", path: "/admin/monetization", icon: CreditCard },
  { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { name: "Logs", path: "/admin/logs", icon: ScrollText },
  { name: "Configuration", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  
  // Activate real-time admin listener channels
  useAdminRealtime();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is the specific admin
  const isSuperAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (!roleLoading && !authLoading && user && !isAdmin && !isSuperAdmin) {
      toast.error("Accès refusé. Vous n'avez pas les droits administrateur.");
      navigate("/", { replace: true });
    }
  }, [authLoading, user, isAdmin, isSuperAdmin, navigate, roleLoading]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-black text-white text-sm whitespace-nowrap">LiveFoot</h1>
                <p className="text-[10px] text-slate-400 whitespace-nowrap">Admin Panel</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                  !sidebarOpen && "justify-center"
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
                {isActive && sidebarOpen && (
                  <ChevronRight className="h-4 w-4 ml-auto text-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full justify-center lg:justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            {sidebarOpen ? (
              <>
                <X className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Réduire</span>
              </>
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-center lg:justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Déconnexion</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800">
            <div className="h-16 flex items-center px-4 border-b border-slate-800">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-black text-white text-sm">LiveFoot</h1>
                  <p className="text-[10px] text-slate-400">Admin Panel</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-slate-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="py-4 px-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-slate-400 hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-slate-400"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                <span className="text-slate-500">Admin</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-slate-200 capitalize">
                  {navigation.find(n => location.pathname.startsWith(n.path))?.name || "Dashboard"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>
              <div className="h-8 w-px bg-slate-700 mx-1" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {user?.email?.charAt(0).toUpperCase() || "A"}
                  </span>
                </div>
                <span className="hidden md:block text-sm text-slate-300">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
