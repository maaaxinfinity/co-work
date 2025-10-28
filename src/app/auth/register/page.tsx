import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import SiteHeader from "@/components/layout/SiteHeader";
import { getSessionUserFromCookies } from "@/lib/server/auth";

export default async function RegisterPage() {
  const user = await getSessionUserFromCookies();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl justify-center px-4 py-16">
        <RegisterForm />
      </main>
    </div>
  );
}
