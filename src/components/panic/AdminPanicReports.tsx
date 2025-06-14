// src/components/panic/AdminPanicReports.tsx (Update)
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Search, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  MapPin,
  User,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid,
  List,
  Menu,
  Info,
  Phone,
  Mail,
  Navigation,
  Shield,
  Activity,
  TrendingUp,
  Map,
  SlidersHorizontal,
  FileText
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
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

// Interface berdasarkan response API yang sebenarnya
interface PanicUser {
  id: number;
  name: string;
  email: string;
  no_telp: string;
  nik?: string;
}

interface PanicHandler {
  id: number;
  name: string;
}

interface PanicReport {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  location_description?: string;
  status: string;
  handled_by?: number;
  handled_at?: string;
  created_at: string;
  updated_at: string;
  user: PanicUser;
  handler?: PanicHandler;
}

interface PaginationLinks {
  url?: string;
  label: string;
  active: boolean;
}

interface PanicReportsResponse {
  current_page: number;
  data: PanicReport[];
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

// Status options untuk filter
const statusOptions = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "handled", label: "Ditangani" },
  { value: "resolved", label: "Diselesaikan" },
];

export default function AdminPanicReports() {
  const [panicData, setPanicData] = useState<PanicReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    fetchPanicReports();
  }, [currentPage, statusFilter, dateFilter]);

  const fetchPanicReports = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (dateFilter) {
        params.append('date', dateFilter);
      }

      const response = await fetch(`/api/panic?${params.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Gagal mengambil laporan panic: ${response.status}`);
      }
      
      const data: PanicReportsResponse = await response.json();
      console.log("Panic reports data:", data);
      
      setPanicData(data);
      
    } catch (error) {
      console.error("Error mengambil laporan panic:", error);
      toast.error("Gagal memuat laporan panic");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: {text: string, color: string, icon: React.ReactNode} } = {
      'pending': {
        text: "Menunggu",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
        icon: <Clock className="h-3.5 w-3.5 mr-1" />
      },
      'handled': {
        text: "Ditangani",
        color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />
      },
      'resolved': {
        text: "Diselesaikan",
        color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
      }
    };
    
    return statusMap[status] || {
      text: status,
      color: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
      icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />
    };
  };

  // Filter reports berdasarkan search query (client-side filtering)
  const filteredReports = panicData?.data?.filter(report => 
    report.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(report.id).includes(searchQuery)
  ) || [];

  // Open location in maps
  const openInMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter changes
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleDateFilterChange = (date: string) => {
    setDateFilter(date);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Get today's date in YYYY-MM-DD format for Indonesia timezone
  const getTodayDate = () => {
    const today = new Date();
    // Convert to Indonesia timezone (UTC+7)
    const indonesiaTime = new Date(today.getTime() + (7 * 60 * 60 * 1000));
    return indonesiaTime.toISOString().split('T')[0];
  };

  // Handle filter to show today's reports
  const handleTodayFilter = () => {
    const todayDate = getTodayDate();
    setDateFilter(todayDate);
    setCurrentPage(1);
  };

  // Animation variants
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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  // Get priority level based on report age
  const getPriorityLevel = (createdAt: string) => {
    const now = new Date();
    const reportTime = new Date(createdAt);
    const hoursDiff = (now.getTime() - reportTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 1) return { level: 'urgent', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', text: 'Mendesak' };
    if (hoursDiff < 6) return { level: 'high', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800', text: 'Tinggi' };
    if (hoursDiff < 24) return { level: 'medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800', text: 'Sedang' };
    return { level: 'low', color: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800", text: 'Rendah' };
  };

  return (
    <div className="space-y-4 sm:space-y-6 transition-theme">
      {/* Simplified Header - Match ReportList Style with Dark Mode */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-theme"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Laporan Panic Button
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Kelola dan pantau laporan darurat dari mahasiswa
            </p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Total: {panicData?.total || 0} laporan</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Live Updates</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => fetchPanicReports()}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
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

      {/* Stats Cards - Match ReportList Style with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {[
          {
            label: "Total Laporan", 
            value: panicData?.total || 0, 
            icon: Shield, 
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-900/20"
          },
          { 
            label: "Menunggu", 
            value: panicData?.data?.filter(r => r.status === 'pending').length || 0, 
            icon: Clock, 
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20"
          },
          { 
            label: "Ditangani", 
            value: panicData?.data?.filter(r => r.status === 'handled').length || 0, 
            icon: AlertTriangle, 
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20"
          },
          { 
            label: "Selesai", 
            value: panicData?.data?.filter(r => r.status === 'resolved').length || 0, 
            icon: CheckCircle, 
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-900/20"
          }
        ].map((stat, index) => (
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

      {/* Simplified Filters - Match ReportList Style with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-theme">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <SlidersHorizontal className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Filter & Pencarian</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Temukan laporan panic dengan mudah
                  </CardDescription>
                </div>
              </div>
              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`p-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pencarian</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                  <Input
                    placeholder="Cari nama atau email..."
                    className="pl-10 border-gray-300 dark:border-gray-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={handleStatusFilterChange}
                  options={statusOptions}
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Filter</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTodayFilter}
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full transition-theme"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Hari Ini
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reset</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('');
                    setDateFilter('');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full transition-theme"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reports List - Match ReportList Style with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-theme">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Laporan Panic</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{filteredReports.length} laporan ditemukan</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live
                </Badge>
                {/* Mobile View Toggle */}
                <div className="flex sm:hidden items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center p-8 sm:p-12 space-y-3">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-red-600 dark:text-red-400" />
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Memuat laporan panic...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 sm:p-12"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
                  </div>
                  {searchQuery || statusFilter || dateFilter ? (
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Tidak ada laporan yang cocok</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Coba ubah kriteria pencarian atau filter</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('');
                          setDateFilter('');
                        }}
                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-theme"
                        size="sm"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Hapus Filter
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Belum ada laporan panic</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Laporan panic akan muncul di sini secara otomatis</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  // Simplified Grid View with Dark Mode
                  <div className="p-4 sm:p-6">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                      {filteredReports.map((report) => {
                        const status = getStatusBadge(report.status);
                        const priority = getPriorityLevel(report.created_at);
                        
                        return (
                          <motion.div
                            key={report.id}
                            variants={cardVariants}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                          >
                            <div className="p-4">
                              {/* Header with badges */}
                              <div className="flex items-center justify-between mb-3">
                                <Badge className={`${status.color} flex items-center px-2 py-1 text-xs font-medium border`}>
                                  {status.icon}
                                  <span className="ml-1">{status.text}</span>
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">#{report.id}</span>
                              </div>
                              
                              {/* User Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="flex-shrink-0 h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                                  <span className="text-red-600 dark:text-red-400 font-medium">
                                    {report.user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-white truncate">{report.user.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{report.user.email}</div>
                                </div>
                              </div>
                              
                              {/* Details */}
                              <div className="space-y-2 mb-3">
                                {report.user.no_telp && (
                                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                    <Phone className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                    <span className="truncate">{report.user.no_telp}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                  <Calendar className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                  <span className="truncate">{formatDateTime(report.created_at)}</span>
                                </div>
                                
                                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                  <Navigation className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                  <span className="truncate">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                                </div>
                              </div>
                              
                              {/* Location Description */}
                              {report.location_description && (
                                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                  <div className="text-xs text-blue-800 dark:text-blue-400 line-clamp-2">{report.location_description}</div>
                                </div>
                              )}
                              
                              {/* Action Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openInMaps(report.latitude, report.longitude)}
                                className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Map className="h-4 w-4 mr-2" />
                                Lihat Lokasi
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                ) : (
                  // Improved List View with better separation and Dark Mode
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredReports.map((report, index) => {
                        const status = getStatusBadge(report.status);
                        const priority = getPriorityLevel(report.created_at);
                        
                        return (
                          <motion.div
                            key={report.id}
                            variants={itemVariants}
                            className={`
                              p-4 sm:p-6 
                              hover:bg-gray-50 dark:hover:bg-gray-800/50 
                              transition-all duration-200
                              border-l-4 border-transparent hover:border-red-300 dark:hover:border-red-600
                              ${index === 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}
                              relative
                              group
                            `}
                          >
                            {/* Subtle background highlight on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                            
                            {/* Content */}
                            <div className="relative z-10">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex-1">
                                  {/* Header with badges and ID */}
                                  <div className="flex items-center gap-3 mb-4">
                                    <Badge className={`${status.color} flex items-center px-3 py-1.5 text-xs font-medium border shadow-sm`}>
                                      {status.icon}
                                      <span className="ml-1">{status.text}</span>
                                    </Badge>
                                    <Badge className={`${priority.color} flex items-center px-3 py-1.5 text-xs font-medium border shadow-sm`}>
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      {priority.text}
                                    </Badge>
                                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">#{report.id}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Main content grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* User Information */}
                                    <div className="space-y-3">
                                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full mr-3">
                                          <User className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-white">{report.user.name}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">Pelapor</div>
                                        </div>
                                      </div>
                                      
                                      <div className="ml-11 space-y-2">
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                          <Mail className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                          <span className="truncate">{report.user.email}</span>
                                        </div>
                                        {report.user.no_telp && (
                                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                            <Phone className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                            <span>{report.user.no_telp}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Time and Location Information */}
                                    <div className="space-y-3">
                                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-full mr-3">
                                          <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-white">{formatDateTime(report.created_at)}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">Waktu laporan</div>
                                        </div>
                                      </div>
                                      
                                      <div className="ml-11">
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                          <MapPin className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                          <button
                                            onClick={() => openInMaps(report.latitude, report.longitude)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline flex items-center group"
                                          >
                                            <span className="font-mono">{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
                                            <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Location Description */}
                                  {report.location_description && (
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <div className="flex items-start">
                                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                                        <div>
                                          <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Deskripsi Lokasi</div>
                                          <div className="text-sm text-blue-800 dark:text-blue-400">{report.location_description}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Handler Information */}
                                  {report.handler && (
                                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                      <div className="flex items-start">
                                        <Shield className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                                        <div>
                                          <div className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">Ditangani oleh</div>
                                          <div className="text-sm text-green-800 dark:text-green-400">
                                            <span className="font-medium">{report.handler.name}</span>
                                            {report.handled_at && (
                                              <span className="text-green-600 dark:text-green-400 ml-2">
                                                pada {formatDateTime(report.handled_at)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Action Button */}
                                <div className="flex justify-center lg:w-48 lg:flex-col lg:items-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openInMaps(report.latitude, report.longitude)}
                                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 shadow-sm hover:shadow"
                                  >
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Lihat di Maps
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Bottom border for extra separation */}
                            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination - Match ReportList Style with Dark Mode */}
      {panicData && panicData.last_page > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 transition-theme">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Menampilkan {panicData.from}-{panicData.to} dari {panicData.total} laporan
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(panicData.current_page - 1)}
                    disabled={!panicData.prev_page_url}
                    className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </Button>
                  
                  <div className="flex gap-1">
                    {panicData.links
                      .filter(link => link.label !== '&laquo; Previous' && link.label !== 'Next &raquo;')
                      .map((link, index) => (
                        <Button
                          key={index}
                          variant={link.active ? "default" : "outline"}
                          size="sm"
                          onClick={() => link.url && handlePageChange(parseInt(link.label))}
                          disabled={!link.url}
                          className={`w-10 h-10 p-0 ${
                            link.active 
                              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 border-red-600 dark:border-red-500' 
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {link.label}
                        </Button>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(panicData.current_page + 1)}
                    disabled={!panicData.next_page_url}
                    className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}