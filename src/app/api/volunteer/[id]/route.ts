// src/app/api/volunteers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET single volunteer
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

    const volunteerId = params.id;
    // Use the correct API endpoint
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/admin/relawan/${volunteerId}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log(`Volunteer ${volunteerId} details response:`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse volunteer details response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Volunteer details fetch error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching volunteer details" },
      { status: 500 }
    );
  }
}

// PUT update volunteer - Updated to use the correct endpoint
export async function PUT(
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

    const volunteerId = params.id;
    const body = await request.json();

    // Use the CORRECT API endpoint for updating users
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/users/${volunteerId}`, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Update volunteer ${volunteerId} response:`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse update volunteer response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Update volunteer error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating volunteer" },
      { status: 500 }
    );
  }
}

// DELETE volunteer - Already updated to use the correct endpoint
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

    const volunteerId = params.id;
    
    // Use the correct API endpoint for deleting users
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/admin/users/${volunteerId}`, {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log(`Delete volunteer ${volunteerId} response:`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse delete volunteer response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Delete volunteer error:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting volunteer" },
      { status: 500 }
    );
  }
}