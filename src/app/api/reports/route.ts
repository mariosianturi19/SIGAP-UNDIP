// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    // Try multiple endpoints for reports
    const endpoints = [
      "https://sigap-api-5hk6r.ondigitalocean.app/api/reports",
      "https://sigap-api-5hk6r.ondigitalocean.app/api/admin/reports"
    ];

    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log("Trying reports endpoint:", endpoint);
        
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Authorization": authHeader,
            "Accept": "application/json",
          },
        });

        const responseText = await response.text();
        console.log(`Reports response from ${endpoint}:`, responseText.substring(0, 500));
        
        // Check if response is HTML (error page)
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          console.log(`Endpoint ${endpoint} returned HTML, trying next...`);
          continue;
        }

        if (response.ok) {
          let data;
          try {
            data = JSON.parse(responseText);
            console.log(`Successfully parsed reports data from ${endpoint}:`, Object.keys(data));
            return NextResponse.json(data, { status: response.status });
          } catch (e) {
            console.error(`Failed to parse reports JSON from ${endpoint}:`, e);
            continue;
          }
        } else {
          console.log(`Reports endpoint ${endpoint} failed with status ${response.status}`);
          lastError = responseText;
        }
      } catch (error) {
        console.log(`Error with reports endpoint ${endpoint}:`, error);
        lastError = error;
      }
    }

    // If all endpoints failed, return empty data
    return NextResponse.json(
      { 
        message: "All reports endpoints failed", 
        details: lastError instanceof Error ? lastError.message : String(lastError),
        data: [] // Return empty array instead of error
      },
      { status: 200 } // Return 200 with empty data instead of error
    );

  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching reports", data: [] },
      { status: 200 } // Return 200 with empty data instead of 500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    // Ambil body request
    const body = await request.json();
    
    // Log body untuk debugging
    console.log("Report data being sent:", body);
    
    // Validasi data
    if (!body.photo_path) {
      return NextResponse.json(
        { message: "Photo path is required" },
        { status: 400 }
      );
    }
    
    if (!body.location) {
      return NextResponse.json(
        { message: "Location is required" },
        { status: 400 }
      );
    }
    
    if (!body.description) {
      return NextResponse.json(
        { message: "Description is required" },
        { status: 400 }
      );
    }
    
    // Kirim ke API eksternal
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/reports", {
      method: "POST",
      headers: {
        "Authorization": authHeader, // Gunakan token dari request
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Ambil response sebagai text untuk debugging
    const responseText = await response.text();
    console.log("External API create report response:", responseText);
    
    // Parse sebagai JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse create report response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    // Kembalikan response dengan status yang sama
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Report creation error:", error);
    return NextResponse.json(
      { message: "An error occurred during report creation" },
      { status: 500 }
    );
  }
}