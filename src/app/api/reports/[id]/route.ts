// src/app/api/reports/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET Report by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params karena sekarang berupa Promise
    const { id } = await params;
    
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    console.log(`Fetching report ${id}`);
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${id}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log(`Get report ${id} response:`, responseText);
    
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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Get report error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the report" },
      { status: 500 }
    );
  }
}

// PATCH Report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params karena sekarang berupa Promise
    const { id } = await params;
    
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!body.status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
      );
    }

    console.log(`Updating report ${id}:`, body);
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Update report ${id} response:`, responseText);
    
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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the report" },
      { status: 500 }
    );
  }
}

// DELETE Report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params karena sekarang berupa Promise
    const { id } = await params;
    
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    console.log(`Deleting report ${id}`);
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/reports/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log(`Delete report ${id} response:`, responseText);
    
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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the report" },
      { status: 500 }
    );
  }
}