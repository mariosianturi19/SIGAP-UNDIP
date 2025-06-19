// src/components/volunteers/VolunteerForm.tsx
"use client";

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Loader2, Eye, EyeOff, User, Mail, Hash, Phone, Lock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getAccessToken } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

// Interface untuk volunteer sesuai dengan API response
interface Volunteer {
  id: number;
  name: string;
  email: string;
  role: string;
  nik: string;
  no_telp: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface VolunteerFormProps {
  mode: "create" | "edit";
  volunteer: Volunteer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

// Skema validasi untuk create volunteer
const createVolunteerFormSchema = z.object({
  name: z.string()
    .min(2, "Nama harus minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string()
    .email("Silakan masukkan alamat email yang valid")
    .min(1, "Email harus diisi"),
  nik: z.string()
    .min(16, "NIK harus 16 digit")
    .max(16, "NIK harus 16 digit")
    .regex(/^\d{16}$/, "NIK harus berisi 16 digit angka"),
  no_telp: z.string()
    .min(10, "Nomor telepon harus minimal 10 digit")
    .max(15, "Nomor telepon maksimal 15 digit")
    .regex(/^\d+$/, "Nomor telepon hanya boleh berisi angka"),
  password: z.string()
    .min(6, "Kata sandi harus minimal 6 karakter")
    .max(50, "Kata sandi maksimal 50 karakter"),
  confirmPassword: z.string()
    .min(6, "Konfirmasi kata sandi harus minimal 6 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Kata sandi tidak cocok",
  path: ["confirmPassword"],
});

// Skema validasi untuk edit volunteer (tanpa password)
const editVolunteerFormSchema = z.object({
  name: z.string()
    .min(2, "Nama harus minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string()
    .email("Silakan masukkan alamat email yang valid")
    .min(1, "Email harus diisi"),
  nik: z.string()
    .min(16, "NIK harus 16 digit")
    .max(16, "NIK harus 16 digit")
    .regex(/^\d{16}$/, "NIK harus berisi 16 digit angka"),
  no_telp: z.string()
    .min(10, "Nomor telepon harus minimal 10 digit")
    .max(15, "Nomor telepon maksimal 15 digit")
    .regex(/^\d+$/, "Nomor telepon hanya boleh berisi angka"),
});

type CreateVolunteerFormValues = z.infer<typeof createVolunteerFormSchema>;
type EditVolunteerFormValues = z.infer<typeof editVolunteerFormSchema>;

export default function VolunteerForm({
  mode,
  volunteer,
  isOpen,
  onClose,
  onSave,
}: VolunteerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Use appropriate schema based on mode
  const formSchema = mode === "create" ? createVolunteerFormSchema : editVolunteerFormSchema;

  const form = useForm<CreateVolunteerFormValues | EditVolunteerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: volunteer?.name || "",
      email: volunteer?.email || "",
      nik: volunteer?.nik || "",
      no_telp: volunteer?.no_telp || "",
      ...(mode === "create" && {
        password: "",
        confirmPassword: "",
      }),
    },
  });

  const onSubmit = async (data: CreateVolunteerFormValues | EditVolunteerFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get access token
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error("Autentikasi diperlukan");
      }

      let response;
      
      if (mode === "create") {
        const createData = data as CreateVolunteerFormValues;
        // Create API data object without confirmPassword
        const apiData = {
          name: createData.name,
          email: createData.email,
          nik: createData.nik,
          no_telp: createData.no_telp,
          password: createData.password
        };
        
        console.log("Submitting volunteer data:", { ...apiData, password: "[HIDDEN]" });
        
        response = await fetch("/api/volunteer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
        });
      } else {
        // For edit mode
        response = await fetch(`/api/volunteer/${volunteer?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
      }

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        
        // Handle specific error messages
        if (response.status === 422) {
          throw new Error(errorData.message || "Data tidak valid. Periksa kembali input Anda.");
        } else if (response.status === 409) {
          throw new Error("Email atau NIK sudah terdaftar dalam sistem.");
        } else if (response.status === 401) {
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        } else if (response.status === 404) {
          throw new Error("Endpoint API tidak ditemukan. Hubungi administrator.");
        } else {
          throw new Error(errorData.message || `Gagal menyimpan relawan (Error ${response.status})`);
        }
      }

      const result = await response.json();
      console.log("Success response:", result);

      // Show success message
      toast.success(
        mode === "create" 
          ? "Relawan berhasil ditambahkan" 
          : "Data relawan berhasil diperbarui",
        {
          description: mode === "create" 
            ? `${data.name} telah ditambahkan sebagai relawan`
            : `Data ${data.name} telah diperbarui`,
          style: {
            background: 'rgb(34, 197, 94)',
            color: 'white',
            border: '1px solid rgb(22, 163, 74)',
          },
          className: 'dark:bg-green-600 dark:text-white dark:border-green-500'
        }
      );

      // Call onSave callback
      onSave();
      
      // Close dialog
      onClose();
      
    } catch (error) {
      console.error("Error menyimpan relawan:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga";
      setError(errorMessage);
      
      toast.error("Gagal menyimpan relawan", {
        description: errorMessage,
        style: {
          background: 'rgb(239, 68, 68)',
          color: 'white',
          border: '1px solid rgb(220, 38, 38)',
        },
        className: 'dark:bg-red-600 dark:text-white dark:border-red-500'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            {mode === "create" ? "Tambah Relawan Baru" : "Edit Relawan"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Nama Lengkap
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Masukkan nama lengkap" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contoh@email.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Hash className="h-4 w-4 mr-2" />
                    NIK (Nomor Induk Kependudukan)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1234567890123456" 
                      maxLength={16}
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="no_telp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Nomor Telepon
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="08123456789" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "create" && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Kata Sandi
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Minimal 6 karakter" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Konfirmasi Kata Sandi
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Ulangi kata sandi" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 transition-colors"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isSubmitting}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="mt-6 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    {mode === "create" ? "Tambah Relawan" : "Simpan Perubahan"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}