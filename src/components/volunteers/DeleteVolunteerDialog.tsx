// src/components/volunteers/DeleteVolunteerDialog.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface DeleteVolunteerDialogProps {
  volunteer: Volunteer;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export default function DeleteVolunteerDialog({
  volunteer,
  isOpen,
  onClose,
  onDelete,
}: DeleteVolunteerDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // Dapatkan token akses
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error("Autentikasi diperlukan");
      }

      // Gunakan endpoint API yang diperbarui untuk menghapus pengguna
      const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/admin/relawan/${volunteer.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menghapus relawan");
      }

      onDelete();
    } catch (error) {
      console.error("Error menghapus relawan:", error);
      setError(error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga");
      toast.error("Gagal menghapus relawan");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini akan menghapus secara permanen akun relawan untuk <strong>{volunteer.name}</strong> ({volunteer.email}).
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>Hapus</>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}