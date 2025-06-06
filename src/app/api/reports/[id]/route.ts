// src/app/api/reports/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the access token
    const token = await getAccessToken();
    
    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    
    // Forward the request to the external API
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${params.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get the response as text first (for debugging)
    const responseText = await response.text();
    console.log(`Update report ${params.id} response:`, responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse update report response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the report" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the access token
    const token = await getAccessToken();
    
    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Forward the request to the external API
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${params.id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    // Get the response as text first (for debugging)
    const responseText = await response.text();
    console.log(`Get report ${params.id} response:`, responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse get report response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Get report error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the report" },
      { status: 500 }
    );
  }
}