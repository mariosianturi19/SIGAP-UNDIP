// src/app/api/relawan/panic-reports/today/route.ts (Update)
import { NextRequest, NextResponse } from "next/server";

// GET - Get Today's Panic Reports (Relawan)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Build query string for external API
    let queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('date', today);

    const apiUrl = `https://sigap-api-5hk6r.ondigitalocean.app/api/relawan/today-panic-reports?${queryParams.toString()}`;
    console.log("Fetching today panic reports from:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Get today panic reports response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Get today panic reports error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching today's panic reports" },
      { status: 500 }
    );
  }
}