// src/components/Footer.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";

export default function Footer() {
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 py-3">
      <div className="container mx-auto px-4">
        <p className="text-center text-gray-300 text-sm">
          © 2025 SIGAP UNDIP - Sistem Informasi Gawat dan Pelaporan. Made with love{" "}
          <button
            onClick={() => setIsCreditsOpen(true)}
            className="text-red-400 hover:text-red-300 transition-colors duration-200 cursor-pointer"
            aria-label="Show credits"
          >
            ❤️
          </button>
          . All rights reserved.
        </p>
      </div>

      {/* Credits Modal */}
      <AnimatePresence>
        {isCreditsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCreditsOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 shadow-lg"
                >
                  <Heart className="h-10 w-10 text-white fill-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Made with Love</h2>
                <p className="text-gray-300 text-sm">Tim SIGAP UNDIP 2025</p>
                <button
                  onClick={() => setIsCreditsOpen(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                <div className="space-y-3">
                  <p className="text-gray-700 text-center leading-relaxed">
                    Terima kasih kepada tim yang telah berkontribusi dalam pengembangan SIGAP UNDIP
                  </p>
                </div>

                {/* Team List */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 gap-2">
                      <p><strong>Mario Sianturi</strong> - Teknik Komputer 2022</p>
                      <p><strong>Dzikri</strong> - Teknik Komputer 2022</p>
                      <p><strong>Parulian</strong> - Teknik Komputer 2022</p>
                      <p><strong>Bravely</strong> - Teknik Komputer 2022</p>
                      <p><strong>Azhar</strong> - Teknik Komputer 2022</p>
                      <p><strong>Massa</strong> - Teknik Elektro 2022</p>
                      <p><strong>Torik</strong> - Manajemen 2022</p>
                      <p><strong>Irene</strong> - Manajemen 2022</p>
                      <p><strong>Ajeng</strong> - Manajemen 2022</p>
                      <p><strong>Asti</strong> - Hukum 2022</p>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsCreditsOpen(false)}
                  className="w-full bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-800 text-white py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}