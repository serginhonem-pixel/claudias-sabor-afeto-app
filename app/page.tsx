"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace("/dashboard");
  }, [loading, router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-rose border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
