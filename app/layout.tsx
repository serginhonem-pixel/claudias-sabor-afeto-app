import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claudia's Sabor e Afeto",
  description: "Gestão da sua confeitaria artesanal",
  manifest: "/manifest.json",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Claudia's",
  },
};

export const viewport: Viewport = {
  themeColor: "#2A1F1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
