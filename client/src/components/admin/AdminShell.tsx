import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3, Bell, BookOpen, BriefcaseBusiness, ChevronRight, LayoutDashboard,
  LogOut, Mail, Menu, MessageSquare, Settings, ShieldCheck, Users, Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomAuth } from "@/hooks/useCustomAuth";

const navigation = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard, permission: "analytics.read", live: true },
  { label: "Content", path: "/admin/content", icon: BookOpen, permission: "content.read", live: true },
  { label: "Portfolio", path: "/admin/portfolio", icon: BriefcaseBusiness, permission: "portfolio.read", live: true },
  { label: "Contacts", path: "/admin/contacts", icon: MessageSquare, permission: "leads.read", live: true },
  { label: "Pipeline", path: "/admin/pipeline", icon: Workflow, permission: "leads.read", live: true },
  { label: "Audience", path: "/admin/audience", icon: Users, permission: "email.delivery.read", live: true },
  { label: "Communications", path: "/admin/communications", icon: Mail, permission: "email.delivery.read", live: true },
  { label: "Notifications", icon: Bell, permission: "notifications.read" },
  { label: "Analytics", path: "/analytics", icon: BarChart3, permission: "analytics.read", live: true },
  { label: "Security", path: "/admin/security", icon: ShieldCheck, permission: "security.events.read", live: true },
  { label: "Users & roles", path: "/admin/users", icon: Settings, permission: "users.manage", live: true },
];

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { user } = useCustomAuth();
  const permissions = new Set(user?.permissions ?? []);
  const permissionAware = permissions.size > 0;
  return <nav className="space-y-1 p-3">
    {navigation.filter(item => !permissionAware || permissions.has(item.permission)).map(item => {
      const Icon = item.icon;
      const active = item.path === "/admin" ? location === "/admin" : Boolean(item.path && location.startsWith(item.path));
      const contents = <div className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary/15 text-white" : item.live ? "text-white/60 hover:bg-white/[0.05] hover:text-white" : "cursor-not-allowed text-white/25"}`}>
        <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
        <span className="flex-1 font-medium">{item.label}</span>
        {!item.live && <span className="text-[9px] font-mono uppercase text-white/25">Next</span>}
        {active && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
      </div>;
      return item.path ? <Link key={item.label} href={item.path} onClick={onNavigate}>{contents}</Link> : <div key={item.label}>{contents}</div>;
    })}
  </nav>;
}

export function AdminShell({ children, title, description }: { children: ReactNode; title: string; description?: string }) {
  const [, navigate] = useLocation();
  const { user, isAdmin, isLoading, logout, logoutPending } = useCustomAuth();
  useEffect(() => {
    if (!isLoading && !isAdmin) navigate("/login");
  }, [isAdmin, isLoading, navigate]);
  if (isLoading) return <div className="min-h-screen bg-[#080a12] p-8"><Skeleton className="h-[85vh] w-full" /></div>;
  if (!isAdmin) return null;
  const initials = user?.email.slice(0, 2).toUpperCase() ?? "CM";
  return <div className="min-h-screen bg-[#080a12] text-white">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.07] bg-[#0b0e18] lg:flex lg:flex-col">
      <Link href="/admin"><div className="border-b border-white/[0.07] p-5">
        <div className="font-black tracking-tight">CHRIS<span className="text-primary">PINE</span></div>
        <div className="mt-1 text-[10px] font-mono tracking-[0.18em] text-white/35">ADMIN COMMAND</div>
      </div></Link>
      <div className="flex-1 overflow-y-auto"><AdminNavigation /></div>
      <div className="border-t border-white/[0.07] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</div>
          <div className="min-w-0"><p className="truncate text-xs font-medium">{user?.email}</p><p className="text-[10px] text-emerald-400">Authenticated</p></div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-white/45 hover:text-white" disabled={logoutPending} onClick={() => { logout(); navigate("/login"); }}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
      </div>
    </aside>
    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.07] bg-[#080a12]/90 px-4 backdrop-blur-xl sm:px-6">
        <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="w-72 border-white/[0.07] bg-[#0b0e18] p-0"><div className="border-b border-white/[0.07] p-5 font-black">ADMIN <span className="text-primary">COMMAND</span></div><AdminNavigation /></SheetContent></Sheet>
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>{description && <p className="hidden truncate text-xs text-white/35 sm:block">{description}</p>}</div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-mono text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />SYSTEM ONLINE</div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
