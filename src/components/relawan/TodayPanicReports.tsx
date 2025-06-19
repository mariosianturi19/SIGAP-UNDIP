// src/components/relawan/TodayPanicReports.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
  Play,
  Square,
  MessageSquare
} from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { 
  TodayPanicReportsResponse, 
  PanicReport, 
  UpdatePanicStatusRequest,
  UpdatePanicStatusResponse,
  PanicStatus
} from "@/types/panic";
import { PANIC_STATUS_OPTIONS } from "@/types/panic";

export default function TodayPanicReports() {
  const [panicData, setPanicData] = useState<TodayPanicReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<PanicReport | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<PanicStatus | ''>('');
  const [updateNotes, setUpdateNotes] = useState('');

  const fetchTodayPanicReports = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/relawan/panic-reports/today?${params.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Gagal mengambil laporan panic hari ini: ${response.status}`);
      }
      
      const data: TodayPanicReportsResponse = await response.json();
      console.log("Today panic reports data:", data);
      
      setPanicData(data);
      
    } catch (error) {
      console.error("Error mengambil laporan panic hari ini:", error);
      toast.error("Gagal memuat laporan panic hari ini");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTodayPanicReports();
  }, [fetchTodayPanicReports]);

  const updatePanicStatus = async (panicId: number, status: PanicStatus, notes?: string) => {
    setIsUpdating(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      // Only allow 'handling' or 'resolved' for UpdatePanicStatusRequest
      if (status !== 'handling' && status !== 'resolved') {
        toast.error("Status tidak valid untuk pembaruan");
        setIsUpdating(false);
        return;
      }

      const requestData: UpdatePanicStatusRequest = {
        status,
        ...(notes && { notes })
      };

      const response = await fetch(`/api/panic/${panicId}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal memperbarui status panic");
      }
      
      const result: UpdatePanicStatusResponse = await response.json();
      console.log("Update panic status result:", result);
      
      toast.success(result.message, {
        description: result.action
      });
      
      // Refresh data
      await fetchTodayPanicReports();
      
      // Close dialog
      setIsUpdateDialogOpen(false);
      setSelectedReport(null);
      setNewStatus('');
      setUpdateNotes('');
      
    } catch (error) {
      console.error("Error memperbarui status panic:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui status panic");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = (report: PanicReport) => {
    setSelectedReport(report);
    setNewStatus(report.status as PanicStatus);
    setIsUpdateDialogOpen(true);
  };

  const handleQuickAction = async (report: PanicReport, action: 'handle' | 'resolve') => {
    const status = action === 'handle' ? 'handling' : 'resolved';
    const defaultNotes = action === 'handle' 
      ? 'Panic report sedang ditangani oleh relawan'
      : 'Panic report telah diselesaikan';
    
    await updatePanicStatus(report.id, status as PanicStatus, defaultNotes);
  };

  const handleSubmitUpdate = () => {
    if (!selectedReport || !newStatus) {
      toast.error("Pilih status yang valid");
      return;
    }
    
    updatePanicStatus(selectedReport.id, newStatus, updateNotes);
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
    const statusInfo = PANIC_STATUS_OPTIONS.find(s => s.value === status);
    return statusInfo || { 
      value: status, 
      label: status, 
      color: "bg-gray-100 text-gray-800" 
    };
  };

  // Filter reports berdasarkan search query
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

  // Get available status options based on current status
  const getAvailableStatusOptions = (currentStatus: string) => {
    return PANIC_STATUS_OPTIONS.filter(option => {
      if (currentStatus === 'pending') {
        return ['handling', 'cancelled'].includes(option.value);
      } else if (currentStatus === 'handling') {
        return ['resolved', 'cancelled'].includes(option.value);
      } else {
        return false; // Can't change resolved/cancelled status
      }
    });
  };

  const statusFilterOptions = [
    { value: '', label: 'Semua Status' },
    ...PANIC_STATUS_OPTIONS.map(status => ({
      value: status.value,
      label: status.label
    }))
  ];

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
          Refresh
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
            <CardTitle className="text-xl font-bold text-gray-800">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Cari laporan panic..."
                  className="pl-10 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={statusFilterOptions}
                placeholder="Filter Status"
                className="border-gray-200"
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
                  {searchQuery || statusFilter ? "Tidak ada laporan yang cocok" : "Tidak ada laporan panic hari ini"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter ? "Coba ubah kriteria pencarian atau filter" : "Belum ada laporan panic yang masuk hari ini"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredReports.map((report) => {
                  const status = getStatusBadge(report.status);
                  const canHandle = report.status === 'pending';
                  const canResolve = report.status === 'handling';
                  const canUpdate = ['pending', 'handling'].includes(report.status);
                  
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className={`${status.color} flex items-center px-2 py-1 text-xs font-normal border`}>
                              {status.value === 'pending' && <Clock className="h-3.5 w-3.5 mr-1" />}
                              {status.value === 'handling' && <Play className="h-3.5 w-3.5 mr-1" />}
                              {status.value === 'resolved' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                              {status.value === 'cancelled' && <Square className="h-3.5 w-3.5 mr-1" />}
                              <span>{status.label}</span>
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
                          
                          {canHandle && (
                            <Button
                              size="sm"
                              onClick={() => handleQuickAction(report, 'handle')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Tangani
                            </Button>
                          )}
                          
                          {canResolve && (
                            <Button
                              size="sm"
                              onClick={() => handleQuickAction(report, 'resolve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Selesaikan
                            </Button>
                          )}
                          
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(report)}
                              className="border-gray-200"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Update Status
                            </Button>
                          )}
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

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status Panic Report</DialogTitle>
            <DialogDescription>
              Update status panic report #{selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Baru
              </label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as PanicStatus)}
                options={getAvailableStatusOptions(selectedReport?.status || '').map(option => ({
                  value: option.value,
                  label: option.label
                }))}
                placeholder="Pilih status baru..."
                disabled={isUpdating}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <Textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Tambahkan catatan tentang penanganan..."
                rows={3}
                disabled={isUpdating}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUpdateDialogOpen(false)}
              disabled={isUpdating}
            >
              Batal
            </Button>
            <Button 
              onClick={handleSubmitUpdate}
              disabled={isUpdating || !newStatus}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memperbarui...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}