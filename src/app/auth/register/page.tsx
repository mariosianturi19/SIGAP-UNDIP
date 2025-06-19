"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, User, Mail, Lock, Hash, BookOpen, AlertCircle, Phone } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Skema validasi formulir dengan Zod
const registerFormSchema = z
  .object({
    name: z.string().min(2, "Nama harus memiliki minimal 2 karakter"),
    email: z
      .string()
      .email("Silakan masukkan alamat email yang valid")
      .refine((email) => email.endsWith("@students.undip.ac.id"), "Silakan gunakan email @students.undip.ac.id Anda"),
    nim: z
      .string()
      .min(14, "NIM harus 14 digit")
      .max(14, "NIM harus 14 digit")
      .regex(/^\d+$/, "NIM hanya boleh berisi angka"),
    jurusan: z.string().min(2, "Jurusan harus memiliki minimal 2 karakter"),
    no_telp: z
      .string()
      .min(11, "Nomor telepon harus minimal 11 digit")
      .max(12, "Nomor telepon maksimal 12 digit")
      .regex(/^\d+$/, "Nomor telepon hanya boleh berisi angka"),
    password: z
      .string()
      .min(8, "Kata sandi harus minimal 8 karakter")
      .regex(/[A-Z]/, "Kata sandi harus mengandung minimal 1 huruf kapital")
      .regex(/[a-z]/, "Kata sandi harus mengandung minimal 1 huruf kecil")
      .regex(/[0-9]/, "Kata sandi harus mengandung minimal 1 angka")
      .regex(/[^A-Za-z0-9]/, "Kata sandi harus mengandung minimal 1 simbol"),
    confirmPassword: z.string().min(8, "Kata sandi harus minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak cocok",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerFormSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [shakeError, setShakeError] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState({
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
    hasMinLength: false
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      nim: "",
      jurusan: "",
      no_telp: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          nim: data.nim,
          jurusan: data.jurusan,
          no_telp: data.no_telp,
          password: data.password,
        }),
      });

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Pendaftaran gagal")
      }

      toast.success("Akun berhasil dibuat", {
        description: "Akun Anda telah dibuat dengan sukses",
      })

      // Arahkan ke halaman login
      router.push("/auth/login")
    } catch (error) {
      console.error("Kesalahan pendaftaran:", error)

      let errorMessage = "Terjadi kesalahan yang tidak terduga"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      setError(errorMessage)

      // Picu animasi getaran pada bidang kesalahan pertama
      const fieldErrors = form.formState.errors
      if (Object.keys(fieldErrors).length > 0) {
        setShakeError(Object.keys(fieldErrors)[0])
        setTimeout(() => setShakeError(""), 500)
      }

      toast.error("Pendaftaran gagal", {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to check password strength
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
      hasMinLength: password.length >= 8
    });
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

        {/* Formulir Pendaftaran */}
        <div className="w-full max-w-md lg:w-1/2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white text-center">Buat Akun</h2>
              <p className="text-gray-300 text-center mt-1">Daftar sebagai mahasiswa</p>
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "name" ? "animate-shake" : ""} ${form.formState.errors.name ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <User size={18} />
                        </span>
                        <FormControl>
                          <Input
                            placeholder="Nama Lengkap"
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
                  name="nim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">NIM (Nomor Induk Mahasiswa)</FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "nim" ? "animate-shake" : ""} ${form.formState.errors.nim ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Hash size={18} />
                        </span>
                        <FormControl>
                          <Input
                            placeholder="21120119120001"
                            className="pl-10 border-0 shadow-gray-400 bg-white focus:bg-white transition-all duration-200"
                            {...field}
                            disabled={isLoading}
                            maxLength={14}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jurusan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">
                        Jurusan
                      </FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "jurusan" ? "animate-shake" : ""} ${form.formState.errors.jurusan ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <BookOpen size={18} />
                        </span>
                        <FormControl>
                          <Input
                            placeholder="Teknik Informatika"
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
                  name="no_telp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">
                        Nomor Telepon
                      </FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "no_telp" ? "animate-shake" : ""} ${form.formState.errors.no_telp ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Phone size={18} />
                        </span>
                        <FormControl>
                          <Input
                            placeholder="08771234567"
                            className="pl-10 border-0 shadow-gray-400 bg-white focus:bg-white transition-all duration-200"
                            {...field}
                            disabled={isLoading}
                            maxLength={12}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "email" ? "animate-shake" : ""} ${form.formState.errors.email ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Mail size={18} />
                        </span>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email.anda@students.undip.ac.id"
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
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi</FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "password" ? "animate-shake" : ""} ${form.formState.errors.password ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Lock size={18} />
                        </span>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 border-0 shadow-gray-400 bg-white focus:bg-white transition-all duration-200"
                            {...field}
                            disabled={isLoading}
                            onChange={(e) => {
                              field.onChange(e);
                              checkPasswordStrength(e.target.value);
                            }}
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
                      
                      {/* Password Strength Indicator */}
                      {field.value && (
                        <div className="mt-2 space-y-2">
                          <div className="text-xs text-gray-600 font-medium">Kekuatan kata sandi:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.hasMinLength ? '✓' : '○'} Minimal 8 karakter
                            </div>
                            <div className={`flex items-center ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.hasUppercase ? '✓' : '○'} Huruf kapital
                            </div>
                            <div className={`flex items-center ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.hasLowercase ? '✓' : '○'} Huruf kecil
                            </div>
                            <div className={`flex items-center ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.hasNumber ? '✓' : '○'} Angka
                            </div>
                            <div className={`flex items-center ${passwordStrength.hasSymbol ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.hasSymbol ? '✓' : '○'} Simbol
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi</FormLabel>
                      <div
                        className={`relative rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 ${shakeError === "confirmPassword" ? "animate-shake" : ""} ${form.formState.errors.confirmPassword ? "ring-2 ring-red-400" : ""}`}
                      >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Lock size={18} />
                        </span>
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 border-0 shadow-gray-400 bg-white focus:bg-white transition-all duration-200"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                      Membuat akun...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Daftar
                    </>
                  )}
                </Button>

                <div className="flex justify-center pt-2">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                  >
                    Sudah punya akun? Masuk
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