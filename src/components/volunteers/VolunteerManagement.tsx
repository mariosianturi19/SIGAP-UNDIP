// src/components/volunteers/VolunteerManagement.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Trash2, 
  UserPlus, 
  Loader2, 
  RefreshCw, 
  Search, 
  Filter,
  SlidersHorizontal,
  Mail,
  Phone,
  Hash,
  User,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import VolunteerForm from "./VolunteerForm";
import DeleteVolunteerDialog from "./DeleteVolunteerDialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchVolunteers = async () => {
    setIsRefreshing(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Autentikasi diperlukan");
        return;
      }

      const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/admin/relawan", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Gagal mengambil data relawan: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Data relawan:", data);
      
      // Tangani data berdasarkan struktur respons API
      const volunteersData = Array.isArray(data) ? data : data.data || [];
      setVolunteers(volunteersData);
    } catch (error) {
      console.error("Error mengambil data relawan:", error);
      toast.error("Gagal memuat data relawan");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVolunteers();
  };

  const handleCreateVolunteer = () => {
    setFormMode('create');
    setSelectedVolunteer(null);
    setIsFormOpen(true);
  };

  const handleEditVolunteer = (volunteer: Volunteer) => {
    setFormMode('edit');
    setSelectedVolunteer(volunteer);
    setIsFormOpen(true);
  };

  const handleDeleteVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsDeleteDialogOpen(true);
  };

  const onVolunteerSaved = () => {
    setIsFormOpen(false);
    fetchVolunteers();
    toast.success(
      formMode === 'create' 
        ? "Relawan berhasil ditambahkan" 
        : "Data relawan berhasil diperbarui"
    );
  };

  const onVolunteerDeleted = () => {
    setIsDeleteDialogOpen(false);
    fetchVolunteers();
    toast.success("Relawan berhasil dihapus");
  };

  // Mengurutkan relawan
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
      case 'nik':
        valueA = a.nik;
        valueB = b.nik;
        break;
      case 'phone':
        valueA = a.no_telp;
        valueB = b.no_telp;
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

  // Beralih arah pengurutan atau mengubah bidang pengurutan
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
    .sort(sortVolunteers);

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

  const getSortIcon = (field: string) => {
    if (field !== sortField) return <ChevronDown className="h-4 w-4 opacity-40" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Relawan</h1>
          <p className="text-gray-500 mt-1">Kelola relawan dan informasi mereka</p>
        </div>
        <Button 
          onClick={handleCreateVolunteer} 
          className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Relawan
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Daftar Relawan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Cari relawan..."
                    className="pl-10 border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="shrink-0 border-gray-200" 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Segarkan</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="shrink-0 border-gray-200"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Filter</span>
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
              </div>
            ) : filteredVolunteers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-12"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  {searchQuery ? (
                    <>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">Tidak ada relawan yang cocok</h3>
                      <p className="text-gray-500 mb-4">Coba gunakan kriteria pencarian yang berbeda</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery('')}
                        className="border-gray-200"
                      >
                        Hapus pencarian
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">Tidak ada relawan ditemukan</h3>
                      <p className="text-gray-500 mb-4">Tambahkan relawan pertama Anda untuk memulai</p>
                      <Button 
                        onClick={handleCreateVolunteer}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Tambah Relawan Pertama
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-700 text-sm">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button 
                          className="flex items-center font-medium"
                          onClick={() => handleSort('name')}
                        >
                          Relawan
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button 
                          className="flex items-center font-medium"
                          onClick={() => handleSort('email')}
                        >
                          Email
                          {getSortIcon('email')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button 
                          className="flex items-center font-medium"
                          onClick={() => handleSort('nik')}
                        >
                          NIK
                          {getSortIcon('nik')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button 
                          className="flex items-center font-medium"
                          onClick={() => handleSort('phone')}
                        >
                          Telepon
                          {getSortIcon('phone')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-gray-100"
                  >
                    <AnimatePresence>
                      {filteredVolunteers.map((volunteer) => (
                        <motion.tr 
                          key={volunteer.id}
                          variants={itemVariants}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {volunteer.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{volunteer.name}</div>
                                <div className="text-xs text-gray-500">Bergabung: {new Date(volunteer.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{volunteer.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Hash className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                              <span>{volunteer.nik}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                              <span>{volunteer.no_telp}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center space-x-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem onClick={() => handleEditVolunteer(volunteer)} className="cursor-pointer">
                                    <Pencil className="h-4 w-4 mr-2 text-blue-600" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteVolunteer(volunteer)} className="cursor-pointer">
                                    <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                                    <span className="text-red-600">Hapus</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </motion.tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {isFormOpen && (
        <VolunteerForm 
          mode={formMode}
          volunteer={selectedVolunteer}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={onVolunteerSaved}
        />
      )}

      {isDeleteDialogOpen && selectedVolunteer && (
        <DeleteVolunteerDialog
          volunteer={selectedVolunteer}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDelete={onVolunteerDeleted}
        />
      )}
    </div>
  );
}