// src/app/volunteer/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserRole, getAccessToken, getUserData } from "@/lib/auth";
import { Loader2, FileText, AlertTriangle, TrendingUp, Shield, CheckCircle, Clock, Image, User } from "lucide-react";
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

// Definisi interface untuk aktivitas
interface Activity {
  id: string;
  type: 'report' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  icon: 'Image' | 'AlertTriangle';
}

export default function VolunteerDashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [reportCount, setReportCount] = useState<number>(0);
  const [alertCount, setAlertCount] = useState<number>(3); // Data dummy untuk peringatan
  const [activities, setActivities] = useState<Activity[]>([]);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    // Dapatkan peran pengguna
    const userRole = getUserRole();
    const userData = getUserData();
    setRole(userRole);
    
    // Jika pengguna adalah pengguna biasa, arahkan ke halaman mahasiswa
    if (userRole === "user") {
      router.push("/student/emergency");
      return;
    }
    
    // Jika pengguna adalah admin, arahkan ke dashboard admin
    if (userRole === "admin") {
      router.push("/admin/dashboard");
      return;
    }
    
    // Tampilkan toast selamat datang jika belum ditampilkan
    if (userData && !sessionStorage.getItem("volunteer_welcome_toast_shown")) {
      toast.success(`Selamat datang, ${userData.name}!`, {
        description: "Selamat bekerja di dashboard relawan"
      });
      sessionStorage.setItem("volunteer_welcome_toast_shown", "true");
    }
    
    // Ambil hitungan dan aktivitas
    fetchCounts();
  }, [router]);

  const fetchCounts = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Autentikasi diperlukan");
        return;
      }

      // Ambil jumlah laporan
      const reportResponse = await fetch("/api/reports", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        let reports = [];
        
        // Jika respons adalah objek dengan array 'data' (respons terpaginasi)
        if (reportData && reportData.data && Array.isArray(reportData.data)) {
          reports = reportData.data;
          setReportCount(reportData.total || reportData.data.length);
        } 
        // Jika respons adalah array langsung
        else if (Array.isArray(reportData)) {
          reports = reportData;
          setReportCount(reportData.length);
        }
        
        // Tambahkan aktivitas laporan
        const reportActivities: Activity[] = reports.slice(0, 3).map((report: any) => ({
          id: `report-${report.id}`,
          type: 'report',
          title: "Laporan dikirim dengan foto",
          description: `Di ${report.location}, masalah ${report.problem_type} dilaporkan`,
          timestamp: new Date(report.created_at),
          icon: 'Image'
        }));
        
        // Buat aktivitas peringatan darurat dummy
        const alertActivities: Activity[] = [
          {
            id: 'alert-1',
            type: 'alert',
            title: "Peringatan darurat dipicu",
            description: "Di Fakultas Teknik, respons cepat oleh tim",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 jam yang lalu
            icon: 'AlertTriangle'
          },
          {
            id: 'alert-2',
            type: 'alert',
            title: "Situasi darurat teratasi",
            description: "Tim medis merespons di Gedung Sains",
            timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000), // 9 jam yang lalu
            icon: 'AlertTriangle'
          }
        ];
        
        // Gabungkan semua aktivitas dan urutkan berdasarkan waktu (terbaru lebih dulu)
        const allActivities = [...reportActivities, ...alertActivities]
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setActivities(allActivities);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error mengambil data:", error);
      toast.error("Gagal memuat data dashboard");
      setIsLoading(false);
    }
  };

  // Fungsi pembantu untuk memformat tanggal untuk tampilan
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  };

  // Dapatkan komponen ikon berdasarkan jenis aktivitas
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'report':
        return <Image size={16} className="text-green-600" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <FileText size={16} />;
    }
  };

  // Dapatkan kelas warna latar belakang untuk ikon aktivitas
  const getIconBgColor = (type: string) => {
    switch(type) {
      case 'report':
        return 'bg-green-100';
      case 'alert':
        return 'bg-red-100';
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
    return null; // Jangan mengembalikan apa pun selama rendering sisi server
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Konten ikhtisar dashboard relawan
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
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Relawan</h1>
          <div className="flex items-center mt-2">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm text-green-600 font-medium">Status: Relawan Aktif</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex space-x-2"
        >
          <Button 
            onClick={() => router.push('/volunteer/reports')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Lihat Laporan
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          custom={0} 
          initial="hidden" 
          animate="visible" 
          variants={cardVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100">
              <CardTitle className="text-green-900 flex items-center text-lg">
                <Image className="h-5 w-5 mr-2 text-green-600" />
                Laporan Foto
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-gray-800">{reportCount}</span>
                  <span className="text-sm text-gray-500">Total laporan</span>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                  <Image className="h-6 w-6 text-green-600" />
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
            <CardHeader className="pb-2 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-100">
              <CardTitle className="text-red-900 flex items-center text-lg">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Peringatan Darurat
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-gray-800">{alertCount}</span>
                  <span className="text-sm text-gray-500">Dalam 24 jam</span>
                </div>
                <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
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
              <CardTitle className="text-blue-900 flex items-center text-lg">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Status Relawan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-lg font-bold text-gray-800">Aktif</span>
                  </div>
                  <span className="text-sm text-gray-500">Siap bertugas</span>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border border-gray-200 shadow-sm h-full">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-xl font-bold text-gray-800">Aktivitas Terbaru</CardTitle>
              <CardDescription>
                Ikhtisar aktivitas sistem terbaru yang dapat Anda tangani
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + (index * 0.1), duration: 0.3 }}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (activity.type === 'report') {
                          router.push('/volunteer/reports');
                        }
                      }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${getIconBgColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(activity.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">Tidak ada aktivitas terbaru</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border border-gray-200 shadow-sm h-full">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-xl font-bold text-gray-800">Tugas Relawan</CardTitle>
              <CardDescription>
                Panduan tugas sebagai relawan
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Meninjau Laporan</p>
                    <p className="text-xs text-gray-500 mt-1">Periksa dan update status laporan yang masuk</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                   <p className="text-sm font-medium text-gray-800">Merespons Darurat</p>
                   <p className="text-xs text-gray-500 mt-1">Tanggap terhadap situasi darurat di kampus</p>
                 </div>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                   <span className="text-xs font-medium text-blue-600">3</span>
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-800">Koordinasi Tim</p>
                   <p className="text-xs text-gray-500 mt-1">Berkoordinasi dengan tim keamanan kampus</p>
                 </div>
               </div>
               <div className="mt-6">
                 <Button 
                   onClick={() => router.push('/volunteer/reports')}
                   className="w-full bg-blue-600 hover:bg-blue-700"
                   size="sm"
                 >
                   Mulai Bertugas
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