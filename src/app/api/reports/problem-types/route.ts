// src/app/api/reports/problem-types/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET - Get Problem Types
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/problem-types", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Get problem types response:", responseText);
    
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
    console.error("Get problem types error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching problem types" },
      { status: 500 }
    );
  }
}