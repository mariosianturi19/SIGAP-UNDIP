// src/app/student/report/page.tsx
"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { toast } from "sonner";
import { Camera, Upload, X, Check, Image as ImageIcon, MapPin, FileType, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAccessToken, isAuthenticated } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
      router.push("/auth/login"); // Update path: Sebelumnya /login
    }
  }, [router]);

  // Fungsi untuk menangani pemilihan file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  // Fungsi untuk menangani akses kamera
  const handleCameraAccess = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
    // Atur ulang semua bidang formulir
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

  // Fungsi untuk memvalidasi formulir
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!selectedFile) {
      errors.photo = "Silakan unggah gambar untuk laporan Anda";
    }
    
    if (!reportType) {
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

  // Fungsi untuk menangani pengiriman formulir
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validasi formulir
    if (!validateForm()) {
      // Tampilkan pesan kesalahan untuk kesalahan pertama
      const firstError = Object.values(formErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    // Periksa apakah terautentikasi sebelum pengiriman
    if (!isAuthenticated()) {
      toast.error("Sesi Anda telah berakhir. Silakan masuk lagi.");
      router.push("/auth/login"); // Update path: Sebelumnya /login
      return;
    }
    
    // Kirim formulir
    setIsSubmitting(true);
    
    try {
      // Dapatkan token baru sebelum mengirim
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error("Autentikasi diperlukan. Silakan masuk lagi.");
      }

      // LANGKAH 1: Unggah foto terlebih dahulu
      console.log("Mengunggah foto...");
      
      const photoFormData = new FormData();
      photoFormData.append('photo', selectedFile!);
      
      const photoResponse = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: photoFormData
      });
      
      if (!photoResponse.ok) {
        const errorData = await photoResponse.json();
        throw new Error(errorData.message || `Unggahan foto gagal dengan status ${photoResponse.status}`);
      }
      
      const photoData = await photoResponse.json();
      console.log("Respons unggahan foto:", photoData);
      
      if (!photoData.success || !photoData.photo_path) {
        throw new Error("Gagal mendapatkan jalur foto dari server");
      }
      
      // LANGKAH 2: Kirim laporan dengan photo_path yang didapat
      console.log("Mengirim laporan dengan jalur foto:", photoData.photo_path);
      
      const reportData = {
        photo_path: photoData.photo_path,
        location: location,
        problem_type: reportType,
        description: description
      };
      
      const reportResponse = await fetch('https://sigap-api-5hk6r.ondigitalocean.app/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });
      
      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        throw new Error(errorData.message || `Pengiriman laporan gagal dengan status ${reportResponse.status}`);
      }
      
      const reportResult = await reportResponse.json();
      console.log("Respons pengiriman laporan:", reportResult);

      toast.success("Laporan berhasil dikirim", {
        description: "Laporan Anda telah dikirim dan akan segera ditinjau.",
      });
      
      // Atur ulang formulir, bukan mengalihkan
      resetForm();
      
    } catch (error) {
      console.error("Kesalahan mengirim laporan:", error);
      
      // Tangani kesalahan autentikasi secara khusus
      if (error instanceof Error && error.message.includes("Autentikasi diperlukan")) {
        toast.error("Sesi Anda telah berakhir", {
          description: "Silakan masuk lagi untuk melanjutkan.",
        });
        router.push("/auth/login"); // Update path: Sebelumnya /login
      } else {
        toast.error("Gagal mengirim laporan", {
          description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk mendapatkan status kesalahan untuk bidang
  const hasError = (field: string) => !!formErrors[field];

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-lg">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="my-6 text-center"
      >
        <h1 className="text-2xl font-bold mb-2">Laporkan Masalah</h1>
        <p className="text-gray-600 mb-6">
          Unggah foto dan detail tentang masalah
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-lg shadow-md p-6 border border-gray-100"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bagian Unggah Gambar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Bukti Foto
              </Label>
              {hasError('photo') && (
                <span className="text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {formErrors.photo}
                </span>
              )}
            </div>
            
            <motion.div 
              whileHover={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${hasError('photo') ? 'border-red-300' : 'border-gray-300'} border-dashed rounded-lg transition-colors duration-300`}
            >
              <AnimatePresence mode="wait">
                {previewImage ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full space-y-2"
                  >
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                      <img 
                        src={previewImage} 
                        alt="Pratinjau" 
                        className="w-full h-full object-contain" 
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80 transition-colors"
                      >
                        <X size={16} />
                      </motion.button>
                    </div>
                    {selectedFile && (
                      <div className="text-xs text-gray-500 flex items-center justify-center mt-2">
                        <FileType className="h-3 w-3 mr-1" />
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1 text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    </motion.div>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span className="underline">Unggah berkas</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">atau seret dan lepas</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF hingga 10MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="flex space-x-2 mt-2">
              <motion.div className="flex-1" whileHover={{ y: -2 }} whileTap={{ y: 1 }}>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Pilih Berkas
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Dropdown Jenis Laporan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="report-type" className="block text-sm font-medium text-gray-700">
                Jenis Laporan
              </Label>
              {hasError('type') && (
                <span className="text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {formErrors.type}
                </span>
              )}
            </div>
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
              placeholder="Pilih jenis masalah"
              options={reportTypeOptions}
              error={hasError('type')}
            />
          </div>

          {/* Input Lokasi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Lokasi
              </Label>
              {hasError('location') && (
                <span className="text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {formErrors.location}
                </span>
              )}
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="location"
                placeholder="Gedung/Lantai/Ruangan atau area spesifik"
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
                className={`pl-10 ${hasError('location') ? 'border-red-300' : ''}`}
              />
            </div>
            <p className="text-xs text-gray-500">
              Berikan detail lokasi masalah seakurat mungkin
            </p>
          </div>

          {/* Textarea Deskripsi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Deskripsi
              </Label>
              {hasError('description') && (
                <span className="text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {formErrors.description}
                </span>
              )}
            </div>
            <Textarea
              id="description"
              placeholder="Berikan rincian tentang masalah tersebut..."
              rows={5}
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
              className={`resize-none ${hasError('description') ? 'border-red-300' : ''}`}
            />
            <p className="text-xs text-gray-500">
              Jelaskan dengan spesifik tentang tingkat keparahan dan potensi masalah keamanan.
            </p>
          </div>

          {/* Tombol Kirim dan Reset */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <motion.div 
              className="sm:flex-1" 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit" 
                className="w-full py-6 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Kirim Laporan
                  </>
                )}
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="button" 
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
                className="w-full py-6"
              >
                <X className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </motion.div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}