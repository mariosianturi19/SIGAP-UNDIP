// src/app/student/emergency/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import PanicButton from "@/components/PanicButton";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, AlertCircle, Info, MapPin, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { toast } from "sonner";

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
    <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[80vh] max-w-3xl py-8">
      {/* Location Permission Modal */}
      <AnimatePresence>
        {showLocationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Izinkan Akses Lokasi
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Untuk menggunakan fitur tombol darurat, SIGAP UNDIP memerlukan akses ke lokasi Anda. 
                  Informasi lokasi hanya akan digunakan saat mengirim sinyal darurat.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={dismissLocationPrompt}
                    className="flex-1"
                  >
                    Nanti Saja
                  </Button>
                  <Button
                    onClick={handleLocationRequest}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={locationLoading}
                  >
                    {locationLoading ? "Memproses..." : "Izinkan"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full text-center mb-10"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Bantuan Darurat</h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Tekan tombol darurat untuk mengirim peringatan darurat dengan lokasi Anda ke keamanan kampus.
        </p>
      </motion.div>

      {/* Location Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full max-w-lg mx-auto mb-6"
      >
        {locationLoading ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg flex">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3 mt-0.5"></div>
            <div>
              <h3 className="font-medium text-blue-800">Mengakses Lokasi</h3>
              <p className="text-sm text-blue-700 mt-1">
                Sedang meminta izin akses lokasi...
              </p>
            </div>
          </div>
        ) : hasPermission && location ? (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg flex">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-green-800">Lokasi Aktif</h3>
              <p className="text-sm text-green-700 mt-1">
                Siap mengirim sinyal darurat (Akurasi: ±{location.accuracy ? Math.round(location.accuracy) : '?'}m)
              </p>
            </div>
          </div>
        ) : locationError ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg flex">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-red-800">Akses Lokasi Gagal</h3>
              <p className="text-sm text-red-700 mt-1 mb-2">{locationError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLocationRequest}
                className="text-red-700 border-red-300 hover:bg-red-100"
                disabled={locationLoading}
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg flex">
            <MapPin className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-amber-800">Akses Lokasi Diperlukan</h3>
              <p className="text-sm text-amber-700 mt-1 mb-2">
                Untuk menggunakan tombol darurat, izinkan akses lokasi terlebih dahulu
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLocationRequest}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
                disabled={locationLoading}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Izinkan Akses Lokasi
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Important Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-lg mx-auto mb-8"
      >
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg flex">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-yellow-800">Penting</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Tombol ini hanya untuk keadaan darurat yang sebenarnya. Penyalahgunaan dapat dikenakan sanksi sesuai peraturan universitas dan hukum yang berlaku.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Panic Button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
       className="w-full flex flex-col items-center mb-10"
     >
       <PanicButton />
     </motion.div>

     {/* Emergency Contact Cards */}
     <motion.div 
       initial={{ opacity: 0, y: 30 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.7, delay: 0.5 }}
       className="w-full max-w-lg mx-auto"
     >
       <div className="border-t border-gray-200 pt-6">
         <h3 className="text-lg font-semibold text-gray-700 flex items-center justify-center mb-3">
           <Phone className="h-5 w-5 mr-2" />
           Kontak Darurat
         </h3>
         <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="bg-blue-100 p-4 rounded-lg text-center shadow-sm"
        >
          <p className="text-blue-800 font-semibold">Keamanan Kampus</p>
          <p className="text-3xl font-bold text-blue-900">081125000054</p>
          <p className="text-sm text-blue-700 mt-1">Tersedia 24/7</p>
          <a 
            href="https://wa.me/6281125000054" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center text-blue-700 text-sm hover:text-blue-900 font-medium"
          >
            <Phone className="h-3.5 w-3.5 mr-1" />
            Hubungi langsung
          </a>
        </motion.div>
       </div>
       {/* Information Footer */}
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.8 }}
         className="mt-6 text-center"
       >
         <div className="flex items-center justify-center text-sm text-gray-500">
           <Shield className="h-4 w-4 mr-2 text-gray-400" />
           <p>Lokasi Anda hanya dibagikan saat tombol darurat digunakan</p>
         </div>
       </motion.div>
     </motion.div>
   </div>
 );
}