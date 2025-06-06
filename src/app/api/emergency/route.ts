// src/app/api/emergency/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.latitude || !body.longitude) {
      return NextResponse.json(
        { message: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log("Panic button data:", body);
    
    // Forward the request to the external API using /panic endpoint
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

    // Get the response as text first (for debugging)
    const responseText = await response.text();
    console.log("External API panic response:", responseText);
    
    // Try to parse as JSON
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

    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Panic button error:", error);
    return NextResponse.json(
      { message: "An error occurred while sending panic alert" },
      { status: 500 }
    );
  }
}