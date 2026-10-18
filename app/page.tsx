"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore } from "@/lib/api";
import type { Me } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (!tokenStore.get()) { router.replace("/login"); return; }
    api<Me>("/me")
      .then((m) => router.replace(m.role === "teacher" ? "/dashboard" : "/portal"))
      .catch(() => router.replace("/login"));
  }, [router]);
  return <div className="grid min-h-screen place-items-center text-muted">در حال بارگذاری…</div>;
}
