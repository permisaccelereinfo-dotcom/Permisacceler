import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Eye,
  FileText,
  Mail,
  Phone,
  Save,
  Search,
  Shield,
  ToggleLeft,
  ToggleRight,
  UserCog,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import type { Database } from "@/lib/supabase/database.types";
import {
  updateAlertActive,
  updateAutoEcoleCommission,
  updateAutoEcoleVerification,
  updateBookingStatus,
  updateStageAvailability,
  updateStageStatus,
  updateUserRole,
} from "./actions";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AutoEcoleRow = Database["public"]["Tables"]["auto_ecoles"]["Row"];
type StageRow = Database["public"]["Tables"]["stages"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];

type AdminView = "overview" | "bookings" | "auto-ecoles" | "stages" | "users" | "alerts";

type AutoEcoleAdminRow = AutoEcoleRow & {
  user: Pick<UserRow, "name" | "email"> | null;
};

type StageAdminRow = StageRow & {
  auto_ecole: Pick<AutoEcoleRow, "id" | "name" | "city" | "region"> | null;
};

type BookingAdminRow = BookingRow & {
  user: Pick<UserRow, "name" | "email" | "phone"> | null;
  stage:
    | (Pick<
        StageRow,
        "id" | "title" | "start_date" | "end_date" | "license_type" | "stage_type"
      > & {
        auto_ecole: Pick<AutoEcoleRow, "id" | "name" | "city"> | null;
      })
    | null;
};

type RevenueRow = Pick<BookingRow, "status" | "total_price" | "payment_status">;

type AdminPageProps = {
  searchParams: Promise<{
    view?: string;
    q?: string;
  }>;
};

const views: AdminView[] = ["overview", "bookings", "auto-ecoles", "stages", "users", "alerts"];

const navItems: Array<{ view: AdminView; label: string; Icon: LucideIcon }> = [
  { view: "overview", label: "Vue globale", Icon: Activity },
  { view: "bookings", label: "Reservations", Icon: FileText },
  { view: "auto-ecoles", label: "Auto-ecoles", Icon: Building2 },
  { view: "stages", label: "Stages", Icon: CalendarDays },
  { view: "users", label: "Utilisateurs", Icon: Users },
  { view: "alerts", label: "Alertes", Icon: Bell },
];

const bookingStatusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  cancelled: "Annulee",
  completed: "Terminee",
};

const paymentStatusLabels: Record<string, string> = {
  pending_deposit: "Depot attendu",
  deposit_paid: "Depot paye",
  fully_paid: "Payee",
};

const roleLabels: Record<string, string> = {
  student: "Eleve",
  auto_ecole: "Auto-ecole",
  admin: "Admin",
};

function normalizeView(value: string | undefined): AdminView {
  return views.includes(value as AdminView) ? (value as AdminView) : "overview";
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value: number | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} EUR`;
}

function includesTerm(term: string, ...values: Array<string | number | boolean | null | undefined>) {
  if (!term) {
    return true;
  }

  const normalizedTerm = term.toLowerCase();
  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedTerm));
}

function badgeClass(status: string) {
  switch (status) {
    case "confirmed":
    case "active":
    case "fully_paid":
    case "admin":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
    case "pending_deposit":
    case "auto_ecole":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "completed":
    case "deposit_paid":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${badgeClass(value)}`}>
      {label ?? bookingStatusLabels[value] ?? paymentStatusLabels[value] ?? roleLabels[value] ?? value}
    </span>
  );
}

function StatTile({
  label,
  value,
  detail,
  Icon,
}: {
  label: string;
  value: string;
  detail: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className="rounded-md bg-slate-100 p-2 text-slate-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function EmptyRows({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center px-4 py-12 text-sm text-slate-500">
      {label}
    </div>
  );
}

function IconSubmitButton({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      title={title}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { supabase, profile } = await requireAdmin();
  const params = await searchParams;
  const activeView = normalizeView(params.view);
  const query = params.q?.trim() ?? "";

  const [
    usersResult,
    autoEcolesResult,
    stagesResult,
    bookingsResult,
    alertsResult,
    revenueResult,
    userCountResult,
    autoEcoleCountResult,
    stageCountResult,
    bookingCountResult,
    alertCountResult,
    reviewCountResult,
  ] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }).limit(200),
    supabase
      .from("auto_ecoles")
      .select("*, user:user_id (name, email)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("stages")
      .select("*, auto_ecole:auto_ecole_id (id, name, city, region)")
      .order("start_date", { ascending: false })
      .limit(200),
    supabase
      .from("bookings")
      .select(
        `
          *,
          user:user_id (name, email, phone),
          stage:stage_id (
            id,
            title,
            start_date,
            end_date,
            license_type,
            stage_type,
            auto_ecole:auto_ecole_id (id, name, city)
          )
        `
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("bookings").select("status, total_price, payment_status"),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("auto_ecoles").select("id", { count: "exact", head: true }),
    supabase.from("stages").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("alerts").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ]);

  const users = (usersResult.data ?? []) as UserRow[];
  const autoEcoles = (autoEcolesResult.data ?? []) as unknown as AutoEcoleAdminRow[];
  const stages = (stagesResult.data ?? []) as unknown as StageAdminRow[];
  const bookings = (bookingsResult.data ?? []) as unknown as BookingAdminRow[];
  const alerts = (alertsResult.data ?? []) as AlertRow[];
  const revenueRows = (revenueResult.data ?? []) as RevenueRow[];

  const paidRevenue = revenueRows
    .filter((booking) => booking.status === "confirmed" || booking.status === "completed")
    .reduce((total, booking) => total + Number(booking.total_price ?? 0), 0);

  const pendingBookings = revenueRows.filter((booking) => booking.status === "pending").length;
  const unverifiedSchools = autoEcoles.filter((autoEcole) => !autoEcole.is_verified).length;
  const activeAlerts = alerts.filter((alert) => alert.is_active).length;

  const filteredUsers = users.filter((user) =>
    includesTerm(query, user.name, user.email, user.phone, user.role)
  );
  const filteredAutoEcoles = autoEcoles.filter((autoEcole) =>
    includesTerm(
      query,
      autoEcole.name,
      autoEcole.city,
      autoEcole.region,
      autoEcole.email,
      autoEcole.phone,
      autoEcole.user?.name,
      autoEcole.user?.email
    )
  );
  const filteredStages = stages.filter((stage) =>
    includesTerm(
      query,
      stage.title,
      stage.stage_type,
      stage.license_type,
      stage.status,
      stage.auto_ecole?.name,
      stage.auto_ecole?.city
    )
  );
  const filteredBookings = bookings.filter((booking) =>
    includesTerm(
      query,
      booking.user?.name,
      booking.user?.email,
      booking.user?.phone,
      booking.stage?.title,
      booking.stage?.auto_ecole?.name,
      booking.status,
      booking.payment_status,
      booking.id
    )
  );
  const filteredAlerts = alerts.filter((alert) =>
    includesTerm(query, alert.name, alert.email, alert.phone, alert.city, alert.license_type)
  );

  const tabHref = (view: AdminView) => {
    const search = new URLSearchParams({ view });
    if (query) {
      search.set("q", query);
    }
    return `/admin?${search.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-normal text-slate-950">Administration</h1>
                <p className="text-sm text-slate-500">{profile.name || profile.email}</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              Voir le site
            </Link>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map(({ view, label, Icon }) => {
                const isActive = activeView === view;
                return (
                  <Link
                    key={view}
                    href={tabHref(view)}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <form className="relative w-full lg:max-w-sm">
              <input type="hidden" name="view" value={activeView} />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Rechercher..."
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
              />
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Revenu confirme"
            value={formatMoney(paidRevenue)}
            detail={`${bookingCountResult.count ?? 0} reservations au total`}
            Icon={CircleDollarSign}
          />
          <StatTile
            label="Utilisateurs"
            value={`${userCountResult.count ?? 0}`}
            detail={`${autoEcoleCountResult.count ?? 0} auto-ecoles, ${reviewCountResult.count ?? 0} avis`}
            Icon={Users}
          />
          <StatTile
            label="A traiter"
            value={`${pendingBookings + unverifiedSchools}`}
            detail={`${pendingBookings} paiements en attente, ${unverifiedSchools} ecoles non validees`}
            Icon={Clock}
          />
          <StatTile
            label="Offre active"
            value={`${stageCountResult.count ?? 0}`}
            detail={`${activeAlerts} alertes actives, ${alertCountResult.count ?? 0} alertes au total`}
            Icon={CalendarDays}
          />
        </div>

        {activeView === "overview" ? (
          <OverviewPanel
            bookings={filteredBookings.slice(0, 8)}
            autoEcoles={filteredAutoEcoles.filter((autoEcole) => !autoEcole.is_verified).slice(0, 8)}
            alerts={filteredAlerts.filter((alert) => alert.is_active).slice(0, 8)}
          />
        ) : null}

        {activeView === "bookings" ? <BookingsTable bookings={filteredBookings} /> : null}
        {activeView === "auto-ecoles" ? <AutoEcolesTable autoEcoles={filteredAutoEcoles} /> : null}
        {activeView === "stages" ? <StagesTable stages={filteredStages} /> : null}
        {activeView === "users" ? <UsersTable users={filteredUsers} currentAdminId={profile.id} /> : null}
        {activeView === "alerts" ? <AlertsTable alerts={filteredAlerts} /> : null}
      </main>
    </div>
  );
}

function OverviewPanel({
  bookings,
  autoEcoles,
  alerts,
}: {
  bookings: BookingAdminRow[];
  autoEcoles: AutoEcoleAdminRow[];
  alerts: AlertRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Section title="Reservations recentes" subtitle="Dernieres operations eleves">
        <div className="divide-y divide-slate-100">
          {bookings.length === 0 ? (
            <EmptyRows label="Aucune reservation trouvee" />
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{booking.user?.name ?? "Eleve"}</p>
                  <p className="mt-1 text-sm text-slate-500">{booking.stage?.title ?? "Stage"}</p>
                </div>
                <StatusBadge value={booking.status} />
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title="Auto-ecoles a valider" subtitle="Comptes partenaires en attente">
        <div className="divide-y divide-slate-100">
          {autoEcoles.length === 0 ? (
            <EmptyRows label="Aucune validation en attente" />
          ) : (
            autoEcoles.map((autoEcole) => (
              <div key={autoEcole.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{autoEcole.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{autoEcole.city}</p>
                </div>
                <form action={updateAutoEcoleVerification}>
                  <input type="hidden" name="autoEcoleId" value={autoEcole.id} />
                  <input type="hidden" name="isVerified" value="true" />
                  <IconSubmitButton title="Valider">
                    <BadgeCheck className="h-4 w-4" />
                  </IconSubmitButton>
                </form>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title="Alertes actives" subtitle="Demandes candidates a suivre">
        <div className="divide-y divide-slate-100">
          {alerts.length === 0 ? (
            <EmptyRows label="Aucune alerte active" />
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{alert.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{alert.city ?? "Zone ouverte"}</p>
                </div>
                <StatusBadge value="active" label="Active" />
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}

function BookingsTable({ bookings }: { bookings: BookingAdminRow[] }) {
  return (
    <Section title="Reservations" subtitle={`${bookings.length} lignes chargees`}>
      {bookings.length === 0 ? (
        <EmptyRows label="Aucune reservation trouvee" />
      ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Eleve</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">Paiement</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {bookings.map((booking) => (
              <tr key={booking.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{booking.user?.name ?? "Eleve"}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {booking.user?.email ?? "-"}
                  </p>
                  {booking.user?.phone ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      {booking.user.phone}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{booking.stage?.title ?? "Stage"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {booking.stage?.auto_ecole?.name ?? "Auto-ecole"} -{" "}
                    {formatDate(booking.stage?.start_date ?? null)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{formatMoney(booking.total_price)}</p>
                  <div className="mt-2">
                    <StatusBadge value={booking.payment_status} />
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(booking.created_at)}</td>
                <td className="px-4 py-3">
                  <form action={updateBookingStatus} className="flex min-w-48 items-center gap-2">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <select
                      name="status"
                      defaultValue={booking.status}
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmee</option>
                      <option value="completed">Terminee</option>
                      <option value="cancelled">Annulee</option>
                    </select>
                    <IconSubmitButton title="Mettre a jour">
                      <Save className="h-4 w-4" />
                    </IconSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function AutoEcolesTable({ autoEcoles }: { autoEcoles: AutoEcoleAdminRow[] }) {
  return (
    <Section title="Auto-ecoles" subtitle={`${autoEcoles.length} partenaires charges`}>
      {autoEcoles.length === 0 ? (
        <EmptyRows label="Aucune auto-ecole trouvee" />
      ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Partenaire</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Validation</th>
              <th className="px-4 py-3 font-semibold">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {autoEcoles.map((autoEcole) => (
              <tr key={autoEcole.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{autoEcole.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {autoEcole.city} {autoEcole.region ? `- ${autoEcole.region}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Responsable: {autoEcole.user?.name ?? "-"}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <p className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {autoEcole.email}
                  </p>
                  <p className="mt-1 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {autoEcole.phone}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <form action={updateAutoEcoleVerification} className="flex items-center gap-2">
                    <input type="hidden" name="autoEcoleId" value={autoEcole.id} />
                    <input type="hidden" name="isVerified" value={String(!autoEcole.is_verified)} />
                    <StatusBadge
                      value={autoEcole.is_verified ? "confirmed" : "pending"}
                      label={autoEcole.is_verified ? "Validee" : "A valider"}
                    />
                    <IconSubmitButton title={autoEcole.is_verified ? "Retirer la validation" : "Valider"}>
                      {autoEcole.is_verified ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <BadgeCheck className="h-4 w-4" />
                      )}
                    </IconSubmitButton>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={updateAutoEcoleCommission} className="flex items-center gap-2">
                    <input type="hidden" name="autoEcoleId" value={autoEcole.id} />
                    <input
                      name="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      defaultValue={autoEcole.commission_rate}
                      className="h-9 w-24 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
                    />
                    <IconSubmitButton title="Enregistrer la commission">
                      <Save className="h-4 w-4" />
                    </IconSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function StagesTable({ stages }: { stages: StageAdminRow[] }) {
  return (
    <Section title="Stages" subtitle={`${stages.length} stages charges`}>
      {stages.length === 0 ? (
        <EmptyRows label="Aucun stage trouve" />
      ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">Auto-ecole</th>
              <th className="px-4 py-3 font-semibold">Capacite</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Disponibilite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {stages.map((stage) => (
              <tr key={stage.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{stage.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Permis {stage.license_type} - {formatDate(stage.start_date)} au {formatDate(stage.end_date)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatMoney(stage.price)}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <p className="font-medium text-slate-900">{stage.auto_ecole?.name ?? "-"}</p>
                  <p className="mt-1 text-xs text-slate-500">{stage.auto_ecole?.city ?? "-"}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {stage.enrolled_students}/{stage.max_students} eleves
                </td>
                <td className="px-4 py-3">
                  <form action={updateStageStatus} className="flex items-center gap-2">
                    <input type="hidden" name="stageId" value={stage.id} />
                    <select
                      name="status"
                      defaultValue={stage.status}
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                    >
                      <option value="active">Actif</option>
                      <option value="completed">Termine</option>
                      <option value="cancelled">Annule</option>
                    </select>
                    <IconSubmitButton title="Mettre a jour">
                      <Save className="h-4 w-4" />
                    </IconSubmitButton>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={updateStageAvailability} className="flex items-center gap-2">
                    <input type="hidden" name="stageId" value={stage.id} />
                    <input type="hidden" name="isAvailable" value={String(!stage.is_available)} />
                    <StatusBadge
                      value={stage.is_available ? "active" : "cancelled"}
                      label={stage.is_available ? "Publie" : "Masque"}
                    />
                    <IconSubmitButton title={stage.is_available ? "Masquer" : "Publier"}>
                      {stage.is_available ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </IconSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function UsersTable({ users, currentAdminId }: { users: UserRow[]; currentAdminId: string }) {
  return (
    <Section title="Utilisateurs" subtitle={`${users.length} comptes charges`}>
      {users.length === 0 ? (
        <EmptyRows label="Aucun utilisateur trouve" />
      ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Compte</th>
              <th className="px-4 py-3 font-semibold">Profil</th>
              <th className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </p>
                  {user.phone ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      {user.phone}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <p>Cree le {formatDate(user.created_at)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Quiz: {user.quiz_completed ? "complete" : "incomplet"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {user.id === currentAdminId ? (
                    <StatusBadge value="admin" label="Admin actuel" />
                  ) : (
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                      >
                        <option value="student">Eleve</option>
                        <option value="auto_ecole">Auto-ecole</option>
                        <option value="admin">Admin</option>
                      </select>
                      <IconSubmitButton title="Mettre a jour">
                        <UserCog className="h-4 w-4" />
                      </IconSubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function AlertsTable({ alerts }: { alerts: AlertRow[] }) {
  return (
    <Section title="Alertes" subtitle={`${alerts.length} demandes chargees`}>
      {alerts.length === 0 ? (
        <EmptyRows label="Aucune alerte trouvee" />
      ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Candidat</th>
              <th className="px-4 py-3 font-semibold">Recherche</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {alerts.map((alert) => (
              <tr key={alert.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{alert.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {alert.email}
                  </p>
                  {alert.phone ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      {alert.phone}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <p>{alert.city ?? "Toutes zones"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Permis {alert.license_type ?? "B"} - {formatDate(alert.preferred_start_date)}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(alert.created_at)}</td>
                <td className="px-4 py-3">
                  <form action={updateAlertActive} className="flex items-center gap-2">
                    <input type="hidden" name="alertId" value={alert.id} />
                    <input type="hidden" name="isActive" value={String(!alert.is_active)} />
                    <StatusBadge
                      value={alert.is_active ? "active" : "cancelled"}
                      label={alert.is_active ? "Active" : "Fermee"}
                    />
                    <IconSubmitButton title={alert.is_active ? "Fermer" : "Reouvrir"}>
                      {alert.is_active ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </IconSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
