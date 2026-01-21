// src/app/api/admin/shifts/set-day-pattern/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, log, logError } from "@/lib/apiConfig";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.day_of_week || !body.relawan_ids || !Array.isArray(body.relawan_ids)) {
      return NextResponse.json(
        { message: "day_of_week and relawan_ids array are required" },
        { status: 400 }
      );
    }

    log("Setting day pattern:", body);

    const response = await fetch(buildApiUrl("/admin/shifts/set-day-pattern"), {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    log("Set day pattern response status:", response.status);
    log("Set day pattern response body:", responseText.substring(0, 500));

    if (!response.ok) {
      let errorMessage = "Failed to set day pattern";
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
      } else if (response.status === 422) {
        return NextResponse.json(
          { message: "Data tidak valid. Periksa kembali informasi yang diisi." },
          { status: 422 }
        );
      } else if (response.status === 500) {
        return NextResponse.json(
          { 
            message: "Server backend sedang mengalami masalah",
            technical: errorMessage 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logError("Failed to parse response as JSON:", e);
      logError("Response text:", responseText);
      return NextResponse.json(
        { message: "Invalid response from server", details: responseText.substring(0, 200) },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Set day pattern error:", error);
    return NextResponse.json(
      { message: "An error occurred while setting day pattern" },
      { status: 500 }
    );
  }
}