"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AdminLoginFormProps = {
  redirectedFrom: string;
};

export function AdminLoginForm({ redirectedFrom }: AdminLoginFormProps) {
  const supabase = createClient();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination =
    redirectedFrom.startsWith("/admin") && !redirectedFrom.startsWith("/admin/login")
      ? redirectedFrom
      : "/admin";

  // Optional convenience alias (e.g. type "Walid" instead of the full email),
  // configured via env so no personal address is hardcoded in the bundle.
  const adminAlias = process.env.NEXT_PUBLIC_ADMIN_LOGIN_ALIAS?.trim().toLowerCase();
  const adminAliasEmail = process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL?.trim();

  const getAdminEmail = (value: string) => {
    const trimmedValue = value.trim();
    if (adminAlias && adminAliasEmail && trimmedValue.toLowerCase() === adminAlias) {
      return adminAliasEmail;
    }
    return trimmedValue;
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const adminEmail = getAdminEmail(identifier);
      if (!adminEmail || !password) {
        setError("Renseignez l'identifiant admin et le mot de passe.");
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!data.user) {
        throw new Error("Session administrateur introuvable.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setError("Acces reserve aux administrateurs.");
        return;
      }

      window.location.assign(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion administrateur impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="relative w-full max-w-sm">
        <form
          onSubmit={handleLogin}
          noValidate
          className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-black/30 sm:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Acces administrateur</p>
              <h2 className="mt-1 text-xl font-bold">Connexion admin</h2>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Lock className="h-5 w-5" />
            </span>
          </div>

          {error ? (
            <div
              aria-live="polite"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Identifiant admin</span>
              <span className="relative mt-2 block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    setError(null);
                  }}
                  autoComplete="username"
                  placeholder={adminAlias ? adminAlias : "admin@exemple.fr"}
                  required
                  className="h-11 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-500"
                />
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Entrez votre adresse e-mail administrateur{adminAlias ? ` ou « ${adminAlias} »` : ""}.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Mot de passe</span>
              <span className="relative mt-2 block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError(null);
                  }}
                  autoComplete="current-password"
                  required
                  className="h-11 w-full rounded-md border border-slate-200 bg-white pl-9 pr-11 text-sm outline-none transition-colors focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Entrer dans l'admin
          </button>

          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
            Les comptes eleves et auto-ecoles sont refuses ici. Seuls les profils avec le role admin peuvent ouvrir la console.
          </div>
        </form>
      </div>
    </main>
  );
}
