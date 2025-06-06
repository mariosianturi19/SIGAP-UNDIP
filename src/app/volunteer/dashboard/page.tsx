// src/app/volunteer/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserRole, getAccessToken, getUserData } from "@/lib/auth";
import { Loader2, FileText, AlertTriangle, TrendingUp, Shield, CheckCircle, Clock, Image, User, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { MyShiftsResponse } from "@/types/shift";
import type { TodayPanicReportsResponse } from "@/types/panic";

// Activity interface
interface Activity {
  id: string;
  type: 'report' | 'panic' | 'shift';
  title: string;
  description: string;
  timestamp: Date;
  icon: 'Image' | 'AlertTriangle' | 'Calendar';
}

export default function VolunteerDashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [reportCount, setReportCount] = useState<number>(0);
  const [todayPanicCount, setTodayPanicCount] = useState<number>(0);
  const [myShiftsData, setMyShiftsData] = useState<MyShiftsResponse | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const userRole = getUserRole();
    const userData = getUserData();
    setRole(userRole);
    
    if (userRole === "user") {
      router.push("/student/emergency");
      return;
    }
    
    if (userRole === "admin") {
      router.push("/admin/dashboard");
      return;
    }
    
    if (userData && !sessionStorage.getItem("volunteer_welcome_toast_shown")) {
      toast.success(`Selamat datang, ${userData.name}!`, {
        description: "Selamat bekerja di dashboard relawan"
      });
      sessionStorage.setItem("volunteer_welcome_toast_shown", "true");
    }
    
    fetchCounts();
  }, [router]);

  const fetchCounts = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Autentikasi diperlukan");
        return;
      }

      let allActivities: Activity[] = [];

      // Fetch today's panic reports
      const todayPanicResponse = await fetch("/api/relawan/panic-reports/today", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (todayPanicResponse.ok) {
        const todayPanicData: TodayPanicReportsResponse = await todayPanicResponse.json();
        setTodayPanicCount(todayPanicData.total_reports || 0);
        
        const panicActivities: Activity[] = todayPanicData.data?.slice(0, 3).map((panic: any, index: number) => ({
          id: `panic-${panic.id}-${panic.created_at}-${index}`,
          type: 'panic',
          title: "Peringatan darurat dipicu",
          description: `Laporan panic #${panic.id} dari ${panic.user?.name || 'Pengguna'}`,
          timestamp: new Date(panic.created_at),
          icon: 'AlertTriangle'
        })) || [];
        
        allActivities = [...allActivities, ...panicActivities];
      }

      // Fetch my shifts
      const myShiftsResponse = await fetch("/api/relawan/my-shifts", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (myShiftsResponse.ok) {
        const shiftsData: MyShiftsResponse = await myShiftsResponse.json();
        setMyShiftsData(shiftsData);
        
        const shiftActivities: Activity[] = shiftsData.upcoming_shifts?.slice(0, 2).map((shift: any, index: number) => ({
          id: `shift-${shift.shift_id || shift.date}-${index}`,
          type: 'shift',
          title: "Shift mendatang",
          description: `Bertugas pada ${shift.day_name}, ${shift.date_formatted}`,
          timestamp: new Date(shift.date),
          icon: 'Calendar'
        })) || [];
        
        allActivities = [...allActivities, ...shiftActivities];
      }

      // Fetch total reports
      const reportResponse = await fetch("/api/reports", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        let reports = [];
        
        if (reportData && reportData.data && Array.isArray(reportData.data)) {
          reports = reportData.data;
          setReportCount(reportData.total || reportData.data.length);
        } 
        else if (Array.isArray(reportData)) {
          reports = reportData;
          setReportCount(reportData.length);
        }
        
        const reportActivities: Activity[] = reports.slice(0, 2).map((report: any, index: number) => ({
          id: `report-${report.id}-${report.created_at}-${index}`,
          type: 'report',
          title: "Laporan dikirim dengan foto",
          description: `Di ${report.location}, masalah ${report.problem_type} dilaporkan`,
          timestamp: new Date(report.created_at),
          icon: 'Image'
        }));
        
        allActivities = [...allActivities, ...reportActivities];
      }

      // Sort and dedupe activities
      const uniqueActivities = allActivities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .filter((activity, index, array) => 
          array.findIndex(item => item.id === activity.id) === index
        );

      setActivities(uniqueActivities);
      setIsLoading(false);
    } catch (error) {
      console.error("Error mengambil data:", error);
      toast.error("Gagal memuat data dashboard");
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  };

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'report':
        return <Image size={16} className="text-green-600" />;
      case 'panic':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'shift':
        return <Calendar size={16} className="text-blue-600" />;
      default:
        return <FileText size={16} />;
    }
  };

  const getIconBgColor = (type: string) => {
    switch(type) {
      case 'report':
        return 'bg-green-100';
      case 'panic':
        return 'bg-red-100';
      case 'shift':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Relawan</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-green-600 font-medium">Status: Relawan Aktif</span>
            </div>
            {myShiftsData?.today_status?.is_on_duty && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full w-fit">
                Bertugas Hari Ini
              </span>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
        >
          <Button 
            onClick={() => router.push('/volunteer/panic-reports')}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Panic Hari Ini</span>
            <span className="sm:hidden">Panic</span>
          </Button>
          <Button 
            onClick={() => router.push('/volunteer/my-shifts')}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Jadwal Saya</span>
            <span className="sm:hidden">Jadwal</span>
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div 
          custom={0} 
          initial="hidden" 
          animate="visible" 
          variants={cardVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-100">
              <CardTitle className="text-red-900 flex items-center text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600" />
                <span className="hidden sm:inline">Panic Hari Ini</span>
                <span className="sm:hidden">Panic</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-800">{todayPanicCount}</span>
                  <span className="text-xs sm:text-sm text-gray-500">Laporan darurat</span>
               </div>
               <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-50 rounded-full flex items-center justify-center">
                 <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>

       <motion.div 
         custom={1} 
         initial="hidden" 
         animate="visible" 
         variants={cardVariants}
         whileHover={{ y: -5, transition: { duration: 0.2 } }}
       >
         <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100">
             <CardTitle className="text-green-900 flex items-center text-base sm:text-lg">
               <Image className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
               <span className="hidden sm:inline">Laporan Foto</span>
               <span className="sm:hidden">Laporan</span>
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-4 sm:pt-6">
             <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-2xl sm:text-3xl font-bold text-gray-800">{reportCount}</span>
                 <span className="text-xs sm:text-sm text-gray-500">Total laporan</span>
               </div>
               <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-50 rounded-full flex items-center justify-center">
                 <Image className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>

       <motion.div 
         custom={2} 
         initial="hidden" 
         animate="visible" 
         variants={cardVariants}
         whileHover={{ y: -5, transition: { duration: 0.2 } }}
       >
         <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
             <CardTitle className="text-blue-900 flex items-center text-base sm:text-lg">
               <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
               <span className="hidden sm:inline">Jadwal Minggu Ini</span>
               <span className="sm:hidden">Jadwal</span>
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-4 sm:pt-6">
             <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                   {myShiftsData?.summary?.total_scheduled_days || 0}
                 </span>
                 <span className="text-xs sm:text-sm text-gray-500">Hari bertugas</span>
               </div>
               <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 rounded-full flex items-center justify-center">
                 <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>

       <motion.div 
         custom={3} 
         initial="hidden" 
         animate="visible" 
         variants={cardVariants}
         whileHover={{ y: -5, transition: { duration: 0.2 } }}
       >
         <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-100">
             <CardTitle className="text-purple-900 flex items-center text-base sm:text-lg">
               <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
               <span className="hidden sm:inline">Status Relawan</span>
               <span className="sm:hidden">Status</span>
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-4 sm:pt-6">
             <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <div className="flex items-center">
                   <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                   <span className="text-base sm:text-lg font-bold text-gray-800">Aktif</span>
                 </div>
                 <span className="text-xs sm:text-sm text-gray-500">
                   {myShiftsData?.today_status?.is_on_duty ? "Bertugas hari ini" : "Siap bertugas"}
                 </span>
               </div>
               <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-50 rounded-full flex items-center justify-center">
                 <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     </div>

     {/* Main Content Grid */}
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       {/* Activities Section */}
       <motion.div 
         className="lg:col-span-2"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 0.3 }}
       >
         <Card className="border border-gray-200 shadow-sm h-full">
           <CardHeader className="pb-2 border-b">
             <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">Aktivitas Terbaru</CardTitle>
             <CardDescription className="text-sm">
               Ikhtisar aktivitas sistem terbaru yang dapat Anda tangani
             </CardDescription>
           </CardHeader>
           <CardContent className="p-0">
             <div className="divide-y divide-gray-100 max-h-96 sm:max-h-none overflow-y-auto">
               {activities.length > 0 ? (
                 activities.slice(0, 5).map((activity, index) => (
                   <motion.div
                     key={activity.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.4 + (index * 0.1), duration: 0.3 }}
                     className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                     onClick={() => {
                       if (activity.type === 'report') {
                         router.push('/volunteer/reports');
                       } else if (activity.type === 'panic') {
                         router.push('/volunteer/panic-reports');
                       } else if (activity.type === 'shift') {
                         router.push('/volunteer/my-shifts');
                       }
                     }}
                   >
                     <div className="flex items-start space-x-3">
                       <div className={`p-1.5 sm:p-2 rounded-full ${getIconBgColor(activity.type)} flex-shrink-0`}>
                         {getActivityIcon(activity.type)}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                           <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{activity.title}</p>
                           <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(activity.timestamp)}</span>
                         </div>
                         <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-2">{activity.description}</p>
                       </div>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="p-6 sm:p-8 text-center text-gray-500">
                   <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
                   <p className="text-sm sm:text-base">Tidak ada aktivitas terbaru</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </motion.div>

       {/* Sidebar - Schedule & Tasks */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 0.4 }}
       >
         <Card className="border border-gray-200 shadow-sm h-full">
           <CardHeader className="pb-2 border-b">
             <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">Jadwal & Tugas</CardTitle>
             <CardDescription className="text-sm">
               Status jadwal dan tugas relawan hari ini
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-4 sm:pt-6">
             <div className="space-y-4">
               {/* Today Status */}
               {myShiftsData?.today_status && (
                 <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                     <h4 className="font-medium text-blue-900 text-sm sm:text-base">Status Hari Ini</h4>
                     <span className={`px-2 py-1 rounded-full text-xs ${
                       myShiftsData.today_status.is_on_duty 
                         ? 'bg-green-100 text-green-800' 
                         : 'bg-gray-100 text-gray-800'
                     }`}>
                       {myShiftsData.today_status.is_on_duty ? 'Bertugas' : 'Libur'}
                     </span>
                   </div>
                   <p className="text-xs sm:text-sm text-blue-700">
                     {myShiftsData.today_status.day_name}
                   </p>
                 </div>
               )}

               {/* Weekly Summary */}
               {myShiftsData?.summary && (
                 <div className="space-y-3">
                   <h4 className="font-medium text-gray-900 text-sm sm:text-base">Ringkasan Minggu Ini</h4>
                   <div className="space-y-2 text-xs sm:text-sm">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Hari bertugas:</span>
                       <span className="font-medium">{myShiftsData.summary.total_scheduled_days} hari</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Persentase:</span>
                       <span className="font-medium">{myShiftsData.summary.work_days_this_week}</span>
                     </div>
                   </div>
                 </div>
               )}

               {/* Upcoming Shifts */}
               {myShiftsData?.upcoming_shifts && myShiftsData.upcoming_shifts.length > 0 && (
                 <div className="space-y-3">
                   <h4 className="font-medium text-gray-900 text-sm sm:text-base">Shift Mendatang</h4>
                   <div className="space-y-2">
                     {myShiftsData.upcoming_shifts.slice(0, 3).map((shift, index) => (
                       <div 
                         key={`upcoming-shift-${shift.date}-${index}`}
                         className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                       >
                         <div className="flex items-center">
                           <Calendar className="h-3 w-3 text-gray-400 mr-2 flex-shrink-0" />
                           <span className="text-xs sm:text-sm text-gray-700 truncate">{shift.day_name}</span>
                         </div>
                         <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{shift.date_formatted}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Quick Actions */}
               <div className="space-y-2 pt-4 border-t">
                 <Button 
                   onClick={() => router.push('/volunteer/panic-reports')}
                   className="w-full bg-red-600 hover:bg-red-700"
                   size="sm"
                 >
                   <AlertTriangle className="h-4 w-4 mr-2" />
                   Cek Panic Hari Ini
                 </Button>
                 <Button 
                   onClick={() => router.push('/volunteer/my-shifts')}
                   variant="outline"
                   className="w-full"
                   size="sm"
                 >
                   <Calendar className="h-4 w-4 mr-2" />
                   Lihat Jadwal Lengkap
                 </Button>
                 <Button 
                   onClick={() => router.push('/volunteer/reports')}
                   variant="outline"
                   className="w-full"
                   size="sm"
                 >
                   <FileText className="h-4 w-4 mr-2" />
                   Kelola Laporan
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     </div>
   </motion.div>
 );
}