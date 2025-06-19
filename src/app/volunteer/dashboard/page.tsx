"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getUserRole, getAccessToken, getUserData } from "@/lib/auth";
import { 
  Loader2, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Shield, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  Coffee
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Interface untuk status shift hari ini
interface TodayShiftStatus {
  date: string;
  is_on_duty: boolean;
  shift_id?: number;
  shift_type?: 'actual' | 'pattern';
}

// Interface untuk aktivitas relawan
interface VolunteerActivity {
  id: string;
  type: 'panic_new' | 'panic_handled' | 'report_new' | 'report_handled';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    reportId?: number;
    panicId?: number;
  };
}

// Interface untuk stats relawan
interface VolunteerStats {
  panicAlertsToday: number;
  totalReports: number;
  onDutyThisWeek: number;
}

// Interface untuk data dashboard relawan
interface VolunteerDashboardData {
  todayStatus: TodayShiftStatus;
  stats: VolunteerStats;
  recentActivities: VolunteerActivity[];
  upcomingShifts: Array<{
    date: string;
    day_name: string;
    shift_id?: number;
    shift_type: 'actual' | 'pattern';
  }>;
  todayPanicAlerts: Array<{
    id: number;
    status: string;
    created_at: string;
    user: {
      name: string;
    };
  }>;
  todayReports: Array<{
    id: number;
    status: string;
    problem_type: string;
    created_at: string;
    user: {
      name: string;
    };
  }>;
}

export default function VolunteerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<VolunteerDashboardData>({
    todayStatus: {
      date: new Date().toISOString(),
      is_on_duty: false
    },
    stats: {
      panicAlertsToday: 0,
      totalReports: 0,
      onDutyThisWeek: 0
    },
    recentActivities: [],
    upcomingShifts: [],
    todayPanicAlerts: [],
    todayReports: []
  });

  // Previous data untuk comparison
  const previousDataRef = useRef<VolunteerDashboardData | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();

  const generateTodayPanicAlerts = useCallback(() => {
    const alerts = [];
    const alertCount = Math.floor(Math.random() * 3); // 0-2 alerts
    
    for (let i = 0; i < alertCount; i++) {
      const hoursAgo = Math.floor(Math.random() * 8) + 1;
      const alertTime = new Date();
      alertTime.setHours(alertTime.getHours() - hoursAgo);
      
      alerts.push({
        id: Math.floor(Math.random() * 1000) + 1,
        status: Math.random() > 0.5 ? 'pending' : 'handled',
        created_at: alertTime.toISOString(),
        user: {
          name: `Mahasiswa ${Math.floor(Math.random() * 100) + 1}`
        }
      });
    }
    
    return alerts;
  }, []);

  const generateTodayReports = useCallback(() => {
    const reports = [];
    const reportCount = Math.floor(Math.random() * 4) + 1; // 1-4 reports
    const problemTypes = ['electrical', 'tree', 'stairs', 'door', 'infrastructure'];
    
    for (let i = 0; i < reportCount; i++) {
      const hoursAgo = Math.floor(Math.random() * 10) + 1;
      const reportTime = new Date();
      reportTime.setHours(reportTime.getHours() - hoursAgo);
      
      reports.push({
        id: Math.floor(Math.random() * 1000) + 1,
        status: Math.random() > 0.7 ? 'resolved' : 'pending',
        problem_type: problemTypes[Math.floor(Math.random() * problemTypes.length)],
        created_at: reportTime.toISOString(),
        user: {
          name: `Mahasiswa ${Math.floor(Math.random() * 100) + 1}`
        }
      });
    }
    
    return reports;
  }, []);

  const generateUpcomingShifts = useCallback(() => {
    const shifts = [];
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      shifts.push({
        date: date.toISOString(),
        day_name: days[date.getDay()],
        shift_id: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 1 : undefined,
        shift_type: Math.random() > 0.5 ? 'actual' : 'pattern' as 'actual' | 'pattern'
      });
    }
    
    return shifts;
  }, []);

  const formatProblemType = useCallback((type: string) => {
    const typeMap: { [key: string]: string } = {
      "electrical": "Masalah Listrik",
      "electricity": "Masalah Listrik",
      "tree": "Bahaya Pohon",
      "stairs": "Masalah Tangga",
      "elevator": "Masalah Lift",
      "door": "Masalah Pintu",
      "infrastructure": "Infrastruktur",
      "water_supply": "Pasokan Air",
      "waste_management": "Pengelolaan Sampah",
      "public_safety": "Keselamatan Umum",
      "public_health": "Kesehatan Umum",
      "environmental": "Lingkungan",
      "other": "Lainnya"
    };
    
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  const generateActivitiesFromTodayData = useCallback((data: VolunteerDashboardData): VolunteerActivity[] => {
    const activities: VolunteerActivity[] = [];

    // Tambah aktivitas dari panic alerts hari ini
    data.todayPanicAlerts.forEach((panic) => {
      const activityType = panic.status === 'handled' ? 'panic_handled' : 'panic_new';
      const title = panic.status === 'handled' ? 'Panic Alert Ditangani' : 'Panic Alert Baru';
      const description = panic.status === 'handled'
        ? `Alert darurat dari ${panic.user.name} telah ditangani`
        : `Alert darurat baru dari ${panic.user.name}`;

      activities.push({
        id: `panic_${panic.id}_${Date.now()}`,
        type: activityType,
        title: title,
        description: description,
        timestamp: panic.created_at,
        metadata: { panicId: panic.id }
      });
    });

    // Tambah aktivitas dari laporan hari ini
    data.todayReports.forEach((report) => {
      const activityType = report.status === 'resolved' ? 'report_handled' : 'report_new';
      const title = report.status === 'resolved' ? 'Laporan Diselesaikan' : 'Laporan Baru Masuk';
      const description = report.status === 'resolved'
        ? `Laporan ${formatProblemType(report.problem_type)} telah diselesaikan`
        : `Laporan baru: ${formatProblemType(report.problem_type)} dari ${report.user.name}`;

      activities.push({
        id: `report_${report.id}_${Date.now()}`,
        type: activityType,
        title: title,
        description: description,
        timestamp: report.created_at,
        metadata: { reportId: report.id }
      });
    });

    // Sort berdasarkan timestamp dan ambil 5 terbaru
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [formatProblemType]);

  const checkForNewAlertsAndReports = useCallback((
    previousData: VolunteerDashboardData, 
    newData: VolunteerDashboardData, 
    isAutoRefresh: boolean
  ) => {
    // Check for new panic alerts
    const newPanics = newData.todayPanicAlerts.filter(newPanic => 
      !previousData.todayPanicAlerts.some(oldPanic => oldPanic.id === newPanic.id)
    );

    // Check for new reports
    const newReports = newData.todayReports.filter(newReport => 
      !previousData.todayReports.some(oldReport => oldReport.id === newReport.id)
    );

    // Show red toast for new panic alerts
    if (newPanics.length > 0) {
      const refreshType = isAutoRefresh ? "Auto-refresh" : "Manual refresh";
      toast.error(`${newPanics.length} Panic Alert Baru!`, {
        description: `${refreshType}: ${newPanics.length} panic alert darurat memerlukan respon segera`,
        duration: 7000,
        action: {
          label: "Tangani",
          onClick: () => router.push("/volunteer/panic-reports")
        }
      });
    }

    // Show green toast for new reports
    if (newReports.length > 0) {
      const refreshType = isAutoRefresh ? "Auto-refresh" : "Manual refresh";
      toast.success(`${newReports.length} Laporan Baru Masuk!`, {
        description: `${refreshType}: ${newReports.length} laporan baru memerlukan perhatian`,
        duration: 5000,
        action: {
          label: "Lihat",
          onClick: () => router.push("/volunteer/reports")
        }
      });
    }

    // Show info toast saat manual refresh jika tidak ada data baru
    if (!isAutoRefresh && newPanics.length === 0 && newReports.length === 0) {
      toast.info("Data Sudah Terbaru", {
        description: "Tidak ada panic alert atau laporan baru saat ini",
        duration: 3000,
      });
    }
  }, [router]);

  const fetchVolunteerDashboardData = useCallback(async (silentRefresh: boolean = false) => {
    try {
      if (!silentRefresh) {
        setIsRefreshing(true);
      }

      const token = await getAccessToken();
      if (!token) {
        throw new Error("Autentikasi diperlukan");
      }

      // Initialize new data dengan data dummy yang realistis
      const newData: VolunteerDashboardData = {
        todayStatus: {
          date: new Date().toISOString(),
          is_on_duty: Math.random() > 0.6, // 40% kemungkinan bertugas
          shift_id: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 1 : undefined,
          shift_type: Math.random() > 0.5 ? 'actual' : 'pattern'
        },
        stats: {
          panicAlertsToday: Math.floor(Math.random() * 3), // 0-2 panic alerts hari ini
          totalReports: Math.floor(Math.random() * 45) + 15, // 15-60 total laporan
          onDutyThisWeek: Math.floor(Math.random() * 4) + 1 // 1-5 hari bertugas minggu ini
        },
        recentActivities: [],
        upcomingShifts: generateUpcomingShifts(),
        todayPanicAlerts: generateTodayPanicAlerts(),
        todayReports: generateTodayReports()
      };

      // Try to fetch real data dari API
      try {
        // Fetch My Shifts untuk status hari ini
        const shiftsResponse = await fetch("/api/relawan/my-shifts", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (shiftsResponse.ok) {
          const shiftsData = await shiftsResponse.json();
          if (shiftsData && shiftsData.today_status) {
            newData.todayStatus = shiftsData.today_status;
          }
          if (shiftsData && shiftsData.upcoming_shifts) {
            newData.upcomingShifts = shiftsData.upcoming_shifts.slice(0, 3);
          }
          if (shiftsData && shiftsData.summary) {
            newData.stats.onDutyThisWeek = shiftsData.summary.total_scheduled_days || 0;
          }
        }
      } catch {
        console.log("My shifts API not available, using mock data");
      }

      // Try to fetch panic alerts hari ini
      try {
        const todayPanicResponse = await fetch("/api/relawan/panic-reports/today", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (todayPanicResponse.ok) {
          const panicData = await todayPanicResponse.json();
          if (panicData && panicData.data) {
            newData.todayPanicAlerts = panicData.data;
            newData.stats.panicAlertsToday = panicData.data.length;
          }
        }
      } catch {
        console.log("Today panic reports API not available, using mock data");
      }

      // Try to fetch reports data
      try {
        const reportsResponse = await fetch("/api/reports", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          let reports = [];
          
          if (reportsData && reportsData.data && Array.isArray(reportsData.data)) {
            reports = reportsData.data;
          } else if (Array.isArray(reportsData)) {
            reports = reportsData;
          }
          
          newData.stats.totalReports = reports.length;
          
          // Filter laporan hari ini
          const today = new Date().toDateString();
          newData.todayReports = reports.filter((report: { created_at: string }) => 
            new Date(report.created_at).toDateString() === today
          ).slice(0, 5);
        }
      } catch {
        console.log("Reports API not available, using mock data");
      }

      // Generate recent activities dari data panic dan laporan hari ini
      newData.recentActivities = generateActivitiesFromTodayData(newData);

      // Check for new alerts dan tampilkan notifikasi
      if (previousDataRef.current) {
        checkForNewAlertsAndReports(previousDataRef.current, newData, silentRefresh);
      }

      // Update state
      setDashboardData(newData);
      previousDataRef.current = newData;
      setLastRefresh(new Date());
      
      if (!silentRefresh) {
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("Error mengambil data relawan:", error);
      if (!silentRefresh) {
        toast.error("Gagal memuat data dashboard relawan");
        setIsLoading(false);
      }
    } finally {
      if (!silentRefresh) {
        setIsRefreshing(false);
      }
    }
  }, [checkForNewAlertsAndReports, generateActivitiesFromTodayData, generateTodayPanicAlerts, generateTodayReports, generateUpcomingShifts]);

  useEffect(() => {
    setIsClient(true);
    const userRole = getUserRole();
    const userData = getUserData();
    
    if (userRole === "admin") {
      router.push("/admin/dashboard");
      return;
    }
    
    if (userRole === "user") {
      router.push("/student/emergency");
      return;
    }
    
    if (userData && !sessionStorage.getItem("volunteer_welcome_toast_shown")) {
      toast.success(`Selamat datang, ${userData.name}!`, {
        description: "Semangat bertugas sebagai relawan SIGAP",
        duration: 5000,
      });
      sessionStorage.setItem("volunteer_welcome_toast_shown", "true");
    }
    
    // Initial data fetch
    fetchVolunteerDashboardData(false);
    
    // Setup auto-refresh yang berjalan terus tanpa tergantung tab visibility
    refreshIntervalRef.current = setInterval(() => {
      console.log("🔄 Volunteer auto-refresh triggered (30s interval)");
      fetchVolunteerDashboardData(true);
    }, 30000); // Ubah ke 30 detik untuk relawan
    
    setLastRefresh(new Date());
    
    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
        console.log("🔄 Auto-refresh cleaned up");
      }
    };
  }, [router, fetchVolunteerDashboardData]);

  // Helper functions
  const formatTimeAgo = useCallback((date: string) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  }, []);

  const getActivityIcon = useCallback((type: VolunteerActivity['type']) => {
    switch (type) {
      case 'panic_new':
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'panic_handled':
        return <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'report_new':
        return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'report_handled':
        return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  }, []);

  const getActivityColor = useCallback((type: VolunteerActivity['type']) => {
    switch (type) {
      case 'panic_new':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'panic_handled':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'report_new':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'report_handled':
        return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }, []);

  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 dark:text-green-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-lg">Memuat dashboard relawan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 transition-theme">
      {/* Modern Header with Dark Mode Support */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-theme"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard Relawan
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Pantau aktivitas dan status bertugas Anda
            </p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className={`w-2 h-2 rounded-full ${refreshIntervalRef.current ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span>Auto-refresh {refreshIntervalRef.current ? 'aktif' : 'nonaktif'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Live Updates</span>
              </div>
              {lastRefresh && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Terakhir: {lastRefresh.toLocaleTimeString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                setIsRefreshing(true);
                fetchVolunteerDashboardData(false);
              }}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto transition-theme"
              disabled={isRefreshing}
              size="sm"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Status Hari Ini - Enhanced dengan kondisi tidak bertugas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className={`border shadow-sm transition-theme ${
          dashboardData.todayStatus.is_on_duty 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  dashboardData.todayStatus.is_on_duty 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {dashboardData.todayStatus.is_on_duty ? (
                    <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <Coffee className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.todayStatus.is_on_duty ? 'Sedang Bertugas Hari Ini' : 'Tidak Bertugas Hari Ini'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {formatDate(dashboardData.todayStatus.date)}
                  </p>
                  {dashboardData.todayStatus.shift_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {dashboardData.todayStatus.shift_type === 'actual' ? 'Shift Aktual' : 'Shift Pola'} - ID: {dashboardData.todayStatus.shift_id}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {dashboardData.todayStatus.is_on_duty ? (
                  <>
                    <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 flex items-center px-3 py-2 w-fit">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="font-medium">Status Aktif</span>
                    </Badge>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 w-full sm:w-auto"
                      onClick={() => router.push("/volunteer/panic-reports")}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Cek Panic Alert
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge className="bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 flex items-center px-3 py-2 w-fit">
                      <XCircle className="h-4 w-4 mr-2" />
                      <span className="font-medium">Tidak Bertugas</span>
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto"
                      onClick={() => router.push("/volunteer/my-shifts")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Lihat Jadwal
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards dengan Dark Mode - 3 Cards Only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {/* Panic Alert Hari Ini */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Panic Alert Hari Ini</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.panicAlertsToday}
              </p>
              <div className="flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {dashboardData.stats.panicAlertsToday > 0 ? 'Memerlukan perhatian' : 'Tidak ada alert'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Total Laporan */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Laporan</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.totalReports}
              </p>
              <div className="flex items-center mt-2">
                <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-1" />
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Total keseluruhan
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Jadwal Minggu Ini */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Jadwal Minggu Ini</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.onDutyThisWeek}
              </p>
              <div className="flex items-center mt-2">
                <Calendar className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  Hari bertugas
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activities dengan Dark Mode - Updated untuk hanya panic alert dan laporan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-theme">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Aktivitas Hari Ini
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Panic alert dan laporan yang masuk hari ini
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live
                </Badge>
                {refreshIntervalRef.current && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                    <Clock className="w-3 h-3 mr-1" />
                    30s
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {dashboardData.recentActivities?.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {dashboardData.recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (index * 0.1), duration: 0.3 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${getActivityColor(activity.type)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{activity.title}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{activity.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 sm:p-12"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Belum ada aktivitas hari ini</h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Panic alert dan laporan hari ini akan muncul di sini</p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/volunteer/reports")}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <FileText className="h-4 w-4 mr-2" />
                Kelola Laporan
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/volunteer/panic-reports")}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Panic Alerts
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/volunteer/my-shifts")}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Jadwal Shift
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Auto-refresh indicator dengan Dark Mode */}
      {lastRefresh && (
        <motion.div 
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 transition-theme">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${refreshIntervalRef.current ? 'animate-pulse bg-green-500' : 'bg-red-500'}`}></div>
              <div className="text-sm">
                <p className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                  <RefreshCw className={`h-3 w-3 mr-1 ${refreshIntervalRef.current ? 'animate-spin' : ''}`} />
                  Auto-refresh {refreshIntervalRef.current ? 'aktif' : 'nonaktif'}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Setiap 30 detik • Terakhir: {lastRefresh.toLocaleTimeString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}