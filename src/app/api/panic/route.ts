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
    
    // Build query string for external API
    let queryParams = new URLSearchParams();
    queryParams.append('page', page);
    
    if (status) {
      queryParams.append('status', status);
    }
    
    if (date) {
      queryParams.append('date', date);
    }

    const apiUrl = `https://sigap-api-5hk6r.ondigitalocean.app/api/admin/panic?${queryParams.toString()}`;
    console.log("Fetching panic reports from:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Get all panic reports response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse panic reports response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Get panic reports error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching panic reports" },
      { status: 500 }
    );
  }
}