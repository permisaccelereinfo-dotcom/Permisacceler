import { DashboardHeader } from "./dashboard-header";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
