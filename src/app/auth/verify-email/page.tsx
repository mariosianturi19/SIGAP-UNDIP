"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      toast.error("Email tidak ditemukan", {
        description: "Silakan register terlebih dahulu",
      });
      router.push("/auth/register");
    }
  }, [email, router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Enable resend after 1 minute
  useEffect(() => {
    const resendTimer = setTimeout(() => {
      setCanResend(true);
    }, 60000); // 1 minute

    return () => clearTimeout(resendTimer);
  }, []);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft > 300) return "text-green-600"; // > 5 minutes
    if (timeLeft > 120) return "text-yellow-600"; // > 2 minutes
    return "text-red-600"; // < 2 minutes
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when user types
    if (error) setError("");
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus last filled input or last input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Verify OTP with retry mechanism
  const handleVerifyOtp = async (attemptNumber = 1) => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Masukkan kode OTP 6 digit");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      console.log(`[VERIFY EMAIL] Attempt ${attemptNumber}/3 - Verifying OTP...`);

      const response = await fetch("/api/email/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("[VERIFY EMAIL] ✅ Verification successful");
        setSuccess(true);
        toast.success("Email berhasil diverifikasi!", {
          description: "Anda akan diarahkan ke halaman login...",
        });

        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else if (response.status === 408 && data.timeout && attemptNumber < 3) {
        // Timeout - retry
        console.log(`[VERIFY EMAIL] ⏱️ Timeout - Retrying (${attemptNumber + 1}/3)...`);
        toast.warning(`Mencoba lagi (${attemptNumber + 1}/3)...`, {
          description: "Request timeout, mencoba ulang...",
        });

        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
        return handleVerifyOtp(attemptNumber + 1);
      } else {
        console.log("[VERIFY EMAIL] ❌ Verification failed:", data.message);
        setError(data.message || "Kode OTP tidak valid atau sudah kadaluarsa");
        toast.error("Verifikasi gagal", {
          description: data.message || "Kode OTP tidak valid",
        });
      }
    } catch (error) {
      console.error("[VERIFY EMAIL] ❌ Error:", error);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      toast.error("Verifikasi gagal", {
        description: "Terjadi kesalahan jaringan",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP with retry mechanism
  const handleResendOtp = async (attemptNumber = 1) => {
    setIsResending(true);
    setError("");

    try {
      console.log(`[RESEND OTP] Attempt ${attemptNumber}/3 - Resending OTP...`);

      const response = await fetch("/api/email/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("[RESEND OTP] ✅ OTP sent successfully");
        toast.success("Kode OTP berhasil dikirim!", {
          description: "Silakan cek email Anda",
        });

        // Reset timer and OTP
        setTimeLeft(600);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();

        // Re-enable resend after 1 minute
        setTimeout(() => setCanResend(true), 60000);
      } else if (response.status === 408 && data.timeout && attemptNumber < 3) {
        // Timeout - retry
        console.log(`[RESEND OTP] ⏱️ Timeout - Retrying (${attemptNumber + 1}/3)...`);
        toast.warning(`Mencoba lagi (${attemptNumber + 1}/3)...`, {
          description: "Request timeout, mencoba ulang...",
        });

        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
        return handleResendOtp(attemptNumber + 1);
      } else {
        console.log("[RESEND OTP] ❌ Failed:", data.message);
        toast.error("Gagal mengirim OTP", {
          description: data.message || "Silakan coba lagi",
        });
      }
    } catch (error) {
      console.error("[RESEND OTP] ❌ Error:", error);
      toast.error("Gagal mengirim OTP", {
        description: "Terjadi kesalahan jaringan",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="relative flex min-h-screen w-full">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/UPT-K3L-logo.jpg"
          alt="UPT K3L Universitas Diponegoro"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-2xl text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">Verifikasi Email</h2>
              <p className="text-gray-300 mt-2">
                Kami telah mengirim kode verifikasi 6 digit ke
              </p>
              <p className="text-white font-semibold mt-1 break-all">{email}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 bg-white">
              {/* Success State */}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Email berhasil diverifikasi!</p>
                      <p className="text-sm text-green-700 mt-1">Mengalihkan ke halaman login...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !success && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* OTP Input */}
              {!success && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      Masukkan Kode Verifikasi
                    </label>
                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all ${
                            error ? "border-red-400" : "border-gray-300"
                          } ${digit ? "border-gray-600" : ""}`}
                          disabled={isVerifying || success}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock className={`w-4 h-4 ${getTimerColor()}`} />
                    <span className={`font-semibold ${getTimerColor()}`}>
                      {timeLeft > 0 ? `Kode berlaku ${formatTime(timeLeft)}` : "Kode sudah kadaluarsa"}
                    </span>
                  </div>

                  {/* Verify Button */}
                  <Button
                    onClick={() => handleVerifyOtp()}
                    disabled={otp.join("").length !== 6 || isVerifying || timeLeft <= 0}
                    className="w-full h-12 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      "Verifikasi Email"
                    )}
                  </Button>

                  {/* Resend Section */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 text-center mb-3">
                      Tidak menerima kode?
                    </p>
                    <Button
                      onClick={() => handleResendOtp()}
                      disabled={!canResend || isResending}
                      variant="outline"
                      className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Mengirim Ulang...
                        </>
                      ) : canResend ? (
                        "Kirim Ulang Kode OTP"
                      ) : (
                        "Tunggu 1 menit untuk kirim ulang"
                      )}
                    </Button>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">💡 Tips:</span> Cek folder spam/junk jika email tidak masuk dalam 1-2 menit.
                    </p>
                  </div>
                </>
              )}

              {/* Back to Login */}
              <div className="text-center pt-4 border-t">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Kembali ke halaman login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen w-full items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/UPT-K3L-logo.jpg"
            alt="UPT K3L Universitas Diponegoro"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        </div>
        <div className="relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
