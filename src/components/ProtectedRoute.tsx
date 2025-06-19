// src/components/ProtectedRoute.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getUserRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push("/auth/login"); // Update path: Sebelumnya /login
        return;
      }
      
      // Periksa apakah pengguna berada di rute yang benar berdasarkan peran
      const role = getUserRole();
      
      // Jika pengguna mencoba mengakses dasbor tetapi adalah pengguna biasa
      if (pathname.startsWith("/admin") && role === "user") {
        router.push("/student/emergency"); // Update path: Sebelumnya /student
        return;
      }
      
      // Jika pengguna mencoba mengakses halaman mahasiswa tetapi adalah admin/relawan
      if (pathname.startsWith("/student") && (role === "admin" || role === "volunteer")) {
        router.push("/admin/dashboard"); // Update path: Sebelumnya /dashboard
        return;
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [router, pathname]);

  if (!isClient) {
    return null;
  }

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return <>{children}</>;
}