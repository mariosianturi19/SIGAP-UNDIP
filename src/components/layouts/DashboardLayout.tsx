"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearAuthTokens } from "@/lib/auth";
import { toast } from "sonner";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  PieChart,
  AlertTriangle,
  Calendar,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Palette
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
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/footer";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type Theme = 'light' | 'dark' | 'system';

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<{name?: string; email?: string; avatar_url?: string} | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    setTheme(savedTheme);
    
    const updateTheme = () => {
      if (savedTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        const isDark = savedTheme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      const isDark = newTheme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    toast.success("Successfully logged out");
    router.push("/auth/login");
  };

  // Animation variants
  const sidebarVariants = {
    expanded: {
      width: "18rem",
      transition: { 
        duration: 0.4, 
        ease: [0.23, 1, 0.32, 1]
      }
    },
    collapsed: {
      width: "5rem",
      transition: { 
        duration: 0.4, 
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const textVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      display: "block",
      transition: { delay: 0.15, duration: 0.3 }
    },
    collapsed: {
      opacity: 0,
      x: -15,
      transitionEnd: { display: "none" },
      transition: { duration: 0.2 }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const menuItems = [
    { icon: PieChart, label: "Dashboard", path: "/admin/dashboard", color: "text-blue-600" },
    { icon: Users, label: "Volunteers", path: "/admin/volunteers", color: "text-green-600" },
    { icon: FileText, label: "Reports", path: "/admin/reports", color: "text-purple-600" },
    { icon: AlertTriangle, label: "Panic Reports", path: "/admin/panic-reports", color: "text-red-600" },
    { icon: Calendar, label: "Shift Management", path: "/admin/shift-management", color: "text-orange-600" },  
  ];

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex-col transition-colors duration-300">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.div 
          ref={sidebarRef}
          className="fixed left-0 top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200/60 dark:border-gray-700/60 h-screen overflow-hidden z-40 shadow-lg"
          initial="collapsed"
          animate={isSidebarExpanded ? "expanded" : "collapsed"}
          variants={sidebarVariants}
          onHoverStart={() => setIsSidebarExpanded(true)}
          onHoverEnd={() => setIsSidebarExpanded(false)}
        >
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 border-b border-gray-200/60 dark:border-gray-700/60">
              <div className="flex items-center justify-center w-full">
                <div className="relative">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 flex items-center justify-center overflow-hidden shadow-lg">
                    <Image 
                      src="/images/Undip-Logo.png" 
                      alt="Logo UNDIP"
                      width={32} 
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                </div>
                <motion.div
                  variants={textVariants}
                  className="ml-4"
                >
                  <h1 className="font-bold text-xl text-gray-900 dark:text-white">SIGAP</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">UNDIP System</p>
                </motion.div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 py-8 px-4 space-y-3">
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
                        flex items-center px-4 py-4 rounded-xl cursor-pointer
                        transition-all duration-300 group relative overflow-hidden
                        ${isItemActive 
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 shadow-sm' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }
                      `}
                    >
                      {isItemActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <div className="relative">
                        <item.icon className={`w-6 h-6 transition-colors duration-300 ${
                          isItemActive ? 'text-blue-600 dark:text-blue-400' : `${item.color} group-hover:text-blue-600 dark:group-hover:text-blue-400`
                        }`} />
                      </div>
                      
                      <motion.span
                        variants={textVariants}
                        className="ml-4 font-semibold text-sm"
                      >
                        {item.label}
                      </motion.span>

                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Logout Button */}
            <div className="p-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-4 rounded-xl text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group relative overflow-hidden"
                >
                  <LogOut className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
                  <motion.span
                    variants={textVariants}
                    className="ml-4 font-semibold text-sm"
                  >
                    Logout
                  </motion.span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/50 to-transparent dark:via-red-900/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: isSidebarExpanded ? '18rem' : '5rem' }}>
          {/* Header */}
          <header className="h-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between px-8 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">System Online</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="relative h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                  >
                    {getThemeIcon()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Theme
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleThemeChange('light')}
                    className="cursor-pointer"
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    <span>Light</span>
                    {theme === 'light' && <Badge className="ml-auto">Active</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleThemeChange('dark')}
                    className="cursor-pointer"
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    <span>Dark</span>
                    {theme === 'dark' && <Badge className="ml-auto">Active</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleThemeChange('system')}
                    className="cursor-pointer"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    <span>System</span>
                    {theme === 'system' && <Badge className="ml-auto">Active</Badge>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300">
                    <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
                      <AvatarImage
                        src={userData?.avatar_url || ""}
                        alt={userData?.name || "Admin"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                        {userData?.name ? getInitials(userData.name) : "AD"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" sideOffset={10}>
                  <DropdownMenuLabel>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userData?.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          {userData?.name ? getInitials(userData.name) : "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {userData?.name || "Administrator"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {userData?.email || "admin@undip.ac.id"}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" 
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-8 bg-transparent">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}