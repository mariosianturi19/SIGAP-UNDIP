// src/components/PanicButton.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import PanicButtonTerms from "./PanicButtonTerms";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const PanicButton: React.FC = () => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [isSendingAlert, setIsSendingAlert] = useState<boolean>(false);

  // Use ref to prevent multiple sends
  const isSendingRef = useRef<boolean>(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use location permission hook
  const { 
    location, 
    hasPermission, 
    requestPermission, 
    getCurrentLocation,
    isLoading: locationLoading,
    error: locationError 
  } = useLocationPermission();

  const handlePanicButtonPress = useCallback(async (): Promise<void> => {
    // Prevent multiple rapid clicks
    if (isSendingAlert || isSendingRef.current) {
      return;
    }

    // Check if location permission is granted
    if (!hasPermission) {
      toast.error("Akses lokasi diperlukan", {
        description: "Silakan izinkan akses lokasi untuk menggunakan tombol darurat"
      });
      
      // Try to request permission again
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }

    // Check if we have any location data (current or cached)
    let currentLocation = location;
    
    // If no cached location, try to get current location
    if (!currentLocation) {
      currentLocation = await getCurrentLocation();
    }
    
    // If still no location, show error
    if (!currentLocation) {
      toast.error("Tidak dapat mengakses lokasi", {
        description: "Pastikan GPS aktif dan izinkan akses lokasi. Coba refresh halaman."
      });
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      
      // Clear any existing timeout
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      
      // Reset after 3 seconds if not confirmed
      confirmTimeoutRef.current = setTimeout(() => {
        setIsConfirming(false);
      }, 3000);
      return;
    }

    // Show terms modal
    setIsTermsModalOpen(true);
  }, [hasPermission, requestPermission, getCurrentLocation, isConfirming, isSendingAlert, location]);

  const sendPanicAlert = useCallback(async (): Promise<void> => {
    // Prevent multiple sends
    if (isSendingRef.current) {
      return;
    }
    isSendingRef.current = true;
    setIsSendingAlert(true);
    
    try {
      // Try to get fresh location first, fallback to cached location
      let currentLocation = await getCurrentLocation();
      
      // If getCurrentLocation fails, use cached location
      if (!currentLocation && location) {
        currentLocation = location;
        console.log("Using cached location for panic alert");
      }
      
      // If no location at all, throw error
      if (!currentLocation) {
        throw new Error("Tidak dapat mengakses lokasi saat ini. Pastikan GPS aktif dan izinkan akses lokasi.");
      }

      // Get access token
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error("Autentikasi diperlukan");
      }

      console.log("Sending panic alert with location:", currentLocation);

      // Send panic alert to API
      const response = await fetch("/api/panic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }),
      });

      const responseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim peringatan darurat");
      }

      console.log("Panic alert sent successfully:", result);

      // Show success message based on API response
      toast.success(result.message || "Peringatan darurat berhasil dikirim!", {
        description: "Tim keamanan kampus telah diberi tahu dan sedang menuju lokasi Anda"
      });

      // Store the panic alert ID for tracking
      if (result.panic?.id) {
        localStorage.setItem("last_panic_alert", JSON.stringify({
          id: result.panic.id,
          timestamp: new Date().toISOString(),
          location: currentLocation,
          status: result.panic.status
        }));
      }

    } catch (error) {
      console.error("Error sending panic alert:", error);
      
      // Handle authentication errors specifically
      if (error instanceof Error && error.message.includes("Autentikasi diperlukan")) {
        toast.error("Sesi Anda telah berakhir", {
          description: "Silakan masuk lagi untuk melanjutkan.",
        });
        // Note: We can't use router here, so we'll just show the error
      } else {
        toast.error("Gagal mengirim peringatan darurat", {
          description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga"
        });
      }
    } finally {
      isSendingRef.current = false;
      setIsSendingAlert(false);
    }
  }, [getCurrentLocation, location]);

  const handleAcceptTerms = useCallback(async (): Promise<void> => {
    setIsTermsModalOpen(false);
    setIsConfirming(false);
    
    // Clear confirmation timeout
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }
    
    await sendPanicAlert();
  }, [sendPanicAlert]);

  const handleCloseTermsModal = useCallback((): void => {
    setIsTermsModalOpen(false);
    setIsConfirming(false);
    
    // Clear confirmation timeout
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }
  }, []);

  const handleRequestLocation = useCallback(async (): Promise<void> => {
    const granted = await requestPermission();
    if (granted) {
      toast.success("Akses lokasi berhasil diaktifkan", {
        description: "Tombol darurat sekarang siap digunakan"
      });
    }
  }, [requestPermission]);

  // Helper function to get location status text
  const getLocationStatusText = useCallback(() => {
    if (!location) return null;
    
    const accuracy = location.accuracy ? Math.round(location.accuracy) : null;
    
    if (!accuracy) return "Siap digunakan";
    
    if (accuracy <= 50) {
      return `Siap digunakan (GPS Akurat: ±${accuracy}m)`;
    } else if (accuracy <= 200) {
      return `Siap digunakan (GPS Standar: ±${accuracy}m)`;
    } else {
      return `Siap digunakan (Estimasi Lokasi: ±${accuracy}m)`;
    }
  }, [location]);

  // Helper function to determine if location accuracy is acceptable
  const isLocationAccurate = useCallback(() => {
    if (!location || !location.accuracy) return true; // Assume OK if no accuracy info
    return location.accuracy <= 1000; // Accept up to 1km accuracy
  }, [location]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  // Show request permission UI if no permission
  if (!hasPermission && !locationLoading) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <motion.button
            disabled
            className="relative z-10 w-52 h-52 rounded-full flex items-center justify-center text-white font-bold shadow-lg bg-gray-400 cursor-not-allowed"
          >
            <div className="flex flex-col items-center">
              <MapPin className="h-12 w-12 mb-2" />
              <span className="text-xl tracking-wide">AKSES LOKASI</span>
              <span className="text-base mt-1">DIPERLUKAN</span>
            </div>
          </motion.button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Izinkan akses lokasi untuk menggunakan tombol darurat
          </p>
          <Button 
            onClick={handleRequestLocation}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={locationLoading}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {locationLoading ? "Memproses..." : "Izinkan Akses Lokasi"}
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state if location is being requested
  if (locationLoading) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <motion.button
            disabled
            className="relative z-10 w-52 h-52 rounded-full flex items-center justify-center text-white font-bold shadow-lg bg-blue-500 cursor-not-allowed"
          >
            <div className="flex flex-col items-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <MapPin className="h-12 w-12 mb-2" />
              </motion.div>
              <span className="text-xl tracking-wide">MENGAKSES</span>
              <span className="text-base mt-1">Lokasi...</span>
            </div>
          </motion.button>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Mengaktifkan akses lokasi...
        </div>
      </div>
    );
  }

  // Show error state if location access failed
  if (locationError && !location) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <motion.button
            disabled
            className="relative z-10 w-52 h-52 rounded-full flex items-center justify-center text-white font-bold shadow-lg bg-red-400 cursor-not-allowed"
          >
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-12 w-12 mb-2" />
              <span className="text-xl tracking-wide">ERROR</span>
              <span className="text-base mt-1">Akses Gagal</span>
            </div>
          </motion.button>
        </div>
        
        <div className="mt-4 text-center max-w-xs">
          <p className="text-sm text-red-600 mb-3">
            {locationError}
          </p>
          <Button 
            onClick={handleRequestLocation}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            disabled={locationLoading}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // Show low accuracy warning if location accuracy is poor
  if (hasPermission && location && !isLocationAccurate()) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <motion.button
            onClick={handlePanicButtonPress}
            disabled={isSendingAlert || locationLoading}
            whileHover={!isSendingAlert && !locationLoading ? { scale: 1.03 } : {}}
            whileTap={!isSendingAlert && !locationLoading ? { scale: 0.97 } : {}}
            className="relative z-10 w-52 h-52 rounded-full flex items-center justify-center text-white font-bold shadow-lg bg-amber-600"
          >
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-12 w-12 mb-2" />
              <span className="text-xl tracking-wide">AKURASI</span>
              <span className="text-base mt-1">RENDAH</span>
            </div>
          </motion.button>
        </div>
        
        <div className="mt-4 text-center max-w-xs">
          <p className="text-sm text-amber-600 mb-3">
            Akurasi lokasi rendah (±{location.accuracy ? Math.round(location.accuracy) : '?'}m). 
            Pindah ke area terbuka untuk GPS yang lebih baik.
          </p>
          <div className="flex space-x-2">
            <Button 
              onClick={handleRequestLocation}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-600 hover:bg-amber-50"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Perbarui Lokasi
            </Button>
            <Button 
              onClick={handlePanicButtonPress}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              Lanjut Darurat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Main Button */}
        <motion.button
          onClick={handlePanicButtonPress}
          disabled={isSendingAlert || locationLoading}
          whileHover={!isSendingAlert && !locationLoading ? { scale: 1.03 } : {}}
          whileTap={!isSendingAlert && !locationLoading ? { scale: 0.97 } : {}}
          className={`relative z-10 w-52 h-52 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
            isSendingAlert
              ? 'bg-green-600'
              : isConfirming
                ? 'bg-amber-600'
                : 'bg-red-600'
          }`}
        >
          <div className="flex flex-col items-center">
            {/* Icon with conditional animation */}
            {isSendingAlert ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <AlertCircle className="h-12 w-12 mb-2" />
              </motion.div>
            ) : isConfirming ? (
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <AlertCircle className="h-12 w-12 mb-2" />
              </motion.div>
            ) : (
              <AlertCircle className="h-12 w-12 mb-2" />
            )}
            
            <span className="text-2xl tracking-wide">
              {isSendingAlert 
                ? "MENGIRIM..." 
                : isConfirming 
                  ? "KONFIRMASI" 
                  : "DARURAT"
              }
            </span>
            {isConfirming && !isSendingAlert && (
              <span className="text-sm mt-1 bg-amber-700/50 px-2 py-0.5 rounded-full">
                Tekan untuk lanjut
              </span>
            )}
          </div>
        </motion.button>
        
        {/* Pulse Animation - only when NOT confirming or sending */}
        {!isConfirming && !isSendingAlert && hasPermission && location && (
          <>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full bg-red-500 opacity-25 animate-ping-slow -z-10"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full bg-red-500 opacity-15 animate-ping-slower -z-20"></div>
          </>
        )}
        
        {/* Confirm Animation */}
        {isConfirming && !isSendingAlert && (
          <motion.div 
            initial={{ opacity: 0.2 }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.05, 1]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute top-0 left-0 right-0 bottom-0 rounded-full bg-amber-500 -z-10"
          />
        )}

        {/* Sending Animation */}
        {isSendingAlert && (
          <motion.div 
            initial={{ opacity: 0.2 }}
            animate={{ 
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute top-0 left-0 right-0 bottom-0 rounded-full bg-green-500 -z-10"
          />
        )}
      </div>
      
      {/* Status Messages */}
      {hasPermission && location && (
        <div className="mt-3 text-sm text-center">
          <div className={`${
            isLocationAccurate() ? 'text-green-600' : 'text-amber-600'
          }`}>
            ✓ {getLocationStatusText()}
          </div>
          {!isLocationAccurate() && (
            <div className="text-xs text-amber-600 mt-1">
              Pindah ke area terbuka untuk akurasi lebih baik
            </div>
          )}
        </div>
      )}

      {/* Terms Modal */}
      <PanicButtonTerms 
        isOpen={isTermsModalOpen}
        onAccept={handleAcceptTerms}
        onClose={handleCloseTermsModal}
      />

      <style jsx>{`
        @keyframes ping-slow {
          0% { transform: scale(0.95); opacity: 0.25; }
          50% { opacity: 0.15; }
          100% { transform: scale(1.05); opacity: 0; }
        }
        
        @keyframes ping-slower {
          0% { transform: scale(0.9); opacity: 0.15; }
          50% { opacity: 0.1; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-ping-slower {
          animation: ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default PanicButton;