// src/components/admin/BulkDeleteDialog.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Trash2,
  Loader2,
  AlertTriangle,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";

export type DeleteType = 'panic' | 'report';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filters: BulkDeleteFilters) => Promise<void>;
  type: DeleteType;
}

export interface BulkDeleteFilters {
  start_date: string;
  end_date: string;
  status?: string;
  problem_type?: string;
}

const panicStatusOptions = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "responded", label: "Ditanggapi" },
  { value: "resolved", label: "Diselesaikan" },
  { value: "cancelled", label: "Dibatalkan" },
];

const reportStatusOptions = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "in_progress", label: "Dalam Proses" },
  { value: "resolved", label: "Diselesaikan" },
  { value: "rejected", label: "Ditolak" },
];

const problemTypeOptions = [
  { value: "", label: "Semua Jenis" },
  { value: "electrical", label: "Masalah Listrik" },
  { value: "infrastructure", label: "Infrastruktur" },
  { value: "water_supply", label: "Pasokan Air" },
  { value: "waste_management", label: "Pengelolaan Sampah" },
  { value: "public_safety", label: "Keselamatan Umum" },
  { value: "public_health", label: "Kesehatan Umum" },
  { value: "environmental", label: "Lingkungan" },
  { value: "other", label: "Lainnya" },
];

export default function BulkDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  type
}: BulkDeleteDialogProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [problemType, setProblemType] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateDates = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!startDate) {
      newErrors.start_date = "Tanggal mulai wajib diisi";
    }

    if (!endDate) {
      newErrors.end_date = "Tanggal akhir wajib diisi";
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.end_date = "Tanggal akhir harus >= tanggal mulai";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (validateDates()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      const filters: BulkDeleteFilters = {
        start_date: startDate,
        end_date: endDate,
      };

      if (status) filters.status = status;
      if (type === 'report' && problemType) filters.problem_type = problemType;

      await onConfirm(filters);

      // Reset form
      setStartDate("");
      setEndDate("");
      setStatus("");
      setProblemType("");
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error during bulk delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setStartDate("");
      setEndDate("");
      setStatus("");
      setProblemType("");
      setErrors({});
      setShowConfirmation(false);
      onClose();
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get date 30 days ago
  const getLastMonthDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  // Quick date filters
  const setLastMonth = () => {
    setStartDate(getLastMonthDate());
    setEndDate(getTodayDate());
  };

  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(getTodayDate());
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] shadow-lg border border-gray-200 dark:border-gray-700 my-8 flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 px-6 py-4 flex justify-between items-center rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Hapus {type === 'panic' ? 'Laporan Panic' : 'Laporan'} Massal
                    </h2>
                    <p className="text-red-100 text-sm mt-0.5">
                      Pilih rentang tanggal dan filter
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="hover:bg-white/20 text-white"
                  disabled={isDeleting}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Warning Banner */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 dark:text-red-300">Peringatan!</h4>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                        Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                        Pastikan Anda telah memilih filter dengan benar sebelum melanjutkan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rentang Tanggal <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tanggal Mulai</label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setErrors({ ...errors, start_date: "" });
                          }}
                          max={getTodayDate()}
                          className={`${errors.start_date ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                        />
                        {errors.start_date && (
                          <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tanggal Akhir</label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setErrors({ ...errors, end_date: "" });
                          }}
                          max={getTodayDate()}
                          className={`${errors.end_date ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                        />
                        {errors.end_date && (
                          <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>
                        )}
                      </div>
                    </div>

                    {/* Quick Date Filters */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={setThisMonth}
                        className="text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Bulan Ini
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={setLastMonth}
                        className="text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        30 Hari Terakhir
                      </Button>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter Status (Opsional)
                    </label>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                      options={type === 'panic' ? panicStatusOptions : reportStatusOptions}
                      className="border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Kosongkan untuk menghapus semua status
                    </p>
                  </div>

                  {/* Problem Type Filter (Only for Reports) */}
                  {type === 'report' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filter Jenis Masalah (Opsional)
                      </label>
                      <Select
                        value={problemType}
                        onValueChange={setProblemType}
                        options={problemTypeOptions}
                        className="border-gray-300 dark:border-gray-600"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Kosongkan untuk menghapus semua jenis masalah
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview Summary */}
                {startDate && endDate && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      Rangkuman Filter
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• Rentang Tanggal: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</li>
                      {status && <li>• Status: {(type === 'panic' ? panicStatusOptions : reportStatusOptions).find(o => o.value === status)?.label}</li>}
                      {type === 'report' && problemType && <li>• Jenis Masalah: {problemTypeOptions.find(o => o.value === problemType)?.label}</li>}
                      {!status && !problemType && <li>• Tidak ada filter tambahan</li>}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-3 rounded-b-lg flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Batal
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={isDeleting || !startDate || !endDate}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Lanjutkan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              Konfirmasi Penghapusan Massal
            </AlertDialogTitle>
            <div className="text-gray-600 dark:text-gray-400 space-y-3 mt-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                Anda akan menghapus {type === 'panic' ? 'laporan panic' : 'laporan'} dengan kriteria:
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1 text-sm">
                <div>• <span className="font-medium">Rentang Tanggal:</span> {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</div>
                {status && (
                  <div>• <span className="font-medium">Status:</span> {(type === 'panic' ? panicStatusOptions : reportStatusOptions).find(o => o.value === status)?.label}</div>
                )}
                {type === 'report' && problemType && (
                  <div>• <span className="font-medium">Jenis Masalah:</span> {problemTypeOptions.find(o => o.value === problemType)?.label}</div>
                )}
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="text-red-800 dark:text-red-300 font-semibold text-sm">
                  ⚠ Tindakan ini tidak dapat dibatalkan!
                </div>
                <div className="text-red-700 dark:text-red-400 text-sm mt-1">
                  Data yang telah dihapus tidak dapat dikembalikan.
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Batal
            </AlertDialogCancel>
            <Button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Ya, Hapus Sekarang
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
