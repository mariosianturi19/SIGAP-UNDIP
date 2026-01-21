// src/app/api/panic/route.ts (Update)
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, log, logError } from "@/lib/apiConfig";

// POST - Create Panic Report (User)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      log("Missing authorization header");
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.latitude || !body.longitude) {
      log("Missing latitude or longitude");
      return NextResponse.json(
        { message: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    log("Creating panic report:", { latitude: body.latitude, longitude: body.longitude });

    const apiUrl = buildApiUrl("/panic");
    log("Sending panic alert to:", apiUrl);

    // Convert latitude and longitude to proper types (float/double)
    const requestBody = {
      latitude: parseFloat(body.latitude),
      longitude: parseFloat(body.longitude),
    };
    
    log("Request body:", JSON.stringify(requestBody));
    log("Authorization header (first 30 chars):", authHeader.substring(0, 30) + "...");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    log("External API panic response status:", response.status);
    log("External API panic response body:", responseText.substring(0, 500));

    if (!response.ok) {
      let errorMessage = "Failed to send panic alert";
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
      
      // Berikan pesan yang lebih spesifik berdasarkan status code
      if (response.status === 401) {
        return NextResponse.json(
          { message: "Token autentikasi tidak valid atau telah kadaluarsa" },
          { status: 401 }
        );
      } else if (response.status === 500) {
        return NextResponse.json(
          { 
            message: "Server backend sedang mengalami masalah. Silakan coba lagi dalam beberapa saat.",
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
      logError("Failed to parse panic response as JSON:", e);
      logError("Response text:", responseText);
      return NextResponse.json(
        { message: "Invalid response from server", details: responseText.substring(0, 200) },
        { status: 500 }
      );
    }

    log("Panic alert created successfully:", data);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Panic button error:", error);
    return NextResponse.json(
      { 
        message: "An error occurred while sending panic alert",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET - Get All Panic Reports (Admin) with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    // Get query parameters from URL
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    
    // Try multiple endpoints for panic alerts
    const endpoints = [
      buildApiUrl("/admin/panic"),
      buildApiUrl("/panic"),
      buildApiUrl("/panic/all")
    ];

    let lastError = null;
    
    for (const baseEndpoint of endpoints) {
      try {
        // Build query string for external API
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        
        if (status) {
          queryParams.append('status', status);
        }
        
        if (date) {
          queryParams.append('date', date);
        }

        const apiUrl = `${baseEndpoint}?${queryParams.toString()}`;
        log("Trying panic endpoint:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": authHeader,
            "Accept": "application/json",
          },
        });

        const responseText = await response.text();
        log(`Panic response from ${baseEndpoint}:`, responseText.substring(0, 500));

        // Check if response is HTML (error page)
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          log(`Endpoint ${baseEndpoint} returned HTML, trying next...`);
          continue;
        }

        if (response.ok) {
          let data;
          try {
            data = JSON.parse(responseText);
            log(`Successfully parsed panic data from ${baseEndpoint}:`, Object.keys(data));
            return NextResponse.json(data, { status: response.status });
          } catch (e) {
            logError(`Failed to parse panic JSON from ${baseEndpoint}:`, e);
            continue;
          }
        } else {
          log(`Panic endpoint ${baseEndpoint} failed with status ${response.status}`);
          lastError = responseText;
        }
      } catch (error) {
        log(`Error with panic endpoint ${baseEndpoint}:`, error);
        lastError = error;
      }
    }

    // If all endpoints failed, return empty data
    return NextResponse.json(
      { 
        message: "All panic endpoints failed", 
        details: lastError instanceof Error ? lastError.message : String(lastError),
        data: [] // Return empty array instead of error
      },
      { status: 200 } // Return 200 with empty data instead of error
    );

  } catch (error) {
    logError("Get panic reports error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching panic reports", data: [] },
      { status: 200 } // Return 200 with empty data instead of 500
    );
  }
}