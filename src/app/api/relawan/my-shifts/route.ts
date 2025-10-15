// src/app/api/relawan/my-shifts/route.ts
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

    // Get query parameters for week navigation
    const { searchParams } = new URL(request.url);
    const weekOffset = searchParams.get('week_offset') || '0';
    
    const queryParams = new URLSearchParams();
    if (weekOffset !== '0') {
      queryParams.append('week_offset', weekOffset);
    }

    const apiUrl = buildApiUrl(`/relawan/my-shifts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    log("Fetching my shifts from:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    log("Get my shifts response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logError("Failed to parse response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Get my shifts error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching shifts" },
      { status: 500 }
    );
  }
}