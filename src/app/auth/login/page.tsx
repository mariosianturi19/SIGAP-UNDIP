// src/app/auth/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Shield, Mail, Lock, LogIn, AlertCircle, InfoIcon } from 'lucide-react'
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Form schema validation dengan Zod
const loginFormSchema = z.object({
  email: z.string().email("Silakan masukkan alamat email yang valid"),
  password: z.string().min(1, "Kata sandi diperlukan"),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [shakeError, setShakeError] = useState("")
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal masuk");
    }

    // Save tokens
    localStorage.setItem("access_token", result.access_token);
    localStorage.setItem("refresh_token", result.refresh_token);
    
    const expiresAt = Date.now() + result.expires_in * 1000;
    localStorage.setItem("expires_at", expiresAt.toString());

    if (result.user) {
      if (result.user.role) {
        localStorage.setItem("user_role", result.user.role);
      }
      localStorage.setItem("user_data", JSON.stringify(result.user));
    }

    const userName = result.user?.name || "Pengguna";
    toast.success(`Selamat datang kembali, ${userName}!`, {
      description: "Anda telah berhasil masuk",
    });

    // Redirect based on role
    const userRole = result.user?.role || "";
    if (userRole === "user") {
      router.push("/student/emergency");
    } else if (userRole === "volunteer" || userRole === "relawan") {
      router.push("/volunteer/dashboard");
    } else if (userRole === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/auth/login");
    }
  } catch (error) {
    console.error("Login error:", error);
    setError(error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga");
    toast.error("Gagal masuk", {
      description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga",
    });
  } finally {
    setIsLoading(false);
  }
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
              <img
                src="https://firebasestorage.googleapis.com/v0/b/seputipy.appspot.com/o/covers%2Fundip.png?alt=media"
                alt="Logo UNDIP"
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

        {/* Formulir Login */}
        <div className="w-full max-w-md lg:w-1/2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white text-center">Silahkan Masuk</h2>
              <p className="text-gray-300 text-center mt-1">Masuk untuk mengakses SIGAP UNDIP</p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 mx-6 mt-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Email</FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "email" ? "animate-shake" : ""} ${form.formState.errors.email ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Mail size={18} />
                        </span>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="E-mail official Undip"
                            className="pl-10 border-0 shadow-gray-400 bg-white focus:bg-white transition-all duration-200"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Password</FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "password" ? "animate-shake" : ""} ${form.formState.errors.password ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Lock size={18} />
                        </span>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 border-0 shadow-gray-400 bg-white focus:bg-white transition-all duration-200"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-800 transition-all duration-300 transform hover:scale-105 rounded-xl py-6"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sedang Masuk...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Masuk
                    </>
                  )}
                </Button>
                
                {/* Notes baru di bawah tombol masuk dengan style lebih mirip gambar */}
                <div className="bg-blue-50 border-l-4 border-blue-500 py-2 px-4 rounded-md mt-0.5">
                  <div className="flex items-center">
                    <InfoIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Jika belum pernah menggunakan SIGAP UNDIP, silakan daftar terlebih dahulu
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <Link
                    href="/auth/register"
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                  >
                    Belum punya akun? Daftar
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}