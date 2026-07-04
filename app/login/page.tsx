import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const user = await getCurrentUser();
  if (user && !invite) redirect("/");
  return <AuthForm mode="login" invite={invite} />;
}
