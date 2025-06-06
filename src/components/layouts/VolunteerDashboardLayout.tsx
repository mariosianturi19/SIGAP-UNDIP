// src/components/layouts/VolunteerDashboardLayout.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearAuthTokens, getUserData } from "@/lib/auth";
import { toast } from "sonner";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  FileText, 
  ChevronLeft,
  LogOut, 
  PieChart,
  Shield,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Footer from "@/components/footer";

interface VolunteerDashboardLayoutProps {
  children: React.ReactNode;
}

export default function VolunteerDashboardLayout({ children }: VolunteerDashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<any>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ambil data pengguna dari localStorage
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (e) {
        console.error("Error mengurai data pengguna:", e);
      }
    }
  }, []);

  const handleLogout = () => {
    clearAuthTokens();
    toast.success("Berhasil keluar dari sistem");
    router.push("/auth/login");
  };

  // Variasi animasi
  const sidebarVariants = {
    expanded: {
      width: "16rem",
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    collapsed: {
      width: "5rem",
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const textVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      display: "block",
      transition: { delay: 0.1, duration: 0.2 }
    },
    collapsed: {
      opacity: 0,
      x: -10,
      transitionEnd: { display: "none" },
      transition: { duration: 0.2 }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "RL";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Menu items untuk relawan
  const menuItems = [
    { icon: PieChart, label: "Dashboard", path: "/volunteer/dashboard" },
    { icon: FileText, label: "Laporan", path: "/volunteer/reports" },
    { icon: AlertTriangle, label: "Panic Hari Ini", path: "/volunteer/panic-reports" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar dengan Animasi */}
        <motion.div 
          ref={sidebarRef}
          className="bg-white border-r border-gray-200 h-screen overflow-hidden relative"
          initial="collapsed"
          animate={isSidebarExpanded ? "expanded" : "collapsed"}
          variants={sidebarVariants}
          onHoverStart={() => setIsSidebarExpanded(true)}
          onHoverEnd={() => setIsSidebarExpanded(false)}
        >
          <div className="flex flex-col h-full">
            {/* Bagian Logo */}
            <div className="h-16 flex items-center px-4 border-b border-gray-200">
              <div className="flex items-center justify-center w-full">
                <div className="rounded-full bg-blue-50 w-10 h-10 flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/images/Undip-Logo.png" 
                    alt="Logo UNDIP"
                    width={40} 
                    height={40}
                    className="object-cover"
                  />
                </div>
                <motion.span
                  variants={textVariants}
                  className="ml-1 font-semibold text-lg text-gray-1000"
                >
                  SIGAP UNDIP
                </motion.span>
              </div>
            </div>

            {/* Badge Relawan */}
            <div className="px-3 py-2">
              <motion.div
                variants={textVariants}
                className="bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-xs font-medium text-green-700">Relawan</span>
                </div>
              </motion.div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 py-6 px-3 space-y-2">
              {menuItems.map((item) => {
                const isItemActive = isActive(item.path);
                return (
                  <motion.div
                    key={item.path}
                    className="relative"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      onClick={() => router.push(item.path)}
                      className={`
                        flex items-center px-3 py-3 rounded-lg cursor-pointer
                        transition-all duration-300 group
                        ${isItemActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'hover:bg-gray-50 text-gray-600 hover:text-blue-600'
                        }
                      `}
                    >
                      <div className="relative">
                        <item.icon className={`w-5 h-5 ${isItemActive ? 'text-blue-600' : 'group-hover:text-blue-600'}`} />
                        {isItemActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute -left-1 -right-1 -top-1 -bottom-1 rounded-md bg-blue-100/50 -z-10"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </div>
                      <motion.span
                        variants={textVariants}
                        className="ml-3 font-medium"
                      >
                        {item.label}
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Tombol Keluar */}
            <div className="p-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-3 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <motion.span
                    variants={textVariants}
                    className="ml-3 font-medium"
                  >
                    Log Out
                  </motion.span>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Konten utama */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header atas */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center">
              <div className="text-sm text-gray-500">
                Dashboard Relawan
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-gray-200">
                      <AvatarImage
                        src={userData?.avatar_url || ""}
                        alt={userData?.name || "Relawan"}
                      />
                      <AvatarFallback>{userData?.name ? getInitials(userData.name) : "RL"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" sideOffset={5}>
                  <DropdownMenuLabel>Akun Relawan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userData && (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{userData.name}</p>
                        <p className="text-xs text-gray-500">{userData.email}</p>
                        <div className="flex items-center mt-1">
                          <Shield className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-xs text-green-600 font-medium">Relawan</span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Konten */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}