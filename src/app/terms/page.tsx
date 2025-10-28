import SiteHeader from "@/components/layout/SiteHeader";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 space-y-6 text-sm text-muted-foreground">
        <h1 className="text-3xl font-semibold text-foreground">用户协议</h1>
        <p>
          使用 Co-Work 平台即表示您认可并遵守以下条款：
        </p>
        <ol className="list-decimal space-y-3 pl-6">
          <li>您须对上传的内容和协作活动负责，确保其合法、合规且不侵犯第三方权益。</li>
          <li>平台提供的 AI 能力仅作为辅助建议，请在发布前进行人工审核。</li>
          <li>我们可能根据产品更新调整功能，重大变更前会提前通知。</li>
        </ol>
        <p>如有疑问，请随时联系 support@example.com。</p>
      </main>
    </div>
  );
}
