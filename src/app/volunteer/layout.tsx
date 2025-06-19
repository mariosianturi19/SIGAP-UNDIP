// src/app/volunteer/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getUserRole } from "@/lib/auth";
import VolunteerDashboardLayout from "@/components/layouts/VolunteerDashboardLayout";

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkAuth = async () => {
      try {
        const role = getUserRole();
        
        // Jika pengguna adalah admin, arahkan ke dashboard admin
        if (role === "admin") {
          router.push("/admin/dashboard");
          return;
        }
        
        // Jika pengguna adalah mahasiswa biasa, arahkan ke halaman mahasiswa
        if (role === "user") {
          router.push("/student/emergency");
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Kesalahan pemeriksaan otentikasi:", error);
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router]);

  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return <ProtectedRoute><VolunteerDashboardLayout>{children}</VolunteerDashboardLayout></ProtectedRoute>;
}