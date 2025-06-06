// src/app/student/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Filter, 
  Search, 
  Loader2, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  MapPin,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  X
} from "lucide-react";
import { getAccessToken, isAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Interface untuk user report
interface UserReport {
  id: number;
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

interface PaginationLinks {
  url?: string;
  label: string;
  active: boolean;
}

interface UserReportsResponse {
  current_page: number;
  data: UserReport[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLinks[];
  next_page_url?: string;
  path: string;
  per_page: number;
  prev_page_url?: string;
  to: number;
  total: number;
}

// Opsi status untuk filter
const statusOptions = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "in_progress", label: "Dalam Proses" },
  { value: "resolved", label: "Diselesaikan" },
  { value: "rejected", label: "Ditolak" },
];

// Opsi jenis masalah
const problemTypeOptions = [
  { value: "", label: "Semua Jenis" },
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

export default function ReportHistoryPage() {
  const router = useRouter();
  const [reportsData, setReportsData] = useState<UserReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Check authentication saat komponen mount
  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Anda harus masuk untuk melihat histori laporan");
      router.push("/auth/login");
      return;
    }
    
    fetchUserReports();
  }, [currentPage, statusFilter, typeFilter, router]);

  const fetchUserReports = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        router.push("/auth/login");
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (typeFilter) {
        params.append('problem_type', typeFilter);
      }

      console.log("Fetching reports with params:", params.toString());

      const response = await fetch(`/api/user/reports?${params.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Gagal mengambil histori laporan: ${response.status}`);
      }
      
      const data: UserReportsResponse = await response.json();
      console.log("User reports data:", data);
      
      setReportsData(data);
      
    } catch (error) {
      console.error("Error mengambil histori laporan:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat histori laporan");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch report detail
  const fetchReportDetail = async (reportId: number) => {
    setIsLoadingDetail(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const response = await fetch(`/api/user/reports/${reportId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengambil detail laporan");
      }
      
      const data = await response.json();
      console.log("Report detail data:", data);
      
      // Handle different response structures
      let reportData = null;
      if (data.success && data.report) {
        reportData = data.report;
      } else if (data.data) {
        reportData = data.data;
      } else if (data.id) {
        reportData = data;
      }
      
      if (reportData) {
        setSelectedReport(reportData);
      } else {
        throw new Error("Format respons tidak valid");
      }
      
    } catch (error) {
      console.error("Error mengambil detail laporan:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat detail laporan");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Format tanggal
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(date) + ' WIB';
  };

  // Format jenis masalah
  const formatProblemType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      "electrical": "Masalah Listrik",
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: {text: string, color: string, icon: React.ReactNode} } = {
      'pending': {
        text: "Menunggu",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: <Clock className="h-3.5 w-3.5 mr-1" />
      },
      'in_progress': {
        text: "Dalam Proses",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: <Info className="h-3.5 w-3.5 mr-1" />
      },
      'resolved': {
        text: "Diselesaikan",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
      },
      'rejected': {
        text: "Ditolak",
        color: "bg-red-100 text-red-800 border-red-300",
        icon: <XCircle className="h-3.5 w-3.5 mr-1" />
      }
    };
    
    return statusMap[status] || {
      text: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      color: "bg-gray-100 text-gray-800 border-gray-300",
      icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />
    };
  };

  // Filter reports berdasarkan search query (client-side filtering)
  const filteredReports = reportsData?.data?.filter(report => 
    report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(report.id).includes(searchQuery)
  ) || [];

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter changes
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  // View report details
  const handleViewReport = async (report: UserReport) => {
    setIsDetailOpen(true);
    await fetchReportDetail(report.id);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Histori Laporan Saya</h1>
        <p className="text-gray-500">Lihat status dan feedback dari laporan yang telah Anda kirimkan</p>
        {reportsData && (
          <p className="text-sm text-gray-600 mt-1">
            Total {reportsData.total} laporan
          </p>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Cari laporan..."
                  className="pl-10 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
                options={statusOptions}
                placeholder="Filter Status"
                className="border-gray-200"
              />
              
              {/* Type Filter */}
              <Select
                value={typeFilter}
                onValueChange={handleTypeFilterChange}
                options={problemTypeOptions}
                placeholder="Filter Jenis"
                className="border-gray-200"
              />
              
              {/* Refresh Button */}
              <Button
                onClick={() => fetchUserReports()}
                variant="outline"
                className="border-gray-200"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Segarkan
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reports List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg font-bold text-gray-800">Daftar Laporan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center p-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  {searchQuery || statusFilter || typeFilter ? "Tidak ada laporan yang cocok" : "Belum ada laporan"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter || typeFilter 
                    ? "Coba ubah kriteria pencarian atau filter" 
                    : "Anda belum pernah mengirim laporan"}
                </p>
                {!(searchQuery || statusFilter || typeFilter) && (
                  <Button 
                    onClick={() => router.push('/student/report')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Buat Laporan Pertama
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredReports.map((report) => {
                  const status = getStatusBadge(report.status);
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className={`${status.color} flex items-center px-2 py-1 text-xs font-normal border`}>
                              {status.icon}
                              <span>{status.text}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">#{report.id}</span>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(report.created_at)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Jenis Masalah:</span>
                                <Badge variant="outline" className="ml-2 capitalize">
                                  {formatProblemType(report.problem_type)}
                                </Badge>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{report.location}</span>
                              </div>
                            </div>
                            
                            <div>
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Deskripsi:</span>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {report.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {report.admin_notes && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start">
                                <MessageSquare className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-blue-800">Feedback dari Admin/Relawan:</p>
                                  <p className="text-sm text-blue-700 mt-1">{report.admin_notes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {reportsData && reportsData.last_page > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6"
        >
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Halaman {reportsData.current_page} dari {reportsData.last_page}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(reportsData.current_page - 1)}
                    disabled={!reportsData.prev_page_url}
                    className="border-gray-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {reportsData.links
                      .filter(link => link.label !== '&laquo; Previous' && link.label !== 'Next &raquo;')
                      .map((link, index) => (
                        <Button
                          key={index}
                          variant={link.active ? "default" : "outline"}
                          size="sm"
                          onClick={() => link.url && handlePageChange(parseInt(link.label))}
                          disabled={!link.url || isNaN(parseInt(link.label))}
                          className={`w-10 h-10 p-0 ${link.active ? 'bg-blue-600' : 'border-gray-200'}`}
                        >
                          {link.label}
                        </Button>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(reportsData.current_page + 1)}
                    disabled={!reportsData.next_page_url}
                    className="border-gray-200"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDetailOpen(false)}
          >
            <motion.div 
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-gray-800">
                  {isLoadingDetail ? "Memuat Detail..." : `Detail Laporan ${selectedReport ? `#${selectedReport.id}` : ""}`}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setIsDetailOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {isLoadingDetail ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
               </div>
             ) : selectedReport ? (
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <h3 className="text-lg font-semibold text-gray-700 mb-3">Informasi Laporan</h3>
                   
                   <div className="space-y-4">
                     <div>
                       <p className="text-sm font-medium text-gray-500">Status</p>
                       <Badge className={`mt-1 ${getStatusBadge(selectedReport.status).color} px-2.5 py-1 text-xs font-normal border flex items-center w-fit`}>
                         {getStatusBadge(selectedReport.status).icon}
                         <span>{getStatusBadge(selectedReport.status).text}</span>
                       </Badge>
                     </div>
                     
                     <div>
                       <p className="text-sm font-medium text-gray-500">Tanggal Laporan</p>
                       <p className="text-sm text-gray-900 mt-1">{formatDateTime(selectedReport.created_at)}</p>
                     </div>
                     
                     <div>
                       <p className="text-sm font-medium text-gray-500">Jenis Masalah</p>
                       <Badge variant="outline" className="mt-1 capitalize">
                         {formatProblemType(selectedReport.problem_type)}
                       </Badge>
                     </div>
                     
                     <div>
                       <p className="text-sm font-medium text-gray-500">Lokasi</p>
                       <div className="flex items-center mt-1 text-sm text-gray-900">
                         <MapPin className="h-4 w-4 text-gray-400 mr-1.5" />
                         <span>{selectedReport.location}</span>
                       </div>
                     </div>
                     
                     <div>
                       <p className="text-sm font-medium text-gray-500">Deskripsi</p>
                       <p className="text-sm text-gray-900 mt-1 whitespace-pre-line">{selectedReport.description}</p>
                     </div>
                     
                     {selectedReport.admin_notes && (
                       <div>
                         <p className="text-sm font-medium text-gray-500">Feedback dari Admin/Relawan</p>
                         <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                           <p className="text-sm text-blue-800 whitespace-pre-line">{selectedReport.admin_notes}</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                 
                 <div>
                   <h3 className="text-lg font-semibold text-gray-700 mb-3">Bukti Foto</h3>
                   <div className="bg-gray-100 rounded-lg overflow-hidden border">
                     {selectedReport.photo_url ? (
                       <img
                         src={selectedReport.photo_url}
                         alt={`Laporan #${selectedReport.id}`}
                         className="w-full object-contain max-h-[400px]"
                       />
                     ) : (
                       <div className="flex items-center justify-center h-64 bg-gray-100 text-gray-400">
                         <p>Tidak ada gambar tersedia</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             ) : (
               <div className="flex justify-center items-center p-12">
                 <div className="text-center">
                   <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <p className="text-gray-500">Gagal memuat detail laporan</p>
                 </div>
               </div>
             )}
             
             <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
               <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                 Tutup
               </Button>
             </div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>

     {/* Add CSS for line-clamp */}
     <style jsx>{`
       .line-clamp-2 {
         display: -webkit-box;
         -webkit-line-clamp: 2;
         -webkit-box-orient: vertical;
         overflow: hidden;
       }
     `}</style>
   </div>
 );
}