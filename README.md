# 🚨 SIGAP UNDIP

<div align="center">

![SIGAP UNDIP Logo](https://firebasestorage.googleapis.com/v0/b/seputipy.appspot.com/o/covers%2Fundip.png?alt=media)

**Sistem Informasi Gawat dan Pelaporan Universitas Diponegoro**

*Satu Sistem, Tanggap Darurat*

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Daftar Isi

- [Tentang SIGAP UNDIP](#-tentang-sigap-undip)
- [Fitur Utama](#-fitur-utama)
- [Demo & Screenshot](#-demo--screenshot)
- [Teknologi](#-teknologi)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Penggunaan](#-penggunaan)
- [Struktur Project](#-struktur-project)
- [API Documentation](#-api-documentation)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)
- [Tim Developer](#-tim-developer)

---

## 🎯 Tentang SIGAP UNDIP

**SIGAP UNDIP** adalah platform digital inovatif yang dirancang untuk meningkatkan sistem tanggap darurat dan keselamatan di lingkungan Universitas Diponegoro. Sistem ini menghubungkan mahasiswa, relawan, dan administrator dalam satu ekosistem yang responsif dan efektif.

### 🌟 Visi & Misi

**Visi:** Menciptakan lingkungan kampus yang aman dan responsif terhadap situasi darurat

**Misi:** 
- Menyediakan akses cepat untuk pelaporan darurat
- Memfasilitasi komunikasi efektif antara mahasiswa dan tim tanggap darurat
- Meningkatkan waktu respons dalam penanganan insiden
- Menciptakan database komprehensif untuk analisis keselamatan kampus

---

## ✨ Fitur Utama

### 🚨 **Panic Button (Tombol Darurat)**
- **One-Touch Emergency**: Tombol darurat dengan satu sentuhan
- **GPS Integration**: Otomatis mengirim lokasi GPS ke tim tanggap darurat
- **Real-time Alerts**: Notifikasi instan ke relawan terdekat
- **Location Tracking**: Pemantauan lokasi real-time untuk respons cepat

### 📋 **Smart Reporting System**
- **Multi-Category Reporting**: Pelaporan dengan berbagai kategori (listrik, infrastruktur, keamanan, dll.)
- **Photo Evidence**: Upload foto sebagai bukti pendukung
- **Status Tracking**: Pemantauan status laporan secara real-time
- **Admin Notes**: Catatan dari administrator untuk tindak lanjut

### 👥 **Multi-Role Dashboard**
- **Student Dashboard**: Interface khusus mahasiswa dengan fitur emergency dan reporting
- **Volunteer Dashboard**: Panel relawan dengan notifikasi dan manajemen respons
- **Admin Dashboard**: Kontrol penuh sistem dengan analytics dan manajemen user

### 🔒 **Advanced Security**
- **JWT Authentication**: Sistem otentikasi yang aman
- **Role-Based Access**: Kontrol akses berdasarkan peran pengguna
- **Data Encryption**: Enkripsi data sensitif
- **Session Management**: Manajemen sesi yang aman

### 📱 **Modern UI/UX**
- **Responsive Design**: Optimal di semua perangkat (mobile, tablet, desktop)
- **Dark/Light Mode**: Tema yang dapat disesuaikan
- **Micro-interactions**: Animasi halus dengan Framer Motion
- **Accessibility**: Desain yang ramah untuk semua pengguna

---

## 🖼️ Demo & Screenshot

<div align="center">

### 🏠 Landing Page
![Landing Page](docs/screenshots/landing.png)

### 🚨 Emergency Dashboard
![Emergency Dashboard](docs/screenshots/emergency.png)

### 📊 Admin Analytics
![Admin Dashboard](docs/screenshots/admin.png)

### 📱 Mobile View
<img src="docs/screenshots/mobile.png" width="300" alt="Mobile View">

</div>

---

## 🛠️ Teknologi

### **Frontend Framework**
- ![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?logo=next.js) **Next.js 15.3.2** - React framework dengan App Router
- ![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react) **React 19** - Library UI terbaru
- ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript) **TypeScript** - Type-safe JavaScript

### **Styling & UI**
- ![Tailwind](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css) **Tailwind CSS 4** - Utility-first CSS framework
- ![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-8B5CF6?logo=radix-ui) **Radix UI** - Unstyled, accessible components
- ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.15.0-FF0055?logo=framer) **Framer Motion** - Animation library

### **Form & Validation**
- ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-7.56.3-EC5990?logo=reacthookform) **React Hook Form** - Performant forms
- ![Zod](https://img.shields.io/badge/Zod-3.24.4-FF6B6B?logo=zod) **Zod** - Schema validation

### **State Management & Utils**
- ![Zustand](https://img.shields.io/badge/Date_fns-4.1.0-770C7C?logo=date-fns) **date-fns** - Date utility library
- ![Lucide](https://img.shields.io/badge/Lucide-0.509.0-F56565?logo=lucide) **Lucide React** - Icon library
- ![Sonner](https://img.shields.io/badge/Sonner-2.0.3-4ADE80) **Sonner** - Toast notifications

### **Development Tools**
- ![ESLint](https://img.shields.io/badge/ESLint-9.x-4B32C3?logo=eslint) **ESLint** - Code linting
- ![PostCSS](https://img.shields.io/badge/PostCSS-4.x-DD3A0A?logo=postcss) **PostCSS** - CSS processing

---

## 🚀 Instalasi

### **Prerequisites**
Pastikan sistem Anda memiliki:
- ![Node.js](https://img.shields.io/badge/Node.js-18.x+-339933?logo=node.js) **Node.js 18.x atau lebih tinggi**
- ![npm](https://img.shields.io/badge/npm-9.x+-CB3837?logo=npm) **npm 9.x atau yarn/pnpm**
- ![Git](https://img.shields.io/badge/Git-Latest-F05032?logo=git) **Git**

### **Langkah Instalasi**

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/sigap-undip.git
   cd sigap-undip
