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
  Clock
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
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Pola Mingguan</h1>
          <p className="text-gray-500 mt-1">Atur jadwal relawan untuk setiap hari dalam seminggu</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => fetchWeeklyPatterns()}
            variant="outline"
            className="border-gray-200"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Segarkan
          </Button>
          <Button
            onClick={handleAddNewPattern}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Atur Pola Hari
          </Button>
        </div>
      </motion.div>

      {/* Weekly Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Pola Mingguan
            </CardTitle>
            <CardDescription>
              {weeklyPatterns?.note || "Pola ini berulang secara otomatis setiap minggu"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {weeklyPatterns ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
                {DAYS_OF_WEEK.map((day, index) => {
                  const pattern = weeklyPatterns.weekly_patterns[day.value];
                  return (
                    <motion.div
                      key={day.value}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-800">
                              {day.label}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className="flex items-center px-2 py-1"
                              >
                                <Users className="h-3 w-3 mr-1" />
                                {pattern?.relawan_count || 0}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDay(day.value)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {pattern && pattern.relawan_count > 0 ? (
                            <div className="space-y-2">
                              {pattern.relawan.map((relawan) => (
                                <div 
                                  key={relawan.id}
                                  className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg"
                                >
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">
                                      {relawan.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {relawan.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {relawan.email}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Belum ada relawan</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDay(day.value)}
                                className="mt-2"
                              >
                                Atur Relawan
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">Tidak ada data pola mingguan</h3>
                <p className="text-gray-500 mb-4">Mulai dengan mengatur pola untuk hari tertentu</p>
                <Button onClick={handleAddNewPattern} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Atur Pola Pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Set Day Pattern Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDay ? `Edit Pola ${getDayLabel(editingDay)}` : "Atur Pola Hari Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingDay 
                ? `Ubah relawan yang bertugas pada hari ${getDayLabel(editingDay)}`
                : "Pilih hari dan relawan yang akan bertugas"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!editingDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Relawan ({selectedVolunteers.length} dipilih)
              </label>
              <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                {volunteers.length > 0 ? (
                  volunteers.map((volunteer) => (
                    <div 
                      key={volunteer.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        checked={selectedVolunteers.includes(volunteer.id)}
                        onCheckedChange={() => handleVolunteerToggle(volunteer.id)}
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {volunteer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {volunteer.email}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Tidak ada relawan tersedia
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedDay || selectedVolunteers.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
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