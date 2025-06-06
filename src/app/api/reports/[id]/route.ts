// src/app/api/reports/[id]/route.ts (Update existing file)
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
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

    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
      );
    }

    console.log(`Updating report ${params.id}:`, body);
    
    // Forward the request to the external API
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${params.id}`, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
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
    // Get authorization header from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    // Forward the request to the external API
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${params.id}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
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

// DELETE Report
export async function DELETE(
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

    console.log(`Deleting report ${params.id}`);
    
    // Forward the request to the external API
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${params.id}`, {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    // Get the response as text first (for debugging)
    const responseText = await response.text();
    console.log(`Delete report ${params.id} response:`, responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse delete report response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    // Return the response with the same status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the report" },
      { status: 500 }
    );
  }
}