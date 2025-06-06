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
  Play,
  Square,
  MessageSquare,
  Edit,
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
  UpdatePanicStatusResponse
} from "@/types/panic";
import { PANIC_STATUS_OPTIONS } from "@/types/panic";

export default function VolunteerPanicReports() {
  const [panicData, setPanicData] = useState<TodayPanicReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<PanicReport | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<'handling' | 'resolved' | ''>('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTodayPanicReports();
  }, [statusFilter]);

  const fetchTodayPanicReports = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

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
      toast.error("Anda Tidak memiliki akses untuk melihat laporan panic hari ini");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const updatePanicStatus = async (panicId: number, status: 'handling' | 'resolved', notes?: string) => {
    setIsUpdating(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
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
      
      await fetchTodayPanicReports();
      
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
    setNewStatus(report.status as 'handling' | 'resolved');
    setIsUpdateDialogOpen(true);
  };

  const handleQuickAction = async (report: PanicReport, action: 'handle' | 'resolve') => {
    const status = action === 'handle' ? 'handling' : 'resolved';
    const defaultNotes = action === 'handle' 
      ? 'Panic report sedang ditangani oleh relawan'
      : 'Panic report telah diselesaikan';
    
    await updatePanicStatus(report.id, status, defaultNotes);
  };

  const handleSubmitUpdate = () => {
    if (!selectedReport || !newStatus) {
      toast.error("Pilih status yang valid");
      return;
    }
    
    updatePanicStatus(selectedReport.id, newStatus, updateNotes);
  };

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

  const getStatusBadge = (status: string) => {
    const statusInfo = PANIC_STATUS_OPTIONS.find(s => s.value === status);
    return statusInfo || { 
      value: status,
      label: status, 
      color: "bg-gray-100 text-gray-800" 
    };
  };

  const filteredReports = panicData?.data?.filter(report => 
    report.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(report.id).includes(searchQuery)
  ) || [];

  const openInMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const getAvailableStatusOptions = (currentStatus: string) => {
    if (currentStatus === 'pending') {
      return [
        { value: 'handling', label: 'Sedang Ditangani' }
      ];
    } else if (currentStatus === 'handling') {
      return [
        { value: 'resolved', label: 'Diselesaikan' }
      ];
    } else {
      return [];
    }
  };

  const statusFilterOptions = [
    { value: '', label: 'Semua Status' },
    ...PANIC_STATUS_OPTIONS.map(status => ({
      value: status.value,
      label: status.label
    }))
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Laporan Panic Hari Ini</h1>
          <p className="text-sm sm:text-base text-gray-500">Tangani laporan darurat yang masuk hari ini</p>
          {panicData && (
            <p className="text-xs sm:text-sm text-gray-600">
              {panicData.today} - Total: {panicData.total_reports} laporan
            </p>
          )}
        </div>
        <Button
          onClick={fetchTodayPanicReports}
          variant="outline"
          className="border-gray-200 w-full sm:w-auto"
          disabled={isRefreshing}
          size="sm"
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">Filter & Pencarian</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`p-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">Daftar Laporan Panic</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8 sm:p-12">
                <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-gray-400" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center p-8 sm:p-12">
                <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-1">
                  {searchQuery || statusFilter ? "Tidak ada laporan yang cocok" : "Tidak ada laporan panic hari ini"}
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
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
                      className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-4">
                        {/* Status and ID */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Badge className={`${status.color} flex items-center px-2 py-1 text-xs font-normal border`}>
                              {status.value === 'pending' && <Clock className="h-3.5 w-3.5 mr-1" />}
                              {status.value === 'handling' && <Play className="h-3.5 w-3.5 mr-1" />}
                              {status.value === 'resolved' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                              <span>{status.label}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">#{report.id}</span>
                          </div>
                        </div>
                        
                        {/* User and Location Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="font-medium truncate">{report.user.name}</span>
                            </div>
                            <div className="text-xs text-gray-500 ml-6">
                              <div className="truncate">{report.user.email}</div>
                              {report.user.no_telp && <div>Tel: {report.user.no_telp}</div>}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{formatDateTime(report.created_at)}</span>
                           </div>
                           <div className="flex items-center text-sm text-gray-600">
                             <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                             <button
                               onClick={() => openInMaps(report.latitude, report.longitude)}
                               className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-xs sm:text-sm truncate"
                             >
                               <span className="truncate">{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
                               <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                             </button>
                           </div>
                         </div>
                       </div>
                       
                       {/* Location Description */}
                       {report.location_description && (
                         <div className="p-2 sm:p-3 bg-gray-50 rounded text-sm">
                           <span className="text-gray-700">Deskripsi: {report.location_description}</span>
                         </div>
                       )}
                       
                       {/* Handler Info */}
                       {report.handler && (
                         <div className="p-2 sm:p-3 bg-blue-50 rounded text-sm">
                           <span className="text-blue-700">Ditangani oleh: {report.handler.name}</span>
                           {report.handled_at && (
                             <span className="text-blue-600 block sm:inline sm:ml-2">
                               pada {formatDateTime(report.handled_at)}
                             </span>
                           )}
                         </div>
                       )}
                       
                       {/* Action Buttons */}
                       <div className="flex flex-col sm:flex-row gap-2 pt-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => openInMaps(report.latitude, report.longitude)}
                           className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                         >
                           <MapPin className="h-4 w-4 mr-1" />
                           Lihat Lokasi
                         </Button>
                         
                         {canHandle && (
                           <Button
                             size="sm"
                             onClick={() => handleQuickAction(report, 'handle')}
                             className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                             disabled={isUpdating}
                           >
                             <Play className="h-4 w-4 mr-1" />
                             Tangani
                           </Button>
                         )}
                         
                         {canResolve && (
                           <Button
                             size="sm"
                             onClick={() => handleQuickAction(report, 'resolve')}
                             className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                             disabled={isUpdating}
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
                             className="border-gray-200 w-full sm:w-auto"
                             disabled={isUpdating}
                           >
                             <Edit className="h-4 w-4 mr-1" />
                             Update
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
       <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="text-lg">Update Status Panic Report</DialogTitle>
           <DialogDescription className="text-sm">
             Update status panic report #{selectedReport?.id}
           </DialogDescription>
         </DialogHeader>
         
         <div className="space-y-4 py-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Status Baru
             </label>
             <Select
               value={newStatus}
               onValueChange={(value) => setNewStatus(value as 'handling' | 'resolved')}
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
               className="resize-none"
             />
           </div>
         </div>
         
         <DialogFooter className="flex flex-col sm:flex-row gap-2">
           <Button 
             variant="outline" 
             onClick={() => setIsUpdateDialogOpen(false)}
             disabled={isUpdating}
             className="w-full sm:w-auto"
           >
             Batal
           </Button>
           <Button 
             onClick={handleSubmitUpdate}
             disabled={isUpdating || !newStatus}
             className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
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