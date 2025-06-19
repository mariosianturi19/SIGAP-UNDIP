// src/app/api/panic/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET - Get Panic Report by ID
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

    const panicId = id;
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/panic/${panicId}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log(`Get panic ${panicId} response:`, responseText);
    
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
    console.error("Get panic error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching panic report" },
      { status: 500 }
    );
  }
}

// PUT - Update Panic Report Status
export async function PUT(
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
    const panicId = id;

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
      );
    }

    console.log(`Updating panic ${panicId} status:`, body);
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/panic/${panicId}`, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Update panic ${panicId} response:`, responseText);
    
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
    console.error("Update panic error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating panic report" },
      { status: 500 }
    );
  }
}

// DELETE - Delete Panic Report
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

    const panicId = id;
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/panic/${panicId}`, {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log(`Delete panic ${panicId} response:`, responseText);
    
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
    console.error("Delete panic error:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting panic report" },
      { status: 500 }
    );
  }
}