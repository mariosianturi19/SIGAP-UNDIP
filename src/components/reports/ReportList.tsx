// src/components/reports/ReportList.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
 RefreshCw, 
 Search, 
 Loader2, 
 FileText, 
 Clock, 
 CheckCircle, 
 AlertCircle, 
 XCircle,
 MapPin,
 Info,
 X,
 ExternalLink,
 ChevronDown,
 ChevronUp,
 MoreHorizontal,
 Calendar,
 SlidersHorizontal,
 Edit,
 Trash2,
 Save,
 Zap,
 TrendingUp,
 Activity
} from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from "next/image";

// Definisikan interface untuk laporan dan pengguna
interface ReportUser {
 id: number;
 name: string;
 email: string;
 role: string;
 nim?: string;
 jurusan?: string;
}

interface Report {
 id: number;
 user: ReportUser;
 photo_url: string;
 photo_path: string;
 location: string;
 problem_type: string;
 description: string;
 status: string;
 admin_notes: string | null;
 created_at: string;
 updated_at: string;
}

// Opsi status
const statusOptions = [
 { value: "all", label: "Semua Status" },
 { value: "pending", label: "Menunggu" },
 { value: "in_progress", label: "Dalam Proses" },
 { value: "resolved", label: "Diselesaikan" },
 { value: "rejected", label: "Ditolak" },
];

// Opsi jenis masalah
const problemTypeOptions = [
 { value: "all", label: "Semua Jenis" },
 { value: "electrical", label: "Masalah Listrik" },
 { value: "tree", label: "Bahaya Pohon" },
 { value: "stairs", label: "Masalah Tangga" },
 { value: "elevator", label: "Masalah Lift" },
 { value: "door", label: "Masalah Pintu" },
 { value: "infrastructure", label: "Infrastruktur" },
 { value: "water_supply", label: "Pasokan Air" },
 { value: "waste_management", label: "Pengelolaan Sampah" },
 { value: "public_safety", label: "Keselamatan Umum" },
 { value: "public_health", label: "Kesehatan Umum" },
 { value: "environmental", label: "Lingkungan" },
 { value: "other", label: "Lainnya" },
];

// Opsi status update untuk admin
const updateStatusOptions = [
 { value: "pending", label: "Menunggu" },
 { value: "in_progress", label: "Dalam Proses" },
 { value: "resolved", label: "Diselesaikan" },
 { value: "rejected", label: "Ditolak" },
];

export default function ReportList() {
 const [reports, setReports] = useState<Report[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [selectedReport, setSelectedReport] = useState<Report | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [statusFilter, setStatusFilter] = useState("all");
 const [typeFilter, setTypeFilter] = useState("all");
 const [sortField, setSortField] = useState<string>('date');
 const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
 const [isDetailOpen, setIsDetailOpen] = useState(false);
 const [isUpdating, setIsUpdating] = useState(false);
 const [isDeleting, setIsDeleting] = useState(false);
 const [showDeleteDialog, setShowDeleteDialog] = useState(false);
 const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
 const [updateStatus, setUpdateStatus] = useState("");
 const [adminNotes, setAdminNotes] = useState("");

 useEffect(() => {
   fetchReports();
 }, []);

 const fetchReports = async () => {
   setIsRefreshing(true);
   
   try {
     const token = await getAccessToken();
     if (!token) {
       toast.error("Autentikasi diperlukan");
       return;
     }

     const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/reports", {
       method: "GET",
       headers: {
         "Authorization": `Bearer ${token}`,
         "Content-Type": "application/json",
       },
     });
     
     const responseText = await response.text();
     
     let data;
     try {
       data = JSON.parse(responseText);
     } catch (e) {
       console.error("Gagal mengurai respons JSON:", e);
       throw new Error(`Gagal mengurai respons: ${responseText}`);
     }
     
     if (!response.ok) {
       const errorMessage = data.message || `Gagal mengambil laporan: ${response.status}`;
       throw new Error(errorMessage);
     }
     
     console.log("Data laporan:", data);
     
     if (Array.isArray(data)) {
       setReports(data);
     } 
     else if (data.data && Array.isArray(data.data)) {
       setReports(data.data);
     }
     else if (data.reports && Array.isArray(data.reports)) {
       setReports(data.reports);
     }
     else if (data.report) {
       setReports([data.report]);
     }
     else {
       console.warn("Format respons API tidak dikenal:", data);
       setReports([]);
     }
   } catch (error) {
     console.error("Error mengambil laporan:", error);
     toast.error(error instanceof Error ? error.message : "Gagal memuat laporan");
   } finally {
     setIsLoading(false);
     setIsRefreshing(false);
   }
 };

 // Update status laporan
 const updateReportStatus = async (reportId: number, newStatus: string, notes: string) => {
   setIsUpdating(true);
   
   try {
     const token = await getAccessToken();
     if (!token) {
       toast.error("Autentikasi diperlukan");
       return;
     }

     const response = await fetch(`/api/reports/${reportId}`, {
       method: "PATCH",
       headers: {
         "Authorization": `Bearer ${token}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         status: newStatus,
         admin_notes: notes,
       }),
     });

     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || "Gagal memperbarui laporan");
     }

     toast.success("Status laporan berhasil diperbarui");
     
     await fetchReports();
     
     if (selectedReport && selectedReport.id === reportId) {
       setSelectedReport({
         ...selectedReport,
         status: newStatus,
         admin_notes: notes,
       });
     }
     
     setIsDetailOpen(false);
     
   } catch (error) {
     console.error("Error memperbarui laporan:", error);
     toast.error(error instanceof Error ? error.message : "Gagal memperbarui laporan");
   } finally {
     setIsUpdating(false);
   }
 };

 // Delete laporan
 const deleteReport = async (reportId: number) => {
   setIsDeleting(true);
   
   try {
     const token = await getAccessToken();
     if (!token) {
       toast.error("Autentikasi diperlukan");
       return;
     }

     const response = await fetch(`/api/reports/${reportId}`, {
       method: "DELETE",
       headers: {
         "Authorization": `Bearer ${token}`,
       },
     });

     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || "Gagal menghapus laporan");
     }

     toast.success("Laporan berhasil dihapus");
     
     await fetchReports();
     
     setShowDeleteDialog(false);
     setIsDetailOpen(false);
     setReportToDelete(null);
     
   } catch (error) {
     console.error("Error menghapus laporan:", error);
     toast.error(error instanceof Error ? error.message : "Gagal menghapus laporan");
   } finally {
     setIsDeleting(false);
   }
 };

 // Format tanggal untuk tampilan yang lebih baik
 const formatDate = (dateString: string) => {
   const date = new Date(dateString);
   return new Intl.DateTimeFormat('id-ID', {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
   }).format(date);
 };

 // Format jam dalam WIB
 const formatTime = (dateString: string) => {
   const date = new Date(dateString);
   return new Intl.DateTimeFormat('id-ID', {
     hour: '2-digit',
     minute: '2-digit',
     hour12: false,
     timeZone: 'Asia/Jakarta'
   }).format(date) + ' WIB';
 };

 // Format untuk detail lengkap
 const formatFullDateTime = (dateString: string) => {
   const options: Intl.DateTimeFormatOptions = {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
     hour: '2-digit',
     minute: '2-digit',
     timeZone: 'Asia/Jakarta',
     hour12: false
   };
   return new Date(dateString).toLocaleDateString('id-ID', options) + ' WIB';
 };

 // Format jenis masalah untuk tampilan yang lebih baik
 const formatProblemType = (type: string) => {
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
 };

 // Dapatkan gaya badge status dan ikon
 const getStatusBadge = (status: string) => {
   const statusMap: { [key: string]: {text: string, color: string, icon: React.ReactNode} } = {
     'pending': {
       text: "Menunggu",
       color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
       icon: <Clock className="h-3.5 w-3.5 mr-1" />
     },
     'in_progress': {
       text: "Dalam Proses",
       color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
       icon: <Info className="h-3.5 w-3.5 mr-1" />
     },
     'resolved': {
       text: "Diselesaikan",
       color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
       icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
     },
     'rejected': {
       text: "Ditolak",
       color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
       icon: <XCircle className="h-3.5 w-3.5 mr-1" />
     }
   };
   
   return statusMap[status] || {
     text: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
     color: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
     icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />
   };
 };

 // Beralih arah pengurutan atau mengubah bidang pengurutan
 const handleSort = (field: string) => {
   if (field === sortField) {
     setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
   } else {
     setSortField(field);
     setSortDirection('asc');
   }
 };

 // Dapatkan ikon pengurutan
 const getSortIcon = (field: string) => {
   if (field !== sortField) return <ChevronDown className="h-4 w-4 opacity-40" />;
   return sortDirection === 'asc' ? (
     <ChevronUp className="h-4 w-4 text-blue-600" />
   ) : (
     <ChevronDown className="h-4 w-4 text-blue-600" />
   );
 };

 // Urutkan laporan
 const sortReports = (a: Report, b: Report) => {
   let valueA, valueB;
   
   switch (sortField) {
     case 'date':
       valueA = new Date(a.created_at).getTime();
       valueB = new Date(b.created_at).getTime();
       break;
     case 'status':
       valueA = a.status;
       valueB = b.status;
       break;
     case 'location':
       valueA = a.location.toLowerCase();
       valueB = b.location.toLowerCase();
       break;
     case 'type':
       valueA = a.problem_type;
       valueB = b.problem_type;
       break;
     default:
       valueA = new Date(a.created_at).getTime();
       valueB = new Date(b.created_at).getTime();
   }
   
   if (sortDirection === 'asc') {
     return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
   } else {
     return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
   }
 };

 // Filter laporan berdasarkan kueri pencarian dan filter
 const filteredReports = reports
   .filter(report => {
     const matchesSearch = 
       report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
       report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
       report.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       String(report.id).includes(searchQuery);
     
     const matchesStatus = statusFilter === "all" || report.status === statusFilter;
     const matchesType = typeFilter === "all" || report.problem_type === typeFilter;
     
     return matchesSearch && matchesStatus && matchesType;
   })
   .sort(sortReports);

 // Lihat detail laporan
 const handleViewReport = (report: Report) => {
   setSelectedReport(report);
   setUpdateStatus(report.status);
   setAdminNotes(report.admin_notes || "");
   setIsDetailOpen(true);
 };

 // Handle update status
 const handleUpdateStatus = async () => {
   if (!selectedReport) return;
   await updateReportStatus(selectedReport.id, updateStatus, adminNotes);
 };

 // Handle delete confirmation
 const handleDeleteClick = (report: Report) => {
   setReportToDelete(report);
   setShowDeleteDialog(true);
 };

 // Handle delete confirm
 const handleDeleteConfirm = async () => {
   if (!reportToDelete) return;
   await deleteReport(reportToDelete.id);
 };

 // Quick status updates
 const handleQuickStatusUpdate = async (reportId: number, newStatus: string, defaultNote: string) => {
   await updateReportStatus(reportId, newStatus, defaultNote);
 };

 // Variasi animasi
 const containerVariants = {
   hidden: { opacity: 0 },
   visible: { 
     opacity: 1,
     transition: { 
       staggerChildren: 0.05 
     } 
   }
 };

 const itemVariants = {
   hidden: { opacity: 0, y: 20 },
   visible: { 
     opacity: 1, 
     y: 0,
     transition: { type: "spring", stiffness: 100 }
   }
 };

 const detailVariants = {
   hidden: { opacity: 0, scale: 0.95 },
   visible: { 
     opacity: 1, 
     scale: 1,
     transition: { type: "spring", stiffness: 300, damping: 30 }
   },
   exit: {
     opacity: 0,
     scale: 0.95,
     transition: { duration: 0.2 }
   }
 };

 function handleRefresh(): void {
   setIsRefreshing(true);
   fetchReports();
 }

 return (
   <div className="space-y-4 sm:space-y-6 transition-theme">
     {/* Simplified Header with Dark Mode */}
     <motion.div 
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
       className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-theme"
     >
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
         <div>
           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
             Laporan Mahasiswa
           </h1>
           <p className="text-gray-600 dark:text-gray-300">
             Kelola dan pantau semua laporan yang dikirim oleh mahasiswa
           </p>
           <div className="flex items-center space-x-4 mt-3">
             <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               <span>Total: {reports.length} laporan</span>
             </div>
             <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
               <Activity className="w-4 h-4" />
               <span>Live Updates</span>
             </div>
           </div>
         </div>
         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
           <Button
             onClick={handleRefresh}
             className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
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

     {/* Simplified Stats Cards with Dark Mode */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.1 }}
       className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
     >
       {[
         { 
           label: "Total Laporan", 
           value: reports.length, 
           icon: FileText, 
           color: "text-blue-600 dark:text-blue-400",
           bg: "bg-blue-50 dark:bg-blue-900/20"
         },
         { 
           label: "Menunggu", 
           value: reports.filter(r => r.status === 'pending').length, 
           icon: Clock, 
           color: "text-amber-600 dark:text-amber-400",
           bg: "bg-amber-50 dark:bg-amber-900/20"
         },
         { 
           label: "Dalam Proses", 
           value: reports.filter(r => r.status === 'in_progress').length, 
           icon: Zap, 
           color: "text-purple-600 dark:text-purple-400",
           bg: "bg-purple-50 dark:bg-purple-900/20"
         },
         { 
           label: "Selesai", 
           value: reports.filter(r => r.status === 'resolved').length, 
           icon: CheckCircle, 
           color: "text-green-600 dark:text-green-400",
           bg: "bg-green-50 dark:bg-green-900/20"
         }
       ].map((stat) => (
         <div
           key={stat.label}
           className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
         >
           <div className="flex items-center justify-between">
             <div>
               <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
               <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
             </div>
             <div className={`p-2 rounded-lg ${stat.bg}`}>
               <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
             </div>
           </div>
         </div>
       ))}
     </motion.div>

     {/* Simplified Filters with Dark Mode */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.2 }}
     >
       <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-theme">
         <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
           <div className="flex items-center space-x-3">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
               <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
             </div>
             <div>
               <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Filter & Pencarian</CardTitle>
               <CardDescription className="text-gray-600 dark:text-gray-400">
                 Temukan laporan dengan mudah
               </CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="p-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pencarian</label>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                 <Input
                   placeholder="Cari berdasarkan deskripsi, lokasi, atau nama..."
                   className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
               <Select
                 value={statusFilter}
                 onValueChange={setStatusFilter}
                 options={statusOptions}
                 className="border-gray-300 dark:border-gray-600"
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jenis Masalah</label>
               <Select
                 value={typeFilter}
                 onValueChange={setTypeFilter}
                 options={problemTypeOptions}
                 className="border-gray-300 dark:border-gray-600"
               />
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>

     {/* Simplified Reports Table with Dark Mode */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.3 }}
     >
       <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-theme">
         <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                 <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
               </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Laporan</CardTitle>
                 <p className="text-sm text-gray-600 dark:text-gray-400">{filteredReports.length} laporan ditemukan</p>
               </div>
             </div>
             <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
               <TrendingUp className="w-3 h-3 mr-1" />
               Live
             </Badge>
           </div>
         </CardHeader>
         <CardContent className="p-0">
           {isLoading ? (
             <div className="flex flex-col justify-center items-center p-8 sm:p-12 space-y-3">
               <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 dark:text-blue-400" />
               <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Memuat laporan...</p>
             </div>
           ) : filteredReports.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center p-8 sm:p-12"
             >
               <div className="flex flex-col items-center space-y-4">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                   <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
                 </div>
                 {searchQuery || statusFilter !== "all" || typeFilter !== "all" ? (
                   <div className="space-y-3">
                     <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Tidak ada laporan yang cocok</h3>
                     <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Coba ubah kriteria pencarian atau filter</p>
                     <Button 
                       variant="outline" 
                       onClick={() => {
                         setSearchQuery('');
                         setStatusFilter('all');
                         setTypeFilter('all');
                       }}
                       className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-theme"
                       size="sm"
                     >
                       <X className="w-4 h-4 mr-2" />
                       Hapus Filter
                     </Button>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Belum ada laporan</h3>
                     <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Laporan baru akan muncul di sini secara otomatis</p>
                     <Button 
                       variant="outline"
                       onClick={handleRefresh}
                       className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-theme"
                       size="sm"
                     >
                       <RefreshCw className="h-4 w-4 mr-2" />
                       Periksa Ulang
                     </Button>
                   </div>
                 )}
               </div>
             </motion.div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                   <tr>
                     <th className="px-3 sm:px-4 py-3 text-left">
                       <button
                         className="flex items-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                         onClick={() => handleSort('date')}
                       >
                         Tanggal
                         {getSortIcon('date')}
                       </button>
                     </th>
                     <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Pelapor</th>
                     <th className="px-3 sm:px-4 py-3 text-left">
                       <button
                         className="flex items-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                         onClick={() => handleSort('location')}
                       >
                         Lokasi
                         {getSortIcon('location')}
                       </button>
                     </th>
                     <th className="px-3 sm:px-4 py-3 text-left">
                       <button
                         className="flex items-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                         onClick={() => handleSort('type')}
                       >
                         Jenis Masalah
                         {getSortIcon('type')}
                       </button>
                     </th>
                     <th className="px-3 sm:px-4 py-3 text-left">
                       <button
                         className="flex items-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                         onClick={() => handleSort('status')}
                       >
                         Status
                         {getSortIcon('status')}
                       </button>
                     </th>
                     <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Aksi</th>
                   </tr>
                 </thead>
                 <motion.tbody
                   variants={containerVariants}
                   initial="hidden"
                   animate="visible"
                   className="divide-y divide-gray-200 dark:divide-gray-700"
                 >
                   {filteredReports.map((report) => {
                     const status = getStatusBadge(report.status);
                     return (
                       <motion.tr 
                         key={report.id}
                         variants={itemVariants}
                         className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                       >
                         <td className="px-3 sm:px-4 py-3 sm:py-4">
                           <div className="space-y-1">
                             <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                               {formatDate(report.created_at)}
                             </div>
                             <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                               <Clock className="h-3 w-3 mr-1" />
                               {formatTime(report.created_at)}
                             </div>
                           </div>
                         </td>
                         <td className="px-3 sm:px-4 py-3 sm:py-4">
                           <div className="flex items-center space-x-2 sm:space-x-3">
                             <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                               <span className="text-white font-medium text-xs sm:text-sm">
                                 {report.user?.name ? report.user.name.charAt(0).toUpperCase() : "U"}
                               </span>
                             </div>
                             <div className="min-w-0">
                               <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{report.user?.name}</div>
                               <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{report.user?.nim || report.user?.email}</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-3 sm:px-4 py-3 sm:py-4">
                           <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                             <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 mr-1 sm:mr-2" />
                             <span className="truncate max-w-[120px] sm:max-w-[180px]">{report.location}</span>
                           </div>
                         </td>
                         <td className="px-3 sm:px-4 py-3 sm:py-4">
                           <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                             {formatProblemType(report.problem_type)}
                           </Badge>
                         </td>
                         <td className="px-3 sm:px-4 py-3 sm:py-4">
                           <Badge className={`flex items-center text-xs ${status.color}`}>
                             {status.icon}
                             <span className="ml-1">{status.text}</span>
                           </Badge>
                         </td>
                         <td className="px-3 sm:px-4 py-3 sm:py-4 text-right">
                           <div className="flex justify-end items-center space-x-1 sm:space-x-2">
                             <Button
                               variant="ghost"
                               size="sm"
                               className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm h-7 sm:h-8"
                               onClick={() => handleViewReport(report)}
                             >
                               <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                               <span className="hidden sm:inline">Kelola</span>
                             </Button>
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                                   <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                 <DropdownMenuItem onClick={() => handleViewReport(report)} className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                   <Edit className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                                   <span>Edit & Update</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem 
                                   onClick={() => handleQuickStatusUpdate(report.id, 'in_progress', 'Laporan sedang dalam proses penanganan')} 
                                   className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                   disabled={report.status === 'in_progress' || report.status === 'resolved'}
                                 >
                                   <Info className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                                   <span>Tandai Dalam Proses</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem 
                                   onClick={() => handleQuickStatusUpdate(report.id, 'resolved', 'Laporan telah diselesaikan')} 
                                   className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                   disabled={report.status === 'resolved'}
                                 >
                                   <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                                   <span>Tandai Selesai</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                 <DropdownMenuItem onClick={() => handleDeleteClick(report)} className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                   <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                                   <span>Hapus Laporan</span>
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </div>
                         </td>
                       </motion.tr>
                     );
                   })}
                 </motion.tbody>
               </table>
             </div>
           )}
         </CardContent>
       </Card>
     </motion.div>

     {/* Simplified Detail Modal with Dark Mode */}
     <AnimatePresence>
       {isDetailOpen && selectedReport && (
         <motion.div 
           className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={() => setIsDetailOpen(false)}
         >
           <motion.div 
             className="bg-white dark:bg-gray-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto shadow-lg border border-gray-200 dark:border-gray-700"
             variants={detailVariants}
             initial="hidden"
             animate="visible"
             exit="exit"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
               <div>
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Kelola Laporan #{selectedReport.id}</h2>
                 <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Detail lengkap dan update status laporan</p>
               </div>
               <Button variant="ghost" size="sm" onClick={() => setIsDetailOpen(false)} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                 <X className="h-5 w-5" />
               </Button>
             </div>
             
             <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-6">
                 <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detail Laporan</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-3">
                       <div>
                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status Saat Ini</p>
                         <Badge className={`${getStatusBadge(selectedReport.status).color} text-xs`}>
                           {getStatusBadge(selectedReport.status).icon}
                           <span className="ml-1">{getStatusBadge(selectedReport.status).text}</span>
                         </Badge>
                       </div>
                       
                       <div>
                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tanggal Dibuat</p>
                         <div className="flex items-center text-sm text-gray-900 dark:text-white">
                           <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                           {formatFullDateTime(selectedReport.created_at)}
                         </div>
                       </div>
                       
                       <div>
                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Jenis Masalah</p>
                         <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                           {formatProblemType(selectedReport.problem_type)}
                         </Badge>
                       </div>
                     </div>
                     
                     <div className="space-y-3">
                       <div>
                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Lokasi</p>
                         <div className="flex items-start text-sm text-gray-900 dark:text-white">
                           <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 mt-0.5" />
                           <span>{selectedReport.location}</span>
                         </div>
                       </div>
                       
                       <div>
                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pelapor</p>
                         <div className="flex items-center">
                           <div className="h-8 w-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center mr-3">
                             <span className="text-white font-medium text-sm">
                               {selectedReport.user?.name ? selectedReport.user.name.charAt(0).toUpperCase() : "U"}
                             </span>
                           </div>
                           <div>
                             <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReport.user?.name}</p>
                             <p className="text-xs text-gray-600 dark:text-gray-400">{selectedReport.user?.email}</p>
                             {selectedReport.user?.nim && (
                               <p className="text-xs text-gray-600 dark:text-gray-400">NIM: {selectedReport.user.nim}</p>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="mt-4">
                     <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Deskripsi Masalah</p>
                     <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 p-3">
                       <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{selectedReport.description}</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bukti Foto</h3>
                   <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
                     {selectedReport.photo_url ? (
                       <Image
                         src={selectedReport.photo_url}
                         alt={`Laporan #${selectedReport.id}`}
                         width={800}
                         height={300}
                         className="w-full object-contain max-h-[300px]"
                       />
                     ) : (
                       <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500">
                         <div className="text-center">
                           <FileText className="w-8 h-8 mx-auto mb-2" />
                           <p className="text-sm">Tidak ada gambar tersedia</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
               
               {/* Simplified Update Panel with Dark Mode */}
               <div className="lg:col-span-1">
                 <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Update Status</h3>
                   
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Status Baru
                       </label>
                       <Select
                         value={updateStatus}
                         onValueChange={setUpdateStatus}
                         options={updateStatusOptions}
                         placeholder="Pilih status"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Catatan Admin
                       </label>
                       <Textarea
                         value={adminNotes}
                         onChange={(e) => setAdminNotes(e.target.value)}
                         placeholder="Tambahkan catatan tentang tindakan yang diambil..."
                         rows={3}
                         className="resize-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                       />
                       <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                         Catatan akan terlihat oleh pelapor
                       </p>
                     </div>
                     
                     {selectedReport.admin_notes && (
                       <div>
                         <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catatan Sebelumnya</p>
                         <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-600">
                           <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{selectedReport.admin_notes}</p>
                         </div>
                       </div>
                     )}
                     
                     <Button
                       onClick={handleUpdateStatus}
                       disabled={isUpdating || updateStatus === selectedReport.status}
                       className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                     >
                       {isUpdating ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           Memperbarui...
                         </>
                       ) : (
                         <>
                           <Save className="h-4 w-4 mr-2" />
                           Update Status
                         </>
                       )}
                     </Button>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between">
               <Button 
                 variant="outline" 
                 onClick={() => setIsDetailOpen(false)}
                 className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
               >
                 Tutup
               </Button>
               <Button
                 variant="outline"
                 onClick={() => handleDeleteClick(selectedReport)}
                 className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
               >
                 <Trash2 className="h-4 w-4 mr-2" />
                 Hapus Laporan
               </Button>
             </div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>

     {/* Simplified Delete Dialog with Dark Mode */}
     <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
       <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
         <AlertDialogHeader>
           <AlertDialogTitle className="text-gray-900 dark:text-white">Konfirmasi Penghapusan</AlertDialogTitle>
           <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
             Tindakan ini akan menghapus laporan #{reportToDelete?.id} secara permanen. 
             Data yang telah dihapus tidak dapat dikembalikan.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel 
             disabled={isDeleting}
             className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
           >
             Batal
           </AlertDialogCancel>
           <AlertDialogAction 
             onClick={handleDeleteConfirm}
             disabled={isDeleting}
             className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
           >
             {isDeleting ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Menghapus...
               </>
             ) : (
               <>
                 <Trash2 className="mr-2 h-4 w-4" />
                 Hapus
               </>
             )}
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   </div>
 );
}