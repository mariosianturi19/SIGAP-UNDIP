// src/app/api/admin/shifts/set-day-pattern/route.ts
import { NextRequest, NextResponse } from "next/server";

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
    if (!body.day_of_week || !body.relawan_ids || !Array.isArray(body.relawan_ids)) {
      return NextResponse.json(
        { message: "day_of_week and relawan_ids array are required" },
        { status: 400 }
      );
    }

    console.log("Setting day pattern:", body);
    
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/admin/shifts/set-day-pattern", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log("Set day pattern response:", responseText);
    
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
    console.error("Set day pattern error:", error);
    return NextResponse.json(
      { message: "An error occurred while setting day pattern" },
      { status: 500 }
    );
  }
}