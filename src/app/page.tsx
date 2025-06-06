// src/app/page.tsx (Update)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUserRole } from "@/lib/auth";
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const role = getUserRole();
      
      if (role === "user") {
        router.push("/student/emergency");
      } else if (role === "volunteer" || role === "relawan") {
        router.push("/volunteer/dashboard");
      } else if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/auth/login");
      }
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">SIGAP UNDIP</h1>
        <p className="text-gray-600">Mengarahkan ke halaman yang sesuai...</p>
      </div>
    </div>
  );
}