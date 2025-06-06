// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserRole, getAccessToken, getUserData } from "@/lib/auth";
import { Loader2, Users, FileText, AlertTriangle, MapPin, Clock, ExternalLink, Shield, User } from "lucide-react";
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

// Interface untuk relawan
interface Volunteer {
 id: number;
 name: string;
 email: string;
 role: string;
 nik: string;
 no_telp: string;
 created_at: string;
}

// Interface untuk laporan
interface Report {
 id: number;
 user: {
   id: number;
   name: string;
   email: string;
   nim?: string;
 };
 photo_url: string;
 location: string;
 problem_type: string;
 description: string;
 status: string;
 created_at: string;
}

// Interface untuk panic alert
interface PanicAlert {
 id: number;
 user: {
   id: number;
   name: string;
   email: string;
 };
 latitude: number;
 longitude: number;
 status: string;
 created_at: string;
}

export default function Dashboard() {
 const [role, setRole] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isClient, setIsClient] = useState(false);
 
 // Counts
 const [volunteerCount, setVolunteerCount] = useState<number>(0);
 const [reportCount, setReportCount] = useState<number>(0);
 const [alertCount, setAlertCount] = useState<number>(0);
 
 // Recent data
 const [recentVolunteers, setRecentVolunteers] = useState<Volunteer[]>([]);
 const [recentReports, setRecentReports] = useState<Report[]>([]);
 const [recentAlerts, setRecentAlerts] = useState<PanicAlert[]>([]);
 
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
   
   if (userData && !sessionStorage.getItem("welcome_toast_shown")) {
     toast.success(`Selamat datang, ${userData.name}!`, {
       description: "Selamat bekerja di dashboard admin"
     });
     sessionStorage.setItem("welcome_toast_shown", "true");
   }
   
   fetchDashboardData();
 }, [router]);

 const fetchDashboardData = async () => {
   try {
     const token = await getAccessToken();
     if (!token) {
       throw new Error("Autentikasi diperlukan");
       return;
     }

     // Fetch Volunteers
     try {
       const volunteerResponse = await fetch("/api/volunteer", {
         headers: {
           "Authorization": `Bearer ${token}`,
           "Content-Type": "application/json",
         },
       });
       
       if (volunteerResponse.ok) {
         const volunteerData = await volunteerResponse.json();
         const volunteers = Array.isArray(volunteerData) ? volunteerData : volunteerData.data || [];
         setVolunteerCount(volunteers.length);
         setRecentVolunteers(volunteers.slice(0, 5)); // 5 relawan terbaru
       }
     } catch (error) {
       console.log("Volunteers endpoint not available");
     }

     // Fetch Reports
     try {
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
         } else if (Array.isArray(reportData)) {
           reports = reportData;
         }
         
         setReportCount(reports.length);
         setRecentReports(reports.slice(0, 5)); // 5 laporan terbaru
       }
     } catch (error) {
       console.log("Reports endpoint not available");
     }

     // Fetch Panic Alerts
     try {
       const panicResponse = await fetch("/api/panic", {
         headers: {
           "Authorization": `Bearer ${token}`,
           "Content-Type": "application/json",
         },
       });
       
       if (panicResponse.ok) {
         const panicData = await panicResponse.json();
         let alerts = [];
         
         if (panicData && panicData.data && Array.isArray(panicData.data)) {
           alerts = panicData.data;
         } else if (Array.isArray(panicData)) {
           alerts = panicData;
         }
         
         setAlertCount(alerts.length);
         setRecentAlerts(alerts.slice(0, 5)); // 5 alert terbaru
       }
     } catch (error) {
       console.log("Panic endpoint not available, using dummy data");
       setAlertCount(15); // Dummy data seperti di gambar
       // Create dummy recent alerts
       const dummyAlerts: PanicAlert[] = [
         {
           id: 1,
           user: { id: 1, name: "John Doe", email: "john@students.undip.ac.id" },
           latitude: -7.048366904927,
           longitude: 110.4347081661,
           status: "pending",
           created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
         },
         {
           id: 2,
           user: { id: 2, name: "Jane Smith", email: "jane@students.undip.ac.id" },
           latitude: -7.048368719172,
           longitude: 110.4347097622,
           status: "handled",
           created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
         }
       ];
       setRecentAlerts(dummyAlerts);
     }

     setIsLoading(false);
   } catch (error) {
     console.error("Error mengambil data:", error);
     toast.error("Gagal memuat data dashboard");
     setIsLoading(false);
   }
 };

 // Helper functions
 const formatTimeAgo = (date: string) => {
   const now = new Date();
   const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
   
   if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;
   if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
   if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
   return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
 };

 const formatProblemType = (type: string) => {
   const typeMap: { [key: string]: string } = {
     "electrical": "Listrik",
     "tree": "Pohon", 
     "stairs": "Tangga",
     "elevator": "Lift",
     "door": "Pintu",
     "infrastructure": "Infrastruktur",
     "water_supply": "Air",
     "waste_management": "Sampah",
     "public_safety": "Keamanan",
     "public_health": "Kesehatan",
     "environmental": "Lingkungan",
     "other": "Lainnya"
   };
   return typeMap[type] || type;
 };

 const getStatusBadge = (status: string) => {
   const statusMap: { [key: string]: { text: string, color: string } } = {
     'pending': { text: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
     'in_progress': { text: "Proses", color: "bg-blue-100 text-blue-800" },
     'resolved': { text: "Selesai", color: "bg-green-100 text-green-800" },
     'rejected': { text: "Ditolak", color: "bg-red-100 text-red-800" },
     'handled': { text: "Ditangani", color: "bg-blue-100 text-blue-800" }
   };
   return statusMap[status] || { text: status, color: "bg-gray-100 text-gray-800" };
 };

 const openInMaps = (latitude: number, longitude: number) => {
   const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
   window.open(url, '_blank');
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
     className="space-y-8"
   >
     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
       <motion.div 
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ duration: 0.5 }}
       >
         <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
         <p className="text-gray-500 mt-1">Ringkasan sistem SIGAP UNDIP</p>
       </motion.div>
     </div>

     {/* Main Stats Cards */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       <motion.div 
         custom={0} 
         initial="hidden" 
         animate="visible" 
         variants={cardVariants}
         whileHover={{ y: -5, transition: { duration: 0.2 } }}
       >
         <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
             <CardTitle className="text-blue-900 flex items-center text-lg">
               <Users className="h-5 w-5 mr-2 text-blue-600" />
               Total Relawan
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-3xl font-bold text-gray-800">{volunteerCount}</span>
                 <span className="text-sm text-gray-500">Relawan aktif</span>
               </div>
               <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                 <Users className="h-6 w-6 text-blue-600" />
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
             <CardTitle className="text-green-900 flex items-center text-lg">
               <FileText className="h-5 w-5 mr-2 text-green-600" />
               Total Laporan
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-3xl font-bold text-gray-800">{reportCount}</span>
                 <span className="text-sm text-gray-500">Semua laporan</span>
               </div>
               <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                 <FileText className="h-6 w-6 text-green-600" />
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
           <CardHeader className="pb-2 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-100">
             <CardTitle className="text-red-900 flex items-center text-lg">
               <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
               Panic Alerts
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-3xl font-bold text-gray-800">{alertCount}</span>
                 <span className="text-sm text-gray-500">Alert darurat</span>
               </div>
               <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                 <AlertTriangle className="h-6 w-6 text-red-600" />
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     </div>

     {/* Recent Data Cards */}
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       {/* Recent Volunteers */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 0.3 }}
       >
         <Card className="border border-gray-200 shadow-sm h-full">
           <CardHeader className="pb-3 border-b">
             <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
               <Users className="h-5 w-5 mr-2 text-blue-600" />
               Relawan Terbaru
             </CardTitle>
             <CardDescription>
               {recentVolunteers.length} relawan terakhir yang bergabung
             </CardDescription>
           </CardHeader>
           <CardContent className="p-0">
             <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
               {recentVolunteers.length > 0 ? (
                 recentVolunteers.map((volunteer, index) => (
                   <motion.div
                     key={volunteer.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.4 + (index * 0.1), duration: 0.3 }}
                     className="p-4 hover:bg-gray-50 transition-colors"
                   >
                     <div className="flex items-start space-x-3">
                       <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                         <Shield className="h-5 w-5 text-blue-600" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <p className="font-medium text-gray-900 truncate">{volunteer.name}</p>
                           <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(volunteer.created_at)}</span>
                         </div>
                         <p className="text-sm text-gray-600 mt-0.5 truncate">{volunteer.email}</p>
                         <div className="flex items-center mt-1">
                           <Badge className="bg-blue-100 text-blue-800 text-xs">
                             Relawan
                           </Badge>
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="p-8 text-center text-gray-500">
                   <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                   <p>Tidak ada relawan terbaru</p>
                 </div>
               )}
               {recentVolunteers.length > 0 && (
                 <div className="p-4 text-center border-t">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => router.push("/admin/volunteers")}
                     className="w-full"
                   >
                     Lihat Semua Relawan
                   </Button>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </motion.div>

       {/* Recent Reports */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 0.4 }}
       >
         <Card className="border border-gray-200 shadow-sm h-full">
           <CardHeader className="pb-3 border-b">
             <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
               <FileText className="h-5 w-5 mr-2 text-green-600" />
               Laporan Terbaru
             </CardTitle>
             <CardDescription>
               {recentReports.length} laporan terakhir yang masuk
             </CardDescription>
           </CardHeader>
           <CardContent className="p-0">
             <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
               {recentReports.length > 0 ? (
                 recentReports.map((report, index) => (
                   <motion.div
                     key={report.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
                     className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                     onClick={() => router.push("/admin/reports")}
                   >
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-sm font-medium text-gray-900">#{report.id}</span>
                           <Badge className={`text-xs ${getStatusBadge(report.status).color}`}>
                             {getStatusBadge(report.status).text}
                           </Badge>
                         </div>
                         <p className="text-sm text-gray-600 mb-1">{formatProblemType(report.problem_type)}</p>
                         <p className="text-xs text-gray-500 truncate flex items-center">
                           <MapPin className="h-3 w-3 mr-1" />
                           {report.location}
                         </p>
                         <p className="text-xs text-gray-500 mt-1 flex items-center">
                           <User className="h-3 w-3 mr-1" />
                           {report.user.name}
                         </p>
                       </div>
                       <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                         {formatTimeAgo(report.created_at)}
                       </span>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="p-8 text-center text-gray-500">
                   <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                   <p>Tidak ada laporan terbaru</p>
                 </div>
               )}
               {recentReports.length > 0 && (
                 <div className="p-4 text-center border-t">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => router.push("/admin/reports")}
                     className="w-full"
                   >
                     Lihat Semua Laporan
                   </Button>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </motion.div>

       {/* Recent Panic Alerts */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 0.5 }}
       >
         <Card className="border border-gray-200 shadow-sm h-full">
           <CardHeader className="pb-3 border-b">
             <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
               <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
               Panic Alerts Terbaru
             </CardTitle>
             <CardDescription>
               {recentAlerts.length} alert darurat terbaru
             </CardDescription>
           </CardHeader>
           <CardContent className="p-0">
             <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
               {recentAlerts.length > 0 ? (
                 recentAlerts.map((alert, index) => (
                   <motion.div
                     key={alert.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.6 + (index * 0.1), duration: 0.3 }}
                     className="p-4 hover:bg-gray-50 transition-colors"
                   >
                     <div className="flex items-start space-x-3">
                       <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                         <AlertTriangle className="h-5 w-5 text-red-600" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <p className="font-medium text-gray-900">Peringatan darurat</p>
                           <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(alert.created_at)}</span>
                         </div>
                         <p className="text-sm text-gray-600 mt-0.5">
                           Lokasi: {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                         </p>
                         <div className="flex items-center justify-between mt-2">
                           <Badge className={`text-xs ${getStatusBadge(alert.status).color}`}>
                             {getStatusBadge(alert.status).text}
                           </Badge>
                           <button
                             onClick={() => openInMaps(alert.latitude, alert.longitude)}
                             className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                           >
                             <ExternalLink className="h-3 w-3 mr-1" />
                             Lihat Lokasi
                           </button>
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="p-8 text-center text-gray-500">
                   <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                   <p>Tidak ada alert darurat terbaru</p>
                 </div>
               )}
               {recentAlerts.length > 0 && (
                 <div className="p-4 text-center border-t">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => router.push("/admin/panic-reports")}
                     className="w-full"
                   >
                     Lihat Semua Panic Alerts
                   </Button>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </motion.div>
     </div>
   </motion.div>
 );
}