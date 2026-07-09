import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Permis Accéléré - Votre permis en 7 jours",
  description: "Obtenez votre permis de conduire en seulement 7 jours. Formation intensive avec des moniteurs expérimentés. Taux de réussite 95%.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
