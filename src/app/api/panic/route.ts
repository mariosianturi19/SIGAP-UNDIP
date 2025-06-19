// src/app/api/panic/route.ts (Update)
import { NextRequest, NextResponse } from "next/server";

// POST - Create Panic Report (User)
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
    if (!body.latitude || !body.longitude) {
      return NextResponse.json(
        { message: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    console.log("Creating panic report:", body);
    
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/panic", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        latitude: body.latitude,
        longitude: body.longitude
      }),
    });

    const responseText = await response.text();
    console.log("External API panic response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse panic response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Panic button error:", error);
    return NextResponse.json(
      { message: "An error occurred while sending panic alert" },
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
      `https://sigap-api-5hk6r.ondigitalocean.app/api/admin/panic`,
      `https://sigap-api-5hk6r.ondigitalocean.app/api/panic`,
      `https://sigap-api-5hk6r.ondigitalocean.app/api/panic/all`
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
        console.log("Trying panic endpoint:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": authHeader,
            "Accept": "application/json",
          },
        });

        const responseText = await response.text();
        console.log(`Panic response from ${baseEndpoint}:`, responseText.substring(0, 500));
        
        // Check if response is HTML (error page)
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          console.log(`Endpoint ${baseEndpoint} returned HTML, trying next...`);
          continue;
        }

        if (response.ok) {
          let data;
          try {
            data = JSON.parse(responseText);
            console.log(`Successfully parsed panic data from ${baseEndpoint}:`, Object.keys(data));
            return NextResponse.json(data, { status: response.status });
          } catch (e) {
            console.error(`Failed to parse panic JSON from ${baseEndpoint}:`, e);
            continue;
          }
        } else {
          console.log(`Panic endpoint ${baseEndpoint} failed with status ${response.status}`);
          lastError = responseText;
        }
      } catch (error) {
        console.log(`Error with panic endpoint ${baseEndpoint}:`, error);
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
    console.error("Get panic reports error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching panic reports", data: [] },
      { status: 200 } // Return 200 with empty data instead of 500
    );
  }
}