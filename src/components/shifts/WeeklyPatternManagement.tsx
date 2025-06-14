// src/components/shifts/WeeklyPatternManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Calendar, 
  Users, 
  Loader2, 
  Plus,
  Edit,
  Save,
  X,
  Clock,
  Settings,
  CalendarDays,
  UserCheck,
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  MoreHorizontal,
  Activity,
  TrendingUp
} from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { 
  WeeklyPatternsResponse, 
  DayPattern, 
  Relawan,
  DayOfWeek,
  SetDayPatternRequest,
  SetDayPatternResponse 
} from "@/types/shift";
import { DAYS_OF_WEEK } from "@/types/shift";

interface Volunteer {
  id: number;
  name: string;
  email: string;
  role: string;
  nik: string;
  no_telp: string;
  created_at: string;
  updated_at: string;
}

export default function WeeklyPatternManagement() {
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPatternsResponse | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "">("");
  const [selectedVolunteers, setSelectedVolunteers] = useState<number[]>([]);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchWeeklyPatterns(),
      fetchVolunteers()
    ]);
  };

  const fetchWeeklyPatterns = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const response = await fetch("/api/admin/shifts/weekly-patterns", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Gagal mengambil pola mingguan: ${response.status}`);
      }
      
      const data: WeeklyPatternsResponse = await response.json();
      console.log("Weekly patterns data:", data);
      
      setWeeklyPatterns(data);
      
    } catch (error) {
      console.error("Error mengambil pola mingguan:", error);
      toast.error("Gagal memuat pola mingguan");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch("/api/volunteer", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const volunteerList = Array.isArray(data) ? data : data.data || [];
        setVolunteers(volunteerList);
      }
    } catch (error) {
      console.error("Error mengambil daftar relawan:", error);
    }
  };

  const handleSetDayPattern = async (dayOfWeek: DayOfWeek, relawanIds: number[]) => {
    setIsSubmitting(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const requestData: SetDayPatternRequest = {
        day_of_week: dayOfWeek,
        relawan_ids: relawanIds
      };

      const response = await fetch("/api/admin/shifts/set-day-pattern", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengatur pola hari");
      }
      
      const result: SetDayPatternResponse = await response.json();
      console.log("Set day pattern result:", result);
      
      toast.success(result.message, {
        description: `${result.patterns_created} pola dibuat untuk ${getDayLabel(dayOfWeek)}`
      });
      
      // Refresh data
      await fetchWeeklyPatterns();
      
      // Close dialog
      setIsDialogOpen(false);
      setSelectedDay("");
      setSelectedVolunteers([]);
      setEditingDay(null);
      
    } catch (error) {
      console.error("Error mengatur pola hari:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengatur pola hari");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDay = (day: DayOfWeek) => {
    setEditingDay(day);
    setSelectedDay(day);
    
    // Set currently assigned volunteers
    const currentPattern = weeklyPatterns?.weekly_patterns[day];
    if (currentPattern) {
      setSelectedVolunteers(currentPattern.relawan.map(r => r.id));
    }
    
    setIsDialogOpen(true);
  };

  const handleAddNewPattern = () => {
    setEditingDay(null);
    setSelectedDay("");
    setSelectedVolunteers([]);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedDay || selectedVolunteers.length === 0) {
      toast.error("Pilih hari dan minimal satu relawan");
      return;
    }
    
    handleSetDayPattern(selectedDay as DayOfWeek, selectedVolunteers);
  };

  const getDayLabel = (day: string) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
  };

  const handleVolunteerToggle = (volunteerId: number) => {
    setSelectedVolunteers(prev => 
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const getAvailableDays = () => {
    if (editingDay) return DAYS_OF_WEEK;
    
    if (!weeklyPatterns) return DAYS_OF_WEEK;
    
    return DAYS_OF_WEEK.filter(day => {
      const pattern = weeklyPatterns.weekly_patterns[day.value];
      return !pattern || pattern.relawan_count === 0;
    });
  };

  // Get statistics
  const getStatistics = () => {
    if (!weeklyPatterns) return { totalDays: 0, totalVolunteers: 0, avgVolunteersPerDay: 0 };
    
    const patterns = weeklyPatterns.weekly_patterns;
    const daysWithPatterns = Object.values(patterns).filter(p => p && p.relawan_count > 0).length;
    const totalVolunteers = Object.values(patterns).reduce((sum, p) => sum + (p?.relawan_count || 0), 0);
    const avgVolunteersPerDay = daysWithPatterns > 0 ? Math.round(totalVolunteers / daysWithPatterns) : 0;
    
    return {
      totalDays: daysWithPatterns,
      totalVolunteers,
      avgVolunteersPerDay
    };
  };

  // Filter volunteers based on search
  const filteredVolunteers = volunteers.filter(volunteer =>
    volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    volunteer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat pola mingguan...</p>
        </div>
      </div>
    );
  }

  const statistics = getStatistics();

  return (
    <div className="space-y-4 sm:space-y-6 transition-theme">
      {/* Simplified Header - Match ReportList Style with Dark Mode */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-theme"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manajemen Pola Mingguan
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Atur jadwal relawan untuk setiap hari dalam seminggu
            </p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Total: {statistics.totalDays}/7 hari diatur</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Live Updates</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => fetchWeeklyPatterns()}
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
            <Button
              onClick={handleAddNewPattern}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Atur Pola Hari
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards - Match ReportList Style with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {[
          {
            label: "Hari Diatur", 
            value: statistics.totalDays, 
            icon: CalendarDays, 
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-900/20"
          },
          { 
            label: "Total Relawan", 
            value: statistics.totalVolunteers, 
            icon: Users, 
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20"
          },
          { 
            label: "Rata-rata/Hari", 
            value: statistics.avgVolunteersPerDay, 
            icon: TrendingUp, 
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-900/20"
          },
          { 
            label: "Pola Aktif", 
            value: `${Math.round((statistics.totalDays / 7) * 100)}%`, 
            icon: Settings, 
            color: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-50 dark:bg-orange-900/20"
          }
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Content - Match ReportList Style with Dark Mode */}
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
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Pola Mingguan</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {weeklyPatterns?.note || "Pola ini berulang secara otomatis setiap minggu"}
                  </p>
                </div>
              </div>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center p-8 sm:p-12 space-y-3">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-600 dark:text-purple-400" />
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Memuat pola mingguan...</p>
              </div>
            ) : weeklyPatterns ? (
              <div className="p-4 sm:p-6">
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {DAYS_OF_WEEK.map((day, index) => {
                    const pattern = weeklyPatterns.weekly_patterns[day.value];
                    const hasPattern = pattern && pattern.relawan_count > 0;
                    
                    return (
                      <motion.div
                        key={day.value}
                        variants={itemVariants}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                      >
                        <div className="p-4">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`flex items-center px-2 py-1 text-xs font-medium border ${
                              hasPattern 
                                ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                            }`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              {day.label}
                            </Badge>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 px-2 py-1 text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {pattern?.relawan_count || 0}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                  <DropdownMenuItem onClick={() => handleEditDay(day.value)} className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Edit className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                                    {hasPattern ? 'Edit Pola' : 'Atur Pola'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {/* Content */}
                          {hasPattern ? (
                            <div className="space-y-2">
                              {pattern.relawan.slice(0, 3).map((relawan) => (
                                <div 
                                  key={relawan.id}
                                  className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                      {relawan.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                      {relawan.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {relawan.email}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {pattern.relawan.length > 3 && (
                                <div className="text-center">
                                  <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                    +{pattern.relawan.length - 3} lainnya
                                  </Badge>
                                </div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDay(day.value)}
                                className="w-full mt-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Belum ada relawan</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDay(day.value)}
                                className="text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Atur
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 sm:p-12"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Belum ada pola mingguan</h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Mulai dengan mengatur pola untuk hari tertentu</p>
                    <Button 
                      onClick={handleAddNewPattern} 
                      className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Atur Pola Pertama
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Set Day Pattern Dialog with Dark Mode */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Settings className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              {editingDay ? `Edit Pola ${getDayLabel(editingDay)}` : "Atur Pola Hari Baru"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {editingDay 
                ? `Ubah relawan yang bertugas pada hari ${getDayLabel(editingDay)}`
                : "Pilih hari dan relawan yang akan bertugas"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto max-h-[60vh] px-1">
            {!editingDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pilih Hari
                </label>
                <Select
                  value={selectedDay}
                  onValueChange={(value) => setSelectedDay(value as DayOfWeek)}
                  options={getAvailableDays().map(day => ({
                    value: day.value,
                    label: day.label
                  }))}
                  placeholder="Pilih hari..."
                  disabled={isSubmitting}
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pilih Relawan
                </label>
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 px-2 py-1">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {selectedVolunteers.length} dipilih
                </Badge>
              </div>
              
              {/* Search volunteers */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <Input
                  placeholder="Cari relawan..."
                  className="pl-9 border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {filteredVolunteers.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredVolunteers.map((volunteer) => (
                        <motion.div 
                          key={volunteer.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Checkbox
                            checked={selectedVolunteers.includes(volunteer.id)}
                            onCheckedChange={() => handleVolunteerToggle(volunteer.id)}
                            disabled={isSubmitting}
                            className="border-gray-300 dark:border-gray-600"
                          />
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                              {volunteer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {volunteer.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {volunteer.email}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                              {volunteer.role}
                            </Badge>
                          </div>
                          {selectedVolunteers.includes(volunteer.id) && (
                            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'Tidak ada relawan yang cocok' : 'Tidak ada relawan tersedia'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedVolunteers.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-400 font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {selectedVolunteers.length} relawan akan ditugaskan
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedDay || selectedVolunteers.length === 0}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingDay ? "Simpan Perubahan" : "Atur Pola"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}