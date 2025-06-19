// src/app/api/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the request body with the refresh token
    const body = await request.json();

    // Forward the request to the external API
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        refresh_token: body.refresh_token,
      }),
    });

    // Get the response as text first (for debugging)
    const responseText = await response.text();
    console.log("External API refresh token response:", responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse refresh token response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Refresh token proxy error:", error);
    return NextResponse.json(
      { message: "An error occurred during token refresh" },
      { status: 500 }
    );
  }
}