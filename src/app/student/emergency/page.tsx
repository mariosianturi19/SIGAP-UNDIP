"use client";

import React, { useEffect, useState, useCallback } from "react";
import PanicButton from "@/components/PanicButton";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, AlertCircle, MapPin, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { toast } from "sonner";
import StudentWrapper from '@/components/shared/StudentWrapper';

export default function EmergencyPage() {
  const { 
    hasPermission, 
    isLoading: locationLoading, 
    requestPermission, 
    location,
    error: locationError 
  } = useLocationPermission();

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  // Show location prompt after page loads if permission not granted
  useEffect(() => {
    if (!hasPermission && !locationLoading && !locationError && !hasShownPrompt) {
      const timer = setTimeout(() => {
        setShowLocationPrompt(true);
        setHasShownPrompt(true);
      }, 2000); // Show prompt after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [hasPermission, locationLoading, locationError, hasShownPrompt]);

  const handleLocationRequest = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowLocationPrompt(false);
      toast.success("Akses lokasi berhasil diaktifkan", {
        description: "Fitur darurat sekarang siap digunakan"
      });
    }
  }, [requestPermission]);

  const dismissLocationPrompt = useCallback(() => {
    setShowLocationPrompt(false);
    toast.warning("Fitur darurat memerlukan akses lokasi", {
      description: "Anda dapat mengaktifkannya kapan saja dengan menekan tombol di bawah"
    });
  }, []);

  return (
    <StudentWrapper>
      {/* Modern Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 -z-10" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2394a3b8\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'4\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] -z-10" />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          {/* Location Permission Modal */}
          <AnimatePresence>
            {showLocationPrompt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6 relative overflow-hidden"
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl" />
                  
                  <div className="text-center relative">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4 shadow-lg"
                    >
                      <MapPin className="h-6 w-6 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Izinkan Akses Lokasi
                    </h3>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                      Untuk menggunakan fitur tombol darurat, SIGAP UNDIP memerlukan akses ke lokasi Anda. 
                      Informasi lokasi hanya akan digunakan saat mengirim sinyal darurat.
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={dismissLocationPrompt}
                        className="flex-1 border-gray-200 hover:bg-gray-50/80 backdrop-blur-sm text-sm"
                        size="sm"
                      >
                        Nanti Saja
                      </Button>
                      <Button
                        onClick={handleLocationRequest}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-sm"
                        disabled={locationLoading}
                        size="sm"
                      >
                        {locationLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Memproses...
                          </div>
                        ) : "Izinkan"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Section - Compact */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-4"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Bantuan Darurat
            </h1>
            <p className="text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
              Tekan tombol darurat untuk mengirim peringatan darurat dengan lokasi Anda ke keamanan kampus secara real-time.
            </p>
          </motion.div>

          {/* Location Status Card - More Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-xl mx-auto mb-3"
          >
            {locationLoading ? (
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-white/80 backdrop-blur-xl border border-blue-200/50 rounded-lg p-3 shadow-md"
              >
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
                  <div>
                    <h3 className="font-medium text-blue-900 text-sm">Mengakses Lokasi</h3>
                    <p className="text-blue-700 text-xs mt-0.5">
                      Sedang meminta izin akses lokasi...
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : hasPermission && location ? (
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-lg p-3 shadow-md relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-emerald-400/5" />
                <div className="flex items-center relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-md"
                  >
                    <CheckCircle className="h-4 w-4 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-medium text-green-900 text-sm">Lokasi Aktif</h3>
                    <p className="text-green-700 text-xs mt-0.5">
                      Siap mengirim sinyal darurat (Akurasi: ±{location.accuracy ? Math.round(location.accuracy) : '?'}m)
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : locationError ? (
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-lg p-3 shadow-md relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 to-pink-400/5" />
                <div className="flex items-start relative">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900 text-sm">Akses Lokasi Gagal</h3>
                    <p className="text-red-700 text-xs mt-0.5 mb-2">{locationError}</p>
                    <Button
                      size="sm"
                      onClick={handleLocationRequest}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md h-7 text-xs px-2"
                      disabled={locationLoading}
                    >
                      Coba Lagi
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-lg p-3 shadow-md relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-orange-400/5" />
                <div className="flex items-start relative">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-900 text-sm">Akses Lokasi Diperlukan</h3>
                    <p className="text-amber-700 text-xs mt-0.5 mb-2">
                      Untuk menggunakan tombol darurat, izinkan akses lokasi terlebih dahulu
                    </p>
                    <Button
                      size="sm"
                      onClick={handleLocationRequest}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md h-7 text-xs px-2"
                      disabled={locationLoading}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Izinkan Akses Lokasi
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Important Notice - More Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-xl mx-auto mb-3"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-white/60 backdrop-blur-xl border border-yellow-200/50 rounded-lg p-3 shadow-md relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-amber-400/5" />
              <div className="flex items-start relative">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-900 text-sm">Peringatan Penting</h3>
                  <p className="text-yellow-800 mt-0.5 text-xs leading-relaxed">
                    Tombol ini hanya untuk keadaan darurat yang sebenarnya. Penyalahgunaan dapat dikenakan sanksi sesuai peraturan universitas dan hukum yang berlaku.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Panic Button - Larger */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
            className="w-full flex flex-col items-center mb-6 py-6"
          >
            <PanicButton />
          </motion.div>

          {/* Emergency Contact Cards - Compact */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="relative">
              <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 p-4 relative">
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-lg font-bold text-gray-800 flex items-center justify-center mb-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-slate-700 rounded-full flex items-center justify-center mr-2 shadow-lg">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  Kontak Darurat
                </motion.h3>
                
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="border border-gray-200 p-4 rounded-xl text-center shadow-lg text-gray-800 relative overflow-hidden bg-white"
                >
                  <div className="relative">
                    <p className="text-gray-600 font-semibold mb-1">Keamanan Kampus</p>
                    <p className="text-2xl font-bold text-gray-800 mb-1">081125000054</p>
                    <p className="text-gray-500 text-sm mb-3">Tersedia 24/7</p>
                    <motion.a 
                      href="https://wa.me/6281125000054" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-700 text-sm font-medium transition-all duration-200 shadow-md border border-gray-200"
                    >
                      <Phone className="h-3 w-3 mr-2" />
                      Hubungi Sekarang
                    </motion.a>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Information Footer - Compact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 text-center"
            >
              <div className="flex items-center justify-center text-gray-600 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50 text-sm">
                <Shield className="h-4 w-4 mr-2 text-gray-500" />
                <p className="font-medium">Lokasi Anda hanya dibagikan saat tombol darurat digunakan</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </StudentWrapper>
  );
}