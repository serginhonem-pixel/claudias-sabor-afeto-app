"use client";
import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

export function Topbar({ title, actions }: { title: string; actions?: ReactNode }) {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-rose-light/80 px-6 h-14 flex items-center justify-between sticky top-0 z-40">
      <h1 className="font-heading font-semibold text-dark text-[1rem]">{title}</h1>
      <div className="flex items-center gap-3">
        {actions}
        <div className="w-7 h-7 rounded-full bg-rose-light flex items-center justify-center text-rose-DEFAULT text-xs font-bold uppercase">
          {user?.email?.[0] ?? "C"}
        </div>
      </div>
    </header>
  );
}
