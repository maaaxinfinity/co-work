import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Users, Workflow } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const featureList = [
  {
    icon: Sparkles,
    title: "AI 协作助手",
    description: "引用上下文文件、自动生成总结与任务，让团队沟通更高效。",
  },
  {
    icon: Users,
    title: "多角色协同",
    description: "团队/个人工作区隔离，权限安全可控，随时邀请伙伴加入。",
  },
  {
    icon: Workflow,
    title: "一体化文档工作流",
    description: "文档编辑、版本对比、评论审校、任务跟踪一站式完成。",
  },
  {
    icon: ShieldCheck,
    title: "企业级安全",
    description: "基于角色访问控制、审计日志与区域隔离，保证数据可靠性。",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 pb-24 pt-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              新一代 AI 文档协同平台
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              让团队在同一个工作区里<strong className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">创造、审阅、发布</strong>
            </h1>
            <p className="text-lg text-muted-foreground">
              Co-Work 将 Chat、文件管理、文档编辑与智能助手整合为一个统一平台，帮助产品团队、内容团队和客户成功团队快速完成跨部门协作。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/auth/register">
                  立即免费试用
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">已有账号？立即登录</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>· 支持 Markdown / DOCX / TXT</span>
              <span>· AI 评论与任务流</span>
              <span>· 团队工作区权限管理</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-6 shadow-lg">
            <div className="space-y-6">
              <div className="rounded-xl bg-background p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-muted-foreground">实时协作</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  查看 AI 助手自动生成的行动项、快速引用团队文件、从版本历史中恢复文档。
                </p>
                <div className="mt-4 grid gap-3 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2">
                    <span>AI 任务: 校对文档</span>
                    <span className="text-green-500">完成</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2">
                    <span>评论: 需要添加案例</span>
                    <span className="text-primary">未处理</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2">
                    <span>最近文件: 团队方案.md</span>
                    <span>1 小时前</span>
                  </div>
                </div>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">一键访问控制台</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>切换到 Dashboard 管理项目、查看 AI 洞察与最近活动。</p>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/dashboard">进入控制台</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-10">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold">核心功能组合</h2>
            <p className="text-muted-foreground">
              从项目管理到多格式编辑，帮助团队在一个平台完成从想法到交付的全流程。
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featureList.map((feature) => (
              <Card key={feature.title} className="border-border/70">
                <CardHeader className="flex-row items-center gap-3 pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="solutions" className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">跨团队解决方案</h2>
            <p className="text-muted-foreground">
              产品经理、运营、销售、客户成功在同一个实时空间里协作。通过角色与空间隔离，既共享知识又确保安全。
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• 产品 PRD 与需求评审同步推进</li>
              <li>• 市场团队沉淀素材库与话术脚本</li>
              <li>• 客户成功团队管理会议纪要与待办</li>
            </ul>
          </div>
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CardContent className="space-y-4 p-6">
              <h3 className="text-xl font-semibold">AI 工作台</h3>
              <p className="text-sm text-muted-foreground">
                根据上下文文件自动生成总结、行动项与风险提醒，让团队在会议结束前就明确下一步计划。
              </p>
              <div className="rounded-lg border border-primary/20 bg-background p-4 text-xs text-muted-foreground">
                <p className="font-medium text-primary">AI 摘要</p>
                <p className="mt-1">
                  本周发布任务进展顺利，但仍需补充部署文档和用户引导视频。建议安排一次跨部门同步会议。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="pricing" className="space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold">灵活价格策略</h2>
            <p className="text-muted-foreground">按团队规模与安全需求选择方案，可随时拓展。</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "Starter", price: "免费", desc: "适合个人或 2-3 人小组，享受基础编辑与 AI 助手" },
              { title: "Team", price: "¥99/席位/月", desc: "团队文件夹、审批流与自定义角色" },
              { title: "Enterprise", price: "定制报价", desc: "SAML SSO、审计日志、专属成功顾问" },
            ].map((plan) => (
              <Card key={plan.title} className="flex flex-col border-border/70">
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between space-y-6 text-sm text-muted-foreground">
                  <p>{plan.desc}</p>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{plan.price}</p>
                    <Button asChild className="mt-3 w-full">
                      <Link href="/auth/register">开始使用</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Co-Work. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              用户协议
            </Link>
            <Link href="mailto:support@example.com" className="hover:text-foreground">
              联系我们
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
