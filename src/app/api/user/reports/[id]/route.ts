// src/app/api/user/reports/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const reportId = params.id;
    console.log("Fetching report detail for ID:", reportId);

    // Forward the request to the external API
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${reportId}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    // Get the response as text first (for debugging)
    const responseText = await response.text();
    console.log(`External API report ${reportId} response:`, responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse report response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Report detail fetch error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching report details" },
      { status: 500 }
    );
  }
}