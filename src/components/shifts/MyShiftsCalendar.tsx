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
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showFilters, setShowFilters] = useState(false);

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
        shortText: "Hari Ini",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      };
    } else if (item.is_scheduled) {
      return {
        text: item.is_past ? "Sudah Bertugas" : "Akan Bertugas",
        shortText: item.is_past ? "Selesai" : "Terjadwal",
        color: item.is_past ? "bg-gray-100 text-gray-800 border-gray-300" : "bg-blue-100 text-blue-800 border-blue-300",
        icon: <Clock className="h-3 w-3 mr-1" />
      };
    } else {
      return {
        text: "Libur",
        shortText: "Libur",
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
        <div className="space-y-1 sm:space-y-2 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Jadwal Shift Saya</h1>
          <p className="text-sm sm:text-base text-gray-500">Lihat jadwal shift Anda untuk minggu ini dan yang akan datang</p>
          {shiftsData && (
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">{shiftsData.relawan.name}</span>
            </div>
          )}
        </div>
        
        {/* Mobile Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => fetchMyShifts()}
            variant="outline"
            className="border-gray-200 flex-1 sm:flex-none"
            disabled={isRefreshing}
            size="sm"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Segarkan</span>
          </Button>
        </div>
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
              <div className="flex flex-col space-y-4">
                {/* Week Info */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      <span className="truncate">{shiftsData.week_info.week_label}</span>
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      {shiftsData.week_info.period_formatted}
                    </CardDescription>
                  </div>
                  
                  {/* Desktop View Toggle */}
                  <div className="hidden sm:flex items-center space-x-2">
                    <Button
                      variant={viewMode === 'calendar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('calendar')}
                    >
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      Kalender
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4 mr-1" />
                      List
                    </Button>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
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
                        className="border-blue-200 text-blue-600 text-xs px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">Minggu Ini</span>
                        <span className="sm:hidden">Ini</span>
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

                  {/* Mobile View Toggle */}
                  <div className="flex sm:hidden items-center space-x-2 w-full">
                    <Button
                      variant={viewMode === 'calendar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('calendar')}
                      className="flex-1"
                    >
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      Kalender
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex-1"
                    >
                      <List className="h-4 w-4 mr-1" />
                      List
                    </Button>
                  </div>
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

              {/* Schedule Display */}
              {viewMode === 'calendar' ? (
                // Calendar View
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
                              <span className="sm:hidden">{formatShortDate(scheduleItem.date)}</span>
                              <span className="hidden sm:inline">{scheduleItem.date_formatted}</span>
                            </p>
                          </div>
                          
                          <Badge className={`${status.color} flex items-center px-2 py-1 text-xs border`}>
                            {status.icon}
                            <span className="sm:hidden">{status.shortText}</span>
                            <span className="hidden sm:inline">{status.text}</span>
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
              ) : (
                // List View
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
                          p-3 sm:p-4 rounded-lg border transition-all duration-200
                          ${scheduleItem.is_today ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
                          hover:shadow-md
                        `}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                scheduleItem.is_today ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                <Calendar className={`h-5 w-5 ${
                                  scheduleItem.is_today ? 'text-blue-600' : 'text-gray-600'
                                }`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold text-sm sm:text-base ${
                                scheduleItem.is_today ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {scheduleItem.day_name}
                              </h3>
                              <p className={`text-xs sm:text-sm ${
                                scheduleItem.is_today ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                {scheduleItem.date_formatted}
                              </p>
                              {scheduleItem.is_scheduled && scheduleItem.shift_id && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Shift ID: {scheduleItem.shift_id}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <Badge className={`${status.color} flex items-center px-3 py-1 border text-xs sm:text-sm`}>
                              {status.icon}
                              <span>{status.text}</span>
                            </Badge>
                            
                            {scheduleItem.shift_source && (
                              <span className="text-xs text-gray-500 hidden sm:inline">
                                ({scheduleItem.shift_source})
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Ringkasan Jadwal</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl font-bold text-blue-600">{shiftsData.summary.total_scheduled_days}</span>
                      <span className="text-gray-600 text-xs">Total Hari</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl font-bold text-green-600">{shiftsData.summary.days_with_actual_shifts}</span>
                      <span className="text-gray-600 text-xs">Shift Aktual</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-2xl font-bold text-purple-600">{shiftsData.summary.days_with_patterns_only}</span>
                      <span className="text-gray-600 text-xs">Pola</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-lg font-bold text-gray-600">{shiftsData.summary.work_days_this_week}</span>
                      <span className="text-gray-600 text-xs">Persentase</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Shifts */}
              {shiftsData.upcoming_shifts.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base flex items-center">
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
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg gap-2"
                      >
                        <div className="flex items-center flex-1">
                          <Calendar className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium text-blue-900 text-sm">{shift.day_name}</span>
                            <span className="text-blue-700 text-sm">{shift.date_formatted}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          {shift.shift_id && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                              ID: {shift.shift_id}
                            </Badge>
                          )}
                          {shift.shift_source && (
                            <span className="text-xs text-blue-600 hidden sm:inline">
                              ({shift.shift_source})
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Show message if there are more upcoming shifts */}
                  {shiftsData.upcoming_shifts.length >= 3 && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-500">
                        Menampilkan 3 shift mendatang terdekat
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* No upcoming shifts message */}
              {shiftsData.upcoming_shifts.length === 0 && (
                <div className="mt-4 sm:mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Tidak ada shift mendatang yang terjadwal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mobile-specific Quick Actions */}
      <div className="sm:hidden">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-gray-800">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                onClick={() => setCurrentWeekOffset(0)}
                disabled={currentWeekOffset === 0}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Minggu Ini</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                onClick={() => fetchMyShifts()}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs">Segarkan</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Card for Mobile */}
      <div className="sm:hidden">
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 text-sm mb-1">Tips Mobile</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Geser untuk melihat semua hari dalam mode kalender</li>
                  <li>• Gunakan mode list untuk tampilan yang lebih compact</li>
                  <li>• Tap pada filter untuk menyembunyikan/menampilkan kontrol</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}