import { redirect } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { getSessionUserFromCookies } from "@/lib/server/auth";

export default async function WorkspacePage() {
  const sessionUser = await getSessionUserFromCookies();
  if (!sessionUser) {
    redirect('/auth/login?redirect=/workspace');
  }

  return <WorkspaceLayout />;
}
