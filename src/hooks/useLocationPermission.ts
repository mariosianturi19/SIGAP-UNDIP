// src/hooks/useLocationPermission.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface UseLocationPermissionReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationData | null>;
  debugInfo: any;
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Use ref to prevent infinite loops and multiple requests
  const isRequestingRef = useRef(false);
  const hasCheckedInitialPermissionRef = useRef(false);

  // Check if geolocation is supported
  const isGeolocationSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  // Enhanced error handling function
  const handleGeolocationError = useCallback((error: any): string => {
    console.log("Raw geolocation error object:", error);
    console.log("Error properties:", {
      code: error?.code,
      message: error?.message,
      type: typeof error,
      keys: Object.keys(error || {}),
    });

    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      lastError: {
        code: error?.code,
        message: error?.message,
        timestamp: new Date().toISOString(),
        errorObject: error,
      }
    }));

    if (!error) {
      return "Error tidak diketahui saat mengakses lokasi";
    }

    // Handle different error types
    if (typeof error === 'object' && error.code !== undefined) {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          setHasPermission(false);
          return "Akses lokasi ditolak. Klik ikon lokasi di browser dan pilih 'Izinkan', lalu refresh halaman.";
        case 2: // POSITION_UNAVAILABLE
          return "Lokasi tidak tersedia. Pastikan GPS aktif dan Anda berada di area dengan sinyal yang baik.";
        case 3: // TIMEOUT
          return "Waktu habis saat mengakses lokasi. Coba lagi.";
        default:
          return `Error geolocation dengan kode ${error.code}: ${error.message || 'Tidak diketahui'}`;
      }
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Handle other error types
    if (error instanceof Error) {
      return error.message;
    }

    return "Terjadi kesalahan yang tidak diketahui saat mengakses lokasi";
  }, []);

  // Check current permission status
  const checkPermissionStatus = useCallback(async (): Promise<boolean> => {
    if (!isGeolocationSupported) {
      console.log("Geolocation not supported");
      setDebugInfo(prev => ({ ...prev, geolocationSupported: false }));
      return false;
    }

    setDebugInfo(prev => ({ ...prev, geolocationSupported: true }));

    // Prevent multiple checks
    if (hasCheckedInitialPermissionRef.current) {
      return hasPermission;
    }

    hasCheckedInitialPermissionRef.current = true;

    try {
      // Check if permissions API is available
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          const granted = permission.state === 'granted';
          setHasPermission(granted);
          
          setDebugInfo(prev => ({
            ...prev,
            permissionsAPI: true,
            permissionState: permission.state,
          }));
          
          console.log("Permission status:", permission.state);
          
          // If permission is granted, try to get stored location
          if (granted) {
            const storedLocation = localStorage.getItem("user_location");
            if (storedLocation) {
              try {
                const parsedLocation = JSON.parse(storedLocation);
                setLocation(parsedLocation);
                console.log("Loaded stored location:", parsedLocation);
              } catch (error) {
                console.error("Error parsing stored location:", error);
                localStorage.removeItem("user_location");
              }
            }
          }
          
          return granted;
        } catch (permError) {
          console.error("Error querying permissions:", permError);
          setDebugInfo(prev => ({
            ...prev,
            permissionsAPI: true,
            permissionError: permError,
          }));
        }
      } else {
        // Fallback for browsers without permissions API
        console.log("Permissions API not available");
        setDebugInfo(prev => ({ ...prev, permissionsAPI: false }));
      }
      
      return false;
    } catch (error) {
      console.error("Error checking geolocation permission:", error);
      setDebugInfo(prev => ({
        ...prev,
        checkPermissionError: error,
      }));
      return false;
    }
  }, [isGeolocationSupported, hasPermission]);

  // Request location permission and get current location
  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log("🔍 Requesting location permission...");
    
    if (!isGeolocationSupported) {
      const errorMsg = "Browser Anda tidak mendukung layanan lokasi";
      setError(errorMsg);
      console.error(errorMsg);
      return false;
    }

    if (isRequestingRef.current) {
      console.log("⏳ Already requesting permission, skipping...");
      return hasPermission;
    }

    isRequestingRef.current = true;
    setIsLoading(true);
    setError(null);

    // Add timeout wrapper
    const requestWithTimeout = (timeout: number = 15000): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.error("⏰ Geolocation request timed out");
          setIsLoading(false);
          setError("Waktu habis saat meminta izin lokasi. Coba refresh halaman dan coba lagi.");
          isRequestingRef.current = false;
          resolve(false);
        }, timeout);

        console.log("📍 Making geolocation request with timeout:", timeout);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            console.log("✅ Location permission granted and position obtained:", position);
            
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            
            setLocation(locationData);
            setHasPermission(true);
            setIsLoading(false);
            setError(null);
            isRequestingRef.current = false;
            
            // Store location in localStorage for persistence
            localStorage.setItem("user_location", JSON.stringify(locationData));
            
            setDebugInfo(prev => ({
              ...prev,
              lastSuccessfulLocation: {
                ...locationData,
                timestamp: new Date().toISOString(),
              }
            }));
            
            console.log("📍 Location obtained successfully:", {
              ...locationData,
              accuracy: locationData.accuracy ? `±${Math.round(locationData.accuracy)}m` : 'unknown'
            });
            
            resolve(true);
          },
          (error) => {
            clearTimeout(timeoutId);
            console.error("❌ Geolocation error details:");
            console.error("- Error object:", error);
            console.error("- Error code:", error?.code);
            console.error("- Error message:", error?.message);
            console.error("- Error type:", typeof error);
            console.error("- Error constructor:", error?.constructor?.name);
            
            setIsLoading(false);
            isRequestingRef.current = false;
            
            const errorMessage = handleGeolocationError(error);
            setError(errorMessage);
            
            // Return false only for permission denied, true for other errors to allow retry
            resolve(error?.code !== 1); // 1 is PERMISSION_DENIED
          },
          {
            enableHighAccuracy: true,
            timeout: timeout - 1000, // Give 1 second buffer
            maximumAge: 60000
          }
        );
      });
    };

    const result = await requestWithTimeout(15000);
    return result;
  }, [isGeolocationSupported, hasPermission, handleGeolocationError]);

  // Get current location (for real-time updates)
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    console.log("🔄 Getting current location...");
    
    if (!isGeolocationSupported) {
      console.log("❌ Geolocation not supported, returning cached location");
      return location;
    }

    if (!hasPermission) {
      console.log("🔐 No permission, attempting to request permission first...");
      const granted = await requestPermission();
      if (!granted) {
        console.log("❌ Permission not granted, returning cached location");
        return location;
      }
    }

    return new Promise<LocationData | null>((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log("⏰ getCurrentLocation timed out, using cached location");
        resolve(location);
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          
          console.log("✅ Fresh location obtained:", {
            ...locationData,
            accuracy: locationData.accuracy ? `±${Math.round(locationData.accuracy)}m` : 'unknown'
          });
          
          setLocation(locationData);
          setError(null);
          
          // Update stored location
          localStorage.setItem("user_location", JSON.stringify(locationData));
          
          resolve(locationData);
        },
        (geolocationError) => {
          clearTimeout(timeoutId);
          console.error("❌ Error getting current location:", geolocationError);
          
          const errorMessage = handleGeolocationError(geolocationError);
          
          // If we have cached location, use it
          if (location) {
            console.log("🔄 Using cached location due to error:", location);
            resolve(location);
          } else {
            setError(errorMessage);
            resolve(null);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000
        }
      );
    });
  }, [isGeolocationSupported, hasPermission, location, requestPermission, handleGeolocationError]);

  // Check permission status on mount only
  useEffect(() => {
    const initializeLocation = async () => {
      console.log("🚀 Initializing location permission check...");
      
      // Collect browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        language: navigator.language,
        isHTTPS: window.location.protocol === 'https:',
        hostname: window.location.hostname,
        timestamp: new Date().toISOString(),
      };
      
      setDebugInfo(prev => ({ ...prev, browserInfo }));
      console.log("🔍 Browser info:", browserInfo);
      
      await checkPermissionStatus();
    };
    
    if (typeof window !== 'undefined') {
      initializeLocation();
    }
  }, [checkPermissionStatus]);

  // Debug effect
  useEffect(() => {
    console.log("📊 Location state updated:", {
      hasPermission,
      location: location ? `${location.latitude}, ${location.longitude}` : null,
      error,
      isLoading,
      isGeolocationSupported
    });
  }, [hasPermission, location, error, isLoading, isGeolocationSupported]);

  return {
    location,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    getCurrentLocation,
    debugInfo,
  };
}