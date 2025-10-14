"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Loader2, AlertCircle, Lock, Eye, EyeOff, Clock, RefreshCw } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const router = useRouter();

  // Countdown timer effect
  useEffect(() => {
    if (step === "reset" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, step]);

  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Email harus diisi");
      toast.error("Email harus diisi");
      return;
    }
    setIsLoading(true);
    
    // Retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`[ATTEMPT ${attempts + 1}/${maxAttempts}] Sending OTP request...`);
        
        const response = await fetch("/api/password/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          console.log("✅ OTP sent successfully");
          toast.success("OTP telah dikirim ke email Anda!", {
            description: `Kode OTP berlaku selama ${data.expires_in_minutes || 10} menit. Cek inbox atau folder spam.`
          });
          setStep("reset");
          setCountdown(600); // Reset countdown to 10 minutes
          setIsLoading(false);
          return; // Success, exit function
        } else {
          // Handle error response
          if (data.errors && data.errors.email) {
            setError(data.errors.email[0] || "Email tidak ditemukan");
            toast.error(data.errors.email[0] || "Email tidak ditemukan");
            setIsLoading(false);
            return; // Don't retry for invalid email
          } else if (data.timeout) {
            // Timeout error, retry
            console.warn(`⏱️ Request timeout on attempt ${attempts + 1}`);
            attempts++;
            if (attempts < maxAttempts) {
              toast.info(`Request timeout. Mencoba lagi... (${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
              continue;
            }
          } else {
            setError(data.message || "Email tidak ditemukan dalam sistem");
            toast.error(data.message || "Email tidak ditemukan dalam sistem");
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error(`❌ Error on attempt ${attempts + 1}:`, error);
        attempts++;
        if (attempts < maxAttempts) {
          toast.info(`Koneksi error. Mencoba lagi... (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          continue;
        }
      }
    }
    
    // All attempts failed
    setError("Gagal mengirim OTP setelah beberapa kali percobaan. Silakan coba lagi nanti.");
    toast.error("Gagal mengirim OTP", {
      description: "Server sedang sibuk atau koneksi tidak stabil. Coba lagi dalam beberapa menit."
    });
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!email || !otp || !password || !passwordConfirmation) {
      setError("Semua field harus diisi");
      toast.error("Semua field harus diisi");
      return;
    }

    if (otp.length !== 6) {
      setError("Kode OTP harus 6 digit");
      toast.error("Kode OTP harus 6 digit");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Password dan konfirmasi password tidak cocok");
      toast.error("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password berhasil direset!", {
          description: "Silakan login dengan password baru Anda"
        });
        router.push("/auth/login");
      } else {
        if (data.message === "Invalid or expired OTP") {
          setError("Kode OTP tidak valid atau sudah kadaluarsa");
          toast.error("Kode OTP tidak valid atau sudah kadaluarsa");
        } else if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(", ");
          setError(errorMessages as string);
          toast.error(errorMessages as string);
        } else {
          setError(data.message || "Gagal mereset password");
          toast.error(data.message || "Gagal mereset password");
        }
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 540) {
      toast.info("Harap tunggu sebelum mengirim ulang OTP");
      return;
    }

    setIsResending(true);

    // Retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`[RESEND ATTEMPT ${attempts + 1}/${maxAttempts}] Resending OTP...`);
        
        const response = await fetch("/api/password/resend-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log("✅ OTP resent successfully");
          toast.success("OTP baru telah dikirim ke email Anda!");
          setCountdown(600); // Reset countdown to 10 minutes
          setOtp(""); // Clear OTP input
          setIsResending(false);
          return; // Success, exit function
        } else if (data.timeout) {
          // Timeout error, retry
          console.warn(`⏱️ Resend timeout on attempt ${attempts + 1}`);
          attempts++;
          if (attempts < maxAttempts) {
            toast.info(`Request timeout. Mencoba lagi... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        } else {
          toast.error(data.message || "Gagal mengirim ulang OTP");
          setIsResending(false);
          return;
        }
      } catch (error) {
        console.error(`❌ Resend error on attempt ${attempts + 1}:`, error);
        attempts++;
        if (attempts < maxAttempts) {
          toast.info(`Koneksi error. Mencoba lagi... (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
    }
    
    // All attempts failed
    toast.error("Gagal mengirim ulang OTP", {
      description: "Server sedang sibuk. Coba lagi dalam beberapa menit."
    });
    setIsResending(false);
  };

  return (
    <div className="relative flex min-h-screen w-full">
      {/* Gambar Latar Belakang */}
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

      {/* Wadah Utama */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:flex-row lg:px-8">
        {/* Bagian Branding (sisi kiri pada desktop) */}
        <div className="mb-8 w-full max-w-md text-center lg:mb-0 lg:mr-12 lg:w-1/2 lg:text-left">
          <div className="mb-6 flex justify-center lg:justify-start">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/seputipy.appspot.com/o/covers%2Fundip.png?alt=media"
              alt="Logo UNDIP"
              width={116}
              height={128}
              className="h-32 w-29"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">SIGAP UNDIP</h1>
          <p className="mt-3 text-xl text-gray-200">
            Sistem Informasi Gawat dan Pelaporan
          </p>
          <p className="mt-2 text-lg italic text-gray-300">
            Satu Sistem, Tanggap Darurat
          </p>
        </div>

        {/* Formulir Forgot Password */}
        <div className="w-full max-w-md lg:w-1/2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white text-center">
                {step === "email" ? "Lupa Password?" : "Reset Password"}
              </h2>
              <p className="text-gray-300 text-center mt-1">
                {step === "email" 
                  ? "Masukkan email Anda untuk menerima kode OTP reset password"
                  : "Masukkan kode OTP dan password baru Anda"
                }
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 mx-6 mt-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Step 1: Email Input */}
            {step === "email" && (
              <form onSubmit={handleSendOTP} className="p-6 space-y-5 bg-white">
                <div className="space-y-2">
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </Label>
                  <div className="relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </span>
                    <Input
                      id="email"
                      type="email"
                      placeholder="E-mail official Undip"
                      className="pl-10 border-0 shadow-gray-400 bg-white focus:bg-white transition-all duration-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-800 text-white transition-all duration-300 transform hover:scale-105 rounded-xl py-6"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                      Mengirim OTP...
                    </>
                  ) : (
                    "Kirim Kode OTP"
                  )}
                </Button>

                <div className="flex justify-center pt-2">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                  >
                    Kembali ke Login
                  </Link>
                </div>
              </form>
            )}

            {/* Step 2: Reset Password Form */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="p-6 space-y-5 bg-white">
                {/* Countdown Timer */}
                <div className={`p-3 rounded-lg ${
                  countdown > 300 
                    ? "bg-green-50 border border-green-200" 
                    : countdown > 60
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className={`h-4 w-4 ${
                      countdown > 300 
                        ? "text-green-600" 
                        : countdown > 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`} />
                    <p className={`text-sm font-semibold ${
                      countdown > 300 
                        ? "text-green-700" 
                        : countdown > 60
                        ? "text-yellow-700"
                        : "text-red-700"
                    }`}>
                      OTP berlaku: {formatTime(countdown)}
                    </p>
                  </div>
                  {countdown === 0 && (
                    <p className="text-xs text-red-600 text-center mt-1">
                      Kode OTP telah kadaluarsa. Silakan kirim ulang.
                    </p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email-display" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </Label>
                  <div className="relative rounded-lg">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </span>
                    <Input
                      id="email-display"
                      type="email"
                      value={email}
                      readOnly
                      className="pl-10 border-0 shadow-gray-400 bg-gray-50"
                    />
                  </div>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Kode OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    disabled={isLoading}
                    className="text-center text-2xl tracking-widest font-bold border-0 shadow-gray-400"
                  />
                  <p className="text-xs text-gray-500">
                    Masukkan 6 digit kode OTP yang dikirim ke email Anda
                  </p>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password Baru
                  </Label>
                  <div className="relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </span>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="pl-10 pr-10 border-0 shadow-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password
                  </Label>
                  <div className="relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </span>
                    <Input
                      id="passwordConfirmation"
                      type={showPasswordConfirmation ? "text" : "password"}
                      placeholder="Ketik ulang password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="pl-10 pr-10 border-0 shadow-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-800 text-white transition-all duration-300 transform hover:scale-105 rounded-xl py-6"
                  size="lg"
                  disabled={isLoading || countdown === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                      Mereset Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                {/* Resend OTP Button */}
                <Button
                  type="button"
                  onClick={handleResendOtp}
                  variant="outline"
                  className="w-full"
                  disabled={isResending || countdown > 540}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim Ulang...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Kirim Ulang OTP
                      {countdown > 540 && ` (${Math.floor((countdown - 540) / 60)}:${((countdown - 540) % 60).toString().padStart(2, "0")})`}
                    </>
                  )}
                </Button>

                <div className="flex justify-center pt-2">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                  >
                    Kembali ke Login
                  </Link>
                </div>

                {/* Security Notice */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800">
                    <strong>⚠ Keamanan:</strong>
                    <br />
                    • OTP hanya valid selama 10 menit
                    <br />
                    • Jangan bagikan kode OTP kepada siapapun
                    <br />
                    • Setelah reset, Anda harus login ulang
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
