import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  CalendarRange,
  Clock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useGetCallerUserProfile } from "../../hooks/useCurrentUser";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

interface MobileLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/planning", label: "Planning", icon: CalendarRange },
  { path: "/timesheet", label: "Heures", icon: Clock },
  { path: "/facturation", label: "Facturation", icon: FileText },
  { path: "/technical-folder", label: "Technique", icon: FolderOpen },
];

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userProfile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/login" });
  };

  const isActive = (path: string) => {
    if (path === "/clients") {
      return (
        location.pathname === "/clients" ||
        location.pathname.startsWith("/clients/")
      );
    }
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/vial-traite-logo-transparent.dim_400x200.png"
              alt="Vial Traite Service"
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            {userProfile && (
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {userProfile.name}
              </span>
            )}
            {identity && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="text-muted-foreground hover:text-destructive"
                      data-ocid="nav.logout_button"
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Se déconnecter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="flex items-center justify-around h-16 px-1 overflow-x-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              type="button"
              key={path}
              data-ocid="nav.link"
              onClick={() => navigate({ to: path })}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2 rounded-xl transition-colors flex-shrink-0 min-w-0",
                isActive(path)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-tight text-center whitespace-nowrap">
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
