import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserFromCookies } from "@/lib/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { REGIONS, REGION_LABELS, ROLE_LABELS, USER_ROLES } from "@/lib/constants/access-control";
import { desc, asc } from "drizzle-orm";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "--";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('zh-CN', { hour12: false });
}

export default async function AdminUsersPage() {
  const sessionUser = await getSessionUserFromCookies();
  if (!sessionUser || sessionUser.role !== 'admin') {
    redirect('/dashboard');
  }

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      region: users.region,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(asc(users.region), asc(users.role), desc(users.createdAt));

  const totals = USER_ROLES.reduce<Record<string, number>>((acc, role) => {
    acc[role] = userRows.filter((row) => row.role === role).length;
    return acc;
  }, {});

  const regionMap = REGIONS.map((region) => ({
    region,
    users: userRows.filter((row) => row.region === region),
  })).filter((entry) => entry.users.length > 0);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">用户管理</h1>
        <p className="text-sm text-muted-foreground">查看全局用户列表、角色分布与最近登录信息。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">角色概览</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {USER_ROLES.map((role) => (
            <div key={role} className="rounded-md border border-border/60 p-3 text-sm">
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totals[role]}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {regionMap.map(({ region, users: entries }) => (
        <Card key={region} className="border-border/70">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{REGION_LABELS[region]}</CardTitle>
              <p className="text-sm text-muted-foreground">共 {entries.length} 名成员</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
              <span className="col-span-3">姓名 / 邮箱</span>
              <span className="col-span-2">角色</span>
              <span className="col-span-3">创建时间</span>
              <span className="col-span-3">最近登录</span>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              {entries.map((user) => (
                <div key={user.id} className="grid grid-cols-12 items-center rounded-md border border-border/40 p-3">
                  <div className="col-span-3 space-y-1">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={user.role === 'operator' ? 'secondary' : 'outline'}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </div>
                  <div className="col-span-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</div>
                  <div className="col-span-3 text-xs text-muted-foreground">{formatDate(user.lastLoginAt)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
