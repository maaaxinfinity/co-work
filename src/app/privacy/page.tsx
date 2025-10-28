import SiteHeader from "@/components/layout/SiteHeader";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 space-y-6 text-sm text-muted-foreground">
        <h1 className="text-3xl font-semibold text-foreground">隐私政策</h1>
        <p>
          Co-Work 承诺保护您的个人信息安全。我们仅会在提供协作服务所必需的范围内收集和处理数据，包括账号信息、协作文件元数据以及 AI 使用记录。
        </p>
        <p>
          所有内容默认存储在受控的数据库实例中，并提供最小化访问权限策略。您可以随时联系 support@example.com 请求导出或删除账号数据。
        </p>
        <p>如本政策有重大调整，我们将提前通过站内公告或邮件通知。</p>
      </main>
    </div>
  );
}
