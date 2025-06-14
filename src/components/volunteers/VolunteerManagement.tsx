// src/components/volunteers/VolunteerManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Search, 
  Loader2, 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Filter,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  IdCard,
  MoreHorizontal,
  Menu,
  Grid,
  List,
  SlidersHorizontal,
  Activity,
  TrendingUp,
  UserCheck,
  Shield,
  Calendar
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
import { motion, AnimatePresence } from "framer-motion";
import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import VolunteerForm from "./VolunteerForm";

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


export default function VolunteerManagement() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan", {
          style: {
            background: 'rgb(239, 68, 68)',
            color: 'white',
            border: '1px solid rgb(220, 38, 38)',
          },
          className: 'dark:bg-red-600 dark:text-white dark:border-red-500'
        });
        return;
      }

      const response = await fetch("/api/volunteer", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Gagal mengambil data relawan: ${response.status}`);
      }
      
      const data = await response.json();
      const volunteerList = Array.isArray(data) ? data : data.data || [];
      setVolunteers(volunteerList);
      
    } catch (error) {
      console.error("Error mengambil data relawan:", error);
      toast.error("Gagal memuat data relawan", {
        style: {
          background: 'rgb(239, 68, 68)',
          color: 'white',
          border: '1px solid rgb(220, 38, 38)',
        },
        className: 'dark:bg-red-600 dark:text-white dark:border-red-500'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const deleteVolunteer = async (volunteerId: number) => {
    setIsDeleting(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan", {
          style: {
            background: 'rgb(239, 68, 68)',
            color: 'white',
            border: '1px solid rgb(220, 38, 38)',
          },
          className: 'dark:bg-red-600 dark:text-white dark:border-red-500'
        });
        return;
      }

      const response = await fetch(`/api/volunteer/${volunteerId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menghapus relawan");
      }

      toast.success("Relawan berhasil dihapus", {
        style: {
          background: 'rgb(34, 197, 94)',
          color: 'white',
          border: '1px solid rgb(22, 163, 74)',
        },
        className: 'dark:bg-green-600 dark:text-white dark:border-green-500'
      });
      await fetchVolunteers();
      
    } catch (error) {
      console.error("Error menghapus relawan:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus relawan", {
        style: {
          background: 'rgb(239, 68, 68)',
          color: 'white',
          border: '1px solid rgb(220, 38, 38)',
        },
        className: 'dark:bg-red-600 dark:text-white dark:border-red-500'
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedVolunteer(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta'
    }).format(date) + ' WIB';
  };

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: { text: string, color: string } } = {
      'admin': {
        text: "Admin",
        color: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
      },
      'volunteer': {
        text: "Relawan",
        color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      },
      'user': {
        text: "User",
        color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      }
    };
    
    return roleMap[role] || {
      text: role.charAt(0).toUpperCase() + role.slice(1),
      color: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
    };
  };

  // Beralih arah pengurutan atau mengubah bidang pengurutan
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (field !== sortField) return <ChevronDown className="h-4 w-4 opacity-40" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  const sortVolunteers = (a: Volunteer, b: Volunteer) => {
    let valueA, valueB;
    
    switch (sortField) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'email':
        valueA = a.email.toLowerCase();
        valueB = b.email.toLowerCase();
        break;
      case 'role':
        valueA = a.role;
        valueB = b.role;
        break;
      case 'created_at':
        valueA = new Date(a.created_at).getTime();
        valueB = new Date(b.created_at).getTime();
        break;
      default:
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  };

  // Filter relawan berdasarkan kueri pencarian
  const filteredVolunteers = volunteers
    .filter(volunteer => 
      volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.nik.includes(searchQuery) ||
      volunteer.no_telp.includes(searchQuery)
    )
    .filter(volunteer => roleFilter === "all" || volunteer.role === roleFilter)
    .sort(sortVolunteers);

  const handleCreateVolunteer = () => {
    setFormMode('create');
    setSelectedVolunteer(null);
    setShowVolunteerForm(true);
  };

  const handleEditVolunteer = (volunteer: Volunteer) => {
    setFormMode('edit');
    setSelectedVolunteer(volunteer);
    setShowVolunteerForm(true);
  };

  const onVolunteerSaved = () => {
    setShowVolunteerForm(false);
    setSelectedVolunteer(null);
    fetchVolunteers();
  };

  const handleDeleteClick = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowDeleteDialog(true);
  };

  // Variasi animasi
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    },
    exit: { opacity: 0, height: 0 }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

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
              Manajemen Relawan
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Kelola data relawan sistem SIGAP
            </p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Total: {volunteers.length} relawan</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Live Updates</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={fetchVolunteers}
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
              onClick={handleCreateVolunteer}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Relawan
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards - Updated for Volunteers Only with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
      {[
        {
          label: "Total Relawan", 
          value: volunteers.length, 
          icon: Users, 
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        { 
          label: "Aktif Bulan Ini", 
          value: volunteers.filter(v => {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return new Date(v.created_at) >= oneMonthAgo;
          }).length, 
          icon: UserCheck, 
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-900/20"
        },
        { 
          label: "Bergabung Minggu Ini", 
          value: volunteers.filter(v => {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return new Date(v.created_at) >= oneWeekAgo;
          }).length, 
          icon: TrendingUp, 
          color: "text-purple-600 dark:text-purple-400",
          bg: "bg-purple-50 dark:bg-purple-900/20"
        },
        { 
          label: "Bergabung Hari Ini", 
          value: volunteers.filter(v => {
            const today = new Date();
            const volunteerDate = new Date(v.created_at);
            return volunteerDate.toDateString() === today.toDateString();
          }).length, 
          icon: Calendar, 
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

      {/* Simplified Filters - Updated Role Filter with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-theme">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Filter & Pencarian</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Temukan relawan dengan mudah
                  </CardDescription>
                </div>
              </div>
              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`p-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pencarian</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                  <Input
                    placeholder="Cari nama, email, NIK, atau telepon..."
                    className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <Select
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                  options={[
                    { value: "all", label: "Semua Relawan" },
                    { value: "volunteer", label: "Relawan Aktif" }
                  ]}
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reset</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                  }}
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full transition-theme"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content - Updated for Volunteers Only with Dark Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-theme">
          <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Relawan</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{filteredVolunteers.length} relawan ditemukan</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live
                </Badge>
                {/* Mobile View Toggle */}
                <div className="flex sm:hidden items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center p-8 sm:p-12 space-y-3">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Memuat data relawan...</p>
              </div>
            ) : filteredVolunteers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 sm:p-12"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  {searchQuery || roleFilter !== "all" ? (
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Tidak ada relawan yang cocok</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Coba ubah kriteria pencarian atau filter</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery('');
                          setRoleFilter('all');
                        }}
                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-theme"
                        size="sm"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Hapus Filter
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Belum ada relawan</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Mulai dengan menambahkan relawan baru ke sistem</p>
                      <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Tambah Relawan
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  // Grid View - Updated Role Display with Dark Mode
                  <div className="p-4 sm:p-6">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                      {filteredVolunteers.map((volunteer) => {
                        return (
                          <motion.div 
                            key={volunteer.id}
                            variants={cardVariants}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                          >
                            <div className="p-4">
                              {/* Header with volunteer status */}
                              <div className="flex items-center justify-between mb-3">
                                <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 flex items-center px-2 py-1 text-xs font-medium border">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Relawan
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">ID: {volunteer.id}</span>
                              </div>
                              
                              {/* User Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    {volunteer.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-white truncate">{volunteer.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{volunteer.email}</div>
                                </div>
                              </div>
                              
                              {/* Contact Details */}
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                  <Phone className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                  <span className="truncate">{volunteer.no_telp}</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                  <IdCard className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                  <span className="truncate">{volunteer.nik}</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                  <Calendar className="h-3 w-3 mr-2 text-gray-400 dark:text-gray-500" />
                                  <span className="truncate">Bergabung {formatDate(volunteer.created_at)}</span>
                                </div>
                              </div>
                              
                              {/* Action Dropdown */}
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 px-3 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-theme">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <DropdownMenuItem 
                                      onClick={() => handleEditVolunteer(volunteer)}
                                      className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      <Edit className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteClick(volunteer)}
                                      className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                ) : (
                  // List View - Updated Table Headers with Dark Mode
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-3 sm:px-4 py-3 text-left">
                            <button
                              className="flex items-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                              onClick={() => handleSort('name')}
                            >
                              Nama Relawan
                              {getSortIcon('name')}
                            </button>
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left">
                            <button
                              className="flex items-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                              onClick={() => handleSort('email')}
                            >
                              Email
                              {getSortIcon('email')}
                            </button>
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Kontak</th>
                          <th className="px-3 sm:px-4 py-3 text-left">
                            <button
                              className="flex items-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                              onClick={() => handleSort('created_at')}
                            >
                              Bergabung
                              {getSortIcon('created_at')}
                            </button>
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Aksi</th>
                        </tr>
                      </thead>
                      <motion.tbody
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="divide-y divide-gray-200 dark:divide-gray-700"
                      >
                        {filteredVolunteers.map((volunteer) => {
                          return (
                            <motion.tr 
                              key={volunteer.id}
                              variants={itemVariants}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="px-3 sm:px-4 py-3 sm:py-4">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm">
                                      {volunteer.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{volunteer.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {volunteer.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{volunteer.email}</div>
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  <div className="truncate">{volunteer.no_telp}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500 truncate">{volunteer.nik}</div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  <div>{formatDate(volunteer.created_at)}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">{formatTime(volunteer.created_at)}</div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <DropdownMenuItem 
                                      onClick={() => handleEditVolunteer(volunteer)}
                                      className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      <Edit className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteClick(volunteer)}
                                      className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </motion.tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Volunteer Form Dialog */}
      {showVolunteerForm && (
        <VolunteerForm
          mode={formMode}
          volunteer={selectedVolunteer}
          isOpen={showVolunteerForm}
          onClose={() => {
            setShowVolunteerForm(false);
            setSelectedVolunteer(null);
          }}
          onSave={onVolunteerSaved}
        />
      )}

      {/* Delete Confirmation Dialog with Dark Mode */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Apakah Anda yakin ingin menghapus relawan "{selectedVolunteer?.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedVolunteer && deleteVolunteer(selectedVolunteer.id)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}