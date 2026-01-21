// src/app/api/admin/shifts/weekly-patterns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, log, logError } from "@/lib/apiConfig";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    log("Fetching weekly patterns");

    const response = await fetch(buildApiUrl("/admin/shifts/weekly-patterns"), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    log("Weekly patterns response status:", response.status);
    log("Weekly patterns response body:", responseText.substring(0, 500));

    if (!response.ok) {
      let errorMessage = "Failed to fetch weekly patterns";
      let errorDetails = responseText;
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        logError("Failed to parse error response:", e);
      }
      
      logError("Backend API error:", {
        status: response.status,
        message: errorMessage,
        details: errorDetails
      });
      
      if (response.status === 401) {
        return NextResponse.json(
          { message: "Token autentikasi tidak valid atau telah kadaluarsa" },
          { status: 401 }
        );
      } else if (response.status === 404) {
        // Return empty patterns with proper structure
        return NextResponse.json(
          { 
            success: false,
            weekly_patterns: {
              monday: { day_name: "Senin", relawan_count: 0, relawan: [] },
              tuesday: { day_name: "Selasa", relawan_count: 0, relawan: [] },
              wednesday: { day_name: "Rabu", relawan_count: 0, relawan: [] },
              thursday: { day_name: "Kamis", relawan_count: 0, relawan: [] },
              friday: { day_name: "Jumat", relawan_count: 0, relawan: [] },
              saturday: { day_name: "Sabtu", relawan_count: 0, relawan: [] },
              sunday: { day_name: "Minggu", relawan_count: 0, relawan: [] }
            },
            note: "Tidak ada pola shift"
          },
          { status: 200 }
        );
      } else if (response.status === 500) {
        return NextResponse.json(
          { 
            success: false,
            message: "Server backend sedang mengalami masalah",
            technical: errorMessage,
            weekly_patterns: {
              monday: { day_name: "Senin", relawan_count: 0, relawan: [] },
              tuesday: { day_name: "Selasa", relawan_count: 0, relawan: [] },
              wednesday: { day_name: "Rabu", relawan_count: 0, relawan: [] },
              thursday: { day_name: "Kamis", relawan_count: 0, relawan: [] },
              friday: { day_name: "Jumat", relawan_count: 0, relawan: [] },
              saturday: { day_name: "Sabtu", relawan_count: 0, relawan: [] },
              sunday: { day_name: "Minggu", relawan_count: 0, relawan: [] }
            },
            note: "Data tidak tersedia"
          },
          { status: 200 } // Return 200 with empty data instead of 500
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          message: errorMessage,
          weekly_patterns: {
            monday: { day_name: "Senin", relawan_count: 0, relawan: [] },
            tuesday: { day_name: "Selasa", relawan_count: 0, relawan: [] },
            wednesday: { day_name: "Rabu", relawan_count: 0, relawan: [] },
            thursday: { day_name: "Kamis", relawan_count: 0, relawan: [] },
            friday: { day_name: "Jumat", relawan_count: 0, relawan: [] },
            saturday: { day_name: "Sabtu", relawan_count: 0, relawan: [] },
            sunday: { day_name: "Minggu", relawan_count: 0, relawan: [] }
          },
          note: "Data tidak tersedia"
        },
        { status: 200 } // Return 200 with empty data
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logError("Failed to parse response as JSON:", e);
      logError("Response text:", responseText);
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid response from server",
          weekly_patterns: {
            monday: { day_name: "Senin", relawan_count: 0, relawan: [] },
            tuesday: { day_name: "Selasa", relawan_count: 0, relawan: [] },
            wednesday: { day_name: "Rabu", relawan_count: 0, relawan: [] },
            thursday: { day_name: "Kamis", relawan_count: 0, relawan: [] },
            friday: { day_name: "Jumat", relawan_count: 0, relawan: [] },
            saturday: { day_name: "Sabtu", relawan_count: 0, relawan: [] },
            sunday: { day_name: "Minggu", relawan_count: 0, relawan: [] }
          },
          note: "Data tidak tersedia"
        },
        { status: 200 } // Return 200 with empty data
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Get weekly patterns error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching weekly patterns" },
      { status: 500 }
    );
  }
}