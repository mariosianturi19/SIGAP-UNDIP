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
    
    // Update status colors untuk dark mode
    const statusMap = {
      'pending': "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      'handling': "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800", 
      'resolved': "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
    };
    
    return statusInfo ? {
      ...statusInfo,
      color: statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
    } : { 
      value: status,
      label: status, 
      color: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
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
    <div className="space-y-4 sm:space-y-6 transition-theme">
      {/* Header with Dark Mode */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-theme"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Laporan Panic Hari Ini</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Tangani laporan darurat yang masuk hari ini</p>
            {panicData && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {panicData.today} - Total: {panicData.total_reports} laporan
              </p>
            )}
          </div>
          <Button
            onClick={fetchTodayPanicReports}
            variant="outline"
            className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto transition-theme"
            disabled={isRefreshing}
            size="sm"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 transition-theme">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Filter className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Filter & Pencarian</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Cari dan filter laporan panic
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <Input
                  placeholder="Cari laporan panic..."
                  className="pl-10 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 dark:focus:border-red-400"
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
                className="border-gray-200 dark:border-gray-600"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reports List with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 transition-theme">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Daftar Laporan Panic</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">{filteredReports.length} laporan ditemukan</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8 sm:p-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-red-600 dark:text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Memuat laporan panic...</p>
                </div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center p-8 sm:p-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-white mb-1">
                  {searchQuery || statusFilter ? "Tidak ada laporan yang cocok" : "Tidak ada laporan panic hari ini"}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  {searchQuery || statusFilter ? "Coba ubah kriteria pencarian atau filter" : "Belum ada laporan panic yang masuk hari ini"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
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
                      className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
                            <span className="text-sm text-gray-500 dark:text-gray-400">#{report.id}</span>
                          </div>
                        </div>
                        
                        {/* User and Location Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <User className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <span className="font-medium truncate text-gray-900 dark:text-white">{report.user.name}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                              <div className="truncate">{report.user.email}</div>
                              {report.user.no_telp && <div>Tel: {report.user.no_telp}</div>}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{formatDateTime(report.created_at)}</span>
                           </div>
                           <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                             <MapPin className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                             <button
                               onClick={() => openInMaps(report.latitude, report.longitude)}
                               className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center text-xs sm:text-sm truncate"
                             >
                               <span className="truncate">{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
                               <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                             </button>
                           </div>
                         </div>
                       </div>
                       
                       {/* Location Description */}
                       {report.location_description && (
                         <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm border border-gray-200 dark:border-gray-700">
                           <span className="text-gray-700 dark:text-gray-300">Deskripsi: {report.location_description}</span>
                         </div>
                       )}
                       
                       {/* Handler Info */}
                       {report.handler && (
                         <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm border border-blue-200 dark:border-blue-800">
                           <span className="text-blue-700 dark:text-blue-400">Ditangani oleh: {report.handler.name}</span>
                           {report.handled_at && (
                             <span className="text-blue-600 dark:text-blue-400 block sm:inline sm:ml-2">
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
                           className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto"
                         >
                           <MapPin className="h-4 w-4 mr-1" />
                           Lihat Lokasi
                         </Button>
                         
                         {canHandle && (
                           <Button
                             size="sm"
                             onClick={() => handleQuickAction(report, 'handle')}
                             className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 w-full sm:w-auto"
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
                             className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 w-full sm:w-auto"
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
                             className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto"
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

     {/* Update Status Dialog with Dark Mode */}
     <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
       <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
         <DialogHeader>
           <DialogTitle className="text-lg text-gray-900 dark:text-white">Update Status Panic Report</DialogTitle>
           <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
             Update status panic report #{selectedReport?.id}
           </DialogDescription>
         </DialogHeader>
         
         <div className="space-y-4 py-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
               className="border-gray-300 dark:border-gray-600"
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
               Catatan (Opsional)
             </label>
             <Textarea
               value={updateNotes}
               onChange={(e) => setUpdateNotes(e.target.value)}
               placeholder="Tambahkan catatan tentang penanganan..."
               rows={3}
               disabled={isUpdating}
               className="resize-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
             />
           </div>
         </div>
         
         <DialogFooter className="flex flex-col sm:flex-row gap-2">
           <Button 
             variant="outline" 
             onClick={() => setIsUpdateDialogOpen(false)}
             disabled={isUpdating}
             className="w-full sm:w-auto border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
           >
             Batal
           </Button>
           <Button 
             onClick={handleSubmitUpdate}
             disabled={isUpdating || !newStatus}
             className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 w-full sm:w-auto"
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