// src/components/shifts/MyShiftsCalendar.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Calendar, 
  Loader2, 
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  User,
  AlertCircle
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
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  useEffect(() => {
    fetchMyShifts();
  }, [currentWeekOffset]);

  const fetchMyShifts = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const params = new URLSearchParams();
      if (currentWeekOffset !== 0) {
        params.append('week_offset', currentWeekOffset.toString());
      }

      const response = await fetch(`/api/relawan/my-shifts?${params.toString()}`, {
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

  const handleWeekNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeekOffset(currentWeekOffset - 1);
    } else {
      setCurrentWeekOffset(currentWeekOffset + 1);
    }
  };

  const handleGoToCurrentWeek = () => {
    setCurrentWeekOffset(0);
  };

  const getShiftStatusBadge = (item: WeeklyScheduleItem) => {
    if (item.is_today && item.is_scheduled) {
      return {
        text: "Bertugas Hari Ini",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      };
    } else if (item.is_scheduled) {
      return {
        text: item.is_past ? "Sudah Bertugas" : "Akan Bertugas",
        color: item.is_past ? "bg-gray-100 text-gray-800 border-gray-300" : "bg-blue-100 text-blue-800 border-blue-300",
        icon: <Clock className="h-3 w-3 mr-1" />
      };
    } else {
      return {
        text: "Libur",
        color: "bg-gray-100 text-gray-600 border-gray-300",
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 sm:p-12">
        <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Jadwal Shift Saya</h1>
          <p className="text-sm sm:text-base text-gray-500">Lihat jadwal shift Anda untuk minggu ini dan yang akan datang</p>
          {shiftsData && (
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">{shiftsData.relawan.name}</span>
            </div>
          )}
        </div>
        <Button
          onClick={() => fetchMyShifts()}
          variant="outline"
          className="border-gray-200 w-full sm:w-auto"
          disabled={isRefreshing}
          size="sm"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Segarkan
        </Button>
      </motion.div>

      {/* Week Navigation and Schedule */}
      {shiftsData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    {shiftsData.week_info.week_label}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {shiftsData.week_info.period_formatted}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekNavigation('prev')}
                    className="border-gray-200 flex-1 sm:flex-none"
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Sebelum</span>
                  </Button>
                  {currentWeekOffset !== 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGoToCurrentWeek}
                      className="border-blue-200 text-blue-600 text-xs px-2"
                    >
                      Minggu Ini
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekNavigation('next')}
                    className="border-gray-200 flex-1 sm:flex-none"
                  >
                    <span className="hidden sm:inline">Sesudah</span>
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Today Status - Only show for current week */}
              {currentWeekOffset === 0 && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-blue-900 text-sm sm:text-base">Status Hari Ini</h3>
                      <p className="text-xs sm:text-sm text-blue-700 mt-1">
                        {formatDate(shiftsData.today_status.date)}
                      </p>
                    </div>
                    <Badge 
                      className={`${
                        shiftsData.today_status.is_on_duty 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-gray-100 text-gray-800 border-gray-300'
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
              )}

              {/* Weekly Schedule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4">
                {shiftsData.weekly_schedule.map((scheduleItem, index) => {
                  const status = getShiftStatusBadge(scheduleItem);
                  return (
                    <motion.div
                      key={scheduleItem.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-md
                        ${scheduleItem.is_today ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
                        ${scheduleItem.is_scheduled ? 'hover:border-blue-300' : 'hover:border-gray-300'}
                      `}
                    >
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="w-full">
                          <h3 className={`font-semibold text-sm sm:text-base ${scheduleItem.is_today ? 'text-blue-900' : 'text-gray-900'}`}>
                            {scheduleItem.day_name}
                          </h3>
                          <p className={`text-xs sm:text-sm ${scheduleItem.is_today ? 'text-blue-700' : 'text-gray-500'}`}>
                            {scheduleItem.date_formatted}
                          </p>
                        </div>
                        
                        <Badge className={`${status.color} flex items-center px-2 py-1 text-xs border`}>
                          {status.icon}
                          <span>{status.text}</span>
                        </Badge>
                        
                        {scheduleItem.is_scheduled && scheduleItem.shift_id && (
                          <div className="text-xs text-gray-500">
                            ID: {scheduleItem.shift_id}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Ringkasan Jadwal</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">Total Hari:</span>
                    <span className="font-medium">{shiftsData.summary.total_scheduled_days}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">Shift Aktual:</span>
                    <span className="font-medium">{shiftsData.summary.days_with_actual_shifts}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">Pola:</span>
                    <span className="font-medium">{shiftsData.summary.days_with_patterns_only}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">Persentase:</span>
                    <span className="font-medium">{shiftsData.summary.work_days_this_week}</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Shifts */}
              {shiftsData.upcoming_shifts.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Shift Mendatang</h3>
                  <div className="space-y-2">
                    {shiftsData.upcoming_shifts.map((shift) => (
                      <div 
                        key={shift.date}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg gap-2"
                      >
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                          <span className="font-medium text-blue-900 text-sm">{shift.day_name}</span>
                          <span className="text-blue-700 ml-2 text-sm">{shift.date_formatted}</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 w-fit text-xs">
                          ID: {shift.shift_id}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}