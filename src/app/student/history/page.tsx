"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import StudentWrapper from '@/components/shared/StudentWrapper';
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
  X,
  Activity
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
import { Label } from "@radix-ui/react-label";
import Image from "next/image";

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

  const fetchUserReports = useCallback(async () => {
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
  }, [currentPage, statusFilter, typeFilter, router]);

  // Check authentication saat komponen mount
  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Anda harus masuk untuk melihat histori laporan");
      router.push("/auth/login");
      return;
    }
    
    fetchUserReports();
  }, [fetchUserReports, router]);

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
    <StudentWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header without icon */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Histori Laporan Saya
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              Pantau status dan perkembangan laporan yang telah Anda kirimkan
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
          {[
            {
              label: "Total", 
              value: reportsData?.total || 0, 
              icon: FileText, 
              color: "text-blue-600",
              bg: "bg-blue-50"
            },
            { 
              label: "Menunggu", 
              value: filteredReports.filter(r => r.status === 'pending').length, 
              icon: Clock, 
              color: "text-yellow-600",
              bg: "bg-yellow-50"
            },
            { 
              label: "Proses", 
              value: filteredReports.filter(r => r.status === 'in_progress').length, 
              icon: AlertCircle, 
              color: "text-orange-600",
              bg: "bg-orange-50"
            },
            { 
              label: "Selesai", 
              value: filteredReports.filter(r => r.status === 'resolved').length, 
              icon: CheckCircle, 
              color: "text-green-600",
              bg: "bg-green-50"
            }
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6"
          >
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Filter className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Filter & Pencarian</CardTitle>
                    <CardDescription className="text-gray-600">
                      Temukan laporan dengan mudah
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Pencarian</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        placeholder="Cari ID, deskripsi, lokasi..."
                        className="pl-10 h-10 border-gray-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={handleStatusFilterChange}
                      options={statusOptions}
                      placeholder="Semua Status"
                      className="h-10"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Jenis</Label>
                    <Select
                      value={typeFilter}
                      onValueChange={handleTypeFilterChange}
                      options={problemTypeOptions}
                      placeholder="Semua Jenis"
                      className="h-10"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Update Data</Label>
                    <Button
                      onClick={() => fetchUserReports()}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reports List without icon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Daftar Laporan</CardTitle>
                    <CardDescription className="text-gray-600">
                      {filteredReports.length} laporan ditemukan
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <Activity className="w-4 h-4 mr-1" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center items-center p-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                      <p className="text-gray-600">Memuat histori laporan...</p>
                    </div>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center p-12">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {searchQuery || statusFilter || typeFilter ? "Tidak ada laporan yang cocok" : "Belum ada laporan"}
                        </h3>
                        <p className="text-gray-600">
                          {searchQuery || statusFilter || typeFilter 
                            ? "Coba ubah kriteria pencarian atau filter" 
                            : "Mulai berkontribusi untuk keamanan kampus!"}
                        </p>
                      </div>
                      {!(searchQuery || statusFilter || typeFilter) && (
                        <Button 
                          onClick={() => router.push('/student/report')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Buat Laporan Pertama
                        </Button>
                      )}
                    </motion.div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredReports.map((report) => {
                      const status = getStatusBadge(report.status);
                      return (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="p-6 hover:bg-gray-50 transition-all duration-300"
                        >
                          <div className="space-y-4">
                            {/* Normal Header */}
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className={`${status.color} flex items-center px-3 py-1 text-sm font-medium border shadow-sm`}>
                                {status.icon}
                                <span className="ml-1">{status.text}</span>
                              </Badge>
                              <Badge variant="outline" className="text-gray-600">
                                #{report.id}
                              </Badge>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDateTime(report.created_at)}
                              </div>
                            </div>
                            
                            {/* Normal Content */}
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-700">Jenis:</span>
                                  <Badge variant="outline">
                                    {formatProblemType(report.problem_type)}
                                  </Badge>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="text-sm font-semibold text-gray-700">Lokasi:</span>
                                    <p className="text-sm text-gray-600">{report.location}</p>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-gray-700">Deskripsi:</span>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                    {report.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Normal Admin Notes */}
                            {report.admin_notes && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-blue-800 mb-1">
                                      Feedback dari Tim
                                    </p>
                                    <p className="text-sm text-blue-700">{report.admin_notes}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Normal Action Button */}
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                onClick={() => handleViewReport(report)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Detail
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

          {/* Compact Pagination */}
          {reportsData && reportsData.last_page > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-6"
            >
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Menampilkan {reportsData.from}-{reportsData.to} dari {reportsData.total} laporan
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(reportsData.current_page - 1)}
                        disabled={!reportsData.prev_page_url}
                        className="border-gray-300 dark:border-gray-600"
                        size="sm"
                      >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        Prev
                      </Button>
                      
                      <div className="flex gap-1">
                        {reportsData.links
                          .filter(link => link.label !== '&laquo; Previous' && link.label !== 'Next &raquo;')
                          .map((link) => (
                            <Button
                              key={link.label}
                              variant={link.active ? "default" : "outline"}
                              onClick={() => link.url && handlePageChange(parseInt(link.label))}
                              disabled={!link.url || isNaN(parseInt(link.label))}
                              className={`w-8 h-8 ${
                                link.active 
                                  ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                              size="sm"
                            >
                              {link.label}
                            </Button>
                          ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(reportsData.current_page + 1)}
                        disabled={!reportsData.next_page_url}
                        className="border-gray-300 dark:border-gray-600"
                        size="sm"
                      >
                        Next
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Compact Detail Modal */}
          <AnimatePresence>
            {isDetailOpen && (
              <motion.div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDetailOpen(false)}
              >
                <motion.div 
                  className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl border border-gray-200 dark:border-gray-700"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center z-10">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                      {isLoadingDetail ? "Memuat Detail..." : `Detail Laporan ${selectedReport ? `#${selectedReport.id}` : ""}`}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setIsDetailOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isLoadingDetail ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                   </div>
                 ) : selectedReport ? (
                   <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Informasi Laporan</h3>
                       
                       <div className="space-y-3">
                         <div>
                           <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                           <Badge className={`mt-1 ${getStatusBadge(selectedReport.status).color} px-2 py-1 text-xs font-normal border flex items-center w-fit`}>
                             {getStatusBadge(selectedReport.status).icon}
                             <span>{getStatusBadge(selectedReport.status).text}</span>
                           </Badge>
                         </div>
                         
                         <div>
                           <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal Laporan</p>
                           <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDateTime(selectedReport.created_at)}</p>
                         </div>
                         
                         <div>
                           <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Jenis Masalah</p>
                           <Badge variant="outline" className="mt-1 capitalize">
                             {formatProblemType(selectedReport.problem_type)}
                           </Badge>
                         </div>
                         
                         <div>
                           <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Lokasi</p>
                           <div className="flex items-center mt-1 text-sm text-gray-900 dark:text-white">
                             <MapPin className="h-3 w-3 text-gray-400 mr-1.5" />
                             <span>{selectedReport.location}</span>
                           </div>
                         </div>
                         
                         <div>
                           <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Deskripsi</p>
                           <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-line">{selectedReport.description}</p>
                         </div>
                         
                         {selectedReport.admin_notes && (
                           <div>
                             <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Feedback dari Tim</p>
                             <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                               <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-line">{selectedReport.admin_notes}</p>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                     
                     <div>
                       <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Bukti Foto</h3>
                       <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border">
                         {selectedReport.photo_url ? (
                           <Image
                             src={selectedReport.photo_url}
                             alt={`Laporan #${selectedReport.id}`}
                             width={600}
                             height={400}
                             className="w-full object-contain max-h-[300px]"
                           />
                         ) : (
                           <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                             <p className="text-sm">Tidak ada gambar tersedia</p>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="flex justify-center items-center p-8">
                     <div className="text-center">
                       <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                       <p className="text-gray-500 dark:text-gray-400">Gagal memuat detail laporan</p>
                     </div>
                   </div>
                 )}
                 
                 <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-end">
                   <Button variant="outline" onClick={() => setIsDetailOpen(false)} size="sm">
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
     </div>
   </StudentWrapper>
 );
}