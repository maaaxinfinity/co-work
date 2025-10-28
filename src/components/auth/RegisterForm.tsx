"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGIONS, REGION_LABELS } from "@/lib/constants/access-control";
import type { Region } from "@/lib/constants/access-control";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [region, setRegion] = useState<Region>(REGIONS[0]);
  const regionOptions = useMemo(() => REGIONS.map((code) => ({ code, label: REGION_LABELS[code] })), []);

  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const getErrorMessage = (error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "error" in error &&
      typeof (error as { error: unknown }).error === "string"
    ) {
      return (error as { error: string }).error;
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email || !password) {
      toast.error("请完整填写信息");
      return;
    }
    if (password.length < 8) {
      toast.error("密码至少 8 位");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email, password, region });
      toast.success("注册成功");
      router.push(redirectTo);
    } catch (error: unknown) {
      console.error(error);
      const message = getErrorMessage(error) ?? "注册失败，请稍后重试";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border border-border/60 bg-background p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">注册账号</h1>
        <p className="text-sm text-muted-foreground">创建团队，与 AI 助手一起提升协作效率</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            昵称 / 团队称呼
          </label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="如：产品团队 A"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            邮箱
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            密码
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 位，建议包含数字与字母"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="region">
            数据区域
          </label>
          <Select value={region} onValueChange={(value) => setRegion(value as Region)}>
            <SelectTrigger id="region">
              <SelectValue placeholder="选择区域" />
            </SelectTrigger>
            <SelectContent>
              {regionOptions.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "创建中..." : "注册并进入"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        已有账号？
        <Link className="ml-1 text-primary hover:underline" href="/auth/login">
          前往登录
        </Link>
      </p>
    </div>
  );
}
