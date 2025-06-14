// src/components/shifts/MyShiftsCalendar.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Calendar, 
  Loader2, 
  Clock,
  CheckCircle,
  User,
  AlertCircle,
  Filter,
  Menu,
  Grid3X3,
  List
} from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { MyShiftsResponse, WeeklyScheduleItem } from "@/types/shift";

export default function MyShiftsCalendar() {
  const [shiftsData, setShiftsData] = useState<MyShiftsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMyShifts();
  }, []);

  const fetchMyShifts = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const response = await fetch("/api/relawan/my-shifts", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Gagal mengambil jadwal shift: ${response.status}`);
      }
      
      const data: MyShiftsResponse = await response.json();
      console.log("My shifts data:", data);
      
      setShiftsData(data);
      
    } catch (error) {
      console.error("Error mengambil jadwal shift:", error);
      toast.error("Gagal memuat jadwal shift");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getShiftStatusBadge = (item: WeeklyScheduleItem) => {
    if (item.is_today && item.is_scheduled) {
      return {
        text: "Bertugas Hari Ini",
        shortText: "Hari Ini",
        color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      };
    } else if (item.is_scheduled) {
      return {
        text: item.is_past ? "Sudah Bertugas" : "Akan Bertugas",
        shortText: item.is_past ? "Selesai" : "Terjadwal",
        color: item.is_past 
          ? "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800" 
          : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        icon: <Clock className="h-3 w-3 mr-1" />
      };
    } else {
      return {
        text: "Libur",
        shortText: "Libur",
        color: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 sm:p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat jadwal shift...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 transition-theme">
      {/* Header with Dark Mode */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-theme"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 sm:space-y-2 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Jadwal Shift Saya</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Lihat jadwal shift Anda untuk minggu ini dan yang akan datang</p>
            {shiftsData && (
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{shiftsData.relawan.name}</span>
              </div>
            )}
          </div>
          
          {/* Mobile Controls */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              className="sm:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => fetchMyShifts()}
              variant="outline"
              className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex-1 sm:flex-none transition-theme"
              disabled={isRefreshing}
              size="sm"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Week Navigation and Schedule with Dark Mode */}
      {shiftsData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 transition-theme">
            <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                    {shiftsData.week_info.week_label}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {shiftsData.week_info.period_formatted}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              {/* Today Status */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-400 text-sm sm:text-base">Status Hari Ini</h3>
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-1">
                      {formatDate(shiftsData.today_status.date)}
                    </p>
                  </div>
                  <Badge 
                    className={`${
                      shiftsData.today_status.is_on_duty 
                        ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                        : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                    } flex items-center px-3 py-1 border w-fit`}
                  >
                    {shiftsData.today_status.is_on_duty ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span className="text-xs sm:text-sm">Sedang Bertugas</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="text-xs sm:text-sm">Tidak Bertugas</span>
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Summary with Dark Mode - MOVED TO TOP */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Ringkasan Jadwal</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{shiftsData.summary.total_scheduled_days}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Total Hari Kerja</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">{shiftsData.summary.days_with_actual_shifts}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Shift Aktual</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{shiftsData.summary.days_with_patterns_only}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Shift Pola</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{shiftsData.summary.work_days_this_week}%</span>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Persentase Kerja</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Calendar View (always calendar on desktop) */}
              <div className="hidden sm:block mb-4 sm:mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm sm:text-base flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Jadwal Minggu Ini
                </h3>
                <div className="grid grid-cols-7 gap-3 sm:gap-4">
                  {shiftsData.weekly_schedule.map((scheduleItem, index) => {
                    const status = getShiftStatusBadge(scheduleItem);
                    return (
                      <motion.div
                        key={scheduleItem.date}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                          p-4 rounded-lg border transition-all duration-200 hover:shadow-md
                          ${scheduleItem.is_today 
                            ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          }
                          ${scheduleItem.is_scheduled ? 'hover:border-blue-300 dark:hover:border-blue-600' : 'hover:border-gray-300 dark:hover:border-gray-600'}
                        `}
                      >
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-full">
                            <h3 className={`font-semibold text-base ${
                              scheduleItem.is_today ? 'text-blue-900 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {scheduleItem.day_name}
                            </h3>
                            <p className={`text-sm ${
                              scheduleItem.is_today ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {scheduleItem.date_formatted}
                            </p>
                          </div>
                          
                          <Badge className={`${status.color} flex items-center px-2 py-1 text-xs border`}>
                            {status.icon}
                            <span>{status.text}</span>
                          </Badge>
                          
                          {scheduleItem.is_scheduled && scheduleItem.shift_id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium text-green-600 dark:text-green-400">Aktual</span> - ID: {scheduleItem.shift_id}
                            </div>
                          )}
                          
                          {scheduleItem.is_scheduled && !scheduleItem.shift_id && (
                            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              Shift Pola
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile List View (always list on mobile) */}
              <div className="sm:hidden mb-4 sm:mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Jadwal Minggu Ini
                </h3>
                <div className="space-y-3">
                  {shiftsData.weekly_schedule.map((scheduleItem, index) => {
                    const status = getShiftStatusBadge(scheduleItem);
                    return (
                      <motion.div
                        key={scheduleItem.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          p-3 rounded-lg border transition-all duration-200
                          ${scheduleItem.is_today 
                            ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          }
                          hover:shadow-md
                        `}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                scheduleItem.is_today 
                                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <Calendar className={`h-4 w-4 ${
                                  scheduleItem.is_today 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : 'text-gray-600 dark:text-gray-400'
                                }`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold text-sm ${
                                scheduleItem.is_today ? 'text-blue-900 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                              }`}>
                                {scheduleItem.day_name}
                              </h3>
                              <p className={`text-xs ${
                                scheduleItem.is_today ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatShortDate(scheduleItem.date)}
                              </p>
                              {scheduleItem.is_scheduled && scheduleItem.shift_id && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                  Shift Aktual - ID: {scheduleItem.shift_id}
                                </p>
                              )}
                              {scheduleItem.is_scheduled && !scheduleItem.shift_id && (
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                                  Shift Pola
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={`${status.color} flex items-center px-2 py-1 border text-xs`}>
                              {status.icon}
                              <span>{status.shortText}</span>
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Shifts with Dark Mode - MOVED TO BOTTOM */}
              {shiftsData.upcoming_shifts.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm sm:text-base flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Shift Mendatang
                  </h3>
                  <div className="space-y-2">
                    {shiftsData.upcoming_shifts.map((shift, index) => (
                      <motion.div 
                        key={shift.date}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg gap-2"
                      >
                        <div className="flex items-center flex-1">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium text-blue-900 dark:text-blue-400 text-sm">{shift.day_name}</span>
                            <span className="text-blue-700 dark:text-blue-400 text-sm">{shift.date_formatted}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          {shift.shift_id ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-xs">
                              Aktual - ID: {shift.shift_id}
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 text-xs">
                              Shift Pola
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Show message if there are more upcoming shifts */}
                  {shiftsData.upcoming_shifts.length >= 3 && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Menampilkan 3 shift mendatang terdekat
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* No upcoming shifts message with Dark Mode */}
              {shiftsData.upcoming_shifts.length === 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                  <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tidak ada shift mendatang yang terjadwal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}