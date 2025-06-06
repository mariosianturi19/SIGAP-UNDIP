// src/app/api/volunteer/reports/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET - Mendapatkan semua laporan untuk volunteer
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
    
    let queryParams = new URLSearchParams();
    queryParams.append('page', page);
    
    if (status) {
      queryParams.append('status', status);
    }

    const apiUrl = `https://sigap-api-5hk6r.ondigitalocean.app/api/reports?${queryParams.toString()}`;
    console.log("Fetching reports for volunteer from:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Volunteer reports response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse reports response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Volunteer reports error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching reports" },
      { status: 500 }
    );
  }
}  