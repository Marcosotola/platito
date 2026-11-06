import type { Metadata, Viewport } from "next";
import { DM_Sans, Fredoka } from "next/font/google";
import "./globals.css";

const cuerpo = DM_Sans({
  variable: "--font-cuerpo",
  subsets: ["latin"],
});

const titulo = Fredoka({
  variable: "--font-titulo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sitio =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(sitio),
  title: "Platito · Comedor casero — Nuestra carta",
  description:
    "Mirá la carta de Platito, comedor casero: pastas, carnes, pizzas, empanadas, meriendas, postres y bebidas.",
  openGraph: {
    title: "Platito · Comedor casero",
    description: "Nuestra carta, siempre actualizada.",
    locale: "es_AR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1450d2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${cuerpo.variable} ${titulo.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
