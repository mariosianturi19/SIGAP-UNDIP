// src/app/api/volunteer/panic-alerts/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET - Mendapatkan panic alerts untuk volunteer
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    
    let queryParams = new URLSearchParams();
    queryParams.append('page', page);
    
    if (status) {
      queryParams.append('status', status);
    }
    
    if (date) {
      queryParams.append('date', date);
    }

    // Menggunakan endpoint panic untuk volunteer
    const apiUrl = `https://sigap-api-5hk6r.ondigitalocean.app/api/relawan/today-panic-reports?${queryParams.toString()}`;
    console.log("Fetching panic alerts for volunteer from:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Volunteer panic alerts response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse panic alerts response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Volunteer panic alerts error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching panic alerts" },
      { status: 500 }
    );
  }
}