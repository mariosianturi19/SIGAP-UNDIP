// src/components/panic/VolunteerPanicReports.tsx
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
  HandHeart,
  CheckSquare
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
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface PanicUser {
  id: number;
  name: string;
  email: string;
  no_telp: string;
  nik?: string;
  nim?: string;
  jurusan?: string;
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
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  user: PanicUser;
  handler?: PanicHandler;
  resolved_by?: PanicHandler;
}

// Response interface berdasarkan dokumentasi API
interface TodayPanicResponse {
  user_type: string;
  today: string;
  total_reports: number;
  data: PanicReport[];
}

export default function VolunteerPanicReports() {
  const [panicData, setPanicData] = useState<TodayPanicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [handlingId, setHandlingId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchTodayPanicReports();
  }, []);

  const fetchTodayPanicReports = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const response = await fetch("/api/relawan/panic-reports/today", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Gagal mengambil laporan panic: ${response.status}`);
      }
      
      const data: TodayPanicResponse = await response.json();
      console.log("Today panic reports data:", data);
      
      setPanicData(data);
      
    } catch (error) {
      console.error("Error mengambil laporan panic:", error);
      toast.error("Gagal memuat laporan panic");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle panic report
  const handlePanicReport = async (reportId: number) => {
    setHandlingId(reportId);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const response = await fetch(`/api/relawan/panic/${reportId}/handle`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menangani laporan");
      }
      
      toast.success("Laporan berhasil ditangani");
      await fetchTodayPanicReports(); // Refresh data
      
    } catch (error) {
      console.error("Error handling panic report:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menangani laporan");
    } finally {
      setHandlingId(null);
    }
  };

  // Resolve panic report
  const resolvePanicReport = async (reportId: number) => {
    if (!resolutionNotes.trim()) {
      toast.error("Silakan tambahkan catatan penyelesaian");
      return;
    }

    setResolvingId(reportId);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const response = await fetch(`/api/relawan/panic/${reportId}/resolve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolution_notes: resolutionNotes
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menyelesaikan laporan");
      }
      
      toast.success("Laporan berhasil diselesaikan");
      setResolutionNotes('');
      await fetchTodayPanicReports(); // Refresh data
      
    } catch (error) {
      console.error("Error resolving panic report:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyelesaikan laporan");
    } finally {
      setResolvingId(null);
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

  // Filter reports
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

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Panic Hari Ini</h1>
          <p className="text-gray-500 mt-1">Tangani laporan darurat yang masuk hari ini</p>
          {panicData && (
            <p className="text-sm text-gray-600 mt-1">
              {panicData.today} - Total: {panicData.total_reports} laporan
            </p>
          )}
        </div>
        <Button
          onClick={fetchTodayPanicReports}
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

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Filter</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Cari laporan panic..."
                className="pl-10 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  {searchQuery ? "Tidak ada laporan yang cocok" : "Tidak ada laporan panic hari ini"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? "Coba ubah kata kunci pencarian" : "Belum ada laporan panic yang masuk hari ini"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredReports.map((report) => {
                  const status = getStatusBadge(report.status);
                  const canHandle = report.status === 'pending';
                  const canResolve = report.status === 'handled';
                  
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
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
                                  {report.user.nim && <span> • NIM: {report.user.nim}</span>}
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
                            
                            {report.resolved_by && (
                              <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                                <span className="text-green-700">Diselesaikan oleh: {report.resolved_by.name}</span>
                                {report.resolved_at && (
                                  <span className="text-green-600 ml-2">
                                    pada {formatDateTime(report.resolved_at)}
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
                            
                            {canHandle && (
                              <Button
                                size="sm"
                                onClick={() => handlePanicReport(report.id)}
                                disabled={handlingId === report.id}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {handlingId === report.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <HandHeart className="h-4 w-4 mr-1" />
                                )}
                                Tangani
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {canResolve && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="text-sm font-medium text-green-800 mb-2">Selesaikan Laporan</h4>
                            <Textarea
                              placeholder="Tambahkan catatan penyelesaian..."
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              className="mb-3"
                              rows={3}
                            />
                            <Button
                              size="sm"
                              onClick={() => resolvePanicReport(report.id)}
                              disabled={resolvingId === report.id || !resolutionNotes.trim()}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {resolvingId === report.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <CheckSquare className="h-4 w-4 mr-1" />
                              )}
                              Selesaikan
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}