// src/app/api/relawan/panic-reports/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET - Get All Panic Reports for Relawan
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
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    
    if (status) {
      queryParams.append('status', status);
    }
    
    if (date) {
      queryParams.append('date', date);
    }

    const apiUrl = `https://sigap-api-5hk6r.ondigitalocean.app/api/panic/today?${queryParams.toString()}`;
    console.log("Fetching relawan panic reports from:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Get relawan panic reports response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse relawan panic reports response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Get relawan panic reports error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching panic reports" },
      { status: 500 }
    );
  }
}