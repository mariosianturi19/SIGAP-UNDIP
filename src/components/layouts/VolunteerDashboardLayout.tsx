// src/components/layouts/VolunteerDashboardLayout.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearAuthTokens, getUserData } from "@/lib/auth";
import { toast } from "sonner";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  LogOut, 
  PieChart,
  Shield,
  AlertTriangle,
  Calendar,
  Menu,
  X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Get user data from localStorage
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isMobileMenuOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isMobileMenuOpen]);

  const handleLogout = () => {
    clearAuthTokens();
    toast.success("Berhasil keluar dari sistem");
    router.push("/auth/login");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Animation variants
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

  const mobileMenuVariants = {
    open: {
      x: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    closed: {
      x: "-100%",
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

  // Menu items for volunteers
  const menuItems = [
    { icon: PieChart, label: "Dashboard", path: "/volunteer/dashboard" },
    { icon: FileText, label: "Laporan", path: "/volunteer/reports" },
    { icon: AlertTriangle, label: "Panic Hari Ini", path: "/volunteer/panic-reports" },
    { icon: Calendar, label: "Jadwal Saya", path: "/volunteer/my-shifts" },
  ];

  const renderMenuItems = (mobile = false) => (
    <>
      {menuItems.map((item) => {
        const isItemActive = isActive(item.path);
        return (
          <motion.div
            key={item.path}
            className="relative"
            whileHover={{ scale: mobile ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              onClick={() => handleNavigation(item.path)}
              className={`
                flex items-center px-3 py-3 rounded-lg cursor-pointer
                transition-all duration-300 group
                ${mobile ? 'mx-2' : ''}
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
                    layoutId={mobile ? "activeIndicatorVolunteerMobile" : "activeIndicatorVolunteer"}
                    className="absolute -left-1 -right-1 -top-1 -bottom-1 rounded-md bg-blue-100/50 -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
              <motion.span
                variants={mobile ? undefined : textVariants}
                className={`ml-3 font-medium ${mobile ? 'block' : ''}`}
              >
                {item.label}
              </motion.span>
            </div>
          </motion.div>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobile && isMobileMenuOpen && (
            <motion.div
              ref={overlayRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <motion.div 
          ref={sidebarRef}
          className="hidden lg:flex bg-white border-r border-gray-200 h-screen overflow-hidden relative"
          initial="collapsed"
          animate={isSidebarExpanded ? "expanded" : "collapsed"}
          variants={sidebarVariants}
          onHoverStart={() => setIsSidebarExpanded(true)}
          onHoverEnd={() => setIsSidebarExpanded(false)}
        >
          <div className="flex flex-col h-full w-full">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-4 border-b border-gray-200">
              <div className="flex items-center justify-center w-full">
                <div className="rounded-full bg-blue-50 w-10 h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  className="ml-2 font-semibold text-lg text-gray-900 whitespace-nowrap"
                >
                  SIGAP UNDIP
                </motion.span>
              </div>
            </div>

            {/* Volunteer Badge */}
            <div className="px-3 py-2">
              <motion.div
                variants={textVariants}
                className="bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-xs font-medium text-green-700 whitespace-nowrap">Relawan</span>
                </div>
              </motion.div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
              {renderMenuItems()}
            </div>

            {/* Logout Button */}
            <div className="p-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-3 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-300"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <motion.span
                    variants={textVariants}
                    className="ml-3 font-medium whitespace-nowrap"
                  >
                    Log Out
                  </motion.span>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Sidebar */}
        <motion.div
          className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto"
          initial="closed"
          animate={isMobileMenuOpen ? "open" : "closed"}
          variants={mobileMenuVariants}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-50 w-8 h-8 flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/images/Undip-Logo.png" 
                    alt="Logo UNDIP"
                    width={32} 
                    height={32}
                    className="object-cover"
                  />
                </div>
                <span className="ml-2 font-semibold text-base text-gray-900">SIGAP UNDIP</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Volunteer Badge */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-700">Relawan</span>
                </div>
              </div>
            </div>

            {/* Mobile Menu Items */}
            <div className="flex-1 py-4 space-y-1">
              {renderMenuItems(true)}
            </div>

            {/* Mobile User Info & Logout */}
            <div className="border-t border-gray-200 p-4 space-y-3">
              {userData && (
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.avatar_url || ""} alt={userData?.name || "Relawan"} />
                    <AvatarFallback className="text-xs">{getInitials(userData?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{userData.name}</p>
                    <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                  </div>
                </div>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2 h-8 w-8 p-0"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="text-sm text-gray-500 hidden sm:block">
                Dashboard Relawan
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Desktop User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-gray-200">
                      <AvatarImage
                        src={userData?.avatar_url || ""}
                        alt={userData?.name || "Relawan"}
                      />
                      <AvatarFallback className="text-xs sm:text-sm">{getInitials(userData?.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" sideOffset={5}>
                  <DropdownMenuLabel>Akun Relawan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userData && (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium truncate">{userData.name}</p>
                        <p className="text-xs text-gray-500 truncate">{userData.email}</p>
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

          {/* Content */}
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}