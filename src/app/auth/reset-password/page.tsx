"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, RefreshCw, Loader2, Eye, EyeOff, Clock } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email] = useState(emailFromQuery);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Check if email is provided
  useEffect(() => {
    if (!emailFromQuery) {
      toast.error("Email tidak ditemukan. Silakan mulai dari halaman lupa password.");
      router.push("/auth/forgot-password");
    }
  }, [emailFromQuery, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!email || !otp || !password || !passwordConfirmation) {
      toast.error("Semua field harus diisi");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Kode OTP harus 6 digit");
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          toast.error("Kode OTP tidak valid atau sudah kadaluarsa");
        } else if (data.errors) {
          // Handle validation errors
          const errorMessages = Object.values(data.errors).flat().join(", ");
          toast.error(errorMessages as string);
        } else {
          toast.error(data.message || "Gagal mereset password");
        }
      }
    } catch (error) {
      console.error("Reset password error:", error);
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

    try {
      const response = await fetch("/api/password/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("OTP baru telah dikirim ke email Anda!");
        setCountdown(600); // Reset countdown to 10 minutes
        setOtp(""); // Clear OTP input
      } else {
        toast.error(data.message || "Gagal mengirim ulang OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/images/Undip-Logo.png"
              alt="UNDIP Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
              Reset Password
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Masukkan kode OTP dan password baru Anda
            </CardDescription>
          </div>

          {/* Countdown Timer */}
          <div className={`p-3 rounded-lg ${
            countdown > 300 
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
              : countdown > 60
              ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}>
            <div className="flex items-center justify-center gap-2">
              <Clock className={`h-4 w-4 ${
                countdown > 300 
                  ? "text-green-600 dark:text-green-400" 
                  : countdown > 60
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`} />
              <p className={`text-sm font-semibold ${
                countdown > 300 
                  ? "text-green-700 dark:text-green-300" 
                  : countdown > 60
                  ? "text-yellow-700 dark:text-yellow-300"
                  : "text-red-700 dark:text-red-300"
              }`}>
                OTP berlaku: {formatTime(countdown)}
              </p>
            </div>
            {countdown === 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 text-center mt-1">
                Kode OTP telah kadaluarsa. Silakan kirim ulang.
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="pl-10 bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>

            {/* OTP Input */}
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium">
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
                className="text-center text-2xl tracking-widest font-bold"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Masukkan 6 digit kode OTP yang dikirim ke email Anda
              </p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password Baru
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation" className="text-sm font-medium">
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="passwordConfirmation"
                  type={showPasswordConfirmation ? "text" : "password"}
                  placeholder="Ketik ulang password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading || countdown === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Kembali ke Login
            </Link>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>⚠ Keamanan:</strong>
              <br />
              • OTP hanya valid selama 10 menit
              <br />
              • Jangan bagikan kode OTP kepada siapapun
              <br />
              • Setelah reset, Anda harus login ulang
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
