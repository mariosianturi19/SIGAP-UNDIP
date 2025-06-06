// src/components/reports/QuickActions.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Info, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/auth";

interface QuickActionsProps {
  reportId: number;
  currentStatus: string;
  onStatusUpdated: () => void;
}

export default function QuickActions({ reportId, currentStatus, onStatusUpdated }: QuickActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: string, note: string) => {
    setIsUpdating(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: note,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperbarui status");
      }

      toast.success("Status berhasil diperbarui");
      onStatusUpdated();
    } catch (error) {
      toast.error("Gagal memperbarui status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex space-x-2">
      {currentStatus === 'pending' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus('in_progress', 'Laporan sedang dalam proses penanganan')}
          disabled={isUpdating}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          {isUpdating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Info className="h-3 w-3 mr-1" />}
          Proses
        </Button>
      )}
      
      {(currentStatus === 'pending' || currentStatus === 'in_progress') && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus('resolved', 'Laporan telah diselesaikan')}
          disabled={isUpdating}
          className="border-green-200 text-green-600 hover:bg-green-50"
        >
          {isUpdating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
          Selesai
        </Button>
      )}
      
      {currentStatus !== 'rejected' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus('rejected', 'Laporan ditolak')}
          disabled={isUpdating}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          {isUpdating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />}
          Tolak
        </Button>
      )}
    </div>
  );
}