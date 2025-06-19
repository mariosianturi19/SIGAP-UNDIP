// src/components/PanicButtonTerms.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface PanicButtonTermsProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

const PanicButtonTerms: React.FC<PanicButtonTermsProps> = ({ isOpen, onAccept, onClose }) => {
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
      setIsSending(false);
      setCountdown(3);
    }
  }, [isOpen]);

  // Handle countdown after acceptance
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSending && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isSending && countdown === 0) {
      onAccept();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSending, countdown, onAccept]);

  const handleAccept = useCallback(() => {
    if (isChecked && !isSending) {
      setIsSending(true);
    }
  }, [isChecked, isSending]);

  const handleClose = useCallback(() => {
    if (!isSending) {
      onClose();
    }
  }, [isSending, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Only close if clicking the backdrop and not sending
            if (e.target === e.currentTarget && !isSending) {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 sm:mx-4 max-h-[90vh] sm:max-h-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {!isSending ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <h2 className="text-base sm:text-lg font-bold">Syarat dan Ketentuan Tombol Darurat</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-red-500/30 transition-colors"
                    disabled={isSending}
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[50vh] sm:max-h-[400px] overflow-y-auto p-3 sm:p-4">
                  <div className="space-y-3 sm:space-y-4 text-gray-700">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center text-sm sm:text-base">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2 text-xs sm:text-sm">1</span>
                        Penggunaan yang Dibenarkan
                      </h3>
                      <p className="text-xs sm:text-sm ml-7 sm:ml-8">
                        Tombol darurat hanya boleh digunakan dalam situasi darurat yang nyata seperti ancaman keselamatan jiwa, keadaan medis darurat, kebakaran, atau situasi yang memerlukan bantuan segera.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center text-sm sm:text-base">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2 text-xs sm:text-sm">2</span>
                        Larangan Penyalahgunaan
                      </h3>
                      <p className="text-xs sm:text-sm ml-7 sm:ml-8">
                        Dilarang keras menggunakan tombol darurat untuk alarm palsu, lelucon, mengacaukan sistem, atau menyebabkan kepanikan tanpa alasan yang sah.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center text-sm sm:text-base">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2 text-xs sm:text-sm">3</span>
                        Konsekuensi Hukum
                      </h3>
                      <p className="text-xs sm:text-sm ml-7 sm:ml-8">
                        Penyalahgunaan dapat dikenakan sanksi berupa peringatan, skorsing dari universitas, hingga tuntutan pidana berdasarkan UU ITE dengan ancaman pidana penjara hingga 6 tahun dan denda.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center text-sm sm:text-base">
                        <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2 text-xs sm:text-sm">4</span>
                        Persetujuan Pengguna
                      </h3>
                      <p className="text-xs sm:text-sm ml-7 sm:ml-8">
                        Dengan menggunakan tombol darurat, pengguna menyatakan telah memahami seluruh ketentuan, konsekuensi penyalahgunaan, dan bersedia memberikan izin penggunaan data lokasi yang diperlukan.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Checkbox */}
                <div className="p-3 sm:p-4 border-t">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={isChecked}
                      onCheckedChange={(checked) => setIsChecked(checked === true)}
                      className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5"
                    />
                    <label 
                      htmlFor="terms" 
                      className="text-xs sm:text-sm font-medium leading-tight cursor-pointer"
                      onClick={() => setIsChecked(!isChecked)}
                    >
                      Saya telah membaca, memahami, dan menyetujui syarat dan ketentuan penggunaan tombol darurat
                    </label>
                  </div>
                </div>
                
                {/* Buttons */}
                <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 bg-gray-50">
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    className="border-gray-300 w-full sm:w-auto"
                    disabled={isSending}
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={handleAccept}
                    disabled={!isChecked || isSending}
                    className={`w-full sm:w-auto ${!isChecked ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Saya Mengerti dan Lanjutkan</span>
                  </Button>
                </div>
              </>
            ) : (
              // Countdown screen
              <div className="p-6 sm:p-8 flex flex-col items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="bg-red-100 rounded-full p-3 sm:p-4 mb-4 sm:mb-6"
                >
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2 sm:mb-3 text-center">
                  Mengirim Peringatan Darurat
                </h2>
                <motion.p 
                  key={countdown} 
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-red-600"
                >
                  {countdown}
                </motion.p>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 text-center px-2">
                  Sinyal darurat dengan lokasi Anda akan dikirimkan ke petugas keamanan kampus.
                  <br />Tetap tenang dan tunggu bantuan datang.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                  disabled
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Tidak dapat dibatalkan</span>
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PanicButtonTerms;