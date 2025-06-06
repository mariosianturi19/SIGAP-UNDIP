// src/app/api/panic/today/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET - Get Today's Panic Reports
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    console.log("Fetching today's panic reports from external API...");

    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/panic/today", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Today panic reports response status:", response.status);
    console.log("Today panic reports response body:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse today panic reports response as JSON:", e);
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