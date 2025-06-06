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
  Filter
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
import { motion } from "framer-motion";

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
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: <Clock className="h-3.5 w-3.5 mr-1" />
      },
      'handled': {
        text: "Ditangani",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />
      },
      'resolved': {
        text: "Diselesaikan",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
      }
    };
    
    return statusMap[status] || {
      text: status,
      color: "bg-gray-100 text-gray-800 border-gray-300",
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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Panic Button</h1>
          <p className="text-gray-500 mt-1">Kelola dan pantau laporan darurat dari mahasiswa</p>
          {panicData && (
            <p className="text-sm text-gray-600 mt-1">
              Menampilkan {panicData.from}-{panicData.to} dari {panicData.total} laporan
            </p>
          )}
        </div>
        <Button
          onClick={() => fetchPanicReports()}
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
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
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
                  placeholder="Cari nama atau email..."
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
              
              {/* Date Filter */}
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="border-gray-200"
              />
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateFilterChange(getTodayDate())}
                  className="border-gray-200"
                >
                  Hari Ini
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('');
                    setDateFilter('');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="border-gray-200"
                >
                  Reset
                </Button>
              </div>
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
            <CardTitle className="text-xl font-bold text-gray-800">Daftar Laporan Panic</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center p-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  {searchQuery ? "Tidak ada laporan yang cocok" : "Tidak ada laporan panic"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? "Coba ubah kata kunci pencarian" : "Belum ada laporan panic yang masuk"}
                </p>
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${status.color} flex items-center px-2 py-1 text-xs font-normal border`}>
                              {status.icon}
                              <span>{status.text}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">#{report.id}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">{report.user.name}</span>
                              </div>
                              <div className="text-xs text-gray-500 ml-6">
                                {report.user.email}
                                {report.user.no_telp && <span> • Tel: {report.user.no_telp}</span>}
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{formatDateTime(report.created_at)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <button
                                  onClick={() => openInMaps(report.latitude, report.longitude)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                >
                                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {report.location_description && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                              <span className="text-gray-700">Deskripsi: {report.location_description}</span>
                            </div>
                          )}
                          
                          {report.handler && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                              <span className="text-blue-700">Ditangani oleh: {report.handler.name}</span>
                              {report.handled_at && (
                                <span className="text-blue-600 ml-2">
                                  pada {formatDateTime(report.handled_at)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInMaps(report.latitude, report.longitude)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Lihat Lokasi
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
      {panicData && panicData.last_page > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Halaman {panicData.current_page} dari {panicData.last_page}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(panicData.current_page - 1)}
                    disabled={!panicData.prev_page_url}
                    className="border-gray-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </Button>
                  
                  {/* Page Numbers */}
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
                          className={`w-10 h-10 p-0 ${link.active ? 'bg-blue-600' : 'border-gray-200'}`}
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
    </div>
  );
}