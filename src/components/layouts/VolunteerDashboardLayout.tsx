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
  Moon,
  Sun,
  Monitor,
  User,
  HelpCircle,
  Palette,
  Settings,
  Bell,
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
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/footer";

interface VolunteerDashboardLayoutProps {
  children: React.ReactNode;
}

type Theme = 'light' | 'dark' | 'system';

export default function VolunteerDashboardLayout({ children }: VolunteerDashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<any>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    setTheme(savedTheme);
    
    const updateTheme = () => {
      if (savedTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        const isDark = savedTheme === 'dark';
        setIsDarkMode(isDark);
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
        console.error("Error mengurai data pengguna:", e);
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

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      const isDark = newTheme === 'dark';
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    }
  };

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

  // Modern animation variants - optimized for smoother transitions
  const sidebarVariants = {
    expanded: {
      width: "18rem",
      transition: { 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] // Optimized easing curve
      }
    },
    collapsed: {
      width: "5rem",
      transition: { 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const mobileMenuVariants = {
    open: {
      x: 0,
      transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
    },
    closed: {
      x: "-100%",
      transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
    }
  };

  const textVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      display: "block",
      transition: { 
        delay: 0.1, 
        duration: 0.2,
        ease: "easeOut"
      }
    },
    collapsed: {
      opacity: 0,
      x: -10,
      transitionEnd: { display: "none" },
      transition: { 
        duration: 0.15,
        ease: "easeIn"
      }
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

  const menuItems = [
    { icon: PieChart, label: "Dashboard", path: "/volunteer/dashboard", color: "text-blue-600" },
    { icon: FileText, label: "Laporan", path: "/volunteer/reports", color: "text-green-600" },
    { icon: AlertTriangle, label: "Panic Reports", path: "/volunteer/panic-reports", color: "text-red-600" },
    { icon: Calendar, label: "Jadwal Saya", path: "/volunteer/my-shifts", color: "text-purple-600" },
  ];

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const renderMenuItems = (mobile = false) => (
    <>
      {menuItems.map((item) => {
        const isItemActive = isActive(item.path);
        return (
          <motion.div
            key={item.path}
            className="relative"
            whileHover={{ scale: 1.01 }} // Reduced scale to prevent jank
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }} // Faster micro-interactions
          >
            <div
              onClick={() => handleNavigation(item.path)}
              className={`
                flex items-center px-4 py-4 rounded-xl cursor-pointer
                transition-all duration-200 group relative overflow-hidden
                ${isItemActive 
                  ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 shadow-sm' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
                }
              `}
            >
              {/* Active indicator - Optimized */}
              {isItemActive && (
                <motion.div
                  layoutId="activeIndicatorVolunteer"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-600 rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                />
              )}
              
              <div className="relative flex-shrink-0">
                <item.icon className={`w-6 h-6 transition-colors duration-200 ${
                  isItemActive ? 'text-green-600 dark:text-green-400' : `${item.color} group-hover:text-green-600 dark:group-hover:text-green-400`
                }`} />
              </div>
              
              <motion.span
                variants={textVariants}
                className="ml-4 font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {item.label}
              </motion.span>

              {/* Hover effect - Optimized */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </div>
          </motion.div>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex-col transition-colors duration-300">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobile && isMobileMenuOpen && (
            <motion.div
              ref={overlayRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Desktop Sidebar - Optimized Fixed Position */}
        <motion.div 
          ref={sidebarRef}
          className="hidden lg:flex fixed left-0 top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200/60 dark:border-gray-700/60 h-screen overflow-hidden z-40 shadow-lg"
          initial="collapsed"
          animate={isSidebarExpanded ? "expanded" : "collapsed"}
          variants={sidebarVariants}
          onHoverStart={() => !isMobile && setIsSidebarExpanded(true)}
          onHoverEnd={() => !isMobile && setIsSidebarExpanded(false)}
          style={{ willChange: "width" }} // Optimize for width changes
        >
          <div className="flex flex-col h-full w-full">
            {/* Modern Logo Section - Optimized */}
            <div className="h-20 flex items-center px-6 border-b border-gray-200/60 dark:border-gray-700/60 flex-shrink-0">
              <div className="flex items-center w-full min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 flex items-center justify-center overflow-hidden shadow-lg">
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
                  className="ml-4 min-w-0 overflow-hidden"
                >
                  <h1 className="font-bold text-xl text-gray-900 dark:text-white whitespace-nowrap">SIGAP</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Relawan System</p>
                </motion.div>
              </div>
            </div>

            {/* Volunteer Badge - Optimized */}
            <div className="px-6 py-4 flex-shrink-0">
              <motion.div
                variants={textVariants}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3"
              >
                <div className="flex items-center min-w-0">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400 whitespace-nowrap overflow-hidden text-ellipsis">
                    Status: Relawan Aktif
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Modern Menu Items - Optimized */}
            <div className="flex-1 py-8 px-4 space-y-3 overflow-y-auto">
              {menuItems.map((item) => {
                const isItemActive = isActive(item.path);
                return (
                  <motion.div
                    key={item.path}
                    className="relative"
                    whileHover={{ scale: 1.01 }} // Reduced scale to prevent jank
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.15 }} // Faster micro-interactions
                  >
                    <div
                      onClick={() => handleNavigation(item.path)}
                      className={`
                        flex items-center px-4 py-4 rounded-xl cursor-pointer
                        transition-all duration-200 group relative overflow-hidden
                        ${isItemActive 
                          ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 shadow-sm' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
                        }
                      `}
                    >
                      {/* Active indicator - Optimized */}
                      {isItemActive && (
                        <motion.div
                          layoutId="activeIndicatorVolunteer"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-600 rounded-r-full"
                          transition={{ type: "spring", stiffness: 400, damping: 40 }}
                        />
                      )}
                      
                      <div className="relative flex-shrink-0">
                        <item.icon className={`w-6 h-6 transition-colors duration-200 ${
                          isItemActive ? 'text-green-600 dark:text-green-400' : `${item.color} group-hover:text-green-600 dark:group-hover:text-green-400`
                        }`} />
                      </div>
                      
                      <motion.span
                        variants={textVariants}
                        className="ml-4 font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        {item.label}
                      </motion.span>

                      {/* Hover effect - Optimized */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Modern Logout Button - Optimized */}
            <div className="p-4 mb-6 flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-4 rounded-xl text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group relative overflow-hidden"
                >
                  <LogOut className="w-6 h-6 transition-transform duration-200 group-hover:-translate-x-1 flex-shrink-0" />
                  <motion.span
                    variants={textVariants}
                    className="ml-4 font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Keluar
                  </motion.span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent dark:via-red-900/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Sidebar - Optimized */}
        <motion.div
          className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200/60 dark:border-gray-700/60 z-50 overflow-y-auto shadow-lg"
          initial="closed"
          animate={isMobileMenuOpen ? "open" : "closed"}
          variants={mobileMenuVariants}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Header - Optimized */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/60 dark:border-gray-700/60 flex-shrink-0">
              <div className="flex items-center min-w-0">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 w-8 h-8 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                  <Image 
                    src="/images/Undip-Logo.png" 
                    alt="Logo UNDIP"
                    width={24} 
                    height={24}
                    className="object-cover"
                  />
                </div>
                <span className="ml-2 font-bold text-base text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">SIGAP</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Volunteer Badge */}
            <div className="px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/60 flex-shrink-0">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                <div className="flex items-center min-w-0">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400 whitespace-nowrap overflow-hidden text-ellipsis">Relawan Aktif</span>
                </div>
              </div>
            </div>

            {/* Mobile Menu Items */}
            <div className="flex-1 py-4 space-y-1 overflow-y-auto">
              {renderMenuItems(true)}
            </div>

            {/* Mobile User Info & Logout */}
            <div className="border-t border-gray-200/60 dark:border-gray-700/60 p-4 space-y-3 flex-shrink-0">
              {userData && (
                <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={userData?.avatar_url || ""} alt={userData?.name || "Relawan"} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-green-600 text-white">
                      {getInitials(userData?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userData.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userData.email}</p>
                  </div>
                </div>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Optimized for Fixed Sidebar with Smooth Transition */}
        <motion.div 
          className="flex-1 flex flex-col overflow-hidden"
          animate={{ 
            marginLeft: isMobile ? 0 : (isSidebarExpanded ? '18rem' : '5rem')
          }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0, 0.2, 1] // Same easing as sidebar
          }}
        >
          {/* Modern Header */}
          <header className="h-16 lg:h-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm flex-shrink-0">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Relawan Online</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 lg:space-x-6">
              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    {getThemeIcon()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Tema Tampilan
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleThemeChange('light')}
                    className="cursor-pointer"
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    <span>Terang</span>
                    {theme === 'light' && <Badge className="ml-auto">Aktif</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleThemeChange('dark')}
                    className="cursor-pointer"
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    <span>Gelap</span>
                    {theme === 'dark' && <Badge className="ml-auto">Aktif</Badge>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleThemeChange('system')}
                    className="cursor-pointer"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    <span>Sistem</span>
                    {theme === 'system' && <Badge className="ml-auto">Aktif</Badge>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 lg:h-12 lg:w-12 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                    <Avatar className="h-8 w-8 lg:h-10 lg:w-10 border-2 border-gray-200 dark:border-gray-700">
                      <AvatarImage
                        src={userData?.avatar_url || ""}
                        alt={userData?.name || "Relawan"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-xs lg:text-sm">
                        {userData?.name ? getInitials(userData.name) : "RL"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 lg:w-64" align="end" sideOffset={10}>
                  <DropdownMenuLabel>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                        <AvatarImage src={userData?.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                          {userData?.name ? getInitials(userData.name) : "RL"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm lg:text-base">
                          {userData?.name || "Relawan"}
                        </p>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                          {userData?.email || "relawan@undip.ac.id"}
                        </p>
                        <div className="flex items-center mt-1">
                          <Shield className="h-3 w-3 text-green-600 dark:text-green-400 mr-1" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Relawan</span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" 
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-transparent">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </motion.div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}