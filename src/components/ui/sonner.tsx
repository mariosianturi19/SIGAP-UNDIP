"use client"

import type React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps, toast as sonnerToast } from "sonner"
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      closeButton
      richColors
      expand={true}
      visibleToasts={4}
      offset={16}
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: `
            group toast min-h-[70px] w-full max-w-md rounded-2xl border-0 
            bg-white/98 backdrop-blur-lg shadow-2xl
            dark:bg-gray-900/98 dark:backdrop-blur-lg
            p-5 flex items-start gap-4 relative overflow-hidden
            transition-all duration-300 ease-out transform-gpu
            hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1
            data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]
            data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none
            data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=open]:duration-400
            data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:duration-200
            ring-1 ring-black/5 dark:ring-white/10
          `,
          title: `
            text-gray-900 dark:text-gray-50 font-bold text-base leading-tight tracking-tight
            group-data-[type=error]:text-red-900 dark:group-data-[type=error]:text-red-50
            group-data-[type=success]:text-emerald-900 dark:group-data-[type=success]:text-emerald-50
            group-data-[type=warning]:text-amber-900 dark:group-data-[type=warning]:text-amber-50
            group-data-[type=info]:text-blue-900 dark:group-data-[type=info]:text-blue-50
            group-data-[type=loading]:text-blue-900 dark:group-data-[type=loading]:text-blue-50
          `,
          description: `
            text-gray-800 dark:text-gray-100 text-sm mt-1.5 leading-relaxed font-semibold
            group-data-[type=error]:text-red-800 dark:group-data-[type=error]:text-red-100
            group-data-[type=success]:text-emerald-800 dark:group-data-[type=success]:text-emerald-100
            group-data-[type=warning]:text-amber-800 dark:group-data-[type=warning]:text-amber-100
            group-data-[type=info]:text-blue-800 dark:group-data-[type=info]:text-blue-100
            group-data-[type=loading]:text-blue-800 dark:group-data-[type=loading]:text-blue-100
          `,
          closeButton: `
            right-3 top-3 !absolute rounded-lg p-2 text-gray-500 
            hover:text-gray-700 hover:bg-gray-100/80 
            dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/80
            transition-all duration-200 h-7 w-7 flex items-center justify-center
            focus:outline-none focus:ring-2 focus:ring-gray-400/50
          `,
          actionButton: `
            px-4 py-2 rounded-lg text-xs font-bold 
            bg-gray-900 text-white hover:bg-gray-800 
            dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200
            transition-all duration-200 border border-gray-800 shadow-md
            focus:outline-none focus:ring-2 focus:ring-gray-400/50
            hover:shadow-lg hover:-translate-y-0.5
          `,
          cancelButton: `
            px-4 py-2 rounded-lg text-xs font-bold 
            bg-gray-200 text-gray-900 hover:bg-gray-300 
            dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600
            transition-all duration-200 border border-gray-300 shadow-md
            focus:outline-none focus:ring-2 focus:ring-gray-400/50
            hover:shadow-lg hover:-translate-y-0.5
          `,
          success: `
            !border-l-4 !border-l-emerald-500 !bg-gradient-to-r !from-emerald-50/98 !to-white/98
            dark:!from-emerald-950/95 dark:!to-gray-900/98
            before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br 
            before:from-emerald-100/50 before:via-emerald-50/30 before:to-transparent before:pointer-events-none
            after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-1
            after:bg-gradient-to-r after:from-emerald-400 after:to-emerald-600 after:rounded-t-2xl
          `,
          error: `
            !border-l-4 !border-l-red-500 !bg-gradient-to-r !from-red-50/98 !to-white/98
            dark:!from-red-950/95 dark:!to-gray-900/98
            before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br 
            before:from-red-100/50 before:via-red-50/30 before:to-transparent before:pointer-events-none
            after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-1
            after:bg-gradient-to-r after:from-red-400 after:to-red-600 after:rounded-t-2xl
          `,
          warning: `
            !border-l-4 !border-l-amber-500 !bg-gradient-to-r !from-amber-50/98 !to-white/98
            dark:!from-amber-950/95 dark:!to-gray-900/98
            before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br 
            before:from-amber-100/50 before:via-amber-50/30 before:to-transparent before:pointer-events-none
            after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-1
            after:bg-gradient-to-r after:from-amber-400 after:to-amber-600 after:rounded-t-2xl
          `,
          info: `
            !border-l-4 !border-l-blue-500 !bg-gradient-to-r !from-blue-50/98 !to-white/98
            dark:!from-blue-950/95 dark:!to-gray-900/98
            before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br 
            before:from-blue-100/50 before:via-blue-50/30 before:to-transparent before:pointer-events-none
            after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-1
            after:bg-gradient-to-r after:from-blue-400 after:to-blue-600 after:rounded-t-2xl
          `,
          loading: `
            !border-l-4 !border-l-blue-500 !bg-gradient-to-r !from-blue-50/98 !to-white/98
            dark:!from-blue-950/95 dark:!to-gray-900/98
            before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br 
            before:from-blue-100/50 before:via-blue-50/30 before:to-transparent before:pointer-events-none
            after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-1
            after:bg-gradient-to-r after:from-blue-400 after:to-blue-600 after:rounded-t-2xl
            after:animate-pulse
          `,
        },
      }}
      {...props}
    />
  )
}

interface ToastOptions {
  duration?: number;
  icon?: React.ReactNode;
  className?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
}

// Enhanced toast functions with better icons and styling
const toast = {
  ...sonnerToast,
  
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: 4500,
      icon: <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 drop-shadow-sm" />,
      className: "toast-success",
      ...options,
    })
  },
  
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: 6000,
      icon: <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 drop-shadow-sm" />,
      className: "toast-error",
      ...options,
    })
  },
  
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: 5000,
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 drop-shadow-sm" />,
      className: "toast-warning",
      ...options,
    })
  },
  
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: 4500,
      icon: <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 drop-shadow-sm" />,
      className: "toast-info",
      ...options,
    })
  },
  
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      duration: Infinity,
      icon: <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 animate-spin drop-shadow-sm" />,
      className: "toast-loading",
      ...options,
    })
  },

  // Enhanced promise toast with better state management
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string
      success: (data: T) => string
      error: (err: Error) => string
      description?: string
      loadingDescription?: string
      successDescription?: string
      errorDescription?: string
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: (
        <div className="flex flex-col">
          <span className="font-bold">{options.loading}</span>
          {(options.loadingDescription || options.description) && (
            <span className="text-sm mt-1.5">{options.loadingDescription || options.description}</span>
          )}
        </div>
      ),
      success: (data) => (
        <div className="flex flex-col">
          <span className="font-bold">{options.success(data)}</span>
          {(options.successDescription || options.description) && (
            <span className="text-sm mt-1.5">{options.successDescription || options.description}</span>
          )}
        </div>
      ),
      error: (err) => (
        <div className="flex flex-col">
          <span className="font-bold">{options.error(err)}</span>
          {(options.errorDescription || options.description) && (
            <span className="text-sm mt-1.5">{options.errorDescription || options.description}</span>
          )}
        </div>
      ),
      duration: 4500
    })
  },

  // Enhanced action toast with better styling
  action: (message: string, options: {
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
    cancel?: {
      label: string
      onClick?: () => void
    }
    type?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }) => {
    const iconMap = {
      success: <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 drop-shadow-sm" />,
      error: <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 drop-shadow-sm" />,
      warning: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 drop-shadow-sm" />,
      info: <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 drop-shadow-sm" />,
    }

    return sonnerToast(message, {
      description: options.description,
      duration: options.duration || 5500,
      icon: iconMap[options.type || 'info'],
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      cancel: options.cancel
        ? {
            label: options.cancel.label,
            onClick: () => {
              if (options.cancel?.onClick) {
                options.cancel.onClick();
              }
            },
          }
        : undefined,
      className: `toast-${options.type || 'info'}`,
    })
  },

  // Custom toast for different use cases
  custom: (message: string, options: {
    description?: string
    icon?: React.ReactNode
    duration?: number
    className?: string
    style?: React.CSSProperties
    action?: {
      label: string
      onClick: () => void
    }
  }) => {
    return sonnerToast(message, {
      description: options.description,
      duration: options.duration || 4500,
      icon: options.icon || <Info className="h-6 w-6 text-gray-600 dark:text-gray-400 flex-shrink-0 drop-shadow-sm" />,
      className: options.className,
      style: options.style,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  // Persistent toast that doesn't auto-dismiss
  persistent: (message: string, options: {
    description?: string
    type?: 'success' | 'error' | 'warning' | 'info'
    action?: {
      label: string
      onClick: () => void
    }
    cancel?: {
      label: string
      onClick?: () => void
    }
  }) => {
    const iconMap = {
      success: <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 drop-shadow-sm" />,
      error: <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 drop-shadow-sm" />,
      warning: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 drop-shadow-sm" />,
      info: <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 drop-shadow-sm" />,
    }

    return sonnerToast(message, {
      description: options.description,
      duration: Infinity,
      icon: iconMap[options.type || 'info'],
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      cancel: options.cancel
        ? {
            label: options.cancel.label,
            onClick: () => {
              if (options.cancel?.onClick) {
                options.cancel.onClick();
              }
            },
          }
        : {
            label: "Tutup",
            onClick: () => {},
          },
      className: `toast-${options.type || 'info'}`,
    })
  },

  // Quick notification variants
  quick: {
    saved: (item?: string) => toast.success("Berhasil disimpan", {
      description: item ? `${item} telah disimpan` : "Data berhasil disimpan"
    }),
    
    deleted: (item?: string) => toast.success("Berhasil dihapus", {
      description: item ? `${item} telah dihapus` : "Data berhasil dihapus"
    }),
    
    updated: (item?: string) => toast.success("Berhasil diperbarui", {
      description: item ? `${item} telah diperbarui` : "Data berhasil diperbarui"
    }),
    
    copied: () => toast.success("Disalin", {
      description: "Teks berhasil disalin ke clipboard"
    }),
    
    networkError: () => toast.error("Koneksi bermasalah", {
      description: "Periksa koneksi internet Anda dan coba lagi"
    }),
    
    unauthorized: () => toast.error("Akses ditolak", {
      description: "Anda tidak memiliki izin untuk melakukan tindakan ini"
    }),
    
    sessionExpired: () => toast.warning("Sesi berakhir", {
      description: "Silakan masuk kembali untuk melanjutkan"
    }),
    
    comingSoon: () => toast.info("Segera hadir", {
      description: "Fitur ini akan tersedia dalam pembaruan mendatang"
    })
  }
}

export { Toaster, toast }