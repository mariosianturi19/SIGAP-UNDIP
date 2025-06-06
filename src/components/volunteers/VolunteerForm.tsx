// src/components/volunteers/VolunteerForm.tsx
"use client";

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
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

// Perbarui interface agar sesuai dengan respons API sebenarnya
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

// Perbarui skema formulir untuk menyertakan kata sandi
const volunteerFormSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter"),
  email: z.string().email("Silakan masukkan alamat email yang valid"),
  nik: z.string().min(16, "NIK harus minimal 16 digit").max(16, "NIK harus 16 digit"),
  no_telp: z.string().min(10, "Nomor telepon harus minimal 10 digit"),
  password: z.string().min(6, "Kata sandi harus minimal 6 karakter"),
  // Hanya memerlukan konfirmasi kata sandi untuk relawan baru
  confirmPassword: z.string().min(6, "Kata sandi harus minimal 6 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Kata sandi tidak cocok",
  path: ["confirmPassword"],
});

// Buat skema terpisah untuk mode edit tanpa persyaratan kata sandi
const editVolunteerFormSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter"),
  email: z.string().email("Silakan masukkan alamat email yang valid"),
  nik: z.string().min(16, "NIK harus minimal 16 digit").max(16, "NIK harus 16 digit"),
  no_telp: z.string().min(10, "Nomor telepon harus minimal 10 digit"),
});

type VolunteerFormValues = z.infer<typeof volunteerFormSchema>;
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

  // Gunakan resolver yang berbeda berdasarkan mode
  const formSchema = mode === "create" ? volunteerFormSchema : editVolunteerFormSchema;

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: volunteer?.name || "",
      email: volunteer?.email || "",
      nik: volunteer?.nik || "",
      no_telp: volunteer?.no_telp || "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Dapatkan token akses
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error("Autentikasi diperlukan");
      }

      // Tambahkan bidang peran untuk relawan baru
      const formData = {
        ...data,
        role: "relawan" // Selalu tetapkan peran ini
      };

      // Hapus confirmPassword karena API tidak memerlukannya
      if (formData.confirmPassword) {
        delete formData.confirmPassword;
      }

      let response;
      
      if (mode === "create") {
        response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/admin/relawan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Untuk mode edit, kita mungkin tidak ingin mengirim kata sandi jika kosong
        if (!formData.password) {
          delete formData.password;
        }
        
        response = await fetch(`/api/volunteers/${volunteer?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menyimpan relawan");
      }

      onSave();
    } catch (error) {
      console.error("Error menyimpan relawan:", error);
      setError(error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Relawan Baru" : "Edit Relawan"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 mx-6 mt-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama Lengkap" {...field} />
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
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@contoh.com"
                      {...field}
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
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-1">NIK (Nomor Induk Kependudukan)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1234567890123456" 
                      maxLength={16}
                      {...field} 
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
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="08123456789" {...field} />
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
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            {...field} 
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            {...field} 
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
              </>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>Simpan</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}