// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET - Get User by ID (Admin)
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
    
    const userId = id;
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/admin/users/${userId}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });
    
    const responseText = await response.text();
    console.log(`Get user ${userId} response:`, responseText);
    
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
    console.error("Get user error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete User (Admin)
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
    
    const userId = id;
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });
    
    const responseText = await response.text();
    console.log(`Delete user ${userId} response:`, responseText);
    
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
    console.error("Delete user error:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting user" },
      { status: 500 }
    );
  }
}