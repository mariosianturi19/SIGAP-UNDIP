// src/app/api/volunteers/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET all volunteers
export async function GET(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    // Use the correct API endpoint
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/admin/relawan", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse volunteers response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Volunteer fetch error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching volunteers" },
      { status: 500 }
    );
  }
}

// POST create new volunteer - Updated to use the correct endpoint
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

    const body = await request.json();

    // Use the CORRECT API endpoint for creating volunteers
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/admin/register-relawan", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log("Create volunteer response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse create volunteer response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Create volunteer error:", error);
    return NextResponse.json(
      { message: "An error occurred while creating volunteer" },
      { status: 500 }
    );
  }
}