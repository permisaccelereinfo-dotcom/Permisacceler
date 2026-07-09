import { AdminLoginForm } from "./admin-login-form";

type AdminLoginPageProps = {
  searchParams: Promise<{
    redirectedFrom?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const redirectedFrom =
    params.redirectedFrom?.startsWith("/admin") && params.redirectedFrom !== "/admin/login"
      ? params.redirectedFrom
      : "/admin";

  return <AdminLoginForm redirectedFrom={redirectedFrom} />;
}
