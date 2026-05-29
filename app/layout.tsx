import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claudia's Sabor e Afeto — Gestão",
  description: "Sistema de gestão para confeitaria artesanal",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
