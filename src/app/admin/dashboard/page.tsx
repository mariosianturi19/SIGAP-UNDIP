"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { getUserRole, getAccessToken, getUserData } from "@/lib/auth"
import {
  Loader2,
  Users,
  FileText,
  AlertTriangle,
  Clock,
  Shield,
  UserPlus,
  UserMinus,
  CheckCircle,
  TrendingUp,
  Activity,
  RefreshCw,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { motion } from "framer-motion"

// Interface untuk relawan
interface Volunteer {
  id: number
  name: string
  email: string
  role: string
  nik: string
  no_telp: string
  created_at: string
}

// Interface untuk laporan
interface Report {
  id: number
  user: {
    id: number
    name: string
    email: string
    nim?: string
  }
  photo_url: string
  location: string
  problem_type: string
  description: string
  status: string
  created_at: string
}

// Interface untuk panic alert
interface PanicAlert {
  id: number
  user: {
    id: number
    name: string
    email: string
  }
  latitude: number
  longitude: number
  status: string
  created_at: string
}

// Interface untuk aktivitas
interface ActivityType {
  id: string
  type: "volunteer_add" | "volunteer_remove" | "report_new" | "report_resolved" | "panic_new" | "panic_handled"
  title: string
  description: string
  user?: string
  timestamp: string
  metadata?: {
    reportId?: number
    volunteerId?: number
    panicId?: number
    status?: string
  }
}

// Interface untuk stats
interface DashboardStats {
  totalVolunteers: number
  totalReports: number
  totalPanicAlerts: number
  pendingReports: number
  resolvedReports: number
  activePanics: number
  volunteersThisMonth: number
  reportsThisMonth: number
}

// Interface untuk data dashboard
interface DashboardData {
  stats: DashboardStats
  recentActivities: ActivityType[]
  volunteers: Volunteer[]
  reports: Report[]
  panicAlerts: PanicAlert[]
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalVolunteers: 0,
      totalReports: 0,
      totalPanicAlerts: 0,
      pendingReports: 0,
      resolvedReports: 0,
      activePanics: 0,
      volunteersThisMonth: 0,
      reportsThisMonth: 0,
    },
    recentActivities: [],
    volunteers: [],
    reports: [],
    panicAlerts: [],
  })

  // Previous data untuk comparison
  const previousDataRef = useRef<DashboardData | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()

  const checkForNewActivities = useCallback(
    (previousData: DashboardData, newData: DashboardData, isAutoRefresh: boolean) => {
      // FIXED: Only check for truly new items, not just missing from previous comparison

      // Check for new reports - compare by ID only, not by activity generation
      const newReports = newData.reports.filter(
        (newReport) => !previousData.reports.some((oldReport) => oldReport.id === newReport.id),
      )

      // Check for new panic alerts - compare by ID only
      const newPanics = newData.panicAlerts.filter(
        (newPanic) => !previousData.panicAlerts.some((oldPanic) => oldPanic.id === newPanic.id),
      )

      // Check for status changes in reports (resolved reports)
      const resolvedReports = newData.reports.filter(
        (newReport) =>
          newReport.status === "resolved" &&
          previousData.reports.some((oldReport) => oldReport.id === newReport.id && oldReport.status !== "resolved"),
      )

      // Check for status changes in panic alerts (handled alerts)
      const handledPanics = newData.panicAlerts.filter(
        (newPanic) =>
          newPanic.status === "handled" &&
          previousData.panicAlerts.some((oldPanic) => oldPanic.id === newPanic.id && oldPanic.status !== "handled"),
      )

      // Show notifications only for truly new or changed items
      if (newReports.length > 0) {
        const refreshType = isAutoRefresh ? "Auto-refresh" : "Manual refresh"
        toast.success(`${newReports.length} Laporan Baru Masuk!`, {
          description: `${refreshType}: ${newReports.length} laporan baru memerlukan perhatian Anda`,
          duration: 5000,
          style: {
            background: "rgb(34, 197, 94)",
            color: "white",
            border: "1px solid rgb(22, 163, 74)",
          },
          className: "dark:bg-green-600 dark:text-white dark:border-green-500",
          action: {
            label: "Lihat",
            onClick: () => router.push("/admin/reports"),
          },
        })
      }

      if (newPanics.length > 0) {
        const refreshType = isAutoRefresh ? "Auto-refresh" : "Manual refresh"
        toast.error(`${newPanics.length} Panic Alert Baru!`, {
          description: `${refreshType}: ${newPanics.length} panic alert darurat memerlukan respon segera`,
          duration: 7000,
          style: {
            background: "rgb(239, 68, 68)",
            color: "white",
            border: "1px solid rgb(220, 38, 38)",
          },
          className: "dark:bg-red-600 dark:text-white dark:border-red-500",
          action: {
            label: "Lihat",
            onClick: () => router.push("/admin/panic-reports"),
          },
        })
      }

      // Optional: notify for resolved reports
      if (resolvedReports.length > 0 && isAutoRefresh) {
        toast.info(`${resolvedReports.length} Laporan Diselesaikan`, {
          description: `${resolvedReports.length} laporan telah berhasil diselesaikan`,
          duration: 4000,
          style: {
            background: "rgb(34, 197, 94)",
            color: "white",
            border: "1px solid rgb(22, 163, 74)",
          },
          className: "dark:bg-green-600 dark:text-white dark:border-green-500",
        })
      }

      // Check for new volunteers (less frequent notification)
      const newVolunteers = newData.volunteers.filter(
        (newVolunteer) => !previousData.volunteers.some((oldVolunteer) => oldVolunteer.id === newVolunteer.id),
      )

      if (newVolunteers.length > 0) {
        const refreshType = isAutoRefresh ? "Auto-refresh" : "Manual refresh"
        toast.info(`${newVolunteers.length} Relawan Baru Bergabung`, {
          description: `${refreshType}: ${newVolunteers.length} relawan baru telah bergabung ke sistem`,
          duration: 4000,
          style: {
            background: "rgb(59, 130, 246)",
            color: "white",
            border: "1px solid rgb(37, 99, 235)",
          },
          className: "dark:bg-blue-600 dark:text-white dark:border-blue-500",
          action: {
            label: "Lihat",
            onClick: () => router.push("/admin/volunteers"),
          },
        })
      }

      // FIXED: Only show "no new data" message for manual refresh, not auto refresh
      if (
        !isAutoRefresh &&
        newReports.length === 0 &&
        newPanics.length === 0 &&
        newVolunteers.length === 0 &&
        resolvedReports.length === 0 &&
        handledPanics.length === 0
      ) {
        toast.info("Data Sudah Terbaru", {
          description: "Tidak ada laporan, panic alert, atau relawan baru saat ini",
          duration: 3000,
          style: {
            background: "rgb(75, 85, 99)",
            color: "white",
            border: "1px solid rgb(55, 65, 81)",
          },
          className: "dark:bg-gray-600 dark:text-white dark:border-gray-500",
        })
      }
    },
    [router],
  )

  // Memoize fetchDashboardData to fix useEffect dependency warning
  const fetchDashboardData = useCallback(async (silentRefresh = false) => {
    try {
      if (!silentRefresh) {
        setIsRefreshing(true)
      }

      const token = await getAccessToken()
      if (!token) {
        throw new Error("Autentikasi diperlukan")
      }

      // Initialize new data
      const newData: DashboardData = {
        stats: {
          totalVolunteers: 0,
          totalReports: 0,
          totalPanicAlerts: 0,
          pendingReports: 0,
          resolvedReports: 0,
          activePanics: 0,
          volunteersThisMonth: 0,
          reportsThisMonth: 0,
        },
        recentActivities: [],
        volunteers: [],
        reports: [],
        panicAlerts: [],
      }

      // Fetch semua data secara parallel
      const fetchPromises = []

      // Fetch Volunteers - FIXED: Better error handling and data extraction
      fetchPromises.push(
        fetch("/api/volunteer", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then(async (response) => {
            if (response.ok) {
              const responseText = await response.text()
              console.log("Volunteers API response:", responseText)

              try {
                const volunteerData = JSON.parse(responseText)
                let volunteers: Volunteer[] = []

                // Handle different response structures
                if (Array.isArray(volunteerData)) {
                  volunteers = volunteerData
                } else if (volunteerData.data && Array.isArray(volunteerData.data)) {
                  volunteers = volunteerData.data
                } else if (volunteerData.relawan && Array.isArray(volunteerData.relawan)) {
                  volunteers = volunteerData.relawan
                } else if (volunteerData.volunteers && Array.isArray(volunteerData.volunteers)) {
                  volunteers = volunteerData.volunteers
                }

                // Filter only volunteers (role = volunteer or relawan)
                volunteers = volunteers.filter(
                  (user: Volunteer) => user.role === "volunteer" || user.role === "relawan",
                )

                newData.volunteers = volunteers
                newData.stats.totalVolunteers = volunteers.length

                // Hitung relawan bulan ini
                const thisMonth = new Date()
                thisMonth.setDate(1)
                newData.stats.volunteersThisMonth = volunteers.filter(
                  (volunteer: Volunteer) => new Date(volunteer.created_at) >= thisMonth,
                ).length

                console.log(`Found ${volunteers.length} volunteers, ${newData.stats.volunteersThisMonth} this month`)
              } catch (parseError) {
                console.error("Failed to parse volunteers response:", parseError)
              }
            } else {
              console.log("Volunteers API failed with status:", response.status)
            }
          })
          .catch((error) => {
            console.log("Volunteers API error:", error)
            // Don't use dummy data - leave as 0
          }),
      )

      // Fetch Reports - FIXED: Better error handling and data extraction
      fetchPromises.push(
        fetch("/api/reports", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then(async (response) => {
            if (response.ok) {
              const responseText = await response.text()
              console.log("Reports API response:", responseText)

              try {
                const reportData = JSON.parse(responseText)
                let reports: Report[] = []

                // Handle different response structures
                if (Array.isArray(reportData)) {
                  reports = reportData
                } else if (reportData.data && Array.isArray(reportData.data)) {
                  reports = reportData.data
                } else if (reportData.reports && Array.isArray(reportData.reports)) {
                  reports = reportData.reports
                }

                newData.reports = reports
                newData.stats.totalReports = reports.length

                // Hitung berdasarkan status
                newData.stats.pendingReports = reports.filter((report: Report) => report.status === "pending").length

                newData.stats.resolvedReports = reports.filter((report: Report) => report.status === "resolved").length

                // Hitung laporan bulan ini
                const thisMonth = new Date()
                thisMonth.setDate(1)
                newData.stats.reportsThisMonth = reports.filter(
                  (report: Report) => new Date(report.created_at) >= thisMonth,
                ).length

                console.log(
                  `Found ${reports.length} reports, ${newData.stats.pendingReports} pending, ${newData.stats.resolvedReports} resolved`,
                )
              } catch (parseError) {
                console.error("Failed to parse reports response:", parseError)
              }
            } else {
              console.log("Reports API failed with status:", response.status)
            }
          })
          .catch((error) => {
            console.log("Reports API error:", error)
            // Don't use dummy data - leave as 0
          }),
      )

      // Fetch Panic Alerts - FIXED: Better error handling and data extraction
      fetchPromises.push(
        fetch("/api/panic", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then(async (response) => {
            if (response.ok) {
              const responseText = await response.text()
              console.log("Panic API response:", responseText)

              try {
                const panicData = JSON.parse(responseText)
                let alerts: PanicAlert[] = []

                // Handle different response structures
                if (Array.isArray(panicData)) {
                  alerts = panicData
                } else if (panicData.data && Array.isArray(panicData.data)) {
                  alerts = panicData.data
                } else if (panicData.panic && Array.isArray(panicData.panic)) {
                  alerts = panicData.panic
                } else if (panicData.panic_alerts && Array.isArray(panicData.panic_alerts)) {
                  alerts = panicData.panic_alerts
                }

                newData.panicAlerts = alerts
                newData.stats.totalPanicAlerts = alerts.length

                // Hitung panic alert yang masih aktif (pending/active/handling)
                newData.stats.activePanics = alerts.filter(
                  (alert: PanicAlert) =>
                    alert.status === "pending" || alert.status === "active" || alert.status === "handling",
                ).length

                console.log(`Found ${alerts.length} panic alerts, ${newData.stats.activePanics} active`)
              } catch (parseError) {
                console.error("Failed to parse panic response:", parseError)
              }
            } else {
              console.log("Panic API failed with status:", response.status)
            }
          })
          .catch((error) => {
            console.log("Panic API error:", error)
            // Don't use dummy data - leave as 0
          }),
      )

      // Tunggu semua request selesai
      await Promise.allSettled(fetchPromises)

      // Generate recent activities berdasarkan data yang diperoleh
      newData.recentActivities = generateRecentActivitiesFromData(newData)

      // Check for new activities dan tampilkan notifikasi
      if (previousDataRef.current) {
        checkForNewActivities(previousDataRef.current, newData, silentRefresh)
      }

      // Update state
      setDashboardData(newData)
      previousDataRef.current = newData
      setLastRefresh(new Date())

      if (!silentRefresh) {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error mengambil data:", error)
      if (!silentRefresh) {
        toast.error("Gagal memuat data dashboard", {
          style: {
            background: "rgb(239, 68, 68)",
            color: "white",
            border: "1px solid rgb(220, 38, 38)",
          },
          className: "dark:bg-red-600 dark:text-white dark:border-red-500",
        })
        setIsLoading(false)
      }
    } finally {
      if (!silentRefresh) {
        setIsRefreshing(false)
      }
    }
  }, [checkForNewActivities])

  useEffect(() => {
    setIsClient(true)
    const userRole = getUserRole()
    const userData = getUserData()

    if (userRole === "user") {
      router.push("/student/emergency")
      return
    }

    if (userData && !sessionStorage.getItem("welcome_toast_shown")) {
      toast.success(`Selamat datang, ${userData.name}!`, {
        description: "Selamat bekerja di dashboard admin",
        duration: 5000,
        style: {
          background: "rgb(34, 197, 94)",
          color: "white",
          border: "1px solid rgb(22, 163, 74)",
        },
        className: "dark:bg-green-600 dark:text-white dark:border-green-500",
      })
      sessionStorage.setItem("welcome_toast_shown", "true")
    }

    // Initial data fetch
    fetchDashboardData(false)

    // Setup auto-refresh yang berjalan terus tanpa tergantung tab visibility
    refreshIntervalRef.current = setInterval(() => {
      console.log("🔄 Admin auto-refresh triggered (30s interval)")
      fetchDashboardData(true)
    }, 30000) // 30 detik untuk admin

    setLastRefresh(new Date())

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
        console.log("🔄 Admin auto-refresh cleaned up")
      }
    }
  }, [router, fetchDashboardData])

  // Generate recent activities berdasarkan data real - FIXED: use stable IDs
  const generateRecentActivitiesFromData = (data: DashboardData): ActivityType[] => {
    const activities: ActivityType[] = []

    // Ambil 2 relawan terbaru - FIXED: use stable ID
    const recentVolunteers = data.volunteers
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)

    recentVolunteers.forEach((volunteer) => {
      activities.push({
        id: `volunteer_${volunteer.id}`, // FIXED: remove Date.now() for stable ID
        type: "volunteer_add",
        title: "Relawan Baru Bergabung",
        description: `${volunteer.name} telah bergabung sebagai relawan`,
        user: volunteer.name,
        timestamp: volunteer.created_at,
        metadata: { volunteerId: volunteer.id },
      })
    })

    // Ambil 2 laporan terbaru - FIXED: use stable ID
    const recentReports = data.reports
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)

    recentReports.forEach((report) => {
      const activityType = report.status === "resolved" ? "report_resolved" : "report_new"
      const title = report.status === "resolved" ? "Laporan Diselesaikan" : "Laporan Baru Masuk"
      const description =
        report.status === "resolved"
          ? `Laporan ${report.problem_type} telah diselesaikan`
          : `Laporan ${report.problem_type} di ${report.location}`

      activities.push({
        id: `report_${report.id}_${report.status}`, // FIXED: use report ID + status for stable ID
        type: activityType,
        title: title,
        description: description,
        user: report.user.name,
        timestamp: report.created_at,
        metadata: { reportId: report.id, status: report.status },
      })
    })

    // Ambil 1 panic alert terbaru - FIXED: use stable ID
    const recentPanic = data.panicAlerts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 1)

    recentPanic.forEach((panic) => {
      const activityType = panic.status === "handled" ? "panic_handled" : "panic_new"
      const title = panic.status === "handled" ? "Panic Alert Ditangani" : "Panic Alert Baru"
      const description =
        panic.status === "handled"
          ? "Alert darurat telah ditangani oleh tim keamanan"
          : `Alert darurat dari koordinat ${panic.latitude.toFixed(4)}, ${panic.longitude.toFixed(4)}`

      activities.push({
        id: `panic_${panic.id}_${panic.status}`, // FIXED: use panic ID + status for stable ID
        type: activityType,
        title: title,
        description: description,
        user: panic.user.name,
        timestamp: panic.created_at,
        metadata: { panicId: panic.id },
      })
    })

    // Sort berdasarkan timestamp dan ambil 5 terbaru
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)
  }


  // Helper functions
  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
  }

  const getActivityIcon = (type: ActivityType["type"]) => {
    switch (type) {
      case "volunteer_add":
        return <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case "volunteer_remove":
        return <UserMinus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      case "report_new":
        return <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
      case "report_resolved":
        return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      case "panic_new":
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case "panic_handled":
        return <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      default:
        return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getActivityColor = (type: ActivityType["type"]) => {
    switch (type) {
      case "volunteer_add":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
      case "volunteer_remove":
        return "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
      case "report_new":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
      case "report_resolved":
        return "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
      case "panic_new":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
      case "panic_handled":
        return "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800"
    }
  }

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 dark:text-green-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-lg">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 transition-theme">
      {/* Modern Header with Dark Mode Support */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-theme"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Admin</h1>
            <p className="text-gray-600 dark:text-gray-300">Pantau dan kelola seluruh aktivitas sistem SIGAP</p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div
                  className={`w-2 h-2 rounded-full ${refreshIntervalRef.current ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                <span>Auto-refresh {refreshIntervalRef.current ? "aktif" : "nonaktif"}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Live Updates</span>
              </div>
              {lastRefresh && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Terakhir: {lastRefresh.toLocaleTimeString("id-ID")}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                setIsRefreshing(true)
                fetchDashboardData(false) // Manual refresh dengan parameter false
              }}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto transition-theme"
              disabled={isRefreshing}
              size="sm"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Cards with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {/* Total Relawan Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Relawan</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.totalVolunteers}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  +{dashboardData.stats.volunteersThisMonth} minggu ini
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Laporan Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Laporan</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.totalReports}
              </p>
              <div className="flex items-center mt-2">
                <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400 mr-1" />
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  {dashboardData.stats.pendingReports} menunggu
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Panic Alert Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Panic Alert</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.totalPanicAlerts}
              </p>
              <div className="flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
                <span className="text-sm text-red-600 dark:text-red-400">{dashboardData.stats.activePanics} aktif</span>
              </div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 5 Latest System Activities with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-theme">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    5 Aktivitas Terbaru Sistem SIGAP UNDIP
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Pemantauan aktivitas relawan, laporan, dan panic alert secara keseluruhan
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live
                </Badge>
                {refreshIntervalRef.current && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    <Clock className="w-3 h-3 mr-1" />
                    30s
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center p-8 sm:p-12 space-y-3">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-600 dark:text-purple-400" />
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Memuat aktivitas terbaru...</p>
              </div>
            ) : dashboardData.recentActivities?.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {dashboardData.recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${getActivityColor(activity.type)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{activity.title}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{activity.description}</p>
                        {activity.user && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-white dark:bg-gray-800 dark:text-white">
                                {activity.user.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{activity.user}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 sm:p-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                      Belum ada aktivitas terbaru
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      Aktivitas sistem akan muncul di sini secara otomatis
                    </p>
                    <Button
                      onClick={() => fetchDashboardData(false)}
                      className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Periksa Ulang
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/volunteers")}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Users className="h-4 w-4 mr-2" />
                Kelola Relawan
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/reports")}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <FileText className="h-4 w-4 mr-2" />
                Kelola Laporan
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/panic-reports")}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Panic Alerts
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Auto-refresh indicator with Dark Mode */}
      {lastRefresh && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 transition-theme">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${refreshIntervalRef.current ? "animate-pulse bg-green-500" : "bg-red-500"}`}
              ></div>
              <div className="text-sm">
                <p className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                  <RefreshCw className={`h-3 w-3 mr-1 ${refreshIntervalRef.current ? "animate-spin" : ""}`} />
                  Auto-refresh {refreshIntervalRef.current ? "aktif" : "nonaktif"}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Setiap 30 detik • Terakhir: {lastRefresh.toLocaleTimeString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
