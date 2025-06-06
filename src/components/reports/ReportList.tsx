// src/components/reports/ReportList.tsx
"use client";

import { useState, useEffect, MouseEvent } from "react";
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
  User,
  MapPin,
  Info,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Calendar,
  SlidersHorizontal
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
  Select,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
      
      // Mendapatkan data respons sebagai teks dulu
      const responseText = await response.text();
      
      // Coba mengonversi teks respons menjadi JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Gagal mengurai respons JSON:", e);
        throw new Error(`Gagal mengurai respons: ${responseText}`);
      }
      
      // Periksa status respons
      if (!response.ok) {
        // Ekstrak pesan kesalahan dari respons jika ada
        const errorMessage = data.message || `Gagal mengambil laporan: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      console.log("Data laporan:", data);
      
      // Cek struktur respons
      // Jika respons adalah array, gunakan langsung
      if (Array.isArray(data)) {
        setReports(data);
      } 
      // Jika respons memiliki bidang data yang merupakan array
      else if (data.data && Array.isArray(data.data)) {
        setReports(data.data);
      }
      // Jika respons memiliki bidang report/reports
      else if (data.reports && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
      // Jika respons memiliki bidang report tunggal
      else if (data.report) {
        setReports([data.report]);
      }
      // Jika tidak ada struktur yang dikenal, set array kosong
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

  // Format tanggal untuk tampilan yang lebih baik
  const formatDate = (dateString: string) => {
    // Create date with the original timezone
    const date = new Date(dateString);
    
    // Format date to Indonesian format
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Format jam dalam WIB
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    
    // Format time in 24-hour format with WIB timezone
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
      // Pencarian teks
      const matchesSearch = 
        report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(report.id).includes(searchQuery);
      
      // Filter status
      const matchesStatus = statusFilter === "all" || report.status === statusFilter;
      
      // Filter jenis
      const matchesType = typeFilter === "all" || report.problem_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort(sortReports);

  // Lihat detail laporan
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
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

  function handleRefresh(event: MouseEvent<HTMLButtonElement>): void {
    setIsRefreshing(true);
    fetchReports();
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
          <p className="text-gray-500 mt-1">Lihat dan kelola laporan yang dikirim oleh Mahasiswa</p>
        </div>
        <Button
          onClick={handleRefresh}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Filter</CardTitle>
            <CardDescription>
              Filter dan cari laporan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Cari laporan..."
                  className="pl-10 border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={statusOptions}
                className="border-gray-200"
              />
              
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
                options={problemTypeOptions}
                className="border-gray-200"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Daftar Laporan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
              </div>
            ) : filteredReports.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-12"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all" ? (
                    <>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">Tidak ada laporan yang cocok</h3>
                      <p className="text-gray-500 mb-4">Coba ubah kriteria pencarian atau filter Anda</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setTypeFilter('all');
                        }}
                        className="border-gray-200"
                      >
                        Hapus filter
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">Tidak ada laporan ditemukan</h3>
                      <p className="text-gray-500 mb-4">Saat ini tidak ada laporan dalam sistem</p>
                      <Button 
                        variant="outline"
                        onClick={handleRefresh}
                        className="border-gray-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Segarkan
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-700 text-sm">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button
                          className="flex items-center font-medium"
                          onClick={() => handleSort('date')}
                        >
                          Tanggal
                          {getSortIcon('date')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <span className="font-medium">Pelapor</span>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          className="flex items-center font-medium"
                          onClick={() => handleSort('location')}
                        >
                          Lokasi
                          {getSortIcon('location')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          className="flex items-center font-medium"
                          onClick={() => handleSort('type')}
                        >
                          Jenis Masalah
                          {getSortIcon('type')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          className="flex items-center font-medium"
                          onClick={() => handleSort('status')}
                        >
                          Status
                          {getSortIcon('status')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-gray-100"
                  >
                    {filteredReports.map((report) => {
                      const status = getStatusBadge(report.status);
                      return (
                        <motion.tr 
                          key={report.id}
                          variants={itemVariants}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(report.created_at)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(report.created_at)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {report.user?.name ? report.user.name.charAt(0).toUpperCase() : "U"}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{report.user?.name}</div>
                                <div className="text-xs text-gray-500">{report.user?.nim || report.user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{report.location}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant="outline" className="capitalize font-normal">
                              {formatProblemType(report.problem_type)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge className={`flex items-center px-2 py-1 ${status.color} font-normal border`}>
                              {status.icon}
                              <span>{status.text}</span>
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8"
                                onClick={() => handleViewReport(report)}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Lihat
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleViewReport(report)} className="cursor-pointer">
                                    <ExternalLink className="h-4 w-4 mr-2 text-blue-600" />
                                    <span>Lihat detail</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="cursor-pointer">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    <span>Tandai sebagai diselesaikan</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Info className="h-4 w-4 mr-2 text-blue-600" />
                                    <span>Tandai dalam proses</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer text-red-600">
                                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                    <span>Tolak laporan</span>
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

      {/* Modal Detail Laporan */}
      <AnimatePresence>
        {isDetailOpen && selectedReport && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDetailOpen(false)}
          >
            <motion.div 
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
              variants={detailVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-gray-800">Laporan #{selectedReport.id}</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsDetailOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Detail Laporan</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge className={`mt-1 ${getStatusBadge(selectedReport.status).color} px-2.5 py-1 text-xs font-normal border flex items-center w-fit`}>
                        {getStatusBadge(selectedReport.status).icon}
                        <span>{getStatusBadge(selectedReport.status).text}</span>
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dikirim pada</p>
                      <p className="text-sm text-gray-900 mt-1">{formatFullDateTime(selectedReport.created_at)}</p>
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
                        <p className="text-sm font-medium text-gray-500">Catatan Admin</p>
                       <p className="text-sm text-gray-900 mt-1 whitespace-pre-line bg-gray-50 p-2 rounded border border-gray-200">{selectedReport.admin_notes}</p>
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
                 
                 <div className="mt-6">
                   <h3 className="text-lg font-semibold text-gray-700 mb-3">Pelapor</h3>
                   <div className="flex items-center">
                     <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                       <span className="text-blue-600 font-medium">
                         {selectedReport.user?.name ? selectedReport.user.name.charAt(0).toUpperCase() : "U"}
                       </span>
                     </div>
                     <div className="ml-3">
                       <p className="text-sm font-medium text-gray-900">{selectedReport.user?.name}</p>
                       <p className="text-xs text-gray-500">{selectedReport.user?.email}</p>
                       {selectedReport.user?.nim && (
                         <p className="text-xs text-gray-500">NIM: {selectedReport.user.nim}</p>
                       )}
                       {selectedReport.user?.jurusan && (
                         <p className="text-xs text-gray-500">Jurusan: {selectedReport.user.jurusan}</p>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end space-x-2">
               <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                 Tutup
               </Button>
               <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                 <Info className="h-4 w-4 mr-2" />
                 Tandai Dalam Proses
               </Button>
               <Button className="bg-green-600 hover:bg-green-700">
                 <CheckCircle className="h-4 w-4 mr-2" />
                 Tandai Selesai
               </Button>
             </div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 );
}