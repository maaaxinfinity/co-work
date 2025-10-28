"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, PanelsTopLeft, Users2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { REGION_LABELS, ROLE_LABELS } from "@/lib/constants/access-control";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const navItems = useMemo(() => {
    const items = [
      { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
      { href: "/workspace", label: "工作区", icon: PanelsTopLeft },
    ];
    if (user?.role === 'admin') {
      items.push({ href: "/admin/users", label: "用户管理", icon: Users2 });
    }
    return items;
  }, [user?.role]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("已退出登录");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("退出登录失败");
    }
  };

  const isWorkspaceRoute = pathname?.startsWith('/workspace');

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-base font-semibold">
            Co-Work 控制台
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                    active ? "bg-primary/10 text-primary" : "hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user?.name ?? "未登录"}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
              {user?.role && (
                <p className="text-xs text-muted-foreground">角色：{ROLE_LABELS[user.role] ?? user.role}</p>
              )}
              {user?.region && (
                <p className="text-xs text-muted-foreground">
                  区域：{REGION_LABELS[user.region] ?? user.region}
                </p>
              )}
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className={cn('flex-1', isWorkspaceRoute ? 'overflow-hidden' : '')}>
        {isWorkspaceRoute ? (
          <div className="h-full w-full">{children}</div>
        ) : (
          <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
        )}
      </main>
    </div>
  );
}
