"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

export default function SiteHeader() {
  const { status, user } = useAuth();

  const cta = useMemo(() => {
    if (status === "authenticated" && user) {
      return (
        <Button asChild>
          <Link href="/dashboard">进入控制台</Link>
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/auth/login">登录</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/register">注册</Link>
        </Button>
      </div>
    );
  }, [status, user]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 backdrop-blur bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-semibold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            Co-Work 平台
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link className="hover:text-foreground" href="#features">
            功能亮点
          </Link>
          <Link className="hover:text-foreground" href="#solutions">
            解决方案
          </Link>
          <Link className="hover:text-foreground" href="#pricing">
            价格计划
          </Link>
        </nav>
        {cta}
      </div>
    </header>
  );
}
