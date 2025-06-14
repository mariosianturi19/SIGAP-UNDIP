// src/app/student/report/page.tsx
"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Camera, 
  X, 
  Check, 
  AlertCircle,
  MapPin, 
  FileType, 
  ImageIcon,
  Loader2,
  ArrowRight,
  Shield,
  RefreshCw,
  FileText,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isAuthenticated, getAccessToken } from "@/lib/auth";
import StudentWrapper from '@/components/shared/StudentWrapper';

// Opsi jenis masalah
const reportTypeOptions = [
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
  { value: "other", label: "Lainnya" }
];

export default function ReportPhotoPage() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [reportType, setReportType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Periksa autentikasi saat komponen dipasang
  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Anda harus masuk untuk mengirim laporan");
      router.push("/auth/login");
    }
  }, [router]);

  // Fungsi untuk menangani pemilihan file dengan validasi yang lebih ketat
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi tipe file - hanya JPG, JPEG dan PNG
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format file tidak didukung. Hanya file JPG, JPEG dan PNG yang diperbolehkan.");
        // Reset input file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Validasi ukuran file (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB dalam bytes
      if (file.size > maxSize) {
        toast.error("Ukuran file terlalu besar. Maksimal 10MB.");
        // Reset input file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      console.log("File selected:", {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
      });

      setSelectedFile(file);
      
      // Hapus kesalahan file sebelumnya
      setFormErrors(prev => {
        const { photo, ...rest } = prev;
        return rest;
      });
      
      // Buat URL pratinjau
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fungsi untuk menghapus gambar yang dipilih
  const handleClearImage = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Fungsi untuk mengatur ulang formulir
  const resetForm = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setReportType("");
    setDescription("");
    setLocation("");
    setFormErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Fungsi untuk memvalidasi formulir - perbaiki validasi
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!selectedFile) {
      errors.photo = "Silakan unggah gambar untuk laporan Anda";
    } else {
      // Validasi tambahan untuk file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        errors.photo = "Format file tidak didukung. Hanya JPG, JPEG dan PNG yang diperbolehkan.";
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        errors.photo = "Ukuran file terlalu besar. Maksimal 10MB.";
      }
    }
    
    if (!reportType || reportType.trim() === "") {
      errors.type = "Silakan pilih jenis laporan";
    }
    
    if (!description || description.trim().length < 10) {
      errors.description = "Silakan berikan deskripsi detail (minimal 10 karakter)";
    }
    
    if (!location || location.trim().length < 3) {
      errors.location = "Silakan berikan lokasi yang valid (minimal 3 karakter)";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fungsi untuk menangani pengiriman formulir - perbaiki error handling
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset form errors sebelum validasi
    setFormErrors({});
    
    // Validasi formulir
    if (!validateForm()) {
      const firstErrorKey = Object.keys(formErrors)[0];
      const firstError = formErrors[firstErrorKey];
      if (firstError) {
        toast.error("Validasi gagal", {
          description: firstError,
        });
      }
      return;
    }

    // Periksa apakah terautentikasi sebelum pengiriman
    if (!isAuthenticated()) {
      toast.error("Sesi Anda telah berakhir. Silakan masuk lagi.");
      router.push("/auth/login");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login ulang.");
      }

      console.log("Starting form submission...");
      console.log("Form data:", {
        hasFile: !!selectedFile,
        fileType: selectedFile?.type,
        fileSize: selectedFile?.size,
        reportType,
        locationLength: location.trim().length,
        descriptionLength: description.trim().length
      });

      // LANGKAH 1: Unggah foto terlebih dahulu dengan validasi yang lebih ketat
      const photoFormData = new FormData();
      
      // Pastikan file ada dan valid
      if (!selectedFile) {
        throw new Error("File foto tidak ditemukan");
      }
      
      // Validasi ulang file sebelum upload
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        throw new Error("Format file tidak didukung. Hanya JPG, JPEG dan PNG yang diperbolehkan.");
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        throw new Error("Ukuran file terlalu besar. Maksimal 10MB.");
      }
      
      photoFormData.append('photo', selectedFile, selectedFile.name);
      
      console.log("Uploading photo to /api/upload-photo");
      
      const photoResponse = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Jangan set Content-Type untuk FormData, biarkan browser yang mengatur
        },
        body: photoFormData
      });
      
      console.log("Photo upload response status:", photoResponse.status);
      
      if (!photoResponse.ok) {
        const errorText = await photoResponse.text();
        console.error("Photo upload error response:", errorText);
        
        if (photoResponse.status === 401) {
          throw new Error("Sesi telah berakhir. Silakan login ulang.");
        } else if (photoResponse.status === 413) {
          throw new Error("File terlalu besar untuk diupload.");
        } else if (photoResponse.status === 422) {
          throw new Error("File tidak valid atau format tidak didukung.");
        }
        
        let errorMessage = "Gagal mengunggah foto";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `Gagal mengunggah foto (Error ${photoResponse.status})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const photoData = await photoResponse.json();
      console.log("Photo upload success:", photoData);
      
      if (!photoData.success || !photoData.photo_path) {
        throw new Error("Gagal mendapatkan jalur foto dari server");
      }
      
      // LANGKAH 2: Kirim laporan dengan photo_path yang didapat
      console.log("Sending report with photo path:", photoData.photo_path);
      
      const reportData = {
        photo_path: photoData.photo_path,
        location: location.trim(),
        problem_type: reportType,
        description: description.trim()
      };
      
      console.log("Report data:", reportData);
      
      // Gunakan endpoint yang benar - sesuaikan dengan API yang ada
      const reportResponse = await fetch('https://sigap-api-5hk6r.ondigitalocean.app/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });
      
      console.log("Report submission response status:", reportResponse.status);
      
      if (!reportResponse.ok) {
        const errorText = await reportResponse.text();
        console.error("Report submission error response:", errorText);
        
        if (reportResponse.status === 401) {
          throw new Error("Sesi telah berakhir. Silakan login ulang.");
        } else if (reportResponse.status === 422) {
          throw new Error("Data laporan tidak valid. Periksa kembali informasi yang diisi.");
        }
        
        let errorMessage = "Gagal mengirim laporan";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `Gagal mengirim laporan (Error ${reportResponse.status})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const reportResult = await reportResponse.json();
      console.log("Report submission success:", reportResult);

      toast.success("Laporan berhasil dikirim", {
        description: "Laporan Anda telah dikirim dan akan segera ditinjau.",
        duration: 5000,
      });
      
      // Atur ulang formulir
      resetForm();
      
    } catch (error) {
      console.error("Error submitting report:", error);
      
      if (error instanceof Error && (
        error.message.includes("Sesi telah berakhir") || 
        error.message.includes("Token tidak ditemukan")
      )) {
        toast.error("Sesi Anda telah berakhir", {
          description: "Silakan masuk lagi untuk melanjutkan.",
        });
        router.push("/auth/login");
      } else {
        toast.error("Gagal mengirim laporan", {
          description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasError = (field: string) => !!formErrors[field];

  return (
    <StudentWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {/* Header without icon - matching navbar colors */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Laporkan Masalah Kampus
            </h1>
            <p className="text-base text-gray-600 max-w-lg mx-auto">
              Bantu membuat kampus lebih aman dan nyaman dengan melaporkan masalah yang Anda temukan
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 flex flex-wrap gap-2 justify-center"
            >
            </motion.div>
          </motion.div>

          {/* Single Card Form - matching navbar colors */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-white backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-4">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2" />
                  Form Laporan Masalah
                </CardTitle>
                <CardDescription className="text-gray-100 text-sm">
                  Isi semua informasi dengan lengkap dan jelas
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Photo Upload Section dengan validasi yang lebih ketat */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1 text-gray-600" />
                      Foto Bukti Masalah *
                    </Label>
                    
                    {hasError('photo') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-50 border-l-4 border-red-400 p-2 rounded-r-lg"
                      >
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-red-700 text-sm font-medium">{formErrors.photo}</span>
                        </div>
                      </motion.div>
                    )}
                    
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className={`relative border-2 border-dashed rounded-lg transition-all duration-300 ${
                        hasError('photo') 
                          ? 'border-red-300 bg-red-50/50' 
                          : 'border-gray-300 hover:border-gray-500 bg-gray-50/50'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {previewImage ? (
                          <motion.div 
                            key="preview"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative"
                          >
                            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={previewImage} 
                                alt="Preview foto laporan" 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={handleClearImage}
                              className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-900 text-white p-2 rounded-full shadow-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                            {selectedFile && (
                              <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                                <div className="flex items-center text-xs">
                                  <FileType className="h-3 w-3 mr-1" />
                                  <span className="font-medium">{selectedFile.name}</span>
                                  <span className="ml-1 text-gray-300">({Math.round(selectedFile.size / 1024)} KB)</span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-6 text-center"
                          >
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                              className="mb-3"
                            >
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mb-2">
                                <ImageIcon className="h-5 w-5 text-gray-600" />
                              </div>
                            </motion.div>
                            <h3 className="text-base font-bold text-gray-800 mb-2">
                              Tambahkan Foto Bukti
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm">
                              Pilih file foto dari perangkat Anda
                            </p>
                            <div className="flex justify-center">
                              <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gray-800 hover:bg-gray-900 h-9 text-sm font-medium"
                                size="sm"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Pilih Foto
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                              Format: JPG, JPEG, PNG • Maksimal ukuran: 10MB
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* Divider */}
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500 font-medium">Detail Laporan</span>
                    </div>
                  </div>

                  {/* Form Fields in Grid - matching navbar colors */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Type Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="report-type" className="text-sm font-semibold text-gray-700 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 text-gray-600" />
                        Jenis Masalah *
                      </Label>
                      {hasError('type') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-red-600 text-xs bg-red-50 p-2 rounded-lg"
                        >
                          {formErrors.type}
                        </motion.div>
                      )}
                      <Select
                        id="report-type"
                        value={reportType}
                        onValueChange={(value) => {
                          setReportType(value);
                          setFormErrors(prev => {
                            const { type, ...rest } = prev;
                            return rest;
                          });
                        }}
                        placeholder="Pilih kategori masalah yang sesuai"
                        options={reportTypeOptions}
                        error={hasError('type')}
                        className="h-9 text-sm border-gray-300"
                      />
                    </div>

                    {/* Location Input */}
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-semibold text-gray-700 flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-600" />
                        Lokasi Masalah *
                      </Label>
                      {hasError('location') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-red-600 text-xs bg-red-50 p-2 rounded-lg"
                        >
                          {formErrors.location}
                        </motion.div>
                      )}
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="location"
                          placeholder="Contoh: Gedung Kuliah Bersama Lt.2, Ruang 201A"
                          value={location}
                          onChange={(e) => {
                            setLocation(e.target.value);
                            if (e.target.value.length >= 3) {
                              setFormErrors(prev => {
                                const { location, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          className={`pl-9 h-9 text-sm border-gray-300 ${hasError('location') ? 'border-red-300' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description - Full Width */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                      <FileText className="h-4 w-4 mr-1 text-gray-600" />
                      Deskripsi Masalah *
                    </Label>
                    {hasError('description') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-red-600 text-xs bg-red-50 p-2 rounded-lg"
                      >
                        {formErrors.description}
                      </motion.div>
                    )}
                    <Textarea
                      id="description"
                      placeholder="Jelaskan masalah secara detail: kondisi saat ini, tingkat bahaya, dampak yang ditimbulkan, dan informasi penting lainnya..."
                      rows={4}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (e.target.value.trim().length >= 10) {
                          setFormErrors(prev => {
                            const { description, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      className={`resize-none text-sm border-gray-300 ${hasError('description') ? 'border-red-300' : ''}`}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        Jelaskan kondisi masalah dengan detail dan tingkat urgensinya
                      </p>
                      <span className={`text-xs font-medium ${
                        description.length >= 10 ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {description.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons - matching navbar colors */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200">
                    <motion.div 
                      className="flex-1" 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full h-10 text-sm font-semibold bg-gray-800 hover:bg-gray-900 shadow-lg transition-all duration-300"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mengirim Laporan...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Kirim Laporan Sekarang
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={resetForm}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reset Form
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hidden file input dengan validasi format yang lebih ketat */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </StudentWrapper>
  );
}