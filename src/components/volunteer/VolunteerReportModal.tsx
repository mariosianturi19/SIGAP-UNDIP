// src/components/volunteer/VolunteerReportModal.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  MapPin, 
  Calendar, 
  Save, 
  Loader2,
  CheckCircle,
  Clock,
  Info,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { getAccessToken } from "@/lib/auth";
import { toast } from "sonner";
import Image from "next/image";

interface ReportUser {
  id: number;
  name: string;
  email: string;
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

interface VolunteerReportModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const statusOptions = [
  { value: "pending", label: "Menunggu" },
  { value: "in_progress", label: "Dalam Proses" },
  { value: "resolved", label: "Diselesaikan" },
  { value: "rejected", label: "Ditolak" },
];

export default function VolunteerReportModal({
  report,
  isOpen,
  onClose,
  onUpdate
}: VolunteerReportModalProps) {
  const [newStatus, setNewStatus] = useState(report.status);
  const [volunteerNotes, setVolunteerNotes] = useState(report.admin_notes || "");
  const [isUpdating, setIsUpdating] = useState(false);

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
      text: status,
      color: "bg-gray-100 text-gray-800 border-gray-300",
      icon: <Info className="h-3.5 w-3.5 mr-1" />
    };
  };

  // Handle update
  const handleUpdate = async () => {
    if (newStatus === report.status && volunteerNotes === (report.admin_notes || "")) {
      toast.warning("Tidak ada perubahan untuk disimpan");
      return;
    }

    setIsUpdating(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Autentikasi diperlukan");
      }

      const updateData = {
        status: newStatus,
        admin_notes: volunteerNotes.trim()
      };

      console.log("Updating report with data:", updateData);

      const response = await fetch(`/api/volunteer/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal memperbarui laporan");
      }

      const result = await response.json();
      console.log("Update result:", result);

      toast.success("Laporan berhasil diperbarui", {
        description: `Status diubah menjadi ${getStatusBadge(newStatus).text}`
      });

      onUpdate();
      onClose();
      
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Gagal memperbarui laporan", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">Kelola Laporan #{report.id}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isUpdating}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detail Laporan */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Detail Laporan</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status Saat Ini</p>
                  <Badge className={`mt-1 ${getStatusBadge(report.status).color} px-2.5 py-1 text-xs font-normal border flex items-center w-fit`}>
                    {getStatusBadge(report.status).icon}
                    <span>{getStatusBadge(report.status).text}</span>
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal Laporan</p>
                  <div className="flex items-center mt-1 text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatDateTime(report.created_at)}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Jenis Masalah</p>
                  <Badge variant="outline" className="mt-1">
                    {formatProblemType(report.problem_type)}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Lokasi</p>
                  <div className="flex items-center mt-1 text-sm text-gray-900">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{report.location}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Deskripsi</p>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-line bg-gray-50 p-3 rounded border">
                    {report.description}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Pelapor</p>
                  <div className="flex items-center mt-2">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {report.user?.name ? report.user.name.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{report.user?.name}</p>
                      <p className="text-xs text-gray-500">{report.user?.email}</p>
                      {report.user?.nim && (
                        <p className="text-xs text-gray-500">NIM: {report.user.nim}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Foto Bukti */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Bukti Foto</h3>
              <div className="bg-gray-100 rounded-lg overflow-hidden border">
                {report.photo_url ? (
                  <Image
                    src={report.photo_url}
                    alt={`Laporan #${report.id}`}
                    width={800}
                    height={400}
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
          
          {/* Panel Update */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Update Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Baru
                </label>
                <Select
                  value={newStatus}
                  onValueChange={setNewStatus}
                  options={statusOptions}
                  placeholder="Pilih status"
                  disabled={isUpdating}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan Relawan
                </label>
                <Textarea
                  value={volunteerNotes}
                  onChange={(e) => setVolunteerNotes(e.target.value)}
                  placeholder="Tambahkan catatan tentang penanganan laporan..."
                  rows={6}
                  className="resize-none"
                  disabled={isUpdating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Catatan akan dilihat oleh pelapor dan admin
                </p>
              </div>
              
              {report.admin_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Catatan Sebelumnya</p>
                  <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700">
                    {report.admin_notes}
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleUpdate}
                disabled={isUpdating || (newStatus === report.status && volunteerNotes === (report.admin_notes || ""))}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Panduan Status</h4>
                <div className="space-y-2 text-xs text-blue-800">
                  <div><span className="font-medium">Menunggu:</span> Laporan belum ditangani</div>
                  <div><span className="font-medium">Dalam Proses:</span> Sedang dalam penanganan</div>
                  <div><span className="font-medium">Diselesaikan:</span> Masalah sudah diperbaiki</div>
                  <div><span className="font-medium">Ditolak:</span> Laporan tidak valid</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}