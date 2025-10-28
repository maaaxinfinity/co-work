import { redirect } from "next/navigation";
import { db } from "@/db";
import { files, messages, projects, users } from "@/db/schema";
import { getSessionUserFromCookies } from "@/lib/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { REGION_LABELS, REGIONS, ROLE_LABELS, USER_ROLES } from "@/lib/constants/access-control";

const ROLE_ORDER = [...USER_ROLES];

async function getDashboardData() {
  const [projectCountRow] = await db.select({ count: sql<number>`count(*)` }).from(projects);
  const [teamFileCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(files)
    .where(eq(files.ownerType, 'team'));
  const [messageCountRow] = await db.select({ count: sql<number>`count(*)` }).from(messages);

  const recentProjects = await db
    .select({ id: projects.id, name: projects.name, status: projects.status, updatedAt: projects.updatedAt })
    .from(projects)
    .orderBy(desc(projects.updatedAt))
    .limit(5);

  const recentFiles = await db
    .select({
      id: files.id,
      name: files.name,
      ownerType: files.ownerType,
      status: files.status,
      modifiedAt: files.modifiedAt,
    })
    .from(files)
    .orderBy(desc(files.modifiedAt))
    .limit(5);

  const recentMessages = await db
    .select({ id: messages.id, content: messages.content, createdAt: messages.createdAt, role: messages.role })
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(5);

  const roleOverview = await db
    .select({ region: users.region, role: users.role, count: sql<number>`count(*)` })
    .from(users)
    .groupBy(users.region, users.role)
    .orderBy(users.region, users.role);

  return {
    stats: {
      projectCount: projectCountRow?.count ?? 0,
      teamFileCount: teamFileCountRow?.count ?? 0,
      messageCount: messageCountRow?.count ?? 0,
    },
    recentProjects,
    recentFiles,
    recentMessages,
    roleOverview,
  };
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "--";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('zh-CN', { hour12: false });
}

export default async function DashboardPage() {
  const sessionUser = await getSessionUserFromCookies();
  if (!sessionUser) {
    redirect('/auth/login?redirect=/dashboard');
  }

  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">欢迎回来，{sessionUser.name}</h1>
        <p className="text-sm text-muted-foreground">这里是你的团队控制台，快速浏览协作进度与最新活动。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">项目总数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.stats.projectCount}</p>
            <p className="text-xs text-muted-foreground mt-1">包含团队与个人项目</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">团队文件</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.stats.teamFileCount}</p>
            <p className="text-xs text-muted-foreground mt-1">当前所有团队空间内的文件数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI 对话次数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.stats.messageCount}</p>
            <p className="text-xs text-muted-foreground mt-1">聊天记录中包含用户与 AI 的对话</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">最新项目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentProjects.length === 0 && (
              <p className="text-sm text-muted-foreground">还没有项目，快去创建一个吧。</p>
            )}
            {data.recentProjects.map((project) => (
              <div key={project.id} className="rounded-md border border-border/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">最后更新 {formatDate(project.updatedAt)}</p>
                  </div>
                  <Badge variant={project.status === 'unsaved' ? 'outline' : 'secondary'}>{project.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">最新消息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentMessages.length === 0 && (
              <p className="text-sm text-muted-foreground">暂无聊天消息。</p>
            )}
            {data.recentMessages.map((message) => (
              <div key={message.id} className="rounded-md border border-border/60 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant={message.role === 'assistant' ? 'secondary' : 'outline'}>
                    {message.role === 'assistant' ? 'AI' : '用户'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                </div>
                <p className="line-clamp-3 text-muted-foreground">{message.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">区域角色分布</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.roleOverview.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无角色数据。</p>
          )}
          {REGIONS.map((region) => {
            const rows = data.roleOverview
              .filter((item) => item.region === region)
              .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
            if (rows.length === 0) return null;
            return (
              <div key={region} className="rounded-lg border border-border/60 p-4">
                <p className="text-sm font-medium text-foreground mb-3">
                  {REGION_LABELS[region] ?? region}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {rows.map((row) => (
                    <div key={`${region}-${row.role}`} className="rounded-md border border-border/60 p-3 text-sm">
                      <p className="text-xs uppercase text-muted-foreground">
                        {ROLE_LABELS[row.role] ?? row.role}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{row.count}</p>
                      <p className="text-xs text-muted-foreground">成员数</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">最新文件</CardTitle>
            <p className="text-sm text-muted-foreground">查看最近有更新的文档并快速打开。</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/workspace">前往工作区</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/60 text-sm">
            {data.recentFiles.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">暂无文件更新记录。</p>
            )}
            {data.recentFiles.map((file) => (
              <div key={file.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{file.ownerType === 'team' ? '团队文件' : '个人文件'}</span>
                    <span>状态: {file.status}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(file.modifiedAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-foreground">下一步操作建议</p>
          <p>前往工作区继续编辑文档，或邀请成员加入团队提升协作效率。</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/workspace">打开工作区</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard?tab=members">管理成员</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
